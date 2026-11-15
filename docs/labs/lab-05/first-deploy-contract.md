# Episode 5 — first deployment contract and test design

Status at initial design commit: design before implementation; project, region, resources and actual cloud execution were unconfirmed. Subsequent operator-confirmed setup and release-workflow results are recorded in [first-deploy setup](first-deploy-setup.md) and [deployment.md](deployment.md). This contract describes the separate `deploy/deploy.sh` helper; it remains unexecuted and is not the routine release path.

- Deploy a reviewed `main` commit using the root image. Default to `DRY_RUN=1`, without invoking gcloud or accessing secrets. Execution requires `DRY_RUN=0`, explicit project confirmation, a clean `main` checkout matching `origin/main`, and operator review of the commands.
- Require explicit project/region and existing registry, Cloud SQL connection, runtime service account, and secret-version references. Do not create or modify billing/IAM/database users/secrets in this script. Their provisioning needs separate human approval and setup.
- Build a full-SHA image, resolve its registry digest, run a separate migration job with `npm run db:migrate`, then deploy the same digest only if migration succeeds. Do not seed automatically.
- Cloud Run supplies PORT; use production secure cookies and the reviewed single-proxy setting. On first creation use a reserved invalid bootstrap origin, then obtain the service URL and set the exact APP_ORIGIN before claiming readiness.
- Public access is an explicit operator-approved deployment setting. Cloud SQL socket connectivity, runtime IAM, first deploy, demo provisioning and public journeys remain untested until execution.

Tests: bash syntax; offline command-plan checks with no gcloud installed; invalid input rejection; stubbed gcloud checks for migration failure stopping service deploy, digest pinning and exact origin update. Add real offline tests to CI when scripts exist. Record actual results, without claiming cloud success from stub tests.
