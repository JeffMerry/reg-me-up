# RegMeUp Sprint 1 — Software Test Specification

This document retains its original test-design baseline and historical empty execution register. F-01 implementation and partial actual results are recorded separately in [F-01 verification](f-01-evidence.md); later-feature and full-product tests remain unclaimed.

| Item | Value |
|---|---|
| Version / date | 0.5 / 2026-11-26 |
| State | Test design only; pending teammate review; **ALL PLANNED / NOT RUN** |
| Inputs | [SRS](../../srs.md), [SDS](../../system-sds.md), contracts [F-01](f-01.md)/[F-02](f-02.md)/[F-03](f-03.md)/[F-04](f-04.md), [UI](../../ui-spec.md) |
| Existing test files / commands / tested commit / results | `server/tests/unit/events-validation.test.ts` (`npm run test:unit`); `server/tests/integration/events.test.ts` (`npm run test:integration`, requires isolated `DATABASE_URL` and `TEST_DATABASE_URL`). These files predate Lab 7's 1–60 change; its specific cases are planned below and remain NOT RUN. No tested commit/results recorded. |

TEST-01–10 retain reference IDs. TEST/AC-11–15 fill the known discovery/hash/setup/UI/owner-list gaps; adopted into this design under the user's instruction, not historical test execution. Suffixes A/B/... are cases in a group, not replacement IDs.

## 1. Levels, environment and fixtures

Unit: pure validation/normalization/error-priority logic. API/DB integration: real Express HTTP application, independent cookie jars, session store and PostgreSQL with same engine/constraints as release. E2E: Playwright against actual UI/API/test DB. Manual: only explicitly identified supplemental UI/restart/setup checks with recorded expected/actual version; do not replace automated rule/security tests with screenshots.

Apply all versioned migrations to isolated TEST_DATABASE_URL, then deterministic synthetic fixtures. Before any destructive reset or cleanup, enforce the [SYS-01 test database safety rules and SYS-TEST-05](sys-01.md): reject missing TEST_DATABASE_URL, compare effective host/port/database and aliases against the application target even when URLs differ in format, and verify an explicit test-only database identity/marker. Refuse cleanup before writes when identity is uncertain or the target is the application or a non-test database. Unit/E2E fixture setup cannot silently bypass the API behavior under test. Direct DB setup for preconditions/hidden fixtures is allowed, but actions asserting registration/publication use HTTP. Session credentials generated/provided by test harness/local seed procedure; never use real account secrets.

| Symbol | Fixture |
|---|---|
| P1/P2/P3 | Distinct Participant users, normalized unique synthetic emails, known harness credentials hashed with selected policy |
| O1/O2 | Distinct Organizer users with valid sessions/CSRF tokens where needed |
| E_OPEN | O1, PUBLISHED, capacity3, no registrations |
| E_LAST | O1, PUBLISHED, capacity1, no registrations; independent fresh fixture per race |
| E_FULL | O1, PUBLISHED, capacity1, existing ACTIVE R1 owned by P1 |
| E_DUP | O1, PUBLISHED, capacity3, existing ACTIVE R1 owned by P1; spare seats isolate duplicate from full |
| E_OTHER | O2, PUBLISHED, capacity2, one P2 ACTIVE registration |
| E_HIDDEN | O1, UNPUBLISHED, capacity2; direct fixture only, no draft endpoint |
| Unknown IDs | Valid UUIDs not present; invalid path case uses a non-UUID string separately |
| Valid publication V | title `Campus Workshop`, startsAt `2026-12-01T09:00:00+07:00`, endsAt `2026-12-01T11:00:00+07:00`, location `Building A`, capacity3, description omitted |

Assign deterministic valid UUID values when implementing fixtures; retain symbol→actual mapping in test source. Each case resets its own isolated state; never depend on a prior test's registration. Fixed clock dependency supports lifecycle boundary tests without waiting 8 hours; production clock must remain ordinary server time. No public test-only clock/auth bypass endpoints.

Common API assertions: status + exact semantic code; success field allowlist; forbidden body has no event-private name/rows/totals; no plaintext/hash/token leakage except intentional session cookie/CSRF delivery; DB row counts/owners/status/foreign keys after mutation. Record baseline counts before each negative mutation. HTTP 2xx alone is not persistence evidence.

## 2. Test groups

| Test / AC | Level | Preconditions/input and action | Expected response and data assertions |
|---|---|---|---|
| TEST-01 / AC-01 | API/DB | A: fresh CSRF bootstrap and P1 valid credentials → login → me. Repeat O1. B: fresh anonymous sessions with wrong password and unknown email. C: missing/blank/malformed email, missing password, unknown role field. D: fresh bootstraps and two successful logins, checking prior SID. | A:200 identity ID/name/role matches seeded DB; no hash/email/session payload; protected reads allowed. B:401 INVALID_CREDENTIALS same safe message and me401. C:422 field/unknown-field validation, no authenticated identity. D:new authenticated SID differs from bootstrap/old SID; old SID cannot use me. Login returns replacement CSRF token. |
| TEST-02 / AC-02 | API/DB + UI supplement | A: P1 login → logout with current token → replay old SID to me/own list. B: login at clock t; me at t+8h−1ms, exactly t+8h and after. C: forged/unknown SID; failing store destroy using internal fault injection. D: after successful login send old pre-login CSRF vs returned token. | A:logout204/no body, cookie clear/store invalidated; replay401. B:200 before boundary,401 at/after; activity never extends access. C:unknown401; destroy failure not204, no claim logout succeeded. D:old token403 CSRF_INVALID, new token accepted for authorized mutation. |
| TEST-03 / AC-03 | Unit + API/DB | A: O1 publishes V at capacity 1, 30, and 60, with omitted/null/empty/whitespace description variants. B: missing each required field; null/whitespace title/location; naive/impossible dates; equal/reversed range; capacity missing/null/0/−1/61/2,147,483,647/overflow/1.5/"30"/boolean. C: each string at max and max+1; Unicode supplementary-code-point input. D: overnight +07:00 publication; valid past event dates. | A:201 EventOwned for each allowed value; GET detail200, DB ownerO1/PUBLISHED/normalized values/description null. B/C invalid:422 fieldErrors, no event row; at-limit fields valid. D:UTC instants equal input conversion (including day change), end preserved; past valid dates accepted without unapproved cutoff. Test both server validators/DB checks where applicable. |
| TEST-04 / AC-04 | API/DB + selected E2E | P1 valid session/CSRF registers E_OPEN → own list with eventId → own detail → new browser reload/identity retrieval. | POST201 with server ID/ACTIVE/time/current name/event; exactly one DB row owned by P1 for event; own filtered list contains matching ID, detail matches; remaining decreased by1; reload reads actual data rather than local-only record. |
| TEST-05 / AC-05 | API/DB | A:P2 (not registered) sends register E_FULL with valid session/CSRF. B: seed a synthetic pre-existing published event with capacity61 and ACTIVE count60; a valid Participant registers through the API. | A:409 EVENT_FULL; no new P2 pair; event active count stays1, remaining0; existing P1 row unchanged. B:201; event capacity remains61; active count becomes61 and remaining becomes0. No unhandled DB500 or optimistic success. |
| TEST-06 / AC-06 | Concurrent API/DB | A:P1 register E_DUP again sequentially. B:fresh capacity3/no rows, two concurrent P1 register requests via separate connections and cookie jars authenticated as same user. C:P1 register E_FULL where existing pair and full both true. D:direct constraint test inserts second ACTIVE pair in isolated transaction. | A/C:409 ALREADY_REGISTERED with P1 existing registrationId, no insertion; duplicate precedes full. B:one201, one409 ALREADY_REGISTERED, final pair/count1, remaining2; same existing ID retrievable. D:known unique constraint rejects second pair. No user data from other participants returned. |
| TEST-07 / AC-07 | Concurrent API/DB | P1/P2 valid sessions submit E_LAST with deterministic contention harness in §3; swap roles/order in independent run; include variant first transaction forced to rollback before insert/commit. | Normal:exactly one201 and one409 EVENT_FULL, final active1/capacity1/remaining0; winner ID/owner correct, loser absent. Rollback variant:aborted attempt creates no row; waiting eligible attempt may succeed and final<=1. Record overlap evidence, not just response order. |
| TEST-08 / AC-08 | API/DB + Organizer E2E | A:O1 reads own E_FULL/E_OPEN registrations. B:O2 reads E_FULL private route and unknown UUID; O2 public detail control. C:separate O1 event capacity25 with21 distinct synthetic Participants/ACTIVE rows, page1/page2 including tied timestamps. | A:200 exact authorized metadata/rows/summary; empty event200 []/zero count. B:both private denials404 identical safe category with no metadata/totals; public detail200. C:default page1 has20/page2 has1, total21/active21/capacity25/remaining4, rows ordered registeredAt/id; no email/phone/hash; GET changes no DB domain rows. |
| TEST-09 / AC-09 | Parameterized API/DB | Execute matrix §4: each protected endpoint × anonymous/P1/P2/O1/O2 as applicable, valid ID/CSRF/schema; cross-owner/Participant detail ID; malicious body owner/participant/role fields; valid-origin/bad-token and bad-origin/current-token POST cases; hidden event registration. | Missing session401; wrong role403 FORBIDDEN; wrong resource owner404 NOT_FOUND; owner fields422 with no writes for otherwise-authorized caller; CSRF/origin failures403 CSRF_INVALID; hidden event404 with no insert. Allowed control calls succeed. Public list/detail remain200 without login. Inspect DB and safe deny bodies, not merely UI controls. |
| TEST-10 / AC-10 | Automated process/API/DB; manual demonstration supplemental | Create via API a P1 registration not present in initial seed; retain returned ID/data; stop app process/start it again with same database and no seed/reset; obtain fresh session if needed and read own detail/list. | Same ID/owner/event/ACTIVE/registeredAt retained, exactly one row; no reseed substitution. Record restart command/DB continuity and before/after evidence; local restart not claimed as cloud redeploy verification. |
| TEST-11 / AC-11 | API/DB + UI A | Seed E_OPEN/E_FULL/E_HIDDEN plus enough published fixtures for exactly23 published total, including tied start times/ordered UUIDs and one synthetic legacy-compatibility fixture with capacity61; anonymous and authenticated GET public lists/detail; paginate; query unknown/malformed ID; inspect fields. | Published/full included; the capacity61 fixture's stored capacity and registration summary remain readable unchanged; hidden excluded and detail404, unknown404, invalid ID422; default page1 has20/page2 has3/total23, stable startsAt/id ascending; max pageSize100 and invalid query422; EventPublic allowlist only, no private data. |
| TEST-12 / AC-12 | Unit + DB/API/log capture | Seed two synthetic users with same harness password using real hash library; read password_hash; library verifies matching/wrong values; run login requests with log capture; inspect DTOs. | Distinct salted Argon2id hashes with m19456/t2/p1 or documented stronger settings; correct verifies/wrong fails; no plaintext column/value stored; no password/hash/session secret in API/application logs. CSRF token/session cookie intentionally delivered only in designated flow. Do not print tested passwords in retained evidence. |
| TEST-13 / AC-13 | Automated setup/build/test plus manual fresh-environment steps | Fresh checkout/clean local workspace using exact README instructions, pinned deps and example env; migrate empty test/local DB, seed, start, run build/unit/integration/E2E commands; migrate again without reset. | Commands reproducible with synthetic credentials/no production secrets; tables/constraints seeded correctly; migration re-run applies no duplicates; results/counts/versions retained from actual execution. This group depends on executable setup implementation; currently NOT RUN, not an assertion that other tests pass. |
| TEST-14 / AC-14 | E2E/component + manual UI | Cases A–N in §5 across seven main screens/modal; induced loading/empty/read errors/validation/unknown mutation outcome and responsive/keyboard cases. | Behavior matches baseline; expected UI states listed below; actual frontend/API flow used for core journeys, manual checks labeled separately. |
| TEST-15 / AC-15 | API/DB | A:O1/O2 own-event lists with events of each, including a synthetic existing event with capacity61. B:O1 publication request V plus organizerId=O2; C:valid V without owner; D:GET own list with unsupported organizerId query. | A:each list own rows only/counts correct; existing event's capacity61 and registration summary remain unchanged; B:422 unknown-field validation and no insertion; C:201 DB ownerO1; D:422, never another owner's rows. Role/session controls in TEST-09. |

Technical transport cases supplement TEST-03/09: malformed JSON400 BAD_REQUEST, wrong content type415, >64KiB413; safe errors do not echo input secrets. F-03 timeout/commit ambiguity cases supplement TEST-07/14.M: known rolled-back lock/deadlock503 TEMPORARILY_UNAVAILABLE; lost commit outcome503 OUTCOME_UNKNOWN or disconnected response, reconcile own GET before retry; no false success/failure. Use internal test fault injection and record phase; do not infer transaction rollback merely from connection loss.

Prisma-specific planned checks: exercise a lock timeout while another transaction holds the event row and verify the known-rollback response and unchanged rows; separately exercise transaction acquisition/runtime timeout and connection loss near commit, recording actual error/rollback evidence before mapping a response. The ambiguous-commit scenario must not assert rollback without proof. Confirm the event lock and subsequent reads/writes use the same interactive transaction and that Prisma/driver timeouts do not hide a normal TEST-06/07 conflict. These checks are NOT RUN.

## 3. Deterministic concurrency method

Use PostgreSQL connection pool size at least2 for competing app transactions plus a separate observer connection. Distinct Participant sessions for last-seat case, independent sessions for same-user duplicate case. Isolate fixture per case; test DB schema/constraints match release. Promise.all/start barrier alone does not demonstrate that transactions overlapped.

Harness plan: hold request A after acquiring Event lock at an injected internal service barrier; start request B; inspect observer `pg_stat_activity`/`pg_locks` with actual backend PID/connection mapping until B is waiting on the relevant lock; release A promptly within the configured lock timeout; await both responses and inspect DB. Bounded polling fails with useful diagnostic if lock wait is never observed. Timeouts are not counted as the expected full conflict; design TEST-07 normal race must complete within lock timeout. Do not add a public endpoint exposing barrier/auth bypass.

For the first red rule test, also design shared-start coordination before competing validation statements so an implementation without a lock can expose double insert/oversubscription; record the actual intended-behavior failure, not a missing-module/build error. Internal test hooks must not supply a lock or uniqueness that production lacks. Inspect assertion strength and preserve real red/green source/commit/output rather than assert that a harness proves correctness by itself.

Run baseline cases once plus20 isolated repetitions for last-seat and duplicate races; repetition count is a test-design choice, not a performance metric or proof already obtained. Capture seed/run IDs, connection evidence, HTTP outcomes and final rows/counts. Unexpected timeout/deadlock/full in spare-seat duplicate case must fail/investigate, not be retried silently until green. Add rollback-path assertion and verify post-failure count <=capacity and no leaked transaction/client.

## 4. API authorization matrix execution

Expand every operation row in [SDS §4](../../system-sds.md) into cases. Me/logout: valid sessions for both roles allowed, anonymous401. Public list/detail: all contexts allowed on published data. Publish/My Events: only Organizer allowed; register/own list/detail: only Participant allowed; owner event registrations: Organizer plus matching owner only. Cross-Participant detail returns404 and cross-Organizer private list returns404, with known-good owner positive control.

POST cases test a valid Origin/token unless testing CSRF itself; wrong role must produce FORBIDDEN rather than merely fail a missing token. Anonymous protected POST is401 before CSRF per contract. Tampered participantId/organizerId/role fields are422 when otherwise-authorized; no rows created. A forbidden caller remains forbidden regardless of payload. Deep-link UI check supplements direct API owner checks, never substitutes for them.

## 5. UI verification mapping and expected states

| Case | UI source | Action / expected outcome | Method |
|---|---|---|---|
| TEST-14.A | UIV-01 | Anonymous list/detail sees published metadata/no private data; full remains viewable; a synthetic existing event with capacity61 displays its stored capacity; description omitted hides heading | E2E, TEST-11 API assertions |
| TEST-14.B | UIV-02 | Detail→login→same detail; Participant explicitly registers afterward; bad/external/wrong-role returnTo falls back safely | E2E |
| TEST-14.C | UIV-03 | Valid/invalid login, pending/network error, logout/expiry/Browser Back; no private cache without recheck | E2E + TEST-01/02 |
| TEST-14.D | UIV-04 | Organizer detail has no enabled register CTA; direct API call still403 | E2E + TEST-09 |
| TEST-14.E | UIV-05 | Publish at capacity1, capacity30, and capacity60 with empty description succeeds/retrieves and navigates detail after server success | E2E + TEST-03 |
| TEST-14.F | UIV-06 | Missing/invalid fields/time/capacity including 0 and 61 show inline errors and first-invalid focus, preserve data/no publication; pending prevents double-click | E2E/component + API |
| TEST-14.G | UIV-07 | Register→server reference→own list/detail modal matches persisted row; no optimistic fake ID | E2E + TEST-04 |
| TEST-14.H | UIV-08 | Full before request disabled; stale seats conflict shows full message/refresh, no false success | E2E/component + TEST-05/07 |
| TEST-14.I | UIV-09 | Already registered beats Full; duplicate conflict retrieves/links existing own ID | E2E + TEST-06 |
| TEST-14.J | UIV-10 | Wrong role/owner protected route denied; switching from own to forbidden event/registration clears previous private data | E2E + TEST-08/09 |
| TEST-14.K | UIV-11 | Reload/revisit shows existing registration; restart persistence separately verified in TEST-10 | E2E + process test |
| TEST-14.L | UIV-12 | UI-02/04/05/07 loading/empty/error distinct; retry reads only and totals not current-page row count | E2E/component |
| TEST-14.M | UIV-13 | Delay/drop registration response after committed write; UI says unconfirmed, offers own-state check before retry; publication preserves form/checks My Events too | E2E/network harness; internal API/DB confirmation |
| TEST-14.N | UIV-14 | 1440/390 reference layouts, 320px no page overflow; keyboard labels/focus/mobile menu; modal named/traps/restores focus/Escape; long names/zoom readable | E2E where reliable + manual checklist |

Manual checklist must record screen, width/input mode, steps, expected/actual, tester/date, commit and evidence when executed. Toast alone is not important-error feedback. No later-sprint controls/placeholder actions present. Tailwind classes alone do not prove accessibility.

## 6. Actual execution register

All rows deliberately have no actual test name/file/command/commit/evidence. Fill them only from real execution and include failed/skipped cases. Detailed subcase results attach under the group; a group is not PASS if a required subcase failed/skipped.

| Planned TEST | AC | Actual file/name | Method when run | Result | Tested commit / evidence |
|---|---|---|---|---|---|
| TEST-01 | AC-01 | — | API/DB | NOT RUN | — |
| TEST-02 | AC-02 | — | API/DB + UI supplement | NOT RUN | — |
| TEST-03 | AC-03 | — | Unit + API/DB | NOT RUN | — |
| TEST-04 | AC-04 | — | API/DB + E2E | NOT RUN | — |
| TEST-05 | AC-05 | — | API/DB | NOT RUN | — |
| TEST-06 | AC-06 | — | Concurrent API/DB | NOT RUN | — |
| TEST-07 | AC-07 | — | Concurrent API/DB | NOT RUN | — |
| TEST-08 | AC-08 | — | API/DB + E2E | NOT RUN | — |
| TEST-09 | AC-09 | — | Parameterized API/DB | NOT RUN | — |
| TEST-10 | AC-10 | — | Process/API/DB + demo | NOT RUN | — |
| TEST-11 | AC-11 | — | API/DB | NOT RUN | — |
| TEST-12 | AC-12 | — | Unit + DB/API/log | NOT RUN | — |
| TEST-13 | AC-13 | — | Fresh setup/build/commands | NOT RUN | — |
| TEST-14 | AC-14 | — | E2E/component/manual by case | NOT RUN | — |
| TEST-15 | AC-15 | — | API/DB | NOT RUN | — |

For meaningful TDD retain intended-behavior failing output + version and passing output + version and reason for correction. No fabricated historical red/green, screenshot, reviewer or test counts. Build/format/link checks on documentation are not execution of this STS.

## Revision history

| Version | Date | Change | Review / results |
|---|---|---|---|
| 0.1 | 2026-11-06 | Fixtures, TEST-01–15 steps/outcomes, contention/restart/API/UI design and empty actual-result register | Pending teammate review; all NOT RUN |
| 0.2 | 2026-11-10 | Added Prisma transaction, timeout and commit-ambiguity verification while retaining race criteria | Pending teammate review; all NOT RUN |
| 0.3 | 2026-11-11 | Linked SYS-01 reset safety checks, including equivalent URLs and test-only identity | Pending teammate review; all NOT RUN |
| 0.4 | 2026-11-26 | Added Lab 7 capacity boundary cases and synthetic legacy-read compatibility coverage; no tests executed | Pending teammate review; all NOT RUN |
| 0.5 | 2026-11-26 | Added synthetic legacy registration compatibility case under the stored capacity; no tests executed | Pending teammate review; all NOT RUN |
