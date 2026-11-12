# RegMeUp — Three-sprint plan

Version 0.8 — 2026-11-12 (Asia/Bangkok). Planning baseline; pending teammate review. User selected Feature → sprint/01-staging → main. No feature completion or test execution claimed.

## 1. Goals, scope and dependencies

| Sprint | Goal / feature allocation | Dependencies | Completion outcome |
|---|---|---|---|
| 1 | Useful registration journey: F-01/02/03/04 + SYS-01 local setup | Baseline SRS/SDS/UI; feature contracts/STS; exact runtime versions; two-person review workflow | Working UI→API→DB publication/discovery/register/retrieve/owner list; server role/ownership; capacity/duplicate/concurrent last seat; restart persistence; executed verification and reviewed release on main |
| 2 | Registration/event lifecycle and teaching: F-05/06/09 | Accepted Sprint 1; Q-04–08; compatible event-lock protocol and reviewed contract revisions | Cancellation/seat return, edit/capacity/deadline enforcement, Instructor assignment/assigned reads; regression; deployed integrated candidate |
| 3 | Attendance/reporting and product hardening: F-07/08 | Prior lifecycle/ownership; Q-09; contracts before their implementation | Check-in/attendance/report calculations; usability/security/failure handling; final regression, UAT re-tests, defects disclosed and complete release |
| Final UI pass | Cross-feature presentation refinement: F-10 | F-01–F-09 integrated; functional defects resolved under their owning features | Consistent visual system and refined responsive/keyboard interaction details across implemented screens; evidence and teammate review before final release |

Sprint 3 must have contracts and meaningful tested progress by 29 November, alongside completed Sprint 2. Do not defer all Sprint 3 work until after that date.

## 2. Checkpoints from supplied course documents

| Due date | Assessment | Required state |
|---|---|---|
| 15 Nov 2026, 23:59 — LEB2 update reported by user | Deliverable 1 | Complete baseline A–D, Sprint 1 contracts/STS/DoD E, working reviewed local release and real evidence F; self-contained PDF A–F |
| 15 Nov 2026, 23:59 | Lab 5 | Accepted Sprint 1 containerized; CI checks and enforced failing gate; durable GCP deployment and repeatable release pipeline |
| 22 Nov 2026, 23:59 | Lab 6 | Independent cross-team UAT, genuine defect triage/fix/re-test, recorded tested version |
| 29 Nov 2026, 23:59 | Deliverable 2 / Lab 7 | Sprint 2 complete + Sprint 3 tested progress on integrated deployed candidate; separately evidenced instructor/TA-approved maintenance change and metrics |
| 13 Dec 2026, 23:59 | Final | All baseline features integrated/released/verified, final handoff/report/video per final guidance |

Source and discrepancy: [G course schedule](../references/group_work_specs_v1.md) lines 54–64 and [D1 handout](../references/project_deliverable_1_v1.md) lines 5 and 170 specify the earlier D1 date of 8 November 2026 at 23:59; G specifies Lab 5 on 15 November 2026 at 23:59. THN4's [PR #2 review](https://github.com/JeffMerry/reg-me-up/pull/2) on 10 November requested changing D1 to 15 November at 23:59. On 11 November the user confirmed that LEB2 was updated to that D1 deadline; the plan uses the reported LEB2 date while preserving the original course files. LEB2 has not been independently inspected in this session; retain the announcement or submission-page reference when available. Detailed later handouts are not present locally. The R draft additionally expects at least one meaningful Sprint 3 workflow/rule implemented and tested by D2; retain that planning target.

The assessments have separate submission requirements even if their deadlines are later confirmed to coincide:

| Assessment | Submission / evidence |
|---|---|
| Deliverable 1 | Self-contained PDF Parts A–F, including baseline, feature contracts/test designs and actual local Sprint 1 release, setup, tests and review evidence, per [D1 handout](../references/project_deliverable_1_v1.md) |
| Lab 5 | Containerized and deployed Sprint 1, CI/CD including failed-check enforcement, GCP and durable data/repeatable delivery, with required Lab 5 evidence per [G](../references/group_work_specs_v1.md); detailed Lab 5 handout not in this repository |

## 3. Sprint 1 work sequence

| Step | Work / output | Gate before proceeding | Actual state |
|---|---|---|---|
| A | SRS/features/traceability/SDS/plan + F-01–04 contracts/STS/DoD | User direction recorded; teammate reviews behavior/design and logs real findings | Documents v0.1 prepared; review pending |
| B | Assign Issues/leads/reviewers; select/pin compatible runtime/dependency versions; establish local/test DB and migration setup | ENG-01/02 resolved for affected work; contract/test design recorded in Git before corresponding implementation | PREPARATION: [SYS-01 #1](https://github.com/JeffMerry/reg-me-up/issues/1) assigned JeffMerry, THN4 designated reviewer; [versions](../dependency-versions.md) and [foundation AC/tests](sprint-1/sys-01.md) selected; install/provisioning/lockfile/tests NOT STARTED |
| C | F-01 identity/session + shared access foundation | Meaningful auth tests, hash/lifecycle/CSRF, teammate review | NOT STARTED |
| D | F-02 publish/discovery/own-event UI/API/DB | Validation/public privacy/owner rules and selected UI checks pass | NOT STARTED |
| E | F-03 register/own retrieval | Atomic concurrency/duplicates/restart tests pass; reviewed transaction implementation | NOT STARTED |
| F | F-04 owner registration list | Complete endpoint role/owner matrix plus selected Organizer E2E pass | NOT STARTED |
| G | Integrate staging, acceptance/regression/build, README/seed review, release PR to main/tag | [DoD](sprint-1/dod.md) evidence complete; disclose failures/skips/limitations | NOT STARTED |
| H | Assemble actual PDF A–F with page navigation/evidence | Release commit and real results/screenshots/reviews/contributions present | NOT STARTED |

UI reference layouts/components can be designed alongside contract review, but feature implementation and executable rule tests follow that feature's versioned design. The authorized documentation/SYS-01 preparation task starts planning portions of B only; it does not provision the environment or start implementation steps C–H.

### Final UI refinement after baseline features

Every feature first meets its baseline: the workflow, rules, required loading/empty/error/success states, and responsive/keyboard expectations work as specified. The baseline may use simple styling. After F-01–F-09 are integrated, F-10 provides a dedicated pass to review the screens together and improve visual consistency, hierarchy, spacing, typography, responsive composition, feedback, and accessibility details. The pass does not excuse incomplete or broken baseline behavior, and any behavior change remains with the owning feature. See the [F-10 refinement plan](f-10-ui-refinement.md).

F-10 is an explicit product-level workstream because it spans all screens and is intentionally sequenced after their baseline implementation. Track it with a GitHub Issue for ownership, prioritized findings, and review evidence. The issue has not yet been created; do not cite an issue number until it exists. An additional feature entry is useful for this team's feature inventory and release planning, but issue and feature are not universally required as a pair: use a feature when the work represents a coherent user-facing scope, and an issue to assign/track the concrete work. Small polish findings can instead be subtasks under the F-10 issue.

## 4. Two-person workflow

The user selected **Feature → sprint/01-staging → main**, with sprint/01-staging as sprint staging and teammate-reviewed PRs before merging features. Detailed branch/PR sequence, foundation scope, proposed review allocation and GitHub merge controls are in the [Sprint 1 branch plan](sprint-1/branch-plan.md). The documentation PR and SYS-01 Issue exist; this plan does not assert feature branches, approvals or GitHub protection settings.

Use `sprint/01-staging` as sprint staging and `main` as accepted release. Proposed naming: `feature/f-01-identity`, `feature/f-02-events`, `feature/f-03-registration`, `feature/f-04-owner-list`; fixes get bounded linked Issues. Branch names are conventions, not branches already created.

Issue → contract/test-design version → feature branch from current staging → failing intended-behavior test for meaningful rule work → implementation → passing checks/diff inspection → PR into sprint/01-staging reviewed by the other teammate → staging integration/system/acceptance checks → reviewed release PR to main → immutable release reference. Preserve contract revision reasons and real red/green versions.

No self-approval. Record a specific check/question/finding/reason for teammate approval. Both members must participate in requirements/design, tests, implementation, review/integration and later delivery/maintenance; do not assign permanent docs-only/code-only roles. SYS-01 Issue #1 and F-01/F-02 Issues #3/#4 are assigned JeffMerry; F-03/F-04 Issues #5/#6 are assigned THN4 at the user's direction. Teammate agreement and actual feature review approvals remain pending.

Before Lab 5, retain local build/test output against the tested commit. Completed CI/Docker/GCP belongs to Lab 5; use CI earlier if implemented, but never claim it exists from a plan. Main default branch does not itself establish protected checks/review policy; inspect GitHub settings separately.

## 5. Risks and remaining work

| Risk | Impact / action |
|---|---|
| D1 and Lab 5 both due 15 November; foundation and features not yet implemented | User reports the updated D1 deadline in LEB2; the earlier handouts still state 8 November. Confirm submission details on LEB2, estimate available hours, report actual status and do not fabricate evidence |
| New stack/package compatibility | Pin versions after checking both environments; no claim that dependencies are installed or commands run today |
| Race handling implemented with count outside lock | F-03 review requires same-client transaction and real PostgreSQL contention tests; Sprint 2 writers reuse lock protocol |
| UI protection mistaken for API authorization | TEST-09 calls backend directly for every protected endpoint; owner detail negative checks include metadata/totals |
| Too much late documentation | Record contract/design before implementation and attach actual results during feature work; do not backdate |
| UAT/maintenance compete with feature work | Arrange partner/TA guidance and reserve time around Lab 6/7; baseline new features do not count as approved maintenance changes |
| Missing later policies/handouts | Resolve Q-04–09 before affected contracts; verify final-video instructions from supplied originals/TA |

No fixed hour/day estimates or contribution counts have been agreed. At each integration checkpoint update actual status, remaining work and dependency changes. Product baseline stays visible in [traceability](../traceability.md), including unfinished later features.

## Revision history

| Version | Date | Change | Review |
|---|---|---|---|
| 0.1 | 2026-11-06 | Three-sprint allocation, assessment boundaries, Sprint 1 sequence/team workflow and honest current status | Pending teammate review |
| 0.2 | 2026-11-06 | Linked explicit foundation/feature/fix branches and peer-reviewed PR/release plan | Pending teammate review; workflow not executed |
| 0.3 | 2026-11-06 | Recorded user selection of Feature → develop → main, with develop as staging | Teammate review pending; workflow not executed |
| 0.4 | 2026-11-06 | Recorded SYS-01 Issue/lead, exact targets and bounded foundation acceptance/test preparation | Pending teammate review; installation/implementation/tests not started |
| 0.5 | 2026-11-10 | Updated workflow after develop was renamed sprint/01-staging | Pending teammate review |
| 0.6 | 2026-11-11 | Recorded user-reported LEB2 D1 deadline, preserved earlier handout discrepancy and separated D1/Lab 5 deliverables | LEB2 not independently inspected; teammate review pending |
| 0.7 | 2026-11-11 | Recorded user-directed feature Issue assignees | Teammate agreement and review pending |
| 0.8 | 2026-11-12 | Added F-10 final UI refinement after baseline feature integration | Planning only; GitHub issue and teammate review pending |
