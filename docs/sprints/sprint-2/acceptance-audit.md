# Sprint 2 acceptance audit — 27 November 2026

Owner of remaining work: Kittithat (JeffMerry); peer reviewer: Thanatip (THN4). Refs #42/#43/#45. Audited source: staging `40a4db213ece980c2f6313a9e68c3ed8a6300447`, after F-09 #66. **Source/evidence inspection only; no new runtime test or deployment was executed for this audit.**

## Established evidence

F-05 #57, F-06 #65 and F-09 #66 are merged. THN4 approved F-06 on27Nov at04:49:35UTC against `81df0a4`; JeffMerry approved F-09 on27Nov at08:58:48UTC against `65e4753`. These are actual different-teammate reviews, not AI approvals. [F-09 latest CI](https://github.com/JeffMerry/reg-me-up/actions/runs/45969108634) passed on that reviewed head; earlier [full CI at0dd4800](https://github.com/JeffMerry/reg-me-up/actions/runs/45966205796) records93 unit/94 integration/62 browser plus migrations/typecheck/build/Docker. The doc-only follow-up and merge do not establish a new main release or post-deploy acceptance.

Existing evidence: [F-05](f-05-evidence.md), [F-06](f-06-evidence.md), [F-09](f-09-evidence.md), [STS](sts.md), [Lab7 synchronization](lab7-sync-evidence.md). Historical NOT RUN statements remain historical unless superseded below for an explicitly executed case. An entire STS range is not passed merely because its file/suite passed.

| Feature / AC | What is established by inspected tests/code | What is still required |
|---|---|---|
| F05 AC01–03 | Persisted cancellation/seat return; exact start boundaries; stable repeat/history and concurrent same-ID checks | Selected final candidate/post-deploy journey |
| F05 AC04 | New registration ID/history after cancel; F06 separately tests explicit cutoff and duplicate priority | Direct combined cancel→re-register before/at explicit deadline; closed new registration preserves old cancelled history |
| F05 AC05 | Existing-role matrix plus F09 Instructor denied registration/cancel/private registrants | Final matrix reconciliation and deployment checks |
| F05 AC06 | Subprocess restart, browser history/reconciliation/responsive; cancellation/register/shared writer contention; F06 actual capacity/cancel endpoint test | Candidate acceptance evidence, then post-deploy persistence |
| F06 AC01–06 | Partial edit/legacy preservation, version/no-op,1–60/ACTIVE count, deadline−1/0/+1ms, invalid/access, synchronized real edit/register/cancel races, rollback | Selected final candidate/release journey |
| F06 AC07 overlap | `instructor.test.ts`: assigned-event time edit409 without mutation; real assign-vs-edit waits on mutex334/2, at most one competing mutation commits; safe current Instructor DTO | Explicit assigned-event adjacent time-edit success/remaining boundary matrix; cloud persistence |
| F09 AC01–02 | Assign/replace/remove/no-op/version/history and former Instructor404 on next read | Removal stale/started/no-op boundaries and forced assignment rollback/history invariants where not covered |
| F09 AC03 | Pure overlap6 cases; API overlap/adjacency; cross-event assign-vs-F06-edit concurrency | Direct concurrent assign-vs-assign to two overlapping events; same-event competing-version requests; forced rollback |
| F09 AC04–05 | Instructor session/logout/eight-hour expiry; current-only teaching list21 rows; owner/role/CSRF safe DTO/forbidden operations | Fill missing full access-matrix entries (anonymous/removal/teaching wrong role/unassigned) and equal-start pagination tie if not directly exercised |
| F09 AC06 / NFR07 | Migration rehearsal, defaults/constraints, demo provisioning/seed repeat checks, real DB persistence through reads | Assignment retrieved by a new app process without reseed; deployment/redeploy persistence. Existing F05/F06 restart tests do not prove this assignment path |
| F09 AC07 | Owner assign/replace/remove/reload; Instructor teaching happy path and320/390/1440 keyboard/layout | Empty/error/stale/pending/uncertain/expiry flows are not exercised by the five F09 browser cases; add selected meaningful checks and fix any observed defect |

## Closure queue

Implementation branch for S2-G01–04: `test/sprint-2-acceptance`, starting at reviewed staging `13ea49f` after #67. It is tracked under #45 and opens a PR back to staging. Planned/NOT RUN until execution results are recorded; F07 remains separate on `feature/f-07-check-in` under #44.

These are **verification gaps**, not assertions that the implementation is broken. Preserve the existing positive/negative assertions; do not satisfy gaps by renaming unrelated passing tests.

| ID | Owner / action | Expected result / evidence | Gate |
|---|---|---|---|
| S2-G01 | JeffMerry: cancel/re-register with explicit deadline | Before cutoff new ID; at cutoff409/no insert; old history retrievable and seat count consistent | Before Sprint2 acceptance |
| S2-G02 | JeffMerry: new application process reads current Instructor and teaching detail | Same assignment/IDs after process restart, no seed; forbidden former/unassigned read remains404 | Before Sprint2 acceptance |
| S2-G03 | JeffMerry: complete schedule/version/rollback boundary selection | Observed lock waits, at most one overlapping assignment; stable versions/history on denial/rollback; adjacent F06 edit allowed | Before Sprint2 acceptance |
| S2-G04 | JeffMerry: Instructor UI failure/session/pending/reconciliation selection | No fabricated assignment/private cache flash; mutation retry only after status reload; pending navigation cannot corrupt displayed state | Before Sprint2 acceptance |
| S2-G05 | JeffMerry: fresh combined candidate regression + reviewer-selected acceptance journeys | Record exact SHA/commands/results; success, rejection, forbidden API, saved retrieval for two Sprint2 features | Release PR |
| S2-G06 | JeffMerry: main deployment/redeploy and human UAT evidence | mainSHA→run→digest→revision→URL/time; domain journeys and data retained; actual human result separate from CI | #45 acceptance/submission |

THN4 reviews bounded changes and final evidence. Do not reopen historical merged work or claim old Issue closure is acceptance; #45 and its linked gap register track remaining release obligations. No local/production account reset or automatic seed is required by this audit.

## Next work order

1. Review Sprint3 contracts and confirmed Q09 counting/window policy in [Sprint3 plan](../sprint-3/README.md); preserve the design revision before check-in implementation.
2. Close S2-G01–04 on a small branch from current staging, with meaningful added checks; resolve actual failures if found. This work is independent of Q09 implementation.
3. Implement the reviewed F07 workflow under #44; retain RED/GREEN and server-authorized UI→API→DB evidence. F08 contract is complete before implementation; its status remains explicit.
4. Reconcile all AC/STS against actual tests, then stage reviewed release(s). Preserve an immutable Sprint2 checkpoint identity before later Sprint3 work so D2 continuity is traceable.
5. Follow the [delivery plan](../deliverable-2/plan.md), reviewed main promotion and actual post-deploy verification. Human LEB2 submission remains explicit.
