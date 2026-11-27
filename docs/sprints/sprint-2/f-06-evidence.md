# F-06 owned event editing — executed evidence

Current feature chain reconciliation: PR [#65](https://github.com/JeffMerry/reg-me-up/pull/65) was approved by THN4 and merged27Nov2026 into staging as `b8ad3e2cca223edb841f6ed56f64c4be690b9317`. Subsequent #66/#68/#69 integrate actual Instructor overlap, assignment and selected race/access/UI coverage; combined C69 CI reports management17/17 plus acceptance13/13 and Instructor11/11 within integration128/128. This supersedes historical review/staging-pending paragraphs below for those sources; main release/deployed verification remain open. See [per-AC record](../deliverable-2/feature-completion.md).

27 November 2026 (Asia/Bangkok). Owner: Kittithat (JeffMerry); reviewer: Thanatip (THN4). Refs #42/#45. **API/UI/deadline candidate locally verified; peer review/staging merge, Instructor integration and release acceptance pending.**

## Source and actual RED/GREEN

- Original pure-rule test-first: `c0cb1ad` → `fde153f` (24 rule cases, before Lab7 integration).
- Updated feature branch with staging #64 (`73d4fc9`) in merge `79d14155d09834c3d7f59da26f613d9751932bce`. Existing test reproduced legacy incompatibility at11:07:46: `npm exec --workspace server -- vitest run tests/unit/event-edit-validation.test.ts -t "rejects explicitly supplied capacity 61"` →1 failed/23 skipped; renaming capacity100 returned a capacity error instead of preserving100.
- Legacy GREEN `bb7ecbc70fdaeca1cefc4ee51e6064d09ebf36ae`: separate publication1–60 from complete stored-event validation, with explicit edit capacity checked1–60 separately. All87 unit cases passed. The publish rule is retained.
- API RED **`be12e5dc55217dbd812b255292b89961d0eb2a6c`** at11:09:20: `npm exec --workspace server -- vitest run tests/integration/event-management.test.ts -t "persists an owner partial edit"` →1 failed. Authenticated owner PATCH reached a read-only scaffold; expected `Updated workshop`, received the persisted original title. This is domain RED, not a route/compile/setup failure.
- Runtime/API/browser GREEN **`4cce15d0822953c86a25c91e52165c1bba5724de`**. Same edit case is included in the passing suite. Later access/race/UI cases expand the single initial API test; they are not claimed to have run RED on that commit. Documentation commits follow without runtime changes.

## Implementation and handoff

Owner GET/PATCH `/api/organizer/events/:eventId` derive identity from session. PATCH checks UUID/query, locks schedule mutex334/2 then event row, verifies owner, validates expectedVersion and merged event using one server decision time sampled after locks, and checks ACTIVE count. It writes only supplied fields and increments version once for a real change; normalized no-op keeps version. Missing/non-owner is safe404. Capacity explicit1–60 must cover ACTIVE; omitted legacy>60 is retained. Nullable description/deadline can be cleared. Started event and stale version reject atomically.

Migration `20261127000000_registration_deadline` adds nullable timestamptz and CHECK null-or-<=starts_at, preserving old migrations/storage capacities. New/old events default to null. Registration checks own ACTIVE duplicate first, then now>=deadline-or-start, then full; cancellation remains governed by start rather than deadline. Public and nested event DTOs share nullable registrationDeadline/effectiveRegistrationCutoff, without private version/owner IDs. Existing allowlist test now explicitly includes those two public fields.

Edit UI is separate from CreateEvent, linked from My Events with role-aware returnTo. It sends only changed fields (legacy capacity omitted), shows field errors, pending/stale/started/unknown/session-expiry/read-error states, and requires explicit reload after conflict/uncertain outcome. Public detail shows Closed and refreshes at cutoff; server remains authority. No automatic mutation retry or optimistic success. Times display Asia/Bangkok and serialize UTC. Visual inspection of the320px screenshot found readable layout with no horizontal overflow.

**F-09 integration requirement:** the current staging schema has no Instructor/assignment model. Owner DTO currently returns currentInstructor:null. Before exposing assignment workflows, F-09 must connect actual current Instructor reads and its overlap check in the documented point inside the locked F-06 edit transaction (before update), while using the same schedule mutex and version increments. Do not treat the null DTO or absence of assignments as implemented overlap validation. F-09 author/reviewer must add assigned-event conflict/adjacency and assign-vs-edit cross-event race coverage. S2-T06-07 and Instructor role denials remain NOT RUN. This candidate does not create peer-owned Instructor schema or claim all F-06/F-09 acceptance criteria complete.

## Environment and actual verification

Pinned Node22.23.4/npm10.9.9, PostgreSQL17.11, disposable native loopback cluster port55442, distinct app/test DBs with existing identity/marker guard and UTC connection setup; no production DB/reset/seed-on-start. Generated Prisma, applied additive migration on both DBs; repeated test migration reported no pending migrations. Old synthetic event read retains capacity/version with null deadline; an invalid deadline is rejected by DB CHECK. Full production data audit and cloud migration were not performed.

| Command / selected scope | Actual local result on GREEN source |
|---|---|
| `npm run test:unit` | 87 passed /9 files, includes24 pure F-06 rule cases |
| `npm run test:integration` | 81 passed /8 files, includes17 F-06 API/DB cases; final start11:17:34, duration34.31s |
| `npm run typecheck`; `npm run build` | Client/server passed |
| `npx playwright test` | 57 passed, includes10 F-06 browser cases; duration1.4m; installed Chrome executable override |
| `git diff --check` | Passed |

An earlier full integration attempt had80 pass/1 failure because the new app-process restart case exceeded Vitest's default5s while starting a subprocess. Its explicit timeout is now15s, consistent with the already bounded10s startup probe; assertions are unchanged. The next full run passed81. This timeout is recorded separately from intended RED. Local logs are in ignored `tmp/f06-*.log`, screenshots in ignored Playwright test outputs; final CI identity/results belong to the PR. The disposable cluster is stopped after verification, retaining its files.

## AC → actual tests → remaining scope

API file: [`event-management.test.ts`](../../../server/tests/integration/event-management.test.ts). UI file: [`f-06.spec.ts`](../../../e2e/f-06.spec.ts). Pure rules: [`event-edit-validation.test.ts`](../../../server/tests/unit/event-edit-validation.test.ts).

| AC / planned cases | Actual executed checks | Limits |
|---|---|---|
| AC01 / T06-01 | Persisted partial title edit/revision, omitted fields/legacy, normalized no-op, null clearing; UI reload and PATCH-body assertion | Peer review/release pending |
| AC02 / T06-02 | Explicit cutoff−1/0/+1ms, duplicate priority, null=start, invalid deadline/range, past deadline closes; public Closed UI | Cloud journey pending |
| AC03–04 / T06-03–04 | Explicit1/60 accepted,0/61/100/fraction/types rejected; equal ACTIVE accepted, below ACTIVE rejected; legacy100 title edit retains capacity | Local synthetic data, not production audit |
| AC05 / T06-05 | Anonymous/wrong role/other owner, missing/invalid ID, CSRF/query/forged fields; unchanged row; exact private DTO allowlist/public no-version | Instructor role waits for F-09 |
| AC06 / T06-06 | Actual waiting writers observed in pg_stat_activity; same-version edit vs edit, post-lock start-clock denial, deadline edit/register and capacity increase/register in both orders, capacity edit/cancel, forced rollback preserves revision/fields | Cross-feature Instructor race pending |
| AC07 / T06-08 UI/persistence part | New application subprocess retrieves edit/deadline without reseed; responsive320/390/1440, keyboard, stale reload, lost committed response reconciliation, pending, expiry, read-error retry | Human UAT/deploy pending; overlap T06-07 NOT RUN |

No measured coverage percentage, deployment or accepted integrated Sprint2 release is claimed. After review/staging merge, coordinate F-09 guards and execute the remaining matrix before accepted main release under #45.
