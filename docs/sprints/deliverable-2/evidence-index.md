# Deliverable 2 evidence index

Checkpoint: 27 November 2026 (Asia/Bangkok). Refs [#45](https://github.com/JeffMerry/reg-me-up/issues/45). Intended branch `docs/deliverable-2` → `sprint/02-staging`; release uses `sprint/02-staging` → `main`. This index gathers existing evidence and identifies missing records; it is not a completed acceptance report or PDF.

## Version and review ledger

| Record | Exact identity | Meaning |
|---|---|---|
| Accepted Sprint 1 baseline | `3eba355215f0689d2a00553b0e0ed7a4cbecd457` | Historical acceptance; re-run original critical journey on the final candidate |
| Sprint 2 checkpoint before F07 | `3a22a71d936f3aa52ad6d6d3e1a30e95467fc9c7` | Staging merge #68, not an accepted main release/tag |
| Combined documentation starting source | `7c85dcc3e762c7f2be62a2285264af8aa4f9a972` | Staging merge #69; F05/F06/F09 plus implemented F07 |
| #68 peer review | [THN4 APPROVED 6087075354](https://github.com/JeffMerry/reg-me-up/pull/68#pullrequestreview-6087075354), head `50d6943f3ce869150f47d201989d64e13005c48f`, 27Nov17:55:37 Bangkok | Selected G01–04 accepted for staging integration; G05–06 remain |
| #69 peer review | [THN4 APPROVED 6089008375](https://github.com/JeffMerry/reg-me-up/pull/69#pullrequestreview-6089008375), head `cc55b4a3761d58c04402ac34793a3a44ddfb4204`, 27Nov20:38:55 Bangkok | F07 accepted for staging integration |
| #69 merge | [PR #69](https://github.com/JeffMerry/reg-me-up/pull/69), `7c85dcc3e762c7f2be62a2285264af8aa4f9a972`, 27Nov20:40:25 Bangkok, merged by THN4 | Actual merge; no main deployment implied |
| Latest verified PR CI | [45990942080](https://github.com/JeffMerry/reg-me-up/actions/runs/45990942080), head `cc55b4a3761d58c04402ac34793a3a44ddfb4204` | GitHub run conclusion SUCCESS; counts recorded in the actual #69 peer review: unit93/integration128/browser87, migrations/typecheck/build/Docker PASS |
| Tested synthetic PR merge | `4d4e2740e1ddcf47d1b4dd784c77c70610d99d8a` | Reported by #69 PR/issue execution record; distinguish from actual staging merge above |
| Submitted main source / release tag | TBD | Not established by this compilation |

The run metadata, actual reviews, #69 merge and actual job140478323371 logs were read while preparing this evidence set. The [CI excerpt](ci-excerpt.md) independently verifies checkout and counts. [Candidate verification](candidate-verification.md) retains later local environment failures, typecheck/build PASS and the user's serialized unit93/93 PASS on Node24.14.0. A PR CI run is not a fresh execution on the final submitted main commit.

## Compiled evidence package

| File | Concrete content |
|---|---|
| [Current traceability](current-traceability.md) | All11 FR/13 BR/7 NFR → feature/sprint/AC/planned test/actual test/result/version and uncovered scope |
| [Feature completion](feature-completion.md) | Every Sprint2 AC; F07 AC01–08 executed selections and F08 AC01–06 remaining work; accepted main identity still TBD |
| [Test excerpts](test-excerpts.md) | Actual domain persistence and direct backend access tests, setup/assertions/commands, real RED/GREEN provenance and CI file results |
| [Review chains](review-chains.md) | Two meaningful Sprint2 Issue→branch→RED/GREEN→substantive teammate review→staging chains, with exact IDs/dates and release boundary |
| [CI excerpt](ci-excerpt.md) | Selected original UTC job-log lines: checkout, file/count summaries and local CI image identity |
| [Candidate verification](candidate-verification.md) | Actual agent/operator attempts, environment/failure disclosure and remaining commands |
| [Setup/release handoff](setup-and-release.md) | Dependencies, env names, migrations/seed/guard/run/test/deployment and unfilled actual release fields |
| [Readiness/findings/plan](readiness.md) | Concrete open selections/debt/UAT/cloud gaps and dated work through13Dec |
| [Source records](source-records.json) | Selected actual GitHub PR/review metadata, CI identity and explicitly user-reported unit result; release fields remain null |

## Parts A–E source map

| Part / obligation | Repository evidence | Current boundary / missing evidence |
|---|---|---|
| A: Sprint1 continuity and maintenance | [Sprint2 baseline](../sprint-2/README.md), [decisions/findings](../sprint-2/decisions.md), [Lab7 sync](../sprint-2/lab7-sync-evidence.md) | Historical sources retained; final candidate original journey and independent RegMeUp UAT disposition must be reconciled. DineQueue UAT is evidence about the other system |
| B: complete Sprint2 features | [F05](../sprint-2/f-05-evidence.md), [F06](../sprint-2/f-06-evidence.md), [F09](../sprint-2/f-09-evidence.md), [acceptance additions](../sprint-2/acceptance-evidence.md) | #57/#65/#66/#68 merged; per-AC completeness and accepted main version still require G05/release assessment |
| C: Sprint3 tested progress | [F07 implementation/AC mapping/RED–GREEN](../sprint-3/f-07-evidence.md), [Sprint3 contracts](../sprint-3/README.md), [STS](../sprint-3/sts.md), [DoD](../sprint-3/dod.md) | #69 approved/merged; F08 contract-only. Human/cloud checks remain explicit |
| B/C: demonstrations and actual test excerpts | Feature evidence above; [candidate/demo record below](#candidate-and-demonstration-record) | Existing automated selections exist; final reviewer-selected journeys and embedded code excerpts still required |
| D: full engineering baseline | [SRS](../../srs.md), [features](../../features.md), [System SDS](../../system-sds.md), [traceability](../../traceability.md) | Reconcile every baseline FR/BR/important NFR with actual result/version; a suite total does not establish coverage |
| D: full Sprint2 contracts/design/tests | [Sprint2 index](../sprint-2/README.md), [F05](../sprint-2/f-05.md), [F06](../sprint-2/f-06.md), [F09](../sprint-2/f-09.md), [STS](../sprint-2/sts.md), [DoD](../sprint-2/dod.md), [design](../sprint-2/system-design.md) | Embed required full content in PDF; links alone are insufficient |
| E: candidate, release, deployment | [Acceptance audit G05–06](../sprint-2/acceptance-audit.md), [delivery plan](plan.md), [deployment procedure](../../labs/lab-05/deployment.md) | Fresh combined candidate results, reviewed main promotion, deploy chain and post-deploy persistence still pending |
| PDF/readiness/submission | [Delivery plan and ownership](plan.md) | PDF not assembled by this compilation; page navigation, actual contributions/AI use, final hash/version and human LEB2 receipt pending |

## Candidate and demonstration record

All rows below are **NOT RUN as final candidate demonstrations in this compilation**. Existing test evidence remains in the linked feature records. Use synthetic identities and record exact source SHA, environment, actor role, preconditions, steps, expected/actual outcome, retained record IDs, timestamp and evidence filenames for every execution.

| ID | Selected scope | Expected observations | Existing test source to select and embed |
|---|---|---|---|
| D2-J01 | Original Sprint1 login → discovery → register → participant history → owner roster | Saved registration retrieved; full/duplicate and forbidden owner access rejected by API; owner counts consistent | Existing Sprint1 feature evidence and candidate regression |
| D2-J02 | F05 cancellation and re-registration around F06 deadline | Cancelled history retained; new registration ID only before cutoff; at/after cutoff rejected with no insertion; seats consistent | `server/tests/integration/sprint2-acceptance.test.ts`, G01 |
| D2-J03 | F09 owner assign/replace → Instructor teaching retrieval → fresh application process | Current assignment persists without reseed; former/unassigned Instructor404; overlapping assignment rejected, adjacency allowed | `server/tests/integration/sprint2-acceptance.test.ts`, G02–03 |
| D2-J04 | F07 owner check-in → saved roster/repeat → restart retrieval | Eligible201; repeat200 with same ID/time; cancelled/window denial; Participant/Instructor403 and other owner404 | `server/tests/integration/check-ins.test.ts`; `e2e/f-07.spec.ts` |

For the two required actual test excerpts, select a domain concurrency/window assertion and an independent direct API access matrix with positive control from the referenced tests. Embed real fixture/setup/assertions and their versioned results in the report. A prose description does not replace the code excerpts.

## Release and submission completion record

| Gate | Current result | Required completion record | Owner / dependency |
|---|---|---|---|
| G05 combined candidate | PARTIAL: local typecheck/build PASS; user serialized unit93/93 PASS; integration/browser/final journeys pending | Exact committed SHA; remaining commands/results; selected journeys and reviewer assessment | JeffMerry / combined source; THN4 review |
| Review follow-up | OPEN, non-blocking in #68/#69 | Track delayed-logout callback synchronization improvement; preserve actual reviewer disposition | JeffMerry / separately scoped test change if undertaken |
| Main promotion | PENDING | Release PR, reviewed head, actual required check names/results, merge SHA/date | JeffMerry / THN4 approval and G05 |
| Accepted Sprint2 / submitted identities | TBD | Immutable accepted source and submitted main tag/commit, distinguish pre-F07 checkpoint | JeffMerry / reviewed release |
| G06 deploy | NOT VERIFIED for this candidate | main SHA → CI/deploy run → image digest → Cloud Run revision → traffic/public URL/time, migration outcome | JeffMerry / deployment procedure |
| G06 post-deploy/redeploy | NOT RUN for this candidate | Domain success/rejection/forbidden access plus retained IDs after restart/redeploy without reseed | JeffMerry / actual running revision |
| Human UAT/accessibility | PENDING | Named tester, date, exact revision, keyboard/Escape/screen-reader observations and defect disposition | JeffMerry / actual tester |
| PDF verification | PENDING | Self-contained Parts A–E, full required documents, readable evidence, page map, remaining work through13Dec | JeffMerry / completed evidence, THN4 review |
| LEB2 submission | NOT SUBMITTED by this work | Named human submitter, final PDF/hash, immutable source, receipt/time by29Nov2026 23:59 Bangkok | Human submitter TBD |

Do not close #45 from this index, staging merge, CI success or a planned submission. Final release and human submission evidence remain separate records.
