# Episode 5 — first-deploy preparation

Status updated November 15, 2026: the user created the GCP prerequisites. The helper script `deploy/deploy.sh` was successfully run against GCP on November 14, 2026, using repository commit [`b3e2f32`](https://github.com/JeffMerry/reg-me-up/commit/b3e2f32d518780a0121f5e03146e01dc7031e35c); this was the manual first-deployment path. A separate first release through GitHub Actions `Deploy demo` was later deployed from `main` at commit `1dbfca0e625caf92bf0599af49d5ec1880f028e3`, and its migration, readiness, and smoke checks passed. The manual helper run and the later pipeline release are distinct deployment records. See the resources and release results in [deployment.md](deployment.md), [PR #31](https://github.com/JeffMerry/reg-me-up/pull/31), [Issue #21](https://github.com/JeffMerry/reg-me-up/issues/21), and [Issue #24](https://github.com/JeffMerry/reg-me-up/issues/24). Persistent Console screenshots and captions are linked in [evidence-index.md](evidence-index.md); include them in the separately assembled PDF if required. No secret values were read or recorded.

## Before using the script

The resources listed in the [inventory in deployment.md §5](deployment.md#5-gcp-project-and-resources) already exist. If you use the script for a dry run or an experiment separate from the pipeline, check the current Console values first; do not create duplicate resources. A team member must review and approve billing, IAM, and database changes. `deploy/deploy.sh` does not provision these resources.

The release workflow uses `regmeup-migrate` and Cloud Run service `regmeup`. The migration, readiness, and API smoke checks passed, confirming that the deployed application can connect to the database. The helper script is a separate manual deployment path; it was successfully executed against GCP on November 14, 2026, at commit `b3e2f32`. The later GitHub Actions release is recorded separately in [deployment.md §6](deployment.md#6-release-procedure-and-currently-running-commit). Do not copy connection strings or passwords into Git or chat. Demo-account provisioning is a separate one-time Cloud Run Job execution; its successful execution and login verification are recorded in [deployment.md §4](deployment.md#4-database-migrations-and-seeding). The exact numeric secret versions used for that job were not recorded.

## Dry run (Bash from the repository root)

1. Run from the repository root in Git Bash or Cloud Shell. Review `deploy/config.env.example`, then copy it to an ignored local file such as `deploy/.env`. Fill in only non-secret values; secret references use a name and numeric version, not secret values.
2. Check values against the actual GCP project, especially `REGION`, `SQL_CONNECTION`, the runtime account, and numeric secret versions. Some example values were confirmed by the user but must be checked again before running.
3. Run `set -a; source deploy/.env; set +a`, then `DRY_RUN=1 bash deploy/deploy.sh`. The dry run prints a command plan and does not call `gcloud`. Any digest or URL shown in this mode is only a placeholder.
4. Have a teammate review the script/plan in a PR to `lab5-staging`, followed by a release PR to `main` with CI passing, before using it against GCP.

Example commands from the repository root (Bash). `deploy/.env` contains only resource names and secret references, never secret values:

```bash
cp deploy/config.env.example deploy/.env
set -a
source deploy/.env
set +a
DRY_RUN=1 bash deploy/deploy.sh
```

A dry run is allowed on a work branch. Execution requires a peer-reviewed PR into `lab5-staging`, followed by a release PR into `main`. Do not change the guard to deploy from an unreviewed branch.

## Manual first-deployment execution record

This records the helper script only; **it is not the current release procedure**. On November 14, 2026, `deploy/deploy.sh` was successfully executed against GCP from commit [`b3e2f32`](https://github.com/JeffMerry/reg-me-up/commit/b3e2f32d518780a0121f5e03146e01dc7031e35c). This was the manual first-deployment path. The separate pipeline release from `main` occurred later through GitHub Actions and is documented in [deployment.md §6](deployment.md#6-release-procedure-and-currently-running-commit). The helper requires Bash, Git, and `gcloud`; for any future use, the operator must check the account, project, billing, and resources and review the commands before running them. The script requires `DRY_RUN=0` and `CONFIRM_GCP_MUTATION` to match the Project ID.

The helper sequence is: Cloud Build pushes an image tagged with the full commit SHA → resolve the registry digest → use `npm run db:migrate` in the migration job → execute and wait for the job → deploy the service with the same digest → read the URL and update `APP_ORIGIN` to match. The helper completed successfully in the manual GCP execution recorded above. Routine releases use the GitHub Actions workflow, not this helper. Bootstrapping the origin can temporarily prevent login, so this helper is intended for first-deployment setup rather than routine releases.

The script sets public access and scaling min=0/max=3 with secret references. The team must approve these settings before use. Afterward, verify health/readiness, image/revision/traffic, and the C-04 user journey (Organizer publishes → Participant registers → an invalid/unauthorized case). A successful script exit alone does not mean the deployment passed.

## Local-only verification results

- Rechecked November 14, 2026, on a working tree based on `a05833c` before this change set was committed: Bash syntax passed, offline tests passed 4/4, and a dry run using the resource references in `deploy/config.env.example` passed without calling GCP. The SHA printed by the dry run was the current HEAD at that time; it is not evidence that an image for that SHA was built or deployed.
- Bash syntax passed; `python -m unittest discover -s deploy/tests -p 'test_*.py'` passed 4/4 after test stubs were adjusted for Git Bash on Windows.
- Tests use fake `git`/`gcloud` commands only: dry run does not call Cloud, a TBD region is rejected, migration failure stops service deployment, and the script uses the image digest and adjusts the origin to the returned URL.
- Starting Git Bash in the sandbox was blocked on the first attempt, so it was rerun with permission outside the sandbox. This was not a GCP test.
- Offline deployment-script checks are included in `ci-docker.yml`, and the test job passed on the release commit. In addition, the helper was successfully executed against GCP on November 14, 2026, from commit `b3e2f32`; this manual deployment is distinct from the later `Deploy demo` pipeline release.

Command references: [gcloud run jobs deploy](https://docs.cloud.google.com/sdk/gcloud/reference/run/jobs/deploy), [gcloud run deploy](https://docs.cloud.google.com/sdk/gcloud/reference/run/deploy). This document records the helper for first-deploy preparation; routine deployment currently uses the Episode 7 workflow in `deployment.md` §6.
