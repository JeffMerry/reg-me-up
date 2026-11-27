# Current requirements-to-verification matrix

27 November 2026 (Asia/Bangkok). Refs #45. This is the current reconciliation of all **11 FR,13 BR and7 NFR** in [SRS](../../srs.md). It supersedes historical NOT RUN design rows in [central traceability](../../traceability.md) only for the specific automated selections listed here. No requirement is deleted or moved to a later sprint.

## Version and result convention

`C69` = actual successful PR #69 [CI run45990942080](ci-excerpt.md), head `cc55b4a3761d58c04402ac34793a3a44ddfb4204`, checkout `4d4e2740e1ddcf47d1b4dd784c77c70610d99d8a`:93 unit/128 integration/87 browser passed, no failures/skips reported in final summaries. The matching implementation is integrated at staging `7c85dcc3e762c7f2be62a2285264af8aa4f9a972`; an empty runtime/test/config diff from PR head to that staging source was checked locally. This is still historical PR verification rather than a fresh final main acceptance.

Paths below are repository-relative: `I/` = `server/tests/integration/`, `U/` = `server/tests/unit/`, `E/` = `e2e/`. Quoted names identify real test selections inspected in source. PASS means those automated assertions ran in C69, not every possible behavior or the entirety of a cross-cutting NFR. [Latest local candidate attempt](candidate-verification.md) has separate results and limitations.

Baseline S1 `AC-nn/TEST-nn` come from [Sprint1 STS](../sprint-1/sts.md); S2 `Fxx-ACnn/Txx-nn` from [Sprint2 STS](../sprint-2/sts.md); S3 identifiers from [Sprint3 STS](../sprint-3/sts.md).

## Functional requirements

| Requirement | Responsibility / sprint | AC / planned test | Actual file/test selection | Result / version and remaining verification |
|---|---|---|---|---|
| FR-01 | F01 identity /1 | AC01–02/14; TEST01–02/14.B–C | `I/auth.test.ts`: rotates SID/CSRF, logout replay, exact eight-hour boundary, Organizer and current DB role; `E/f-01.spec.ts` | Selected automated PASS C69; final candidate/human session journey pending |
| FR-02 | F02 publication /1 + Lab7 | AC03/14; TEST03/14.E–F | `I/events.test.ts`: Organizer-only publish, capacities1/30/60, invalid no-insert, normalized fields; `U/events-validation.test.ts`; `E/f-02.spec.ts` | PASS C69; final deployed publication1/60/61 pending |
| FR-03 | F02 discovery /1 | AC11/09/14; TEST11/09/14.A | `I/events.test.ts`: published/private DTO exclusion, full events, stable23-row/tied pagination; `E/f-02.spec.ts` | PASS C69; final continuity demonstration pending |
| FR-04 | F03 registration/own retrieval /1 | AC04/09/10; TEST04/09/10 | `I/events.test.ts`: registers Participant and returns only own persisted registration; app restart; `E/f-03.spec.ts` | PASS C69; final main/redeploy continuity pending |
| FR-05 | F04 owner registration list /1 | AC08/09/14; TEST08/09/14.J–L | `I/events.test.ts`: authorizes owner before private paginated read-only snapshot; `E/f-04.spec.ts` | PASS C69; final owner journey pending |
| FR-06 | F05 cancellation /2 | F05-AC01–06; T05-01–07 | `I/cancellation.test.ts`: saved cancellation/seat/history, cutoff/repeat/new-ID/restart; `I/sprint2-acceptance.test.ts` G01 explicit deadline; `E/f-05.spec.ts` | PASS C69 selected AC assertions; [completion table](feature-completion.md); accepted main/UAT pending |
| FR-07 | F06 edits/deadline/version /2 | F06-AC01–07; T06-01–08 | `I/event-management.test.ts`: partial edit/no-op/legacy/validation/deadline/races/restart; `I/instructor.test.ts`: assigned edit overlap; acceptance G03 adjacency; `E/f-06.spec.ts` | PASS C69; final candidate/deployed journey pending |
| FR-08 | F07 owner check-in /3 | F07-AC01–08; T07-01–08 | `I/check-ins.test.ts`: actor/time/persistence/window/idempotence/access/rollback/restart; `I/attendance-migration.test.ts`; `E/f-07.spec.ts` | Implemented, selected automated PASS C69; human/cloud verification pending |
| FR-09 | F08 unique-person report /3 | F08-AC01–06; T08-01–06 | [Contract](../sprint-3/f-08.md) and planned STS only; no report implementation/tests | NOT IMPLEMENTED / NOT RUN; F07 roster active/attended summary is not F08 report coverage |
| FR-10 | F09 assignment management /2 | F09-AC01–03/05–07; T09-01–04/06–08 | `I/instructor.test.ts`: assign/replace/remove/history/versions/overlap; `I/sprint2-acceptance.test.ts` G02–04; `E/f-09.spec.ts`, `E/sprint2-acceptance.spec.ts` | PASS C69 selected assertions; accepted main/deployment pending |
| FR-11 | F09 assigned teaching reads /2 | F09-AC04–07; T09-05–08 | `I/instructor.test.ts`: current assigned safe list/detail and21-row pages; acceptance process-restart/access; F09/acceptance browser suites | PASS C69; equal-start assignment fixture disposition in acceptance evidence; human/cloud pending |

## Business rules

| Requirement | Responsibility / sprint | AC / planned test | Actual file/test selection | Result / version and remaining verification |
|---|---|---|---|---|
| BR-01 | F02 new publication1–60 /1 + Lab7 | AC03; TEST03 | `U/events-validation.test.ts`: capacities1/30/60 and invalid61; `I/events.test.ts`: stored boundaries/no insertion; `E/f-02.spec.ts` | PASS C69; legacy retained; production audit/deployed check remains separate |
| BR-02 | F03/05/06 seat invariant /1–2 | AC05/07; TEST05/07; F05-AC06/T05-06; F06-AC06/T06-06 | `I/events.test.ts`: last-seat once+20 repetitions/rollback; cancellation cancel-first/register-first; management capacity/register/cancel waits | PASS C69, real PostgreSQL observer-backed selection; final integrated journey pending |
| BR-03 | F03/05 active pair uniqueness /1–2 | AC06; TEST06; F05-AC03–04/T05-03–04 | `I/events.test.ts`: sequential and concurrent duplicates once+20 repetitions; `I/cancellation.test.ts`: old/new IDs and repeat; acceptance G01 | PASS C69; not a performance measurement |
| BR-04 | F01/03/05 Participant scope /1–2 | AC09/TEST09; F05-AC05/T05-05 | `I/events.test.ts`: unauthorized registration/private reads; `I/cancellation.test.ts` direct denial matrix; `I/instructor.test.ts` Instructor cannot register/cancel | PASS C69 selected backend scope; final API demonstration pending |
| BR-05 | Owner scope across features /1–3 | AC08/09/15; TEST08/09/15; S2 access AC; F07-AC05/T07-05; F08-AC04/T08-04 | `I/events.test.ts`, `I/event-management.test.ts`, `I/instructor.test.ts`, `I/check-ins.test.ts` owner-positive/cross-owner404 and DTO restrictions | Implemented paths PASS C69; F08 access NOT IMPLEMENTED/NOT RUN |
| BR-06 | F06 effective cutoff /2 | F06-AC02/T06-02 | `I/event-management.test.ts`: explicit−1/0/+1ms, duplicate priority, null=start, invalid/past deadline; acceptance G01 cancel/re-register | PASS C69; final deployed boundary journey pending |
| BR-07 | F05 retained lifecycle /2 | F05-AC01–04/T05-01–04 | `I/cancellation.test.ts`: cancellation timestamp/seat/repeat/history/new-ID; acceptance G01 explicit deadline | PASS C69; final human/post-deploy persistence pending |
| BR-08 | F06 explicit vs omitted capacity /2 | F06-AC03/04/06; T06-03/04/06 | `I/event-management.test.ts`: preserves legacy/omitted fields; explicit bounds/ACTIVE count; concurrent edits; `U/event-edit-validation.test.ts` | PASS C69; no incompatible global upper-bound migration; production inventory not established here |
| BR-09 | F07 eligible unique attendance /3 | F07-AC01–04/06; T07-01–04/06 | `I/check-ins.test.ts`: ACTIVE exact ID/window, six offsets, same-ID201/200, old cancelled ID denial, no state changes; migration uniqueness | PASS C69 selected implementation; final main/redeploy pending |
| BR-10 | F08 persisted unique-person counts /3 | F08-AC01–03/05; T08-01–03/05 | Contract/Q09 expected formulas only; no actual report test | NOT IMPLEMENTED / NOT RUN |
| BR-11 | F09 owner assignment /2 | F09-AC05/T09-06 | `I/instructor.test.ts`: role/owner/CSRF; acceptance G03 teaching/removal matrix | PASS C69; final API demonstration pending |
| BR-12 | F09 Instructor identity/cardinality/history/overlap /2 | F09-AC01–03; T09-01–04 | `U/instructor-schedule.test.ts`; `I/instructor.test.ts`: no-op/replace/remove and assign-vs-edit; acceptance direct assign races/rollback; `I/instructor-migration.test.ts` | PASS C69 selected cases; main acceptance pending |
| BR-13 | F09 current assigned-only read /2 | F09-AC04–05; T09-05–06 | `I/instructor.test.ts`: read-only across existing APIs, safe current teaching DTOs; acceptance G02 former Instructor404 after restart | PASS C69; final deployed denial/persistence pending |

## Non-functional requirements

| Requirement | Responsibility / sprint | Planned verification | Actual file/test or measurement | Result / version and uncovered scope |
|---|---|---|---|---|
| NFR-01 | All protected operations /1–3 | TEST08/09/15; S2 access AC/T05-05,T06-05,T09-06; S3 T07-05/T08-04 | Direct API role/owner/session/CSRF/Origin/DTO selections in events/cancellation/management/instructor/check-ins integration suites; positive controls | Implemented paths PASS C69; F08 paths absent; no claim of universal input coverage |
| NFR-02 | Durable registration/history/attendance /1–3 + cloud | TEST10; T05-07; T06-08; T07-07; final redeploy | `I/events.test.ts`, `I/cancellation.test.ts`, `I/event-management.test.ts`, `I/check-ins.test.ts`: new application process, same persisted IDs, no reseed | Local-process assertions PASS C69; actual candidate Cloud Run restart/redeploy NOT RUN |
| NFR-03 | PostgreSQL concurrent invariants /1–3 | TEST06/07; T05-06; T06-06; T09-04; T07-06 | Real event/schedule lock observers, final row counts, uniqueness, rollback/time-after-wait in events/cancellation/management/instructor/acceptance/check-ins | Selected assertions PASS C69; no throughput/load or formal proof claimed |
| NFR-04 | Credential/session protection /1; role extension /2 | TEST02/12; T09-05/07 | `I/auth.test.ts`: salted hashes, captured logs/DTO secret exclusion, logout replay/absolute expiry; Instructor session; migration/provision tests preserve existing hashes | PASS C69 automated assertions; not an audit of every production log |
| NFR-05 | Reproducibility/migration/build /SYS01,1–3 | TEST13; migration/seed repeat; Docker/CI | C69 isolated install/migrate/seed/tests/build/Docker; migration-history guard and preservation suites; [setup summary](setup-and-release.md) | CI PASS C69; fresh human setup/final deploy chain pending. This environment: Node24/npm11, loopback/Docker denied, unit87 PASS/6 FAIL; see candidate record |
| NFR-06 | UI states/responsiveness/accessibility /1–3 | TEST14.A–N/UIV01–14; T05-07/T06-08/T09-08/T07-08/T08-06 | `E/f-01` through `f-07`, `f-09`, `sprint2-acceptance.spec.ts`: actual routes, pending/unknown/error/expiry selections, focus and320/390/1440px | Selected automated PASS C69; human keyboard/Escape/screen-reader verification incomplete; F08 UI absent; two-frame delayed-callback synchronization follow-up OPEN |
| NFR-07 | Assignment durability/access /2–3 | T09-05–07; G02 | `I/sprint2-acceptance.test.ts`: `S2-G02 retrieves assignment/history and Instructor access from a new app process without reseed`; direct safe denial matrix | PASS C69 for new app-process retrieval; actual cloud redeploy/human acceptance pending |

## Reconciliation decision

All baseline IDs have an explicit responsibility, planned verification and actual selection or uncovered status above. This is a mapping audit, not certification that every planned STS subcase or NFR is complete. F08 FR09/BR10 and applicable access/UI/restart checks remain uncovered. Every implemented feature still needs its final accepted main release identity and G05–06 evidence. Read [feature completion](feature-completion.md), [candidate record](candidate-verification.md) and [index](evidence-index.md) together.
