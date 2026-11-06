# RegMeUp — Sprint 1 Product Definition of Done

Version 0.1 — 2026-11-06. Pre-implementation checklist; pending teammate review. **No completion boxes checked.** User adoption of design is not evidence of teammate review, implementation or successful verification.

## 1. Before each feature implementation

- [ ] Relevant SRS/SDS/UI/feature contract/AC/STS read and consistent; changes have version/reason/impact.
- [ ] Contract and test design recorded in version control before corresponding implementation; actual commit/date retained, no backdating.
- [ ] Teammate reviews feature UI/design/test cases; actual reviewer and specific finding/question/reason recorded in Issue/PR.
- [ ] Issue, bounded feature branch from current develop, author and different teammate reviewer assigned.
- [ ] Exact compatible dependencies/runtime/DB versions recorded (ENG-01); synthetic local/test setup does not use production secrets or reset non-test DB.

## 2. Per-feature completion

- [ ] Required UI/API/DB behavior implemented across applicable layers; later-sprint controls absent.
- [ ] Acceptance criteria all have actual suitable tests/checks linked in STS/traceability.
- [ ] Meaningful domain/access tests executed and assertions inspected; UI alone/mock DB alone not used as proof.
- [ ] F-01 login/logout/identity/hash/expiry/CSRF; F-02 validation/discovery/own list; F-03 full/duplicate/last-seat/own retrieval/restart; F-04 owner-only private list all verified where relevant.
- [ ] Meaningful rule work has real intended-behavior red→green versions/output; no missing-module error presented as domain-rule red.
- [ ] Tests, setup and docs match implementation; failures/skips/incomplete work disclosed and linked to Issues.
- [ ] Teammate PR review includes substantive checks and fixes; author has not self-approved.
- [ ] Reviewed feature integrated into develop and integration checks recorded for tested version.

## 3. Sprint release completion

- [ ] F-01–04 and SYS-01 local setup complete; baseline AC-01–15 verified via [STS](sts.md).
- [ ] AC-13: fresh documented install/config/migrate/seed/build/test works on another clean local setup with synthetic data and without production secrets (TEST-13).
- [ ] Build, unit/API/DB/concurrency/selected E2E and manual UI/restart checks run against identified candidate; output includes pass/fail/skipped and tested commit.
- [ ] All protected APIs tested for anonymous/role/ownership; allowed controls pass; private DTOs/fields do not leak.
- [ ] Capacity/unique-active invariants hold with real concurrent requests and final DB checks; restart retrieves previously API-created ID without reseeding.
- [ ] Selected normal/rejection/access/persistence demonstrations have expected/actual/role/starting state/steps and release commit, using real application.
- [ ] Integration/system acceptance reviewed; staging→main release PR reviewed by teammate; accepted tag/commit recorded.
- [ ] README contains actual dependencies/env/migrations/seed/run/build/test steps and safe local account procedure; no real passwords/tokens/DB secrets in Git/PDF/frontend.
- [ ] Traceability maps all baseline requirements (including later sprints) and current actual results/gaps honestly.
- [ ] D1 self-contained PDF contains A–E engineering content and F selected real evidence, real page navigation, team/repo/release identity, two completed Issues/PRs, meaningful review/history, actual contribution and AI-use declaration.

Docker/completed CI/GCP are Lab 5 completion items, not claimed complete here or required as completed D1 infrastructure. D1 architecture must support that later delivery; local runnable release/tests/review remain required.

## 4. Evidence fields (currently empty)

| Evidence | Actual reference |
|---|---|
| Contract/test-design commits and human review | ตรวจ contract version จาก Git history ของไฟล์; human review NOT RECORDED |
| Implementation commits / feature Issues/PRs | NOT RECORDED |
| Red/green rule evidence | NOT RUN |
| Build/test commands/counts/tested commit | NOT RUN |
| Restart/demo/manual UI results and tester | NOT RUN |
| Reviewed staging/main release and tag | NOT RECORDED |
| Team contributions / actual AI use | This document set was drafted with Codex assistance; human review/contributions must be recorded from actual work, not inferred |

Known current limitations: no application/test suite exists in inspected checkout; teammate review and ENG-01/02 pending; Q-04–09 deferred to their affected sprints. Record actual contract/implementation commit references from Git history when assembling evidence. Incomplete evidence means not Done even when documentation exists. Do not remove requirements/weaken assertions to manufacture completion.

## Revision history

| Version | Date | Change | Review |
|---|---|---|---|
| 0.1 | 2026-11-06 | Pre-implementation gates and product/release evidence checklist | Pending teammate review |
