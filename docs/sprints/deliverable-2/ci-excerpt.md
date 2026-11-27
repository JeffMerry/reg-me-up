# CI execution excerpt — PR #69

Retrieved from actual GitHub job logs on 27 November 2026 (Asia/Bangkok). Refs #45.

[Run45990942080](https://github.com/JeffMerry/reg-me-up/actions/runs/45990942080), [job140478323371](https://github.com/JeffMerry/reg-me-up/actions/runs/45990942080/job/140478323371), check `test-and-docker`, SUCCESS. Head `cc55b4a3761d58c04402ac34793a3a44ddfb4204`; actual checkout is the synthetic PR merge below. Runner Ubuntu24.04; workflow pins Node22.23.4/npm10.9.9 and disposable PostgreSQL17.11. Timestamps below are UTC.

```text
2026-11-27T11:30:16.4276782Z HEAD is now at 4d4e274 Merge cc55b4a3761d58c04402ac34793a3a44ddfb4204 into 3a22a71d936f3aa52ad6d6d3e1a30e95467fc9c7
2026-11-27T11:30:35.8461116Z ##[group]Run npm run test:unit
2026-11-27T11:30:40.2847284Z  Test Files  10 passed (10)
2026-11-27T11:30:40.2848115Z       Tests  93 passed (93)
2026-11-27T11:30:40.3160957Z ##[group]Run npm run test:integration
2026-11-27T11:31:18.6367157Z  Test Files  13 passed (13)
2026-11-27T11:31:18.6368204Z       Tests  128 passed (128)
2026-11-27T11:31:18.6715923Z ##[group]Run npm run typecheck
2026-11-27T11:31:42.1476949Z ##[group]Run export E2E_APP_DATABASE_URL="$DATABASE_URL"
2026-11-27T11:33:04.6194249Z   87 passed (1.4m)
2026-11-27T11:33:38.0598444Z #17 writing image sha256:3539f2b2252e56d91e3630525f3ca7eb946d2e7ca6bbe82f4490fec6a8785c3f done
2026-11-27T11:33:38.0608267Z #17 naming to docker.io/library/regmeup-ci:4d4e2740e1ddcf47d1b4dd784c77c70610d99d8a done
```

Summaries account for all93 unit,128 integration and87 browser cases as passed; none reported failed/skipped in these final summaries. This is a selected excerpt, not a full log or coverage percentage. Job step metadata also reports migrations/seed, offline deployment checks, typecheck/build and Docker build SUCCESS. The image SHA above identifies a local CI build, not a pushed release image digest or a Cloud Run deployment.

No fresh run on documentation branch, actual staging merge `7c85dcc` or submitted main is claimed. The [candidate record](candidate-verification.md) separately records this environment's later execution failure. Preserve both records.
