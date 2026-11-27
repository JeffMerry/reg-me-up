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
    const instructorIds = [instructorId, instructor2Id];
    const userIds = [organizerId, instructorId, instructor2Id];
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

test('owner assigns, replaces and removes an Instructor from the persisted event', async ({ page }) => {
  await login(page, `${organizerId}@f09.test`);
  await expect(page).toHaveURL('/organizer/events');
  const row = page.getByRole('row').filter({ hasText: 'Instructor workshop' });
  await row.getByRole('link', { name: 'Manage Instructor', exact: true }).click();
  await expect(page).toHaveURL(`/organizer/events/${eventId}/instructor`);
  await expect(page.getByRole('heading', { name: 'Manage Instructor' })).toBeVisible();
  await expect(page.getByText('Current Instructor: None assigned', { exact: true })).toBeVisible();

  await page.getByLabel('Choose an Instructor').selectOption(instructorId);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Save Instructor' }).click();
  await expect(page.getByText('Assignment saved.', { exact: true })).toBeVisible();
  await expect(page.getByText(`Current Instructor: ${instructorName}`, { exact: true })).toBeVisible();
  let rows = await database(db => db.query('SELECT instructor_id,ended_at FROM instructor_assignments WHERE event_id=$1::uuid ORDER BY assigned_at,id', [eventId]));
  expect(rows.rows).toEqual([{ instructor_id: instructorId, ended_at: null }]);

  await page.reload();
  await expect(page.getByText(`Current Instructor: ${instructorName}`, { exact: true })).toBeVisible();
  await page.getByLabel('Choose an Instructor').selectOption(instructor2Id);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Save Instructor' }).click();
  await expect(page.getByText('Assignment saved.', { exact: true })).toBeVisible();
  await expect(page.getByText(`Current Instructor: ${instructor2Name}`, { exact: true })).toBeVisible();
  rows = await database(db => db.query('SELECT instructor_id,ended_at FROM instructor_assignments WHERE event_id=$1::uuid ORDER BY assigned_at,id', [eventId]));
  expect(rows.rows).toHaveLength(2);
  expect(rows.rows[0]).toMatchObject({ instructor_id: instructorId });
  expect(rows.rows[0].ended_at).not.toBeNull();
  expect(rows.rows[1]).toEqual({ instructor_id: instructor2Id, ended_at: null });

  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Remove Instructor' }).click();
  await expect(page.getByText('Instructor removed.', { exact: true })).toBeVisible();
  rows = await database(db => db.query('SELECT instructor_id,ended_at FROM instructor_assignments WHERE event_id=$1::uuid ORDER BY assigned_at,id', [eventId]));
  expect(rows.rows).toHaveLength(2);
  expect(rows.rows.every(row => row.ended_at !== null)).toBe(true);
  await page.screenshot({ path: 'docs/evidence/e2e/22-f09-owner-assignment-history.png', fullPage: true });
});

test('Instructor signs in to current teaching events and reads only the teaching DTO', async ({ page }) => {
  await database(db => db.query('INSERT INTO instructor_assignments(id,event_id,instructor_id,assigned_at) VALUES($1,$2,$3,$4)', [randomUUID(), eventId, instructorId, new Date('2029-01-01T00:00:00Z')]));
  await login(page, `${instructorId}@f09.test`);
  await expect(page).toHaveURL('/my-teaching');
  await expect(page.getByRole('link', { name: 'My Teaching' })).toBeVisible();
  await page.getByRole('link', { name: 'Instructor workshop' }).click();
  await expect(page).toHaveURL(`/my-teaching/${eventId}`);
  await expect(page.getByRole('heading', { name: 'Instructor workshop' })).toBeVisible();
  await expect(page.getByText('Teaching notes for the assigned Instructor.')).toBeVisible();
  await expect(page.getByText('View registrations')).toHaveCount(0);
  await expect(page.getByText('Edit event')).toHaveCount(0);
  const response = await page.request.get(`/api/me/teaching-events/${eventId}`);
  const json = await response.json();
  expect(response.status()).toBe(200);
  for (const field of ['email', 'passwordHash', 'version', 'organizerId', 'registrations', 'instructorAssignments']) expect(json.data).not.toHaveProperty(field);
  await page.screenshot({ path: 'docs/evidence/e2e/23-f09-instructor-teaching-detail.png', fullPage: true });
});

for (const width of [320, 390, 1440]) test(`Instructor views work by keyboard without horizontal overflow at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await database(db => db.query('INSERT INTO instructor_assignments(id,event_id,instructor_id,assigned_at) VALUES($1,$2,$3,$4)', [randomUUID(), eventId, instructorId, new Date('2029-01-01T00:00:00Z')]));
  await login(page, `${instructorId}@f09.test`);
  await expect(page).toHaveURL('/my-teaching');
  await page.getByRole('link', { name: 'Instructor workshop' }).focus();
  await expect(page.getByRole('link', { name: 'Instructor workshop' })).toBeFocused();
  await expect(page.locator('html')).toHaveJSProperty('scrollWidth', width);
  await page.screenshot({ path: `docs/evidence/e2e/${width === 320 ? '19' : width === 390 ? '20' : '21'}-f09-instructor-${width}.png`, fullPage: true });
});
