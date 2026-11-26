# Lab 7 remaining verification — user execution

Tests are run by the user. The new legacy case passed at 21:10:20 (1 passed/43 filtered skips), and full integration passed at 21:13:19 (44 passed), on HEAD `10f8c2d` plus uncommitted legacy test changes. First browser run at 21:20:21: 14 passed/1 failed, all four Lab7 cases passed. After the exact-name selector fix, the browser rerun passed all 15 tests in 25.2s; UI attachments and terminal summary are now saved as images10–14. Local regmeup_test inventory succeeded with 0 events above60; deployment inventory is unverified. Existing 63-unit/43-integration passing evidence remains historical evidence for `db09ba6`. Record `git rev-parse HEAD` and any uncommitted source changes alongside new results.

## 1. Legacy integration and regression (CMD)

Reuse the verified local Docker project `lab6-capacity-regression` at port 55433. The test guard must already be present, and the original synthetic seed password must remain available in this terminal. Run no suites concurrently against this database.

```cmd
set "TEST_DATABASE_URL=postgresql://regmeup_app:regmeup-local-only@127.0.0.1:55433/regmeup_test"
set "DATABASE_URL=postgresql://regmeup_app:regmeup-local-only@127.0.0.1:55433/regmeup_dev"
git rev-parse HEAD
npm run test:integration --workspace server -- -t "preserves legacy capacity 61"
npm run test:integration --workspace server
```

User results are now recorded as `08-integration-legacy-capacity.png` and `09-integration-regression-with-legacy.png`: 1 passed/43 skipped for the filtered run, 44 passed for the full suite. No repeat is required solely to rename these captures. Keep the commands above for reproduction after any relevant source change.

The new case directly seeds a synthetic legacy event with capacity61 and 60 ACTIVE registrations after the existing database guard succeeds. It verifies public list/detail and owner-list values, accepts the 61st registration through HTTP, rejects the next Participant with EVENT_FULL and no row, and compares the complete original event and 60 registration records after the actions. Its fixture users/events/registrations are cleaned up. It does not discover actual legacy rows on deployment targets.

## 2. Browser checks (CMD, separate terminal)

The browser suite starts dedicated Vite/API processes on ports 43171/43170. Use the seeded test database at 55433, the same original seed password, and a test-only session secret. Keep this terminal separate because DATABASE_URL intentionally points to the test database for the browser server; E2E_APP_DATABASE_URL retains the separate app database used by the safety guard.

```cmd
set "NODE_ENV=test"
set "E2E_APP_DATABASE_URL=postgresql://regmeup_app:regmeup-local-only@127.0.0.1:55433/regmeup_dev"
set "TEST_DATABASE_URL=postgresql://regmeup_app:regmeup-local-only@127.0.0.1:55433/regmeup_test"
set "DATABASE_URL=%TEST_DATABASE_URL%"
set "SESSION_SECRET=lab7-local-browser-test-secret-at-least-32-characters"
```

Set `SEED_PASSWORD` locally to the original test seed password. Do not capture it in screenshots. If Chromium is not installed, run `npx playwright install chromium` first. Then run:

```cmd
git rev-parse HEAD
npx playwright test e2e/f-02.spec.ts --reporter=list,html
```

The file now has 15 cases (the original 11 plus 4 Lab7 cases); it updates the old expected capacity message. The new cases exercise actual API/DB behavior: successful publication at 1/30/60 followed by reload and anonymous retrieval, and inline rejection/focus/preservation at 61 with zero publication requests and zero matching DB rows. Successful boundary cases and the invalid case attach screenshots to the Playwright report. Fixture events are removed after the suite.

The passing rerun attachments are now copied as `10-ui-capacity-1.png`, `11-ui-capacity-30.png`, `12-ui-capacity-60.png`, `13-ui-capacity-61-error.png`; its terminal summary is `14-ui-test-summary.png`. No additional UI capture is required for these cases. Open `npx playwright show-report` to inspect the original attachments if needed. Do not commit the generated report folders or credentials. Source provenance is recorded in the main evidence record; these changes were not yet committed during execution.

## 3. Read-only legacy inventory

The local test inventory succeeded at `2026-11-26 14:40:09.077566+00`: database `regmeup_test`, 0 events above60, 0 detail rows, COMMIT shown. The capture is saved as `15-legacy-inventory-local.png`; no rerun is needed just to name the image. The earlier `regmeup_dev` attempt failed because `events` does not exist there; this is NOT a zero-row app/deployment inventory. To reproduce the local test inventory, use:

```cmd
docker compose -p lab6-capacity-regression exec -T postgres psql -v ON_ERROR_STOP=1 -U regmeup_app -d regmeup_test < docs\evidence\lab7\legacy-capacity-audit.sql
```

Capture the result as `15-legacy-inventory-local.png`, including timestamp/database identity and counts. Zero rows means this test database has no matching legacy events after fixture cleanup; synthetic integration tests still prove the compatibility behavior. For a deployment target, identify the authorized target/environment explicitly and record its actual inventory separately. Do not describe this test-database audit as an app/deployment audit. The SQL contains a read-only transaction and no mutation.

## 4. Compile/build checks

User supplied captures for `npm run typecheck` and `npm run build` are now saved as `16-typecheck.png` and `17-build.png`: no TypeScript/npm errors shown; Vite build and Prisma generation complete. Captures do not display numeric exit codes or returned prompts; retain the terminal completion status when available. These commands have not been rerun by the assistant.
