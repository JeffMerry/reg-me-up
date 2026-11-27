import { expect, test, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import pg from 'pg';
import { verifyTestDatabase } from '../server/src/test-db-safety.js';

const testPassword = 'f09-e2e-local-test-password';
let organizerId: string;
let instructorId: string;
let instructor2Id: string;
let eventId: string;
let instructorName: string;
let instructor2Name: string;
let extraInstructorIds: string[] = [];

async function database<T>(operation: (client: pg.Client) => Promise<T>): Promise<T> {
  if (process.env.NODE_ENV !== 'test' || !process.env.TEST_DATABASE_URL || !process.env.E2E_APP_DATABASE_URL || process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL) {
    throw new Error('Use only the separate guarded test database');
  }
  const app = new pg.Client({ connectionString: process.env.E2E_APP_DATABASE_URL });
  const testDb = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    await app.connect();
    await testDb.connect();
    await verifyTestDatabase(app, testDb);
    return await operation(testDb);
  } finally {
    await Promise.allSettled([app.end(), testDb.end()]);
  }
}

test.beforeEach(async () => {
  extraInstructorIds = [];
  organizerId = randomUUID();
  instructorId = randomUUID();
  instructor2Id = randomUUID();
  eventId = randomUUID();
  instructorName = `F09 Instructor One ${instructorId.slice(0, 8)}`;
  instructor2Name = `F09 Instructor Two ${instructor2Id.slice(0, 8)}`;

  const passwordHashes = await Promise.all([
    argon2.hash(testPassword, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 }),
    argon2.hash(testPassword, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 }),
    argon2.hash(testPassword, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 }),
  ]);

  await database(async db => {
    await db.query(
      'INSERT INTO users(id,email,password_hash,display_name,role) VALUES($1,$2,$3,$4,$5),($6,$7,$8,$9,$10),($11,$12,$13,$14,$15)',
      [
        organizerId, `${organizerId}@f09.test`, passwordHashes[0], 'F09 Test Organizer', 'ORGANIZER',
        instructorId, `${instructorId}@f09.test`, passwordHashes[1], instructorName, 'INSTRUCTOR',
        instructor2Id, `${instructor2Id}@f09.test`, passwordHashes[2], instructor2Name, 'INSTRUCTOR',
      ],
    );
    await db.query(
      `INSERT INTO events(id,organizer_id,title,starts_at,ends_at,location,capacity,publication_status,description)
       VALUES($1,$2,'Instructor workshop','2030-01-15T02:00:00Z','2030-01-15T03:00:00Z','Test lab',24,'PUBLISHED','Teaching notes for the assigned Instructor.')`,
      [eventId, organizerId],
    );
  });
});

test.afterEach(async () => {
  await database(async db => {
    const instructorIds = [instructorId, instructor2Id, ...extraInstructorIds];
    const userIds = [organizerId, instructorId, instructor2Id, ...extraInstructorIds];
    await db.query('DELETE FROM instructor_assignments WHERE event_id=$1::uuid OR instructor_id = ANY($2::uuid[])', [eventId, instructorIds]);
    await db.query('DELETE FROM registrations WHERE event_id=$1::uuid', [eventId]);
    await db.query('DELETE FROM events WHERE id=$1::uuid AND organizer_id=$2::uuid', [eventId, organizerId]);
    await db.query("DELETE FROM sessions WHERE sess->>'userId' = ANY($1::text[])", [userIds]);
    await db.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [userIds]);
  });
});

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(testPassword);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
}

async function ownerLogin(page: Page) { await login(page, `${organizerId}@f09.test`); await expect(page).toHaveURL('/organizer/events'); }
async function openOwner(page: Page) {
  await ownerLogin(page); await page.goto(`/organizer/events/${eventId}/instructor`);
  await expect(page.getByText('Current Instructor: None assigned', { exact: true })).toBeVisible();
}
async function save(page: Page) {
  await page.getByLabel('Choose an Instructor').selectOption(instructorId);
  page.once('dialog', dialog => dialog.accept()); await page.getByRole('button', { name: 'Save Instructor', exact: true }).click();
}
const routePath = () => `**/api/organizer/events/${eventId}/instructor`;

test('S2-G04 distinguishes owner read error from missing event and retries a real read', async ({ page }) => {
  await ownerLogin(page); const path = `**/api/organizer/events/${eventId}`;
  await page.route(path, route => route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR' } } }));
  await page.goto(`/organizer/events/${eventId}/instructor`);
  await expect(page.getByRole('alert')).toContainText('Unable to load'); await expect(page.getByLabel('Choose an Instructor')).toHaveCount(0);
  await page.unroute(path); await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByText('Current Instructor: None assigned', { exact: true })).toBeVisible();
  await page.route(path, route => route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND' } } }));
  await page.reload(); await expect(page.getByRole('alert')).toHaveText('Event not found.'); await expect(page.getByLabel('Choose an Instructor')).toHaveCount(0);
});

test('S2-G04 teaching empty/error/retry and unassigned detail are distinct', async ({ page }) => {
  await login(page, `${instructor2Id}@f09.test`); await expect(page).toHaveURL('/my-teaching');
  await expect(page.getByText('You have no assigned teaching events.', { exact: true })).toBeVisible();
  await page.route('**/api/me/teaching-events?*', route => route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR' } } }));
  await page.reload(); await expect(page.getByRole('alert')).toContainText('Unable to load teaching events'); await expect(page.getByText('You have no assigned teaching events.')).toHaveCount(0);
  await page.unroute('**/api/me/teaching-events?*'); await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByText('You have no assigned teaching events.', { exact: true })).toBeVisible();
  await page.goto(`/my-teaching/${eventId}`); await expect(page.getByRole('alert')).toHaveText('Teaching event not found.'); await expect(page.getByRole('heading', { name: 'Instructor workshop' })).toHaveCount(0);
});

test('S2-G04 stale version preserves current assignment and requires explicit reload', async ({ page }) => {
  await openOwner(page);
  await database(async db => {
    await db.query('INSERT INTO instructor_assignments(id,event_id,instructor_id,assigned_at) VALUES($1,$2,$3,$4)', [randomUUID(), eventId, instructor2Id, new Date('2025-01-01T00:00:00Z')]);
    await db.query('UPDATE events SET version=version+1 WHERE id=$1::uuid', [eventId]);
  });
  await save(page); await expect(page.getByRole('alert')).toContainText('This event changed.'); await expect(page.getByRole('button', { name: 'Save Instructor', exact: true })).toBeDisabled();
  await expect(page.getByText('Assignment saved.', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Reload event', exact: true }).click();
  await expect(page.getByText(`Current Instructor: ${instructor2Name}`, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save Instructor', exact: true })).toBeEnabled();
  const rows = await database(db => db.query('SELECT instructor_id,ended_at FROM instructor_assignments WHERE event_id=$1::uuid', [eventId])); expect(rows.rows).toEqual([{ instructor_id: instructor2Id, ended_at: null }]);
});

for (const code of ['INSTRUCTOR_UNAVAILABLE', 'EVENT_STARTED']) test(`S2-G04 shows ${code} without fake success and blocks retry until reload`, async ({ page }) => {
  await openOwner(page);
  await page.route(routePath(), route => route.fulfill({ status: 409, json: { error: { code } } }));
  await save(page); await expect(page.getByRole('alert')).toContainText(code === 'EVENT_STARTED' ? 'This event has started' : 'This Instructor is unavailable');
  await expect(page.getByRole('button', { name: 'Save Instructor', exact: true })).toBeDisabled(); await expect(page.getByText('Assignment saved.', { exact: true })).toHaveCount(0);
  expect((await database(db => db.query('SELECT count(*)::int AS n FROM instructor_assignments WHERE event_id=$1::uuid', [eventId]))).rows[0].n).toBe(0);
});

test('S2-G04 lost committed response requires a successful explicit status read and never auto-retries PUT', async ({ page }) => {
  await openOwner(page); let count = 0;
  await page.route(routePath(), async route => { count++; const result = await route.fetch(); expect(result.status()).toBe(200); await route.abort('failed'); });
  await save(page); await expect(page.getByRole('alert')).toContainText('We could not confirm');
  await expect(page.getByRole('button', { name: 'Save Instructor', exact: true })).toBeDisabled(); await expect(page.getByText('Assignment saved.', { exact: true })).toHaveCount(0); expect(count).toBe(1);
  const path = `**/api/organizer/events/${eventId}`;
  await page.route(path, route => route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR' } } }));
  await page.getByRole('button', { name: 'Reload event', exact: true }).click(); await expect(page.getByRole('alert')).toContainText('Unable to load'); await expect(page.getByRole('button', { name: 'Save Instructor' })).toHaveCount(0);
  await page.unroute(path); await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByText(`Current Instructor: ${instructorName}`, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save Instructor', exact: true })).toBeEnabled(); expect(count).toBe(1);
  expect((await database(db => db.query('SELECT count(*)::int AS n FROM instructor_assignments WHERE event_id=$1::uuid', [eventId]))).rows[0].n).toBe(1);
});

test('S2-G04 blocks directory pagination while assignment is pending', async ({ page }) => {
  extraInstructorIds = Array.from({ length: 21 }, () => randomUUID());
  await database(async db => {
    const hash = (await db.query('SELECT password_hash FROM users WHERE id=$1::uuid', [instructorId])).rows[0].password_hash;
    await db.query(`INSERT INTO users(id,email,password_hash,display_name,role) SELECT id,id::text||'@acceptance.test',$2,'ZZ Acceptance '||id::text,'INSTRUCTOR' FROM unnest($1::uuid[]) AS id`, [extraInstructorIds, hash]);
  });
  await openOwner(page); let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; }); let count = 0;
  await page.route(routePath(), async route => { count++; const result = await route.fetch(); await gate; await route.fulfill({ response: result }); });
  try {
    await save(page); await expect.poll(() => count).toBe(1);
    await expect(page.getByRole('button', { name: 'Saving…', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Next Instructors', exact: true })).toBeDisabled();
    await expect(page.getByLabel('Choose an Instructor')).toBeDisabled(); expect(count).toBe(1);
  } finally { release(); }
  await expect(page.getByText('Assignment saved.', { exact: true })).toBeVisible(); expect(count).toBe(1);
});

test('S2-G04 current mutation expiry clears private data and restores the protected return path', async ({ page }) => {
  await openOwner(page); await page.route(routePath(), route => route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED' } } }));
  await save(page); await expect(page).toHaveURL(`/login?returnTo=${encodeURIComponent(`/organizer/events/${eventId}/instructor`)}`);
  await expect(page.getByText('Instructor workshop', { exact: true })).toHaveCount(0); await expect(page.getByLabel('Choose an Instructor')).toHaveCount(0);
});

test('S2-G04 ignores a delayed expired mutation after logout rather than redirecting a disposed view', async ({ page }) => {
  await openOwner(page); let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; }); let count = 0;
  await page.route(routePath(), async route => { count++; await gate; await route.continue(); });
  const response = page.waitForResponse(r => new URL(r.url()).pathname.endsWith('/instructor') && r.request().method() === 'PUT');
  try {
    await save(page); await expect.poll(() => count).toBe(1);
    await page.getByRole('button', { name: 'Log out', exact: true }).click(); await expect(page).toHaveURL('/events');
  } finally { release(); }
  expect((await response).status()).toBe(401); await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL('/events'); await expect(page.getByLabel('Choose an Instructor')).toHaveCount(0);
});

for (const status of [403,404]) test(`S2-G04 discards private owner state after mutation returns ${status}`, async ({ page }) => {
  await openOwner(page); await page.route(routePath(), route => route.fulfill({ status, json: { error: { code: status === 403 ? 'FORBIDDEN' : 'NOT_FOUND' } } }));
  await save(page); await expect(page.getByRole('alert')).toHaveText('Event not found.');
  await expect(page.getByRole('heading', { name: 'Instructor workshop', exact: true })).toHaveCount(0); await expect(page.getByLabel('Choose an Instructor')).toHaveCount(0);
});

