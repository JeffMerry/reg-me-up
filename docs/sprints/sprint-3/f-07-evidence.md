# F07 check-in execution evidence — 27 November 2026

Refs #44/#45. Owner/implementer/tester JeffMerry; peer reviewer THN4. Branch `feature/f-07-check-in` → `sprint/02-staging`, starting at `3a22a71d936f3aa52ad6d6d3e1a30e95467fc9c7` after Sprint2 gap PR #68. **Implemented and locally tested; implementation review/staging acceptance/main release/deployment remain pending. F08 remains contract-only.**

## Design before code and RED → GREEN

User-confirmed Q09 and full contracts were approved by THN4 in #67 at `922cc7bd71a64ada74a0456fcb29b7eb33ea2c49`,27Nov09:30:57UTC, then merged to staging `13ea49f` before this work. No new eligibility/window/counting policy was invented during implementation. Existing attendance is returned200 after owner/exact-registration/ACTIVE checks even outside the creation window; a new attendance still requires start≤trusted server time<end.

| Stage | Immutable version | Actual observation |
|---|---|---|
| RED | `643dac5` | Additive Attendance migration, guarded real DB fixture, authorized roster GET200 with attendance null, executable mutation scaffold. Eligible POST test fails **expected201, received409**,1 failed. This is a domain behavior failure, not a missing route/import/database error |
| GREEN | `0faf42a1d3812deb59554763f6fe245507e719b2` | Same eligible assertion passes against locked persisted implementation. Expanded20 API/DB cases pass;14 browser pass; full integration128 in13 files; unit93 in10 files; typecheck/build PASS |

Reproducible selected RED/GREEN command from repository root, using guarded app/test DBs and the repository toolchain:

```text
npm exec --workspace server -- vitest run tests/integration/check-ins.test.ts -t "persists eligible attendance"
```

On RED the fixture/roster/registration are real; only mutation is intentionally scaffolded to reject. GREEN removes that scaffold. Expanded tests are regression/verification, not additional invented RED cycles. Early browser setup failures (SQL parameter UUID/text inference and nonunique locator) were corrected before claiming results. The browser return-path test exposed the missing Check-in allowlist entry; it now preserves the role-specific protected route. Shared strict-parser null400 behavior is documented in contractv0.2; arrays/unknown object fields remain422. No assertions were removed to hide a persistence/authorization failure.

## Implementation and API

`server/src/check-ins.ts`, `server/src/app.ts`, `client/src/CheckInView.tsx` and owner navigation/return-path integration implement:

- Owner-only GET `/api/organizer/events/:eventId/check-ins`: consistent REPEATABLE READ event/ACTIVE roster/summary, server clock/window, stable registeredAt/id pagination, safe allowlisted fields.
- Owner-only CSRF/Origin-protected POST `/api/organizer/events/:eventId/registrations/:registrationId/check-in`, body{} and no query.201 creates;200 returns original attendance; safe401/403/404/422 and409 eligibility/window errors.
- Shared event row lock, bounded contention, trusted decision time after the lock. Existing/no-op preserves attendance time; management event/version, registrations and seat counts do not change. No schedule mutex inversion, attendance undo or client-supplied actor/time.
- Additive migration `20261127020000_attendance`: UUID record, UNIQUE registration FK, required timestamptz and actual actor FK, restrictive deletion. Original migration files remain unchanged; startup does not seed/reset/backfill.
- Native confirmation, pending disable, persisted read after success, error/empty/window/ineligible/private expiry handling. Unknown outcome requires explicit authorized status read; no automatic POST retry. Late callbacks after unmount cannot redirect the next page. Window refresh follows server-provided timing, with server revalidation on every mutation.

## Exact AC/test mapping

API cases are in `server/tests/integration/check-ins.test.ts` (**20**); migration case in `attendance-migration.test.ts` (**1**); browser cases in `e2e/f-07.spec.ts` (**14**). Passing a file does not claim every possible input or a measured coverage percentage.

| AC / STS | Actual executed assertions | Result / limitation |
|---|---|---|
| AC01 / T07-01 | Eligible creation201, persisted registration/actor/time, authorized roster retrieves same ID/time; summary matches; full event/registration unchanged; browser reload reads same stored row | PASS |
| AC02 / T07-02 | start−1/0/+1ms and end−1/0/+1ms fresh fixtures; real observed event-lock waits across start/end use updated injected server time; denied attendance count0/version0 |8 API cases PASS |
| AC03 / T07-03 | Two observed same-ID lock waiters return201/200 with identical record; repeat at end returns original200, one row only |1 API case PASS; no new creation outside window |
| AC04 / T07-04 | Cancelled old ID while same person has new ACTIVE rejected409; foreign/missing registration404 with exact safe body; invalid UUID/fields/query/array422, parser-null400; saved history unchanged |1 API case PASS |
| AC05 / T07-05 | Anonymous401; Participant/assigned Instructor403; other owner404 for read/write; expired session401; CSRF/Origin403; pagination/unknown inputs422; owner positive read; exact event/roster DTO allowlists; no attendance, unchanged registration/version |1 API matrix PASS; browser protected deep link and mutation401/403/404 clear private data |
| AC06 / T07-06 | Cancel-first/edit-first read locked state; check-in-first vs cancel+edit has three observed waiters; cancellation/check-in together cross start; deferred commit-trigger failure rolls back; actual lock timeout503 with no attendance |6 API cases PASS; uncertain network outcome separately exercised in browser |
| AC07 / T07-07 | Separate app process logs in/reads original saved attendance without seed;21 tied registeredAt rows paginate20+1 stable ID order with legacy capacity80; migration preserves existing temp user/hash/registration rows and checks UNIQUE/required/FK/RESTRICT |2 API +1 migration PASS; migration apply/repeat ran on local old app/test DBs. Cloud restart/redeploy NOT RUN |
| AC08 / T07-08 |14 browser cases: owner link/confirm-dismiss/focus/success/reload; lost committed response→blocked→failed explicit GET→retry read; pending submissions/status/pagination disabled; stale cancelled/window denial; read error vs empty/not-open; login return path/Participant denial;401/403/404 clearing; delayed response after logout; keyboard/layout320/390/1440 |14 PASS; screenshots below; native dialog dismiss models cancel/Escape, physical-key/screen-reader human UAT remains pending |

Actual domain and access excerpts for Deliverable2 can be taken from `serializes concurrent same-ID requests...`, `rechecks cancellation and check-in together...`, and `enforces anonymous/role/owner/expiry/CSRF/Origin...`, with their setup/assertions above. Include the actual code in the final PDF; links alone are not the required report content.

## Commands, environment and measured scope

```text
npm run db:generate
npm run db:migrate
# Repeat on the separate guarded test DB, then run migrate again: no pending migration.
npm exec --workspace server -- vitest run tests/integration/check-ins.test.ts
npm run test:integration
npm run test:unit
npm run typecheck
npm run build
npx playwright test e2e/f-07.spec.ts
```

Pinned Node22.23.4/npm10.9.9; native disposable PostgreSQL17.11, UTC, guarded distinct app/test DBs. Six migrations applied; repeat test migration found none pending. Tests use generated synthetic IDs and scoped FK-order cleanup; no live account reset/production seed. Local browser override uses installed Chrome, existing isolated servers, ignored artifacts and video off. A final test-only cleanup/fixture adjustment was followed by a20/20 focused rerun; CI will establish the exact complete committed-head result. Local logs under ignored `tmp/f07-*.log` are convenience output, not durable external evidence. Full local integration128 includes20 F07 API and1 migration plus the existing107 cases. Full local browser regression/Docker defer to CI; local unit is93 and selected browser14.

Visual QA inspected actual320px and1440px screenshots; automated390px/no-horizontal-scroll/focus also passed. [320px](../../evidence/sprint-3/f07-320.png), [390px](../../evidence/sprint-3/f07-390.png), [1440px](../../evidence/sprint-3/f07-1440.png). These are synthetic browser evidence, not human UAT.

## Remaining work and acceptance

| Item | Owner / dependency | State / target |
|---|---|---|
| Feature review + exact PR CI + staging merge | THN4 reviews; JeffMerry resolves findings | Pending review/merge; D2 checkpoint28–29Nov |
| Human keyboard/Escape/screen-reader checks and any findings | JeffMerry + actual tester; accepted candidate | NOT RUN; by final13Dec; required critical accessibility findings are not postponed silently |
| G05 combined release-candidate journeys; G06 deploy/redeploy persistence | JeffMerry; reviewed candidate/operator procedure | NOT RUN for a released F07; D2 checkpoint by29Nov |
| F08 AC01–06 unique-person reports | JeffMerry; attendance schema/Q09 contract | Contract approved, implementation/tests NOT STARTED; remaining through13Dec |
| Full PDF/demos/main release/submission | JeffMerry; #45 and teammate review | Remaining; final report must expose unrun human/cloud gates |

F07 selected automated AC evidence does not equal teammate acceptance or the entire Sprint3 completion. No deployment/submission/approval is performed by this branch.

## PR CI

PR/run not yet created. The PR description will record actual head/checked-out merge SHA, counts and required check result after CI completes.
