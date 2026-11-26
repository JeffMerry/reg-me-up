# Sprint 2 Software Test Specification

Version0.3 — 26 November2026. Refs #40–#43/#51. **F-05 local verification recorded below; F-06/F-09 and integrated release cases remain NOT RUN.** [Ownership/review record](review-record.md): Kittithat owns F-05/F-06 and integration race evidence; Thanatip owns F-09/schema/release evidence; the other teammate reviews. Contracts: [F-05](f-05.md), [F-06](f-06.md), [F-09](f-09.md), [shared design](system-design.md). IDs beginning S2- are planned case IDs; only explicit executed mappings establish results.

## Setup, time and database safeguards

Use guarded isolated TEST_DATABASE_URL and separate application DB with the existing identity/marker checks. Apply reviewed additive migrations using db:migrate before fixtures; preserve initial migration checksums. Synthetic O1/O2 Organizers, P1/P2/P3 Participants and I1/I2 Instructors, one role each. Credentials injected locally, never printed/committed. Use unique IDs/test-owned records and remove only those records (history before parent rows) in finally; no production reset/seed and no global deleteMany.

Default fixture: event E owned by O1, future startsAt `2030-01-15T02:00:00Z`, endsAt `2030-01-15T04:00:00Z`, capacity2, P1 ACTIVE, version0, deadline null. Inject server now relative to fixture timestamps. Boundary cases use cutoff−1ms / cutoff / cutoff+1ms. DB server time and test host timezone must not define test outcomes accidentally. For lock races synchronize requests/transactions and verify actual waiting with an observer; Promise.all alone does not prove contention.

Every negative API case asserts expected error code/status plus unchanged relevant rows/values/version/history; absence of private fields is asserted using allowlists. Every successful mutation asserts DB and authorized GET result. UI evidence alone cannot prove either condition. Guarded cleanup must survive intentional RED failures.

## F-05 cases

| ID / AC | Level | Input / steps | Expected assertions |
|---|---|---|---|
| S2-T05-01 / AC01 | API+DB | P1 cancels own ACTIVE R before startsAt; read detail/list and owner totals | 200/CANCELLED, cancelledAt decision time; count1→0, remaining1→2, capacity2; only R changed |
| S2-T05-02 / AC02 | Unit + API+DB | Fresh ACTIVE fixtures at start−1ms, start, start+1ms | Success only before; equality/after409 CANCELLATION_CLOSED; no mutation on denial |
| S2-T05-03 / AC03 | API+DB concurrency | Repeat same cancelled ID sequentially and concurrently, including after start; later re-register then cancel old ID | 200/no-op; original timestamp stable, no double seat return; new ACTIVE row unchanged |
| S2-T05-04 / AC04 | API+DB | Cancel then re-register before cutoff; repeat register; try after effective cutoff with no active row | New UUID with old history preserved; duplicate409/one ACTIVE; closed409/no new row |
| S2-T05-05 / AC05 | API+DB matrix | Anonymous, O1/I1 role, P2 owns other row, missing/invalid UUID, forged body fields, bad CSRF/Origin | 401/403/404/422 as contract; no private leakage or row change |
| S2-T05-06 / AC06 | API+DB concurrency | capacity1/full E: cancel vs two waiting registrations; duplicate cancel vs capacity edit; force rollback | final ACTIVE<=capacity, unique pair, at most one new seat winner as lock order permits; rollback/no partial history |
| S2-T05-07 / AC06 | Browser + process/manual | Confirm/cancel modal, pending, unknown response, reload then app restart keeping DB; own history and owner totals | Real status/history survive; no fake success/stale totals; keyboard/focus/expiry/responsive pass, manual checks labeled |

## F-06 cases

| ID / AC | Level | Input / steps | Expected assertions |
|---|---|---|---|
| S2-T06-01 / AC01 | Unit/API+DB | O1 reads edit DTO and PATCHes one field then multiple with expectedVersion; omit fields; explicit description/deadline null | 200 and GET/DB values; omissions unchanged; version increments once on real change, no-op stable; invalid null rejected |
| S2-T06-02 / AC02 | Unit/API+DB | Available E before/exact/after explicit cutoff; null cutoff at start; past deadline update; deadline>start; duplicate with cutoff closed/full | before201; exact/after409 REGISTRATION_CLOSED; invalid deadline422; own ACTIVE duplicate409 ALREADY_REGISTERED, no new row |
| S2-T06-03 / AC03 | Unit/API+DB | Explicit capacities1,60 with eligible counts;0,61,1.5,"60",null/boolean; active35 then edit35/34 | Approved bounds1/60 accepted; invalid422;35 accepted/full,34 conflict/no writes; GET capacity preserved |
| S2-T06-04 / AC04 | API+DB migration/legacy | Create controlled legacy E capacity100 in isolated DB under reviewed retained constraint, with ACTIVE0 or>60; PATCH title omitting capacity, then explicit100 or60 | Omitted preserves100; supplied out-of-range422; below ACTIVE409; no truncation; old IDs/reads preserved. Legacy policy confirmed; actual audit/migration verification still required |
| S2-T06-05 / AC05 | API+DB matrix | Anonymous/P1/I1/O2; forged owner/publicationStatus/unknown field; stale/missing version; current start reached/proposed past start | 401/403/404/422; stale409 EVENT_CHANGED; started409 EVENT_STARTED; proposed past start422; no partial mutation/leak |
| S2-T06-06 / AC06 | API+DB synchronized concurrency | Edit capacity vs last-seat register/cancel; deadline update vs register; two writes same expectedVersion; lock crosses cutoff; intentional rollback | Results match locked state/clock; count<=capacity; only one same-version change; sampled time after wait; fields/version atomic |
| S2-T06-07 / AC07 | API+DB scheduling | E assigned I1; edit into overlap with another I1 event; adjacent interval; race time edit vs assign on other event | Conflict409 or valid adjacency; schedule mutex prevents final overlap; no metadata leaked and rollback preserves both events |
| S2-T06-08 / AC07 | Browser/process/manual | Edit partial form/validation/stale-version reload/session expiry; public closed state; restart and retrieve edits | Values persist; UI not authority for cutoff; no silent overwrite/automatic mutation retry; keyboard/focus/320/390/1440 states |

## F-09 cases

| ID / AC | Level | Input / steps | Expected assertions |
|---|---|---|---|
| S2-T09-01 / AC01 | API+DB | O1 assigns I1 on future E; repeat current assignment with latest version; read owner DTO | One current row and version increment once; repeat no extra history; exact assignee data retrieved |
| S2-T09-02 / AC02 | API+DB | Replace I1→I2 then remove; repeat remove; read using I1/I2; test stale version/started event | Old rows ended once; removal null/current none; former assigned reads404; no-op stable; conflicts no changes |
| S2-T09-03 / AC03 | Unit/API+DB | Missing/wrong-role assignee; overlap1ms/containment/equal/adjacent event ranges; history-ended assignment | Safe422; overlap409 INSTRUCTOR_UNAVAILABLE; adjacency allowed; historical ended row does not block |
| S2-T09-04 / AC03 | API+DB synchronized concurrency | Assign same I1 concurrently to two overlapping E; assignment vs F-06 time edit; same event competing version | At most one conflicting mutation commits; no overlap or >1 current assignment; rollback/history/version consistent |
| S2-T09-05 / AC04 | Auth/API+DB | I1 login/me/logout/expiry; own list with21+ assigned fixtures split20+1, ties; empty I2; detail old/unassigned | Correct role/session lifecycle; deterministic startsAt/id order; no duplicate/missing items; current-only DTO and safe404 |
| S2-T09-06 / AC05 | API+DB full access matrix | Anonymous/P1/I1/O2 call owner directory/assign/remove; I1 call publish/edit/register/cancel/private registrants; public reads | Safe401/403/404, no writes/leaks; Instructor public reads200; exact allowlists; mutation CSRF enforcement |
| S2-T09-07 / AC06 | DB/process/manual | Apply migrations on pre-change DB; repeat apply; provision synthetic Instructor twice without resetting passwords; restart/retrieve | Old data/hash/history unchanged; new data survives; no seed on startup; private credentials not in logs. Actual cloud check separately under #45 |
| S2-T09-08 / AC07 | Browser/manual | Owner assign/replace/remove and I1 teaching navigation; empty/error/pending/conflict/expiry; narrow/keyboard/deep-link | Persisted results and safe navigation; no private cache flash; read retry distinct from empty; manual portions labeled |

## RED/GREEN and regression selection

For each feature, review test design then add an executable intended-behavior test before production implementation. Select a meaningful RED (cancel state/seat return, deadline rejection or capacity edit invariant, Instructor assignment/access), with valid fixture/routes when appropriate; a missing import, syntax error or broken test DB is not domain RED. Preserve exact tested implementation base plus test commit and failing assertion, then same test/command on GREEN commit. Runtime route absence alone should be strengthened with a behavior assertion once the minimal route scaffold exists; do not claim a compile/fixture failure proves the domain rule.

Existing regression includes server unit suites, events.test.ts registration/published/owner cases, auth/session/hash/CSRF tests and browser F-01–F-04. Explain legitimate revisions: new cutoff changes formerly allowed post-start registration; new public cutoff/cancelledAt DTO fields change exact allowlists; cancelled history changes own-list scenarios. Preserve positive/negative controls and rule invariants; do not delete old assertions to conceal failures. Lab7 create capacity61 RED belongs to Lab7, not evidence of new Sprint2 workflow.

Root commands (F-05 actual execution is recorded below; other features remain planned):

```powershell
npm run typecheck
npm run build
npm run test:unit
npm run test:integration
npx playwright test
```

Integration/browser commands require the existing README guarded isolated DB/server setup. Record actual selected file/filter names after tests exist; future test IDs do not imply a runnable file. Pin versions to lockfile/README and report actual runtime versions.

## Execution register (fill only after running)

| Planned scope | Actual file/test | Command | Result/counts | Tested commit/run/evidence |
|---|---|---|---|---|
| S2-T05-01–07 | `server/tests/integration/cancellation.test.ts`; `e2e/f-05.spec.ts` | `npm run test:integration`; `npx playwright test` | 13 API/DB + 10 browser cases passed locally; explicit deadline, Instructor and real F-06 endpoint contention pending | `6042373`; [exact mappings/RED/GREEN](f-05-evidence.md) |
| S2-T06-01–08 | TBD | TBD | NOT RUN; counts unknown | TBD |
| S2-T09-01–08 | TBD | TBD | NOT RUN; counts unknown | TBD |
| Existing regression | Unit suites, all 6 integration files, browser F-01–F-05 | `npm run test:unit`; `npm run test:integration`; `npx playwright test`; typecheck/build | 55 unit / 58 integration / 43 browser passed; typecheck/build passed | `6042373`; [F-05 evidence](f-05-evidence.md) |
| F-05 migration/restart | Cancellation constraints/old ACTIVE read; new app subprocess, repeat migration | Same integration suite; `npm run db:migrate` | Passed locally; F-06 legacy audit/F-09 migrations/cloud restart NOT RUN | `6042373`; [scope](f-05-evidence.md) |

## Post-deployment checks under #45

Record immutable main SHA→CI/deploy run→image digest→Cloud Run revision and time. Execute selected real create/register/cancel/re-register/owner totals, deadline/capacity rejection and Instructor assignment/denial journeys using authorized synthetic fixtures. Retrieve saved data after restart/redeploy without seed. Capture actual API status/body and authorized reads, not just UI or a green workflow icon. Coordinate public version with Lab7 testers. Generic pipeline health/home smoke alone does not prove these domain paths. Cleanup only specifically authorized synthetic records; do not erase evidence/history silently.
