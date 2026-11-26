# Sprint 2 policy confirmation and ownership

Version 0.2 — 26 November 2026 (Asia/Bangkok). Refs #40/#51.

## Actual review evidence and status boundary

[THN4 review on PR #51](https://github.com/JeffMerry/reg-me-up/pull/51#pullrequestreview-6068033006) was submitted on **26 November 2026 at 10:10:04 Asia/Bangkok** (03:10:04 UTC), against head `2093a5aeff4bf20516b669243f3fb6c8b3d772b6`. GitHub review state is **COMMENTED**, not APPROVED.

Thanatip Nitinantakul (THN4) confirmed Q-04–Q-08 and the associated FR/BR, preserved BR-02–BR-04, and the legacy capacity policy: retain existing >60 data; omitted capacity preserves it during other edits; explicitly supplied capacity must satisfy1–60 and >=ACTIVE; no incompatible global DB constraint. Instructor overlap uses half-open intervals with adjacency allowed. These policies are **CONFIRMED**; no runtime or acceptance result follows from that confirmation.

The review also requested actual named ownership before merge. The user assigned F-05/F-06 to Kittithat and F-09 to Thanatip in chat on26Nov2026 and delegated the shared-work split. The matrix below records that allocation. It describes responsibilities, not work already performed or a future reviewer approval. Review of this follow-up and formal PR approval/merge remain pending. Exact technical implementation choices must still be checked in the relevant code/migration PR.

## Ownership matrix

| Work | Implement / accountable owner | Migration / schema owner | Tests / evidence owner | Different teammate reviewer |
|---|---|---|---|---|
| F-05 cancellation | Kittithat Disthanakornkun (JeffMerry) | Kittithat Disthanakornkun (JeffMerry): cancellation status/cancelledAt migration | Kittithat Disthanakornkun (JeffMerry): S2-T05-01–07 and RED/GREEN | Thanatip Nitinantakul (THN4) |
| F-06 event edit/capacity/deadline | Kittithat Disthanakornkun (JeffMerry) | Kittithat Disthanakornkun (JeffMerry): deadline migration, coordinated with shared version foundation | Kittithat Disthanakornkun (JeffMerry): S2-T06-01–08 and RED/GREEN | Thanatip Nitinantakul (THN4) |
| F-09 Instructor | Thanatip Nitinantakul (THN4) | Thanatip Nitinantakul (THN4): Instructor role/assignment/history migration and provisioning | Thanatip Nitinantakul (THN4): S2-T09-01–08 and RED/GREEN | Kittithat Disthanakornkun (JeffMerry) |
| Shared schema and migration coordination | Thanatip Nitinantakul (THN4) | Thanatip Nitinantakul (THN4): shared events.version foundation, migration order/compatibility and schema coordination | Thanatip Nitinantakul (THN4): apply/repeat/preserved-data evidence | Kittithat Disthanakornkun (JeffMerry) |
| Shared lock / schedule protocol | Kittithat Disthanakornkun (JeffMerry) | Coordinate with Thanatip's schema foundation; no duplicate version migration | Kittithat Disthanakornkun (JeffMerry): synchronized cross-feature race/rollback evidence, with F-09 fixtures supplied by Thanatip | Thanatip Nitinantakul (THN4) |
| Integration into sprint/02-staging | Kittithat Disthanakornkun (JeffMerry) | Thanatip Nitinantakul (THN4) validates combined migration ordering | Kittithat Disthanakornkun (JeffMerry): Lab7 sync, candidate regression/CI and main release PR | Thanatip Nitinantakul (THN4) |
| Release evidence / #45 compilation | Thanatip Nitinantakul (THN4) | No new feature schema ownership | Thanatip Nitinantakul (THN4): collect commit/run/digest/revision, post-deploy results, completion tables and PDF evidence; Kittithat supplies integration records | Kittithat Disthanakornkun (JeffMerry) |

## Dependency handoff

- Thanatip prepares the small shared schema/version foundation in a reviewed prerequisite PR under #40 before feature migrations depend on it. No shared schema has been implemented by this documentation revision.
- Kittithat prepares the reusable event/schedule lock protocol under #40/#42 after contract integration; Thanatip reviews it before both F-06/F-09 consume it. Coordination must not require merging incomplete assignment UI just to obtain a shared guard.
- Every feature owner starts from staging containing the required reviewed prerequisites, owns its own test/migration/evidence and consults the shared schema owner before changes to schema.prisma. Shared owner coordinates rather than rewriting feature migrations.
- Feature author never supplies the required teammate approval on their own feature. Integration and release evidence ownership do not authorize bypassing PR review or sending credentials.
- F-07/F-08 implementation allocation and the human LEB2 submitter are outside this feature allocation and must be recorded separately in #44/#45 before those actions.

## Evidence still pending

All Sprint2 implementation is **NOT STARTED**, all Sprint2 acceptance verification is **NOT RUN**, and no submitted/accepted Sprint2 main release exists. CI run45651181587 passed the existing suites on2093a5a; it is not evidence that Sprint2 features work. A new head must receive its own CI and reviewer assessment. Data audit, exact migration SQL, deployment and independent retests remain to be executed/reported honestly.
