# Lab 5 Episode 2 — Cloud readiness contract and test design

Status: proposed for teammate review; tests and cloud deployment not yet evidenced here.

## Scope and expected behavior

- Keep `/api/health` unchanged and add `/api/ready` with the same database check: 200 `{"status":"ok"}` when available, 503 `{"status":"unavailable"}` otherwise; do not expose database errors.
- Default to not trusting forwarded headers. `TRUST_PROXY_HOPS=1` opts into trusting one immediate reverse proxy only in production; reject other values or use outside production. Only enable where direct access to the container is restricted and the trusted proxy controls forwarded protocol headers. Production session cookies remain Secure, HttpOnly and SameSite=Lax.
- Keep the existing synthetic seed forbidden in production. A separate, explicitly invoked provisioning command is limited to a dedicated lab/demo database and creates one fixed Participant and one fixed Organizer using distinct operator-supplied secrets. It must check an explicit enable flag and the connected database name, reject invalid input, and never print secrets. Existing matching accounts remain unchanged; ID, email or role conflicts fail the transaction. This change does not create cloud accounts or execute cloud mutations.
- Document runtime, local/test-only and optional development variables in `.env.example`; no real secrets.

## Test design

1. Check both health paths return 200 and 503 with safe bodies when the injected database check succeeds/fails.
2. Check proxy configuration defaults off, allows the documented production opt-in, and rejects invalid or non-production opt-in values.
3. Against the verified isolated PostgreSQL test database, simulate HTTPS termination at the configured proxy: bootstrap CSRF, verify Secure/HttpOnly cookie, log in, access current identity, and log out. Check plain HTTP without forwarded HTTPS does not receive a secure cookie. Clean up only test-created sessions/users.
4. Run unit and integration tests, typecheck and build; record actual results separately from this design. Real Cloud Run, real HTTPS, multi-instance behavior and cloud database connectivity remain unverified until deployed.
5. In a verified isolated test database with random fixture identities, create both roles; verify separate Argon2 hashes and matching passwords; run again with different passwords and verify existing rows remain unchanged; verify collision and database-name mismatch create no partial accounts. Test missing opt-in, weak/equal secrets and malformed settings without logging secret values. Delete only fixture IDs created for the test.
