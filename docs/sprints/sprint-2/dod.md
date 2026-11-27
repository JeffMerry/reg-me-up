# Sprint 2 Definition of Done

Version0.2 — 26 November2026. Refs #40–#45/#51. **Policy CONFIRMED; implementation NOT STARTED / verification NOT RUN.** [Actual COMMENTED review and named ownership](review-record.md). Policy/ownership evidence below is recorded separately from pending formal approval, implementation and release.

## Planning acceptance — #40

- [ ] Starting SHA and accepted Sprint1 baseline distinguished; findings register includes actual Lab6 retest gap and Lab7 announcement provenance
- [x] Q-04–Q-08 and legacy policy confirmed by THN4 review6068033006 on26Nov2026; scope/date/state recorded in review-record.md
- [ ] Actual technical implementation/migration choices verified in their PRs; policy confirmation is not runtime verification
- [ ] F-05/F-06/F-09 contracts, numbered AC, STS/DoD and UI/API/data design versioned before related implementation
- [ ] Central SRS/inventory/System SDS/traceability updated for Sprint2 without overwriting peer-owned Lab7 rules
- [x] Named feature/shared-work/migration/tests/evidence owners recorded from user allocation on26Nov2026; target dates remain planning milestones
- [ ] Reviewer checks this ownership follow-up before formal approval/merge
- [ ] Planning PR receives substantive different teammate review and merges into staging; no implementation/review result invented

## Every feature

- [ ] AC mapped to real code/file/test/result/version; success, boundary, invalid, access and persistence verified
- [ ] Test RED caused by missing intended behavior and GREEN of same test recorded with command/commit/output, including skipped/failed counts
- [ ] Additive migrations reviewed and applied/repeated on isolated DB preserving old records/checksums; no production reset or automatic seed
- [ ] Backend session/role/ownership/CSRF/privacy and shared lock protocol verified; real PostgreSQL races have synchronized/observer evidence
- [ ] UI/API/DB flow demonstrates saved retrieval, meaningful rejection and forbidden API operation, with responsive/keyboard/expiry/error cases
- [ ] Existing regression and changed-contract expectations justified/versioned; no weakening unrelated tests
- [ ] Teammate substantive PR review, responses/resolutions and passing actual CI linked; merge into sprint/02-staging documented
- [ ] Exact accepted main release and post-deploy results linked under #45; staging acceptance is not production acceptance

## Integrated release and Deliverable2

- [ ] Lab7 main→staging integration and semantic/migration regression recorded; scope-specific shared validator references are real
- [ ] F-05/F-06/F-09 complete against all reviewed AC, with accepted Sprint2 main identity preserved
- [ ] F-07/F-08 full contracts and at least one meaningful implemented/tested Sprint3 workflow included (#44); remaining AC/status explicit
- [ ] Build/tests/integration/selected journeys run on candidate commit; unresolved defects and failed/skipped cases disclosed
- [ ] GCP deploy identity and post-deploy critical journey/persistence evidence actual, aligned with main CI; generic smoke not substituted for domain tests
- [ ] Full SRS/inventory/System SDS plus complete baseline FR/BR/important NFR matrix and actual results embedded in one PDF
- [ ] Two Sprint2 demos, Sprint3 progress, Sprint1 continuity, two actual test excerpts (domain/access), two substantive Issue/PR chains embedded
- [ ] Known defects/debt reviewed with disposition; readiness and dated remaining-work plan to13Dec includes owners/dependencies/tests/UAT/video/release
- [ ] README/Docker/env/migration/seed/setup current; safe test accounts available through private course handoff or local seed without secrets in report/Git
- [ ] PDF navigation/page references/captions/version checked; both students identified; contributions/AI-use accurate
- [ ] Human submits to LEB2 by29Nov2026 23:59 Asia/Bangkok and actual submission evidence recorded; repository/deployment retained through grading

No check is satisfied by AI review, a closed Issue alone, an unexecuted test plan or an unrelated green run. Record incomplete work as incomplete.

## Current audit checkpoint — 27 November 2026

The planning checklist above preserves original checkpoints rather than asserting current failures. Planning #51 and features #57/#65/#66 have actual approvals/staging merges. Lab7 sync #64 and version #59 are merged. Existing executed source/CI evidence is linked in [acceptance audit](acceptance-audit.md), which identifies the remaining specific cases and release gates. Whole-feature or full STS ranges are not checked from a suite total. JeffMerry owns remaining work/release evidence and THN4 peer review under the updated allocation; F07/F08 contracts are prepared, not implemented. Use the [delivery plan](../deliverable-2/plan.md) for current order/targets.
