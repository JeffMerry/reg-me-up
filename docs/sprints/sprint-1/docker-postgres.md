# Local PostgreSQL with Docker — scope and test design

Scope: use Docker Compose for a local PostgreSQL 17.11 development instance, without containerizing the frontend or backend. A fresh volume creates separate `regmeup_dev` and `regmeup_test` databases. The explicit test-only marker is installed in the test database after migrations, because Prisma cannot deploy the initial migration to a nonempty schema. The service binds only to loopback on a separate host port and keeps data in a named volume. Credentials in the example are synthetic local-development values, not production secrets. Existing host PostgreSQL and existing project databases must not be modified.

Before implementation, planned verification:

1. Validate the Compose configuration, then start the service on a clean, dedicated volume and wait for database readiness; verify the host can connect to both databases.
2. Apply existing migrations independently to each database, install the marker in `regmeup_test` only, then verify it is absent from `regmeup_dev`. The existing effective-identity guard must accept the two distinct databases but reject the same database.
3. Apply synthetic seed independently to each database; run the integration suite with the normal guard and record actual results.
4. Stop and start the service without deleting the named volume; confirm seeded records persist and no initialization reset occurs.
5. Verify documented setup from a fresh copy of the example environment without overwriting an existing `.env`; confirm app and test connection strings use the published host port.

The Compose initialization scripts run only when the named volume is first initialized. Never delete an existing volume or reset a database automatically. Live results and environment limits must be recorded separately; this document is a test plan, not evidence of execution.

## Local verification on 12 November 2026

- Docker Compose configuration validated; PostgreSQL 17.11 container started healthy on `127.0.0.1:55432`. The container and its named development volume were left available locally.
- Applied migration and synthetic seed to the new `regmeup_dev` and `regmeup_test` databases; installed the marker in the test database after migration. The application database was checked to have no test marker. The integration suite passed 19/19, including its distinct-database and marker safety cases.
- Stopped and restarted the Compose service without deleting its volume; the five synthetic application accounts remained. A temporary backend passed its health check and authenticated the synthetic Participant against the Docker application database.
- Client and server builds passed. The initial integration attempt could not start because this machine's `node_modules` was missing a native Rolldown binding; the missing matching binding was restored without modifying `package-lock.json`. A subsequent frontend build found a missing Lightning CSS binding, which was likewise restored; frontend build then passed. Integration was rerun successfully without `NODE_PATH` overrides.
- The first test-database migration failed with Prisma P3005 because the initial Compose script created the marker before migration. Only the newly created marker table in the new test database was removed, migration and seed were applied, and the marker was then installed. Compose initialization and README were corrected to reflect this order. A second fresh volume was not created to repeat the entire corrected first-initialization flow.

These checks do not claim a teammate's fresh setup or peer review; they also do not establish a completed Docker deployment for the frontend/backend.
