# Actual automated test excerpts

27 November 2026 (Asia/Bangkok). Refs #45. These are verbatim selected tests from the combined source `7c85dcc3e762c7f2be62a2285264af8aa4f9a972`, matching PR #69 head `cc55b4a`. They supplement the full contracts/completion matrix; they do not replace missing human/deployment evidence.

## Domain transition and real persistence — F07 AC01 / T07-01

Source: [check-ins.test.ts](../../../server/tests/integration/check-ins.test.ts), line 87. Setup verifies separate app/test database identities and the test marker, creates unique users including an owner and Participant, uses real Argon2 authentication and a PostgreSQL-backed Express app with an injected server clock. fixture() creates a published event; registration() inserts its ACTIVE registration; login(owner) obtains the real session cookie and replacement CSRF token. now = initialStart selects the valid creation boundary. No public test bypass or fake database is used.

```typescript
  it('persists eligible attendance and retrieves the original actor/time without changing seats or version', async () => {
    const event = await fixture(), row = await registration(event.id), session = await login(owner);
    now = initialStart;
    const before = await prisma.event.findUniqueOrThrow({ where: { id: event.id } });
    const read = await roster(event.id, session); expect(read.status).toBe(200); expect((await read.json()).data.registrations[0].attendance).toBeNull();
    const response = await checkIn(event.id, row.id, session); expect(response.status).toBe(201);
    const saved = (await response.json()).data;
    expect(saved).toMatchObject({ registrationId: row.id, checkedInAt: new Date(now).toISOString() });
    const db = await prisma.attendance.findUniqueOrThrow({ where: { registrationId: row.id } });
    expect(db.checkedInBy).toBe(owner); expect(db.id).toBe(saved.id);
    const result = (await (await roster(event.id, session)).json()).data;
    expect(result.registrations[0].attendance).toEqual({ id: db.id, checkedInAt: db.checkedInAt.toISOString() });
    expect(result.summary).toEqual({ activeRegistrations: 1, attended: 1 });
    expect(await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).toEqual(before);
    expect(await prisma.registration.findUniqueOrThrow({ where: { id: row.id } })).toEqual(row);
  });
```

The saved API ID is matched to the actual database row and subsequent authorized GET. Actor/time, summary and unchanged event/registration values are asserted, so this is more than an HTTP-success or UI-only check.

Reproduce this selected assertion on the prepared guarded databases:

```text
npm exec --workspace server -- vitest run tests/integration/check-ins.test.ts -t "persists eligible attendance"
```

Actual history: RED `643dac5` expected201/received409 (1 failed), GREEN `0faf42a1d3812deb59554763f6fe245507e719b2`; [original execution record](../sprint-3/f-07-evidence.md). [C69 actual logs](ci-excerpt.md) show the full check-ins file20/20 PASS and integration128/128 PASS. This compilation did not run this focused command again because loopback is restricted.

## Direct backend access restriction — F05 AC05 / T05-05

Source: [cancellation.test.ts](../../../server/tests/integration/cancellation.test.ts), line 140. Setup verifies the same two-database guard, creates unique owner/P1/P2 fixture accounts and a published event with one real ACTIVE P1 registration. login(p1), login(p2), login(owner) create valid sessions and valid CSRF tokens before the negative matrix. The successful own-cancellation positive control is a separate real test in the same file (the F05 RED/GREEN case). fixture() and active() query PostgreSQL; neither supplies an authorization result.

```typescript
  it('rejects anonymous, wrong-role, non-owner, invalid inputs and bad CSRF without leaks or writes', async () => {
    const { event, registration } = await fixture(); const own = await login(p1), other = await login(p2), organizer = await login(owner);
    const cases: Array<[Promise<Response>, number]> = [
      [request(`/api/me/registrations/${registration.id}/cancel`, undefined, 'POST', {}), 401],
      [cancel(registration.id, organizer), 403], [cancel(registration.id, other), 404], [cancel(randomUUID(), own), 404],
      [cancel('not-a-uuid', own), 422], [request(`/api/me/registrations/${registration.id}/cancel?x=1`, own, 'POST', {}), 422],
      [request(`/api/me/registrations/${registration.id}/cancel`, own, 'POST', { participantId: p2 }), 422],
      [request(`/api/me/registrations/${registration.id}/cancel`, own, 'POST', []), 422],
      [cancel(registration.id, { ...own, token: 'wrong-token' }), 403],
    ];
    for (const [pending, status] of cases) {
      const response = await pending; expect(response.status).toBe(status);
      const text = JSON.stringify(await response.json()); expect(text).not.toContain(registration.id); expect(text).not.toContain(secret); expect(text).not.toContain('passwordHash');
    }
    expect((await request(`/api/me/registrations/${registration.id}`, other)).status).toBe(404);
    expect(await active(event.id)).toBe(1);
  });
```

Anonymous401, wrong-role403 and other-Participant404 are tested with otherwise valid resources/session controls. Invalid/forged requests and bad CSRF also reject. Denial bodies exclude the registration ID, credential value and hash field; the original ACTIVE count remains1. Instructor denial is an additional assertion in instructor.test.ts, not silently attributed to this pre-Instructor matrix.

```text
npm exec --workspace server -- vitest run tests/integration/cancellation.test.ts -t "rejects anonymous, wrong-role"
```

Actual result: [C69 logs](ci-excerpt.md) show cancellation.test.ts13/13 PASS. F05 original domain RED `4688652` (1 failed/11 skipped) → GREEN `60423732af75b4155aff13553ff3f57fe5e262ac`; [evidence](../sprint-2/f-05-evidence.md). The access matrix is later verification; it is not presented as a separate invented failing TDD cycle.

## Actual CI file summaries (UTC)

```text
2026-11-27T11:30:59.9388591Z tests/integration/check-ins.test.ts (20 tests) PASS
2026-11-27T11:31:15.7870227Z tests/integration/cancellation.test.ts (13 tests) PASS
2026-11-27T11:31:18.6368204Z Tests 128 passed (128)
```

The selected file-summary lines above normalize the checkmark symbol for readability; counts/times are from job140478323371. The [candidate attempt](candidate-verification.md) retains the later local environment failures separately. Embed these code blocks and relevant setup/results directly in the final PDF; links alone do not satisfy the required excerpts.
