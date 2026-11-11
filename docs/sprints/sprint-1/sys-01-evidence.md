# SYS-01 — implementation verification record

Date: 11 November 2026 (Asia/Bangkok). These results describe the local foundation working tree on `chore/sys-01-foundation`; record the final tested commit once checks are repeated for the PR candidate. This is not evidence of F-01–04 implementation, teammate approval or full-product TEST-13.

| Area | Actual observation | Remaining boundary |
|---|---|---|
| Toolchain | Workspace-local Node 22.23.4/npm 10.9.9; `npm ci` completed from lockfile, 312 packages audited, zero vulnerabilities reported at execution | Teammate fresh environment SYS-TEST-07 not run; audit is time-specific |
| Build/typecheck | `npm run build` and `npm run typecheck` passed for client/server; Prisma Client 7.10.1 generated | No domain features implemented |
| Unit | `npm run test:unit`: 3 files, 12 tests passed, including config, health and test DB guard | Does not prove every SYS-AC or feature-level rule |
| PostgreSQL | Dedicated local PostgreSQL 18.1 cluster on loopback with isolated app/test DBs; `db:migrate` ran twice (second had no pending migrations), explicit synthetic `db:seed` ran twice | Target 17.11 not tested; no existing PostgreSQL data touched |
| Integration | `npm run test:integration`: 1 file, 9 tests passed, including FK/check/active duplicate, Argon2 fixture, health and DB target/marker safeguards | SYS-TEST-03 failed migration recovery and SYS-TEST-05 cleanup/sentinel cases not yet executed; no automatic reset command exists |
| Migration contention/history | Two concurrent Prisma 7.10.1 deploys against an empty isolated DB completed; one initial migration record. In another isolated DB, changing a copied applied SQL file changed its SHA-256 checksum, but direct `prisma migrate deploy` returned 0 without a modified-migration warning | Differs from the Prisma v7 documentation's warning description; fail-closed project preflight is designed and must be tested before relying on `db:migrate` |
| Process smoke | Built server returned health 200 against isolated DB; built Vite preview returned HTML on localhost | Browser rendering/keyboard/UI baseline and unavailable real DB process test not executed |
| DBML comparison | User, event, registration and session fields/relations compared with Prisma schema and initial SQL. DBML is conceptual: conditional uniqueness/checks are notes; actual SQL explicitly creates checks and partial unique index. `sessions` is configured as the intended adapter table name; adapter default is `session`. `_prisma_migrations` remains Prisma-managed | DBML parser not run; future SYS-01 PR review must verify actual adapter use and schema changes |
| Security boundary | No reset endpoint or automated reset command provided; integration suite queries both effective database identities and requires an explicit test-only marker before executing its DB cases | No claim that this guard authorizes cleanup across different server endpoints; unknown/different endpoints fail closed |

All SYS-AC/SYS-TEST results that require the exact PostgreSQL 17.11 environment, teammate reproduction, or unexecuted migration/cleanup scenarios remain pending. Do not mark SYS-01 complete until outstanding checks and THN4's actual PR review are recorded.
