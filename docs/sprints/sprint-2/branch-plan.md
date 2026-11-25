# Sprint 2 branch and release plan

Version 0.1 — 25 November 2026. Refs #40–#45. **Draft / teammate review pending.**

## Branches and owners

Starting main and sprint/02-staging were verified at `3c8b751a2646408f6fdc88209a0fef33d9030f1b`. Working branch for this design is `docs/sprint-2-planning`; its PR targets `sprint/02-staging`. User Kittithat/JeffMerry owns the Sprint 2 workstream; THN4 is the proposed different teammate reviewer, not an approval already received. Individual feature implementation allocation remains for team confirmation.

| Issue | Work branch | Predecessor / PR target |
|---|---|---|
| #40 | docs/sprint-2-planning | Baseline inspection; target sprint/02-staging; contract review before runtime changes |
| #41 | feature/f-05-cancellation | Reviewed F-05/shared schema protocol; target sprint/02-staging |
| #42 | feature/f-06-event-management | Reviewed F-06 and joint Lab 7/legacy policy; target sprint/02-staging |
| #43 | feature/f-09-instructor | Reviewed F-09/shared scheduling design; may proceed independently of F-05 UI; target sprint/02-staging |
| #44 | feature/f-07-check-in | Reviewed F-07/F-08 contracts and lifecycle decisions; candidate integrates through sprint/02-staging |
| #45 | docs/deliverable-2 | Collect evidence throughout; release PR uses staging itself as head into main |

Work branches start from the latest staging with required dependencies present. Preserve meaningful contract → test RED → implementation GREEN commits; use reviewed merges to preserve identities. Never reset/force-push shared work. A feature's staging merge is not its accepted main deployment.

## Proposed order and targets

| Target (Asia/Bangkok) | Milestone / gate | Owner / review |
|---|---|---|
| 25–26 Nov | #40 contracts, policy/legacy decisions and substantive teammate review | JeffMerry / THN4 proposed |
| 26–28 Nov | F-05/F-06/F-09 tests/implementation/integration and reviewed Sprint 2 release | Feature allocation TBD; different teammate review |
| 28–29 Nov | #44 tested Sprint 3 progress, candidate regression/deploy and #45 PDF | Both; allocation confirmed in Issues |
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
