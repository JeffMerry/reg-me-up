# Lab 5 Episode 3 — Docker contract and test design

Status: design for teammate review. No deployment or test result is claimed here.

## Contract

- A root multi-stage Dockerfile builds the npm workspaces and runs the built frontend and Express API on one `PORT`, listening on all interfaces. SPA routes fall back to the frontend, but unknown `/api` routes never return the frontend.
- Preserve the existing PostgreSQL Compose service and named volume. A separate opt-in Compose profile starts a one-shot migration using the existing migration-history guard, then the app. Seeding is an explicit separate operation; never run a production or demo seed automatically.
- The app and migration use runtime environment settings, no real secrets in the image or repository. The local container setup uses development mode for HTTP cookies; production HTTPS proxy settings remain opt-in and require a trusted deployment.
- Database data persists across container restarts. Never delete existing named volumes or reset an existing database during development or verification.
- The runtime image contains the Prisma config, migrations, generated client and tooling necessary for the reviewed migration and explicit seed commands; generated code and local dependencies are not copied from the host.

## Test design

1. Build the image from a clean Docker context; verify local secrets, `.git` and `node_modules` are excluded.
2. On a uniquely named isolated Compose project and volume, apply migrations, start the app, explicitly seed synthetic local data, and verify readiness, SPA navigation and API 404 behavior.
3. Login as synthetic Organizer, publish an event through the API with the session and CSRF token, restart the app/database without removing the volume, and verify the same event can be retrieved. Clean up only uniquely identified test records or explicitly named test containers; do not remove persistent volumes automatically.
4. Run relevant application tests, typecheck and build. Cloud Run, actual HTTPS, cloud migration and deployment remain separate checks.
