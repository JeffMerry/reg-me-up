# Lab 5 Episode 4 — CI verification

Status: local rehearsal and one GitHub Actions run completed on 14 November 2026; teammate review and required-check enforcement **TBD**. Local results are separate from hosted CI evidence.

## Local rehearsal

- `actionlint` v1.7.12 checked `.github/workflows/ci-docker.yml` successfully after correcting the PostgreSQL port expression. The action SHAs in the workflow were checked against the official action tag references.
- A separate, locally created PostgreSQL 17.11 container/volume used disposable CI-style settings. The app and test databases were created separately; `npm run db:generate`, `npm run db:migrate` and `npm run db:seed` ran for each target as applicable. The existing SQL guard marker was installed only in the test database.
- `npm run test:unit`: **55/55**. `npm run test:integration`: **40/40**. `npx playwright test`: **33/33**, using the isolated test database and a locally installed Chromium headless shell.
- `npm run typecheck` passed; `npm run build` passed with `NODE_ENV=production`. An earlier local test-mode build also passed, but produced a non-production frontend bundle, so the workflow explicitly sets production for the build step.
- These checks ran in a Windows working tree before the workflow implementation commit; they are not an exact-commit GitHub runner result. The temporary PostgreSQL container was stopped and its volume retained. Docker image build was verified separately in [Episode 3](../../sprints/sprint-1/lab5-docker-evidence.md); the new workflow must run its own Docker build on GitHub.

## GitHub Actions

Workflow: [`CI and Docker Build`](../../../.github/workflows/ci-docker.yml); job ID `test-and-docker`. [PR #26](https://github.com/JeffMerry/reg-me-up/pull/26) → [Actions run 43593623092](https://github.com/JeffMerry/reg-me-up/actions/runs/43593623092) completed **success**: unit **55/55**, integration **40/40**, Playwright **33/33**, typecheck, production build and Docker build passed.

The run's PR head was `b95a3df9e3bd94a578d1148ca4c28b450908aaac`; checkout logs show GitHub's test merge commit `db0bb5e393a22fb57aa620352fca2cbd7f51f6a9` was actually checked out. This evidence belongs to that run; later commits require their own run. CI on a PR to `main`, reusable `workflow_call`, required-check configuration and failing-gate proof remain separate checks. No cloud deployment was performed.
