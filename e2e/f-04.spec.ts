import { expect, test, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import pg from 'pg';
import { verifyTestDatabase } from '../server/src/test-db-safety.js';

const password = 'f04-synthetic-browser-test-password';
const organizerId = randomUUID(), otherOrganizerId = randomUUID(), participantId = randomUUID();
const organizerEmail = `f04-owner-${organizerId}@events.test`, otherOrganizerEmail = `f04-other-${otherOrganizerId}@events.test`, participantEmail = `f04-participant-${participantId}@events.test`;
const eventId = randomUUID(), emptyEventId = randomUUID(), registrationId = randomUUID();
const title = `F-04 owner list ${eventId}`;
const startsAt = '2026-12-01T02:00:00.000Z', endsAt = '2026-12-01T04:00:00.000Z';
let verified = false;

test.beforeAll(async () => {
  if (process.env.NODE_ENV !== 'test' || !process.env.TEST_DATABASE_URL || !process.env.E2E_APP_DATABASE_URL || process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL) throw new Error('Use an isolated test database');
  const app = new pg.Client({ connectionString: process.env.E2E_APP_DATABASE_URL }), target = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    await app.connect(); await target.connect(); await verifyTestDatabase(app, target); verified = true;
    const passwordHash = await argon2.hash(password);
    await target.query('BEGIN');
    await target.query('INSERT INTO users (id, email, password_hash, display_name, role) VALUES ($1, $2, $3, $4, $5), ($6, $7, $3, $8, $5), ($9, $10, $3, $11, $12)', [organizerId, organizerEmail, passwordHash, 'F-04 Organizer', 'ORGANIZER', otherOrganizerId, otherOrganizerEmail, 'F-04 Other Organizer', participantId, participantEmail, 'F-04 Participant', 'PARTICIPANT']);
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
    await target.query("DELETE FROM sessions WHERE sess->>'userId' = ANY($1::text[])", [[organizerId, otherOrganizerId, participantId]]);
    await target.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [[organizerId, otherOrganizerId, participantId]]);
  } finally { await target.end(); }
});

async function login(page: Page, email = organizerEmail) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
}

test('browser Back restores the signed-in navigation after login', async ({ page }) => {
  await page.goto('/events');
  await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
  await page.getByRole('link', { name: 'Log in' }).click();
  await page.getByLabel('Email').fill(organizerEmail);
  await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByRole('link', { name: 'My Events' })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/events$/);
  await expect(page.getByRole('link', { name: 'My Events' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Log in' })).toHaveCount(0);
});

test('event owner opens the registrations list from My Events', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/\/organizer\/events$/);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator(`a[href="/organizer/events/${eventId}/registrations"]`).first().click();
  await expect(page).toHaveURL(`/organizer/events/${eventId}/registrations`);
  await expect(page.getByRole('heading', { name: `${title} — Registrations` })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'F-04 Participant', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: registrationId, exact: true })).toBeVisible();
  await expect(page.getByText('Active registrations').locator('..')).toContainText('1');
  await expect(page.getByText('Capacity').locator('..')).toContainText('3');
  await expect(page.getByText('Remaining seats').locator('..')).toContainText('2');
  await expect(page.getByText(participantEmail)).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('li').getByText(registrationId, { exact: true })).toBeVisible();
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
  await login(page, participantEmail);
  await page.goto(`/organizer/events/${eventId}/registrations`);
  await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible();
  await expect(page.getByText(title)).toHaveCount(0);

  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
  await login(page, otherOrganizerEmail);
  await page.goto(`/organizer/events/${eventId}/registrations`);
  await expect(page.getByRole('heading', { name: 'Event not found' })).toBeVisible();
  await expect(page.getByText(title)).toHaveCount(0);
  await expect(page.getByText('F-04 Participant')).toHaveCount(0);
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
  await expect(page.getByRole('cell', { name: registrationId, exact: true })).toBeVisible();
});
