# Sprint 3 software test specification

Version0.1,27Nov2026. Owner JeffMerry; reviewer THN4. Refs #44/#45. **All cases planned/NOT RUN; files/test counts below are not invented execution results.** Contracts [F07](f-07.md)/[F08](f-08.md); [confirmed Q09](README.md).

## Setup and safeguards

Pinned repository toolchain and a guarded TEST_DATABASE_URL separate from application DB, UTC connection timestamps and synthetic Organizer O1/O2, Participant P1/P2/P3, Instructor I1. New ordered migration must preserve existing users/hashes/events/version/registrations/assignment history. Capture hash-only/specific authorized preserved-data checks before/after apply and repeat migration; no global delete/reset/seed on ordinary startup. Clean only test-owned rows in FK order after success/failure. Server clock is injected in app tests; no public time/reset endpoint. Verify actual DB lock waits with a separate observer; Promise.all alone does not establish a race.

Default E1 owned O1: startsAt2030-01-15T02:00:00Z, endsAt03:00Z, capacity3, P1 ACTIVE R1, P2 CANCELLED R2, P3 ACTIVE R3, no attendance. E2 owned O2. Time offsets use start−1/start/start+1/end−1/end/end+1ms. Every rejected write checks safe status/code and unchanged event/version/registration/attendance; success checks authorized API plus DB. Read responses use exact field allowlists. Report fixture adds repeated CANCELLED history and new ACTIVE ID for P1, multiple cancelled rows for P2 and one saved attendance for P1.

## F07 cases

| ID / AC | Level | Steps / inputs | Expected assertions |
|---|---|---|---|
| S3-T07-01 / AC01 | API+DB | O1 reads E1 roster; at start check in R1; read again |201 then original attendance ID/actor/time retrieved; R1 state/time/capacity/version unchanged; active roster counts correct |
| S3-T07-02 / AC02 | Unit/API+DB | Fresh fixtures at each boundary; hold E1 event lock while request waits, advance clock across start/end, then release | Before start409 NOT_OPEN, start allowed, end−1 allowed/end+after409 CLOSED; sampled time after wait decides; denials no writes |
| S3-T07-03 / AC03 | API+DB concurrency | Repeat R1 sequential/concurrent with event blocker and observer; retry after window | One attendance/time; initial201, repeats200 unchanged; no new attendance outside window. Proposed repeat precedence is reviewed before implementation |
| S3-T07-04 / AC04 | API+DB | CANCELLED R2; old cancelled ID after same-person new ACTIVE; wrong-event/missing ID; invalid UUID/body/query/forged person/time |409 INELIGIBLE/404/422 as contract; new ACTIVE unaffected; no history mutation/leak |
| S3-T07-05 / AC05 | API+DB matrix | Anonymous/P1/I1/O2 read roster or POST; expiry, bad CSRF/Origin; authorized O1 positive control |401/403/404 safe DTO/error allowlists; no writes; assigned Instructor still403 |
| S3-T07-06 / AC06 | API+DB concurrency/rollback | Cancel/check-in at start crossing; F06 time edit vs check-in; two submissions; force insert/commit failure | Locked state/window respected; never attendance on CANCELLED; no partial attendance/version change; 503/unknown UI requires reconciliation |
| S3-T07-07 / AC07 | DB/process | Apply/repeat migration on old DB; seed-free new app process reads R1 attendance; roster21 rows with ties split20+1 | Data/hashes/IDs preserved; same attendance after restart; no missing/duplicate rows; guard rejects unsafe DB |
| S3-T07-08 / AC08 | Browser/manual | Confirm/cancel, pending duplicate, stale window/ineligible, lost committed response then failed/successful GET, empty/error/retry, expiry/deep link, keyboard/320/390/1440 | Real persisted status; no fake success/private cache flash; focus and responsive assertions; human checks labeled separately |

## F08 cases

| ID / AC | Level | Steps / inputs | Expected assertions |
|---|---|---|---|
| S3-T08-01 / AC01 | Unit/API+DB | Empty event and confirmed three-person example; add saved attendance |0/0/0 or2/1/1 exactly; units people; attended subset of current registered for valid lifecycle |
| S3-T08-02 / AC02 | API+DB | P1 CANCELLED twice then ACTIVE+attendance; P2 CANCELLED twice only; repeated reads | P1 registered1/cancelled0/attended1; P2 cancelled1; no join/history multiplication or writes |
| S3-T08-03 / AC03 | API+DB concurrent snapshot | Pause a report transaction; concurrently commit cancel/re-register or check-in; retrieve a new report | Each response corresponds to one consistent snapshot; no mixed old/new counts/rows/total; next read reflects committed change |
| S3-T08-04 / AC04 | API+DB matrix | Anonymous/P1/I1/O2; missing/invalid event; page0/pageSize101/unknown filters; correct owner control |401/403/404/422 without metadata/leaks; full DB state unchanged by report; exact DTO allowlist |
| S3-T08-05 / AC05 | API+DB pagination |21 distinct people, tied names and multiple histories each; pages20+1 | Stable displayName/participantId order, no duplicate/missing person, consistent summary/total; legacy capacity>60 does not truncate roster |
| S3-T08-06 / AC06 | Browser/process/manual | Current labels, empty/error/retry/expiry/deep link, refreshed counts after real check-in, responsive keyboard; new app process retrieves report | Persisted values/people units, private state cleared; no fake zero on failure; same saved counts without reseed; manual work labeled |

## Test-first and execution register

Before mutation implementation, preserve executable test and domain RED (eligible check-in must persist, duplicate must not create another row, or people-count expected result) on a functioning fixture/route. Missing import/DB permission/syntax is setup failure, not RED. Then run the same selected command/assertion on GREEN and relevant regression. Preserve exact source/test commits and any working-tree differences. Do not claim focused predicate tests prove UI/API/DB/lock behavior.

| Scope | Actual executable file/name | Source/test commit | Command | Result |
|---|---|---|---|---|
| S3-T07-01–08 | TBD after implementation | TBD | TBD | NOT RUN |
| S3-T08-01–06 | TBD after implementation | TBD | TBD | NOT RUN |
| Existing F01–F09 regression | Existing suites at selected candidate | TBD | Repository unit/integration/typecheck/build/Playwright commands | NOT RUN on a Sprint3 candidate |

Candidate checks must include publish1/60/61 and legacy>60; register/cancel/deadline/capacity; Instructor assignment/access/scheduling; check-in lifecycle. The baseline CI93/94/62 belongs to F09's tested head, not to new attendance code. [DoD](dod.md) and #45 require exact release identity and post-deploy verification separately.
