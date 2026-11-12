import { expect, test, type Page } from '@playwright/test';
import pg from 'pg';
import { verifyTestDatabase } from '../server/src/test-db-safety.js';

const password = process.env.SEED_PASSWORD;
let createdRegistrationId: string | undefined;
test.beforeAll(async () => {
  if (!password || process.env.NODE_ENV !== 'test' || !process.env.TEST_DATABASE_URL || !process.env.E2E_APP_DATABASE_URL || process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL) throw new Error('Use a seeded isolated test database and synthetic credentials');
  const app = new pg.Client({ connectionString: process.env.E2E_APP_DATABASE_URL }); const target = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  try { await app.connect(); await target.connect(); await verifyTestDatabase(app, target); }
  finally { await Promise.allSettled([app.end(), target.end()]); }
});
test.afterEach(async () => {
  if (!process.env.TEST_DATABASE_URL || !process.env.E2E_APP_DATABASE_URL) return;
  const app = new pg.Client({ connectionString: process.env.E2E_APP_DATABASE_URL }); const target = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  try { await app.connect(); await target.connect(); await verifyTestDatabase(app, target); await target.query('DELETE FROM registrations WHERE event_id = $1::uuid AND participant_id = $2::uuid AND ($3::uuid IS NULL OR id = $3::uuid)', ['30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', createdRegistrationId ?? null]); }
  finally { await Promise.allSettled([app.end(), target.end()]); createdRegistrationId = undefined; }
});

async function login(page: Page, email = 'p1@example.test') {
  await page.goto('/login'); await page.getByLabel('Email').fill(email); await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: 'Log in', exact: true }).click(); await expect(page).toHaveURL(/\/events$/);
}

test('Participant registers, sees the server reference and opens own registration details', async ({ page }) => {
  await login(page);
  await page.goto('/events/30000000-0000-4000-8000-000000000001');
  const created = page.waitForResponse(response => response.url().includes('/api/events/30000000-0000-4000-8000-000000000001/registrations') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Register', exact: true }).click();
  const payload = await (await created).json() as { data: { id: string } }; createdRegistrationId = payload.data.id;
  await expect(page.getByText('You are registered.')).toBeVisible();
  await page.getByRole('link', { name: 'View registration' }).click();
  await expect(page).toHaveURL(/\/my-registrations\?registrationId=[0-9a-f-]+$/i);
  await expect(page.getByRole('dialog', { name: 'Registration details' })).toBeVisible();
  await expect(page.getByText('Empty workshop')).toBeVisible();
});

test('full event disables registration and the own list separates empty from error', async ({ page }) => {
  await login(page, 'p3@example.test');
  await page.goto('/events/30000000-0000-4000-8000-000000000003');
  await expect(page.getByRole('button', { name: 'Full' })).toBeDisabled();
  await page.goto('/my-registrations');
  await expect(page.getByText('You have no registrations yet.')).toBeVisible();
});
