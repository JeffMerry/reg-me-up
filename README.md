# RegMeUp

An event registration system for university training sessions and workshops, developed for CPE334 Software Engineering.

The foundation branch provides the client/server structure, database setup, and test tooling. Login, events, and registration have not yet been implemented. See the [documentation index](docs/README.md), [SYS-01 contract](docs/sprints/sprint-1/sys-01.md), and [UI baseline](docs/ui-spec.md).

## Prerequisites

- Node.js **22.23.4** and npm **10.9.9**; `.nvmrc` specifies the target Node version.
- PostgreSQL **17.11** with separate application and test databases and permission to manage the schema in each designated database.
- Use synthetic data only. Do not commit passwords or `.env` files.

Install dependencies from the repository root:

```powershell
node --version
npm --version
npm ci
Copy-Item server/.env.example server/.env
```

Set `DATABASE_URL`, `TEST_DATABASE_URL`, `SESSION_SECRET`, and `APP_ORIGIN` in `server/.env` for your environment. The application and test databases must be separate databases; the session secret must contain at least 32 characters. Do not use production credentials. Values in `.env.example` are placeholders.

## Database and seed

Create the databases and accounts using your team's PostgreSQL setup procedure. The migration command uses `DATABASE_URL` from `server/.env` without resetting the database. It checks the checksums of previously applied migrations before deployment and stops if a file has been changed or removed, or if a failed migration has not been resolved. Do not bypass this check by calling Prisma deploy directly in the normal workflow:

```powershell
npm run db:generate
npm run db:migrate
```

Seeding is a separate command and rejects `NODE_ENV=production`. Provide a password for synthetic accounts through the environment. The `p1`, `p2`, `p3`, `o1`, and `o2` accounts use the `example.test` domain:

```powershell
$env:ALLOW_SYNTHETIC_SEED = '1'
$env:SEED_PASSWORD = 'replace-with-a-synthetic-local-password'
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

The frontend is available at `http://localhost:5173`, and Vite proxies `/api` to the server at `http://localhost:3000`. `/api/health` returns 200 when the database is reachable and 503 otherwise. Domain endpoints are not yet available.

```powershell
npm run typecheck
npm run build
npm run test:unit
```

## Integration tests

Use two separate PostgreSQL databases on the same server endpoint: `DATABASE_URL` for the application and `TEST_DATABASE_URL` for testing. The guard reads the effective database and server identity from both connections rather than comparing URL strings alone. It rejects different endpoints or cases where it cannot verify that the databases are separate.

Prepare an empty test database after manually verifying its name and endpoint. Temporarily point `DATABASE_URL` to the test database to run `npm run db:migrate` and `npm run db:seed`. Then create the marker table **only in the verified test database** using `psql` or a database management tool:

```sql
CREATE TABLE regmeup_test_guard (marker text PRIMARY KEY CHECK (marker = 'regmeup-isolated-test'));
INSERT INTO regmeup_test_guard VALUES ('regmeup-isolated-test');
```

Set `DATABASE_URL` back to the application database, and set `TEST_DATABASE_URL` and the `SEED_PASSWORD` used to seed the test database in your shell before running:

```powershell
npm run test:integration
```

Integration tests refuse to run if a URL is missing or the database identity or marker fails the guard. Constraint tests use transactions and roll them back. There is no HTTP reset endpoint or automatic reset command. Do not use `prisma migrate reset` or `migrate dev` against application or production databases containing data that must be kept.

## Verification scope

The [SYS-01 contract](docs/sprints/sprint-1/sys-01.md) defines the acceptance criteria and test design. Record actual results and limitations in the PR. Foundation checks are not evidence that F-01–F-04 or full-product TEST-13 have passed. Playwright tooling is prepared, but this branch does not yet contain domain E2E journeys.
