# Sprint 2 branch and release plan

Version 0.2 — 26 November 2026. Refs #40–#45/#51. **Policy CONFIRMED; follow-up PR approval/merge pending; NOT IMPLEMENTED / NOT RUN.** Actual review and full-name task ownership: [review record and matrix](review-record.md).

## Branches and owners

Starting main and sprint/02-staging were verified at `3c8b751a2646408f6fdc88209a0fef33d9030f1b`. Working branch for this design is `docs/sprint-2-planning`; its PR targets `sprint/02-staging`. Kittithat Disthanakornkun (JeffMerry) implements F-05/F-06 and owns shared locks/integration; Thanatip Nitinantakul (THN4) implements F-09 and owns shared schema/migration coordination/release evidence. Each reviews the other's work. The full [ownership matrix](review-record.md#ownership-matrix) specifies migration and tests/evidence duties; this user-directed allocation is not work already performed.

| Issue | Work branch | Predecessor / PR target |
|---|---|---|
| #40 | docs/sprint-2-planning | Baseline inspection; target sprint/02-staging; contract review before runtime changes |
| #41 | feature/f-05-cancellation | Kittithat implement/migration/tests; Thanatip review; reviewed shared prerequisites; target sprint/02-staging |
| #42 | feature/f-06-event-management | Kittithat implement/migration/tests; Thanatip review; confirmed edit/legacy policy and reviewed shared foundation; target sprint/02-staging |
| #43 | feature/f-09-instructor | Thanatip implement/migration/tests; Kittithat review; shared schema/lock handoff, independent of F-05 UI; target sprint/02-staging |
| #44 | feature/f-07-check-in | Reviewed F-07/F-08 contracts and lifecycle decisions; candidate integrates through sprint/02-staging |
| #45 | docs/deliverable-2 | Thanatip compiles release evidence, Kittithat reviews and supplies integration/main release records; release PR head=staging |

Work branches start from the latest staging with required dependencies present. Preserve meaningful contract → test RED → implementation GREEN commits; use reviewed merges to preserve identities. Never reset/force-push shared work. A feature's staging merge is not its accepted main deployment.

## Proposed order and targets

| Target (Asia/Bangkok) | Milestone / gate | Owner / review |
|---|---|---|
| 25–26 Nov | #40 policy/legacy confirmed in COMMENTED review; named ownership follow-up and approval/merge remain | Kittithat prepares follow-up / Thanatip reviews |
| 26–28 Nov | F-05/F-06/F-09 tests/implementation/integration and reviewed Sprint 2 release | Kittithat F-05/F-06/locks/integration; Thanatip F-09/schema/evidence; cross-review |
| 28–29 Nov | #44 tested Sprint3 progress, candidate regression/deploy and #45 PDF | Kittithat integration; Thanatip evidence compilation; #44 feature allocation separately pending |
| 29 Nov before23:59 | Inspect final PDF, version and submission evidence | Human submitter TBD |
| By13 Dec | Remaining F-07/F-08 AC, fixes/final verification/UAT/video/release | Exact remaining AC/owners/dates to be recorded in #44/#45; avoid reserving main workflows for exam end |

These dates are proposed milestones, not promises or completed work; revisit if actual progress differs. Final exam period is1–11 December.

## Lab 7 merge boundary

Peer owns lab7-staging and BR-01/DEC-05/create validation. Sprint 2 owns new lifecycle/deadline/Instructor design and F-06 edit behavior. Avoid reformatting entire shared files. Agree the shared capacity validator interface and migration ownership in #40 before both edit it; implement new Edit UI/tests in separate modules where practical.

After Lab 7 reviewed merge into main, open a main → sprint/02-staging synchronization PR promptly. Inspect semantic conflicts even when Git merges automatically. Test create/edit1/60/61, legacy policy, register/cancel/capacity/deadline races, auth/owner/privacy, migrations and persistence. Cite actual Lab 7 contract and merge SHA. Announcement means no TA approval gate; contract peer review still applies.

## CI, integration and deployment

The inspected workflow previously triggered PR CI only for lab5-staging/main. This planning change adds sprint/02-staging to the existing CI workflow trigger so feature and docs PRs can exercise the existing test-and-docker job. Repository protection/required status-check settings remain unverified and are not changed here. Record actual check context names from the PR; do not invent them.

After F-05/F-06/F-09 are complete, run build/unit/integration/browser and selected original journeys on staging, obtain teammate review of staging → main and record the accepted Sprint 2 SHA. Keep that identity even when #44 later adds Sprint 3 progress. Deploy through the main workflow; do not deploy an intermediate RED commit. Record run/digest/revision and changed/preserved journeys + persistence checks. The public URL serves the last deployed main version; the two staging branches are not two cloud environments.

## Evidence and reporting

Use Refs #40 on the planning PR; do not close it before its actual acceptance conditions. Record reviewers/findings/response dates, tested commits/commands and failed/skipped results. #45 must contain full required documents and selected source excerpts in a self-contained PDF, two meaningful Sprint 2 demos, one Sprint 3 workflow, two actual test excerpts (domain and access), two substantive Issue/PR chains and versioned deployment evidence. Include known defects/debt and safe private account handoff/local seed. Do not send credentials or fabricate review/submission history.

## Current allocation and next work — 27 November 2026

Concrete next branches: #45 `test/sprint-2-acceptance` (S2-G01–04 tests/bounded fixes) → #44 `feature/f-07-check-in` → #45 `docs/deliverable-2` (candidate/release/report evidence). All PR into sprint/02-staging; release PR uses staging→main. This clarification records the previously unnamed gap branch before creation; F08 implementation remains a later separately recorded scope.

Historical planning above is superseded for remaining ownership: JeffMerry now owns Sprint2 gap closure, F07/F08 implementation/migrations/tests, schema coordination, integration and release evidence/PDF; THN4 reviews. Existing F09 work/author credit remains historical. See [updated ownership](review-record.md#current-responsibilities--27-november-2026), [Sprint2 gap audit](acceptance-audit.md), [Sprint3 contracts](../sprint-3/README.md) and [delivery plan](../deliverable-2/plan.md). Lab7 #64 and F09 #66 are merged into staging; do not repeat main synchronization for the same source. No remaining review/deployment gate is satisfied merely by the new allocation.
