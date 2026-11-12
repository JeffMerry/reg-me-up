# F-01 — initial implementation verification

Local verification on 12 November 2026, Asia/Bangkok. The implementation tested corresponds to the working tree subsequently committed as `2a9fc27` (backend `4ab8c17`). This is an initial record, not a claim that F-01 or its acceptance groups are complete.

| Check | Actual result |
|---|---|
| `npm --prefix server run build` and `npm --prefix client run build` | Passed after implementation changes. |
| `npm --prefix server run test:unit` | 4 files, 16 tests passed. These are foundation unit tests, not the full F-01 security/UI suite. |
| `npm --prefix server run test:integration` | 2 files, 17 tests passed against a separate local PostgreSQL 17.11 cluster, using an application database, marked test database, applied migration and synthetic seed. The cluster was stopped afterwards. |
| F-01 integration coverage | Seven tests cover Participant login, SID/CSRF rotation and logout replay; invalid credentials, CSRF, Origin and extra fields; eight-hour boundary with injected clock; Organizer login and reauthentication; current role reread from the database; malformed, oversized and non-JSON transport; and distinct Argon2id hashes for two synthetic seed accounts. The last two tests and expanded validation assertions were run in the working tree after `2a9fc27`. |

Initial integration run failed two foundation tests because the new test database had not been seeded. After seeding, a further run exposed interference between the parallel foundation and F-01 fixtures; the F-01 test email domain was isolated and the final run above passed. These failures are retained here rather than represented as an uninterrupted pass.

At the initial run, API field boundaries, role middleware, store failures and UI navigation still needed additional checks; follow-up results are below. F-02–F-04 endpoint authorization and ownership checks do not yet exist. TEST-01, TEST-02, TEST-09, TEST-12 and TEST-14 are not claimed as complete, and no teammate review or approval of this feature is asserted.

## Follow-up on 12 November 2026

The following checks ran on the subsequent working tree (their test and UI changes are committed after `1243026`):

| Check | Actual result and scope |
|---|---|
| `npm --prefix server run test:unit` | 5 files, 19 tests passed, including HTTP tests of the shared role guards and injected session-store read/destroy failures using a test-only in-memory store. The destroy failure returns an error without clearing the cookie or claiming logout succeeded. |
| `npm --prefix client run build`, `npm --prefix server run build` | Both passed after the UI changes. |
| `npx playwright test e2e/f-01.spec.ts` | 8/8 passed in headless installed Chrome 157.0.8103.40 against real Express, Vite and a separately marked PostgreSQL 17.11 test database. Checks cover validation, both roles, safe return, failed/successful logout, Back, wrong-role denial, and mobile menu/no page overflow at 320/390/1440px. Expiry UI uses an intercepted 401; actual boundary is covered by the separate clock-injected API test. The local browser and test database services were stopped after the run. |

The first follow-up runs used Node 22.15.0 and npm 11.5.2; the unit and browser suites were then rerun with the repository targets Node 22.23.4 and npm 10.9.9, again passing 19/19 and 8/8 respectively. The follow-up builds above used the former versions. Browser startup initially failed because port 3000 was occupied, then because the Playwright-managed Chromium revision was absent; the test was configured to use isolated ports and the locally installed Chrome. A later 8-case run had 7 passes and one failure because the test navigated before login finished; waiting for the successful redirect resolved that test race. The final results above are subsequent runs, not a claim the earlier attempts passed.

The checks above did not yet cover all API field boundaries, log/secret checks, or selected accessibility and pending/network UI states. Follow-up results are below. Public event detail content and feature-specific authorization/ownership require F-02–F-04. The above outcomes do not by themselves mark entire TEST-01/02/09/12/14 groups or F-01 as complete.

## PR preparation verification

On 12 November 2026, the working tree subsequently committed as `df360ad5a02544f37944ae63430aa14243a45239` was tested with Node 22.23.4, npm 10.9.9, PostgreSQL 17.11, and headless installed Chrome 157.0.8103.40. `npm run build` and `npm run typecheck` passed; `npm run test:unit` passed 19/19; `npm run test:integration` passed 19/19; `npx playwright test e2e/f-01.spec.ts` passed 10/10. PostgreSQL used separate application/test databases and a verified test-only marker; the temporary server was stopped after testing.

New checks cover the 254/255-code-point email boundary, 1024/1026-byte UTF-8 password boundary, untrimmed passwords, email normalization, and the absence of the synthetic password, its stored hash and session secret from tested auth response bodies and captured application console logs. Browser checks cover pending disabled login, a simulated failed network request, preserved email, and keyboard operation. CSRF tokens and cookies are intentionally returned by their designated endpoints; this targeted check is not a general security audit or proof about every possible log source.

F-02–F-04 authorization/ownership and real event-detail content remain dependent on those features. Complete TEST-09/14 and full-product TEST-13 remain open, as do teammate review and any manual UI/accessibility checks not explicitly recorded here. The UI expiry check simulates a 401; actual eight-hour expiry is verified independently with the injected backend clock. No prior reviewer approval or unexecuted manual result is claimed.

The seed now generates a distinct salted hash for each newly created synthetic account; existing accounts are intentionally left unchanged by the idempotent upsert, including any previously created hashes. A fresh isolated database is needed to verify newly seeded accounts without changing existing passwords.
