# F-04 — scoped implementation verification

Verification run locally on 13 November 2026 (Asia/Bangkok). F-04 work is on `feature/f-04-owner-list`; no PR or teammate approval is claimed.

| Check | Actual result |
|---|---|
| `npm run typecheck` | Passed at commit `5196123` (client and server). |
| `npm run build` | Passed at commit `5196123` (client and server). |
| `npm run test:unit` | 7 files, 53 tests passed at commit `5196123`. |
| `npx vitest run tests/integration/events.test.ts` | 1 file, 18 tests passed at commit `5196123`. The suite's database guard verified the application and test database identities and test-only marker before writing synthetic fixtures. |
| `npx playwright test e2e/f-04.spec.ts` | 5/5 passed at commit `52a4db8`. The suite created random synthetic accounts and events only after the test-database guard passed, and cleaned them afterward. |

F-04 integration coverage verifies anonymous `401`, Participant `403`, owner success, non-owner/unknown event safe `404` parity, a public-detail control, UUID/query validation, the `no-store` response, a 21-row two-page result with tied timestamps, safe-field allowlisting, empty event totals and unchanged registration count. The integration file also reruns the F-02/F-03 event API cases; the 18/18 result applies to that complete file.

Playwright coverage verifies browser Back restores the signed-in navigation, the Organizer opens UI-07 from My Events, private rows and summary render, empty and error/retry states remain distinct, Participant and non-owner views reveal no private event/registrant details, and the registration screen has no horizontal overflow at 320px and 390px. The desktop case runs at 1440px.

The test process used Node.js 24.14.0 and npm 11.9.0 although the repository pins Node.js 22.23.4 and npm 10.9.9. Final runs passed in this environment; repeat under the pinned versions for release evidence. The initial default-sandbox attempts could not open local sockets (`EACCES`); reruns with local test connectivity passed. Early Playwright attempts exposed test-helper/locator issues; those were corrected before the final 5/5 run.

These results do not complete the entire TEST-09 authorization matrix across every protected endpoint, all TEST-14 screens/states, manual keyboard/accessibility review, the full product DoD or teammate review. The session-history regression is covered by the F-04 Playwright case; full F-01 verification remains in [F-01 evidence](f-01-evidence.md).
