# F-01 browser tests

Use two distinct disposable PostgreSQL databases on the same server. Prepare, migrate and seed the test database using the synthetic seed instructions in the root README, then create its `regmeup_test_guard` marker. Keep the application database URL separately; the suite verifies both live identities and the marker before browser actions. The suite creates synthetic-account sessions and does not reset either database.

From the repository root in PowerShell, replace both example URLs and use the same synthetic password that initially seeded the test database:

```powershell
$env:NODE_ENV = 'test'
$env:E2E_APP_DATABASE_URL = 'postgresql://user:password@localhost:5432/regmeup_app'
$env:TEST_DATABASE_URL = 'postgresql://user:password@localhost:5432/regmeup_test'
$env:DATABASE_URL = $env:TEST_DATABASE_URL
$env:SESSION_SECRET = 'replace-with-a-test-only-secret-at-least-32-characters'
$env:SEED_PASSWORD = 'replace-with-the-synthetic-test-seed-password'
npx playwright install chromium
npx playwright test e2e/f-01.spec.ts
```

The Playwright configuration starts dedicated server and Vite processes on ports 43170 and 43171 and refuses to reuse existing services. Close any service occupying either port before testing. To use an already installed Chromium-compatible executable instead of the Playwright-managed browser, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its full path. Use a separate test-only secret; do not put real credentials in the repository or test output.

The suite exercises the current F-01 UI and API, but event detail and registration flows still belong to F-02/F-03. The UI expiry case simulates a 401 logout response; the actual eight-hour boundary is separately tested with the backend clock. Browser checks do not replace the full STS or teammate review.
