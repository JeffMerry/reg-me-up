# F-09 implementation and verification evidence

Latest CI follow-up: run `45964497962` on `1b0a2f1` passed all 93 unit and 94 integration tests plus typecheck/build. Browser execution stopped before running cases with `Timed out waiting 60000ms from config.webServer`; Docker image build was skipped. The working-tree startup fix uses non-watch backend execution, explicit IPv4 addresses for browser/server/proxy/origin, and piped server output. Playwright discovery still lists 62 cases; CI browser/Docker confirmation remains pending after pushing this fix.

CI update (27 November 2026, run 45961985966 at commit 2d57965): full unit PASS 93/93; integration 87 passed / 7 failed. This observed CI result supersedes the earlier developer-reported integration PASS. The seven failures were traced to outdated seed user counts, repeated response-body reads, schedule fixtures leaking between cases, and a race fixture missing an existing assignment. Fixes are in the working tree; typecheck passes. Focused integration rerun is blocked by runner EACCES before database connection, so CI confirmation after pushing the fix is pending. No tests were skipped or disabled by this fix.

## Latest status — 27 November 2026

This status supersedes the historical attempts below: F-09 E2E PASS 5/5 (Playwright artifacts), focused Instructor unit PASS 6/6, typecheck PASS, client/server build PASS. Integration PASS is reported by the developer in this conversation; successful-run output/counts have not been supplied. Full unit suite PASS: 93/93 tests across 10/10 files, confirmed by the developer-provided Vitest screenshot (duration 4.34 seconds). This successful local run supersedes the earlier runner EACCES attempts. Peer review and deployment acceptance are not inferred from these results.

Implementation commits: `affac31` (server), `22f88f8` (client), `0ebff2a` (tests/evidence).

## Historical attempts and implementation record

Run date: 27 November 2026. Working tree on `feature/f-09-instructor`, based on shared staging SHA `b8ad3e2` before implementation. Issue: #43. This is uncommitted candidate evidence only; no reviewer approval or staging acceptance is implied.

## Test-first evidence

The half-open interval rule was exercised before implementing its predicate. With a stub returning `false`, the focused unit test produced **4 failed / 2 passed**; failing cases were equal ranges, contained ranges in both directions, and a one-millisecond overlap. After implementing `candidate.startsAt < other.endsAt && other.startsAt < candidate.endsAt`, the same focused test produced **6 passed / 0 failed**. This demonstrates the pure overlap rule only; it does not prove query filtering, transaction locking, migration behavior or API behavior. The red/green executions were performed in the worktree before commits; final candidate commit references will be recorded here after the small commits are created.

## Executed checks

| Scope | Command / observation | Result | Limit |
|---|---|---|---|
| Half-open schedule rule | `npx vitest run tests/unit/instructor-schedule.test.ts` from `server/`, before and after predicate implementation | RED 4 failed / 2 passed; GREEN 6 passed | Pure helper only |
| Repeat focused check | `npx vitest run tests/unit/instructor-schedule.test.ts` from `server/` | 6 passed / 0 failed | After UI fix and before the final commit attempt |
| Unit suite | `npm run test:unit` (also repeated with focused path appended; root script still ran all unit tests) | 87 passed / 6 failed | All six failures are loopback test-harness bind attempts rejected with `EACCES`; the focused Instructor schedule suite passed |
| Latest workspace unit rerun | `npm run test:unit --workspace server` | 87 passed / 6 failed | Same six harness cases failed with `connect EACCES 127.0.0.1`; 10 test files ran |
| Latest focused Instructor unit rerun | `npx vitest run tests/unit/instructor-schedule.test.ts` from `server/` | 6 passed / 0 failed | Pure half-open overlap helper only |
| Latest workspace integration attempt | `npm run test:integration --workspace server` | Not run: 94 tests skipped and 10 suites failed during setup | This shell has no `DATABASE_URL` / `TEST_DATABASE_URL`; no database-backed test body ran |
| Retry with isolated Compose URLs | `npm run test:integration --workspace server` using `regmeup_dev` and `regmeup_test` on `127.0.0.1:55433` | Not run: connection returned `EACCES 127.0.0.1:55433`; 94 tests skipped | The runner cannot access the user's local Docker port; no database test body ran. Execute this command from the user's CMD session where the isolated Compose project is reachable |
| Latest user-local integration output | `npm run test:integration --workspace server` | Not run: all 10 suites failed setup, 94 tests skipped, first connection error `ECONNREFUSED 127.0.0.1:55433` | The configured port had no listener at test time; no assertion or database test body ran. Verify the isolated Compose service is still healthy and publishing that port |
| TypeScript | `npm run typecheck` | Passed | Does not execute database behavior |
| Build | `npm run build` | Passed for client and server | Does not apply migration or execute browser journeys |
| Latest workspace typecheck/build rerun | `npm run typecheck`; `npm run build` | Both passed | Build artifacts are ignored under `dist/` |
| Browser test discovery | `npx playwright test --list` | Listed 62 tests across 7 files, including F-09 | Discovery only; browser tests did not run |
| Guarded PostgreSQL preflight | `verifyTestDatabase` connection to configured local DB | Failed before mutation with `EACCES` connecting to loopback `127.0.0.1:55432` | No migration, integration, API/DB, or race test was run |
| Retry from workspace runner | `npm run db:migrate` against `regmeup_test`, then direct `pg.Client.connect()` preflight | Migration-history check stopped; direct connection returned `EACCES connect EACCES 127.0.0.1:55432` | `prisma migrate deploy` was not reached; no migration/seed ran in this retry, and E2E was not started because its guarded test DB is inaccessible from this runner |
| F-09 Playwright execution attempt | `npx playwright test e2e/f-09.spec.ts` with test-only DB URLs/environment | No test-case PASS/FAIL was reported; Playwright stayed waiting for webServer readiness for over 60 seconds, then was stopped | The runner could not inspect Docker (`docker compose ps -a` failed opening `//./pipe/dockerDesktopLinuxEngine` with `Access is denied`). No migration or seed command was run during this attempt; browser acceptance remains NOT RUN |
| User-local F-09 Playwright run | `npx playwright test e2e/f-09.spec.ts` | 4 passed / 1 failed; owner flow remained on `/login`, while Instructor and three viewport cases passed | The owner login relied on a seeded `o1@example.test` whose old password is intentionally preserved by seed. The E2E fixture now creates unique test-only accounts and hashes per case; local rerun is still required |
| User-local F-09 Playwright rerun | `npx playwright test e2e/f-09.spec.ts` | 4 passed / 1 failed; owner assignment UI selected a seeded Instructor with the same display name instead of the test fixture | Fixture display names are now unique and selection uses the fixture user ID. Rerun still required |
| User-local F-09 Playwright latest run | `npx playwright test e2e/f-09.spec.ts` | Playwright `.last-run.json` reports `passed`; five per-test screenshot artifacts and five matching report entries are present | Evidence confirms the five F-09 browser cases passed. This does not cover API/database integration, migration rehearsal, or concurrency races |
| Updated E2E discovery | `npx playwright test e2e/f-09.spec.ts --list` | 5 cases listed successfully after the fixture fix | Discovery only; the updated E2E has not run here because this workspace cannot connect to PostgreSQL (`EACCES`) |

F-09 has five E2E cases. Its three responsive screenshots are saved as `docs/evidence/e2e/19-f09-instructor-320.png`, `20-f09-instructor-390.png`, and `21-f09-instructor-1440.png`; the owner assignment and Instructor detail screenshots are `22-f09-owner-assignment-history.png` and `23-f09-instructor-teaching-detail.png`. Automatic per-test screenshots, failure traces/videos, and the HTML report are stored under `.playwright-artifacts/` and `.playwright-report/` respectively, isolated from the numbered evidence files.

Environment observed: Node `v24.14.0`, npm `11.9.0`; repository pins Node `22.23.4`, npm `10.9.9`. The current shell has no `nvm`/`nvs` command. Do not interpret any blocked command as a passing test. No database reset, seed, migration apply, or production operation was performed.

## Verification status by acceptance

The latest user-local run passes all five F-09 E2E browser cases, including the owner assignment flow. This is browser acceptance evidence only; it does not complete S2-T09-01 through S2-T09-08. Integration tests, migration rehearsal, concurrent advisory-lock tests, and the full acceptance checklist remain unverified. AC03 has pure interval-predicate evidence and browser assignment history evidence; API status coverage, wrong-role validation, current-only filtering, and race safety still need integration verification. Post-deployment verification and teammate review remain pending.

## Files covered by candidate

Candidate code adds the Instructor role lifecycle, assignment history model/migration, safe owner DTO, schedule overlap helper and shared schedule-lock guarded assignment/removal/time edits, directory and own-teaching APIs, demo/seed fixtures, owner and Instructor frontend routes, and unit/integration/migration/browser test definitions. See `git diff` and the issue #43 implementation branch for the exact file set.

## Commit record

| Commit | Contents | Verification |
|---|---|---|
| Not created | `git add` could not write `.git/index.lock` (`Permission denied`; `.git` is mounted read-only) | User authorized commits, but workspace filesystem permission prevented creating them. All changes remain in the working tree; candidate remains unreviewed until commit, teammate review and staging integration |
