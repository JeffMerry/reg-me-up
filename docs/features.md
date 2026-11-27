# RegMeUp — Feature inventory

Version0.7 — 27Nov2026. F05/F06/F09 are merged in staging40a4db2 with reviewed source and passing candidate CI; [acceptance audit](sprints/sprint-2/acceptance-audit.md) records specific remaining evidence/release gates. Q09 is user-confirmed and [F07/F08 contracts](sprints/sprint-3/README.md) are prepared for technical review; implementation/tests NOT RUN. The user assigned all remaining work through release evidence to JeffMerry, with THN4 peer review; historical contributions remain unchanged. Older foundation/Sprint1 planning statements below retain their original checkpoint, not a current runtime status.

Requirements: [SRS](srs.md). Detailed design: [System SDS](system-sds.md). Verification mapping: [Traceability](traceability.md). Sprint outcomes: [Plan](sprints/plan.md).

SYS-01 has a [bounded foundation preparation contract](sprints/sprint-1/sys-01.md) and [dependency targets](dependency-versions.md). DEC-14 adopts Prisma ORM; exact Prisma versions and compatibility remain open for teammate review before implementation. Actual implementation/tests remain NOT STARTED/NOT RUN.

| ID | Responsibility / scope | Requirements | Dependencies | Sprint | UI / contract |
|---|---|---|---|---|---|
| F-01 | Identity/access: login/logout/current identity, session/CSRF, common role guards; resource owners checked by domain services | FR-01; BR-04/05; NFR-01/04/06 | SYS-01 user/session storage/setup; no domain feature dependency | 1 | UI-01, shared navigation/guards; [contract](sprints/sprint-1/f-01.md) |
| F-02 | Immediate publication, public published list/detail, Organizer own-event list; no edits/drafts/uploads | FR-02/03; BR-01/05; NFR-01/06 | F-01 for protected operations; SYS-01 DB; public reads remain usable without login | 1 | UI-02/03/05/06; [contract](sprints/sprint-1/f-02.md) |
| F-03 | Participant registration/own list/detail/status; full/duplicate/last-seat safety; restart persistence | FR-04; BR-02/03/04; NFR-01/02/03/06 | F-01, F-02, SYS-01; consistent event-lock protocol | 1 | UI-03/04/04-D; [contract](sprints/sprint-1/f-03.md) |
| F-04 | Owner Organizer reads authorized event metadata, registrants and totals; no check-in/export | FR-05; BR-05; NFR-01/06 | F-01/02/03; read model and privacy conventions | 1 | UI-05/07; [contract](sprints/sprint-1/f-04.md) |
| F-05 | Cancel own registration and return seat; retain history and re-register per confirmed policy | FR-06; BR-02/03/04/07; NFR-01/02/03/06 | F-03; confirmed Q-05; reviewed shared prerequisites | 2 | UI-04/04-D extension; [contract](sprints/sprint-2/f-05.md) |
| F-06 | Owner event details/capacity/deadlines | FR-07; BR-01/02/03/05/06/08; NFR-01/02/03/06 | F-02/03/05; confirmed Q-04/06/legacy policy; shared schedule guard for assigned time edits | 2 | UI-05/03 extension and owner edit; [contract](sprints/sprint-2/f-06.md) |
| F-07 | Owner check-in and attendance persistence without duplicates | FR-08; BR-05/09; NFR-01/02/06 | F-03/05; Q-09 eligible state/window/correction policy | 3 | [F07 contract](sprints/sprint-3/f-07.md), [STS](sprints/sprint-3/sts.md); review pending |
| F-08 | Owner attendance summaries from persisted data | FR-09; BR-05/10; NFR-01/06 | F-07 and registration lifecycle; Q-09 counts | 3 | [F08 contract](sprints/sprint-3/f-08.md), [STS](sprints/sprint-3/sts.md); review pending |
| F-09 | Owner Instructor assignment; assigned Instructor teaching list | FR-10/11; BR-05/11/12/13; NFR-01/07/06 | F-01/02; confirmed Q-07/08; role/schema expansion and shared schedule guard with F-06 | 2 | Owner assignment and My Teaching; [contract](sprints/sprint-2/f-09.md) |
| F-10 | Cross-feature UI refinement after baseline workflows are complete: visual consistency, spacing/typography, responsive layouts, interaction feedback, and accessibility details across implemented screens; no new business rules | Existing UI contracts and NFR-06; supports usability of F-01–F-09 | F-01–F-09 implemented and integrated; known functional defects triaged first | Final hardening, after Sprint 3 feature work and before final regression/release | [refinement plan](sprints/f-10-ui-refinement.md); issue tracking pending |
| SYS-01 | Local reproducibility, migrations/seed/config/build/test; later Docker/CI/GCP/release durability | NFR-05; supports NFR-02 | Establish alongside F-01; technical versions ENG-01; GCP guidance ENG-03 | 1–3 + Lab 5 | No domain screen; [SDS](system-sds.md), TEST-13 and later delivery verification |

Cross-cutting security is established in F-01 and checked on **all protected endpoints**, including F-02/F-03 and later F-09; F-01 middleware alone cannot prove ownership enforcement. NFR-03 extends to cancellation in Sprint 2 because seat return changes active counts; this mapping clarifies verification rather than changing baseline BR-02/03.

F-02 count reads require the registrations table from the shared schema plan, not completed F-03 mutation behavior. Introduce that relation/constraints as a versioned schema dependency before count reads; F-03 later implements registration writes. This avoids a circular feature dependency or hardcoded zero counts in the final contract.

Current Sprint2 allocation is recorded in the linked named ownership matrix from the user's26Nov direction. Each feature author owns migration/tests/evidence and has the other teammate as reviewer. Responsibilities are assigned, implementation/contribution is not yet claimed. Historical Sprint1 review/assignment records remain in their own plans.

## Revision history

| Version | Date | Change | Review |
|---|---|---|---|
| 0.1 | 2026-11-06 | Allocated all 11 FR, 13 BR, 7 NFR to F-01–09/SYS-01; corrected cross-cutting security mapping | Pending teammate review |
| 0.2 | 2026-11-06 | Linked bounded SYS-01 preparation and exact dependency version targets | Pending teammate review; no implementation/results |
| 0.3 | 2026-11-10 | Updated SYS-01 dependency status for the Prisma ORM decision | Pending teammate review; no implementation/results |
| 0.4 | 2026-11-12 | Added a post-baseline cross-feature UI refinement workstream (F-10) | Planning only; issue and teammate review pending |
| 0.5 | 2026-11-25 | Linked Sprint2 draft contracts and shared lifecycle/schedule dependencies; retained Lab7 ownership | Pending teammate review; S2 NOT IMPLEMENTED/NOT RUN |
| 0.6 | 2026-11-26 | Recorded confirmed policy/legacy and named ownership | COMMENTED review; formal follow-up approval pending; NOT STARTED/NOT RUN |
