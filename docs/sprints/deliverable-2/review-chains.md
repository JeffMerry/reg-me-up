# Selected Issue / PR / review chains

27 November 2026 (Asia/Bangkok). Refs #45. GitHub PR metadata and actual reviews were read for both chains below. [CI excerpt](ci-excerpt.md) independently verifies the later combined implementation. Main/release identity remains TBD; a closed feature issue alone does not establish release acceptance.

## Chain 1 — F05 cancellation

| Stage | Actual identity / result |
|---|---|
| Issue / author | [#41](https://github.com/JeffMerry/reg-me-up/issues/41), implementation author JeffMerry |
| Contract and test design before implementation | `2093a5a` initial Sprint2 contracts; `a66679f` confirmed policies/ownership; reviewed planning #51 merged before F05. [Review provenance](../sprint-2/review-record.md) |
| Prerequisite / base | Shared lock #55 merged at `ff97517084a40ed66e4ef6e900d2da1ec533274a` |
| Branch / PR | `feature/f-05-cancellation` → `sprint/02-staging`, [#57](https://github.com/JeffMerry/reg-me-up/pull/57) |
| Domain RED | `4688652ee285bae4d34cc086f86770c9c1d6487d`,26Nov19:20:22 Bangkok source; actual own ACTIVE cancellation still ACTIVE,1 failed/11 skipped in focused run |
| GREEN | `60423732af75b4155aff13553ff3f57fe5e262ac`; same intended persisted transition passes; later tests extend scope without invented RED cycles |
| Reviewed head | `28bee49bbf9cd47477cd3e7e48cf32ed2b9be048` |
| Teammate review | [THN4 APPROVED6074898983](https://github.com/JeffMerry/reg-me-up/pull/57#pullrequestreview-6074898983),26Nov20:24:37 Bangkok |
| Review substance | Checked session/role/ownership/CSRF and cutoff after event lock; retained CANCELLED history/time; repeat does not return another seat; new registration ID preserves history; additive migration and regression. Explicit follow-up: F06/F09 integration and release/UAT |
| Feature CI | Run45825030762, PR test merge `f61e4300442ebfe6d8b2bd0a391a3f81dbdc54cd`:55 unit/58 integration/43 browser plus migration/typecheck/build/Docker, as recorded by actual review |
| Staging integration | `bd8bf1a97a53e30eaa60a5a0a689b13af0e0f149`,26Nov20:31:01 Bangkok |
| Later integration verification | #65 F06, #66 F09, #68 selected acceptance additions; combined C69 cancellation13 cases + total93/128/87 PASS. [AC completion](feature-completion.md) retains remaining selections |
| Accepted main release / deployment | TBD; no deployment by this compilation |

## Chain 2 — F06 event management

| Stage | Actual identity / result |
|---|---|
| Issue / author | [#42](https://github.com/JeffMerry/reg-me-up/issues/42), implementation author JeffMerry |
| Contract and test design before implementation | Same reviewed Sprint2 contract chain #51; confirmed explicit/omitted legacy policy. Original pure-rule RED `c0cb1ad` → GREEN `fde153f` |
| Maintenance integration | Lab7 sync #64 source `73d4fc9` merged into feature as `79d14155d09834c3d7f59da26f613d9751932bce`; actual legacy omission regression reproduced before GREEN `bb7ecbc` |
| Branch / PR | `feature/f-06-event-management` → `sprint/02-staging`, [#65](https://github.com/JeffMerry/reg-me-up/pull/65) |
| Domain API RED | `be12e5dc55217dbd812b255292b89961d0eb2a6c`,27Nov11:10:10 Bangkok source; authorized PATCH scaffold returns original title rather than Updated workshop;1 failed |
| GREEN | `4cce15d0822953c86a25c91e52165c1bba5724de`; persisted edit/version implemented and same intended assertion passes |
| Reviewed head | `81df0a40ad98afd087230a0ac0e84ac94d3e14d4` |
| Teammate review | [THN4 APPROVED6083618119](https://github.com/JeffMerry/reg-me-up/pull/65#pullrequestreview-6083618119),27Nov11:49:35 Bangkok |
| Review substance | Checked schedule mutex→event row lock, expectedVersion/no-op, explicit1–60 and >=ACTIVE, omitted legacy>60 retention, cutoff/duplicate precedence, additive migration and UI conflict/unknown/expiry. Explicit remaining Instructor integration/release/UAT |
| Feature CI | Run45939679623, test merge `2b7b19a1fc07b76bb3a345d017671d2509efe0e6`:87 unit/81 integration/57 browser plus migration/typecheck/build/Docker, as recorded by actual review |
| Staging integration | `b8ad3e2cca223edb841f6ed56f64c4be690b9317`,27Nov11:53:49 Bangkok |
| Later integration verification | #66 implements Instructor read/overlap and assign-vs-edit; #68 adds adjacency/race/rollback/restart/access/UI; C69 management17 + acceptance13 + Instructor11 cases pass within full128 integration |
| Accepted main release / deployment | TBD; final G05–06 evidence still required |

Dates label source commit, review and merge separately; no claim that a commit timestamp equals a test execution time. [F05](../sprint-2/f-05-evidence.md) and [F06](../sprint-2/f-06-evidence.md) preserve exact commands and original execution limits.

## Follow-up review record

#68/#69 actual reviews are in the [index](evidence-index.md). Their non-blocking request to replace two animation frames with observable delayed-callback synchronization remains OPEN; this docs change does not silently alter browser tests. The evidence-CI update requested in #69 is supplied by [F07 evidence](../sprint-3/f-07-evidence.md) and [actual log excerpt](ci-excerpt.md).

Historical F09 implementation remains credited to THN4 with JeffMerry review; later assignment of remaining work to JeffMerry does not reattribute it. Human test execution supplied during this session is credited separately in the [candidate record](candidate-verification.md).
