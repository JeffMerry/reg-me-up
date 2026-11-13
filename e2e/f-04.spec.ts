import { expect, test, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { verifyTestDatabase } from '../server/src/test-db-safety.js';

const password = process.env.SEED_PASSWORD;
const organizerId = '20000000-0000-4000-8000-000000000001';
const participantId = '10000000-0000-4000-8000-000000000001';
const eventId = randomUUID(), emptyEventId = randomUUID(), registrationId = randomUUID();
const title = `F-04 owner list ${eventId}`;
const startsAt = '2026-12-01T02:00:00.000Z', endsAt = '2026-12-01T04:00:00.000Z';
let verified = false;

test.beforeAll(async () => {
  if (!password || process.env.NODE_ENV !== 'test' || !process.env.TEST_DATABASE_URL || !process.env.E2E_APP_DATABASE_URL || process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL) throw new Error('Use a seeded, isolated test database');
  const app = new pg.Client({ connectionString: process.env.E2E_APP_DATABASE_URL }), target = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    await app.connect(); await target.connect(); await verifyTestDatabase(app, target); verified = true;
    await target.query('BEGIN');
    await target.query('INSERT INTO events (id, organizer_id, title, starts_at, ends_at, location, capacity, publication_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8), ($9, $2, $10, $4, $5, $6, $7, $8)', [eventId, organizerId, title, startsAt, endsAt, 'F-04 Test Room', 3, 'PUBLISHED', emptyEventId, `F-04 empty ${emptyEventId}`]);
    await target.query('INSERT INTO registrations (id, event_id, participant_id, status) VALUES ($1, $2, $3, $4)', [registrationId, eventId, participantId, 'ACTIVE']);
    await target.query('COMMIT');
  } catch (error) {
    await target.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally { await Promise.allSettled([app.end(), target.end()]); }
});

test.afterAll(async () => {
  if (!verified || !process.env.TEST_DATABASE_URL) return;
  const target = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    await target.connect();
    await target.query('DELETE FROM registrations WHERE id = $1', [registrationId]);
    await target.query('DELETE FROM events WHERE id = ANY($1::uuid[]) AND organizer_id = $2', [[eventId, emptyEventId], organizerId]);
  } finally { await target.end(); }
});

async function login(page: Page, email = 'o1@example.test') {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
}

test('event owner opens the registrations list from My Events', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/\/organizer\/events$/);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator(`a[href="/organizer/events/${eventId}/registrations"]`).first().click();
  await expect(page).toHaveURL(`/organizer/events/${eventId}/registrations`);
  await expect(page.getByRole('heading', { name: `${title} — Registrations` })).toBeVisible();
  await expect(page.getByText('Participant One', { exact: true })).toBeVisible();
  await expect(page.getByText(registrationId, { exact: true })).toBeVisible();
  await expect(page.getByText('Active registrations').locator('..')).toContainText('1');
  await expect(page.getByText('Capacity').locator('..')).toContainText('3');
  await expect(page.getByText('Remaining seats').locator('..')).toContainText('2');
  await expect(page.getByText('p1@example.test')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByText(registrationId, { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('owner sees an empty list separately from an error', async ({ page }) => {
  await login(page);
  await page.goto(`/organizer/events/${emptyEventId}/registrations`);
  await expect(page.getByText('No participants have registered for this event yet.')).toBeVisible();
  await expect(page.getByText('Active registrations').locator('..')).toContainText('0');
  await expect(page.getByText('Unable to load registrations.')).toHaveCount(0);
});

test('wrong role and another Organizer cannot see private registration details', async ({ page }) => {
  await login(page, 'p1@example.test');
  await page.goto(`/organizer/events/${eventId}/registrations`);
  await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible();
  await expect(page.getByText(title)).toHaveCount(0);

  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
  await login(page, 'o2@example.test');
  await page.goto(`/organizer/events/${eventId}/registrations`);
  await expect(page.getByRole('heading', { name: 'Event not found' })).toBeVisible();
  await expect(page.getByText(title)).toHaveCount(0);
  await expect(page.getByText('Participant One')).toHaveCount(0);
  await expect(page.getByText(registrationId)).toHaveCount(0);
});

test('registration read errors show retry instead of an empty list', async ({ page }) => {
  await login(page);
  const endpoint = `**/api/organizer/events/${eventId}/registrations**`;
  await page.route(endpoint, route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { code: 'INTERNAL_ERROR' } }) }));
  await page.goto(`/organizer/events/${eventId}/registrations`);
  await expect(page.getByText('Unable to load registrations.')).toBeVisible();
  await expect(page.getByText('No participants have registered for this event yet.')).toHaveCount(0);
  await page.unroute(endpoint);
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText(registrationId, { exact: true })).toBeVisible();
});
