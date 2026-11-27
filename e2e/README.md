# F-01 browser tests

## F-05 cancellation

After applying all migrations and seeding the guarded test database, use the same environment below and run `npx playwright test e2e/f-05.spec.ts` (or `npx playwright test` for regression). Verify PostgreSQL connection time zone is UTC. F-05 uses seeded P1/O1 and `SEED_PASSWORD`, creates unique event/registration fixtures, then removes only its own rows. It covers persisted cancellation/re-registration, confirmation keyboard/focus at 320/390/1440px, pending and denied requests, lost-response reconciliation including cached-detail reopening, session expiry, started-event rejection, and paginated ACTIVE lookup. Full backend boundary/race/restart checks live in `server/tests/integration/cancellation.test.ts`.

## Shared setup

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

## Test artifacts

Every E2E case automatically saves a screenshot under `docs/evidence/e2e/.playwright-artifacts/`. Failed cases also retain a Playwright trace and video in that folder. The HTML report is generated at `docs/evidence/e2e/.playwright-report/index.html`; open it with `npx playwright show-report docs/evidence/e2e/.playwright-report`. These generated-artifact folders are separate from the numbered evidence screenshots at the root of `docs/evidence/e2e`.

The F-01 suite exercises identity. Run `npx playwright test e2e/f-02.spec.ts` with the same isolated test setup to exercise selected F-02 publication/discovery flows. Registration remains F-03. The UI expiry cases simulate a 401 response; the actual eight-hour boundary is separately tested with the backend clock. Browser checks do not replace the full STS or teammate review.

## F-09 Instructor assignment

Apply migrations to the dedicated `regmeup_test` database and install the test guard as described in the root README. The F-09 E2E file creates unique Organizer and Instructor accounts and one event for each case, then removes only those test-owned rows. It does not need seeded accounts or `SEED_PASSWORD`; account passwords are test-only values created inside the test. It still requires `NODE_ENV=test`, `E2E_APP_DATABASE_URL`, `TEST_DATABASE_URL`, and `DATABASE_URL` equal to `TEST_DATABASE_URL` so the database guard can verify the isolated target.

From the repository root, with the test database variables configured:

```cmd
npx playwright test e2e/f-09.spec.ts
```

The five cases cover owner assignment/replacement/removal and persisted history, Instructor teaching-list/detail privacy, keyboard focus, and horizontal overflow at 320/390/1440px. A Playwright report does not replace API/DB race tests or teammate review.

Run `npx playwright test e2e/f-04.spec.ts` with `NODE_ENV=test`, `E2E_APP_DATABASE_URL`, `TEST_DATABASE_URL`, and `DATABASE_URL` set to the test URL. The suite checks the Organizer's My Events link, owner-only registration details, empty/error states, wrong-role and non-owner denial, and a mobile layout. It creates uniquely identified synthetic users and test rows after verifying the test database marker, then removes them. It uses a fixed test-only password and does not require `SEED_PASSWORD` or seed accounts.
