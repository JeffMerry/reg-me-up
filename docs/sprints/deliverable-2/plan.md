# Remaining delivery work and release evidence plan

27Nov2026 (Asia/Bangkok). Refs #44/#45. The user changed allocation in chat: **JeffMerry owns all remaining implementation, integration, migrations/tests, release preparation and release evidence/report**. THN4 remains the different teammate reviewer. Historical F09 implementation credit/approval records are retained. Human LEB2 submission is not performed by this plan; identify the submitter explicitly before submission.

## Gates and proposed targets

Branch allocation clarified27Nov2026 before gap work: `test/sprint-2-acceptance` under #45 contains S2-G01–04 tests and bounded fixes/evidence; `feature/f-07-check-in` under #44 implements reviewed Check-in; `docs/deliverable-2` under #45 compiles candidate/release/report evidence. Each starts from current staging and PRs back there. Release PR uses staging→main; no extra release/F08 branch is required for the current checkpoint. Issue44 remains open for actual F07 implementation after its contract-only PR67 merged.

| Order / target | Owner work and concrete artifact | Exit / review evidence |
|---|---|---|
| 27Nov | Sprint2 [acceptance audit](../sprint-2/acceptance-audit.md), confirmed Q09 and full F07/F08 contract/AC/STS, updated ownership | THN4 reviews docs PR; user confirmation is recorded separately from peer approval |
| 27–28Nov | Close S2-G01–04 on a bounded verification/fix branch; reconcile stale F06 Instructor-pending statements with actual executed scope | Real added checks/runs, findings/disposition, exact candidate and reviewed merge; full Sprint2 AC completion assessed, not inferred from Issue closure |
| 28Nov | Preserve reviewed Sprint2 candidate/checkpoint SHA, then implement reviewed F07 D2 workflow from latest staging; additive schema, test-first, API/DB/UI and restart/access cases | THN4 feature review, passing CI and staging integration; accepted main identity is recorded only after actual release; record F08/unachieved AC honestly |
| 28–29Nov | Candidate regression/system journeys and report/PDF assembly in parallel | Exact source/candidate identity; two Sprint2 demos + one Sprint3 workflow, actual domain/access test excerpts and two substantive Issue/PR chains |
| By29Nov before submission | Reviewed staging→main release(s), main-only deployment and post-deploy domain/persistence verification | mainSHA→CI/deploy run→image digest→Cloud Run revision→URL/time; actual acceptance and known defects; do not use staging/browser tests as deployed proof |
| 29Nov by23:59 | Human submits one final team PDF via LEB2 and records receipt/version | PDF readable/self-contained, both student names/contribution/AI use accurate; actual submission evidence required |
| 30Nov–13Dec | Finish remaining F07/F08 AC, UAT/fixes/final video/release with dated owner/dependency/test status | Follow-up plan updated with real progress; exam period1–11Dec limits availability; no claim of completed future work |

Dates are proposed work targets anchored to the existing Issue45 deadline, not promises or achieved milestones. Do not defer required Sprint2 AC to Sprint3 simply to label Sprint2 complete. F08 implementation may remain explicit remaining work at D2 if the actual assignment checkpoint permits, but its full contract/AC/STS is required now. Preserve an immutable Sprint2 checkpoint/release reference separately from later F07 source.

## Evidence ledger template

| Item | Source required | Current state |
|---|---|---|
| Sprint1 continuity / maintenance | Accepted baseline3eba355; Lab6 retest source records; Lab7 release62 and sync64; selected unchanged journey on candidate | Historical sources exist; final candidate continuity not executed by this plan |
| Sprint2 implementation/review | F05 #57, F06 #65, F09 #66; reviewed heads/merge SHAs and AC→test mapping | Merged staging40a4db2; [audit](../sprint-2/acceptance-audit.md) has remaining gaps |
| Latest established regression | F09 head65e4753, CI45969108634; earlier0dd4800 CI45966205796 logs93/94/62 | Existing CI evidence, not new Sprint3/candidate acceptance |
| Domain test excerpt | Actual synchronized cross-feature rule or check-in duplicate/window test with fixture/assertions/RED/GREEN/result | Select after gap closure/F07 implementation; no invented excerpt |
| Access test excerpt | Real direct backend owner/role denial with positive control and unchanged DB/DTO allowlist | Select exact tested case/version |
| Demos | Role/preconditions/steps/expected/actual/source/run, saved retrieval and meaningful rejection | Prepare two Sprint2 + one implemented Sprint3 workflow; do not substitute static UI mockup |
| Release/deployment | Immutable sourceSHA/image digest/revision/traffic/URL/time, migrations and actual domain checks | TBD; no new deployment or production data mutation authorized by this planning action |
| Report counting | Confirmed unique-person/current-state policy and example; actual results when F08 exists | Contract only; counts shown in designs are examples, not measured output |
| PDF | Full SRS/features/System SDS; full Sprint2/Sprint3 contracts/STS/DoD; complete baseline traceability; defects/remaining work/contributions/AI use | Assembly NOT STARTED; links alone do not replace assessed content |
| Submission | Actual final PDF/hash/version and LEB2 receipt/time by named human | NOT SUBMITTED by this work |

## Release review and operational sequence

From a clean reviewed candidate, run required migrations/checks in guarded isolated DBs and selected acceptance journeys. Open reviewed release PR into main only when relevant gates are satisfied; inspect actual branch diff/CI rather than assuming it matches staging. Keep Sprint2 checkpoint SHA/tag. Deployment uses the existing main-only pipeline/operator procedure; it does not auto-seed accounts. New Instructor demo provisioning requires all three distinct16–1024-byte runtime password inputs; share credentials privately using the agreed course process, never in evidence/Git/chat.

For an authorized deployment record actual migration success, digest/revision/traffic and domain outcomes: publish1/60/61; register/cancel/re-register/deadline/capacity; current Instructor/overlap/forbidden reads; check-in when the reviewed feature exists. Retrieve persisted IDs after app restart/redeploy without reseed and capture real failure/rejection, not only health200. Cleanup only approved synthetic records with retained evidence; no arbitrary DB reset.

## Remaining-work tracker

| Scope | State now | Owner / dependency | Proposed target |
|---|---|---|---|
| Sprint2 S2-G01–04 | Identified, NOT RUN for missing selections | JeffMerry; existing staging + THN4 review | 27–28Nov |
| F07 AC01–08 | Contract prepared; code/tests NOT STARTED | JeffMerry; reviewed Q09 contract/schema | D2 workflow28–29Nov, remainder by13Dec |
| F08 AC01–06 | Contract prepared; code/tests NOT STARTED | JeffMerry; F07 schema and unique-person rules | Explicit remaining work through13Dec; earlier if time allows |
| F10 cross-screen refinement | Existing planned workstream, no completion claimed here | JeffMerry; baseline screens and prioritized findings, THN4 review | Final period before13Dec, without postponing baseline accessibility |
| Release/post-deploy/PDF | Plan only | JeffMerry; accepted candidate/reviewer/operator access | By29Nov submission checkpoint |

Do not infer a permanently docs-only/code-only team split from this late allocation. Report both teammates' actual historical contributions accurately.
