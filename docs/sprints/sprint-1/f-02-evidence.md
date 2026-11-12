# F-02 — local implementation verification

On 12 November 2026, the initial F-02 working tree was checked with Node 22.23.4, npm 10.9.9 and PostgreSQL 17.11 in Docker. The implementation consumes the existing SYS-01 schema and F-01 session/role middleware; no migration was added. Results below are local execution, not teammate review or proof of a completed acceptance group.

| Check | Actual result and scope |
|---|---|
| `npm run build`; `npm run typecheck` | Both passed after the F-02 API and UI changes. |
| `npm run test:unit` | 6 files, 36 tests passed, including F-02 required fields, capacity, dates, Unicode length and pagination validation. |
| `npm run test:integration` | 3 files, 23 tests passed on marked, separate Docker test DB. F-02 cases exercise anonymous published detail/list, hidden exclusion, active-registration seat count, API authorization/CSRF, creation and ownership, and selected ordering/pagination. Synthetic records are scoped to generated users and removed by the test. |
| `npx playwright test e2e/f-02.spec.ts --timeout 30000` | 4/4 passed using installed headless Chrome. Cases cover Organizer publish with optional description, public detail, uncertain publication, expired Organizer session and mobile list error/retry. The latter two error conditions are simulated responses/network failures. |
| Full browser run before final test fix | 13/14 passed: all ten existing F-01 tests and three F-02 tests passed; one F-02 error/retry test failed because React Strict Mode issued a second request after the test simulated only one failure. The test was corrected to hold the failure until retry; the F-02 suite above then passed. An intervening rerun was interrupted while it was slow; no pass is claimed for that interrupted run. |

## Additional boundary and pagination checks

At test commit `7475e0d8777cc8f2c5f57c2bf210f385398e74c6`, `npm run test:unit` passed 38/38 and `npm run test:integration` passed 24/24 on the same isolated PostgreSQL 17.11 setup. New cases exercise valid exact limits, invalid over-limit/blank text, optional null description, past and overnight offsets, and pagination using 23 additional published events with tied timestamps. Existing seeded published events remain in that database, so this is not the STS fixture of exactly 23 published events overall; the test checks the actual baseline plus 23 and also verifies an Organizer page of 20 plus 3.

At test commit `27071d8ca426c6308a2d489b162ac19f513bd6b9`, `npm run typecheck` passed, `npm run test:integration` passed 25/25, and `npx playwright test e2e/f-02.spec.ts` passed 5/5. The new API test verifies that missing/invalid required fields, descriptions, dates and capacity values produce validation errors without inserting rows. The new browser assertions verify that an Organizer can find a newly created event in My Events and that cancelling a changed form asks before discarding it.

At test commit `49870a64330cc06e914a84252463d000d677136b`, `npm run test:integration` passed 27/27 and `npm run typecheck` passed. Additional database/API cases verified omitted/null/empty/whitespace descriptions, valid maximum-length fields, a past overnight event with offset conversion, and public visibility of a full event without registrant information.

## Ready-for-review checks

On 12 November 2026, the work subsequently committed as `3a2c6c52ba86a9cbd87586533f7e181786ec0b54` was checked locally with Node 22.23.4/npm 10.9.9 and the separated PostgreSQL 17.11 Docker databases. `npm run build` and `npm run typecheck` passed, `npm run test:unit` passed 38/38, `npm run test:integration` passed 28/28, and `npx playwright test e2e/f-02.spec.ts` passed 11/11 using installed Chromium headless shell revision 1234. The browser tests were run before the final correction to the integration-test helper; the UI/application code and browser tests were unchanged after that run. These are local results, not teammate review.

New API tests exercise two Organizers with separate owned events, spoofed ownership, incorrect token/Origin, missing event IDs and unchanged row counts on rejected requests. Browser tests cover invalid form values and focus, pending submission, returned validation errors, empty and error states, and long event title/location visibility at 320/390/1440px. `overflow-wrap: anywhere` was added so long unbroken content can wrap. Response/network failure cases are simulated; actual authorization and persistence are also checked in the API/database tests.

During this follow-up an integration run failed 6/28 because a newly edited test helper did not send its request body; the helper was corrected and the 28/28 run above is the subsequent result. Earlier attempts to check long text using Chrome were interrupted while the runner was unresponsive and are not counted as completed results. The first long-text test checked only page overflow; it was strengthened to check the text's own scroll width and screen bounds before the successful Chromium run.

The final application/test working tree, committed as `3c401a2d909fdb58b5fd0e1796b0b248ca563cc1`, was then checked after adding desktop My Events table/mobile cards and loading skeletons. On the same Node/npm and isolated Docker PostgreSQL setup, `npm run build`, `npm run typecheck`, `npm run test:unit` (38/38), `npm run test:integration` (28/28), and `npx playwright test` (21/21 across F-01 and F-02) passed. The browser used installed Chromium headless shell revision 1234. The browser exercises selected flows, including the new My Events table, but does not replace a complete manual accessibility review or the exact 23-total public pagination fixture.

Still required before declaring F-02 done: complete any remaining TEST-03/11/15 subcases, including the exact 23-total public fixture; broaden UI and accessibility/manual checks against UI-02/03/05/06; and record peer review. Relevant Organizer role/owner negative controls were checked above, but the full cross-feature TEST-09/14 matrix and later F-03 registration behavior are not complete. The existing uncommitted `package-lock.json` change is unrelated and excluded from F-02 work.
