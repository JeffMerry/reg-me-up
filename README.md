# RegMeUp

An event registration system for university training sessions and workshops, developed for CPE334 Software Engineering.

Sprint 2 F-05 adds own-registration cancellation and retained history. Apply the additive `20261126000000_registration_cancellation` migration with the normal `db:migrate` command before running this code. Existing ACTIVE rows remain valid; own list/detail responses now include `cancelledAt` (null for ACTIVE) and CANCELLED history. Public availability and Organizer totals continue to count ACTIVE only. See [F-05 evidence and integration limits](docs/sprints/sprint-2/f-05-evidence.md).

The F-06 candidate adds Organizer Edit Event, owner GET/PATCH, explicit capacity1–60 with ACTIVE-count checks, management version conflicts and optional registration deadline. Apply `20261127000000_registration_deadline` with `db:migrate` before startup; old events retain null deadline, meaning registration closes at startsAt. Public/nested event DTOs add nullable `registrationDeadline` and `effectiveRegistrationCutoff`; private version is only in owner edit DTO. This migration does not change legacy capacities. [F-06 evidence](docs/sprints/sprint-2/f-06-evidence.md) records tests and the remaining F-09 Instructor overlap/assignment integration requirement.

This branch provides the project foundation, F-01 identity/login, and F-02 event publication/discovery work. Registration remains F-03. See the [documentation index](docs/README.md), [SYS-01 contract](docs/sprints/sprint-1/sys-01.md), and [UI baseline](docs/ui-spec.md).

## Prerequisites

- Node.js **22.23.4** and npm **10.9.9**; `.nvmrc` specifies the target Node version.
- Docker Desktop with the Linux container engine running. Compose provides PostgreSQL **17.11** with separate application and test databases; Node.js runs the application outside Docker.
- Use synthetic data only. Do not commit passwords or `.env` files.

Use UTC for PostgreSQL connections with the pinned Prisma PostgreSQL adapter. Check `SHOW TIME ZONE` on the actual application/test connections; a host-native PostgreSQL installation may inherit a different zone. The F-05 local run used two disposable databases configured as UTC; this does not establish the deployed database's setting. UI timestamps are displayed in Asia/Bangkok.

Install dependencies from the repository root:

```powershell
node --version
npm --version
npm ci
if (-not (Test-Path server/.env)) { Copy-Item server/.env.example server/.env }
```

The example file points to the Compose databases on `127.0.0.1:55432`. If `server/.env` already exists, the command preserves it: update its `DATABASE_URL` and `TEST_DATABASE_URL` to match `server/.env.example` yourself. Set `SESSION_SECRET` to a random string of at least 32 characters and keep `APP_ORIGIN=http://localhost:5173` for local Vite. The Compose password is a public, local-development-only value; never use it for a shared or production database. Docker is bound to loopback, so other machines do not connect to this instance.

## Database and seed

Start Docker Desktop, then from the repository root run:

```powershell
docker compose up -d --wait
docker compose ps
```

On a new named volume PostgreSQL creates `regmeup_dev` and an initially empty `regmeup_test`. The volume keeps data across stops and restarts. `docker compose stop` stops the service without deleting data; `docker compose up -d --wait` starts it again. Initialization scripts only run on the first creation of a volume. If port 55432 is already in use, set `REGMEUP_PG_PORT` before starting Compose and change the port in both URLs in `server/.env` to match. Do not delete an existing volume to troubleshoot without first deciding what data to preserve.

### Run the app in Docker (local development)

The optional `app` Compose profile builds a single image containing the React frontend and API, checks and applies migrations, and starts the app at `http://localhost:5173` using the existing local PostgreSQL volume. It does not seed accounts automatically:

```powershell
docker compose --profile app up --build -d --wait
docker compose --profile app ps -a
```

To create the documented synthetic local fixtures, explicitly supply the same synthetic password used when first seeding the database:

```powershell
$env:SEED_PASSWORD = 'synthetic-password-for-test-only'
docker compose --profile app run --rm -e NODE_ENV=development -e ALLOW_SYNTHETIC_SEED=1 -e SEED_PASSWORD migrate npm run db:seed
Remove-Item Env:SEED_PASSWORD
```

Run this only against the local development database. Re-running seed leaves existing accounts and their passwords unchanged. To stop the app and database while retaining their data, use `docker compose --profile app stop`; start them again with the first command. Do not use `down -v` on data you need.

If port 5173 is occupied, set `REGMEUP_WEB_PORT` and `REGMEUP_APP_ORIGIN` together, for example `5175` and `http://localhost:5175`. The local Compose session-secret fallback and database credentials are for local use only. The root image defaults to production; production deployments must supply their own secret settings and reviewed HTTPS proxy configuration. Docker does not create demo/UAT accounts or perform Cloud Run deployment.

The migration command uses `DATABASE_URL` from `server/.env` without resetting the database. It checks the checksums of previously applied migrations before deployment and stops if a file has been changed or removed, or if a failed migration has not been resolved. Do not bypass this check by calling Prisma deploy directly in the normal workflow:

```powershell
npm run db:generate
npm run db:migrate
```

Seeding is a separate command and rejects `NODE_ENV=production`. Provide a synthetic password through the environment. The `p1`, `p2`, `p3`, `o1`, `o2`, `i1`, and `i2` accounts use the `example.test` domain:

```powershell
$env:ALLOW_SYNTHETIC_SEED = '1'
$env:SEED_PASSWORD = 'synthetic-password-for-test-only'
npm run db:seed
Remove-Item Env:ALLOW_SYNTHETIC_SEED, Env:SEED_PASSWORD
```

The seed uses fixed fixture IDs, does not reset the database, and does not change existing records with the same IDs when run again. Use it only with databases prepared for local development or testing.

## Run and verify

Open two terminals from the repository root:

```powershell
npm run dev:server
```

```powershell
npm run dev:client
```

The frontend is available at `http://localhost:5173`, and Vite proxies `/api` to the server at `http://localhost:3000`. `/api/health` returns 200 when the database is reachable and 503 otherwise. F-01 supplies login, logout and current identity; F-02 supplies public event discovery and Organizer publication. Registration belongs to F-03. Use the synthetic accounts described by the seed and the password supplied when first creating them.

`/api/ready` performs the same database availability check and returns 200 or 503 without exposing connection errors. It is intended for deployment readiness checks.

For a production deployment behind exactly one trusted HTTPS-terminating proxy, set `TRUST_PROXY_HOPS=1`; leave it unset for local use and deployments without that trusted proxy. Enable it only when direct access to the application is restricted and the proxy controls forwarded protocol headers. Production uses Secure session cookies. Set `APP_ORIGIN` to the exact public browser origin and provide a unique `SESSION_SECRET` and database connection using the deployment's secret management. These settings have not yet been verified on Cloud Run.

The synthetic seed deliberately refuses `NODE_ENV=production`. A separate, explicit `npm run db:provision-demo` command is available for a **dedicated course demo/UAT database only**, never a database containing real users. After migration and teammate review, an authorized operator must provide `DATABASE_URL`, the actual database name in `DEMO_EXPECTED_DATABASE`, `ALLOW_DEMO_PROVISION=1`, and all three password values: `DEMO_PARTICIPANT_PASSWORD`, `DEMO_ORGANIZER_PASSWORD`, and `DEMO_INSTRUCTOR_PASSWORD`. Each must be 16–1024 UTF-8 bytes, and all three values must differ from one another; a missing, out-of-range, or duplicate password rejects provisioning before any account is created. Supply secrets through an appropriate secure mechanism such as Secret Manager; do not place them in files, command history, logs, screenshots, PRs or chat. The operator must verify the project, database and backup before execution: checking the database name is a safeguard, not proof that the target is a safe demo environment.

The command creates `participant@example.test`, `organizer@example.test`, and `instructor@example.test` with unique IDs and independently salted Argon2id hashes. It reports `created` or `existing` per role without printing passwords. Existing matching accounts retain their current password and details, so supplying a new password when rerunning does **not** reset it. A conflicting ID, email or role aborts the entire transaction for all three accounts. Resetting credentials, delivering them to testers and disabling accounts after UAT require a separately agreed procedure. Run the command explicitly as an operator, not on every app startup or deployment. `tsx`, Prisma Client and the script must be present in the runtime used to execute it; the cloud image/job and secret injection are not configured yet. Cloud migration, demo provisioning and deployment have not been performed as part of this readiness change.

If port 3000 is occupied, set `PORT=3001` in `server/.env`, add `REGMEUP_API_PROXY_TARGET=http://localhost:3001` to `client/.env.local`, and restart both processes. Choose a different free port if 3001 is occupied too. The Vite proxy target and backend port must match.

```powershell
npm run typecheck
npm run build
npm run test:unit
```

## Integration tests

On Windows with Docker Desktop running, use `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-integration-local.ps1` from the repository root to start the local Compose PostgreSQL service, generate Prisma, migrate/seed `regmeup_test`, install its guard and run the integration suite. This helper reads the published port from the running Compose PostgreSQL service, uses the local Compose credentials, restores the calling environment values, and stops on preparation errors. It preserves the Docker volume. For custom PostgreSQL installations, use the explicit setup below instead.

Compose creates two separate databases on the same server endpoint: `DATABASE_URL` for the application and `TEST_DATABASE_URL` for testing. The guard reads the effective database and server identity from both connections rather than comparing URL strings alone. It rejects different endpoints or cases where it cannot verify that the databases are separate.

Integration files run sequentially because they share one guarded test database and some assert public catalog totals. Controlled concurrent requests/transactions inside race tests still run concurrently; this setting only prevents unrelated test files from changing each other's fixtures/totals.

On a fresh Compose volume the test database exists but needs migrations, synthetic fixtures, and a test-only marker. The marker must be installed **after** the initial migration because Prisma rejects migration into a nonempty schema. In a **new PowerShell terminal**, verify that the target URL names `regmeup_test`, then run the following example from the repository root (adjust the port if changed):

```powershell
$env:TEST_DATABASE_URL = 'postgresql://regmeup_app:regmeup-local-only@127.0.0.1:55432/regmeup_test'
$env:DATABASE_URL = $env:TEST_DATABASE_URL
$env:ALLOW_SYNTHETIC_SEED = '1'
$env:SEED_PASSWORD = 'synthetic-password-for-test-only'
npm run db:migrate
npm run db:seed
Get-Content -Raw docker/postgres/enable-test-guard.sql | docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U regmeup_app -d regmeup_test
$env:DATABASE_URL = 'postgresql://regmeup_app:regmeup-local-only@127.0.0.1:55432/regmeup_dev'
npm run test:integration
Remove-Item Env:DATABASE_URL, Env:TEST_DATABASE_URL, Env:ALLOW_SYNTHETIC_SEED, Env:SEED_PASSWORD
```

Integration tests refuse to run if a URL is missing or the database identity or marker fails the guard. Constraint tests use transactions and roll them back. There is no HTTP reset endpoint or automatic reset command. Do not use `prisma migrate reset` or `migrate dev` against application or production databases containing data that must be kept. For F-01 browser tests, see [e2e/README.md](e2e/README.md).

## Verification scope

The [SYS-01 contract](docs/sprints/sprint-1/sys-01.md) defines the foundation criteria. [F-01 verification](docs/sprints/sprint-1/f-01-evidence.md) records identity checks and remaining gaps. These checks do not establish completion of F-02–F-04 or full-product TEST-13.

F07 candidate adds Organizer-owned Check-in from My Events. Run the existing `npm run db:migrate` procedure to add Attendance; startup does not seed or reset existing data. Eligible ACTIVE registrations may be checked in from event start until before event end; repeat requests preserve the saved attendance/time. Use **Check status** after an uncertain result. [F07 API/setup/test evidence](docs/sprints/sprint-3/f-07-evidence.md) records local execution and remaining review/release/human gates; F08 reports remain contract-only.
