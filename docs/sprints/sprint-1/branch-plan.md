# RegMeUp — Sprint 1 branch and pull request plan

Version 0.7 — 2026-11-11 (Asia/Bangkok)

Status: **USER-SELECTED WORKFLOW / PENDING TEAMMATE REVIEW**. On 6 November 2026 the user selected Feature → develop → main. On 10 November 2026, GitHub and the local branch were renamed from `develop` to `sprint/01-staging`; the current flow is **Feature → sprint/01-staging → main**. Feature PRs target sprint/01-staging and require teammate review before merge; the release PR targets main after integration checks. The user subsequently authorized documentation publication and SYS-01 preparation: `docs/sprint-1-branch-plan` holds the documentation changes and [SYS-01 Issue #1](https://github.com/JeffMerry/reg-me-up/issues/1) is open. On 11 November, the user directed the assignments below; teammate agreement and reviewer approval remain pending. No implementation branch or GitHub protection configuration is claimed.

## 1. Current repository and branch responsibilities

On 10 November 2026 GitHub and local `sprint/01-staging` pointed to `0581bdf` after the rename; `main` remained at `a8cbbb5`. PR #2 base changed to `sprint/01-staging` and teammate review remained pending. These are observed refs at that time, not a guarantee of current settings. The eight documentation commits already on sprint/01-staging are a documentation baseline, not teammate-reviewed implementation.

| Branch | Role | Source / PR target |
|---|---|---|
| `main` | Accepted Sprint 1 release with recorded integration/acceptance evidence | Release PR from `sprint/01-staging` after all feature PRs/integration checks reviewed |
| `sprint/01-staging` | Sprint staging/integration | Receives reviewed foundation/feature/fix/documentation PRs |

New work branches are created from **current sprint/01-staging when dependencies have merged**, not all from today's baseline. One feature branch covers applicable UI/API/DB/tests/docs as one bounded feature. Both members understand all layers and review each other's work.

## 2. Planned work branches and PR boundaries

| Order | Branch to create | Scope / linked work | Lead / planned reviewer | Required predecessor | PR base / readiness |
|---|---|---|---|---|---|
| 1 | `chore/sys-01-foundation` | SYS-01: pinned runtime/dependencies, client/server skeleton, Tailwind tokens/shared base setup, local/test PostgreSQL config, Prisma schema/Migrate and shared schema/seed plan, test runner setup, actual README commands; no completed domain workflow claimed | JeffMerry / THN4 | Baseline/design review; ENG-01 selections recorded | `sprint/01-staging`; fresh setup/build and meaningful setup checks actually run, teammate approves |
| 2 | `feature/f-01-identity` | F-01 contract: login/logout/me, hash/session/CSRF, backend role foundation, UI-01/navigation/guards, TEST-01/02/12 and applicable shared cases | JeffMerry / THN4 | Foundation merged | `sprint/01-staging`; auth/UI lifecycle checks, contract/review evidence and tests |
| 3 | `feature/f-02-events` | F-02: publish/public list/detail/own-event list, validation/timezone/privacy, UI-02/03/05/06, TEST-03/11/15 + shared cases | JeffMerry / THN4 | F-01 merged; shared registration relation from SYS-01 available for counts | `sprint/01-staging`; public/owner/validation API+DB and selected UI checks |
| 4 | `feature/f-03-registration` | F-03: atomic register, own list/detail/status, UI-03 registration + UI-04/04-D, TEST-04–07/10 + shared cases | THN4 / JeffMerry | F-02 merged | `sprint/01-staging`; real DB concurrency/uniqueness/privacy/restart verification required |
| 5 | `feature/f-04-owner-list` | F-04: owner-only event registrations/summary/pagination, UI-07 and UI-05 links, TEST-08 + shared cases | THN4 / JeffMerry | F-03 merged | `sprint/01-staging`; owner positive/negative controls, safe DTOs/counts and Organizer journey |

Initial baseline contracts: [F-01](f-01.md), [F-02](f-02.md), [F-03](f-03.md), [F-04](f-04.md), [STS](sts.md), [DoD](dod.md). Review the relevant subset before each implementation; if details change, record revised design/test intent first on that branch before code.

Foundation schema responsibilities must be agreed in its Issue: establish shared migrations once, including registration relation/constraints needed by F-02 counts even before registration endpoints exist. This is consistent with [feature dependency clarification](../../features.md). F-01–04 implement their domain behavior and add only genuinely required schema changes via new ordered migrations. Do not duplicate/rewrite already shared migrations across feature branches. Foundation auth libraries/store schema may be installed/pinned there; login/logout logic remains F-01.

SYS-01 now has a [bounded preparation contract](sys-01.md), [dependency targets](../../dependency-versions.md) and [Issue #1](https://github.com/JeffMerry/reg-me-up/issues/1) identifying setup acceptance/test design and migration ownership. Issue #1 was updated to Prisma ORM/Migrate; exact Prisma versions remain to be selected and compatibility verified. Executable setup/lockfile/provisioning and all foundation checks remain unimplemented/NOT RUN. Do not claim full TEST-13/E2E success before domain workflows exist. Full reproducibility across the released product is verified again at integration.

## 3. PR and teammate review workflow

1. Use a real GitHub Issue with SYS/F ID, linked requirements/contract/AC/STS, scope, dependency, lead and a different teammate reviewer. SYS-01 [#1](https://github.com/JeffMerry/reg-me-up/issues/1) and F-01 [#3](https://github.com/JeffMerry/reg-me-up/issues/3)/F-02 [#4](https://github.com/JeffMerry/reg-me-up/issues/4) are assigned to JeffMerry; F-03 [#5](https://github.com/JeffMerry/reg-me-up/issues/5)/F-04 [#6](https://github.com/JeffMerry/reg-me-up/issues/6) are assigned to THN4, per the user's direction on 11 November 2026. Teammate agreement on allocation and actual PR reviewer requests/approvals remain pending.
2. Before code, teammate reviews the current contract/UI/test design in that Issue with a substantive check/question/finding/reason. Record actual date/person; existing baseline commits do not count as historical approval. If revision is needed, use a real docs PR or contract-first commit on the work branch.
3. Create work branch from updated sprint/01-staging after its predecessor merges. Retain specification/test-design version before corresponding implementation. For meaningful rule work record actual intended-behavior red test and green correction versions.
4. Implement only the bounded feature, update actual test results/traceability/docs and commit meaningful increments. Red intermediate commits may exist on the work branch; the PR candidate must pass required verification before merge.
5. Push that branch and open a feature PR with **base sprint/01-staging**, linked Issue and feature/AC/TEST IDs. Request the other teammate as reviewer on GitHub when ready. Do not count an AI review or author self-review as teammate approval.
6. Reviewer inspects behavior/assertions/schema/privacy and reproduces the relevant checks. Submit actual Approve/Request changes with specific reasoning. Author fixes comments on the same branch; changes affecting the diff receive review again.
7. Merge only after approval, resolved discussions and actual relevant checks. Record merge/tested commits and update Issue/board. Create the next feature branch from the updated sprint/01-staging. Remove completed temporary branch only after confirming merge; PR/history remain evidence.

Use the same work ID in each Issue and its PR title. The Issue titles below exist; PR titles are suggestions, not PRs already opened. Link the relevant Issue in the PR description, for example `Refs #5` on the F-03 implementation PR. PRs target the non-default staging branch, so do not assume a closing keyword will automatically close the Issue on merge; close it only when its criteria and team workflow are satisfied. The documentation PR only references SYS-01 and does not close it.

| Work | Existing Issue | Suggested PR title |
|---|---|---|
| SYS-01 | [#1 — SYS-01: establish local project foundation](https://github.com/JeffMerry/reg-me-up/issues/1) | `SYS-01: establish local project foundation` |
| F-01 | [#3 — [F-01] Implement identity and access](https://github.com/JeffMerry/reg-me-up/issues/3) | `F-01: implement identity and access` |
| F-02 | [#4 — [F-02] Publish and discover events](https://github.com/JeffMerry/reg-me-up/issues/4) | `F-02: publish and discover events` |
| F-03 | [#5 — [F-03] Register and retrieve own registrations](https://github.com/JeffMerry/reg-me-up/issues/5) | `F-03: register and retrieve own registrations` |
| F-04 | [#6 — [F-04] List registrations for owned events](https://github.com/JeffMerry/reg-me-up/issues/6) | `F-04: list registrations for owned events` |
| Sprint release | No release Issue recorded | `Sprint 1: release registration workflow` |

PR description must state problem/resulting behavior, linked Issue/contract/AC, key UI/API/DB changes, exact verification command/result/tested version and known limitations. Include meaningful screenshots for UI changes and API/DB evidence where appropriate; screenshots alone do not prove security/concurrency. Never fill PASS/reviewer/evidence until they exist.

## 4. Work and review allocation for two members

| Work | Lead | Planned reviewer |
|---|---|---|
| SYS-01 foundation | JeffMerry (Issue #1 assigned) | THN4 (designated; approval pending) |
| F-01 ([#3](https://github.com/JeffMerry/reg-me-up/issues/3)) | JeffMerry (GitHub assignee) | THN4 (planned) |
| F-02 ([#4](https://github.com/JeffMerry/reg-me-up/issues/4)) | JeffMerry (GitHub assignee) | THN4 (planned) |
| F-03 ([#5](https://github.com/JeffMerry/reg-me-up/issues/5)) | THN4 (GitHub assignee) | JeffMerry (planned) |
| F-04 ([#6](https://github.com/JeffMerry/reg-me-up/issues/6)) | THN4 (GitHub assignee) | JeffMerry (planned) |
| Sprint release PR | THN4 (planned; no release Issue recorded) | JeffMerry (planned) |

The feature Issue assignees were set at the user's direction; teammate agreement is not independently confirmed. Planned reviewers and release allocation are not actual PR reviewer requests, approvals or contribution records. Record team agreement and request review on each actual PR. Both join baseline/schema/API discussions and work on tests/design/UI/API as applicable. While one implements a dependency, the other can review it, prepare downstream test cases and review UI/contracts. The default delivery sequence follows feature dependencies; do not merge downstream work against missing auth/data behavior.

## 5. Additional branches when real work requires them

| Pattern | When / target |
|---|---|
| `docs/sprint-1-<issue>-<short-description>` | Real contract/design/test-plan correction; branch from sprint/01-staging, reviewed PR back to sprint/01-staging. No empty PR merely to simulate a past review |
| `fix/sprint-1-<issue>-<short-description>` | Integration/acceptance defect after feature merge; branch from current sprint/01-staging, regression test + fix + reviewed PR to sprint/01-staging |

Review corrections before feature merge stay on that feature branch/PR. Avoid creating separate branches for every small commit. No release branch is required for this plan: reviewed sprint/01-staging itself supplies the final release PR.

## 6. GitHub merge controls and commit policy (to configure later)

For main and sprint/01-staging, propose required PR review with **one approving teammate** with appropriate write access, resolved conversations, stale approval dismissal after reviewable changes, no ordinary direct/force pushes and no admin bypass for normal feature delivery. These are proposed settings, not verified current repository settings. Availability depends on repository visibility/GitHub plan; inspect capabilities before claiming enforcement.

Use **Create a merge commit** for feature/release PRs to retain the small meaningful commits and their IDs, including contract/test-design/red/green evidence. Do not squash all feature history into one commit by default. Evidence must refer to the actual reviewed/tested commits, not invented timestamps. After this agreed workflow starts, synchronize shared branches through reviewed merges rather than rewriting their history.

Before CI exists in D1, attach actual local build/test results to the PR candidate and have reviewer inspect them. Once CI exists, configure real build/test job names as required status checks and enforce the failure gate; completed CI is due Lab 5. Do not configure a fictitious check name or mark a planned workflow as passing. PR checks still apply when new commits are added or staging changes.

GitHub references: [PR reviews](https://docs.github.com/en/pull-requests/reference/pull-request-reviews), [protected branch review/check/conversation settings and plan availability](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches). Human approval requirement does not mean it has already happened.

## 7. Sprint release PR

After foundation and all four feature PRs merge, run integration/system/acceptance/build checks on sprint/01-staging and complete [DoD](dod.md) evidence. Failures go through a linked fix branch/PR and re-test. Then open `Sprint 1: release registration workflow` with **head sprint/01-staging → base main**; the teammate reviews the full increment, results, release setup and disclosed limitations before merge. Record main merge/tag/commit and test the actual submitted release version.

This gives **five implementation/setup PRs plus one release PR** as the normal path; real docs/fix PRs add only when necessary. The current documentation publication task does not constitute any of those implementation/release PRs or an approved review. Final PDF/report includes actual IDs, authors/reviewers/findings and release evidence. Documentation already directly committed to sprint/01-staging must be reviewed honestly at the current stage; do not present those commits as previously PR-approved. Documentation PR publication/reviewer request is tracked via SYS-01 Issue #1; approval remains separate.

## Revision history

| Version | Date | Change | Review |
|---|---|---|---|
| 0.1 | 2026-11-06 | Proposed branches, feature dependencies, GitHub PR/teammate gates, merge policy and release path | Pending team agreement; no branches/PRs/settings created |
| 0.2 | 2026-11-06 | Recorded user selection of Feature → develop → main with develop as sprint staging | Workflow selected by user; teammate review pending; no branches/PRs/settings created |
| 0.3 | 2026-11-06 | Recorded actual documentation branch and SYS-01 Issue/lead; linked version selection and foundation test design | Design review pending; no implementation or approval claimed |
| 0.4 | 2026-11-10 | Updated planned SYS-01 foundation scope to Prisma ORM and Prisma Migrate | Pending teammate review; no implementation claimed |
| 0.5 | 2026-11-10 | Recorded rename of develop to sprint/01-staging and updated feature/release PR workflow | Teammate review pending; no implementation claimed |
| 0.6 | 2026-11-11 | Added proposed named allocation, actual feature Issue links and paired Issue/PR title examples | Pending teammate review; feature Issues unassigned |
| 0.7 | 2026-11-11 | Recorded user-directed Issue assignees and planned reviewers in branch table; corrected SYS-01 Issue status | Teammate allocation agreement and PR review pending |
