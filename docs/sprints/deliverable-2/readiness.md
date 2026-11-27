# Readiness, findings and completion plan

27 November 2026 (Asia/Bangkok). Refs #45. **Not ready to declare the D2 release/submission complete.** F05/F06/F09 and selected acceptance additions are reviewed/integrated; meaningful F07 implementation is reviewed/integrated. Historical CI passes the combined runtime. Current source has local typecheck/build PASS, user-run serialized unit93/93 PASS, and user-reported integration128/128 PASS after the synthetic seed fix (raw final test log still needs to be retained). Browser/final journeys and G06 release/deployment remain open. F08 is contract-only.

## Change / finding register

| ID / source | Affected scope | Accepted decision / evidence | Current disposition / release / retest |
|---|---|---|---|
| D2-C01 / Lab7 #52/#53, contract #56, implementation #60 | BR01/F02, legacy F03/F06 | New publish integer1–60; preserve existing capacity/IDs/registrations; explicit edit1–60, omission preserves legacy | Lab7 release #62 synchronized via #64; C69 publication/legacy tests PASS. Live inventory and D2 post-deploy retest not established here |
| D2-C02 / shared locks/version #55/#59 | BR02/03/08/12; F03/05/06/09 | Shared event row transaction; schedule mutex before event lock for schedule writers; additive management version | Integrated; C69 observed contention/rollback/no-op/version assertions PASS; final candidate release mapping pending |
| D2-F01 / #68 selected G01–04 | F05 deadline re-register; F09 restart/races/access/UI | Retain direct missing selections; fix actual Instructor UI pending/private-state/unmount defects without weakening assertions | #68 approved/merged3a22a71; final C69 acceptance13 API/11 browser selections PASS. G05–06 remain |
| D2-F02 / #68/#69 peer reviews | NFR06 delayed logout tests | Non-blocking recommendation: observe delayed response callback completion rather than two animation frames | OPEN debt; no runtime/test change included here; JeffMerry to address on bounded test branch and rerun affected tests |
| D2-F03 / this local candidate attempt | NFR05/CI reproducibility | Preserve environment restriction as observed failure, not a domain RED or hidden skip | Agent-run unit87 PASS/6 FAIL (loopback EACCES), Docker denied; typecheck/build PASS. User default run no tests/10 memory errors; serialized user unit93 PASS. Pinned full CI/final journeys still needed |
| D2-F04 / prior RegMeUp Lab6 UAT source | Original slice and received findings | Keep our product findings separate from DineQueue tests we performed | Historical accepted Sprint1 identity3eba355 retained; [Lab7 metrics](../../evidence/lab7/metrics-readiness.md) and retest image directories are source leads. Exact received UAT finding dispositions/release/retest reconciliation still PENDING; images alone do not establish closure |
| D2-F05 / feature-completion reconciliation | F05 AC06 / T05-06 | Historical helper-writer/cancel-one-new-registrant tests are not automatically two-new-registrants-after-cancel coverage | OPEN selection: inspect/add explicit integrated case with observed waits and active uniqueness/count invariants before claiming full STS completion |
| D2-F06 / human accessibility and cloud durability | NFR02/06/07; F09 AC06; F07 AC07–08 | Local app-process restart and automated focus/layout do not establish cloud redeploy or actual screen-reader operation | NOT RUN on submitted D2 revision; named tester and before/after IDs required |

This register records current disposition, not approval of unperformed future work. [Original decisions](../sprint-2/decisions.md), [review provenance](../sprint-2/review-record.md), [feature completion](feature-completion.md) and [candidate execution](candidate-verification.md) retain detailed sources. No unrelated DineQueue outcome is used to close a RegMeUp finding.

## Remaining-work plan

Targets are proposed, not achieved. JeffMerry owns remaining implementation/tests/evidence; THN4 supplies different-teammate review. Preserve THN4's historical F09 implementation credit. Examination period1–11Dec limits capacity; implement the major remaining F08 workflow before that period, reserving12–13Dec for bounded verification/video/release rather than main product implementation.

| Feature / AC / defect | Achieved status | Next action / dependency | Owner / target Bangkok |
|---|---|---|---|
| G05 all integrated Sprint2 + F07 | Reviewed source7c85dcc; C69 historical combined pass; current serialized unit93/93 PASS; user-reported integration128/128 PASS after seed fix | Retain actual integration output/exit code; fresh pinned full CI or equivalent browser/build; selected Sprint1 continuity + two S2 + F07 journeys; THN4 assessment | JeffMerry;28Nov |
| D2-F05 / F05 AC06 | Existing cancel/register/helper/real capacity tests pass | Explicit two competing new registrants after cancel selection; bounded test PR if absent, actual lock observation and no duplicate/oversubscription | JeffMerry;28Nov before full completion claim |
| D2-F02 / delayed callbacks | Non-blocking review accepted staging | Improve observable synchronization on separate bounded test branch; run both affected tests/full relevant browser scope | JeffMerry;28–30Nov |
| G06 main release/deployment | Not executed for this candidate | Reviewed release PR→main; successful CI/deploy/migrations; digest/revision/traffic/URL; post-deploy domain rejection/access and retained IDs after redeploy | JeffMerry, THN4 review;28–29Nov |
| Received RegMeUp UAT / D2-F04 | Historical artifacts exist, reconciliation incomplete | Identify each received finding/source, accepted decision, actual fix release and retest; obtain missing peer retest evidence | JeffMerry + actual tester;29Nov, unresolved follow-up by30Nov |
| PDF + submission | Required sources organized, PDF not assembled | Embed full A–E docs and code/screens/logs, page navigation, source/deploy/hash/contributions; teammate verifies; named human submits | JeffMerry;29Nov23:59; human submitter TBD |
| F08 AC01–03 / FR09 BR10 | Contracts/Q09 ready; no code/tests | Test-first unique-person/current-state counts and consistent snapshot across lifecycle, implement real API/query and report UI; depend on F07 persisted data | JeffMerry;28–30Nov |
| F08 AC04–05 / NFR01 | Contract-only | Owner/session/role/DTO/no-write matrix;21+ distinct-person tied-name paging and same-snapshot totals | JeffMerry;30Nov; THN4 review |
| F08 AC06 / NFR02/06 | Contract-only | Saved new-process retrieval, empty/error/expiry/reload/keyboard/responsive; human tester observations separate | JeffMerry;30Nov core checks, bounded follow-up by12Dec |
| F07 AC07–08, F09 AC06 / D2-F06 | Automated process/persistence/layout pass | Actual deployed retained-ID retrieval; named human keyboard/Escape/screen-reader and resulting fixes | JeffMerry + actual tester;critical D2 checks29Nov, remainder by30Nov/12Dec |
| F10 / UI refinement | Existing plan only | Triage concrete findings without deferring baseline accessibility; bounded fixes with regression/review | JeffMerry;30Nov then short exam-period checks as available |
| Final regression/UAT/video/release | Future work | Re-test received defects and remaining AC; integrated regression; final video and reviewed release with immutable identity | JeffMerry + THN4 review;12–13Dec |

If a target cannot be met, disclose the specific incomplete AC and adjust the dated plan. Do not move required Sprint2 AC to Sprint3 just to label Sprint2 complete. The full [requirement matrix](current-traceability.md) identifies uncovered F08 and remaining human/cloud checks. No release/submission readiness approval follows from this plan.
