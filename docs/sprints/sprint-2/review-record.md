# Sprint 2 policy confirmation and ownership

Version0.4 — 27 November2026 (Asia/Bangkok). Refs #40/#42/#44/#45/#51.

The26Nov matrix below is historical. [Current responsibilities](#current-responsibilities--27-november-2026) supersede it for remaining work after the user reassignment; completed contributions/reviews remain attributed to their actual authors.

## Actual review evidence and status boundary

[THN4 review on PR #51](https://github.com/JeffMerry/reg-me-up/pull/51#pullrequestreview-6068033006) was submitted on **26 November 2026 at 10:10:04 Asia/Bangkok** (03:10:04 UTC), against head `2093a5aeff4bf20516b669243f3fb6c8b3d772b6`. GitHub review state is **COMMENTED**, not APPROVED.

Thanatip Nitinantakul (THN4) confirmed Q-04–Q-08 and the associated FR/BR, preserved BR-02–BR-04, and the legacy capacity policy: retain existing >60 data; omitted capacity preserves it during other edits; explicitly supplied capacity must satisfy1–60 and >=ACTIVE; no incompatible global DB constraint. Instructor overlap uses half-open intervals with adjacency allowed. These policies are **CONFIRMED**; no runtime or acceptance result follows from that confirmation.

The review also requested actual named ownership before merge. The user assigned F-05/F-06 to Kittithat and F-09 to Thanatip in chat on26Nov2026 and delegated the shared-work split. The matrix below records that allocation. It describes responsibilities, not work already performed or a future reviewer approval. At this initial review checkpoint formal approval/merge were pending; the subsequent actual approval/merge are recorded below. Exact technical implementation choices must still be checked in the relevant code/migration PR.

## Subsequent planning approval and merge

[THN4 review6068636065](https://github.com/JeffMerry/reg-me-up/pull/51#pullrequestreview-6068636065) is **APPROVED**, submitted26Nov2026 at11:40:44 Asia/Bangkok (04:40:44 UTC) for head `a66679f3951dd9ce62466bee351372a0a8c22158`. It confirms the policy, legacy and ownership corrections and reports CI run45753514639 against test merge `a19d56e16b0de651d1891288359a7eda6e611dc2`. PR #51 merged into sprint/02-staging as `eb2ac13e8eec775a8262e87309d39cb4f2e0581f`. Issue #40 was observed CLOSED when preparing the next prerequisite; that state is not evidence of feature implementation or runtime acceptance. PR #55 supplies the separately reviewable shared-lock candidate, while shared schema/version and F-09 remain Thanatip's responsibility.

## Ownership matrix

Update26Nov2026 after F-05 PR #57 merged: the user explicitly reassigned the missing `events.version` prerequisite to Kittithat in chat ("ให้คุณทำ prerequisite PR แยก"). Only the version foundation changes owner; Thanatip retains F-09/Instructor schema and migration coordination. This user-directed allocation is not a teammate approval of its implementation. See [version foundation evidence/handoff](event-version-evidence.md).

| Work | Implement / accountable owner | Migration / schema owner | Tests / evidence owner | Different teammate reviewer |
|---|---|---|---|---|
| F-05 cancellation | Kittithat Disthanakornkun (JeffMerry) | Kittithat Disthanakornkun (JeffMerry): cancellation status/cancelledAt migration | Kittithat Disthanakornkun (JeffMerry): S2-T05-01–07 and RED/GREEN | Thanatip Nitinantakul (THN4) |
| F-06 event edit/capacity/deadline | Kittithat Disthanakornkun (JeffMerry) | Kittithat Disthanakornkun (JeffMerry): deadline migration, coordinated with shared version foundation | Kittithat Disthanakornkun (JeffMerry): S2-T06-01–08 and RED/GREEN | Thanatip Nitinantakul (THN4) |
| F-09 Instructor | Thanatip Nitinantakul (THN4) | Thanatip Nitinantakul (THN4): Instructor role/assignment/history migration and provisioning | Thanatip Nitinantakul (THN4): S2-T09-01–08 and RED/GREEN | Kittithat Disthanakornkun (JeffMerry) |
| Shared events.version foundation (reassigned by user) | Kittithat Disthanakornkun (JeffMerry) | Kittithat: one additive version migration and Prisma field | Kittithat: apply/repeat/preserved-data evidence | Thanatip Nitinantakul (THN4) |
| Shared schema and migration coordination | Thanatip Nitinantakul (THN4) | Thanatip: Instructor schema and combined migration order/compatibility; reuse Kittithat's version prerequisite | Thanatip: combined schema verification | Kittithat Disthanakornkun (JeffMerry) |
| Shared lock / schedule protocol | Kittithat Disthanakornkun (JeffMerry) | Coordinate with Thanatip's schema foundation; no duplicate version migration | Kittithat Disthanakornkun (JeffMerry): synchronized cross-feature race/rollback evidence, with F-09 fixtures supplied by Thanatip | Thanatip Nitinantakul (THN4) |
| Integration into sprint/02-staging | Kittithat Disthanakornkun (JeffMerry) | Thanatip Nitinantakul (THN4) validates combined migration ordering | Kittithat Disthanakornkun (JeffMerry): Lab7 sync, candidate regression/CI and main release PR | Thanatip Nitinantakul (THN4) |
| Release evidence / #45 compilation | Thanatip Nitinantakul (THN4) | No new feature schema ownership | Thanatip Nitinantakul (THN4): collect commit/run/digest/revision, post-deploy results, completion tables and PDF evidence; Kittithat supplies integration records | Kittithat Disthanakornkun (JeffMerry) |

## Dependency handoff

- Original planning assigned the shared version foundation to Thanatip. The later user-directed reassignment above supersedes that allocation: Kittithat now supplies the small version prerequisite; both features consume the reviewed staging merge without duplicating its migration.
- Kittithat prepares the reusable event/schedule lock protocol under #40/#42 after contract integration; Thanatip reviews it before both F-06/F-09 consume it. Coordination must not require merging incomplete assignment UI just to obtain a shared guard.
- Every feature owner starts from staging containing the required reviewed prerequisites, owns its own test/migration/evidence and consults the shared schema owner before changes to schema.prisma. Shared owner coordinates rather than rewriting feature migrations.
- Feature author never supplies the required teammate approval on their own feature. Integration and release evidence ownership do not authorize bypassing PR review or sending credentials.
- F-07/F-08 implementation allocation and the human LEB2 submitter are outside this feature allocation and must be recorded separately in #44/#45 before those actions.

## Evidence still pending

F-05 merged in #57; [F-05 evidence](f-05-evidence.md) records its local/CI boundary. F-06 has a separate validation work branch, without exposed edit API/UI yet. F-09 implementation is not established by this update. The [shared lock prerequisite](shared-lock-evidence.md) merged in #55; [version foundation](event-version-evidence.md) records its own verification/review status. No accepted integrated Sprint2 main release is claimed. Historical CI run45651181587 on2093a5a is not evidence of later feature behavior. Every new head needs its own CI/reviewer assessment; deployment and independent retests remain pending.

## Current responsibilities — 27 November 2026

The user stated in chat: “เปลี่ยนเเล้วครับต่อไปผมทำหมดเลยจนถึง release evidence”. This explicitly assigns remaining implementation and release-evidence work to Kittithat (JeffMerry). Thanatip's F09 historical implementation and actual JeffMerry review are preserved; no completed work is reattributed.

| Remaining work | Accountable / implementation / migration / tests / evidence | Different teammate reviewer |
|---|---|---|
| Sprint2 gap closure and integration | Kittithat Disthanakornkun (JeffMerry) | Thanatip Nitinantakul (THN4) |
| F07/F08 contracts and implementation | Kittithat Disthanakornkun (JeffMerry) | Thanatip Nitinantakul (THN4) |
| Future schema coordination, regression and staging integration | Kittithat Disthanakornkun (JeffMerry), consulting actual merged schema/history | Thanatip Nitinantakul (THN4) |
| Release preparation, deployment evidence, traceability and #45/PDF | Kittithat Disthanakornkun (JeffMerry) | Thanatip Nitinantakul (THN4) |
| Human LEB2 submission | Explicit submitter to be recorded before action; not performed by this allocation | Verify receipt/version/time |

F06 #65 and F09 #66 are approved/merged; [audit](acceptance-audit.md) distinguishes passing executed cases from missing acceptance evidence. This allocation authorizes preparation/work, not self-approval or fabricated review/test/deploy/submission. [Plan and targets](../deliverable-2/plan.md).
