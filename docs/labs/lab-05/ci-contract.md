# Lab 5 Episode 4 — PR CI contract and test design

Status: workflow implemented on the Episode 4 branch; no passing GitHub Actions run or enforced required check is claimed by this document. The initial design was committed before implementation.

## Contract

- A GitHub Actions workflow runs for pull requests targeting `lab5-staging` or `main`, supports manual dispatch and `workflow_call`, and uses a stable job ID `test-and-docker`. It does not deploy or modify GCP/IAM.
- The job uses a temporary PostgreSQL 17.11 service and creates separate `regmeup_dev` and `regmeup_test` databases. It uses only disposable CI fixtures, runs the project's migration history guard and migrations, seeds each DB explicitly, and installs the existing test-only marker after the test migration. It never connects to an existing application/cloud DB.
- Install with `npm ci` and the pinned Node version. Run unit and integration tests, typecheck, build, Playwright browser tests against the isolated DB, and `docker build` without publishing an image. Fail the job on any failure; do not silently skip required tests.
- Pin external actions to full commit SHAs. Minimize GitHub token permissions; mask test DB URLs in logs. No actual application secrets or cloud credentials are used.
- `deploy/` scripts do not exist in the current repository; no invented deploy-script check. When adopted in a later episode, add their real offline checks to CI.

## Test design and evidence

1. Validate workflow syntax, branches, job name, permissions and commands before pushing; run the same application checks locally using an explicitly isolated DB where possible.
2. Open a PR into `lab5-staging`, observe the actual GitHub Actions run at its tested commit, and record pass/fail, test counts and run link. An unexecuted workflow is not a passing check.
3. CI on PRs into `main`, `workflow_call`, and actual enforcement of required checks must be verified separately in the relevant release/quality-gate episode; do not claim C-01/C-02 complete without their evidence.
