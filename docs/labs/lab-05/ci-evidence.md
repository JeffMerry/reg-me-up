# Lab 5 Episode 4 — CI verification

Status: updated 15 November 2026. Local rehearsal and hosted PR checks are separate evidence. Release PR #31 into `main` received teammate approval and CI passed; the deploy workflow also ran its reusable test job successfully on the first release. Manual redeploy with an existing `image_tag` skips the test job by workflow design, so that run is deployment/smoke-test evidence, not a new CI result.

## Local rehearsal

- `actionlint` v1.7.12 checked `.github/workflows/ci-docker.yml` successfully after correcting the PostgreSQL port expression. The action SHAs in the workflow were checked against the official action tag references.
- A separate, locally created PostgreSQL 17.11 container/volume used disposable CI-style settings. The app and test databases were created separately; `npm run db:generate`, `npm run db:migrate` and `npm run db:seed` ran for each target as applicable. The existing SQL guard marker was installed only in the test database.
- `npm run test:unit`: **55/55**. `npm run test:integration`: **40/40**. `npx playwright test`: **33/33**, using the isolated test database and a locally installed Chromium headless shell.
- `npm run typecheck` passed; `npm run build` passed with `NODE_ENV=production`. An earlier local test-mode build also passed, but produced a non-production frontend bundle, so the workflow explicitly sets production for the build step.
- These checks ran in a Windows working tree before the workflow implementation commit; they are not an exact-commit GitHub runner result. The temporary PostgreSQL container was stopped and its volume retained. Docker image build was also verified separately in [Episode 3](lab5-docker-evidence.md).

## GitHub Actions

Workflow: [`CI and Docker Build`](../../../.github/workflows/ci-docker.yml); job ID `test-and-docker`. [PR #26](https://github.com/JeffMerry/reg-me-up/pull/26) → [Actions run 43593623092](https://github.com/JeffMerry/reg-me-up/actions/runs/43593623092) completed **success**: unit **55/55**, integration **40/40**, Playwright **33/33**, typecheck, production build and Docker build passed.

The first run's PR head was `b95a3df9e3bd94a578d1148ca4c28b450908aaac`; checkout logs show GitHub's test merge commit `db0bb5e393a22fb57aa620352fca2cbd7f51f6a9` was actually checked out.

[Actions run 43594158681](https://github.com/JeffMerry/reg-me-up/actions/runs/43594158681) also completed **success**: unit **55/55**, integration **40/40**, Playwright **33/33**, typecheck, production build and Docker build passed. Its PR head was `49338a9c05a5cb84e10f48c4fb747656224a5b19`; checkout logs show test merge commit `0cedccf5d4a747e391423df82ce4b5d0e12cd004`.

## Release PR and main verification

[Release PR #31](https://github.com/JeffMerry/reg-me-up/pull/31) from `lab5-staging` to `main` received teammate approval; the reviewer confirmed its CI passed before merge. The PR CI run [43695261394](https://github.com/JeffMerry/reg-me-up/actions/runs/43695261394) completed successfully for head SHA `951f10a948e31267bf5199ac88d488c92aa6cf49`. After merge, the `Deploy demo` workflow's `test` and `deploy` jobs also succeeded for release commit `1dbfca0e625caf92bf0599af49d5ec1880f028e3`. The test summary reported the unit, integration, Playwright, typecheck, production build and Docker build checks. See [deployment Actions run #1](https://github.com/JeffMerry/reg-me-up/actions/runs/43695641451).

`Deploy demo #2` was manually triggered on `main` with the existing full commit SHA to exercise same-image redeployment for C-05. See [Actions run #2](https://github.com/JeffMerry/reg-me-up/actions/runs/43700433429). The workflow intentionally skipped `test` and migration for this input; `deploy` and all four public smoke checks passed. Do not count this manual redeploy as a new passing CI run for C-01.
