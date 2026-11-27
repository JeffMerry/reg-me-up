# RegMeUp — Requirements and verification traceability

Latest F-09 implementation update27Nov2026: F-09 uncommitted code candidate is in the working tree on `feature/f-09-instructor`; pure interval rule RED/GREEN and typecheck/build evidence are recorded in [F-09 evidence](sprints/sprint-2/f-09-evidence.md). Guarded PostgreSQL, API/DB migration/race and browser tests are NOT RUN because local DB/loopback access returned EACCES. No F-09 acceptance is inferred as passed.

Latest F-06 execution update27Nov2026: owner edit API/UI/deadline candidate `4cce15d` now has24 pure-rule,17 API/DB and10 browser cases passing locally (complete regression87 unit/81 integration/57 browser, typecheck/build). [F-06 mapping and actual RED/GREEN](sprints/sprint-2/f-06-evidence.md) supersedes F-06 NOT RUN entries below only for executed scope: AC01–06 and UI/persistence portion of AC07. Instructor overlap/role/assign-vs-edit integration and accepted release remain pending; no historical result is relabeled as a current pass.

Version 0.7 — 2026-11-27. Integrates Lab7 release #62 with Sprint2 staging after #57/#59. Sources: [SRS](srs.md), [features](features.md), [System SDS](system-sds.md), [UI baseline](ui-spec.md), [Sprint 1 STS](sprints/sprint-1/sts.md).

Historical design matrices and revision rows below preserve their original checkpoints. Lab7 local unit63/integration44/F-02 browser15 results are in [capacity evidence](evidence/lab7/RED-publish-capacity.md), with each run's source disclosure. F-05 results are in the [execution update](#f-05-execution-update--26-november-2026), and shared version results in [foundation evidence](sprints/sprint-2/event-version-evidence.md). These separate runs do not establish a pass for the combined source; the synchronization PR records fresh verification. Integrated Sprint2 acceptance/release remains pending. No baseline requirement is removed.

## 1. Functional requirements

| Requirement | Feature | Sprint | UI / design | AC → planned verification | Gap/status |
|---|---|---|---|---|---|
| FR-01 | F-01 | 1 | UI-01/shared navigation; SDS auth | AC-01/02 → TEST-01/02; AC-14 → TEST-14.B/C | Designed; NOT RUN |
| FR-02 | F-02 | 1 | UI-06/03; events model/API | AC-03 → TEST-03; AC-14 → TEST-14.E/F | Designed; NOT RUN |
| FR-03 | F-02 | 1 | UI-02/03; public DTO/query | AC-11 → TEST-11; AC-09 → TEST-09; AC-14 → TEST-14.A | Discovery gap addressed by design; NOT RUN |
| FR-04 | F-03 | 1 | UI-03/04/04-D; registration service | AC-04 → TEST-04; AC-09/10 → TEST-09/10 | Designed; NOT RUN |
| FR-05 | F-04 | 1 | UI-05/07; owner read model | AC-08/09 → TEST-08/09; AC-14 → TEST-14.J/L | Designed; NOT RUN |
| FR-06 | F-05 | 2 | [Cancellation contract](sprints/sprint-2/f-05.md) | S2-F05-AC01–06 → S2-T05-01–07 | Policy CONFIRMED; NOT RUN |
| FR-07 | F-06 | 2 | [Edit/deadline contract](sprints/sprint-2/f-06.md) | S2-F06-AC01–07 → S2-T06-01–08 | Policy/legacy CONFIRMED; NOT RUN |
| FR-08 | F-07 | 3 | Attendance conceptual model | Contract/AC/STS pending Q-09; owner check-in/eligibility/duplicate | Allocated; NOT RUN |
| FR-09 | F-08 | 3 | Summary query/count semantics | Contract/AC/STS pending Q-09; compare persisted rows/formulas incl cancelled state | Allocated; NOT RUN |
| FR-10 | F-09 | 2 | [Assignment contract](sprints/sprint-2/f-09.md) | S2-F09-AC01–03/05–07 → S2-T09-01–04/06–08 | Policy CONFIRMED; NOT RUN |
| FR-11 | F-09 | 2 | [Own teaching reads](sprints/sprint-2/f-09.md) | S2-F09-AC04–07 → S2-T09-05–08 | Policy CONFIRMED; NOT RUN |

## 2. Business rules

| Requirement | Feature | Sprint | UI / design | AC → planned verification | Gap/status |
|---|---|---|---|---|---|
| BR-01 | F-02 | 1 | UI-06; DB capacity check | AC-03 → TEST-03 | Designed; NOT RUN |
| BR-02 | F-03; F-05/06 extend | 1–2 | Event-lock protocol; UI-03 availability | AC-05/07 → TEST-05/07; later seat-return/capacity-change regression | S1 historical; S2 policy CONFIRMED, S2-T05-06/S2-T06-06; NOT RUN |
| BR-03 | F-03 | 1 | Partial unique active pair + transaction | AC-06 → TEST-06 (sequential/concurrent/full duplicate) | Designed; NOT RUN |
| BR-04 | F-01/03; F-05 extends | 1–2 | Role guards; own reads/cancel | AC-09 → TEST-09; later own-cancel contract | S1 designed; NOT RUN |
| BR-05 | F-01/02/04/06/07/08/09 | 1–3 | Owner-filtered events/private queries | AC-08/09/15 → TEST-08/09/15; later owner checks on every added operation | Mapping expanded; NOT RUN |
| BR-06 | F-06 | 2 | Deadline semantics | Confirmed Q-04; S2-F06-AC02 → S2-T06-02 before/exact/after boundary | CONFIRMED policy; NOT RUN |
| BR-07 | F-05 | 2 | Registration lifecycle/event lock | Confirmed Q-05; S2-F05-AC01–04 → S2-T05-01–04 state/seat/history | CONFIRMED policy; NOT RUN |
| BR-08 | F-06 | 2 | Capacity update/event lock | Confirmed Q-06/legacy; S2-F06-AC03/04/06 → S2-T06-03/04/06 | CONFIRMED policy; NOT RUN |
| BR-09 | F-07 | 3 | Eligible registration/attendance uniqueness | Contract/AC/STS pending Q-09 | Allocated; NOT RUN |
| BR-10 | F-08 | 3 | Persisted data/count definitions | Contract/AC/STS pending Q-09; known dataset expected totals | Allocated; NOT RUN |
| BR-11 | F-09 | 2 | Owner assignment permissions | Confirmed policy; S2-F09-AC05 → S2-T09-06 two Organizer negative tests | CONFIRMED policy; NOT RUN |
| BR-12 | F-09 | 2 | Instructor FK/role/cardinality | Confirmed Q-07; S2-F09-AC01–03 → S2-T09-01–04 absent/wrong-role/overlap | CONFIRMED policy; NOT RUN |
| BR-13 | F-09 | 2 | Instructor assigned-only reads | Confirmed Q-08; S2-F09-AC04/05 → S2-T09-05/06 assigned-only/access denial | CONFIRMED policy; NOT RUN |

## 3. Non-functional requirements

| Requirement | Feature/responsibility | Sprint | Design / verification | Gap/status |
|---|---|---|---|---|
| NFR-01 | F-01–09 protected operations | 1–3 | SDS complete endpoint matrix; AC-08/09/15 → TEST-08/09/15; expand for later endpoints | Corrected missing F-02/F-03/F-09 mapping; NOT RUN |
| NFR-02 | F-03/05/07; SYS-01 durability | 1–3 + Lab 5 | AC-10 → TEST-10 app restart; later cancellation/attendance and cloud redeploy checks | S1 designed; later checks pending; NOT RUN |
| NFR-03 | F-03/05/06 | 1–2 | AC-06/07 → TEST-06/07 real DB contention; later cancel/capacity interactions | S1 designed; later contracts pending; NOT RUN |
| NFR-04 | F-01 | 1 | AC-02/12 → TEST-02/12 lifecycle/hashed storage/log/response verification | Hashing gap addressed by design; NOT RUN |
| NFR-05 | SYS-01 | 1–3 + Lab 5 | AC-13 → TEST-13 full setup; foundation SYS-AC-01–07 → SYS-TEST-01–07 in [SYS-01](sprints/sprint-1/sys-01.md); later Docker/CI/deploy/reproduce | Exact targets selected; foundation/full tests NOT RUN; executable commands not present |
| NFR-06 | F-01–09 applicable UI | 1–3 | AC-14 → TEST-14.A–N ↔ UIV-01–14; later feature states added per sprint | S1 cases designed; later contracts pending; NOT RUN |
| NFR-07 | F-09 | 2–3 | Future AC/STS: assignment restart + anonymous/wrong-role/unassigned reads denied | Pending Q-07/08 and F-09 contract; NOT RUN |

## 4. Acceptance catalog and feature contracts

| AC | Defined outcome | Contract / owner | Planned TEST |
|---|---|---|---|
| AC-01 | Valid/invalid login and correct identity/access | [F-01](sprints/sprint-1/f-01.md) | TEST-01 |
| AC-02 | Logout/old-session replay/absolute expiry match design | F-01 | TEST-02 |
| AC-03 | Valid publication incl empty description; invalid required/time/capacity/limits no insert | [F-02](sprints/sprint-1/f-02.md) | TEST-03 |
| AC-04 | Register with space and retrieve persisted own row | [F-03](sprints/sprint-1/f-03.md) | TEST-04 |
| AC-05 | Full event rejects new Participant without count change | F-03 | TEST-05 |
| AC-06 | Sequential/concurrent duplicate never creates second active pair | F-03 | TEST-06 |
| AC-07 | Different Participants racing last seat yield one success and bounded DB count | F-03 | TEST-07 |
| AC-08 | Owner reads authorized registration list/summary, other owner denied | [F-04](sprints/sprint-1/f-04.md) | TEST-08 |
| AC-09 | Public access allowed; backend session/role/owner matrix enforced on protected operations | Shared F-01–04; SDS matrix | TEST-09 |
| AC-10 | Same successful registration survives app restart | F-03 | TEST-10 |
| AC-11 | Public published-only list/detail privacy/ordering/pagination | F-02 | TEST-11 |
| AC-12 | Hashing and credential protection verified | F-01 | TEST-12 |
| AC-13 | Fresh documented local setup/build/test reproducible without production secrets | SYS-01; [DoD](sprints/sprint-1/dod.md) | TEST-13 |
| AC-14 | UI baseline states/journeys/accessibility/responsiveness | Shared F-01–04; UI/STS | TEST-14.A–N |
| AC-15 | Own-event list and server-derived Organizer ownership | F-02 | TEST-15 |

STS §5 maps every UIV-01–14 to TEST-14.A–N and API/DB supplements. Screen coverage: UI-01 F-01; UI-02 F-02; UI-03 F-02/03; UI-04/04-D F-03; UI-05 F-02/04; UI-06 F-02; UI-07 F-04; UI-S01/02 shared access/not-found cases. UI coverage is planned, not measured.

Example: **FR-05 → [F-04](sprints/sprint-1/f-04.md) → AC-08 → [TEST-08](sprints/sprint-1/sts.md)**. FR-05 requires an Organizer to read registrations only for their own event; AC-08 defines owner success and non-owner denial; TEST-08 plans positive, cross-owner, empty-list and pagination checks. This is planned verification, not an executed result.

For foundation preparation, [SYS-01 acceptance and test design](sprints/sprint-1/sys-01.md) maps SYS-AC-01–07 to SYS-TEST-01–07. These foundation checks supplement, rather than replace, product-level AC-13 → TEST-13; all remain NOT RUN.

## 5. Actual evidence, gaps and changes

[STS execution register](sprints/sprint-1/sts.md) is the single actual-test record: planned ID/AC, actual file/name, automated/manual method, result, tested commit and evidence. Every current actual field is empty/NOT RUN. When executed, retain command/output/counts/failed/skipped cases and manual tester/version. PR/review/release evidence belongs to [DoD](sprints/sprint-1/dod.md), currently NOT RECORDED.

Known remaining work: implement and run all S1 tests; install/lock/verify [selected versions](dependency-versions.md) and produce actual setup; record contract/test-design commits before implementation; real teammate review/Issues/integration; elaborate Sprint 2–3 AC/STS after Q-04–09. Foundation-specific SYS-AC/SYS-TEST design supplements full AC-13/TEST-13; its actual results remain NOT RUN. A row linked to planned tests is not a completed requirement. No evidence of coverage percentage exists.

| Change | Rationale / authority | Affected artifacts | Status |
|---|---|---|---|
| Mapping clarification | R omitted NFR-01 coverage in F-02/03/09; original security rule already applies | Features/traceability/SDS/contracts | Documented, pending teammate review |
| AC/TEST-11–15 | Close R discovery/hash/setup/UI/own-event verification gaps under user-adopted proposal | Contracts/STS/DoD/traceability | Designed; NOT RUN |
| Prisma ORM replaces earlier no-ORM choice | User selected Prisma ORM on 2026-11-10; DEC-08 remains historical and DEC-14 supersedes it | SRS DEC-14, SDS, F-03, SYS-01, versions | Design updated; exact Prisma versions, teammate review and execution pending |
| Lab 7 BR-01 capacity change | User-selected bound makes new publication explicit at integer 1–60; existing capacity, IDs, registrations and ownership remain intact; existing events continue to use stored capacity under F-03 | SRS BR-01/DEC-05/DEC-15; F-02/03; SDS; UI-06; AC-03/11; TEST-03/05/11/15/14.E/F; Issue #52; F-06 coordination #42 | PR #56 contract and PR #60 implementation reviewed/merged; local unit/API/browser results and local test inventory recorded in Lab7 evidence. Candidate CI, main release, deployment, live inventory and post-deploy checks pending; see release-handoff.md. |

The Lab 7 announcement removes the TA approval gate for this change; teammate contract review was recorded in PR #56 before implementation. This table links evidence rather than replacing review records. PR #60 review left a CI-trigger follow-up, now prepared under Issue #54. Later changes need reason/affected requirement IDs/version/actual decision source and must retain baseline unfinished work.

## Revision history

| Version | Date | Change | Review |
|---|---|---|---|
| 0.1 | 2026-11-06 | All baseline requirements allocated; S1 AC/test/UI links; explicit later gaps and empty actual evidence | Pending teammate review |
| 0.2 | 2026-11-06 | Linked foundation-specific SYS-AC/SYS-TEST design and selected versions without claiming execution | Pending teammate review; all tests NOT RUN |
| 0.3 | 2026-11-10 | Traced DEC-14 Prisma decision and affected design artifacts | Pending teammate review; all tests NOT RUN |
| 0.4 | 2026-11-11 | Added explicit FR-05 to TEST-08 example and SYS-01 foundation test link | Pending teammate review; all tests NOT RUN |
| 0.5 (Sprint2 branch) | 2026-11-26 | Linked confirmed Sprint2 policy/legacy and named ownership to planned AC/STS; no executed results changed | THN4 COMMENTED review; formal approval pending |
| 0.5 (Lab7 branch) | 2026-11-26 | Traced Lab 7 BR-01 1–60 contract and legacy registration compatibility to F-02/F-03 and planned tests | Pending teammate review; implementation/tests NOT RUN |
| 0.6 | 2026-11-26 | Linked actual Lab7 contract/implementation reviews and local results; clarified that historical NOT RUN design entries are not current execution status | Release documentation pending teammate review; candidate CI/deployment pending |
| 0.7 | 2026-11-27 | Combined Lab7/Sprint2 evidence and retained both branch revision histories | Synchronization PR review/combined verification pending |

## Sprint 2 extension — 25 November 2026

Revision26Nov2026: this matrix supplements historical baseline rows above for the confirmed Sprint2 policy. [STS](sprints/sprint-2/sts.md) defines every planned ID. Actual file/name/measurement, tested commit/run and result are **TBD / NOT RUN** for every row; no measured coverage percentage or formal PR APPROVED is claimed. Policy confirmation and named owners are recorded in [review-record.md](sprints/sprint-2/review-record.md); Kittithat owns F-05/F-06/locks/integration, Thanatip owns F-09/schema/release evidence, with cross-review. Baseline IDs retained. The full candidate matrix must later reconcile actual Sprint1 results and remaining Sprint3 checks under #45.

| Requirement | Feature / sprint | AC | Planned tests | Actual file/test/measurement | Result / tested version |
|---|---|---|---|---|---|
| FR-06; BR-07 | F-05 /2 | S2-F05-AC01–04 | S2-T05-01–04 | TBD | NOT RUN / TBD |
| BR-02/03 | F-03/05/06 /1–2 | S2-F05-AC03/04/06; S2-F06-AC03/06 | S2-T05-03/04/06; S2-T06-03/06 + TEST-05/06/07 | TBD | NOT RUN / TBD |
| BR-04 | F-05 /2 | S2-F05-AC05 | S2-T05-05 | TBD | NOT RUN / TBD |
| FR-07; BR-06 | F-06 /2 | S2-F06-AC01/02/05–07 | S2-T06-01/02/05–08 | TBD | NOT RUN / TBD |
| BR-01 dependency; BR-08 | F-06 /2 + peer Lab7 | S2-F06-AC03/04/06 | S2-T06-03/04/06; Lab7 create test references pending | TBD | NOT RUN; legacy policy CONFIRMED; audit pending |
| BR-05 | F-05/06/09 /2 | S2-F05-AC05; S2-F06-AC05; S2-F09-AC05 | S2-T05-05; S2-T06-05; S2-T09-06 | TBD | NOT RUN / TBD |
| FR-10; BR-11/12 | F-09 /2 | S2-F09-AC01–03/05 | S2-T09-01–04/06 | TBD | NOT RUN / TBD |
| FR-11; BR-13 | F-09 /2 | S2-F09-AC04/05/07 | S2-T09-05/06/08 | TBD | NOT RUN / TBD |
| NFR-01 | Shared auth/new APIs /2 | Access AC in all3 contracts | S2-T05-05; S2-T06-05; S2-T09-06 + TEST-09 | TBD | NOT RUN / TBD |
| NFR-02 | F-05/06 /2 | S2-F05-AC06; S2-F06-AC07 | S2-T05-07; S2-T06-08; post-deploy retrieval | TBD | NOT RUN / TBD |
| NFR-03 | F-03/05/06 /2 | S2-F05-AC06; S2-F06-AC06 | S2-T05-06; S2-T06-06 + TEST-06/07 | TBD | NOT RUN / TBD |
| NFR-04 | F-01/09 role extension /1–2 | S2-F09-AC04/06 | S2-T09-05/07 + TEST-02/12 | TBD | NOT RUN / TBD |
| NFR-05 | SYS-01 /2 | Reproducibility/DoD | S2-T09-07; migration/repeat setup; TEST-13 | TBD | NOT RUN / TBD |
| NFR-06 | F-05/06/09 /2 | S2-F05-AC06; S2-F06-AC07; S2-F09-AC07 | S2-T05-07; S2-T06-08; S2-T09-08 | TBD | NOT RUN / TBD |
| NFR-07 | F-09 /2 | S2-F09-AC04–06 | S2-T09-05–07 | TBD | NOT RUN / TBD |

Q-04–Q-08/related FR/BR and legacy policy are CONFIRMED in THN4 review6068033006 (COMMENTED) on26Nov2026; formal follow-up approval/merge remains pending. TA change-request approval for Lab7 is waived by the supplied announcement; link its original record when available. F-07/F-08 remain planned under #44; no Sprint3 completion implied by this mapping.

## F-05 execution update — 26 November 2026

This update supersedes only F-05 NOT RUN entries above. Planning approval/merge later completed in #51; shared locks merged in #55. F-05 runtime/test GREEN is `60423732af75b4155aff13553ff3f57fe5e262ac`, preceded by real domain RED `4688652`. [Executed evidence](sprints/sprint-2/f-05-evidence.md) contains exact tests, counts, setup limitations and remaining integration. Feature peer review, accepted release and post-deployment verification are pending.

| Requirement → AC → STS | Actual checks | Result / remaining scope |
|---|---|---|
| FR-06; BR-07 → S2-F05-AC01–04 → S2-T05-01–04 | Cancellation API/DB tests: state, returned seat, start boundaries, repeat/concurrent idempotence, history/new-ID re-registration | Passed locally for startsAt; explicit deadline integration waits for F-06 |
| BR-04/05; NFR-01 → S2-F05-AC05 → S2-T05-05 | Auth/ownership/validation/CSRF matrix and DTO allowlists | Passed for existing roles; Instructor coverage waits for F-09 |
| BR-02/03; NFR-03 → S2-F05-AC06 → S2-T05-06 | Observed lock waits, last-seat orderings, shared-helper capacity writer, rollback | Passed locally; real F-06 endpoint/expectedVersion and integrated contention remain pending |
| NFR-02/06 → S2-F05-AC06 → S2-T05-07 | New app subprocess, persisted browser history, responsive/focus/expiry/pending/unknown-outcome flows | Passed locally; human UAT/cloud retrieval after restart remains under #45 |

Measured selection: 13 cancellation API/DB cases and 10 F-05 browser cases; complete regression 55 unit, 58 integration and 43 browser passed, plus typecheck/build. No coverage percentage is claimed. F-06/F-09/Lab7 requirements, policy and baseline text are not changed by this execution update.
