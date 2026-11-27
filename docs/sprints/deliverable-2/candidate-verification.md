# Combined candidate verification record

27 November 2026 (Asia/Bangkok). Refs #45 / S2-G05. Branch `docs/deliverable-2`; HEAD `7c85dcc3e762c7f2be62a2285264af8aa4f9a972` with uncommitted documentation additions. No runtime/test/configuration files changed by this compilation. `git diff cc55b4a HEAD -- server client e2e package.json package-lock.json .github Dockerfile docker` was empty. This source equivalence does not turn a historical PR CI into a fresh execution on a later accepted main commit.

## Actual local execution

Windows PowerShell; installed Node **24.14.0**, npm **11.9.0**, differing from repository-pinned22.23.4/10.9.9. No dependency install, seed/reset or production write performed. Loopback connections and Docker named-pipe access are restricted by this execution environment.

| Check / command | Actual result | Interpretation |
|---|---|---|
| `npm run test:unit` | **87 passed,6 failed,0 skipped**,10 files:7 passed/3 failed; exit1 | Failed tests could not connect to loopback: `TypeError: fetch failed`, `connect EACCES 127.0.0.1:58994`. Failed files: auth-guards3 cases, frontend-serving1, health2. Do not mark suite green |
| `npm run typecheck` | PASS, exit0 | Client and server; Prisma7.10.1 generation succeeded |
| `npm run build` | PASS, exit0 | Client Vite8.3.6 built20 modules; server Prisma generation/TypeScript succeeded |
| `docker version --format '{{.Server.Version}}'` | Permission denied accessing `npipe:////./pipe/dockerDesktopLinuxEngine` | No Docker build or database started |
| Integration / browser | **NOT RUN** by this attempt | Loopback is denied and isolated DB/browser prerequisites not established; no intentional guard bypass or skipped tests |
| Main/deployment/manual journeys | **NOT RUN** | No new accepted main source or deployment evidence |

Selected actual unit failure output:

```text
Failed Tests 6
TypeError: fetch failed
Caused by: Error: connect EACCES 127.0.0.1:58994
Test Files  3 failed | 7 passed (10)
Tests       6 failed | 87 passed (93)
Duration    1.70s
```

Ignored convenience logs: `tmp/d2-verification/unit.log`, `typecheck.log`, `build.log`. The summaries above are retained here because ignored logs are not durable evidence. Failures are observed environment errors, not established domain assertion defects. They remain failures of this attempt; they cannot be erased by earlier CI success.

## User-run follow-up — 27 November 2026

The user supplied terminal output in this session; these are operator-reported executions, distinct from agent-run output above. Source context remains the documentation branch at `7c85dcc` with documentation-only changes; no additional SHA/status capture was supplied with this output.

| Attempt | Command / environment | Observed result |
|---|---|---|
| Default workers,20:56:21 Bangkok | `npm run test:unit`; local Node24.14.0 | Worker initialization crashes: VirtualAlloc failed / fatal JavaScript out of memory; **no tests**,10 unhandled worker errors, exit1. This is not a domain RED assertion |
| One concurrent worker,20:57:50 Bangkok | `npm exec --workspace server -- vitest run tests/unit --maxWorkers=1 --no-file-parallelism`; Node24.14.0 | **93 passed /93**,10/10 files, duration9.73s; no failed/skipped cases reported. Isolation still spawns a worker per file over the run; execution is serialized, no tests/assertions disabled |

The user-run PASS resolves the immediate unit-check blocker for this source context, while retaining the earlier environmental failures. The user-run integration attempt is recorded below. The toolchain still differs from the pinned release version, and no fresh successful integration/browser/Docker/main result follows from the unit pass.

### User-run integration attempt — 27 November 2026

The user supplied output from `npm run test:integration`. **All 13 suites failed during setup; all 128 tests were skipped and zero test assertions ran.** Most suites reported missing `DATABASE_URL` / `TEST_DATABASE_URL` or missing separate guarded app/test databases. `attendance-migration.test.ts` also reported `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`. Treat this as an unconfigured database environment, not a domain assertion failure and not a pass. Retry only after preparing the two separate local databases, migrations, synthetic fixtures, and the test-only guard as documented in [README Integration tests](../../../README.md#integration-tests). Do not include connection strings or passwords in evidence.

### User-reported rerun after seed fix — 27 November 2026

The user reports the rerun through `scripts/test-integration-local.ps1` passed all integration tests after the synthetic seeder was changed to refresh passwords for its fixed fixture IDs. Record this as **128/128 passed, 13/13 suites**, user-reported; raw final Vitest output and exit code were not included in the message. The prior 126/128 run remains documented above as the observed failure before the fix. Re-run the suite on the reviewed commit/CI to retain independently verifiable output.

## PR70 browser startup follow-up

PR70 head `4d1c4e7`, run [46020963099](https://github.com/JeffMerry/reg-me-up/actions/runs/46020963099), passed93 unit and128 integration tests, then Playwright reported `Process from config.webServer exited early` immediately after the API listening message. No browser case summary was produced; this is startup failure, not a failing browser domain assertion. The log does not establish the underlying exit cause. Playwright now launches the API directly with `node --import tsx server/src/index.ts`, removing the intermediary npm/tsx CLI lifecycle. Latest PR checks must verify the revised source; retain this failed attempt separately from PR69's passing evidence. The port and seed-documentation review fixes were already present in4d1c4e7 and are preserved.

Local verification of the direct Node launcher:14/14 F07 browser cases passed using the pinned Node22 toolchain, guarded native test database and installed Chrome; no seed/reset was performed. Full PR browser regression remains a CI gate.

## Independent historical CI

Actual [CI log excerpt](ci-excerpt.md) independently establishes93/128/87 passing tests at PR #69's synthetic merge `4d4e2740e1ddcf47d1b4dd784c77c70610d99d8a`. It is retained separately from this local failure. C69 has the combined F05/F06/F09/F07 runtime/tests, but G05 requires a fresh record for the reviewed candidate plus selected acceptance journeys.

## Required next execution

Use the pinned toolchain and an unrestricted local shell with **already prepared separate disposable application/test databases and the test guard**, or use a new GitHub PR CI run after committing these documents. Follow [setup and release](setup-and-release.md). Never point integration/browser fixtures at production; do not paste `.env` or credentials as evidence.

For a local run, keep the application URL in `DATABASE_URL`, distinct guarded target in `TEST_DATABASE_URL`, seed already prepared with the same `SEED_PASSWORD`, and test-only session secret configured. Run and record source identity and output:

```powershell
git rev-parse HEAD
git status --short
node --version
npm --version
npm run test:unit
npm run test:integration
npm run typecheck
npm run build
```

For the browser run in the same prepared shell:

```powershell
$taskAppDatabaseUrl = $env:DATABASE_URL
try {
  $env:E2E_APP_DATABASE_URL = $taskAppDatabaseUrl
  $env:DATABASE_URL = $env:TEST_DATABASE_URL
  npx playwright test
} finally {
  $env:DATABASE_URL = $taskAppDatabaseUrl
}
docker build --tag regmeup-d2-local .
```

These commands execute fixtures with scoped cleanup; they do not prepare/migrate/seed databases. Use the linked setup first if needed. The repository Playwright config writes generated screenshots/reports into tracked evidence directories; review resulting changes and retain intentional evidence without mixing unrelated generated output into a docs commit. Do not delete retained prior screenshots blindly.

Fill a new dated result rather than overwriting the observed failure above. Record all failed/skipped cases, exact SHA and working-tree changes. G05 remains **OPEN** until the combined candidate checks and [selected journeys](evidence-index.md#candidate-and-demonstration-record) have actual evidence and reviewer assessment. G06 follows the reviewed main deployment and real persistence checks.
