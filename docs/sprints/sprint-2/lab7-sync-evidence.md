# Lab7 → Sprint2 synchronization plan and evidence

27 November 2026 (Asia/Bangkok). Owner: Kittithat (JeffMerry); teammate review pending. Branch `sync/lab7-into-sprint2` targets `sprint/02-staging` and replaces direct main → staging PR #63, whose head could not be used for conflict resolution without updating main.

## Plan and resolution

1. Start at reviewed staging `882818dd39f8fc93cc058f91d68568882e88dad0` (F-05/shared locks/events.version) and merge main `d49063216b5c997e2452c1b614a35d01335fc3f3` (Lab7 release #62) into a dedicated branch.
2. Resolve all three conflicts by combining content: CI trigger includes lab5-staging/lab7-staging/sprint/02-staging/main; SDS retains Lab7 storage/legacy rules and Sprint2 design; traceability retains both revision histories and evidence links with an explicit current checkpoint.
3. Inspect automatic code merges and run combined-source regression before publishing the candidate.
4. Open a replacement PR, verify fresh CI, and close #63 as superseded. Teammate reviews/merges into staging; deploy/main promotion is a later action.

Merge commit **`d92b4f4f19a2a480ed6c2c64b6937fe006982863`** preserves both parents above. Documentation-only evidence follows that commit. Local main and staging refs were not advanced by this work.

## Semantic inspection

Compared to staging, `registrations.ts`, `event-write.ts`, `app.ts`, Prisma schema/all migrations and server package scripts are unchanged. F-05 history/re-registration and shared locks remain intact, as do events.version and sequential integration-file execution. Server publication validator matches main. In the automatically merged EventViews, changes relative to staging are limited to Lab7 CreateEvent validation/message and capacity min/max/step; the extracted F-05 UI and ACTIVE-history lookup remain present.

No new schema/reset/seed or changes to stored seat counts were introduced. Legacy event capacity61 with60 ACTIVE registrations is tested through the actual registration API, including final-seat success and next-participant rejection. No global capacity<=60 constraint is added.

## Executed combined verification

Environment: pinned Node22.23.4/npm10.9.9; PostgreSQL17.11, existing disposable loopback cluster on port55442, separate app/test databases, verified guard and UTC database setup. Synthetic fixtures only. Browser uses installed Chrome via the documented executable-path override. Local test logs remain under ignored `tmp/sync-*.log`; remote CI is recorded in the replacement PR.

| Check | Actual result on merge source |
|---|---|
| Prisma generate and migration-history/deploy checks on both DBs, repeated on test | Passed; all3 migrations retained, no pending migrations |
| `npm run test:unit` | 63 passed /8 files |
| `npm run test:integration` | 64 passed /7 files; includes Lab7 legacy, F-05, shared lock and version foundation |
| `npm run typecheck` | Passed |
| `npm run build` | Client/server passed |
| `npx playwright test` | 47 passed; F-01–F-05 including4 Lab7 publication cases and10 F-05 cases |
| Conflict-marker scan, unmerged index, `git diff --cached --check` | No remaining markers/unmerged files; diff check passed |

The local PostgreSQL cluster is stopped after checks with data retained. These results establish the selected combined regression, not human UAT/cloud deployment or F-06/F-09 completion.

## Next F-06 integration

After teammate merge of this synchronization PR, take staging into `feature/f-06-event-management`. Its current pure edit preparation reuses publication validation; now that publish rejects capacities>60, adapt edit validation so omitted legacy capacity remains unchanged rather than being rejected by the create validator. Add/execute that branch's omitted-capacity legacy regression during F-06 implementation. This function/API is not present in this staging candidate. Continue real deadline/edit endpoints/UI and Instructor overlap integration separately, without duplicating the version migration or dropping either CI trigger.
