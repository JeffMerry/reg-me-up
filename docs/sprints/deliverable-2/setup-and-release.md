# Setup summary and release evidence handoff

27 November 2026 (Asia/Bangkok). Refs #45. This is an executable-process summary for the report, not an execution/deployment claim. [README](../../../README.md), [browser setup](../../../e2e/README.md) and [Lab5 deployment](../../labs/lab-05/deployment.md) contain the detailed procedures. Follow the current source commands; old deployment snapshots do not identify the D2 release.

## Dependencies and environment

Node22.23.4/npm10.9.9 are pinned; PostgreSQL17.11 is the local/CI target. React/TypeScript/Vite client and Express/Prisma7.10.1 server use npm workspaces and the committed lockfile. Docker Desktop Linux engine and Compose are needed for the documented local container setup. Browser tests use Playwright Chromium.

| Environment name | Purpose / safe example |
|---|---|
| `NODE_ENV` | `test` for prepared fixture runs; production for the deployed image |
| `DATABASE_URL` | Local app database; configure privately, never include actual connection strings in evidence |
| `TEST_DATABASE_URL` | Different disposable test DB on the same PostgreSQL server; guard must verify live identity and marker |
| `SESSION_SECRET` | Test-only random secret>=32 characters; runtime secret supplied privately |
| `APP_ORIGIN` | Local `http://localhost:5173`; deployed exact public HTTPS origin |
| `PORT` | Local3000; Cloud Run runtime port; Playwright API43170 |
| `TRUST_PROXY_HOPS` | Production1 only for the reviewed single trusted HTTPS proxy |
| `ALLOW_SYNTHETIC_SEED`, `SEED_PASSWORD` | Explicit local/test synthetic provisioning; existing accounts retain passwords; never seed production |
| `E2E_APP_DATABASE_URL` | Separate app DB identity retained while browser app connects to guarded test DB |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` | Optional existing Chromium path; otherwise installed Playwright Chromium |
| `FRONTEND_DIR` | Container `/app/client/dist` |

Full optional Compose/Vite/demo variables are documented in the deployment guide. Safe accounts come from the synthetic local seed or private course handoff. Do not publish passwords/cookies/tokens. Existing seeded passwords are preserved on repeat seed; changing a seed input is not a password reset.

## Prepare and run locally

From the repository root, select the reviewed candidate and record full SHA/status. Install dependencies using the pinned versions:

```powershell
node --version
npm --version
npm ci
if (-not (Test-Path server/.env)) { Copy-Item server/.env.example server/.env }
docker compose up -d --wait
npm run db:generate
npm run db:migrate
```

Configure `.env` locally before migration: the application DB must be the intended disposable local app target. Prepare the separate test DB, synthetic seed and test guard using README's **Integration tests** section. Install the guard after the initial migration. No reset or volume deletion is required. Apply migration history checks through `db:migrate`, not a bypassed direct deploy command. Repeat migration should report no pending migrations; retain preservation/constraint results.

Run `npm run dev:server` and `npm run dev:client` in separate terminals. For single-origin local Docker application, use `docker compose --profile app up --build -d --wait`; account seed is still explicit and separate. These are local operations, not GCP deployment.

## Verify the candidate

Use [candidate verification](candidate-verification.md) for commands/results. On memory-constrained Windows, serialize unit files without weakening assertions:

```text
npm exec --workspace server -- vitest run tests/unit --maxWorkers=1 --no-file-parallelism
```

The full integration script already disables file parallelism. Keep app/test URLs distinct for its guard. Browser tests require migrated/seeded guarded target and `E2E_APP_DATABASE_URL` for the distinct app identity; the test server uses `DATABASE_URL=TEST_DATABASE_URL`. Playwright starts dedicated API/Vite on43170/43171 and refuses to reuse an existing service. Do not run integration and browser suites concurrently against the shared test DB.

Capture every command's exit status, source SHA, dirty files, passed/failed/skipped counts and actual output. Run the selected journeys in the index and retain captioned UI/API/DB evidence. Build/health200 alone does not establish domain behavior.

## Main promotion and deployment

1. Commit/review documentation on `docs/deliverable-2` → `sprint/02-staging`; retain exact PR head and actual `test-and-docker` result. This environment cannot write `.git`, so the human performs commit/push. Any later changes need their own reviewed source identity.
2. Complete G05 candidate regression/selected journeys and unresolved selections. Preserve the Sprint2 pre-F07 checkpoint `3a22a71` and identify the actual accepted main source separately. Open staging→main release PR only with evidence ready for THN4 review; no self-approval.
3. The existing `.github/workflows/deploy.yml` runs on main push or manual main dispatch. Its `test` job calls CI for a new build; deployment uses WIF and protected `demo` environment. Read actual check names/results rather than assuming branch-protection requirements.
4. The workflow builds, pushes, resolves Artifact Registry digest, executes the migration job on that digest, deploys Cloud Run and performs its smoke checks. Record main SHA, run ID/attempt/conclusion, pushed full digest, migration execution, ready revision, traffic, URL and timestamp. The local CI image SHA in the PR log is not the pushed deployment digest.
5. Execute actual post-deploy domain journeys and API denials on the observed revision, then retain IDs and verify persistence after the agreed restart/redeploy without reseeding. Use synthetic fixtures and preserve existing data; record any failure and cleanup disposition.
6. Final PDF embeds complete required documents/evidence and identifies immutable submitted source, deployed version, both students/IDs, contributions/AI use and page navigation. The named human submits via LEB2 by29Nov2026 23:59 Bangkok and records receipt/time/final file hash. No submission is performed by this handoff.

Main-only manual workflow examples, for the operator after the reviewed release exists:

```text
gh workflow run deploy.yml --ref main
gh run list --workflow deploy.yml --limit 5
```

Do not dispatch while the release gates are incomplete. Manual `image_tag` is an existing-image redeploy/rollback path; it must reference a known full40-character source SHA with compatible schema. Do not use it to imply tests/migrations were rerun by a normal build path.

## D2 release identity record

| Field | Actual value |
|---|---|
| Reviewed release PR/head/check names | PENDING |
| Accepted Sprint2 main identity | TBD |
| Immutable submitted main tag/commit | TBD |
| CI/deploy run/attempt and conclusion | PENDING |
| Pushed image digest / migration execution | PENDING |
| Cloud Run revision / traffic / public URL / time | PENDING |
| Domain/redeploy persistence evidence IDs and tester | PENDING |
| PDF version/hash / named submitter / LEB2 receipt/time | PENDING |

Known historical service URL: `https://regmeup-nxoa6mi4ha-as.a.run.app` in Lab5 evidence. It is not asserted to serve this D2 source until the actual revision/digest mapping is recorded.
