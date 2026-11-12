# F-02 — local implementation verification

On 12 November 2026, the initial F-02 working tree was checked with Node 22.23.4, npm 10.9.9 and PostgreSQL 17.11 in Docker. The implementation consumes the existing SYS-01 schema and F-01 session/role middleware; no migration was added. Results below are local execution, not teammate review or proof of a completed acceptance group.

| Check | Actual result and scope |
|---|---|
| `npm run build`; `npm run typecheck` | Both passed after the F-02 API and UI changes. |
| `npm run test:unit` | 6 files, 36 tests passed, including F-02 required fields, capacity, dates, Unicode length and pagination validation. |
| `npm run test:integration` | 3 files, 23 tests passed on marked, separate Docker test DB. F-02 cases exercise anonymous published detail/list, hidden exclusion, active-registration seat count, API authorization/CSRF, creation and ownership, and selected ordering/pagination. Synthetic records are scoped to generated users and removed by the test. |
| `npx playwright test e2e/f-02.spec.ts --timeout 30000` | 4/4 passed using installed headless Chrome. Cases cover Organizer publish with optional description, public detail, uncertain publication, expired Organizer session and mobile list error/retry. The latter two error conditions are simulated responses/network failures. |
| Full browser run before final test fix | 13/14 passed: all ten existing F-01 tests and three F-02 tests passed; one F-02 error/retry test failed because React Strict Mode issued a second request after the test simulated only one failure. The test was corrected to hold the failure until retry; the F-02 suite above then passed. An intervening rerun was interrupted while it was slow; no pass is claimed for that interrupted run. |

Still required before declaring F-02 done: complete the full specified TEST-03/11/15 subcases, including the exact 23-event pagination fixture, all field/date boundaries and role/owner negative controls; broaden UI and accessibility/manual checks against UI-02/03/05/06; record peer review. TEST-09/14 shared cases and later F-03 registration behavior are not complete. The existing uncommitted `package-lock.json` change is unrelated and excluded from F-02 work.
