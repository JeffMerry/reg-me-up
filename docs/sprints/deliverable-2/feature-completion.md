# Feature AC completion and remaining acceptance

27 November 2026 (Asia/Bangkok). Refs #45. Source runtime integrated through `7c85dcc3e762c7f2be62a2285264af8aa4f9a972`. **C69** refers to the [actual CI checkout/results](ci-excerpt.md). `I/` means `server/tests/integration/`; `E/` means `e2e/`. PASS applies to the named automated selections. Final accepted main release is **TBD for every row**; neither a reviewed staging merge nor suite total closes release/human checks.

## Sprint 2

| Feature / AC | Implementation | Executed verification / actual result | Accepted release / remaining scope |
|---|---|---|---|
| F05 AC01 / T05-01 | `server/src/registrations.ts` and registration reads, persisted status/time and seat return | `I/cancellation.test.ts`: own ACTIVE cancellation, saved history/list/detail/count; PASS C69 | Main TBD; final deployed journey |
| F05 AC02 / T05-02 | Trusted post-lock time before startsAt | Same file: start−1/0/+1ms and lock-wait clock; PASS C69 | Main TBD; deployed rejection evidence |
| F05 AC03 / T05-03 | Repeat/no-op with original timestamp; old ID cannot cancel replacement | Same file: sequential/concurrent repeats, retained timestamp/new ID; PASS C69 | Main TBD |
| F05 AC04 / T05-04 | Re-register with new ID before effective cutoff, preserve cancelled row | Cancellation file plus `I/sprint2-acceptance.test.ts` G01 at deadline−1/0/+1ms; PASS C69 | Main TBD; selected combined demo |
| F05 AC05 / T05-05 | Participant/own-registration/CSRF/Origin/validation enforcement | Cancellation matrix; Instructor forbidden in `I/instructor.test.ts`; PASS C69 | Main TBD; final direct API evidence |
| F05 AC06 / T05-06–07 | History UI/reload/restart; shared lock seat/uniqueness integrity | Cancellation race/rollback/new-process cases; `I/event-management.test.ts` actual capacity/cancel; `E/f-05.spec.ts`10 cases; PASS C69 | Main TBD; final human accessibility/cloud persistence; explicit two-new-registrants-after-cancel selection not established by historical helper test alone |
| F06 AC01 / T06-01 | `server/src/event-management.ts`, `client/src/EditEvent.tsx`: partial edit/read/version/null/omission | Management API partial/no-op/null/legacy, browser reload; PASS C69 | Main TBD; final demo |
| F06 AC02 / T06-02 | Effective nullable deadline; server cutoff/duplicate precedence | Management explicit−1/0/+1ms/null/past/invalid deadline; acceptance G01; PASS C69 | Main TBD; deployed cutoff evidence |
| F06 AC03 / T06-03 | Explicit integer1–60, capacity>=ACTIVE | Management/unit1/60/invalid61/below/equal ACTIVE; PASS C69 | Main TBD |
| F06 AC04 / T06-04 | Omitted legacy capacity retained; no forced truncation | Management legacy100/no omission loss and explicit invalid rejection; PASS C69 | Main TBD; actual production inventory separate |
| F06 AC05 / T06-05 | Owner/session/CSRF/validation/version/start rejection, no partial write | Management denial/no-op/stale/start; Instructor denied in Instructor suite; PASS C69 | Main TBD |
| F06 AC06 / T06-06 | Schedule mutex→event lock with serialized revision/time and atomic rollback | Management observed edit/edit, deadline/register, capacity/register both orders, cancel and rollback; PASS C69 | Main TBD; final combined run pending |
| F06 AC07 / T06-07–08 | Assigned Instructor overlap guard/current read plus edit UI and persistence | `I/instructor.test.ts` assign-vs-edit/overlap; acceptance G03 adjacent success/1ms rejection; management app restart; `E/f-06.spec.ts`10 cases; PASS C69 | Main TBD; human/cloud checks |
| F09 AC01 / T09-01 | `server/src/instructors.ts`: owner assigns valid Instructor; stable no-op | `I/instructor.test.ts` assignment/current/version/history; acceptance same-event race; PASS C69 | Main TBD |
| F09 AC02 / T09-02 | Atomic replacement/removal/history/version and former Instructor denial | Instructor lifecycle plus acceptance removal−1/0/+1ms/stale/no-op and forced replace/remove rollback; PASS C69 | Main TBD |
| F09 AC03 / T09-03–04 | Role/FK/one current/overlap guard serialized with F06 schedule writes | Pure schedule6 cases, Instructor assign-vs-edit; acceptance assign-vs-assign/same-version/rollback/adjacency; PASS C69 | Main TBD |
| F09 AC04 / T09-05 | Instructor identity lifecycle and current teaching list/detail | Instructor session/logout/expiry/read-only safe21-row paging; F09/acceptance browser error/empty; PASS C69 | Main TBD; equal-start teaching tie not applicable to valid overlapping-rejecting assignments, documented disposition |
| F09 AC05 / T09-06 | Owner-only mutations, current Instructor reads, denied other private operations | Instructor and acceptance anonymous/role/non-owner/unassigned/removal/CSRF/DTO matrices; PASS C69 | Main TBD; final forbidden-operation demonstration |
| F09 AC06 / T09-07 | Persisted assignments and additive migration/provision compatibility | Acceptance G02 new app process without reseed; Instructor migration/demo/seed preservation; PASS C69 | Main TBD; actual redeploy checks NOT RUN |
| F09 AC07 / T09-08 | Owner assignment and Instructor teaching UI, pending/errors/conflict/expiry | `E/f-09.spec.ts`5 cases plus `E/sprint2-acceptance.spec.ts`11 selections; PASS C69 | Main TBD; human keyboard/screen-reader; non-blocking callback synchronization debt |

These rows reconcile implemented behavior and executed selections. They do not declare whole-feature acceptance where a selected STS subcase, final candidate journey or human/deployment check remains open. See the original [F05](../sprint-2/f-05-evidence.md), [F06](../sprint-2/f-06-evidence.md), [F09](../sprint-2/f-09-evidence.md) and [acceptance](../sprint-2/acceptance-evidence.md) records for history and limits.

## Sprint 3

| Feature / AC | Implementation and executed selection | Result / version | Remaining acceptance |
|---|---|---|---|
| F07 AC01 / T07-01 | Saved eligible attendance201, actor/time, authorized read and unchanged event/seat state | PASS C69; `I/check-ins.test.ts` | Main/redeploy/demo pending |
| F07 AC02 / T07-02 | Six start/end offsets and two observed-lock time crossings | PASS C69 | Final server-time rejection demo pending |
| F07 AC03 / T07-03 | Concurrent same-ID201/200 with identical attendance, repeat at end preserves original | PASS C69 | Final accepted source pending |
| F07 AC04 / T07-04 | Cancelled old ID/foreign/missing/forged/invalid requests, no writes | PASS C69 | Final rule-rejection demo pending |
| F07 AC05 / T07-05 | Anonymous/role/owner/expiry/CSRF/Origin/DTO assertions | PASS C69 | Final direct API demonstration pending |
| F07 AC06 / T07-06 | Shared cancel/edit/check-in lock ordering, start crossing, deferred rollback, bounded503 | PASS C69 | Final integrated candidate run pending |
| F07 AC07 / T07-07 | New app process reads same attendance;21 tied roster rows; additive migration constraints and old-data preservation | PASS C69; `I/attendance-migration.test.ts` included | Actual cloud restart/redeploy NOT RUN |
| F07 AC08 / T07-08 |14 browser cases: confirmation/pending/unknown/error/stale/window/expiry/private state/layout | PASS C69; `E/f-07.spec.ts` | Human keyboard/Escape/screen-reader incomplete; callback synchronization improvement open |
| F08 AC01 / T08-01 | Empty/mixed fixtures: exact distinct registered/cancelled/attended people sets | NOT IMPLEMENTED / NOT RUN | Implement query/known dataset and UI |
| F08 AC02 / T08-02 | Repeated histories/joins cannot inflate counts; ACTIVE excluded from cancelled | NOT IMPLEMENTED / NOT RUN | Implement lifecycle/count tests |
| F08 AC03 / T08-03 | Before/during/after check-in and concurrent writes: consistent snapshot, attended<=registered | NOT IMPLEMENTED / NOT RUN | Implement trusted persisted snapshot calculation |
| F08 AC04 / T08-04 | Owner-only report access contract | NOT IMPLEMENTED / NOT RUN | Direct session/role/non-owner API tests |
| F08 AC05 / T08-05 | Distinct-person21+ pagination/tied names; totals match same snapshot | NOT IMPLEMENTED / NOT RUN | Pagination/count consistency tests |
| F08 AC06 / T08-06 | Contract covers saved retrieval and UI states | NOT IMPLEMENTED / NOT RUN | Restart/UI/error/responsive/keyboard verification |

F07 owner roster summary is implemented check-in functionality and is not evidence that F08 is complete. Full [F07](../sprint-3/f-07.md), [F08](../sprint-3/f-08.md) and [STS](../sprint-3/sts.md) remain authoritative for exact AC wording.
