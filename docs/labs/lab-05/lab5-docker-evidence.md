# Lab 5 Episode 3 — clean-clone local verification

Tested on November 14, 2026 (Asia/Bangkok), run by Codex. The application was tested from a clean clone of PR #16 at commit `a231b89149eefd2a90be86557e0ff9ec6e86e267`, starting with a clean working tree. [PR #16](https://github.com/JeffMerry/reg-me-up/pull/16) received teammate approval and was merged. This was not a GCP deployment or Cloud redeployment. The Docker build used cached base/dependency layers as normal; it did not use `--no-cache`.

Limitation: PR approval/merge does not show that a teammate repeated the clean-clone run. No teammate rerun is recorded here.

After building the Docker image from the commit above, the smoke-test helper was copied into a separate clone to run browser checks. The helper was added in a later PR and was not part of the tested commit/image. SHA-256 of the helper used: `da0b762dcefa8a04d44a186e209d00eba7bde07b55d187a3d6d91ca95b59c0a9`. The helper included in the PR is [`scripts/lab5-docker-smoke.cjs`](../../../scripts/lab5-docker-smoke.cjs). Later documentation/helper commits are not claimed as the tested application commit.

## Target and setup

- Cloned from GitHub, branch `build/lab5-docker`; `git rev-parse HEAD` showed the commit above and the initial `git status --short` was empty. Node `22.23.4`, npm `10.9.9`.
- Used Compose project **`regmeup-c03-a231-1411`**, its named volume, PostgreSQL host port `55434`, and web port `5176`. Verified that the project/volume did not exist before starting. Did not use the user's normal volume or database.
- Copied `server/.env.example` to `.env` inside the clone, changed the port to `55434`, and set a synthetic local session secret. No secret values are recorded. Set `REGMEUP_PG_PORT=55434`, `REGMEUP_WEB_PORT=5176`, `REGMEUP_APP_ORIGIN=http://localhost:5176`, and a synthetic `SEED_PASSWORD` in the environment.
- From the clone root, ran `npm ci` (passed; installed from the lockfile), `docker compose -p regmeup-c03-a231-1411 up -d --wait`, `npm run db:generate`, `npm run db:migrate`, and `npm run db:seed` with `ALLOW_SYNTHETIC_SEED=1`. Migration `20261111000000_initial` succeeded and the seed reported `Synthetic fixtures are present.`
- Prepared `regmeup_test` separately from the app DB: set `DATABASE_URL` to `TEST_DATABASE_URL` for `npm run db:migrate` and `npm run db:seed`, then installed the marker with `docker/postgres/enable-test-guard.sql` using `docker compose -p regmeup-c03-a231-1411 exec -T postgres psql -v ON_ERROR_STOP=1 -U regmeup_app -d regmeup_test`. Restored `DATABASE_URL` to the app DB before integration tests, as described in [deployment.md §3](deployment.md#3-build-test-and-run-from-a-clean-clone).

## Automated tests and Docker image

| Command / check | Actual result |
|---|---|
| `npm run test:unit` | 55/55 passed |
| `npm run test:integration` | 40/40 passed; test guard checked that app/test DBs were separate |
| `npm run typecheck` and `npm run build` | Passed |
| `npx playwright test` | 33/33 passed with Chromium and a separate test DB |
| `docker compose -p regmeup-c03-a231-1411 --profile app up --build -d --wait` | Build passed; PostgreSQL/app healthy; migration service exited 0 |
| `docker compose -p regmeup-c03-a231-1411 --profile app run --rm -e NODE_ENV=development -e ALLOW_SYNTHETIC_SEED=1 -e SEED_PASSWORD migrate npm run db:seed` | Re-seeding the local app DB passed and retained existing fixtures |

`docker image inspect regmeup-c03-a231-1411-app --format '{{.Id}}'` returned app image ID `sha256:339b829668fc0cc7c7261244574cb2ba19a8bdbfe991b0f04969df21235fde6b`. The same command for `regmeup-c03-a231-1411-migrate` returned migration image ID `sha256:8efebdb4db7d157cf8ae117d5f43a8ecb70326d0f92d9a2b6d3a008f84b8b46c`. These are local image IDs, not Artifact Registry digests or deployment evidence.

The command below returned PASS for all four paths. It checks only the listed paths; it does not claim that the entire image was scanned for secrets.

```bash
docker run --rm --entrypoint node regmeup-c03-a231-1411-app -e "const fs=require('fs');const p=['/app/server/.env','/app/.git','/app/.toolchain','/app/.aws'];if(p.some(x=>fs.existsSync(x)))process.exit(1);console.log('PASS: inspected paths absent')"
```

## Browser/API and restart — reproduction steps

Use only **synthetic local data in a database intended to contain test events**. The helper creates real records in the target DB. Before starting, manually verify the Compose project, origin, and database. `SEED_PASSWORD` must match the value used to seed the local DB; provide it safely through the environment and do not place it in logs or documentation.

From the root of a checkout containing the helper, set the variables and run:

```powershell
$env:REGMEUP_PG_PORT = '55434'
$env:REGMEUP_WEB_PORT = '5176'
$env:REGMEUP_APP_ORIGIN = 'http://localhost:5176'
$env:LAB5_SMOKE_BASE_URL = 'http://localhost:5176'
$env:LAB5_SMOKE_CONFIRM = 'isolated-local-only'
New-Item -ItemType Directory -Force .toolchain | Out-Null
$env:LAB5_SMOKE_RECORD_PATH = Join-Path (Get-Location) '.toolchain/lab5-smoke-record.json'
# Set a synthetic SEED_PASSWORD safely before running; install Chromium with npx playwright install chromium if needed.
node scripts/lab5-docker-smoke.cjs create
docker compose -p regmeup-c03-a231-1411 --profile app stop app postgres
docker compose -p regmeup-c03-a231-1411 --profile app up -d --wait
node scripts/lab5-docker-smoke.cjs verify
```

`create` verified that `/api/health` and `/api/ready` returned 200 and an unknown `/api` route returned 404. It logged in as Organizer in a browser, published an event, looked it up through the public API, logged in as Participant, and registered through the UI. `verify` confirmed that the same event and registration IDs remained after restart. Created test fixtures: event ID `e2f06677-5be9-4b7e-9cef-0ddb744ee278`, registration ID `4d8726f3-bd36-45b0-9881-4f385d823911` (synthetic data in the local test volume only). The browser was Playwright Chromium headless shell version 1234, selected through `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

Stop the test app/DB with `docker compose -p regmeup-c03-a231-1411 --profile app stop app postgres` while keeping the volume. Do not use `down -v` on a volume whose data must be retained. **This local check** does not prove persistence after Cloud redeployment, C-04 on the public URL, or the CI gate. Separate results are recorded in [Issue #21](https://github.com/JeffMerry/reg-me-up/issues/21), [Issue #22](https://github.com/JeffMerry/reg-me-up/issues/22), and [Issue #24](https://github.com/JeffMerry/reg-me-up/issues/24). There is no evidence here of a teammate repeating the clean-clone run.
