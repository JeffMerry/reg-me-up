import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import type { Server } from 'node:http';
import pg from 'pg';
import argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { createApp } from '../../src/app.js';
import { verifyTestDatabase } from '../../src/test-db-safety.js';

const owner = randomUUID(), outsider = randomUUID(), participant = randomUUID(), instructor1 = randomUUID(), instructor2 = randomUUID();
const secret = 'synthetic-instructor-test-password';
const origin = 'http://localhost:5173';
const initialStart = Date.parse('2030-01-15T02:00:00Z');
let now = initialStart - 3_600_000;
let prisma: PrismaClient, pool: pg.Pool, server: Server, base: string, safe = false;
const applicationName = `acceptance-${owner}`;
type Session = { cookie: string; token: string };

async function request(path: string, session?: Session, method?: string, body?: unknown, url = base) {
  return fetch(url + path, { method: method ?? 'GET', headers: {
    ...(session ? { Cookie: session.cookie, 'X-CSRF-Token': session.token } : {}),
    ...(method ? { Origin: origin, 'Content-Type': 'application/json' } : {}),
  }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
async function login(id: string, url = base): Promise<Session> {
  const bootstrap = await request('/api/auth/csrf', undefined, undefined, undefined, url);
  const initial = { cookie: bootstrap.headers.get('set-cookie')!.split(';')[0], token: (await bootstrap.json()).data.csrfToken as string };
  const response = await request('/api/auth/login', initial, 'POST', { email: `${id}@acceptance.test`, password: secret }, url);
  expect(response.status).toBe(200);
  return { cookie: response.headers.get('set-cookie')!.split(';')[0], token: (await response.json()).data.csrfToken as string };
}
async function fixture(startsAt = initialStart, endsAt = startsAt + 3_600_000, organizerId = owner) {
  return prisma.event.create({ data: { id: randomUUID(), organizerId, title: 'Instructor test event', startsAt: new Date(startsAt), endsAt: new Date(endsAt), location: 'Test room', capacity: 2, publicationStatus: 'PUBLISHED' } });
}
const assign = (id: string, session: Session, instructorId: string, expectedVersion = 0) => request(`/api/organizer/events/${id}/instructor`, session, 'PUT', { instructorId, expectedVersion });
const remove = (id: string, session: Session, expectedVersion: number) => request(`/api/organizer/events/${id}/instructor`, session, 'DELETE', { expectedVersion });
const patch = (id: string, session: Session, body: unknown) => request(`/api/organizer/events/${id}`, session, 'PATCH', body);

beforeAll(async () => {
  if (!process.env.DATABASE_URL || !process.env.TEST_DATABASE_URL) throw new Error('Separate guarded app/test databases required');
  const app = new pg.Client({ connectionString: process.env.DATABASE_URL }); const test = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  try { await app.connect(); await test.connect(); await verifyTestDatabase(app, test); safe = true; }
  finally { await Promise.allSettled([app.end(), test.end()]); }
  pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL, application_name: applicationName }) });
  const hash = await argon2.hash(secret);
  for (const [id, role] of [[owner, 'ORGANIZER'], [outsider, 'ORGANIZER'], [participant, 'PARTICIPANT'], [instructor1, 'INSTRUCTOR'], [instructor2, 'INSTRUCTOR']]) {
    await prisma.user.create({ data: { id, role, email: `${id}@acceptance.test`, passwordHash: hash, displayName: `F09 ${role} ${id.slice(0, 4)}` } });
  }
  server = createApp(async () => {}, { config: { nodeEnv: 'test', port: 3000, databaseUrl: process.env.TEST_DATABASE_URL, sessionSecret: 'synthetic-instructor-session-secret', appOrigin: origin }, pool, prisma, now: () => now }).listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('Missing test port');
  base = `http://127.0.0.1:${address.port}`;
});

beforeEach(async () => {
  now = initialStart - 3_600_000;
  // Keep each schedule independent while retaining only this suite's users.
  await prisma.instructorAssignment.deleteMany({ where: { event: { organizerId: { in: [owner, outsider] } } } });
  await prisma.registration.deleteMany({ where: { event: { organizerId: { in: [owner, outsider] } } } });
  await prisma.event.deleteMany({ where: { organizerId: { in: [owner, outsider] } } });
});

afterAll(async () => {
  if (server) await new Promise<void>(resolve => server.close(() => resolve()));
  if (safe && prisma) {
    await prisma.instructorAssignment.deleteMany({ where: { OR: [{ event: { organizerId: { in: [owner, outsider] } } }, { instructorId: { in: [instructor1, instructor2] } }] } });
    await prisma.registration.deleteMany({ where: { event: { organizerId: { in: [owner, outsider] } } } });
    await prisma.event.deleteMany({ where: { organizerId: { in: [owner, outsider] } } });
    await prisma.$executeRaw`DELETE FROM sessions WHERE sess->>'userId' IN (${owner}, ${outsider}, ${participant}, ${instructor1}, ${instructor2})`;
    await prisma.user.deleteMany({ where: { id: { in: [owner, outsider, participant, instructor1, instructor2] } } });
  }
  await Promise.allSettled([pool?.end(), prisma?.$disconnect()]);
});

describe('Sprint2 acceptance gap selections S2-G01–03', () => {
  it.each([-1, 0, 1])('S2-G01 cancel/re-register uses explicit deadline at offset %s without losing cancelled history', async offset => {
    const event = await fixture(); const organizer = await login(owner), person = await login(participant);
    const cutoff = initialStart - 1_800_000;
    expect((await patch(event.id, organizer, { expectedVersion: 0, registrationDeadline: new Date(cutoff).toISOString() })).status).toBe(200);
    const first = await request(`/api/events/${event.id}/registrations`, person, 'POST', {});
    expect(first.status).toBe(201); const oldId = (await first.json()).data.id as string;
    now = cutoff + offset;
    const cancelled = await request(`/api/me/registrations/${oldId}/cancel`, person, 'POST', {});
    expect(cancelled.status).toBe(200); const history = (await cancelled.json()).data;
    const next = await request(`/api/events/${event.id}/registrations`, person, 'POST', {});
    expect(next.status).toBe(offset < 0 ? 201 : 409);
    if (offset < 0) expect((await next.json()).data.id).not.toBe(oldId);
    else expect((await next.json()).error.code).toBe('REGISTRATION_CLOSED');
    const repeated = await request(`/api/me/registrations/${oldId}/cancel`, person, 'POST', {});
    expect(repeated.status).toBe(200); expect((await repeated.json()).data.cancelledAt).toBe(history.cancelledAt);
    const detail = await request(`/api/me/registrations/${oldId}`, person);
    expect(detail.status).toBe(200); expect((await detail.json()).data).toMatchObject({ status: 'CANCELLED', cancelledAt: history.cancelledAt });
    const rows = await prisma.registration.findMany({ where: { eventId: event.id } });
    expect(rows).toHaveLength(offset < 0 ? 2 : 1); expect(rows.filter(row => row.status === 'ACTIVE')).toHaveLength(offset < 0 ? 1 : 0);
    const totals = (await (await request(`/api/organizer/events/${event.id}/registrations`, organizer)).json()).data.summary;
    expect(totals).toEqual({ capacity: 2, activeRegistrations: offset < 0 ? 1 : 0, remainingSeats: offset < 0 ? 1 : 2 });
  });

  it('S2-G02 retrieves assignment/history and Instructor access from a new app process without reseed', async () => {
    const event = await fixture(); const organizer = await login(owner);
    expect((await assign(event.id, organizer, instructor1)).status).toBe(200);
    expect((await assign(event.id, organizer, instructor2, 1)).status).toBe(200);
    const before = await prisma.instructorAssignment.findMany({ where: { eventId: event.id }, orderBy: { id: 'asc' } });
    let child: ChildProcess | undefined;
    try {
      const probe = createServer(); await new Promise<void>(resolve => probe.listen(0, '127.0.0.1', resolve));
      const address = probe.address(); if (!address || typeof address === 'string') throw new Error('No restart port');
      await new Promise<void>(resolve => probe.close(() => resolve()));
      child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], { cwd: process.cwd(), env: { ...process.env, NODE_ENV: 'test', PORT: String(address.port), DATABASE_URL: process.env.TEST_DATABASE_URL!, APP_ORIGIN: origin, SESSION_SECRET: 'synthetic-acceptance-restart-secret-12345' }, stdio: 'ignore' });
      const url = `http://127.0.0.1:${address.port}`; let ready = false;
      for (let i = 0; i < 100 && !ready; i++) {
        if (child.exitCode !== null) throw new Error('New app process exited');
        try { ready = (await fetch(url + '/api/ready')).ok; } catch { /* startup */ }
        if (!ready) await delay(100);
      }
      expect(ready).toBe(true);
      const current = await login(instructor2, url), former = await login(instructor1, url), ownerSession = await login(owner, url);
      const detail = await request(`/api/me/teaching-events/${event.id}`, current, undefined, undefined, url);
      expect(detail.status).toBe(200); expect((await detail.json()).data).toMatchObject({ id: event.id, title: event.title });
      expect((await request(`/api/me/teaching-events/${event.id}`, former, undefined, undefined, url)).status).toBe(404);
      const owned = (await (await request(`/api/organizer/events/${event.id}`, ownerSession, undefined, undefined, url)).json()).data;
      expect(owned).toMatchObject({ version: 2, currentInstructor: { id: instructor2 } });
      expect(await prisma.instructorAssignment.findMany({ where: { eventId: event.id }, orderBy: { id: 'asc' } })).toEqual(before);
    } finally { if (child && child.exitCode === null) { child.kill(); await new Promise<void>(resolve => child?.once('exit', () => resolve())); } }
  }, 15000);

  async function observeScheduleWaiters(observer: pg.Client, expected: number) {
    const limit = Date.now() + 1800;
    while (Date.now() < limit) {
      const result = await observer.query<{ count: number }>(`SELECT count(*)::int AS count FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock' AND query ILIKE '%pg_advisory_xact_lock%'`, [applicationName]);
      if (result.rows[0].count >= expected) return;
      await delay(10);
    }
    throw new Error(`Expected ${expected} assignment writers waiting on shared mutex`);
  }
  it.each(['two overlapping events', 'same event version'])('S2-G03 serializes direct assign/assign for %s', async mode => {
    const first = await fixture(); const second = mode === 'same event version' ? first : await fixture(); const session = await login(owner);
    const blocker = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL }), observer = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL }); const pending: Promise<Response>[] = [];
    try {
      await blocker.connect(); await observer.connect(); await blocker.query('BEGIN'); await blocker.query('SELECT pg_advisory_xact_lock(334,2)');
      pending.push(assign(first.id, session, instructor1)); await observeScheduleWaiters(observer, 1);
      pending.push(assign(second.id, session, mode === 'same event version' ? instructor2 : instructor1)); await observeScheduleWaiters(observer, 2);
      await blocker.query('COMMIT'); const responses = await Promise.all(pending);
      expect(responses.map(response => response.status)).toEqual([200, 409]);
      expect((await responses[1].json()).error.code).toBe(mode === 'same event version' ? 'EVENT_CHANGED' : 'INSTRUCTOR_UNAVAILABLE');
      const rows = await prisma.instructorAssignment.findMany({ where: { eventId: { in: [first.id, second.id] } } });
      expect(rows).toHaveLength(1); expect(rows[0]).toMatchObject({ eventId: first.id, instructorId: instructor1, endedAt: null });
      expect((await prisma.event.findUniqueOrThrow({ where: { id: first.id } })).version).toBe(1);
      if (mode !== 'same event version') expect((await prisma.event.findUniqueOrThrow({ where: { id: second.id } })).version).toBe(0);
    } finally { await blocker.query('ROLLBACK').catch(() => undefined); await Promise.allSettled(pending); await Promise.allSettled([blocker.end(), observer.end()]); }
  });
  it('S2-G03 allows assigned-event adjacency and rejects one-millisecond overlap without changing state', async () => {
    const first = await fixture(), second = await fixture(initialStart + 7_200_000, initialStart + 10_800_000); const session = await login(owner);
    expect((await assign(first.id, session, instructor1)).status).toBe(200); expect((await assign(second.id, session, instructor1)).status).toBe(200);
    const adjacent = await patch(second.id, session, { expectedVersion: 1, startsAt: new Date(initialStart + 3_600_000).toISOString(), endsAt: new Date(initialStart + 7_200_000).toISOString() });
    expect(adjacent.status).toBe(200); expect((await adjacent.json()).data).toMatchObject({ version: 2, currentInstructor: { id: instructor1 } });
    const before = await prisma.event.findUniqueOrThrow({ where: { id: second.id } });
    const denied = await patch(second.id, session, { expectedVersion: 2, startsAt: new Date(initialStart + 3_600_000 - 1).toISOString() });
    expect(denied.status).toBe(409); expect((await denied.json()).error.code).toBe('INSTRUCTOR_UNAVAILABLE');
    expect(await prisma.event.findUniqueOrThrow({ where: { id: second.id } })).toEqual(before);
  });
  it.each([-1, 0, 1])('S2-G03 enforces removal at start offset %s with stable denied history/version', async offset => {
    const event = await fixture(); const session = await login(owner); expect((await assign(event.id, session, instructor1)).status).toBe(200);
    const before = await prisma.instructorAssignment.findMany({ where: { eventId: event.id } }); now = initialStart + offset;
    const result = await remove(event.id, session, 1); expect(result.status).toBe(offset < 0 ? 200 : 409);
    if (offset < 0) {
      expect((await result.json()).data).toMatchObject({ version: 2, currentInstructor: null });
      const after = await prisma.instructorAssignment.findMany({ where: { eventId: event.id } }); expect(after[0].endedAt).toEqual(new Date(now));
      expect((await remove(event.id, session, 2)).status).toBe(200);
      expect(await prisma.instructorAssignment.findMany({ where: { eventId: event.id } })).toEqual(after);
      expect((await remove(event.id, session, 1)).status).toBe(409);
      now = initialStart; expect((await remove(event.id, session, 2)).status).toBe(409);
      expect((await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).version).toBe(2);
    } else {
      expect((await result.json()).error.code).toBe('EVENT_STARTED');
      expect(await prisma.instructorAssignment.findMany({ where: { eventId: event.id } })).toEqual(before);
      expect((await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).version).toBe(1);
    }
  });
  it.each(['replace', 'remove'])('S2-G03 rolls back %s history and revision when the final event write fails', async mode => {
    const event = await fixture(); const session = await login(owner); expect((await assign(event.id, session, instructor1)).status).toBe(200);
    const before = await prisma.instructorAssignment.findMany({ where: { eventId: event.id }, orderBy: { id: 'asc' } });
    const savedEvent = await prisma.event.findUniqueOrThrow({ where: { id: event.id } });
    const name = `assignment_rollback_${randomUUID().replaceAll('-', '')}`;
    try {
      await prisma.$executeRawUnsafe(`CREATE FUNCTION "${name}"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.id='${event.id}'::uuid THEN RAISE EXCEPTION 'controlled assignment rollback'; END IF; RETURN NEW; END $$`);
      await prisma.$executeRawUnsafe(`CREATE TRIGGER "${name}" AFTER UPDATE ON events FOR EACH ROW EXECUTE FUNCTION "${name}"()`);
      const result = mode === 'replace' ? await assign(event.id, session, instructor2, 1) : await remove(event.id, session, 1);
      expect(result.status).toBe(500); expect(JSON.stringify(await result.json())).not.toContain('controlled assignment rollback');
      expect(await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).toEqual(savedEvent);
      expect(await prisma.instructorAssignment.findMany({ where: { eventId: event.id }, orderBy: { id: 'asc' } })).toEqual(before);
    } finally { await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS "${name}" ON events`); await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS "${name}"()`); }
  });
  it('S2-G03 completes missing teaching/removal access cases without writes or private metadata', async () => {
    const event = await fixture(); const ownerSession = await login(owner), other = await login(outsider), student = await login(participant), current = await login(instructor1), unassigned = await login(instructor2);
    expect((await assign(event.id, ownerSession, instructor1)).status).toBe(200);
    const before = await prisma.instructorAssignment.findMany({ where: { eventId: event.id } });
    for (const path of ['/api/organizer/instructors', `/api/organizer/events/${event.id}`, '/api/me/teaching-events', `/api/me/teaching-events/${event.id}`]) expect((await request(path)).status).toBe(401);
    expect((await request(`/api/organizer/events/${event.id}/instructor`, undefined, 'DELETE', { expectedVersion: 1 })).status).toBe(401);
    for (const session of [student, current]) expect((await remove(event.id, session, 1)).status).toBe(403);
    for (const session of [student, ownerSession]) {
      expect((await request('/api/me/teaching-events', session)).status).toBe(403);
      expect((await request(`/api/me/teaching-events/${event.id}`, session)).status).toBe(403);
    }
    const deniedOwner = await remove(event.id, other, 1); expect(deniedOwner.status).toBe(404); expect(JSON.stringify(await deniedOwner.json())).not.toContain(event.title);
    expect((await request(`/api/me/teaching-events/${event.id}`, unassigned)).status).toBe(404);
    expect((await remove(event.id, { ...ownerSession, token: 'bad-token' }, 1)).status).toBe(403);
    const result = await fetch(base + `/api/organizer/events/${event.id}/instructor`, { method: 'DELETE', headers: { Cookie: ownerSession.cookie, Origin: 'https://invalid.example', 'Content-Type': 'application/json', 'X-CSRF-Token': ownerSession.token }, body: JSON.stringify({ expectedVersion: 1 }) });
    expect(result.status).toBe(403);
    expect((await request(`/api/organizer/events/${event.id}/instructor?extra=1`, ownerSession, 'DELETE', { expectedVersion: 1 })).status).toBe(422);
    expect((await request(`/api/organizer/events/${event.id}/instructor`, ownerSession, 'DELETE', { expectedVersion: 1, instructorId: instructor1 })).status).toBe(422);
    expect((await request('/api/me/teaching-events?page=0', current)).status).toBe(422);
    expect((await request('/api/me/teaching-events?owner=x', current)).status).toBe(422);
    const detail = (await (await request(`/api/me/teaching-events/${event.id}`, current)).json()).data;
    expect(Object.keys(detail).sort()).toEqual(['capacity','description','effectiveRegistrationCutoff','endsAt','id','location','organizer','registrationDeadline','remainingSeats','startsAt','title']);
    expect(await prisma.instructorAssignment.findMany({ where: { eventId: event.id } })).toEqual(before);
    expect((await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).version).toBe(1);
  });
});

