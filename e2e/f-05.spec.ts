import { expect, test, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { verifyTestDatabase } from '../server/src/test-db-safety.js';

const participant = '10000000-0000-4000-8000-000000000001';
const owner = '20000000-0000-4000-8000-000000000001';
let eventId: string, registrationId: string;

async function database<T>(operation: (client: pg.Client) => Promise<T>): Promise<T> {
  if (!process.env.SEED_PASSWORD || process.env.NODE_ENV !== 'test' || !process.env.TEST_DATABASE_URL || !process.env.E2E_APP_DATABASE_URL || process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL) throw new Error('Use only the seeded guarded test database');
  const app = new pg.Client({ connectionString: process.env.E2E_APP_DATABASE_URL });
  const testDb = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  try { await app.connect(); await testDb.connect(); await verifyTestDatabase(app, testDb); return await operation(testDb); }
  finally { await Promise.allSettled([app.end(), testDb.end()]); }
}
test.beforeEach(async () => {
  eventId = randomUUID(); registrationId = randomUUID();
  await database(async db => {
    await db.query(`INSERT INTO events(id,organizer_id,title,starts_at,ends_at,location,capacity,publication_status) VALUES($1,$2,'Cancellation browser fixture','2030-01-15T02:00:00Z','2030-01-15T04:00:00Z','Test workshop room',1,'PUBLISHED')`, [eventId, owner]);
    await db.query(`INSERT INTO registrations(id,event_id,participant_id,status) VALUES($1,$2,$3,'ACTIVE')`, [registrationId, eventId, participant]);
  });
});
test.afterEach(async () => {
  await database(async db => {
    await db.query('DELETE FROM registrations WHERE event_id=$1::uuid', [eventId]);
    await db.query('DELETE FROM events WHERE id=$1::uuid AND organizer_id=$2::uuid', [eventId, owner]);
  });
});
async function open(page: Page) {
  await page.goto('/login'); await page.getByLabel('Email').fill('p1@example.test'); await page.getByLabel('Password').fill(process.env.SEED_PASSWORD!);
  await page.getByRole('button', { name: 'Log in', exact: true }).click(); await expect(page).toHaveURL('/events');
  await page.goto(`/my-registrations?registrationId=${registrationId}`);
  await expect(page.getByRole('dialog', { name: 'Registration details' })).toBeVisible();
}
async function confirm(page: Page) {
  await page.getByRole('button', { name: 'Cancel registration', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Cancel registration?' });
  await expect(dialog).toBeVisible(); await dialog.getByRole('button', { name: 'Confirm cancellation' }).click();
}

test('cancels with persisted history, reloads it, then re-registers from the public event with a new ID', async ({ page }) => {
  await open(page);
  const response = page.waitForResponse(r => r.url().endsWith(`/${registrationId}/cancel`) && r.request().method() === 'POST');
  await confirm(page); expect((await response).status()).toBe(200);
  let dialog = page.getByRole('dialog', { name: 'Registration details' });
  await expect(dialog.getByRole('status')).toHaveText('Registration cancelled.');
  await expect(dialog.getByText('CANCELLED', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Cancel registration', exact: true })).toHaveCount(0);
  await page.reload(); dialog = page.getByRole('dialog', { name: 'Registration details' });
  await expect(dialog.getByText('CANCELLED', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Cancelled at', { exact: true })).toBeVisible();
  await dialog.getByRole('link', { name: 'View event' }).click();
  await expect(page.getByRole('button', { name: 'Register', exact: true })).toBeEnabled();
  const registration = page.waitForResponse(r => r.url().endsWith(`/api/events/${eventId}/registrations`) && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Register', exact: true }).click();
  const created = await registration; expect(created.status()).toBe(201);
  expect((await created.json()).data.id).not.toBe(registrationId);
  const rows = await database(db => db.query('SELECT status,cancelled_at FROM registrations WHERE event_id=$1::uuid ORDER BY status', [eventId]));
  expect(rows.rows.map(r => r.status)).toEqual(['ACTIVE', 'CANCELLED']);
  expect(rows.rows[0].cancelled_at).toBeNull(); expect(rows.rows[1].cancelled_at).not.toBeNull();
});

for (const width of [320, 390, 1440]) {
  test(`confirmation keeps focus and supports Escape without cancelling at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 }); await open(page);
    const details = page.getByRole('dialog', { name: 'Registration details' });
    await expect(details.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
    await page.getByRole('button', { name: 'Cancel registration', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Cancel registration?' });
    await expect(dialog.getByRole('button', { name: 'Keep registration' })).toBeFocused();
    await page.keyboard.press('Shift+Tab'); await expect(dialog.getByRole('button', { name: 'Confirm cancellation' })).toBeFocused();
    await expect(page.locator('html')).toHaveJSProperty('scrollWidth', width);
    await page.screenshot({ path: testInfo.outputPath(`cancel-confirmation-${width}.png`) });
    await page.keyboard.press('Escape'); await expect(details).toBeVisible();
    await expect(details.getByRole('button', { name: 'Cancel registration', exact: true })).toBeFocused();
    await page.keyboard.press('Escape'); await expect(details).toHaveCount(0);
    const stored = await database(db => db.query('SELECT status,cancelled_at FROM registrations WHERE id=$1::uuid', [registrationId]));
    expect(stored.rows).toEqual([{ status: 'ACTIVE', cancelled_at: null }]);
  });
}

test('reconciles a lost cancellation response only after an explicit status check', async ({ page }) => {
  await open(page);
  await page.route(`**/api/me/registrations/${registrationId}/cancel`, async route => {
    const committed = await route.fetch(); expect(committed.status()).toBe(200); await route.abort('failed');
  });
  await confirm(page);
  const dialog = page.getByRole('dialog', { name: 'Registration details' });
  await expect(dialog.getByRole('alert')).toContainText('We could not confirm cancellation.');
  await expect(dialog.getByText('ACTIVE', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Cancel registration', exact: true })).toBeDisabled();
  await page.route(`**/api/me/registrations/${registrationId}`, route => route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR' } } }));
  await dialog.getByRole('button', { name: 'Check registration status' }).click();
  await expect(dialog.getByText('Unable to load registration. Please try again.')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Cancel registration', exact: true })).toBeDisabled();
  // Closing and reopening cached ACTIVE data must still require a fresh read.
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await page.locator(`#registration-trigger-${registrationId}`).click();
  await expect(dialog.getByText('Unable to load registration. Please try again.')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Cancel registration', exact: true })).toBeDisabled();
  await page.unroute(`**/api/me/registrations/${registrationId}`);
  await dialog.getByRole('button', { name: 'Check registration status' }).click();
  await expect(dialog.getByText('CANCELLED', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('status')).toHaveText('Registration cancelled.');
});

test('holds pending confirmation and prevents duplicate submits until the server response arrives', async ({ page }) => {
  await open(page); let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; }); let count = 0;
  await page.route(`**/api/me/registrations/${registrationId}/cancel`, async route => {
    count++; const response = await route.fetch(); await gate; await route.fulfill({ response });
  });
  try {
    await confirm(page);
    // The UI becomes pending before its CSRF bootstrap completes. Observe the
    // intercepted POST before asserting request count while its response waits.
    await expect.poll(() => count).toBe(1);
    const dialog = page.getByRole('dialog', { name: 'Cancel registration?' });
    await expect(dialog.getByRole('button', { name: 'Cancelling…' })).toBeDisabled();
    await expect(dialog.getByRole('button', { name: 'Keep registration' })).toBeDisabled();
    await page.keyboard.press('Escape'); await expect(dialog).toBeVisible(); expect(count).toBe(1);
  } finally { release(); }
  await expect(page.getByRole('dialog', { name: 'Registration details' }).getByText('CANCELLED', { exact: true })).toBeVisible();
});

test('clears private registration data and returns to login when cancellation session expires', async ({ page }) => {
  await open(page);
  await page.route(`**/api/me/registrations/${registrationId}/cancel`, route => route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED' } } }));
  await confirm(page);
  await expect(page).toHaveURL(`/login?returnTo=${encodeURIComponent(`/my-registrations?registrationId=${registrationId}`)}`);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText(registrationId, { exact: true })).toHaveCount(0);
});

test('does not report a denied request as success and can reconcile a confirmed rollback', async ({ page }) => {
  await open(page);
  const path = `**/api/me/registrations/${registrationId}/cancel`;
  await page.route(path, route => route.fulfill({ status: 403, json: { error: { code: 'CSRF_INVALID' } } }));
  await confirm(page);
  let dialog = page.getByRole('dialog', { name: 'Registration details' });
  await expect(dialog.getByRole('status')).toHaveText('Unable to cancel registration. Check your registration and try again.');
  await expect(dialog.getByText('ACTIVE', { exact: true })).toBeVisible();
  await page.unroute(path);
  await page.route(path, route => route.fulfill({ status: 503, json: { error: { code: 'TEMPORARILY_UNAVAILABLE' } } }));
  await confirm(page);
  dialog = page.getByRole('dialog', { name: 'Registration details' });
  await dialog.getByRole('button', { name: 'Check registration status' }).click();
  await expect(dialog.getByRole('status')).toHaveText('Registration status checked.');
  await expect(dialog.getByRole('button', { name: 'Cancel registration', exact: true })).toBeEnabled();
  const stored = await database(db => db.query('SELECT status FROM registrations WHERE id=$1::uuid', [registrationId]));
  expect(stored.rows).toEqual([{ status: 'ACTIVE' }]);
});

test('hides cancellation for a started event and backend rejects bypassing the UI', async ({ page }) => {
  await database(db => db.query(`UPDATE events SET starts_at=now()-interval '1 hour',ends_at=now()+interval '1 hour' WHERE id=$1::uuid`, [eventId]));
  await open(page);
  const dialog = page.getByRole('dialog', { name: 'Registration details' });
  await expect(dialog.getByRole('button', { name: 'Cancel registration', exact: true })).toHaveCount(0);
  await expect(dialog.getByText('Cancellation is closed because this event has started.')).toBeVisible();
  const token = (await (await page.request.get('/api/auth/csrf')).json()).data.csrfToken as string;
  const response = await page.request.post(`/api/me/registrations/${registrationId}/cancel`, { headers: { Origin: 'http://localhost:43171', 'X-CSRF-Token': token }, data: {} });
  expect(response.status()).toBe(409); expect((await response.json()).error.code).toBe('CANCELLATION_CLOSED');
});

test('finds an ACTIVE registration after a page of cancelled history', async ({ page }) => {
  await open(page);
  const lookup = `/api/me/registrations?eventId=${eventId}`;
  await page.route(`**${lookup}`, route => route.fulfill({ json: { data: Array.from({ length: 20 }, () => ({ id: randomUUID(), status: 'CANCELLED' })), meta: { page: 1, pageSize: 20, total: 21 } } }));
  await page.route(`**${lookup}&page=2`, route => route.fulfill({ json: { data: [{ id: registrationId, status: 'ACTIVE' }], meta: { page: 2, pageSize: 20, total: 21 } } }));
  await page.goto(`/events/${eventId}`);
  await expect(page.getByText('You are registered.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'View registration', exact: true })).toHaveAttribute('href', `/my-registrations?registrationId=${registrationId}`);
  await expect(page.getByRole('button', { name: 'Register', exact: true })).toHaveCount(0);
});
