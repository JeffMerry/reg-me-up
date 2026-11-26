# Lab 7 metrics and readiness — pre-release snapshot

Snapshot: **26 November 2026, 22:21:48 Asia/Bangkok** (`2026-11-26T15:21:48.436Z`). Activity window: 26 November 00:00 through this snapshot.

Scope: Lab 7 work in `JeffMerry/reg-me-up`, limited to Issues **#52, #53, #54** and PRs **#56, #60**. These are not project-wide counts. Future evidence and release PRs must be added when the snapshot is refreshed.

Sources: [GitHub source records](release-source-records.json), [local test evidence](RED-publish-capacity.md) and [release handoff](release-handoff.md). This Markdown records repository release work. Google Doc editing, PDF preparation and submission are separate tasks.

## 1. Five metrics

| Metric | Value | Definition and evidence |
|---|---|---|
| Completed Issues | **2** | #52 and #53 have state=closed and state_reason=completed, with closed_at inside the window. #54 remains open. No duplicates or cancelled work are counted. |
| Merged PRs | **2** | #56 and #60 merged into lab7-staging inside the window. Neither is a main release PR. |
| Automated test results | **44 passed / 0 failed / 0 skipped** | One named suite: full PostgreSQL integration, 26 November 21:13:19. Command: `npm run test:integration --workspace server`. Source was `10f8c2d` plus uncommitted legacy test changes, later committed as `d59d559`. This is not a run on the staging merge SHA. |
| UAT defect status | **0 new defects recorded / 0 resolved** | Lab 7 evidence contains no new UAT defect IDs. The search `is:issue created:2026-11-26 UAT` returned only #54, a release issue. Setup failures and expected RED results are not UAT defects. Post-deployment Lab 7 UAT has not run. |
| CI run outcomes | **0 successful / 0 failed / 0 cancelled; 0 runs returned** | Actions API for implementation head `06e89b387caad2028b0299f745ac2ed603bca92d` returned total_count=0. PR-triggered queries for #56/#60 were also empty. This is a CI gap, not a passing outcome. |

Integration pass rate is **44/44 = 100% for that local suite**. No CI success percentage is calculated because its denominator is zero. Other unit/browser runs are recorded separately and are not added to this suite's count.

## 2. Source records

| Issue | State / reason | Completed UTC | Asia/Bangkok | Count |
|---|---|---|---|---|
| #52 — contract | closed / completed | 2026-11-26T12:55:55Z | 26 Nov 19:55:55 | 1 |
| #53 — implementation | closed / completed | 2026-11-26T15:04:07Z | 26 Nov 22:04:07 | 1 |
| #54 — release | open | None | None | 0 |

| PR | Head | Target | Merged UTC | Asia/Bangkok | Merge SHA |
|---|---|---|---|---|---|
| #56 | `339ecd3` | lab7-staging | 2026-11-26T12:49:59Z | 26 Nov 19:49:59 | `370bae0` |
| #60 | `06e89b3` | lab7-staging | 2026-11-26T14:57:58Z | 26 Nov 21:57:58 | `c9fb599` |

| Source | Recorded result |
|---|---|
| Integration screenshot 09 | Vitest 5.1.0; started 21:13:19; 4 files passed; 44 tests passed; duration 32.31s. |
| Actions API | `actions/runs?head_sha=06e89b387caad2028b0299f745ac2ed603bca92d&per_page=100` returned `{"total_count":0,"workflow_runs":[]}`. |
| Contract review | JeffMerry APPROVED PR #56 at 19:49:00, review 6074397586. RED test commit followed at 20:04:09. |
| Implementation review | JeffMerry APPROVED PR #60 at 21:54:09, review 6076239838, while requesting the missing staging CI trigger. The PR merged before that trigger was corrected; this remains a follow-up action. |

Issue bodies #52/#53 still contain unchecked tasks and stale NOT RUN/NOT STARTED text despite their completed state. The issue metric counts GitHub state; task evidence is assessed separately. This snapshot does not alter external issues or comments.

## 3. Interpretation — 65 words

Local integration passed all 44 cases and both maintenance PRs merged, but the implementation head has no recorded CI runs because lab7-staging was omitted from the trigger. THN4 will add that trigger and obtain teammate review plus passing candidate CI before the main release. Readiness remains blocked until deployment identity and changed and preserved behavior checks are recorded. Local results do not establish deployed readiness.

Action owner: THN4 prepares the CI fix. A teammate must review the next candidate. The deployment operator remains to be assigned.

## 4. Readiness decision

**NOT READY for delivery of the maintained Lab 7 release at this snapshot.** The bounded implementation and local evidence are available. Candidate CI, a reviewed main release, deployment identity and post-deployment verification remain pending. This decision does not assess the availability of the previous Sprint 1 deployment.

| Item | Status | Evidence and next action |
|---|---|---|
| Contract review before implementation | Recorded | PR #56; preserve review date and feedback. |
| Local behavior checks | Passed for recorded runs | Unit 63/63, integration 44/44 and F-02 browser 15/15. Runs have separate source provenance. |
| Failed/skipped history | Disclosed | Expected RED, missing environment, seed-password mismatch and browser locator failure are retained with subsequent results. Filtered skips are intentional. |
| Implementation review | Recorded; CI action open | PR #60 review/merge is available. |
| Candidate CI | Pending | Add lab7-staging trigger, then record the actual final head or merge candidate and its checks. |
| Main release and deployment | Pending | Obtain release review, main SHA, deploy run, image digest, serving revision, traffic and smoke results. |
| Historical data | Partial | Synthetic capacity61 compatibility passes; local test inventory is zero. Live inventory is unverified. |
| Configuration and secrets | Live check pending | Existing workflow uses WIF and the demo environment. Verify project, origin and secret references without exposing values. |
| Repository documentation | Prepared for review | Evidence 01–17, this snapshot and release handoff exist; actual release fields remain pending. |

### Defects and technical debt

No new Lab 7 UAT defect is recorded in this scoped set. This is not a severity audit of every project defect. Previous Lab 6 Issue #46 belongs to the corrective-maintenance baseline. Expected RED failures are not defects.

| Item | Classification / impact | Priority | Action |
|---|---|---|---|
| Missing staging CI trigger | Release process gap; candidate not verified by CI | High | Fix in this branch and require passing candidate checks. |
| Capacity bound duplicated in client/server | Technical debt; future changes may drift | Medium | Keep API/browser boundary coverage; consider a shared contract in later reviewed work. |
| Follow-up tests ran before their source commit | Traceability limitation; HEAD alone cannot identify the run | Medium | Retain working-tree disclosure and verify the committed release candidate in CI. |
| Live legacy inventory missing | Verification gap | High before final decision | Record a read-only inventory of the identified deployment database. |

## 5. Retrospective and contributions — draft for team review

- **What helped?** Keeping unit RED before implementation and using small commits made the behavior change traceable. Integration and browser checks covered both the API and UI.
- **What hurt?** A different seeded database caused password verification failures. The missing branch trigger also left the implementation PR without CI evidence.
- **What will change?** Before the next release, THN4 will check database identity, seed context and workflow branch filters first, then retain source SHA and run IDs with each result.

| Person / declaration | Supported contribution | Still to confirm |
|---|---|---|
| Thanatip Nitinantakul, 67070501023 / THN4 | Selected the 1–60 rule, reviewed work in stages, ran local checks, supplied captures and opened PRs. | Deployment operator and any additional pair work. |
| Kittithat Disthanakornkun, 67070501004 / JeffMerry | Reviewed and merged PRs #56/#60; identified the CI trigger gap. | Do not infer local test execution or deployment ownership from these reviews. |
| AI use | Codex assisted with contracts, code/tests, evidence organization and result analysis. The user reviewed changes and ran local tests. | Team review of this record. No AI-run CI, cloud deployment or post-deploy result is claimed. |

## 6. Refresh after release

Add new evidence/release PRs and merge dates, final main SHA/tag, every relevant CI/deploy attempt and outcome, live smoke/UAT results, actual deployment inventory and the final readiness decision. Preserve this snapshot's date rather than making later activity appear to have happened earlier.

Google Doc layout, PDF export and submission will be handled separately at the user's request.
