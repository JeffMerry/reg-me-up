# Sprint 2 planning and evidence

Current checkpoint27Nov2026: #68 selected acceptance additions and #69 F07 are approved/merged, combined staging `7c85dcc3e762c7f2be62a2285264af8aa4f9a972`. The [Deliverable2 evidence index](../deliverable-2/evidence-index.md) reconciles actual reviews/CI and separates remaining candidate G05, release/deploy G06, PDF and human submission. F08 remains contract-only. Older status paragraphs below are historical checkpoints.

Version 0.3 — 26 November 2026 (Asia/Bangkok). Refs #40/#41/#51.

Current status27Nov2026: **F05 #57/F06 #65/F09 #66 are merged in staging40a4db2**, alongside shared version/locks and Lab7 sync. [Acceptance audit](acceptance-audit.md) records established reviewed CI93/94/62 and specific verification gaps, not full release acceptance. The user now assigns all remaining work through release evidence to JeffMerry, with THN4 peer review; [current ownership](review-record.md#current-responsibilities--27-november-2026). [Sprint3 contracts](../sprint-3/README.md) are prepared with confirmed Q09; code/tests NOT RUN. [Delivery plan](../deliverable-2/plan.md).

## Source and version identity

| Point | Identity / meaning |
|---|---|
| Accepted Sprint 1 baseline | `3eba355215f0689d2a00553b0e0ed7a4cbecd457`, historical TH-016 acceptance recorded in Lab 6; known limitations remain |
| Starting main / Sprint 2 staging | `3c8b751a2646408f6fdc88209a0fef33d9030f1b`, PR #50 corrected release; this is not a new independent acceptance |
| Corrected deployment evidence previously verified | Run `45599941420`, revision `regmeup-00008-5ws`; deployment snapshot, not continuous monitoring |
| Intervening work | Controlled capacity exercise/test/evidence in PR #50; old capacity range still applies to create in this source |
| Lab 6 exercise retest | Independent UAT-03/UAT-05 evidence not established by this planning work; do not close that gap using CI |
| Sprint 2 submitted release | TBD; no implementation/release claimed |

Historical test evidence lives in feature evidence files and GitHub runs; old planning text in central documents is not a current release status. This revision links executed local F-05 verification, without claiming an accepted release.

## Documents

- [Policy confirmation, actual review and ownership matrix](review-record.md)
- [Shared lock prerequisite and actual RED/GREEN evidence](shared-lock-evidence.md)
- [Shared version prerequisite, reassigned ownership and migration evidence](event-version-evidence.md)
- [Lab7 synchronization plan, conflict resolution and combined verification](lab7-sync-evidence.md)
- [Policy decisions and Lab 7 boundary](decisions.md)
- [F-05 cancellation contract](f-05.md)
- [F-05 actual RED/GREEN, verification and integration limits](f-05-evidence.md)
- [F-06 event management contract](f-06.md)
- [F-06 API/UI actual evidence and F-09 integration boundary](f-06-evidence.md)
- [F-09 Instructor contract](f-09.md)
- [Shared API/data/locking design](system-design.md)
- [Software test specification](sts.md)
- [Current acceptance audit and gap queue](acceptance-audit.md)
- [Definition of Done](dod.md)
- [Branches, dependencies and review gates](branch-plan.md)

## Change / finding register

| ID / source | Requirements | Decision / release / retest status |
|---|---|---|
| #46 / Lab 6 controlled exercise | BR-02; AC-05 | Corrected main `3c8b751…` deployed; independent retest remains unverified here. GitHub CLOSED alone is not closure evidence |
| Lab 7 / user-supplied spec-sheet announcement | BR-01 / F-02; F-06 dependency | Lab7 create remains a separate workstream; F-06 edit range1–60 is CONFIRMED. Announcement waives Instructor/TA approval. Team contract review and RED/GREEN remain required; no Lab 7 implementation/merge asserted |
| Q-04–Q-08 / Sprint 2 | FR-06/07/10/11 and related BR/NFR | Planning approved and merged in #51; feature implementation requires separate review. See decisions.md and review-record.md |

The announcement is supplied text in the chat, with no independently verified announcement URL/date. Attach the original notice in the submission; do not invent an approval or announcement date.

## Feature completion snapshot

Shared lock plumbing merged in PR #55. F-05 builds on that staging version and has executed local evidence below; no peer-owned schema/version migration or accepted integrated release is supplied by F-05.

| Feature | AC | Implementation | Executed verification | Accepted release |
|---|---|---|---|---|
| F-05 | S2-F05-AC01–06 | Merged #57 at `bd8bf1a` | 13 API/DB cases + 10 browser cases; regression passed; [remaining integration](f-05-evidence.md) | TBD |
| F-06 | S2-F06-AC01–07 | Merged #65; F09 guard connected in #66 | Original87/81/57; later F09 cross-feature CI93/94/62; [remaining scope](acceptance-audit.md) | TBD |
| F-09 | S2-F09-AC01–07 | Merged #66 at40a4db2 | CI93 unit/94 integration/62 browser passed; [specific AC gaps](acceptance-audit.md) | TBD |

Deliverable 2 also requires #44: contracts for all remaining F-07/F-08 work and at least one meaningful tested Sprint 3 workflow. Those contracts and implementation are not supplied by this Sprint 2 planning PR. #45 tracks the complete PDF and integrated deployment; neither checkpoint is complete here.
