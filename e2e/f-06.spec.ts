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
    await db.query(`INSERT INTO events(id,organizer_id,title,starts_at,ends_at,location,capacity,publication_status) VALUES($1,$2,'Edit browser fixture','2030-01-15T02:00:00Z','2030-01-15T04:00:00Z','Test workshop room',100,'PUBLISHED')`, [eventId, owner]);
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
  await page.goto('/login'); await page.getByLabel('Email').fill('o1@example.test'); await page.getByLabel('Password').fill(process.env.SEED_PASSWORD!);
  await page.getByRole('button', { name: 'Log in', exact: true }).click(); await expect(page).toHaveURL('/organizer/events');
  await page.goto(`/organizer/events/${eventId}/edit`);
  await expect(page.getByLabel('Event name')).toHaveValue('Edit browser fixture');
}
const save = (page: Page) => page.getByRole('button', { name: 'Save changes', exact: true }).click();

test('edits a legacy event without supplying capacity and persists the result after reload', async ({ page }) => {
  await open(page); await expect(page.getByText(/This existing event has capacity 100/)).toBeVisible();
  await page.getByLabel('Event name').fill('Edited legacy event');
  const response = page.waitForResponse(r => r.request().method() === 'PATCH'); await save(page);
  const saved = await response; expect(saved.status()).toBe(200); expect(saved.request().postDataJSON()).toEqual({ expectedVersion: 0, title: 'Edited legacy event' });
  await expect(page.getByText('Changes saved.', { exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByLabel('Event name')).toHaveValue('Edited legacy event'); await expect(page.getByLabel('Capacity', { exact: true })).toHaveValue('100');
  const row = await database(db => db.query('SELECT title,capacity,version FROM events WHERE id=$1::uuid', [eventId])); expect(row.rows).toEqual([{ title: 'Edited legacy event', capacity: 100, version: 1 }]);
});

test('validates explicit capacity, saves a past deadline, and shows public registration Closed', async ({ page, browser }) => {
  await open(page); let requests = 0; page.on('request', r => { if (r.method() === 'PATCH') requests++; });
  await page.getByLabel('Capacity', { exact: true }).fill('61'); await save(page);
  await expect(page.getByText('Enter a whole number from 1 to 60.', { exact: true })).toBeVisible(); await expect(page.getByLabel('Capacity', { exact: true })).toBeFocused(); expect(requests).toBe(0);
  await page.getByLabel('Capacity', { exact: true }).fill('1'); await page.getByLabel('Registration deadline (optional)').fill('2020-01-15T09:00'); await save(page);
  await expect(page.getByText('Changes saved.', { exact: true })).toBeVisible();
  const guest = await browser.newContext(); try { const view = await guest.newPage(); await view.goto(`/events/${eventId}`); await expect(view.getByText('Registration is closed.', { exact: true })).toBeVisible(); await expect(view.getByRole('link', { name: 'Log in to register' })).toHaveCount(0); } finally { await guest.close(); }
});

test('keeps unsaved values on stale conflict and requires explicit reload before another save', async ({ page }) => {
  await open(page);
  await database(db => db.query("UPDATE events SET title='Changed elsewhere',version=version+1 WHERE id=$1::uuid", [eventId]));
  await page.getByLabel('Event name').fill('Stale local edit'); await save(page);
  await expect(page.getByRole('alert')).toContainText('This event has changed.'); await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled(); await expect(page.getByLabel('Event name')).toHaveValue('Stale local edit');
  page.once('dialog', dialog => dialog.accept()); await page.getByRole('button', { name: 'Reload event' }).click();
  await expect(page.getByLabel('Event name')).toHaveValue('Changed elsewhere'); await expect(page.getByRole('button', { name: 'Save changes' })).toBeEnabled();
});

test('reconciles a lost committed edit response by explicit reload without automatic PATCH retry', async ({ page }) => {
  await open(page); let count = 0;
  await page.route(`**/api/organizer/events/${eventId}`, async route => { if (route.request().method() !== 'PATCH') return route.continue(); count++; const response = await route.fetch(); expect(response.status()).toBe(200); await route.abort('failed'); });
  await page.getByLabel('Location', { exact: true }).fill('Saved new room'); await save(page);
  await expect(page.getByRole('alert')).toContainText('We could not confirm the edit.'); await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled(); expect(count).toBe(1);
  page.once('dialog', dialog => dialog.accept()); await page.getByRole('button', { name: 'Reload event' }).click(); await expect(page.getByLabel('Location', { exact: true })).toHaveValue('Saved new room'); await expect(page.getByRole('button', { name: 'Save changes' })).toBeEnabled(); expect(count).toBe(1);
});

test('holds pending state until PATCH completes and prevents duplicate submit', async ({ page }) => {
  await open(page); let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; }); let count = 0;
  await page.route(`**/api/organizer/events/${eventId}`, async route => { if (route.request().method() !== 'PATCH') return route.continue(); count++; const response = await route.fetch(); await gate; await route.fulfill({ response }); });
  try { await page.getByLabel('Event name').fill('Pending edit'); await save(page); await expect.poll(() => count).toBe(1); await expect(page.getByRole('button', { name: 'Saving…' })).toBeDisabled(); await expect(page.getByLabel('Event name')).toBeDisabled(); } finally { release(); }
  await expect(page.getByText('Changes saved.', { exact: true })).toBeVisible(); expect(count).toBe(1);
});

test('clears private edit values on session expiry and preserves the edit return path', async ({ page }) => {
  await open(page); await page.route(`**/api/organizer/events/${eventId}`, route => route.request().method() === 'PATCH' ? route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED' } } }) : route.continue());
  await page.getByLabel('Event name').fill('Private unsaved title'); await save(page);
  await expect(page).toHaveURL(`/login?returnTo=${encodeURIComponent(`/organizer/events/${eventId}/edit`)}`); await expect(page.getByLabel('Event name')).toHaveCount(0); await expect(page.getByText('Private unsaved title')).toHaveCount(0);
});

test('distinguishes read failure from an empty form and permits retry', async ({ page }) => {
  await page.route(`**/api/organizer/events/${eventId}`, route => route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR' } } }));
  await page.goto('/login'); await page.getByLabel('Email').fill('o1@example.test'); await page.getByLabel('Password').fill(process.env.SEED_PASSWORD!); await page.getByRole('button', { name: 'Log in', exact: true }).click(); await expect(page).toHaveURL('/organizer/events'); await page.goto(`/organizer/events/${eventId}/edit`);
  await expect(page.getByRole('alert')).toContainText('Unable to load event.'); await expect(page.getByLabel('Event name')).toHaveCount(0);
  await page.unroute(`**/api/organizer/events/${eventId}`); await page.getByRole('button', { name: 'Try again', exact: true }).click(); await expect(page.getByLabel('Event name')).toHaveValue('Edit browser fixture');
});

for (const width of [320,390,1440]) test(`edit form supports keyboard and fits ${width}px`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: 900 }); await open(page); await page.getByLabel('Event name').focus(); await page.keyboard.press('Tab'); await expect(page.getByLabel('Start date and time')).toBeFocused();
  await expect(page.locator('html')).toHaveJSProperty('scrollWidth', width); await page.screenshot({ path: testInfo.outputPath(`edit-${width}.png`), fullPage: true });
});
