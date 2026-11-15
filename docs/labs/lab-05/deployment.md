# Lab 5 — RegMeUp deployment

Status: **The service is running on Cloud Run, and the Markdown evidence set is prepared for the documentation PR. The final PDF is separate.** Updated November 15, 2026: [PR #30](https://github.com/JeffMerry/reg-me-up/pull/30) added the deployment workflow and was merged into `lab5-staging`. [Release PR #31](https://github.com/JeffMerry/reg-me-up/pull/31) received teammate approval and passed CI before merging into `main`. The first deployment from commit `1dbfca0e625caf92bf0599af49d5ec1880f028e3` succeeded, and a manual redeploy of the same image SHA passed its smoke checks. Issue [#24](https://github.com/JeffMerry/reg-me-up/issues/24) contains the record IDs and screenshots confirming persistence after scale-to-zero and redeployment. **C-06 visible-change evidence is omitted at the user's request.** The available records show a successful first release and a same-image redeploy, not a later application change. This document records that limitation instead of claiming C-06 passed. It does not record secret values or connection strings.

This document was written after Docker work had begun because the handout's file requirements were discovered later. It does not claim that this file existed before the Docker work. Update it when the team configures and verifies each part.

## 1. Stack and deployment approach

| Area | Technology / approach |
|---|---|
| Frontend | React 19, TypeScript, Vite, and Tailwind CSS; built as static files |
| Backend API | Node.js 22.23.4, npm 10.9.9, Express 5, and TypeScript; Prisma Client/Prisma ORM |
| Database and sessions | PostgreSQL 17.11 for local Compose; the server stores sessions in the `sessions` table through `connect-pg-simple` |
| Migrations | Prisma Migrate 7.10.1 through `npm run db:migrate`; it checks migration history before deployment |
| Container | The [Dockerfile](../../../Dockerfile) builds the frontend and backend with npm workspaces and serves the UI and API from one image and origin. [compose.yaml](../../../compose.yaml) defines PostgreSQL, migration, and app profiles for development. |
| GCP | Cloud Run service `regmeup` runs the container image; Artifact Registry stores the image; Cloud SQL PostgreSQL 17 stores data; Secret Manager stores runtime secrets. The service is in `asia-southeast1`. |
| CI/CD | [CI and Docker Build](../../../.github/workflows/ci-docker.yml) checks PRs into `lab5-staging`/`main`. [Release PR #31](https://github.com/JeffMerry/reg-me-up/pull/31) received teammate approval and passed CI. [Deploy demo](../../../.github/workflows/deploy.yml) runs on pushes to `main` or `workflow_dispatch` on `main`; it uses Workload Identity Federation through GitHub Environment `demo`. |

RegMeUp uses Node 22 and PostgreSQL 17.11 locally, npm workspaces, and a single frontend/API image so both are served from the same origin. It retains the migration-history guard and a synthetic seed that rejects production. Cloud SQL uses PostgreSQL 17; the Console screenshot shows only the major version, not a minor patch. The TokTickIT starter kit uses PostgreSQL 16, so PostgreSQL 17 keeps the Cloud major version aligned with the local setup. Cloud Run connected to the database and passed the readiness smoke check in the release workflow. See §5 for the Cloud SQL instance details; connection values are not included.

## 2. Environment variables

Runtime, seed, and demo variable names match [server/.env.example](../../../server/.env.example). Compose, Vite, and browser-test variables are also listed to make setup reproducible. Never put secret values or connection strings in Git, reports, screenshots, or chat. The Secret Manager list shows `regmeup-demo-organizer-password` and `regmeup-demo-participant-password`; their secret values and enabled versions were not inspected.

| Variable | Purpose | Required when / default | Secret | Source |
|---|---|---|---|---|
| `NODE_ENV` | Selects the runtime mode and secure-cookie behavior; the seed rejects production | Defaults to `development`; the image sets `production`; local Compose app uses `development` | No | Operator / image / Cloud Run |
| `PORT` | Port on which the backend accepts requests | Defaults to `3000`; Cloud Run sets it at runtime | No | Operator / Cloud Run |
| `DATABASE_URL` | PostgreSQL connection for the API, Prisma, migrations, and seed | Required for server/migration/seed/demo | **Yes** | Local `server/.env` or Compose; Cloud Secret Manager `regmeup-database-url:1` |
| `SESSION_SECRET` | Signs the session cookie | Required for the server; at least 32 characters | **Yes** | Set by the local operator; Cloud Secret Manager `regmeup-session-secret:1` |
| `APP_ORIGIN` | Allowed origin for CSRF checks | Required for the server; must exactly match the browser origin, without a path or trailing slash | No | Local `server/.env` / Compose; Cloud Run `https://regmeup-nxoa6mi4ha-as.a.run.app` |
| `TRUST_PROXY_HOPS` | Tells Express which forwarded headers to trust from the proxy | Production uses `1` for one trusted proxy hop | No | Cloud Run environment; value `1` was seen in the service revision |
| `FRONTEND_DIR` | Path to the frontend build served by Express | Not needed for local Vite; image sets `/app/client/dist` | No | Docker image / operator |
| `TEST_DATABASE_URL` | Identifies the isolated integration/E2E database | Required for database-backed tests; must be separate from the app DB and have a test marker | **Yes** | Set by the tester in the test environment; never use as the production app DB |
| `ALLOW_SYNTHETIC_SEED` | Enables creation of local/test fixtures | Set to `1` when using the synthetic seed; never seed this data in production | No | Local operator / test CI |
| `SEED_PASSWORD` | Synthetic password for local/test seed and some integration/E2E tests | Required for seeding or tests that use fixtures; reuse the value used when the test DB was seeded | **Yes** | Set by the tester as synthetic data for the local/test environment |
| `ALLOW_DEMO_PROVISION` | Enables the command that creates demo accounts | Set to `1` only for an authorized provisioning run | No | Operator running the one-time job |
| `DEMO_EXPECTED_DATABASE` | Confirms the connected database name before creating demo accounts | Required for provisioning; a database name alone does not prove the target is safe | No | Operator verifies against the team-approved demo database |
| `DEMO_PARTICIPANT_PASSWORD` | Password for the demo Participant account | Required for provisioning; 16–1024 bytes and different from the Organizer password | **Yes** | Secret Manager `regmeup-demo-participant-password`; version and job wiring not verified |
| `DEMO_ORGANIZER_PASSWORD` | Password for the demo Organizer account | Required for provisioning; 16–1024 bytes and different from the Participant password | **Yes** | Secret Manager `regmeup-demo-organizer-password`; version and job wiring not verified |
| `REGMEUP_API_PROXY_TARGET` | Vite dev proxy target for forwarding `/api` to the backend | Optional; defaults to `http://localhost:3000` | No | Operator / `client/.env.local`; not a Cloud runtime setting |
| `REGMEUP_PG_PORT` | Compose host port for PostgreSQL | Optional; defaults to `55432` | No | Local shell/Compose |
| `REGMEUP_WEB_PORT` | Compose host port for the app | Optional; defaults to `5173`; keep `REGMEUP_APP_ORIGIN` aligned | No | Local shell/Compose |
| `REGMEUP_APP_ORIGIN` | Value passed to the Compose app as `APP_ORIGIN` | Optional; defaults to `http://localhost:5173` | No | Local shell/Compose |
| `REGMEUP_DOCKER_SESSION_SECRET` | Passes `SESSION_SECRET` to the Compose app | Optional for local use only; Compose has a public local-only fallback | **Yes**, when set | Local shell/Compose; never use the fallback in Cloud |
| `E2E_APP_DATABASE_URL` | App DB URL used to verify that the E2E test DB is separate | Required for Playwright tests | **Yes** | Set by the tester in the test environment |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` | Selects an installed Chromium executable | Optional; normally use the browser managed by Playwright | No | Tester / CI |
| `CI_PG_PORT`, `CI_PG_CONTAINER` | Port and container ID for the CI PostgreSQL service | CI setup only; comes from `job.services.postgres` | No | GitHub Actions service context; not used by the Cloud app |
| `GITHUB_ENV`, `GITHUB_SHA`, `GITHUB_STEP_SUMMARY` | Passes values between CI steps, identifies the tested commit, and writes the job summary | Set automatically by GitHub Actions | No | GitHub Actions runner |
| `LAB5_SMOKE_BASE_URL` | App origin for the local Docker smoke test | Required by `scripts/lab5-docker-smoke.cjs`; accepts HTTP localhost only | No | Tester sets it to the isolated Compose port |
| `LAB5_SMOKE_CONFIRM` | Confirms that the tester selected an isolated local target | Must be `isolated-local-only` for the smoke test | No | Tester sets it in the shell after checking the project/DB |
| `LAB5_SMOKE_RECORD_PATH` | Stores synthetic event and registration IDs for checking after restart | Required for both `create` and `verify` smoke-test modes | No | Tester sets a temporary local file path |

## 3. Build, test, and run from a clean clone

The commands below use PowerShell on Windows and run from the **repository root** unless stated otherwise. You need Git, Node.js **22.23.4**, npm **10.9.9**, Docker Desktop with Linux containers, and Docker Compose. Install Playwright Chromium if you run browser tests. Do not use a database containing real data for fixtures or tests.

**Status:** Codex completed installation, migration/seed, build/tests, and UI/API/database checks in an isolated Compose project from clean clone commit `a231b89149eefd2a90be86557e0ff9ec6e86e267` on November 14, 2026. See [results and commands](lab5-docker-evidence.md). PR #16 was approved and merged. A second clean-clone run by another team member and Cloud testing are not documented here.

```powershell
git clone https://github.com/JeffMerry/reg-me-up.git
cd reg-me-up
git switch lab5-staging  # Lab 5 integration branch; first-deploy work must go through a PR
node --version
npm --version
npm ci
Copy-Item server/.env.example server/.env
```

Edit `server/.env` locally: set a random `SESSION_SECRET` with at least 32 characters and verify the local database values against the example. Do not commit this file or expose its values in logs. `DATABASE_URL` and `TEST_DATABASE_URL` must point to **different database names on the same local server**, as required by the test guard.

Start PostgreSQL and prepare the application database (run all commands from the repository root):

```powershell
docker compose up -d --wait
npm run db:generate
npm run db:migrate
```

For local sample accounts, privately set `SEED_PASSWORD` to a synthetic password before running:

```powershell
if (-not $env:SEED_PASSWORD) { throw 'Set a synthetic SEED_PASSWORD privately first' }
$env:ALLOW_SYNTHETIC_SEED = '1'
npm run db:seed
Remove-Item Env:ALLOW_SYNTHETIC_SEED
```

Create the test database only on a new Compose volume: the PostgreSQL script creates `regmeup_test` only when the volume is first initialized. Verify that `server/.env` points to different app and test databases, and set the same synthetic `SEED_PASSWORD` used to seed the test DB. Use a **new PowerShell terminal** so test values do not affect the shell running the app:

```powershell
# Load only database values from the local file into the environment without displaying them
Get-Content server/.env | ForEach-Object {
  if ($_ -match '^(DATABASE_URL|TEST_DATABASE_URL)=(.*)$') {
    [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
  }
}
if (-not $env:DATABASE_URL -or -not $env:TEST_DATABASE_URL -or -not $env:SEED_PASSWORD) {
  throw 'Set both local database URLs and a synthetic SEED_PASSWORD first'
}
$lab5AppDatabaseUrl = $env:DATABASE_URL
$env:DATABASE_URL = $env:TEST_DATABASE_URL
$env:ALLOW_SYNTHETIC_SEED = '1'
npm run db:migrate
npm run db:seed
# Install the marker after the first migration, only on local Compose regmeup_test
Get-Content -Raw docker/postgres/enable-test-guard.sql | docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U regmeup_app -d regmeup_test
$env:DATABASE_URL = $lab5AppDatabaseUrl
npm run test:integration
```

Before installing the marker, verify that the test URL really points to `regmeup_test` in local Compose. The marker command names that database explicitly; update the command if the database name changes, and never run it against a real database. Integration tests check live database identities and the marker before writing data. Do not run `prisma migrate reset` against a database whose data must be kept.

```powershell
npm run test:unit
npm run typecheck
npm run build
```

Run browser tests in a terminal configured for the test database: set `$env:E2E_APP_DATABASE_URL = $lab5AppDatabaseUrl`, `$env:DATABASE_URL = $env:TEST_DATABASE_URL`, `$env:NODE_ENV = 'test'`, and a synthetic `SESSION_SECRET` of at least 32 characters in the environment. Keep the `SEED_PASSWORD` used to seed the test DB, then run:

```powershell
npx playwright install chromium
npx playwright test
```

Playwright starts a dedicated server on port 43170 and Vite on 43171. See [e2e/README.md](../../../e2e/README.md) for test database details and requirements. When finished, close the test terminal or remove the variables you set. Do not use that terminal to run the normal app.

Run the app directly from the root in two terminals: `npm run dev:server` and `npm run dev:client`. Open `http://localhost:5173`; Vite proxies `/api` to the backend at `localhost:3000`.

Alternatively, build the image and run the frontend/API/PostgreSQL with Compose:

```powershell
docker build -t regmeup:local .
docker compose --profile app up --build -d --wait
docker compose --profile app ps -a
```

Open `http://localhost:5173`, `http://localhost:5173/api/health`, and `http://localhost:5173/api/ready`. Health/readiness should return `200` when the DB is ready and `503` when it is not. This profile uses the image built by Compose; a separate `docker build -t` check does not make Compose use that tag automatically.

If you need local fixtures in Compose, set a synthetic `SEED_PASSWORD` in the environment first, then run from the repository root:

```powershell
docker compose --profile app run --rm -e NODE_ENV=development -e ALLOW_SYNTHETIC_SEED=1 -e SEED_PASSWORD migrate npm run db:seed
```

Compose does not seed automatically. This command writes only to the local `regmeup_dev` database on the `postgres` service. Stop the services while keeping the volume with `docker compose --profile app stop`. Do not use `down -v` if the data must be retained.

## 4. Database migrations and seeding

| Task | Command from repository root | When and who runs it |
|---|---|---|
| Generate Prisma Client | `npm run db:generate` | After installing dependencies or changing the schema |
| Migration | `npm run db:migrate` | Local: developer runs after the DB is ready. Compose: the `migrate` service runs before the app and checks history/checksum. Cloud: `Deploy demo` updates and executes Cloud Run Job `regmeup-migrate` before deploying the service; the job passed in the first release. Manual redeploy with an existing `image_tag` skips migration. |
| Synthetic seed | `npm run db:seed` | Run separately after migration, only in local/test environments, with `ALLOW_SYNTHETIC_SEED=1` and `SEED_PASSWORD`; it rejects `NODE_ENV=production`. |
| Demo/UAT provisioning | `npm run db:provision-demo` | Intended for a one-time run by an authorized operator against a genuinely isolated demo DB, with the variables in §2. Secret names exist in Secret Manager, but Cloud job wiring, enabled versions, delivery, and owner are **not verified / not tested**. |

The synthetic seed creates three Participant accounts, two Organizer accounts, and synthetic events/registrations with stable IDs. Rerunning it does not delete data, change existing records with the same IDs, or change existing passwords. Demo provisioning creates one Participant and one Organizer account if they do not already exist. Rerunning it does not change passwords, and the transaction is cancelled if an ID/email/role conflict is found. Checking the database name is only a safeguard; the operator must verify the intended project and database each time.

## 5. GCP project and resources

The values below were confirmed from user-provided screenshots, GitHub Actions, and Cloud Run on November 15, 2026. The team must attach Console screenshots to [Issue #25](https://github.com/JeffMerry/reg-me-up/issues/25) or the submission index. Do not include actual secret values or connection strings. The monthly `CPE334-Alert` budget is an alert-only budget of **฿30**, scoped to project `cpe334-reg-me-up` and all services. It sends email alerts to billing administrators and users for actual spend at **10% (฿3), 20% (฿6), 50% (฿15), and 90% (฿27)**. Spend-cap enforcement is off. The screenshots and notification settings are recorded in the [evidence index](evidence-index.md).

| Item | Name / value | Purpose |
|---|---|---|
| Project ID | `cpe334-reg-me-up-513615` | Team GCP project |
| Region | `asia-southeast1` | Location for Cloud Run, Artifact Registry, Cloud SQL, and the migration job |
| App service | `regmeup` | Cloud Run service; autoscaling min 0/max 3, request-based billing |
| Public URL | `https://regmeup-nxoa6mi4ha-as.a.run.app` | URL used by the workflow for smoke checks; Cloud Run Console also shows alternate service URL `https://regmeup-557300612055.asia-southeast1.run.app` |
| Image registry / repository | `asia-southeast1-docker.pkg.dev` / project `cpe334-reg-me-up-513615` / repository `regmeup` / image `regmeup` | Artifact Registry stores the Docker image. The first release used commit tag `1dbfca0e625caf92bf0599af49d5ec1880f028e3` and the digest in §6. |
| Database instance / database | `regmeup-pg` / `regmeup`; PostgreSQL 17 (Console instance list does not show a minor patch); instance `RUNNABLE`; zone `asia-southeast1-c` | Cloud SQL Enterprise `db-f1-micro`, 10 GB SSD; `storageAutoResize: false`; release migration and readiness checks passed |
| SQL connection name | `cpe334-reg-me-up-513615:asia-southeast1:regmeup-pg` | Socket path mounted by Cloud Run when the Cloud SQL connection is configured |
| Database user | `regmeup_app` (BUILT_IN) | App database account, not a website login account. Migration and `/api/ready` smoke checks passed, confirming a working connection. |
| Runtime and demo Secret Manager names | Runtime: `regmeup-database-url:1`, `regmeup-session-secret:1`. Demo password secret names: `regmeup-demo-organizer-password`, `regmeup-demo-participant-password` | Cloud Run uses the two runtime versions. Screenshots confirm demo secret names exist, but do not show their versions or prove that a job or Cloud Run service consumes them. Secret values were not inspected. |
| Runtime service account | `regmeup-runtime@cpe334-reg-me-up-513615.iam.gserviceaccount.com` | Project-level `roles/cloudsql.client` and `roles/secretmanager.secretAccessor` on only the two secrets above; confirmed in an IAM screenshot |
| Deployer service account | `regmeup-deployer@cpe334-reg-me-up-513615.iam.gserviceaccount.com` | Identity used by the deploy job; separate from the runtime account |
| Migration job | `regmeup-migrate` | Cloud Run Job updated and run by the workflow before service deployment; first release passed |
| Workload Identity provider / GitHub environment | `projects/557300612055/locations/global/workloadIdentityPools/github-actions/providers/github-main` / `demo` | GitHub Actions uses OIDC Workload Identity Federation; no service-account key file is used |

## 6. Release procedure and currently running commit

The deploy workflow is [`.github/workflows/deploy.yml`](../../../.github/workflows/deploy.yml). `deploy/deploy.sh` remains a first-deploy setup utility, defaults to dry run, and is not the release pipeline. The first release and redeploy results are recorded in [PR #31](https://github.com/JeffMerry/reg-me-up/pull/31), [Issue #23](https://github.com/JeffMerry/reg-me-up/issues/23), and [Issue #24](https://github.com/JeffMerry/reg-me-up/issues/24). The direct run records are [first release run #1](https://github.com/JeffMerry/reg-me-up/actions/runs/43695641451) and [same-image redeploy run #2](https://github.com/JeffMerry/reg-me-up/actions/runs/43700433429). Available Cloud Run and public-site screenshot captions are recorded in the [evidence index](evidence-index.md).

Team workflow: `Issue → feature/fix branch from lab5-staging → PR into lab5-staging → teammate review + CI pass → merge → release PR from lab5-staging to main → teammate review + CI pass → merge → deploy from main`. Authors do not approve their own PRs. Apply the Lab 5 label and record actual evidence as required by the handout.

1. Make changes on a branch based on `lab5-staging` and open a PR back into `lab5-staging`. A teammate must review it and CI must pass before merge.
2. Open a release PR from `lab5-staging` into `main`. A teammate must approve it and CI must pass before merge. Example: [release PR #31](https://github.com/JeffMerry/reg-me-up/pull/31), merge commit `1dbfca0e625caf92bf0599af49d5ec1880f028e3`.
3. On a push to `main`, `Deploy demo` runs the reusable CI workflow first. The deploy job uses Environment `demo` and OIDC Workload Identity Federation, builds an image tagged with the full 40-character `github.sha`, pushes it to Artifact Registry, runs `regmeup-migrate`, updates Cloud Run service `regmeup` with the immutable digest, and smoke-tests the public URL. The workflow YAML has no explicit approval gate. If GitHub Environment required reviewers are added later, update this document to match the actual settings.
4. First release: [PR #31](https://github.com/JeffMerry/reg-me-up/pull/31) passed review/CI and was merged into `main`; commit `1dbfca0e625caf92bf0599af49d5ec1880f028e3`; image digest `asia-southeast1-docker.pkg.dev/cpe334-reg-me-up-513615/regmeup/regmeup@sha256:8d4f4449b7cc2a1f42e72318ccea4465368dca5e80f323593aa690afa2b1138a`; Cloud Run revision `regmeup-00003-8j4`; URL `https://regmeup-nxoa6mi4ha-as.a.run.app`. Health, readiness, events API, and home-page smoke checks passed.
5. Manual redeploy: GitHub Actions → `Deploy demo` → `Run workflow` on `main`; enter the full commit SHA in `image_tag` to deploy the existing image without rebuilding, pushing, or rerunning migrations. [Deploy demo #2](https://github.com/JeffMerry/reg-me-up/actions/workflows/deploy.yml) succeeded with the same SHA/digest, smoke checks passed, and Cloud Run created revision `regmeup-00004-5ls` with 100% traffic. Because `image_tag` was provided, the `test` job was skipped according to the workflow condition and the summary showed `Rollback: true`. Here that value means an existing image SHA was selected manually; this run did not roll back to an older release.
6. Check the running revision in Cloud Run → `regmeup` → Revision History and compare its image digest with the Actions summary. The recorded SHA identifies the release commit; the digest identifies the deployed image bytes; the revision and traffic show which version receives requests.
7. **C-06 visible-change evidence is omitted at the user's request.** No separate application change was included in the release evidence: the first release and same-image redeploy are the only verified deployments in the available records. C-06 therefore remains unverified against the course criterion. This does not require a visual redesign; a small user-visible content or behavior change would generally be enough if the team later chooses to complete that criterion.

## 7. Persistence, verification, and limitations

User, event, registration, and session data are stored in PostgreSQL; local Compose uses a named volume. Issue #24 confirms that test event and registration data remained after Cloud Run scaled to zero and after redeployment to a new revision. File uploads are outside the current Sprint 1 scope, so file storage is not relevant to this release.

As required by handout §8, each check must include the test/command name, result, tested commit, and actual evidence. **TBD does not mean PASS.**

| Check | Requirement / command or test | Result / commit | Evidence |
|---|---|---|---|
| C-01 | A normal PR runs build, automated tests, and Docker build on staging/main | **Passed:** PR #31 into `main` received approval and passed CI. Reusable CI reported unit 55/55, integration 40/40, Playwright 33/33, typecheck, production build, and Docker build. | [PR #31](https://github.com/JeffMerry/reg-me-up/pull/31), [CI evidence](ci-evidence.md), [#20](https://github.com/JeffMerry/reg-me-up/issues/20) |
| C-02 | A temporary PR with a failing test is blocked from merging, then closed **without merge**, with the history retained | **Passed per Issue #22:** temporary PR #29 was blocked by required check `test-and-docker` and closed without merge. Failed run `43684102566` tested head commit `93df8a76b83bfed0edd7301fa5392fc58abb031b`; a later failing run `43684204257` tested `a0085e9778d8fc2174a9b6b0b90772d34585453c`. | [Issue #22 screenshots](https://github.com/JeffMerry/reg-me-up/issues/22), [PR #29](https://github.com/JeffMerry/reg-me-up/pull/29), [failed run 43684102566](https://github.com/JeffMerry/reg-me-up/actions/runs/43684102566), [failed run 43684204257](https://github.com/JeffMerry/reg-me-up/actions/runs/43684204257) |
| C-03 | Use `.env.example` from a clean clone, then build/run with a DB / commands in §3 | **Passed:** clean clone, migration/seed, build/tests, and UI/API/DB checks in Compose were completed on app commit `a231b89149eefd2a90be86557e0ff9ec6e86e267`. Issue #19 was closed with its checklist complete. | [Commands, results, and image IDs](lab5-docker-evidence.md); [Issue #19](https://github.com/JeffMerry/reg-me-up/issues/19) |
| C-04 | Public URL: Organizer publishes → Participant registers → at least one invalid/unauthorized case | **Marked complete in Issue #21.** Read-only Playwright checks on November 15, 2026 returned HTTP 200 for the live public event list and C-04 event detail; the event is published and shows 0/1 seats remaining. An unauthenticated request to `/organizer/events` redirected to login. User-provided authenticated screenshots show the Organizer's C-04 event with 1/1 registrations and the Participant's own C-04 registration as `ACTIVE`, reference `a4de68f4-0e94-45df-9d9c-ad53c9494896`. The deployed release is recorded as commit `1dbfca0e625caf92bf0599af49d5ec1880f028e3`, revision `regmeup-00004-5ls`; the user-provided screenshots themselves do not show a commit/revision. | [Issue #21](https://github.com/JeffMerry/reg-me-up/issues/21); live Playwright and user-provided screenshot captions in [evidence-index.md](evidence-index.md); public URL in §5 |
| C-05 | The same record identifiers remain after an application restart **and** are checked again after redeployment | **Passed per Issue #24 evidence:** event ID `a0c0fe3d-5566-4ab2-aacc-e30c322f2d30` and registration ID `1bd6731d-d8f2-4f15-83af-7a6ac647b5be` remained after scale-to-zero/restart and after redeployment. Revision changed from `regmeup-00003-8j4` to `regmeup-00004-5ls` at 100% traffic; tested release commit `1dbfca0e625caf92bf0599af49d5ec1880f028e3`. | [Issue #24](https://github.com/JeffMerry/reg-me-up/issues/24) with IDs, [Actions run #2](https://github.com/JeffMerry/reg-me-up/actions/runs/43700433429), and screenshot captions/links in [evidence-index.md](evidence-index.md) |
| C-06 | First release and a later visible change go through reviewed staging → main → deploy; running revision matches the commit | **Omitted at the user's request; criterion remains unverified.** The available records show the first release and a same-image redeploy only. Although Issue #23 is closed and its checklist marks the visible-change step complete, the issue body has no second proof PR/run/revision link. | [Issue #23](https://github.com/JeffMerry/reg-me-up/issues/23), [first release run #1](https://github.com/JeffMerry/reg-me-up/actions/runs/43695641451), [same-image redeploy run #2](https://github.com/JeffMerry/reg-me-up/actions/runs/43700433429) |

The [evidence-index.md](evidence-index.md) has one row per rubric part and includes captions for the available C-02/C-04/C-05 screenshots and Cloud Billing budget. The C-01–C-06 table here summarizes requirement-level results. The final PDF must use Answer Part 0–4 as required by [Issue #25](https://github.com/JeffMerry/reg-me-up/issues/25), and link to the index, repository, PRs, workflow runs, and live service. The user has supplied team/student metadata and C-04 Participant registration evidence is now linked in the index. The PDF has not been created; C-06 remains omitted at the user's request, and the final submission commit/tag can be recorded after the documentation PR is merged.

## 8. Rollback and cost control

Rollback/redeploy: the workflow accepts a full commit SHA in `workflow_dispatch.image_tag` to select an existing Artifact Registry image and deploy by digest. This path was exercised with the current SHA in Deploy demo #2; the summary showed `Rollback: true`, but the team did not select an older release. Before an actual rollback, review migration backward compatibility and verify traffic, URL, smoke checks, and existing data. Rolling back to an older image has not been tested.

Cost control: the `CPE334-Alert` budget is a monthly **฿30 alert-only budget**, with actual-spend notifications at 10%, 20%, 50%, and 90%. It does not enforce a spending cap. Review actual Cloud SQL, storage/backup, and Cloud Run charges. Stop resources when the team is not using them, following the course guidance, and start them before the demo. **Keep the service running during the grading window.** Delete resources/databases only after the team confirms the evidence is saved and they are no longer needed.
