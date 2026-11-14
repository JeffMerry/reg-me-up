# Lab 5 Episode 3 — local Docker verification

Verification date: 2026-11-14. This is a local Docker check, not a Cloud Run deployment or teammate review.

- Built the root Dockerfile and started an isolated Compose project, `regmeup-lab5-ep3-check-1411`, using host ports 5175 and 55433 and its own named PostgreSQL volume.
- The one-shot migration completed successfully and the app and PostgreSQL health checks passed. Explicitly ran the synthetic seed with development mode against this isolated database.
- HTTP checks passed for `/api/health`, `/api/ready`, a SPA route and a missing API route. An Organizer logged in using synthetic credentials, then created an event through the API.
- Stopped and restarted the app and PostgreSQL without deleting the volume. The API-created event was still readable. Rebuilt the final image with the revised `.dockerignore`, repeated the event retrieval, login and creation checks, and confirmed `/app/server/.env`, `/app/.git` and `/app/.toolchain` were absent from that image.
- The first image build reported missing OpenSSL support; installed OpenSSL in the image and rebuilt successfully. The first image-exclusion check showed `.toolchain` had been included because of an exception in `.dockerignore`; removed the exception and verified the rebuilt image.
- The isolated test app and database containers were stopped after verification; their test volume was retained. No cloud resources, real credentials or user database were used.

Browser interaction, Cloud Run, production HTTPS and cloud database behavior were not tested in this check. Local automated test results are reported separately in the PR.
