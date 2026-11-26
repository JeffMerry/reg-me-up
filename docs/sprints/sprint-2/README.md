# Sprint 2 planning and evidence

Version 0.2 — 26 November 2026 (Asia/Bangkok). Refs #40/#51.

Status: **POLICY CONFIRMED — implementation NOT STARTED / verification NOT RUN**. THN4 confirmed Q-04–Q-08, related FR/BR and legacy policy in the [26Nov review](review-record.md). Review state is COMMENTED, not APPROVED; follow-up approval/merge is pending. Exact technical choices remain subject to implementation PR review. The [ownership matrix](review-record.md#ownership-matrix) assigns F-05/F-06 to Kittithat, F-09/shared schema/release evidence to Thanatip, and shared lock/integration to Kittithat with cross-review.

## Source and version identity

| Point | Identity / meaning |
|---|---|
| Accepted Sprint 1 baseline | `3eba355215f0689d2a00553b0e0ed7a4cbecd457`, historical TH-016 acceptance recorded in Lab 6; known limitations remain |
| Starting main / Sprint 2 staging | `3c8b751a2646408f6fdc88209a0fef33d9030f1b`, PR #50 corrected release; this is not a new independent acceptance |
| Corrected deployment evidence previously verified | Run `45599941420`, revision `regmeup-00008-5ws`; deployment snapshot, not continuous monitoring |
| Intervening work | Controlled capacity exercise/test/evidence in PR #50; old capacity range still applies to create in this source |
| Lab 6 exercise retest | Independent UAT-03/UAT-05 evidence not established by this planning work; do not close that gap using CI |
| Sprint 2 submitted release | TBD; no implementation/release claimed |

Historical test evidence lives in feature evidence files and GitHub runs; old planning text in central documents is not a current release status. This documentation revision has no new runtime results.

## Documents

- [Policy confirmation, actual review and ownership matrix](review-record.md)
- [Shared lock prerequisite and actual RED/GREEN evidence](shared-lock-evidence.md)
- [Policy decisions and Lab 7 boundary](decisions.md)
- [F-05 cancellation contract](f-05.md)
- [F-06 event management contract](f-06.md)
- [F-09 Instructor contract](f-09.md)
- [Shared API/data/locking design](system-design.md)
- [Software test specification](sts.md)
- [Definition of Done](dod.md)
- [Branches, dependencies and review gates](branch-plan.md)

## Change / finding register

| ID / source | Requirements | Decision / release / retest status |
|---|---|---|
| #46 / Lab 6 controlled exercise | BR-02; AC-05 | Corrected main `3c8b751…` deployed; independent retest remains unverified here. GitHub CLOSED alone is not closure evidence |
| Lab 7 / user-supplied spec-sheet announcement | BR-01 / F-02; F-06 dependency | Lab7 create remains a separate workstream; F-06 edit range1–60 is CONFIRMED. Announcement waives Instructor/TA approval. Team contract review and RED/GREEN remain required; no Lab 7 implementation/merge asserted |
| Q-04–Q-08 / Sprint 2 | FR-06/07/10/11 and related BR/NFR | CONFIRMED in THN4 review; named ownership recorded; formal PR approval/merge pending. See decisions.md and review-record.md |

The announcement is supplied text in the chat, with no independently verified announcement URL/date. Attach the original notice in the submission; do not invent an approval or announcement date.

## Feature completion snapshot

Shared lock plumbing has a separately tested implementation candidate (see evidence above), pending peer review/staging merge. It is not a completed feature: F-05/F-06/F-09 implementation/acceptance remain as listed below. No peer-owned schema/version migration is supplied by that candidate.

| Feature | AC | Implementation | Executed verification | Accepted release |
|---|---|---|---|---|
| F-05 | S2-F05-AC01–06 | NOT STARTED | NOT RUN | TBD |
| F-06 | S2-F06-AC01–07 | NOT STARTED | NOT RUN | TBD |
| F-09 | S2-F09-AC01–07 | NOT STARTED | NOT RUN | TBD |

Deliverable 2 also requires #44: contracts for all remaining F-07/F-08 work and at least one meaningful tested Sprint 3 workflow. Those contracts and implementation are not supplied by this Sprint 2 planning PR. #45 tracks the complete PDF and integrated deployment; neither checkpoint is complete here.
