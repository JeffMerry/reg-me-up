# Lab 5 Episode 4 — CI verification

Status: local rehearsal completed on 14 November 2026; actual GitHub Actions run, PR review and required-check enforcement **TBD**. Do not treat local results as proof of a hosted CI run.

## Local rehearsal

- `actionlint` v1.7.12 checked `.github/workflows/ci-docker.yml` successfully after correcting the PostgreSQL port expression. The action SHAs in the workflow were checked against the official action tag references.
- A separate, locally created PostgreSQL 17.11 container/volume used disposable CI-style settings. The app and test databases were created separately; `npm run db:generate`, `npm run db:migrate` and `npm run db:seed` ran for each target as applicable. The existing SQL guard marker was installed only in the test database.
- `npm run test:unit`: **55/55**. `npm run test:integration`: **40/40**. `npx playwright test`: **33/33**, using the isolated test database and a locally installed Chromium headless shell.
- `npm run typecheck` passed; `npm run build` passed with `NODE_ENV=production`. An earlier local test-mode build also passed, but produced a non-production frontend bundle, so the workflow explicitly sets production for the build step.
- These checks ran in a Windows working tree before the workflow implementation commit; they are not an exact-commit GitHub runner result. The temporary PostgreSQL container was stopped and its volume retained. Docker image build was verified separately in [Episode 3](../../sprints/sprint-1/lab5-docker-evidence.md); the new workflow must run its own Docker build on GitHub.

## GitHub Actions

Workflow: [`CI and Docker Build`](../../../.github/workflows/ci-docker.yml); job ID `test-and-docker`. PR/run URL, exact tested GitHub SHA, result and test summary: **TBD — record only after the actual run**. CI on a PR to `main`, reusable `workflow_call`, required-check configuration and failing-gate proof remain separate checks. No cloud deployment was performed.
