import { expect, test, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { verifyTestDatabase } from '../server/src/test-db-safety.js';

const password = process.env.SEED_PASSWORD;
const title = `E2E event ${randomUUID()}`;
const organizerId = '20000000-0000-4000-8000-000000000001';
let verified = false;
test.beforeAll(async () => {
  if (!password || process.env.NODE_ENV !== 'test' || !process.env.TEST_DATABASE_URL || !process.env.E2E_APP_DATABASE_URL || process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL) throw new Error('Use a seeded, isolated test database');
  const app = new pg.Client({ connectionString: process.env.E2E_APP_DATABASE_URL }), target = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  try { await app.connect(); await target.connect(); await verifyTestDatabase(app, target); verified = true; } finally { await Promise.allSettled([app.end(), target.end()]); }
});
test.afterAll(async () => {
  if (!verified || !process.env.TEST_DATABASE_URL) return;
  const target = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  try { await target.connect(); await target.query('DELETE FROM events WHERE title = $1 AND organizer_id = $2', [title, organizerId]); } finally { await target.end(); }
});
async function openForm(page: Page) {
  await page.goto('/login'); await page.getByLabel('Email').fill('o1@example.test'); await page.getByLabel('Password').fill(password!); await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL(/\/organizer\/events$/); await page.getByRole('link', { name: 'Create event' }).click();
  await expect(page.getByRole('heading', { name: 'Create event' })).toBeVisible();
}
async function fillForm(page: Page) {
  await page.getByLabel('Event name').fill(title); await page.getByLabel('Start date and time').fill('2026-12-01T09:00'); await page.getByLabel('End date and time').fill('2026-12-01T11:00'); await page.getByLabel('Location').fill('Building A'); await page.getByLabel('Capacity').fill('3');
}
test('Organizer validates and publishes an event that is publicly retrievable', async ({ page, browser }) => {
  await openForm(page); await page.getByRole('button', { name: 'Publish event' }).click();
  await expect(page.getByLabel('Event name')).toBeFocused(); await expect(page.getByText('Enter an event name up to 200 characters.')).toBeVisible();
  await fillForm(page); await page.getByRole('button', { name: 'Publish event' }).click();
  await expect(page.getByText('Event published successfully.')).toBeVisible(); await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.getByText('Building A')).toBeVisible(); await expect(page.getByRole('heading', { name: 'Description' })).toHaveCount(0);
  const url = page.url(); const anonymous = await browser.newContext(); const guest = await anonymous.newPage();
  try { await guest.goto(url); await expect(guest.getByRole('heading', { name: title })).toBeVisible(); await expect(guest.getByRole('link', { name: 'Log in to register' })).toBeVisible(); } finally { await anonymous.close(); }
});
test('unknown publication outcome preserves form and requires checking My Events', async ({ page }) => {
  await openForm(page); await fillForm(page);
  await page.route('**/api/events', async route => { if (route.request().method() === 'POST') await route.abort('failed'); else await route.continue(); });
  await page.getByRole('button', { name: 'Publish event' }).click();
  await expect(page.getByText('We could not confirm publication. Please check My Events before trying again.')).toBeVisible();
  await expect(page.getByLabel('Event name')).toHaveValue(title); await expect(page.getByRole('button', { name: 'Publish event' })).toBeDisabled();
  await expect(page.getByRole('link', { name: 'Check My Events' })).toBeVisible();
});
test('expired Organizer session returns to login without keeping private state', async ({ page }) => {
  await openForm(page); await fillForm(page);
  await page.route('**/api/events', async route => { if (route.request().method() === 'POST') await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: { code: 'UNAUTHENTICATED' } }) }); else await route.continue(); });
  await page.getByRole('button', { name: 'Publish event' }).click();
  await expect(page).toHaveURL(/\/login\?returnTo=/);
  await expect(page.getByText('Your session has expired. Please log in again.')).toBeVisible();
  await expect(page.getByLabel('Event name')).toHaveCount(0);
});
test('public list reports read errors and can retry on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 });
  const routePattern = '**/api/events?page=*';
  await page.route(routePattern, route => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));
  await page.goto('/events'); await expect(page.getByText('Unable to load events.')).toBeVisible();
  await page.unroute(routePattern);
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'Discover your next event' })).toBeVisible();
  await expect(page.getByText('Unable to load events.')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
