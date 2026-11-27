import { expect, test, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import argon2 from 'argon2';
import pg from 'pg';
import { verifyTestDatabase } from '../server/src/test-db-safety.js';

const password = 'synthetic-checkin-browser-password';
let owner: string, participant: string, eventId: string, registrationId: string, extra: string[];
async function database<T>(operation: (client: pg.Client) => Promise<T>): Promise<T> {
  if (process.env.NODE_ENV !== 'test' || !process.env.TEST_DATABASE_URL || !process.env.E2E_APP_DATABASE_URL || process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL) throw new Error('Separate guarded test DB required');
  const app = new pg.Client({ connectionString: process.env.E2E_APP_DATABASE_URL }), db = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  try { await app.connect(); await db.connect(); await verifyTestDatabase(app, db); return await operation(db); }
  finally { await Promise.allSettled([app.end(), db.end()]); }
}
test.beforeEach(async () => {
  owner = randomUUID(); participant = randomUUID(); eventId = randomUUID(); registrationId = randomUUID(); extra = [];
  const hash = await argon2.hash(password);
  await database(async db => {
    await db.query(`INSERT INTO users(id,email,password_hash,display_name,role) VALUES($1::uuid,$1::text||'@f07.test',$3,'Check-in Owner','ORGANIZER'),($2::uuid,$2::text||'@f07.test',$3,'Check-in Student','PARTICIPANT')`, [owner, participant, hash]);
    await db.query(`INSERT INTO events(id,organizer_id,title,starts_at,ends_at,location,capacity,publication_status) VALUES($1,$2,'Attendance workshop',now()-interval '1 hour',now()+interval '1 hour','Test lab',60,'PUBLISHED')`, [eventId, owner]);
    await db.query(`INSERT INTO registrations(id,event_id,participant_id,status,registered_at) VALUES($1,$2,$3,'ACTIVE',now()-interval '2 hours')`, [registrationId, eventId, participant]);
  });
});
test.afterEach(async () => {
  await database(async db => {
    await db.query('DELETE FROM attendance WHERE registration_id IN (SELECT id FROM registrations WHERE event_id=$1::uuid)', [eventId]);
    await db.query('DELETE FROM registrations WHERE event_id=$1::uuid', [eventId]);
    await db.query('DELETE FROM events WHERE id=$1::uuid AND organizer_id=$2::uuid', [eventId, owner]);
    const ids = [owner, participant, ...extra];
    await db.query("DELETE FROM sessions WHERE sess->>'userId'=ANY($1::text[])", [ids]); await db.query('DELETE FROM users WHERE id=ANY($1::uuid[])', [ids]);
  });
});
async function login(page: Page, id = owner) {
  await page.goto('/login'); await page.getByLabel('Email').fill(`${id}@f07.test`); await page.getByLabel('Password').fill(password); await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL(id === owner ? '/organizer/events' : '/events');
}
const path = () => `/organizer/events/${eventId}/check-ins`;
const readRoute = () => `**/api/organizer/events/${eventId}/check-ins*`;
const writeRoute = () => `**/api/organizer/events/${eventId}/registrations/*/check-in`;
const checkButton = (page: Page) => page.getByRole('button', { name: 'Check in Check-in Student', exact: true });
async function open(page: Page) { await login(page); await page.goto(path()); await expect(checkButton(page)).toBeVisible(); }
async function submit(page: Page) { page.once('dialog', dialog => dialog.accept()); await checkButton(page).click(); }
async function savedCount() { return (await database(db => db.query('SELECT count(*)::int AS n FROM attendance WHERE registration_id=$1::uuid', [registrationId]))).rows[0].n as number; }

test('owner navigation, confirmation cancellation, persisted success and reload preserve attendance', async ({ page }) => {
  await login(page); await page.getByRole('link', { name: 'Check-in', exact: true }).filter({ visible: true }).click();
  await expect(checkButton(page)).toBeEnabled();
  page.once('dialog', dialog => dialog.dismiss()); await checkButton(page).click(); expect(await savedCount()).toBe(0); await expect(checkButton(page)).toBeFocused();
  await submit(page); await expect(page.getByText('Active registrations: 1 · Checked in: 1', { exact: true })).toBeVisible();
  const before = (await database(db => db.query('SELECT * FROM attendance WHERE registration_id=$1::uuid', [registrationId]))).rows[0];
  expect(before.checked_in_by).toBe(owner); await expect(checkButton(page)).toHaveCount(0);
  await page.reload(); await expect(page.getByText('Active registrations: 1 · Checked in: 1', { exact: true })).toBeVisible();
  expect((await database(db => db.query('SELECT * FROM attendance WHERE registration_id=$1::uuid', [registrationId]))).rows[0]).toEqual(before);
});
test('lost committed response blocks resubmission until a successful explicit read', async ({ page }) => {
  await open(page); let count = 0;
  await page.route(writeRoute(), async route => { count++; const response = await route.fetch(); expect(response.status()).toBe(201); await route.abort(); });
  await submit(page); await expect(page.getByRole('alert')).toHaveText('We could not confirm check-in. Check status before trying again.'); await expect(checkButton(page)).toBeDisabled(); expect(await savedCount()).toBe(1);
  await page.route(readRoute(), route => route.fulfill({ status: 500, json: {} }));
  await page.getByRole('button', { name: 'Check status', exact: true }).click(); await expect(page.getByRole('alert').filter({ hasText: 'Unable to load' })).toBeVisible(); await expect(checkButton(page)).toHaveCount(0);
  await page.unroute(readRoute()); await page.getByRole('button', { name: 'Try again', exact: true }).click(); await expect(page.getByText('Active registrations: 1 · Checked in: 1', { exact: true })).toBeVisible(); expect(count).toBe(1);
});
test('pending mutation disables other submissions, status reads and pagination', async ({ page }) => {
  extra = Array.from({ length: 20 }, () => randomUUID());
  await database(async db => {
    const hash = (await db.query('SELECT password_hash FROM users WHERE id=$1', [participant])).rows[0].password_hash;
    await db.query(`INSERT INTO users(id,email,password_hash,display_name,role) SELECT id,id::text||'@f07.test',$2,'Other student','PARTICIPANT' FROM unnest($1::uuid[]) id`, [extra, hash]);
    await db.query(`INSERT INTO registrations(id,event_id,participant_id,status,registered_at) SELECT id,$2,id,'ACTIVE',now() FROM unnest($1::uuid[]) id`, [extra, eventId]);
  });
  await open(page); let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; }); let count = 0;
  await page.route(writeRoute(), async route => { count++; const response = await route.fetch(); await gate; await route.fulfill({ response }); });
  try {
    await submit(page); await expect.poll(() => count).toBe(1); await expect(checkButton(page)).toBeDisabled(); await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled(); await expect(page.getByRole('button', { name: 'Check status', exact: true })).toBeDisabled(); expect(count).toBe(1);
  } finally { release(); }
  await expect(page.getByText('Active registrations: 21 · Checked in: 1', { exact: true })).toBeVisible(); await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Next', exact: true }).click(); await expect(page.getByText('Page 2', { exact: true })).toBeVisible();
});
for (const mode of ['cancelled', 'closed'] as const) test(`server rechecks ${mode} after a stale OPEN roster`, async ({ page }) => {
  await open(page);
  await database(db => mode === 'cancelled' ? db.query("UPDATE registrations SET status='CANCELLED',cancelled_at=now() WHERE id=$1", [registrationId]) : db.query("UPDATE events SET ends_at=now()-interval '1 second' WHERE id=$1", [eventId]));
  await submit(page); await expect(page.getByRole('alert')).toHaveText(mode === 'cancelled' ? 'This registration is no longer eligible.' : 'Check-in has closed.'); await expect(checkButton(page)).toBeDisabled(); expect(await savedCount()).toBe(0);
  await page.getByRole('button', { name: 'Check status', exact: true }).click();
  if (mode === 'cancelled') await expect(page.getByText('No active registrations.', { exact: true })).toBeVisible(); else await expect(page.getByText('Check-in has closed.', { exact: true })).toBeVisible();
});
test('read failure is distinct from empty and not-open state', async ({ page }) => {
  await login(page); await page.route(readRoute(), route => route.fulfill({ status: 500, json: {} })); await page.goto(path()); await expect(page.getByRole('alert')).toHaveText('Unable to load the check-in roster.');
  await page.unroute(readRoute()); await database(db => db.query("UPDATE events SET starts_at=now()+interval '1 hour',ends_at=now()+interval '2 hours' WHERE id=$1", [eventId]));
  await page.getByRole('button', { name: 'Try again', exact: true }).click(); await expect(page.getByText('Check-in is not open yet.', { exact: true })).toBeVisible(); await expect(checkButton(page)).toBeDisabled();
  await database(db => db.query("UPDATE registrations SET status='CANCELLED',cancelled_at=now() WHERE id=$1", [registrationId])); await page.getByRole('button', { name: 'Check status', exact: true }).click(); await expect(page.getByText('No active registrations.', { exact: true })).toBeVisible();
});
test('anonymous deep link resumes after login and Participant is denied the private page', async ({ page }) => {
  await page.goto(path()); await expect(page).toHaveURL(`/login?returnTo=${encodeURIComponent(path())}`);
  await page.getByLabel('Email').fill(`${owner}@f07.test`); await page.getByLabel('Password').fill(password); await page.getByRole('button', { name: 'Log in', exact: true }).click(); await expect(page).toHaveURL(path()); await expect(checkButton(page)).toBeEnabled();
  await page.getByRole('button', { name: 'Log out', exact: true }).click(); await expect(page).toHaveURL('/events'); await login(page, participant); await page.goto(path()); await expect(page.getByRole('heading', { name: 'Access Denied', exact: true })).toBeVisible(); await expect(page.getByText('Check-in Student', { exact: true })).toHaveCount(0);
});
for (const status of [401, 403, 404]) test(`mutation ${status} clears private roster`, async ({ page }) => {
  await open(page); await page.route(writeRoute(), route => route.fulfill({ status, json: { error: {} } })); await submit(page);
  if (status === 401) await expect(page).toHaveURL(`/login?returnTo=${encodeURIComponent(path())}`); else await expect(page.getByRole('alert')).toHaveText('Event not found.');
  await expect(page.getByText('Check-in Student', { exact: true })).toHaveCount(0); await expect(page.getByText('Attendance workshop', { exact: true })).toHaveCount(0);
});
test('late mutation response after logout cannot redirect the disposed check-in page', async ({ page }) => {
  await open(page); let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; }); let sent = false;
  await page.route(writeRoute(), async route => { sent = true; await gate; await route.continue(); });
  const response = page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname.endsWith('/check-in'));
  try { await submit(page); await expect.poll(() => sent).toBe(true); await page.getByRole('button', { name: 'Log out', exact: true }).click(); await expect(page).toHaveURL('/events'); } finally { release(); }
  expect((await response).status()).toBe(401); await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))); await expect(page).toHaveURL('/events'); expect(await savedCount()).toBe(0);
});
for (const width of [320, 390, 1440]) test(`keyboard confirmation and check-in layout at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await open(page);
  await checkButton(page).focus(); page.once('dialog', dialog => dialog.dismiss()); await page.keyboard.press('Enter'); await expect(checkButton(page)).toBeFocused(); expect(await savedCount()).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await mkdir('docs/evidence/sprint-3', { recursive: true }); await page.screenshot({ path: `docs/evidence/sprint-3/f07-${width}.png`, fullPage: true });
});
