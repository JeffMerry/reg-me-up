# F-01 — initial implementation verification

Local verification on 12 November 2026, Asia/Bangkok. The implementation tested corresponds to the working tree subsequently committed as `2a9fc27` (backend `4ab8c17`). This is an initial record, not a claim that F-01 or its acceptance groups are complete.

| Check | Actual result |
|---|---|
| `npm --prefix server run build` and `npm --prefix client run build` | Passed after implementation changes. |
| `npm --prefix server run test:unit` | 4 files, 16 tests passed. These are foundation unit tests, not the full F-01 security/UI suite. |
| `npm --prefix server run test:integration` | 2 files, 17 tests passed against a separate local PostgreSQL 17.11 cluster, using an application database, marked test database, applied migration and synthetic seed. The cluster was stopped afterwards. |
| F-01 integration coverage | Seven tests cover Participant login, SID/CSRF rotation and logout replay; invalid credentials, CSRF, Origin and extra fields; eight-hour boundary with injected clock; Organizer login and reauthentication; current role reread from the database; malformed, oversized and non-JSON transport; and distinct Argon2id hashes for two synthetic seed accounts. The last two tests and expanded validation assertions were run in the working tree after `2a9fc27`. |

Initial integration run failed two foundation tests because the new test database had not been seeded. After seeding, a further run exposed interference between the parallel foundation and F-01 fixtures; the F-01 test email domain was isolated and the final run above passed. These failures are retained here rather than represented as an uninterrupted pass.

Outstanding: expand API tests for remaining field boundaries, role middleware, session-store failure and logout destroy failure; test UI login, safe return paths, logout/expiry and browser Back at the required viewport and keyboard states. F-02–F-04 endpoint authorization and ownership checks do not yet exist. Consequently TEST-01, TEST-02, TEST-09, TEST-12 and TEST-14 remain partial or NOT RUN at group level, and no teammate review or approval of this feature is asserted.

The seed now generates a distinct salted hash for each newly created synthetic account; existing accounts are intentionally left unchanged by the idempotent upsert, including any previously created hashes. A fresh isolated database is needed to verify newly seeded accounts without changing existing passwords.
