# RegMeUp — Feature inventory

Version 0.3 — 2026-11-10. User-adopted planning baseline; teammate review pending. Implementation of every feature **NOT STARTED in the inspected checkout**; verification **NOT RUN**.

Requirements: [SRS](srs.md). Detailed design: [System SDS](system-sds.md). Verification mapping: [Traceability](traceability.md). Sprint outcomes: [Plan](sprints/plan.md).

SYS-01 has a [bounded foundation preparation contract](sprints/sprint-1/sys-01.md) and [dependency targets](dependency-versions.md). DEC-14 adopts Prisma ORM; exact Prisma versions and compatibility remain open for teammate review before implementation. Actual implementation/tests remain NOT STARTED/NOT RUN.

| ID | Responsibility / scope | Requirements | Dependencies | Sprint | UI / contract |
|---|---|---|---|---|---|
| F-01 | Identity/access: login/logout/current identity, session/CSRF, common role guards; resource owners checked by domain services | FR-01; BR-04/05; NFR-01/04/06 | SYS-01 user/session storage/setup; no domain feature dependency | 1 | UI-01, shared navigation/guards; [contract](sprints/sprint-1/f-01.md) |
| F-02 | Immediate publication, public published list/detail, Organizer own-event list; no edits/drafts/uploads | FR-02/03; BR-01/05; NFR-01/06 | F-01 for protected operations; SYS-01 DB; public reads remain usable without login | 1 | UI-02/03/05/06; [contract](sprints/sprint-1/f-02.md) |
| F-03 | Participant registration/own list/detail/status; full/duplicate/last-seat safety; restart persistence | FR-04; BR-02/03/04; NFR-01/02/03/06 | F-01, F-02, SYS-01; consistent event-lock protocol | 1 | UI-03/04/04-D; [contract](sprints/sprint-1/f-03.md) |
| F-04 | Owner Organizer reads authorized event metadata, registrants and totals; no check-in/export | FR-05; BR-05; NFR-01/06 | F-01/02/03; read model and privacy conventions | 1 | UI-05/07; [contract](sprints/sprint-1/f-04.md) |
| F-05 | Cancel own registration and return seat according to policy | FR-06; BR-04/07; NFR-01/02/03/06 | F-03; Q-05; extend atomic event-lock protocol | 2 | Later contract/screens not elaborated; no controls in Sprint 1 |
| F-06 | Owner event details/capacity/deadlines | FR-07; BR-05/06/08; NFR-01/03/06 | F-02/03; Q-04/06; lock protocol compatible with register/cancel | 2 | Later contract pending |
| F-07 | Owner check-in and attendance persistence without duplicates | FR-08; BR-05/09; NFR-01/02/06 | F-03/05; Q-09 eligible state/window/correction policy | 3 | Later contract pending |
| F-08 | Owner attendance summaries from persisted data | FR-09; BR-05/10; NFR-01/06 | F-07 and registration lifecycle; Q-09 counts | 3 | Later contract pending |
| F-09 | Owner Instructor assignment; assigned Instructor teaching list | FR-10/11; BR-05/11/12/13; NFR-01/07/06 | F-01/02; Q-07/08; role/schema expansion via new migrations | 2 | Later contract pending |
| SYS-01 | Local reproducibility, migrations/seed/config/build/test; later Docker/CI/GCP/release durability | NFR-05; supports NFR-02 | Establish alongside F-01; technical versions ENG-01; GCP guidance ENG-03 | 1–3 + Lab 5 | No domain screen; [SDS](system-sds.md), TEST-13 and later delivery verification |

Cross-cutting security is established in F-01 and checked on **all protected endpoints**, including F-02/F-03 and later F-09; F-01 middleware alone cannot prove ownership enforcement. NFR-03 extends to cancellation in Sprint 2 because seat return changes active counts; this mapping clarifies verification rather than changing baseline BR-02/03.

F-02 count reads require the registrations table from the shared schema plan, not completed F-03 mutation behavior. Introduce that relation/constraints as a versioned schema dependency before count reads; F-03 later implements registration writes. This avoids a circular feature dependency or hardcoded zero counts in the final contract.

Proposed team allocation: each feature has a lead and a different teammate reviewer; both participate in UI/API/DB/tests as applicable. No actual assignment/Issue/PR or contribution is claimed here. Scope is bounded by the feature contract before implementation; changed contracts retain version/reason and update traceability.

## Revision history

| Version | Date | Change | Review |
|---|---|---|---|
| 0.1 | 2026-11-06 | Allocated all 11 FR, 13 BR, 7 NFR to F-01–09/SYS-01; corrected cross-cutting security mapping | Pending teammate review |
| 0.2 | 2026-11-06 | Linked bounded SYS-01 preparation and exact dependency version targets | Pending teammate review; no implementation/results |
| 0.3 | 2026-11-10 | Updated SYS-01 dependency status for the Prisma ORM decision | Pending teammate review; no implementation/results |
