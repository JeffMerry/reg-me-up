// Synthetic, local-only smoke test. This creates an event in the selected DB.
const { chromium } = require('@playwright/test');
const { randomUUID } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');

async function main() {
  const base = process.env.LAB5_SMOKE_BASE_URL;
  const recordPath = process.env.LAB5_SMOKE_RECORD_PATH;
  const password = process.env.SEED_PASSWORD;
  const mode = process.argv[2];
  let url;
  try { url = new URL(base); } catch { throw new Error('Configure a local smoke-test URL'); }
  if (process.env.LAB5_SMOKE_CONFIRM !== 'isolated-local-only' || !['localhost', '127.0.0.1'].includes(url.hostname) || url.protocol !== 'http:' || url.origin !== base || !recordPath || !['create', 'verify'].includes(mode)) {
    throw new Error('Use an explicitly confirmed isolated local test target and record path');
  }
  const ensure = (ok, message) => { if (!ok) throw new Error(message); };
  if (!password) throw new Error('Provide the synthetic local SEED_PASSWORD');
  if (mode === 'verify') {
    const record = JSON.parse(readFileSync(recordPath, 'utf8'));
    ensure(/^[0-9a-f-]{36}$/i.test(record.id) && /^[0-9a-f-]{36}$/i.test(record.registrationId) && typeof record.title === 'string', 'Invalid saved record');
    const response = await fetch(`${base}/api/events/${record.id}`);
    ensure(response.ok && (await response.json()).data.title === record.title, 'Saved event not available');
    const bootstrap = await fetch(`${base}/api/auth/csrf`);
    const cookie = bootstrap.headers.get('set-cookie')?.split(';')[0];
    const token = (await bootstrap.json()).data.csrfToken;
    ensure(cookie, 'Missing session cookie');
    const login = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { Cookie: cookie, Origin: base, 'X-CSRF-Token': token, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'p1@example.test', password }) });
    ensure(login.ok, 'Participant login failed');
    const signedCookie = login.headers.get('set-cookie')?.split(';')[0];
    ensure(signedCookie, 'Missing authenticated cookie');
    const registration = await fetch(`${base}/api/me/registrations/${record.registrationId}`, { headers: { Cookie: signedCookie } });
    const saved = await registration.json();
    ensure(registration.ok && saved.data.id === record.registrationId && saved.data.event.id === record.id, 'Saved registration not available');
    console.log('PASS: same event and registration remain readable after restart');
    return;
  }
  for (const path of ['/api/health', '/api/ready']) ensure((await fetch(`${base}${path}`)).status === 200, `${path} unavailable`);
  const missing = await fetch(`${base}/api/not-a-route`);
  ensure(missing.status === 404 && !(await missing.text()).includes('<div id="root">'), 'Unknown API route fell back to SPA');

  const options = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {};
  const browser = await chromium.launch(options);
  try {
    const page = await browser.newPage();
    await page.goto(`${base}/login`);
    await page.getByLabel('Email').fill('o1@example.test');
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await page.waitForURL('**/organizer/events');
    await page.getByRole('link', { name: 'Create event' }).click();
    const title = `Lab5 clean clone ${randomUUID()}`;
    await page.getByLabel('Event name').fill(title);
    await page.getByLabel('Start date and time').fill('2027-01-15T09:00');
    await page.getByLabel('End date and time').fill('2027-01-15T11:00');
    await page.getByLabel('Location').fill('Synthetic lab room');
    await page.getByLabel('Capacity').fill('3');
    const responsePromise = page.waitForResponse(response => response.url().endsWith('/api/events') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Publish event' }).click();
    const response = await responsePromise;
    ensure(response.status() === 201, 'Event publication failed');
    const data = (await response.json()).data;
    ensure(data.title === title && /^[0-9a-f-]{36}$/i.test(data.id), 'Unexpected event response');
    await page.getByRole('heading', { name: title }).waitFor();
    const publicResult = await fetch(`${base}/api/events/${data.id}`);
    ensure(publicResult.ok && (await publicResult.json()).data.title === title, 'Public event lookup failed');
    await page.getByRole('button', { name: 'Log out' }).click();
    await page.waitForURL('**/events');
    await page.goto(`${base}/login`);
    await page.getByLabel('Email').fill('p1@example.test');
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await page.waitForURL('**/events');
    await page.goto(`${base}/events/${data.id}`);
    const registrationPromise = page.waitForResponse(result => result.url().endsWith(`/api/events/${data.id}/registrations`) && result.request().method() === 'POST');
    await page.getByRole('button', { name: 'Register', exact: true }).click();
    const registered = await registrationPromise;
    ensure(registered.status() === 201, 'Registration failed');
    const registration = (await registered.json()).data;
    ensure(/^[0-9a-f-]{36}$/i.test(registration.id), 'Unexpected registration reference');
    await page.getByText('You are registered.').waitFor();
    writeFileSync(recordPath, JSON.stringify({ id: data.id, title, registrationId: registration.id }, null, 2));
    console.log('PASS: health, readiness, missing API route, Organizer publication and Participant registration through browser');
  } finally { await browser.close(); }
}

main().catch(() => { console.error('Smoke test failed; check the isolated local target and browser setup.'); process.exitCode = 1; });
