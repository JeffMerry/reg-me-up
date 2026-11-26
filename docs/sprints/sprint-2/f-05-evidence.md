# F-05 cancellation — executed evidence

26 November 2026, Asia/Bangkok. Owner: Kittithat (JeffMerry); peer reviewer: Thanatip (THN4). Refs #41. Status: **implemented and locally verified candidate; peer review, staging merge and accepted release pending**.

## Version and actual RED/GREEN

- Implementation base: `ff97517084a40ed66e4ef6e900d2da1ec533274a`, staging after shared-lock PR #55 merged. Policy/ownership are recorded in PR #51 and [review-record.md](review-record.md).
- RED: `4688652`, test-first cancellation scaffold returns the actual own persisted registration without mutation. At 19:21:47, `npm exec --workspace server -- vitest run tests/integration/cancellation.test.ts -t "cancels an own ACTIVE registration"` produced **1 failed, 11 skipped**: expected `ACTIVE` to be `CANCELLED`. Authentication, fixture and route worked; the domain assertion failed. This is not a missing-route/compile failure.
- GREEN runtime/test source: `60423732af75b4155aff13553ff3f57fe5e262ac`. The same test is included in the passing full integration run. One later API case and browser tests expand the original test-first suite; they are not claimed to have run RED on the earlier commit.
- Documentation commits after GREEN do not change runtime behavior. Local console logs are retained under ignored `tmp/f05-*.log`; these are local records, not uploaded CI artifacts. Remote CI identity/results are recorded separately when available.

## Environment and commands actually executed

Node 22.23.4, npm 10.9.9, pinned lockfile, PostgreSQL 17.11. Docker Desktop was unavailable locally, so verification used the task's existing disposable native PostgreSQL cluster on loopback port 55442 with distinct application/test databases and the existing test guard. No production database was used or reset. The cluster is stopped after verification, retaining its files.

The native cluster initially inherited Asia/Bangkok. A started-event browser check exposed the pinned adapter's UTC connection assumption; only these two disposable databases were configured as UTC, without rewriting timestamps, then integration/browser checks reran successfully. The initial 41/42 browser result is a setup failure, not intended domain RED. A temporary frontend missing-import typecheck failure was also corrected before the final passes. The deployed database's time zone was not inspected by this work. Use UTC connections when reproducing these tests.

| Command / scope | Actual result on GREEN source |
|---|---|
| `npm run db:generate` and `npm run db:migrate` on both isolated databases | Applied additive cancellation migration; repeat test-database migration reported no pending migrations; original migration files retained |
| `npm run test:unit` | 55 passed, 8 files |
| `npm run test:integration` | 58 passed, 6 files; includes 13 cancellation cases; console start 19:42:47, duration 17.26s |
| `npm run typecheck` | Passed after final UI correction |
| `npm run build` | Client and server passed after final UI correction |
| `npx playwright test` | 43 passed, including 10 F-05 cases; final run includes cached-detail reopening check; installed Chrome used through `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` |
| `git diff --check` | Passed |

Credentials were injected only for synthetic fixtures. API tests clean up their uniquely owned rows; browser tests remove their own event and registration rows. No global reset or seed-on-start was introduced. Screenshots for confirmation at 320/390/1440px are produced in Playwright test outputs; the 320px confirmation was visually inspected locally. Local checks do not establish Docker image or cloud deployment success.

## Requirement → AC → actual tests

API file: [`server/tests/integration/cancellation.test.ts`](../../../../server/tests/integration/cancellation.test.ts). Browser file: [`e2e/f-05.spec.ts`](../../../../e2e/f-05.spec.ts). Existing `events.test.ts` retains the DTO allowlist regression and now expects nullable `cancelledAt` on own responses.

| Requirements / AC / planned STS | Actual executable checks and observed result | Remaining integration |
|---|---|---|
| FR-06; BR-02/07; AC01 / T05-01 | `cancels an own ACTIVE registration and returns the seat with persisted history`: persisted timestamp, list/detail, owner ACTIVE totals and capacity unchanged | Peer review/release |
| BR-07; AC02 / T05-02 | Parameterized start−1ms/start/start+1ms; concurrent lock-wait test advances injected time while waiting, rejects using time sampled after lock | None for startsAt rule locally |
| BR-03/07; AC03 / T05-03 | Repeat including after start; concurrent same-ID cancellation, stable timestamp; cancelling an old ID cannot cancel the new row | None for implemented lifecycle locally |
| FR-06; BR-07; AC04 / T05-04 | New UUID after cancel, old CANCELLED row retained; duplicate ACTIVE protected; start cutoff rejects new registration | Explicit optional deadline requires F-06 schema/implementation |
| BR-04/05; NFR-01; AC05 / T05-05 | Anonymous, Organizer, other Participant, missing/invalid ID, forged body/query, bad CSRF/Origin; denial/no writes/no private DTO leakage | Instructor role requires F-09 migration/auth extension |
| BR-02/03; NFR-03; AC06 / T05-06 | Observed waiting writers in `pg_stat_activity`; cancel-first/register-first last-seat races, concurrent cancel, capacity writer through real shared helper, forced rollback; ACTIVE counts and uniqueness retained | Real F-06 PATCH/expectedVersion and two competing new registrants require integrated coverage; helper writer is not claimed as F-06 endpoint coverage |
| NFR-02/06; AC06 / T05-07 | New application subprocess reads CANCELLED history using same DB, no reseed. Browser persists/reloads/re-registers; responsive confirmation/focus/Escape, pending duplicate prevention, lost response + failed/successful GET reconciliation, cached reopen, denied/503, expiry, started event, ACTIVE lookup beyond first history page | Cloud restart/redeploy and human UAT under #45 |

Migration checks reject ACTIVE with a timestamp, CANCELLED without a timestamp, and unknown status; existing synthetic ACTIVE history remains readable with null `cancelledAt`. The ACTIVE-only unique index and all original migration files remain unchanged. This is not a full production data audit or a migration of the peer-owned `events.version`/Instructor schema.

## Review and release boundary

The feature uses the merged event-row lock protocol. Cancellation timestamp/state changes are atomic; repeat cancellation returns the original history and does not return another seat. Own reads expose ACTIVE and CANCELLED history; public registration lookup walks history pages to locate an ACTIVE row. Unknown UI outcomes require a successful status read before another mutation.

No change to Lab7 BR-01/create validation, no F-06/F-09 endpoint/schema implementation, and no deployment is part of this candidate. F-06 must extend registration cutoff to its optional deadline while preserving ACTIVE duplicate priority. After peer work merges, run the integrated deadline/capacity/Instructor matrix and release checks; issue #41 stays open until its agreed review/merge/release gates are met.
