# RegMeUp — Requirements and verification traceability

Version 0.1 — 2026-11-06. Pending teammate review. Sources: [SRS](srs.md), [features](features.md), [System SDS](system-sds.md), [UI baseline](ui-spec.md), [Sprint 1 STS](sprints/sprint-1/sts.md).

**Every actual test result is NOT RUN; actual test files/names, tested commits, command output and evidence are not available.** Planned coverage below does not mean implementation or coverage measurements exist. No baseline requirement removed.

## 1. Functional requirements

| Requirement | Feature | Sprint | UI / design | AC → planned verification | Gap/status |
|---|---|---|---|---|---|
| FR-01 | F-01 | 1 | UI-01/shared navigation; SDS auth | AC-01/02 → TEST-01/02; AC-14 → TEST-14.B/C | Designed; NOT RUN |
| FR-02 | F-02 | 1 | UI-06/03; events model/API | AC-03 → TEST-03; AC-14 → TEST-14.E/F | Designed; NOT RUN |
| FR-03 | F-02 | 1 | UI-02/03; public DTO/query | AC-11 → TEST-11; AC-09 → TEST-09; AC-14 → TEST-14.A | Discovery gap addressed by design; NOT RUN |
| FR-04 | F-03 | 1 | UI-03/04/04-D; registration service | AC-04 → TEST-04; AC-09/10 → TEST-09/10 | Designed; NOT RUN |
| FR-05 | F-04 | 1 | UI-05/07; owner read model | AC-08/09 → TEST-08/09; AC-14 → TEST-14.J/L | Designed; NOT RUN |
| FR-06 | F-05 | 2 | Later cancellation state/API/UI | Contract/AC/STS pending Q-05; verify owner cancel/state/seat return/re-registration policy | Allocated; NOT RUN |
| FR-07 | F-06 | 2 | Event update/deadline/lock protocol | Contract/AC/STS pending Q-04/06; deadline boundary/capacity below active rejection | Allocated; NOT RUN |
| FR-08 | F-07 | 3 | Attendance conceptual model | Contract/AC/STS pending Q-09; owner check-in/eligibility/duplicate | Allocated; NOT RUN |
| FR-09 | F-08 | 3 | Summary query/count semantics | Contract/AC/STS pending Q-09; compare persisted rows/formulas incl cancelled state | Allocated; NOT RUN |
| FR-10 | F-09 | 2 | Assignment conceptual model | Contract/AC/STS pending Q-07/08; owner assign, account/role checks, retrieval | Allocated; NOT RUN |
| FR-11 | F-09 | 2 | Assigned Instructor reads | Contract/AC/STS pending Q-07/08; assigned-only details/empty/denial | Allocated; NOT RUN |

## 2. Business rules

| Requirement | Feature | Sprint | UI / design | AC → planned verification | Gap/status |
|---|---|---|---|---|---|
| BR-01 | F-02 | 1 | UI-06; DB capacity check | AC-03 → TEST-03 | Designed; NOT RUN |
| BR-02 | F-03; F-05/06 extend | 1–2 | Event-lock protocol; UI-03 availability | AC-05/07 → TEST-05/07; later seat-return/capacity-change regression | S1 designed; S2 contract pending; NOT RUN |
| BR-03 | F-03 | 1 | Partial unique active pair + transaction | AC-06 → TEST-06 (sequential/concurrent/full duplicate) | Designed; NOT RUN |
| BR-04 | F-01/03; F-05 extends | 1–2 | Role guards; own reads/cancel | AC-09 → TEST-09; later own-cancel contract | S1 designed; NOT RUN |
| BR-05 | F-01/02/04/06/07/08/09 | 1–3 | Owner-filtered events/private queries | AC-08/09/15 → TEST-08/09/15; later owner checks on every added operation | Mapping expanded; NOT RUN |
| BR-06 | F-06 | 2 | Deadline semantics | Contract/AC/STS pending Q-04; before/exact/after boundary | Allocated; NOT RUN |
| BR-07 | F-05 | 2 | Registration lifecycle/event lock | Contract/AC/STS pending Q-05; persisted state/seat return/history | Allocated; NOT RUN |
| BR-08 | F-06 | 2 | Capacity update/event lock | Contract/AC/STS pending Q-06; concurrent lower capacity vs registrations | Allocated; NOT RUN |
| BR-09 | F-07 | 3 | Eligible registration/attendance uniqueness | Contract/AC/STS pending Q-09 | Allocated; NOT RUN |
| BR-10 | F-08 | 3 | Persisted data/count definitions | Contract/AC/STS pending Q-09; known dataset expected totals | Allocated; NOT RUN |
| BR-11 | F-09 | 2 | Owner assignment permissions | Contract/AC/STS pending; two Organizer negative tests | Allocated; NOT RUN |
| BR-12 | F-09 | 2 | Instructor FK/role/cardinality | Contract/AC/STS pending Q-07; absent/wrong-role account | Allocated; NOT RUN |
| BR-13 | F-09 | 2 | Instructor assigned-only reads | Contract/AC/STS pending Q-08; unassigned/forbidden mutation/private-data denial | Allocated; NOT RUN |

## 3. Non-functional requirements

| Requirement | Feature/responsibility | Sprint | Design / verification | Gap/status |
|---|---|---|---|---|
| NFR-01 | F-01–09 protected operations | 1–3 | SDS complete endpoint matrix; AC-08/09/15 → TEST-08/09/15; expand for later endpoints | Corrected missing F-02/F-03/F-09 mapping; NOT RUN |
| NFR-02 | F-03/05/07; SYS-01 durability | 1–3 + Lab 5 | AC-10 → TEST-10 app restart; later cancellation/attendance and cloud redeploy checks | S1 designed; later checks pending; NOT RUN |
| NFR-03 | F-03/05/06 | 1–2 | AC-06/07 → TEST-06/07 real DB contention; later cancel/capacity interactions | S1 designed; later contracts pending; NOT RUN |
| NFR-04 | F-01 | 1 | AC-02/12 → TEST-02/12 lifecycle/hashed storage/log/response verification | Hashing gap addressed by design; NOT RUN |
| NFR-05 | SYS-01 | 1–3 + Lab 5 | AC-13 → TEST-13 fresh setup/migrate/seed/build/tests; later Docker/CI/deploy/reproduce | Local design; executable commands not present; NOT RUN |
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

## 5. Actual evidence, gaps and changes

[STS execution register](sprints/sprint-1/sts.md) is the single actual-test record: planned ID/AC, actual file/name, automated/manual method, result, tested commit and evidence. Every current actual field is empty/NOT RUN. When executed, retain command/output/counts/failed/skipped cases and manual tester/version. PR/review/release evidence belongs to [DoD](sprints/sprint-1/dod.md), currently NOT RECORDED.

Known remaining work: implement and run all S1 tests; pin versions and produce actual setup; record contracts/test-design commit before implementation; real teammate review/Issues/integration; elaborate Sprint 2–3 AC/STS after Q-04–09. A row linked to planned tests is not a completed requirement. No evidence of coverage percentage exists.

| Change | Rationale / authority | Affected artifacts | Status |
|---|---|---|---|
| Mapping clarification | R omitted NFR-01 coverage in F-02/03/09; original security rule already applies | Features/traceability/SDS/contracts | Documented, pending teammate review |
| AC/TEST-11–15 | Close R discovery/hash/setup/UI/own-event verification gaps under user-adopted proposal | Contracts/STS/DoD/traceability | Designed; NOT RUN |
| No ORM; selected technical direction | User explicitly chose no ORM and instructed proposals be documented | SRS DEC-08–13, SDS/contracts | Baseline for documentation; teammate review pending |

No instructor-approved scope changes or teammate approvals have been recorded; this table is not a fabricated approval log. Later changes need reason/affected requirement IDs/version/actual decision source and must retain baseline unfinished work.

## Revision history

| Version | Date | Change | Review |
|---|---|---|---|
| 0.1 | 2026-11-06 | All baseline requirements allocated; S1 AC/test/UI links; explicit later gaps and empty actual evidence | Pending teammate review |
