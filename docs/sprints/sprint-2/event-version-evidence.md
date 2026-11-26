# Shared events.version prerequisite

26 November 2026, Asia/Bangkok. Refs #40/#42/#43. **Locally verified prerequisite candidate; peer review/staging merge pending.** This is not F-06/F-09 feature completion or an accepted deployment.

## Ownership and implementation

The user explicitly reassigned the missing version prerequisite to Kittithat (JeffMerry) in chat: "ให้คุณทำ prerequisite PR แยก". Thanatip (THN4) reviews this prerequisite and retains F-09/Instructor schema and combined migration coordination. This reassignment supersedes only the earlier events.version allocation in planning #51; it does not claim peer approval of the code.

Base: `bd8bf1a97a53e30eaa60a5a0a689b13af0e0f149`, staging after F-05 PR #57 merged. Branch: `codex/sprint-2-event-version`. GREEN schema/migration commit: `986760315be37fbc3dd3981fb87f0150592b7267`.

- Prisma `Event.version Int @default(0)`.
- New migration `20261126010000_event_version`: one atomic ALTER adds INTEGER NOT NULL DEFAULT0 and CHECK version>=0.
- Existing migrations, event IDs/metadata, legacy capacities, users/password hashes, registration/history, sessions, DTOs and runtime endpoints are preserved. No migration is rewritten and no reset/seed is required.
- No automatic trigger increments the version. F-06/F-09 implement that behavior under their shared lock protocol; this foundation only supplies the column/constraint/default.

## Actual test-first and verification

RED `3d0e5e0fe0819eb919df4b8878a34519a8c754ab`, at20:43:47: `npm exec --workspace server -- vitest run tests/integration/event-version.test.ts -t "installs a non-null integer revision"` → **1 failed / 2 skipped**, expected integer/non-null/default0 column metadata, received no column. The connection/test guard worked. This is schema-prerequisite RED, not proof of F-06 endpoint conflict behavior.

Environment: Node22.23.4/npm10.9.9, PostgreSQL17.11, existing loopback-only disposable native cluster port55442, separate guarded app/test databases with UTC connections. Initial restart omitted the cluster's explicit port options and failed to bind; corrected before RED. A separate F-06 unit attempt had sandbox EACCES on loopback, then passed when rerun with permission. Neither environment error is business-rule RED. No production database was used. Logs/hash-only preservation snapshot stay in ignored `tmp/`.

| Executed check | Result |
|---|---|
| `npm run db:generate` | Passed |
| `npm run db:migrate` on app then test, then repeated on test | Both applied the new migration; repeat reported no pending migrations; history preflight passed |
| Before/after hash-only snapshots of users/events/registrations/sessions on both DBs, excluding only new events.version | Identical; all existing event versions0; no plaintext rows/passwords printed or stored in snapshot |
| `npm run test:integration` | **61 passed / 7 files**, including3 new foundation cases; start20:47:15, duration16.55s |
| `npm run test:unit` on prerequisite branch | **55 passed / 8 files** |
| `npm run typecheck`; `npm run build`; `git diff --check` | Passed |

New executable checks: [`event-version.test.ts`](../../../../server/tests/integration/event-version.test.ts). They assert installed type/default/non-null and an existing synthetic row; new-event default, negative/null constraint rejection, conditional stale update affecting zero rows; and the exact migration SQL applied to a temporary old-schema events table retaining legacy capacity100, UUID/title/time. Transactions roll back; no shared rows are globally deleted. The migration rehearsal uses a connection-local temporary table, not a second migration of the shared test table. Runtime/API version enforcement and concurrent feature writes remain F-06/F-09 tests, not established by this schema test.

Initial CI run45834020724 passed migrations/unit55/integration61/typecheck/build, then browser42 passed/1 failed: F-05 pending test read the request counter before the CSRF bootstrap had dispatched its POST (expected1, received0). The test now observes the intercepted POST before checking the gated pending state and keeps its duplicate-submit assertions; no production behavior changes. This timing failure is not version-migration RED. Updated CI/browser/Docker results are tracked in the prerequisite PR. Human acceptance, cloud migration/restart and deployment are pending. The local PostgreSQL cluster is stopped after verification with its data retained.

## Handoff to F-06 and F-09

1. Obtain substantive THN4 review and merge this prerequisite into `sprint/02-staging`; both feature branches take that reviewed staging commit.
2. Reuse this migration/Prisma field. Do not add another version column, edit applied migrations or introduce version in public event DTOs.
3. Use `withEventWrite(..., { eventId, scope: 'schedule' }, ...)`: schedule mutex334/2, then event row. Inside the callback, check owner before revealing private state/version, compare expectedVersion to the locked row, sample the server clock, validate, then mutate atomically.
4. Increment version exactly once for a real allowed event/assignment change; valid no-op leaves it stable. Stale callers receive409 EVENT_CHANGED. F-03/F-05 registration/cancellation keep their existing event-row lock and do not increment the management version.
5. F-09 supplies assignment schema and shared overlap checks; F-06 time edits must integrate those checks before exposing updates on assigned events. Preserve the same mutex/order for cross-event races.

## F-06 work preserved separately

`feature/f-06-event-management` retains RED `c0cb1ad` → GREEN `fde153f`: 24 pure edit-rule cases (79 total unit tests including regression) and passing typecheck. Explicit capacity61 RED is distinct from this schema RED. No F-06 handler/UI is exposed by either that rule preparation or this prerequisite. Deadline migration, real access/API/DB races, Instructor integration, browser/restart and accepted release verification remain to be implemented/executed.
