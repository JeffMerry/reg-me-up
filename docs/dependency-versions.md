# RegMeUp — Dependency version baseline

Version 0.1 — 2026-11-06 (Asia/Bangkok). **Selected targets for SYS-01; not installed or build-tested.** This is planning/metadata evidence, not a lockfile, vulnerability audit or integration result. Human review pending.

## 1. Runtime and database

| Component | Selected exact version | Evidence / reason |
|---|---|---|
| Node.js | 22.23.4 LTS (Jod) | Official Node distribution index and release page; retains the installed Node22 major while selecting its current patched release |
| npm | 10.9.9 | Bundled with selected Node22 distribution; package engine accepts Node ^18.17.0 or >=20.5.0, including target runtime |
| PostgreSQL | 17.11 | Official versioning table lists supported17/current minor17.11; use same engine/version for local and integration test DB |

Observed on this machine: Node22.15.0 and npm11.5.2. Selected versions **are not those installed versions**. `psql` was not found through PATH during inspection; this does not prove no PostgreSQL installation/server exists. Upgrade/provisioning and teammate environment verification belong to foundation implementation, not this documentation task.

Provision local PostgreSQL17.11 with separate application/test databases and roles; native Windows installation or an existing team-managed matching instance is acceptable after documenting actual setup. No app-container/cloud provisioning is required for this step. No DB installation/start/reset has been performed.

Sources: [official Node22.23.4 release](https://nodejs.org/en/blog/release/v22.23.4), [Node distribution index](https://nodejs.org/dist/index.json), [PostgreSQL supported versions](https://www.postgresql.org/support/versioning/).

## 2. Exact direct dependency targets

Versions/engines/peer ranges were read from the authoritative npm registry on 6 November 2026. Preserve exact versions in package manifests when foundation starts; commit a generated workspace lockfile after actual resolution. Do not use unbounded latest or floating caret/tilde ranges for these baseline direct dependencies.

| Area | Package | Version |
|---|---|---|
| Client runtime | react | 19.3.1 |
| Client runtime | react-dom | 19.3.1 |
| Client build | vite | 8.3.6 |
| Client build | @vitejs/plugin-react | 6.2.1 |
| Shared compiler | typescript | 7.0.2 |
| Client styling | tailwindcss | 4.3.5 |
| Client styling | @tailwindcss/vite | 4.3.5 |
| Server runtime | express | 5.3.0 |
| Server runtime | pg | 8.23.1 |
| Auth dependency prepared for F-01 | express-session | 1.19.0 |
| Auth dependency prepared for F-01 | connect-pg-simple | 10.0.0 |
| Auth dependency prepared for F-01 | argon2 | 0.45.2 |
| Test tooling | vitest | 5.1.0 |
| Test tooling | @playwright/test | 1.65.0 |
| Server/script development | tsx | 4.23.15 |
| Type declarations for Node22 | @types/node | 22.20.5 |
| Type declarations | @types/react | 19.3.0 |
| Type declarations | @types/react-dom | 19.3.0 |
| Type declarations | @types/express | 5.0.6 |
| Type declarations | @types/pg | 8.23.1 |
| Type declarations | @types/express-session | 1.19.0 |
| Type declarations | @types/connect-pg-simple | 7.0.3 |

Metadata endpoints use `https://registry.npmjs.org/<URL-encoded-package>/<version>`; for example [React](https://registry.npmjs.org/react/19.3.1), [Vite](https://registry.npmjs.org/vite/8.3.6), [Vitest](https://registry.npmjs.org/vitest/5.1.0), [React plugin](https://registry.npmjs.org/@vitejs%2Fplugin-react/6.2.1), [npm](https://registry.npmjs.org/npm/10.9.9). Current `@types/node` global latest targets a different major; selected22.20.5 was obtained from the published22.x versions to match Node22.

## 3. Compatibility boundary

Metadata inspection supports the target: Vite/plugin-react engines accept Node>=22.12; plugin-react peers Vite8; Tailwind Vite plugin peers include Vite8; Vitest5.1 engines include Node22>=22.12 and peer Vite8; React DOM19.3.1 peers React^19.3.1; Express5/pg8/session-store/Playwright/tsx engines include selected Node22.

The React plugin's oxc-transform-react, Babel integration and React compiler peers are **optional**, not automatically required project dependencies. Do not install a latest optional peer blindly: observed latest oxc0.157.0 is outside the plugin's declared `>=0.152.0 <0.157.0` optional range. Use the documented default setup; if an optional compiler path is needed, select a compatible version and revise this baseline before its implementation.

No install, peer resolution, TypeScript/native Argon2 build, browser download or application test has occurred. Foundation must verify actual dependency resolution, typecheck/build and the Windows/teammate environment. Any resolution failure requires a small documented version correction before continuing, not a claim that metadata inspection proves runtime compatibility. Transitive versions/integrities are established only by the future lockfile.

## 4. Implementation handoff

Use root npm workspaces for client/server with shared tooling and one lockfile. Foundation creates runtime version files/engines/packageManager declaration matching the table, actual install scripts, appropriate project tsconfigs and Tailwind/Vite integration. Auth packages can be pinned/prepared without implementing login/logout in SYS-01. Native crypto and browser/toolchain checks must be recorded separately from feature acceptance results.

This resolves ENG-01's **version selection** portion; actual environment provisioning, install/lockfile and compatible builds remain NOT RUN. [SYS-01 contract](sprints/sprint-1/sys-01.md) defines the bounded foundation acceptance and test design; full TEST-13 remains a release-level reproducibility check.

| Version | Date | Change | Review |
|---|---|---|---|
| 0.1 | 2026-11-06 | Selected runtime/database/direct versions from official metadata; documented observed local mismatch and pending executable validation | Pending THN4 review; no install/build/tests |
