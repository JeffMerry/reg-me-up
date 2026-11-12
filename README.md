# RegMeUp

An event registration system for university training sessions and workshops, developed for CPE334 Software Engineering.

This branch provides the project foundation, F-01 identity/login, and F-02 event publication/discovery work. Registration remains F-03. See the [documentation index](docs/README.md), [SYS-01 contract](docs/sprints/sprint-1/sys-01.md), and [UI baseline](docs/ui-spec.md).

## Prerequisites

- Node.js **22.23.4** and npm **10.9.9**; `.nvmrc` specifies the target Node version.
- Docker Desktop with the Linux container engine running. Compose provides PostgreSQL **17.11** with separate application and test databases; Node.js runs the application outside Docker.
- Use synthetic data only. Do not commit passwords or `.env` files.

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

The migration command uses `DATABASE_URL` from `server/.env` without resetting the database. It checks the checksums of previously applied migrations before deployment and stops if a file has been changed or removed, or if a failed migration has not been resolved. Do not bypass this check by calling Prisma deploy directly in the normal workflow:

```powershell
npm run db:generate
npm run db:migrate
```

Seeding is a separate command and rejects `NODE_ENV=production`. Provide a synthetic password through the environment. The `p1`, `p2`, `p3`, `o1`, and `o2` accounts use the `example.test` domain:

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

If port 3000 is occupied, set `PORT=3001` in `server/.env`, add `REGMEUP_API_PROXY_TARGET=http://localhost:3001` to `client/.env.local`, and restart both processes. Choose a different free port if 3001 is occupied too. The Vite proxy target and backend port must match.

```powershell
npm run typecheck
npm run build
npm run test:unit
```

## Integration tests

Compose creates two separate databases on the same server endpoint: `DATABASE_URL` for the application and `TEST_DATABASE_URL` for testing. The guard reads the effective database and server identity from both connections rather than comparing URL strings alone. It rejects different endpoints or cases where it cannot verify that the databases are separate.

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
