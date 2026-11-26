# Shared Event/schedule lock prerequisite — verification

Version0.1 — 26 November2026 (Asia/Bangkok). Refs #40/#42. Owner Kittithat Disthanakornkun (JeffMerry); different teammate reviewer Thanatip Nitinantakul (THN4). **Implementation candidate tested locally; peer review/staging merge NOT YET RECORDED.** This is shared plumbing, not completed F-05/F-06/F-09 acceptance or Lab7 domain-change evidence.

## Actual version sequence

| Stage | Commit / observation |
|---|---|
| Reviewed planning merge / branch base | PR #51 merged to sprint/02-staging at `eb2ac13e8eec775a8262e87309d39cb4f2e0581f` |
| Test-first scaffold | `8b42682` — helper has existing event-only transaction semantics and a reserved schedule scope, not yet implemented; registration runtime is still unchanged |
| RED | On8b42682 the new schedule test asserts callback must remain outside while another connection holds schedule mutex; actual callback entered (`expected true to be false`),1 failed/44 skipped |
| GREEN / runtime integration | `67de722` — acquire schedule advisory mutex before event row, cast void result for Prisma, scope observer to test pool and use helper in existing registration |
| Evidence revision | This documentation commit records actual local output, not a new runtime change |

The scaffold/RED commit is intermediate work-branch history and must never be deployed. RED proves missing shared schedule serialization in that scaffold; it is not a newly discovered Sprint1 business defect and does not prove F-09 overlap validation is implemented.

## Reproducible environment and commands

Node22.23.4, npm10.9.9, PostgreSQL17.11 from the existing local toolchain. Docker engine was not running. A **new** disposable PostgreSQL cluster was initialized in `tmp/sprint2-locks-pg`, bound to127.0.0.1:55442 with separate regmeup_dev/regmeup_test databases. Existing databases/.env/public deployment were not used. Trust auth is confined to this loopback-only disposable cluster; never use it in a shared deployment.

Applied existing migration through `npm run db:migrate` on each new DB, installed test guard on regmeup_test, and explicitly seeded the standard synthetic fixtures before the full regression. No schema/migration file was added/changed. Supply local test credentials privately; actual env values are not part of this record. The normal README isolated-DB setup/guard is also supported; the new test file is included by the existing integration CI command.

Actual root commands with the pinned toolchain on PATH:

```powershell
# RED on test-first commit; name filter skips other integration cases
npm run test:integration --workspace server -- event-write.test.ts -t "serializes schedule writers"

# GREEN: only the shared-lock suite
npm exec --workspace server -- vitest run tests/integration/event-write.test.ts

# Existing regression + new shared tests
npm run test:integration
npm run test:unit
npm run typecheck
npm run build
```

Temp command wrapper/logs are local working aids, not required application scripts. No environment secrets or new dependencies are required by the helper.

## Actual selected output

RED (console start18:26:23,26Nov2026):

```text
FAIL event-write.test.ts > serializes schedule writers before taking the event lock
AssertionError: expected true to be false
  if (callbackEntered) expect(callbackEntered()).toBe(false);
Test Files 1 failed | 4 skipped (5)
Tests      1 failed | 44 skipped (45)
```

GREEN targeted (console start18:29:01):

```text
Test Files 1 passed (1)
Tests      4 passed (4)
```

Full integration regression (console start18:29:27):

```text
Test Files 5 passed (5)
Tests      45 passed (45)
```

Unit regression:8 files/55 passed,0 failed/0 skipped. Typecheck and application build exited0. No browser/Docker tests were run locally; CI must supply its own evidence. An earlier GREEN attempt had5 failures/40 passes:3 existing-suite failures due to missing synthetic seed/password setup and2 new-test failures from Prisma deserializing PostgreSQL void. These were corrected by seeding the new disposable databases and casting advisory-lock return to text. They are not counted as the intended RED or hidden as passes. PowerShell initially stopped stderr capture early; the recorded RED rerun above captured the actual assertion/output on the same test-first commit.

## Tests and what they establish

| Test | Setup/assertions |
|---|---|
| Missing/unpublished filtering | Absent/excluded event returns found:false and callback not invoked; private mode may lock unpublished event |
| Row serialization / read visibility | Independent transaction updates capacity and holds lock; pg_locks observer sees this suite's writer waiting; after commit, callback reads committed capacity3 |
| Rollback/release | Callback updates capacity then throws; value unchanged afterwards; independent NOWAIT row lock and pg_try_advisory_xact_lock succeed after rollback |
| Schedule lock order / independence | Independent connection holds key334/2; writer actually waits on advisory lock with callback unentered; blocker can still NOWAIT-lock target event, proving writer has not taken row first; ordinary write on another event finishes; release mutex lets schedule callback run |

Suite pool uses a unique application_name so other concurrent regression tests cannot supply false-positive waiters. Fixtures use UUIDs and the existing safety guard; cleanup only removes this suite's own event/user IDs. Existing41 integration cases remain, including actual HTTP authorization, duplicate/full/last-seat races and rollback tests.

## Handoff interface for F-05/F-06/F-09

`server/src/event-write.ts` exports:

```typescript
withEventWrite(prisma, { eventId, publishedOnly?, scope?: 'event' | 'schedule' }, async tx => result)
// => { found: false } | { found: true, value: result }
```

- Default event mode takes only event row lock. F-03 registration passes publishedOnly:true; F-05 cancellation uses event mode and checks own row/state under lock.
- F-06 event edits and F-09 assign/replace/remove must pass scope:'schedule'. Shared PostgreSQL transaction advisory key is `SCHEDULE_WRITE_LOCK = {namespace:334,key:2}`; do not invent a separate key in F-09.
- Helper applies READ COMMITTED, lock_timeout2s, statement_timeout5s, maxWait5s and transaction timeout10s. Mutex comes before event lock. Ordinary event writers never acquire schedule mutex while holding an event lock.
- Authenticate/validate request before entering helper, then revalidate resource ownership/state and sample decision time inside callback **after locks**. Use only callback tx for DB reads/writes, never the root Prisma client/a second connection. Existing response/error handling remains with caller.
- Helper provides serialization, not Instructor overlap queries, cancellation state changes, deadline enforcement or version/schema migration. Those remain with their feature owners; shared schema/version remains Thanatip's responsibility.

## Outstanding gate

Open reviewed PR into sprint/02-staging and verify fresh CI on its head. Thanatip reviews the key/interface/lock order and registration preservation before merge. Afterwards feature branches start from staging containing reviewed prerequisites; shared schema/version foundation remains a separate peer-owned prerequisite. No merge, feature acceptance, main release or public deployment is claimed here.
