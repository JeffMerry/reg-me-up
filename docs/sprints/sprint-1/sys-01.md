# SYS-01 — Local project foundation: implementation preparation

Version 0.6 — 2026-11-11 (Asia/Bangkok)

**State: FOUNDATION IMPLEMENTATION IN PROGRESS; PARTIAL CHECKS RUN.** PR #2 was approved by THN4 at commit `2e07ba7` and merged into staging as `7cd640e` on 11 November 2026. The [verification record](sys-01-evidence.md) distinguishes actual local results from unexecuted acceptance cases.

| Item | Plan / current fact |
|---|---|
| Requirement | NFR-05, supports NFR-02 and F-01–04 shared schema; AC-13/TEST-13 full fresh-setup target |
| Sources | [SDS](../../system-sds.md), [Sprint 1 DBML](../../data-model/sprint-1.dbml), [versions](../../dependency-versions.md), [branch plan](branch-plan.md), [STS](sts.md), [DoD](dod.md) |
| Intended implementation branch | `chore/sys-01-foundation` from reviewed/current sprint/01-staging after documentation PR merge |
| Implementation PR target | sprint/01-staging; peer approval before merge |
| Lead / reviewer | JeffMerry assigned lead; THN4 designated design reviewer through documentation PR; no approval claimed |
| GitHub Issue / documentation PR | [SYS-01 Issue #1](https://github.com/JeffMerry/reg-me-up/issues/1); documentation PR link is maintained in that Issue after publication |
| Version selection | Node22.23.4 / npm10.9.9 / PostgreSQL17.11; Prisma 7.10.1 and other targets in versions document; local install/build and PostgreSQL 17.11 checks recorded, teammate validation pending |

## 1. Bounded scope

Prepare a reproducible development foundation before F-01 implementation: root npm workspaces/client/server, TypeScript/Vite/Tailwind setup with UI baseline tokens, Express process skeleton, validated environment loading, Prisma Client with PostgreSQL adapter/pool lifecycle, Prisma schema and Prisma Migrate, shared initial domain/session schema, deterministic synthetic seed and test runner boundaries. Establish commands and a README that a teammate can follow.

Foundation may introduce shared schema required by all Sprint1 features: users/sessions, events, registrations and constraints/indexes described by SDS. It does not implement auth endpoints, event publication/discovery, registration transactions, owner-list API or domain screens. No self-signup, Instructor/cancellation/deadline/attendance/report behavior. No cloud/app Docker/CI deliverable or fabricated full-product acceptance.

## 2. Work packages and ownership

| Package | Planned deliverables |
|---|---|
| Runtime/toolchain | Pin [selected versions](../../dependency-versions.md), root workspaces/lockfile, version/engine checks, development/build/typecheck commands and ESM-consistent TS config |
| Client/server skeleton | Vite React entry with Tailwind baseline tokens; Express start/stop and minimal health response, no private/domain data; dev same-origin API proxy and static-build hosting plan |
| Configuration | Safe `.env.example` variable names from SDS; ignored real `.env`/build/dependency artifacts; fail clearly on missing config without echoing connection strings/session secrets |
| Shared schema | Prisma schema and a single Prisma Migrate history for users+adapter-required sessions → events → registrations/indexes; reviewed custom SQL for required PostgreSQL constraints where needed; no application auto-reset/auto-seed |
| Synthetic seed | P1/P2/P3/O1/O2 and empty/partial/full/published/unpublished fixture cases in appropriate isolated data sets; library password hashes; idempotent explicit local/test seed; no real credentials |
| Verification harness | Unit/API integration targets use actual test PostgreSQL; dedicated reset safety guard and deterministic cleanup; Playwright config can be prepared without pretending future domain E2E exists |
| Reproduction | README exact cwd/env/setup/migrate/seed/run/build/test instructions, observed versions/known limitations and tested commit when executed |

`chore/sys-01-foundation` owns the initial Prisma schema and reviewed migrations for users, events, registrations and the session store, including required constraints and indexes. JeffMerry coordinates these migrations; THN4 reviews the Prisma schema/migrations and proposed ownership. Before writing migrations, review the [DBML](../../data-model/sprint-1.dbml); in the SYS-01 PR compare it with `schema.prisma`, generated/custom SQL and the actual session adapter shape, then update the DBML when the model changes. Feature branches add later migrations only after this baseline merges; do not rewrite applied files or create a second competing schema. The logical DBML `sessions` name needs explicit adapter configuration if selected; the library default is `session`. `_prisma_migrations` is managed by Prisma, not a domain table.

## 3. Acceptance criteria and test design

SYS-AC/SYS-TEST IDs below are foundation-specific; they do not replace AC-01–15/TEST-01–15. The [verification record](sys-01-evidence.md) lists actual commands/results and distinguishes remaining cases; no completion is inferred from a planned test.

| AC | Observable acceptance | Planned verification: precondition → action → expected result | Level |
|---|---|---|---|
| SYS-AC-01 | Both members can resolve pinned dependencies with recorded runtime/toolchain and shared lockfile | SYS-TEST-01: selected Node/npm in fresh workspace → install then clean lockfile install/typecheck/build → versions/engines match, no unexplained required-peer conflicts; retain actual output | Fresh environment/toolchain |
| SYS-AC-02 | Client/server skeleton runs with proxy and UI baseline styling; no domain/private claim | SYS-TEST-02: valid local config → start both, request health and open client → successful safe health, client assets styled by Tailwind, no secret config in client bundle; stop cleanly | Process/API + browser smoke |
| SYS-AC-03 | Prisma Migrate establishes the required schema reproducibly and reports migration state safely | SYS-TEST-03: isolated empty PostgreSQL → apply reviewed migrations twice → FK/check/active-unique indexes and session schema exist, second deploy adds nothing; concurrent deploys do not duplicate migration and any lock timeout is reported; project preflight rejects edited/missing applied migrations and unresolved failed migrations before deploy; verify failure and documented recovery without assuming failed SQL is automatically rolled back | Real PostgreSQL integration |
| SYS-AC-04 | Explicit synthetic seed is reproducible without plaintext storage or duplicates | SYS-TEST-04: migrated isolated DB → seed twice → expected stable account/event/registration fixture IDs/counts, positive/time/owner constraints satisfied, salted hashes verify known harness credentials, no plaintext/log secrets; regular startup/restart does not reset/reseed | DB/seed integration |
| SYS-AC-05 | Test cleanup cannot act on the application or arbitrary database | SYS-TEST-05: absent TEST_DATABASE_URL, test/app same target with differently formatted equivalent URLs, non-test DB → request cleanup/reset → refused before writes; valid dedicated test DB → isolated fixtures reset without touching application sentinel | Unit config + two-DB integration |
| SYS-AC-06 | Invalid environment fails safely and initialized processes clean up resources | SYS-TEST-06: missing required server env/unreachable DB → start/operate health → safe failure/non-ready response, no connection string/secret; shutdown releases pool/listeners and restart does not mutate domain data | Unit/process/API |
| SYS-AC-07 | Teammate can reproduce the bounded foundation using README | SYS-TEST-07: THN4 fresh workspace with synthetic setup → documented install/config/migrate/seed/run/build/foundation-check commands → actual expected results and limitations recorded; no F-01–04 PASS invented | Manual fresh setup + automated command output |

Test-reset implementation must compare the effective database target (host/port/database and aliases) and verify an explicit test-only database identity/marker before destructive cleanup, not merely compare raw URL strings. Prisma `migrate dev` may prompt for reset and `migrate reset` destroys data: allow these only on an explicitly verified disposable development/test database, never production or application data. No public HTTP reset/migrate/clock/auth bypass endpoints. Build meaningful tests for schema/config/data protection and migration behavior; avoid placeholder assertions to produce a green report.

Do not treat schema/seed checks as successful registration/auth workflow tests. TEST-13 full-product installation/build/unit/integration/E2E reproducibility is revisited after F-01–04 exist. Foundation PR must disclose unavailable feature tests rather than silently mark them passed or disable them to pass a release gate.

## 4. Planned command interfaces

Implementation establishes root commands for `dev`, `build`, `typecheck`, `db:migrate`, `db:seed`, `test:unit`, `test:integration` and Playwright test entry when cases exist. Choose exact root/workspace invocations in implementation and keep README synchronized. A command is not currently runnable just because listed here. Select and pin compatible Prisma versions before writing behavior and commit lockfile only after actual resolution.

Create meaningful commits: runtime/workspace setup; client/server configuration; migration/seed design tests then implementation; safe test harness; README/verification updates. Keep actual test-design-before-code and intended-behavior red/green evidence where applicable. Feature implementation remains on its own later branch/PR.

## 5. Before implementation and completion gates

- [x] Documentation PR #2 approved by THN4 on 11 November 2026 and merged into sprint/01-staging as `7cd640e`.
- [x] [SYS-01 GitHub Issue #1](https://github.com/JeffMerry/reg-me-up/issues/1) created with scope, seven SYS-AC/test designs, selected versions, assigned JeffMerry lead and designated THN4 reviewer. This is planning evidence only.
- [ ] Teammate reviews schema/migration ownership and environment/cleanup test design before implementation.
- [x] Created `chore/sys-01-foundation` locally from staging commit `7cd640e`; implementation PR is still to be opened and linked to SYS-01 Issue.
- [ ] Actual foundation checks execute with commands/files/commit/counts; disclosed failures/limitations; full Sprint1 results remain NOT RUN until implemented/tested.
- [ ] THN4 reviews implementation PR; merge only after accepted changes/checks, without author self-approval.

## 6. Actual evidence register

| Item | Current state |
|---|---|
| Version metadata / collaborator permission inspection | Read npm/Node/PostgreSQL official metadata and GitHub CLI collaborator permissions on 2026-11-06; THN4 has write/push |
| SYS-01 preparation Issue | [#1](https://github.com/JeffMerry/reg-me-up/issues/1), open and assigned JeffMerry; no implementation completion claimed |
| Runtime/dependency install / DB provisioning | Local Node22.23.4/npm10.9.9 and lockfile install tested; isolated PostgreSQL 17.11 and 18.1 test clusters; see [verification record](sys-01-evidence.md) |
| SYS-TEST-01–07 | PARTIAL — local unit/integration/build/smoke results and outstanding cases are in [verification record](sys-01-evidence.md); no complete acceptance claim |
| Full AC-13 / TEST-13 | NOT RUN |
| Foundation implementation branch / PR / commits | `chore/sys-01-foundation`; implementation PR and final review evidence to be recorded |
| Human design review / approval | THN4 approved PR #2 at `2e07ba7`; implementation PR review remains pending |

| Version | Date | Change | Review |
|---|---|---|---|
| 0.1 | 2026-11-06 | Prepared SYS-01 scope, migration ownership, exact version handoff and seven acceptance/test designs before implementation | Pending teammate review; NOT RUN |
| 0.2 | 2026-11-10 | Switched foundation design to Prisma Client/Migrate and revised migration verification and reset safety; Prisma versions pending | Pending teammate review; NOT RUN |
| 0.3 | 2026-11-10 | Updated foundation source branch and PR base after staging branch rename | Pending teammate review; NOT RUN |
| 0.4 | 2026-11-11 | Assigned initial shared schema to SYS-01 and linked DBML-to-migration review | Pending teammate review; NOT RUN |
| 0.5 | 2026-11-11 | Started foundation implementation and linked actual partial verification | Implementation review and remaining cases pending |
| 0.6 | 2026-11-11 | Added fail-closed migration history preflight after Prisma v7.10.1 did not warn on an edited applied migration in an isolated test | Isolated preflight/failed-migration recovery verified; implementation review pending |
