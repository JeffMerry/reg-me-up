# RegMeUp — Sprint 1 branch and pull request plan

Version 0.2 — 2026-11-06 (Asia/Bangkok)

Status: **USER-SELECTED WORKFLOW / PENDING TEAMMATE REVIEW**. On 6 November 2026 the user selected **Feature → develop → main**, with develop serving as Sprint 1 staging. Feature PRs target develop and require teammate review before merge; the release PR targets main after integration checks. Reviewer assignments and GitHub settings remain to be agreed/configured. This plan creates no branch, Issue, PR, review or GitHub setting. Existing feature contracts/STS remain the pre-implementation baseline. No implementation or verification result is claimed.

## 1. Current repository and branch responsibilities

Inspected local refs: `develop` and `origin/develop` at `0581bdf`; `main` and `origin/main` at `a8cbbb5`; clean working tree before writing this plan. These are local/tracking refs, not a fresh query of GitHub settings or active PRs. The eight documentation commits already on develop are a documentation baseline, not teammate-reviewed implementation.

| Branch | Role | Source / PR target |
|---|---|---|
| `main` | Accepted Sprint 1 release with recorded integration/acceptance evidence | Release PR from `develop` after all feature PRs/integration checks reviewed |
| `develop` | Sprint staging/integration | Receives reviewed foundation/feature/fix/documentation PRs |

New work branches are created from **current develop when dependencies have merged**, not all from today's baseline. One feature branch covers applicable UI/API/DB/tests/docs as one bounded feature. Both members understand all layers and review each other's work.

## 2. Planned work branches and PR boundaries

| Order | Branch to create | Scope / linked work | Required predecessor | PR base / readiness |
|---|---|---|---|---|
| 1 | `chore/sys-01-foundation` | SYS-01: pinned runtime/dependencies, client/server skeleton, Tailwind tokens/shared base setup, local/test PostgreSQL config, migration runner and shared schema/seed plan, test runner setup, actual README commands; no completed domain workflow claimed | Baseline/design review; ENG-01 selections recorded | `develop`; fresh setup/build and meaningful setup checks actually run, teammate approves |
| 2 | `feature/f-01-identity` | F-01 contract: login/logout/me, hash/session/CSRF, backend role foundation, UI-01/navigation/guards, TEST-01/02/12 and applicable shared cases | Foundation merged | `develop`; auth/UI lifecycle checks, contract/review evidence and tests |
| 3 | `feature/f-02-events` | F-02: publish/public list/detail/own-event list, validation/timezone/privacy, UI-02/03/05/06, TEST-03/11/15 + shared cases | F-01 merged; shared registration relation available for counts | `develop`; public/owner/validation API+DB and selected UI checks |
| 4 | `feature/f-03-registration` | F-03: atomic register, own list/detail/status, UI-03 registration + UI-04/04-D, TEST-04–07/10 + shared cases | F-02 merged | `develop`; real DB concurrency/uniqueness/privacy/restart verification required |
| 5 | `feature/f-04-owner-list` | F-04: owner-only event registrations/summary/pagination, UI-07 and UI-05 links, TEST-08 + shared cases | F-03 merged | `develop`; owner positive/negative controls, safe DTOs/counts and Organizer journey |

Initial baseline contracts: [F-01](f-01.md), [F-02](f-02.md), [F-03](f-03.md), [F-04](f-04.md), [STS](sts.md), [DoD](dod.md). Review the relevant subset before each implementation; if details change, record revised design/test intent first on that branch before code.

Foundation schema responsibilities must be agreed in its Issue: establish shared migrations once, including registration relation/constraints needed by F-02 counts even before registration endpoints exist. This is consistent with [feature dependency clarification](../../features.md). F-01–04 implement their domain behavior and add only genuinely required schema changes via new ordered migrations. Do not duplicate/rewrite already shared migrations across feature branches. Foundation auth libraries/store schema may be installed/pinned there; login/logout logic remains F-01.

SYS-01 already has SDS/TEST-13/DoD design. Before implementation, its Issue must identify exact bounded setup acceptance, commands and migration ownership; do not claim full TEST-13/E2E success before domain workflows exist. Full reproducibility across the released product is verified again at integration.

## 3. PR and teammate review workflow

1. Create a real GitHub Issue with SYS/F ID, linked requirements/contract/AC/STS, scope, dependency, proposed lead and a different teammate reviewer. No Issue numbers/usernames are assigned in this document.
2. Before code, teammate reviews the current contract/UI/test design in that Issue with a substantive check/question/finding/reason. Record actual date/person; existing baseline commits do not count as historical approval. If revision is needed, use a real docs PR or contract-first commit on the work branch.
3. Create work branch from updated develop after its predecessor merges. Retain specification/test-design version before corresponding implementation. For meaningful rule work record actual intended-behavior red test and green correction versions.
4. Implement only the bounded feature, update actual test results/traceability/docs and commit meaningful increments. Red intermediate commits may exist on the work branch; the PR candidate must pass required verification before merge.
5. Push that branch and open a feature PR with **base develop**, linked Issue and feature/AC/TEST IDs. Request the other teammate as reviewer on GitHub when ready. Do not count an AI review or author self-review as teammate approval.
6. Reviewer inspects behavior/assertions/schema/privacy and reproduces the relevant checks. Submit actual Approve/Request changes with specific reasoning. Author fixes comments on the same branch; changes affecting the diff receive review again.
7. Merge only after approval, resolved discussions and actual relevant checks. Record merge/tested commits and update Issue/board. Create the next feature branch from the updated develop. Remove completed temporary branch only after confirming merge; PR/history remain evidence.

Planned PR titles: `SYS-01: establish local project foundation`, `F-01: implement identity and access`, `F-02: publish and discover events`, `F-03: register and retrieve own registrations`, `F-04: list registrations for owned events`. These are title suggestions, not PRs already opened.

PR description must state problem/resulting behavior, linked Issue/contract/AC, key UI/API/DB changes, exact verification command/result/tested version and known limitations. Include meaningful screenshots for UI changes and API/DB evidence where appropriate; screenshots alone do not prove security/concurrency. Never fill PASS/reviewer/evidence until they exist.

## 4. Suggested review allocation for two members

| Work | Proposed lead | Proposed reviewer |
|---|---|---|
| SYS-01 foundation | Member A | Member B |
| F-01 | Member A | Member B |
| F-02 | Member B | Member A |
| F-03 | Member A | Member B |
| F-04 | Member B | Member A |
| Sprint release PR | Member B | Member A |

This alternates feature responsibility; it is not an actual assignment or contribution record. Both join baseline/schema/API discussions and work on tests/design/UI/API as applicable. While one implements a dependency, the other can review it, prepare downstream test cases and review UI/contracts. The default delivery sequence follows the feature dependencies; do not merge downstream work against missing auth/data behavior.

## 5. Additional branches when real work requires them

| Pattern | When / target |
|---|---|
| `docs/sprint-1-<issue>-<short-description>` | Real contract/design/test-plan correction; branch from develop, reviewed PR back to develop. No empty PR merely to simulate a past review |
| `fix/sprint-1-<issue>-<short-description>` | Integration/acceptance defect after feature merge; branch from current develop, regression test + fix + reviewed PR to develop |

Review corrections before feature merge stay on that feature branch/PR. Avoid creating separate branches for every small commit. No release branch is required for this plan: reviewed develop itself supplies the final release PR.

## 6. GitHub merge controls and commit policy (to configure later)

For main and develop, propose required PR review with **one approving teammate** with appropriate write access, resolved conversations, stale approval dismissal after reviewable changes, no ordinary direct/force pushes and no admin bypass for normal feature delivery. These are proposed settings, not verified current repository settings. Availability depends on repository visibility/GitHub plan; inspect capabilities before claiming enforcement.

Use **Create a merge commit** for feature/release PRs to retain the small meaningful commits and their IDs, including contract/test-design/red/green evidence. Do not squash all feature history into one commit by default. Evidence must refer to the actual reviewed/tested commits, not invented timestamps. After this agreed workflow starts, synchronize shared branches through reviewed merges rather than rewriting their history.

Before CI exists in D1, attach actual local build/test results to the PR candidate and have reviewer inspect them. Once CI exists, configure real build/test job names as required status checks and enforce the failure gate; completed CI is due Lab 5. Do not configure a fictitious check name or mark a planned workflow as passing. PR checks still apply when new commits are added or staging changes.

GitHub references: [PR reviews](https://docs.github.com/en/pull-requests/reference/pull-request-reviews), [protected branch review/check/conversation settings and plan availability](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches). Human approval requirement does not mean it has already happened.

## 7. Sprint release PR

After foundation and all four feature PRs merge, run integration/system/acceptance/build checks on develop and complete [DoD](dod.md) evidence. Failures go through a linked fix branch/PR and re-test. Then open `Sprint 1: release registration workflow` with **head develop → base main**; the teammate reviews the full increment, results, release setup and disclosed limitations before merge. Record main merge/tag/commit and test the actual submitted release version.

This gives **five implementation/setup PRs plus one release PR** as the normal path; real docs/fix PRs add only when necessary. No PR count/review/merge outcome exists yet. Final PDF/report includes actual IDs, authors/reviewers/findings and release evidence. Documentation already directly committed to develop must be reviewed honestly at the current stage; do not present those commits as previously PR-approved.

## Revision history

| Version | Date | Change | Review |
|---|---|---|---|
| 0.1 | 2026-11-06 | Proposed branches, feature dependencies, GitHub PR/teammate gates, merge policy and release path | Pending team agreement; no branches/PRs/settings created |
| 0.2 | 2026-11-06 | Recorded user selection of Feature → develop → main with develop as sprint staging | Workflow selected by user; teammate review pending; no branches/PRs/settings created |
