# Lab 5 evidence index

Status: **Markdown evidence index prepared for the documentation PR; the final PDF is a separate deliverable.** This index follows the Lab 5 submission rubric. The final PDF must use the headings `Answer Part 0` through `Answer Part 4` in order and link to the evidence below. Do not describe an item as complete until its evidence is attached and its remaining fields are filled.

| Rubric part | Artifact / direct link | IDs / version | Verification result |
|---|---|---|---|
| **0. Team and Evidence Index** | [Public repository](https://github.com/JeffMerry/reg-me-up); [deployment guide](deployment.md); [live service](https://regmeup-nxoa6mi4ha-as.a.run.app) | Team `TH-002_P3`; topic **Event Registration and Attendance System**; group `yark-kin-pie`; section not required; deployed release commit `1dbfca0e625caf92bf0599af49d5ec1880f028e3`; serving revision after redeploy `regmeup-00004-5ls` | Team/student details supplied by the user. Final submission commit/tag will be recorded after the documentation PR is finalized. |
| **1. CI and Quality Gate (30 points)** | [CI workflow](../../../.github/workflows/ci-docker.yml); [PR #31](https://github.com/JeffMerry/reg-me-up/pull/31); [PR #31 CI run 43695261394](https://github.com/JeffMerry/reg-me-up/actions/runs/43695261394); [Issue #22 failing-check proof](https://github.com/JeffMerry/reg-me-up/issues/22); [failing test PR #29](https://github.com/JeffMerry/reg-me-up/pull/29); [failed Actions run 43684102566](https://github.com/JeffMerry/reg-me-up/actions/runs/43684102566); [failed Actions run 43684204257](https://github.com/JeffMerry/reg-me-up/actions/runs/43684204257); [CI evidence](ci-evidence.md) | C-01: `test-and-docker`; PR #31 CI head SHA `951f10a948e31267bf5199ac88d488c92aa6cf49`; C-02 tested commits `93df8a76b83bfed0edd7301fa5392fc58abb031b` and `a0085e9778d8fc2174a9b6b0b90772d34585453c`; PR #29 closed without merge | PR #31 CI and teammate approval passed. PR #29's required check failed and blocked merge; the PR was closed without merging. Issue #22 includes ruleset, failed-check, and blocked-merge screenshots. |
| **2. Docker and Reproducible Configuration (20 points)** | [Dockerfile](../../../Dockerfile); [.dockerignore](../../../.dockerignore); [environment example](../../../server/.env.example); [Docker evidence](lab5-docker-evidence.md); [Issue #19](https://github.com/JeffMerry/reg-me-up/issues/19) | C-03; tested app commit `a231b89149eefd2a90be86557e0ff9ec6e86e267` | Issue #19 checklist records clean-clone build, migration/seed, tests, and UI/API/database checks in Compose as complete. Ensure the PDF links the relevant commands and results; include screenshots only if needed to show the running container/database. |
| **3. GCP Deployment and Persistence (35 points)** | [Issue #21 public deployment record](https://github.com/JeffMerry/reg-me-up/issues/21); [Issue #24 persistence evidence and screenshots](https://github.com/JeffMerry/reg-me-up/issues/24); [Deploy demo workflow](../../../.github/workflows/deploy.yml); [manual deployment helper run at commit b3e2f32](https://github.com/JeffMerry/reg-me-up/commit/b3e2f32d518780a0121f5e03146e01dc7031e35c) | Manual first deployment: commit `b3e2f32` (Nov 14, 2026). First pipeline release: commit `1dbfca0e625caf92bf0599af49d5ec1880f028e3`, image digest `sha256:8d4f4449b7cc2a1f42e72318ccea4465368dca5e80f323593aa690afa2b1138a`, revisions `regmeup-00003-8j4` then `regmeup-00004-5ls` | C-04 is marked complete in Issue #21. Read-only Playwright captures verify the public event list/detail and unauthenticated organizer redirect. User-provided authenticated screenshots show the Participant session, the Organizer's C-04 event at 1/1 registrations, and the Participant's own C-04 registration as `ACTIVE` with reference `a4de68f4-0e94-45df-9d9c-ad53c9494896`. Demo account provisioning was performed as a one-time execution of Cloud Run Job `regmeup-provision-demo`; execution `regmeup-provision-demo-269nl` succeeded and login was verified for both Participant and Organizer roles. The exact numeric Secret Manager versions and execution identity were not recorded. For C-05, Issue #24 records event `a0c0fe3d-5566-4ab2-aacc-e30c322f2d30` and registration `1bd6731d-d8f2-4f15-83af-7a6ac647b5be` still available after scale-to-zero/restart and redeployment; revision `regmeup-00004-5ls` received 100% traffic. Captions and direct screenshot links are below. |
| **4. Repeatable Release Pipeline (15 points)** | [PR #30 workflow implementation](https://github.com/JeffMerry/reg-me-up/pull/30); [release PR #31](https://github.com/JeffMerry/reg-me-up/pull/31); [first release run #1](https://github.com/JeffMerry/reg-me-up/actions/runs/43695641451); [same-image redeploy run #2](https://github.com/JeffMerry/reg-me-up/actions/runs/43700433429); [Issue #23](https://github.com/JeffMerry/reg-me-up/issues/23) | First release: commit `1dbfca0e625caf92bf0599af49d5ec1880f028e3`, image digest `sha256:8d4f4449b7cc2a1f42e72318ccea4465368dca5e80f323593aa690afa2b1138a`, revision `regmeup-00003-8j4`. Redeploy: same image, revision `regmeup-00004-5ls`. | The release workflow and same-image redeployment are evidenced. **No application code was changed before run #2**, so the same image was redeployed and no visible difference appeared. A visible-change follow-up is now tracked by Issue #34, merged PR #35, and open release PR #36. The after-deploy evidence remains unverified. |

## Part 0 — known GitHub contribution records

The repository records these accounts, but does not identify either student's full name or student ID. The contribution descriptions below are limited to verifiable GitHub records; the students must confirm their full contributions before submission.

| Full student name | Student ID | GitHub account | Verifiable Lab 5 records |
|---|---|---|---|
| Thanatip Nitinantakul | `67070501023` | [THN4](https://github.com/THN4) | Authored [deployment workflow PR #30](https://github.com/JeffMerry/reg-me-up/pull/30) and [release PR #31](https://github.com/JeffMerry/reg-me-up/pull/31); authored/owned [documentation Issue #25](https://github.com/JeffMerry/reg-me-up/issues/25); posted [C-05 persistence evidence in Issue #24](https://github.com/JeffMerry/reg-me-up/issues/24). |
| Kittithat Disthanakornkun | `67070501004` | [JeffMerry](https://github.com/JeffMerry) | GitHub Actions actor on [first release run #1](https://github.com/JeffMerry/reg-me-up/actions/runs/43695641451); release commit `1dbfca0e625caf92bf0599af49d5ec1880f028e3` is attributed to this account in the run record; assigned [Issue #21](https://github.com/JeffMerry/reg-me-up/issues/21) for first-deploy verification. |

Team number, official topic, group name, and both students' names/IDs were supplied by the user on November 15, 2026. The course does not require a section. The final submission commit/tag will be recorded after the documentation changes are committed and merged.

## Part 1 — available failing-check screenshot caption

1. **C-02 — required check blocks a failing PR:** [Screenshot in Issue #22](https://github.com/user-attachments/assets/8733630d-f164-408c-8f95-35caa64917ba). PR #29's required `test-and-docker` check failed after approval, merge remained blocked, and the test PR was closed without merging. See [PR #29](https://github.com/JeffMerry/reg-me-up/pull/29) and [failed run 43684204257](https://github.com/JeffMerry/reg-me-up/actions/runs/43684204257).

## Part 2 — existing E2E screenshot captions

These repository screenshots document application UI/E2E states. They are supporting UI evidence, not proof by themselves that the same journey was run on the public Cloud URL.

1. **Login page:** [01-login.png](../../../docs/evidence/e2e/01-login.png).
2. **Public event discovery:** [02-event-discovery.png](../../../docs/evidence/e2e/02-event-discovery.png).
3. **Public event details:** [03-public-event-details.png](../../../docs/evidence/e2e/03-public-event-details.png).
4. **Organizer's events:** [04-organizer-my-events.png](../../../docs/evidence/e2e/04-organizer-my-events.png).
5. **Event creation form:** [05-create-event-form.png](../../../docs/evidence/e2e/05-create-event-form.png).
6. **Event publication confirmation:** [06-publication-confirmation.png](../../../docs/evidence/e2e/06-publication-confirmation.png).
7. **Participant registration page:** [07-participant-registration-page.png](../../../docs/evidence/e2e/07-participant-registration-page.png).
8. **Registration confirmation:** [08-registration-confirmation.png](../../../docs/evidence/e2e/08-registration-confirmation.png).
9. **Participant's registrations:** [09-my-registrations.png](../../../docs/evidence/e2e/09-my-registrations.png).
10. **Registration details:** [10-registration-details.png](../../../docs/evidence/e2e/10-registration-details.png).
11. **Organizer registrations, desktop:** [11-organizer-registrations-desktop.png](../../../docs/evidence/e2e/11-organizer-registrations-desktop.png).
12. **Organizer registrations, mobile:** [12-organizer-registrations-mobile.png](../../../docs/evidence/e2e/12-organizer-registrations-mobile.png).
13. **Access denied:** [13-access-denied.png](../../../docs/evidence/e2e/13-access-denied.png).

## Part 3 — available persistence screenshot captions

The following screenshots are attached to [Issue #24](https://github.com/JeffMerry/reg-me-up/issues/24). Captions identify the check shown and may be reused in the final PDF.

1. **C-05 setup — Cloud Run scaling:** [Minimum instances set to 0](https://github.com/user-attachments/assets/f5431392-12e6-48f9-9ea1-5e863ebb1ee4). Shows scale-to-zero is enabled for the persistence check.
2. **C-05 restart — zero instances:** [Container instance count at 0 active / 0 idle](https://github.com/user-attachments/assets/7686c0ca-68ca-4605-b35e-8940b356486f). Shows the service had no running instances before it was opened again.
3. **C-05 redeploy — workflow result:** [Deploy demo run #2 summary](https://github.com/user-attachments/assets/5b4275ab-9b0d-4a5d-b023-5760ff6681ac). Shows the successful same-image redeploy and smoke checks.
4. **C-05 redeploy — running revision:** [Cloud Run Revision History](https://github.com/user-attachments/assets/001f1ac1-e0e9-4298-890c-846cc17b4791). Shows revision `regmeup-00004-5ls` serving 100% of traffic after redeployment.

## Part 4 — Cloud Billing budget evidence

The user-provided Cloud Billing screenshots show an alert-only monthly budget named `CPE334-Alert` scoped to the `cpe334-reg-me-up` project and all services. The amount is **฿30**. Alerts are configured for actual spend at **10% (฿3), 20% (฿6), 50% (฿15), and 90% (฿27)**, with email alerts to billing administrators and users enabled. Spend-cap enforcement is not enabled; project-owner email alerts, Monitoring channels, and Pub/Sub notifications are not enabled. The overview showed ฿0.00 / ฿30.00 at the time of capture; this is a point-in-time figure, not a guarantee of future cost.

1. **Budget scope and period:** [budget-scope.png](../../../docs/evidence/lab5/budget-scope.png). Shows alert-only mode, monthly period, project scope, and all services.
2. **Budget amount and alert thresholds:** [budget-amount-alerts.png](../../../docs/evidence/lab5/budget-amount-alerts.png). Shows ฿30 and actual-spend alert levels at 10%, 20%, 50%, and 90%, with billing-admin/user email notifications enabled.
3. **Budget overview:** [budget-overview.png](../../../docs/evidence/lab5/budget-overview.png). Shows the saved budget, project, thresholds, and the spend/budget amount at capture time.

## Part 3 — live public-site Playwright captures

Read-only screenshots captured with Playwright against `https://regmeup-nxoa6mi4ha-as.a.run.app` on November 15, 2026. No login, registration, or other database write was attempted.

1. **C-04 — public event listing:** [14-cloud-public-events.png](../../../docs/evidence/e2e/14-cloud-public-events.png). HTTP 200. The public page lists `Lab 5 C-04 Verification 2026-11-14`.
2. **C-04 — published event detail:** [15-cloud-c04-event-details.png](../../../docs/evidence/e2e/15-cloud-c04-event-details.png). HTTP 200 at `/events/3c86780f-7596-4620-938f-3867276a908e`; shows the event description and `0 of 1 seats remaining` / `Full`.
3. **C-04 — unauthenticated Organizer access:** [14-cloud-protected-organizer-route.png](../../../docs/evidence/e2e/14-cloud-protected-organizer-route.png). Requesting `/organizer/events` redirected to the login page with a safe `returnTo` value.
4. **C-05 — persisted public event:** [14-cloud-persisted-event.png](../../../docs/evidence/e2e/14-cloud-persisted-event.png). Public detail for event ID `a0c0fe3d-5566-4ab2-aacc-e30c322f2d30`; shows 9 of 10 seats remaining after the redeployment check recorded in Issue #24.
5. **Supporting UI only — login page:** [14-cloud-login.png](../../../docs/evidence/e2e/14-cloud-login.png). The page loaded successfully. This does not show a successful login or registration.

## Part 3 — user-provided authenticated C-04 screenshots

These screenshots were supplied by the user on November 15, 2026. They show signed-in application views, but do not expose the browser URL or deployment commit.

1. **C-04 — signed-in Participant on the public event list:** [16-cloud-participant-events-signed-in.png](../../../docs/evidence/e2e/16-cloud-participant-events-signed-in.png). The header identifies the `Demo Participant (PARTICIPANT)` session and the list includes the full C-04 event. It does not show the Participant's `My Registrations` page.
2. **C-04 — Organizer's published events:** [17-cloud-organizer-my-events.png](../../../docs/evidence/e2e/17-cloud-organizer-my-events.png). The header identifies `Demo Organizer (ORGANIZER)`; `Lab 5 C-04 Verification 2026-11-14` appears in My Events with 1/1 registrations and status Full.
3. **C-04 — Participant registration confirmation:** [18-cloud-participant-my-registrations.png](../../../docs/evidence/e2e/18-cloud-participant-my-registrations.png). The signed-in Participant sees `Lab 5 C-04 Verification 2026-11-14` in My Registrations with status `ACTIVE` and reference `a4de68f4-0e94-45df-9d9c-ad53c9494896`.

## Final PDF assembly notes (separate from this Markdown evidence index)

- Final submission tag/commit and the commit served by the public URL at submission time.
- Include the Part 0 contribution table above in the PDF.
- The manual first deployment used `deploy/deploy.sh` at commit `b3e2f32`; the distinct pipeline first release and same-image redeploy Actions links are recorded in Part 4 above.
- C-06 is in progress: Issue #34 tracks the Events heading change; PR #35 merged after CI passed, and release PR #36 remains open. GitHub showed no review submission on PR #35 when checked. Do not claim C-06 passed until the review gap is addressed according to the course requirements and the release, pipeline run, visible result, digest, revision and traffic are evidenced.
- Place the screenshot captions under the matching Answer Part and include the relevant check/requirement and commit, run, or URL.
- Public URL listing/detail, unauthorized-access, Organizer event list, and Participant `My Registrations` screenshots are recorded in Part 3. The Participant confirmation shows the C-04 registration as `ACTIVE` with reference `a4de68f4-0e94-45df-9d9c-ad53c9494896`.
- The Cloud SQL instance-list screenshot shows PostgreSQL 17 but no minor patch version. If an exact minor version is required, open Cloud SQL instance `regmeup-pg` → Overview and record only the displayed version.
- Secret Manager shows `regmeup-demo-organizer-password` and `regmeup-demo-participant-password`. The successful one-time Cloud Run Job execution and both login checks are recorded in the deployment guide; the exact numeric secret versions and execution identity are not recorded and remain TBD. Secret values were not inspected.
- Verify the repository is public and the live service stays running until grading ends.

Never include secret values, passwords, connection strings, or key files in this index or in the submission screenshots.

## C-06 visible-change follow-up — November 16, 2026

- [Issue #34](https://github.com/JeffMerry/reg-me-up/issues/34) and [PR #35](https://github.com/JeffMerry/reg-me-up/pull/35): change the public Events heading to “Discover events and workshops”. CI passed at [run 43898257449](https://github.com/JeffMerry/reg-me-up/actions/runs/43898257449); PR #35 merged into staging. GitHub showed no review submission for PR #35 when checked; do not assert a prior review.
- [Release PR #36](https://github.com/JeffMerry/reg-me-up/pull/36) is open; teammate review, CI, merge and the deploy workflow are pending.
- Figure 4.2 baseline: [before screenshot](../../evidence/lab5/c06-before-2026-11-16.png), captured November 16 from the public Events page, showing the previous heading and URL. The serving revision at capture was not independently queried.
- Figure 4.1: the latest successful run observed before this change was [run 43735811343](https://github.com/JeffMerry/reg-me-up/actions/runs/43735811343), commit `fc3fc55e96574b8d56026018bb98a03d7fbc5ba8`, image digest `sha256:149befe4f6b4b28474fa174b2aafaf7b1a1f6dc444a5bc7e0af49849cd895319`; its log reports revision `regmeup-00005-6ff` serving 100% at deployment. This is historical run evidence, not a fresh check of current traffic. Capture the Console revision/digest/traffic for the actual post-change release after deploy.
- Figure 4.3 and its release SHA, workflow run, digest, revision/traffic and screenshot: **TBD — not deployed or checked yet**.
