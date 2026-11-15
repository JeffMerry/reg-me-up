#!/usr/bin/env bash
# First deployment only; prerequisites must be prepared and approved by humans.
set -euo pipefail
DRY_RUN="${DRY_RUN:-1}"
[[ "$DRY_RUN" == 0 || "$DRY_RUN" == 1 ]] || { echo 'DRY_RUN must be 0 or 1' >&2; exit 1; }
for key in PROJECT_ID REGION REGISTRY_REPOSITORY SQL_CONNECTION RUNTIME_SERVICE_ACCOUNT DATABASE_SECRET_VERSION SESSION_SECRET_VERSION; do
  [[ -n "${!key:-}" && "${!key}" != *TBD* && "${!key}" != *'<'* ]] || { echo "Set $key explicitly" >&2; exit 1; }
done
[[ "$PROJECT_ID" =~ ^[a-z][a-z0-9-]{4,28}[a-z0-9]$ && "$REGION" =~ ^[a-z]+-[a-z]+[0-9]+$ ]] || { echo 'Invalid project or region' >&2; exit 1; }
[[ "$REGISTRY_REPOSITORY" =~ ^[a-z][a-z0-9-]*$ ]] || exit 1
[[ "$SQL_CONNECTION" =~ ^${PROJECT_ID}:${REGION}:[a-z][a-z0-9-]*$ ]] || { echo 'SQL connection must match project and region' >&2; exit 1; }
[[ "$RUNTIME_SERVICE_ACCOUNT" =~ ^[a-z][a-z0-9-]*@${PROJECT_ID}\.iam\.gserviceaccount\.com$ ]] || exit 1
for ref in "$DATABASE_SECRET_VERSION" "$SESSION_SECRET_VERSION"; do
  [[ "$ref" =~ ^[A-Za-z0-9_-]+:[1-9][0-9]*$ ]] || { echo 'Use explicit secret name:numeric-version references' >&2; exit 1; }
done
SERVICE_NAME="${SERVICE_NAME:-regmeup}"
MIGRATION_JOB_NAME="${MIGRATION_JOB_NAME:-regmeup-migrate}"
for name in "$SERVICE_NAME" "$MIGRATION_JOB_NAME"; do [[ "$name" =~ ^[a-z][a-z0-9-]*$ ]] || exit 1; done
SHA="$(git rev-parse HEAD)"
[[ "$SHA" =~ ^[0-9a-f]{40}$ ]] || exit 1
if [[ "$DRY_RUN" == 0 ]]; then
  [[ "${CONFIRM_GCP_MUTATION:-}" == "$PROJECT_ID" ]] || { echo 'Explicit project confirmation required' >&2; exit 1; }
  [[ "$(git branch --show-current)" == main && -z "$(git status --porcelain)" && "$SHA" == "$(git rev-parse origin/main)" ]] || { echo 'Use a clean reviewed main checkout matching freshly fetched origin/main' >&2; exit 1; }
fi
run() { printf '+ '; printf '%q ' "$@"; printf '\n'; if [[ "$DRY_RUN" == 0 ]]; then "$@"; fi; }
image="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REGISTRY_REPOSITORY}/${SERVICE_NAME}"
run gcloud builds submit --tag "$image:$SHA" --project "$PROJECT_ID" .
if [[ "$DRY_RUN" == 1 ]]; then
  printf '+ resolve image digest for %s\n' "$image:$SHA"
  digest="sha256:$(printf '0%.0s' {1..64})"
else
  digest="$(gcloud artifacts docker images describe "$image:$SHA" --project "$PROJECT_ID" --format='value(image_summary.digest)')"
fi
[[ "$digest" =~ ^sha256:[0-9a-f]{64}$ ]] || { echo 'Invalid image digest' >&2; exit 1; }
immutable="$image@$digest"
run gcloud run jobs deploy "$MIGRATION_JOB_NAME" --project "$PROJECT_ID" --region "$REGION" --image "$immutable" --service-account "$RUNTIME_SERVICE_ACCOUNT" --set-cloudsql-instances "$SQL_CONNECTION" --set-secrets "DATABASE_URL=$DATABASE_SECRET_VERSION" --set-env-vars NODE_ENV=production --command npm --args run,db:migrate --max-retries 0 --task-timeout 300s
run gcloud run jobs execute "$MIGRATION_JOB_NAME" --project "$PROJECT_ID" --region "$REGION" --wait
# Failures above stop before the service changes; no automatic seed.
run gcloud run deploy "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --image "$immutable" --service-account "$RUNTIME_SERVICE_ACCOUNT" --set-cloudsql-instances "$SQL_CONNECTION" --set-secrets "DATABASE_URL=$DATABASE_SECRET_VERSION,SESSION_SECRET=$SESSION_SECRET_VERSION" --set-env-vars NODE_ENV=production,TRUST_PROXY_HOPS=1,APP_ORIGIN=https://bootstrap.invalid --port 3000 --min-instances 0 --max-instances 3 --memory 512Mi --cpu 1 --allow-unauthenticated
if [[ "$DRY_RUN" == 1 ]]; then
  url="https://regmeup-preview.invalid"
else
  url="$(gcloud run services describe "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)')"
fi
[[ "$url" =~ ^https://[a-zA-Z0-9.-]+$ ]] || { echo 'Unexpected service URL' >&2; exit 1; }
run gcloud run services update "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --update-env-vars "APP_ORIGIN=$url"
printf 'Plan finished (DRY_RUN=%s); commit=%s image=%s URL=%s\n' "$DRY_RUN" "$SHA" "$immutable" "$url"
echo 'Verify readiness, revision/traffic and domain workflow; no success is claimed by this script.'
