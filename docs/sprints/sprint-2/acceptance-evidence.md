# Sprint 2 acceptance gap evidence — 27 November 2026

Current reconciliation: [THN4 APPROVED review6087075354](https://github.com/JeffMerry/reg-me-up/pull/68#pullrequestreview-6087075354) on27Nov2026 17:55:37 Asia/Bangkok approved head `50d6943f3ce869150f47d201989d64e13005c48f` for staging integration and records CI93 unit/107 integration/73 browser plus migrations/typecheck/build/Docker. PR #68 is integrated at `3a22a71d936f3aa52ad6d6d3e1a30e95467fc9c7`. This supersedes historical pending-review text below; selected G01–04 are integrated, while G05–06 remain pending. The review's non-blocking delayed-logout synchronization follow-up is tracked in the [Deliverable2 evidence index](../deliverable-2/evidence-index.md).

Refs #45. Branch `test/sprint-2-acceptance` → `sprint/02-staging`. Implementer/tester: JeffMerry; peer review: THN4, pending. This closes the selected local verification work S2-G01–04, subject to PR/CI/review. S2-G05–06, accepted release, deployment, human UAT and submission remain pending. F07/F08 implementation is outside this PR.

## Versions and actual execution

| Stage | Immutable version | Result |
|---|---|---|
| Reviewed starting point | `13ea49f4df140a1e3e4f39ed8b09290f97253cb1` | Staging after contract PR #67; existing F05/F06/F09 and Lab7 |
| Branch/issue scope recorded | `0b7b050` | Explicit branch allocation before tests |
| Added acceptance tests | `96f2f933585e687110e65a1b011eb9a41e279e2c` | 13 API/DB and 11 browser cases; runtime unchanged |
| Corrected delayed-response test wait | `77d0e7f` | Focused logout case RED: 1 assertion failure; received protected login URL after explicit logout instead of `/events` |
| Runtime correction / local GREEN | `5036b1d6cfb5b7866e41d6371e344fe751631472` | New API/DB 13/13; new browser 11/11; full integration 107/107 in 11 files; unit 93/93 in 10 files; typecheck/build PASS |

Commands (repository root, pinned Node22.23.4/npm10.9.9):

```text
npm exec --workspace server -- vitest run tests/integration/sprint2-acceptance.test.ts
npm run test:integration
npm run test:unit
npm run typecheck
npm run build
npx playwright test e2e/sprint2-acceptance.spec.ts
```

Local execution used guarded separate app/test databases on a disposable native PostgreSQL17.11 cluster, UTC; all five existing migrations applied to both, then repeat migration found none pending. Explicit synthetic provisioning happened before tests. Restart case launches a new app process against existing test data without reseeding. Fixtures and cleanup are scoped to generated test account/event IDs; no production database was used. Local Playwright override retained the repository servers/ports, used installed Chrome, an ignored output directory and video off. Full browser regression and Docker are deferred to CI below. No cloud redeploy or human UAT is inferred. Local logs: `tmp/acceptance-green.log`, `acceptance-regression.log`, `acceptance-browser.log` (ignored, not durable review evidence). Build emitted its existing >500kB bundle-size advisory; build succeeded.

## Actual RED → GREEN

On unchanged runtime at `96f2f93`, the browser selection produced 7 passes, 3 semantic assertion failures (pending pagination, private state after403 and404), and 1 harness timeout while waiting for `networkidle` after delayed401. The timeout is not counted as a product-rule failure. Trying response-body completion also stalled; the final test at `77d0e7f` waits for response headers and two browser rendering frames, then asserts observable navigation. Its focused run fails with the actual wrong login URL, so the logout defect has a separate reproducible semantic RED. Run it on that commit with:

```text
npx playwright test e2e/sprint2-acceptance.spec.ts -g "ignores a delayed expired mutation"
```

Representative RED output:

```text
Next Instructors: expected disabled, received enabled
403/404 alert: expected "Event not found."
received "We could not confirm the change. Reload the event before trying again."
after logout + delayed PUT401:
expected /events; received /login?returnTo=.../instructor
```

`5036b1d` disables directory pagination while saving/blocked, prevents concurrent local mutation entry, clears event/directory/selection on403/404, and ignores mutation callbacks after the view unmounts. Read callbacks check abort before expiry/missing side effects. The uncertain-write flow still requires an explicit successful status read and never auto-retries the mutation. GREEN: all 11 browser cases pass; API tests required no server/domain change and passed first execution. These are acceptance regression tests against existing rules, not a claim that all 24 cases were developed with failing domain stubs.

## Selected gap / AC mapping

All API cases below are in `server/tests/integration/sprint2-acceptance.test.ts`; browser cases in `e2e/sprint2-acceptance.spec.ts`. Counts identify test cases, not a coverage percentage or an entire AC range.

| Gap / related AC | Actual selection and assertions | Result |
|---|---|---|
| G01 / F05 AC04, F06 cutoff | 3 cases at explicit deadline−1/0/+1ms: cancel existing ACTIVE, attempt new registration, new ID only before cutoff,409/no insertion at/after, original cancelled history/time retained, repeated cancellation stable, owner ACTIVE/remaining totals exact | 3 API/DB PASS |
| G02 / F09 AC06, NFR07 | Assign I1 then replace with I2; launch separate Node process; login/read current teaching detail and owner version2/I2, former Instructor404, assignment IDs/history unchanged, no reseed | 1 API/DB PASS |
| G03 / F09 AC03 and F06 AC07 | Direct assign/assign for overlapping events and same event/version: observe two actual mutex334/2 waiters before release; first200/second409; one current history row, correct version, unchanged denied event | 2 API/DB PASS |
| G03 / F06 AC07 | Already-assigned second event edited to exact adjacency succeeds; one-millisecond overlap409; denied stored event unchanged | 1 API/DB PASS |
| G03 / F09 AC01–02 | Remove at start−1/0/+1ms; exact start denied, no-op/stale and history/version invariants asserted | 3 API/DB PASS |
| G03 / F09 AC01–03 | Test-only trigger forces final event UPDATE failure during replace/remove; compare full persisted event and assignment history to pre-write snapshot | 2 API/DB PASS |
| G03 / F09 AC04–05 | Anonymous owner directory/detail/teaching/removal401; Participant/Instructor removal403; Organizer/Participant teaching403; other owner/unassigned404; bad CSRF/Origin403; unsupported query/body422; exact safe teaching DTO; history/version unchanged | 1 API/DB PASS |
| G04 / F09 AC07, NFR06 | Owner read500→retry real read→404; teaching empty500→retry and unassigned404; real stale event revision→409→reload authoritative I2; unavailable/started errors block further write (2 cases) | 5 browser PASS |
| G04 / F09 AC07 | Commit real PUT but abort its response; unknown outcome with one PUT; failed explicit status reload remains error, next read finds persisted assignment; no automatic mutation retry | 1 browser PASS |
| G04 / F09 AC07 | >20 Instructor fixture, hold real mutation response: saving/select/next page disabled, one request only, eventual saved state | 1 browser PASS |
| G04 / session/private state | Current mutation401 clears protected content and restores login return path; real logout then delayed real PUT401 cannot redirect disposed view;403 and404 mutation responses clear private event/selection (2 cases) | 4 browser PASS |

UI error/conflict/privacy cases use controlled HTTP responses to exercise client state; they do not independently prove backend status policy. API/DB cases and existing F09 suites establish the corresponding server rules. The lost-response, pending-save, stale-edit and delayed-logout cases use real server/database operations.

### Teaching equal-start pagination tie disposition

The existing F09 teaching-list test covers21 valid adjacent events and page boundaries. Two positive-duration events with identical start times assigned currently to one Instructor necessarily overlap; the reviewed F09 write rule rejects that state. Therefore an additional equal-start teaching fixture cannot be reached through valid current APIs. No corrupt direct-DB fixture was manufactured to label that case passed. This selection is **not applicable to valid current assignments**, rather than an executed tie test. If imported/legacy overlapping assignments become supported, reopen this gap and test that data contract explicitly. General deterministic query ordering is not a substitute for an executed fixture.

## Release limitations and next step

S2-G01–04 selected checks have local evidence above; peer acceptance and the PR CI remain distinct gates. After merge, implement reviewed F07 on `feature/f-07-check-in` under #44. Then `docs/deliverable-2` under #45 must reconcile all AC/STS, run exact combined candidate checks G05, prepare reviewed staging→main promotion, record deployment/redeploy and actual human checks G06, and compile the self-contained report. Passing this branch does not close #45 or establish a main release.

## PR CI

[PR #68](https://github.com/JeffMerry/reg-me-up/pull/68), [CI45982996285](https://github.com/JeffMerry/reg-me-up/actions/runs/45982996285), check `test-and-docker`: **SUCCESS**. PR head `56f5b79a3674ee2a7073c73e5c12bc22b53035ff`; checked-out PR merge `b0af4e62da85f29710cd672711f909bd88b06461` (into staging `13ea49f`). Job140451379143 logs record93 unit/107 integration/**73 browser** passed, migrations/seed, offline deployment-script checks, typecheck/production build, and Docker image build. This supersedes local full-browser/Docker pending statements for that tested version. All selected new tests also passed on Linux CI. This is an isolated CI image build, not a deployment. This result update changes documentation only; the PR's latest check must also be green before merge. THN4 review and G05–06 remain pending.
