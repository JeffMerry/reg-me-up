import { expect, test, type Page } from '@playwright/test';
import pg from 'pg';
import { verifyTestDatabase } from '../server/src/test-db-safety.js';

const password = process.env.SEED_PASSWORD;
test.beforeAll(async () => {
  if (!password || process.env.NODE_ENV !== 'test' || !process.env.TEST_DATABASE_URL || !process.env.E2E_APP_DATABASE_URL || process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL) throw new Error('Use a seeded, isolated test database with NODE_ENV=test, synthetic SEED_PASSWORD and E2E_APP_DATABASE_URL');
  const app = new pg.Client({ connectionString: process.env.E2E_APP_DATABASE_URL });
  const target = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  try { await app.connect(); await target.connect(); await verifyTestDatabase(app, target); }
  finally { await Promise.allSettled([app.end(), target.end()]); }
});
async function login(page: Page, email = 'p1@example.test') {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
}

test('validation, password visibility, invalid credentials and safe public return', async ({ page }) => {
  await page.goto('/login?returnTo=%2Fevents%2F30000000-0000-4000-8000-000000000001');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByLabel('Email')).toBeFocused();
  await expect(page.getByText('Enter a valid email.')).toBeVisible();
  await page.getByLabel('Email').fill('p1@example.test');
  await page.getByLabel('Password').fill('incorrect');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(page.getByLabel('Password')).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByText('Incorrect email or password.')).toBeVisible();
  await expect(page.getByLabel('Email')).toHaveValue('p1@example.test');
  await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL(/\/events\/30000000-0000-4000-8000-000000000001$/);
  await expect(page.getByText('Participant One (PARTICIPANT)')).toBeVisible();
});

test('external and wrong-role return paths fall back to role defaults', async ({ page }) => {
  await page.goto('/login?returnTo=https%3A%2F%2Fevil.example');
  await login(page, 'o1@example.test');
  await expect(page).toHaveURL(/\/organizer\/events$/);
  await page.getByRole('button', { name: 'Log out' }).click();
  await page.goto('/login?returnTo=%2Forganizer%2Fevents');
  await login(page);
  await expect(page).toHaveURL(/\/events$/);
});

test('logout failure preserves identity; success and Back require rechecking access', async ({ page }) => {
  await page.goto('/login?returnTo=%2Fmy-registrations');
  await login(page);
  await expect(page).toHaveURL(/\/my-registrations$/);
  await page.route('**/api/auth/logout', route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { code: 'INTERNAL_ERROR' } }) }));
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page.getByText('Unable to log out. Please try again.')).toBeVisible();
  await expect(page.getByText('Participant One (PARTICIPANT)')).toBeVisible();
  await page.unroute('**/api/auth/logout');
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/events$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/login\?returnTo=/);
  await expect(page.getByRole('heading', { name: 'Log in', exact: true })).toBeVisible();
  await expect(page.getByText('Participant One (PARTICIPANT)')).toHaveCount(0);
});

test('expired session clears identity while retaining public event location', async ({ page }) => {
  const event = '/events/30000000-0000-4000-8000-000000000001';
  await page.goto(`/login?returnTo=${encodeURIComponent(event)}`); await login(page);
  await expect(page).toHaveURL(new RegExp(`${event}$`));
  await page.route('**/api/auth/logout', route => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: { code: 'UNAUTHENTICATED' } }) }));
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page.getByText('Your session has expired. Please log in again.')).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`${event}$`));
  await expect(page.getByText('Participant One (PARTICIPANT)')).toHaveCount(0);
});

test('wrong role sees access denied instead of private content', async ({ page }) => {
  await page.goto('/login'); await login(page);
  await expect(page).toHaveURL(/\/events$/);
  await page.goto('/organizer/events');
  await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible();
});

for (const width of [320, 390, 1440]) {
  test(`login layout at ${width}px and mobile menu keyboard behavior`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await page.goto('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (width < 768) {
      const menu = page.getByRole('button', { name: 'Toggle navigation' });
      await expect(menu).toHaveAttribute('aria-expanded', 'false'); await menu.click();
      await expect(menu).toHaveAttribute('aria-expanded', 'true'); await page.keyboard.press('Escape');
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
    }
  });
}
