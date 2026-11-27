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
const applicationName = `checkin-${owner}`;
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
  const response = await request('/api/auth/login', initial, 'POST', { email: `${id}@checkin.test`, password: secret }, url);
  expect(response.status).toBe(200);
  return { cookie: response.headers.get('set-cookie')!.split(';')[0], token: (await response.json()).data.csrfToken as string };
}
async function fixture(startsAt = initialStart, endsAt = startsAt + 3_600_000, organizerId = owner) {
  return prisma.event.create({ data: { id: randomUUID(), organizerId, title: 'Instructor test event', startsAt: new Date(startsAt), endsAt: new Date(endsAt), location: 'Test room', capacity: 2, publicationStatus: 'PUBLISHED' } });
}
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
    await prisma.user.create({ data: { id, role, email: `${id}@checkin.test`, passwordHash: hash, displayName: `F09 ${role} ${id.slice(0, 4)}` } });
  }
  server = createApp(async () => {}, { config: { nodeEnv: 'test', port: 3000, databaseUrl: process.env.TEST_DATABASE_URL, sessionSecret: 'synthetic-instructor-session-secret', appOrigin: origin }, pool, prisma, now: () => now }).listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('Missing test port');
  base = `http://127.0.0.1:${address.port}`;
});

beforeEach(async () => {
  now = initialStart - 3_600_000;
  // Keep each schedule independent while retaining only this suite's users.
  await prisma.attendance.deleteMany({ where: { registration: { event: { organizerId: { in: [owner, outsider] } } } } });
  await prisma.instructorAssignment.deleteMany({ where: { event: { organizerId: { in: [owner, outsider] } } } });
  await prisma.registration.deleteMany({ where: { event: { organizerId: { in: [owner, outsider] } } } });
  await prisma.event.deleteMany({ where: { organizerId: { in: [owner, outsider] } } });
});

afterAll(async () => {
  if (server) await new Promise<void>(resolve => server.close(() => resolve()));
  if (safe && prisma) {
    await prisma.attendance.deleteMany({ where: { registration: { event: { organizerId: { in: [owner, outsider] } } } } });
  await prisma.instructorAssignment.deleteMany({ where: { OR: [{ event: { organizerId: { in: [owner, outsider] } } }, { instructorId: { in: [instructor1, instructor2] } }] } });
    await prisma.registration.deleteMany({ where: { event: { organizerId: { in: [owner, outsider] } } } });
    await prisma.event.deleteMany({ where: { organizerId: { in: [owner, outsider] } } });
    await prisma.$executeRaw`DELETE FROM sessions WHERE sess->>'userId' IN (${owner}, ${outsider}, ${participant}, ${instructor1}, ${instructor2})`;
    await prisma.user.deleteMany({ where: { id: { in: [owner, outsider, participant, instructor1, instructor2] } } });
  }
  await Promise.allSettled([pool?.end(), prisma?.$disconnect()]);
});


const checkIn = (event: string, registration: string, session?: Session, body: unknown = {}) => request(`/api/organizer/events/${event}/registrations/${registration}/check-in`, session, 'POST', body);
const roster = (event: string, session?: Session, query = '') => request(`/api/organizer/events/${event}/check-ins${query}`, session);
async function registration(eventId: string, participantId = participant, status = 'ACTIVE') {
  return prisma.registration.create({ data: { eventId, participantId, status, ...(status === 'CANCELLED' ? { cancelledAt: new Date(now) } : {}) } });
}
describe('F07 owner check-in', () => {
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
  it.each([-1, 0, 1, 3_599_999, 3_600_000, 3_600_001])('uses the server creation window at start offset %s', async offset => {
    const event = await fixture(), row = await registration(event.id), session = await login(owner); now = initialStart + offset;
    const result = await checkIn(event.id, row.id, session); const allowed = offset >= 0 && offset < 3_600_000;
    expect(result.status).toBe(allowed ? 201 : 409);
    if (!allowed) expect((await result.json()).error.code).toBe(offset < 0 ? 'CHECK_IN_NOT_OPEN' : 'CHECK_IN_CLOSED');
    expect(await prisma.attendance.count({ where: { registrationId: row.id } })).toBe(allowed ? 1 : 0);
    expect(await prisma.registration.findUniqueOrThrow({ where: { id: row.id } })).toEqual(row);
    expect((await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).version).toBe(0);
  });
  async function waitForEventWriters(observer: pg.Client, count: number) {
    for (let i = 0; i < 150; i++) {
      const result = await observer.query<{ n: number }>(`SELECT count(*)::int AS n FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock' AND query ILIKE '%FOR UPDATE%'`, [applicationName]);
      if (result.rows[0].n >= count) return;
      await delay(10);
    }
    throw new Error(`Expected ${count} actual event-lock waiters`);
  }
  async function lockEvent(id: string, run: (observer: pg.Client, release: () => Promise<void>) => Promise<void>) {
    const blocker = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL }), observer = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
    try { await blocker.connect(); await observer.connect(); await blocker.query('BEGIN'); await blocker.query('SELECT id FROM events WHERE id=$1::uuid FOR UPDATE', [id]); await run(observer, async () => { await blocker.query('COMMIT'); }); }
    finally { await blocker.query('ROLLBACK').catch(() => undefined); await Promise.allSettled([blocker.end(), observer.end()]); }
  }
  it.each([0, 3_600_000])('samples creation time after an observed lock wait across offset %s', async offset => {
    const event = await fixture(), row = await registration(event.id), session = await login(owner); now = initialStart + offset - 1;
    await lockEvent(event.id, async (observer, release) => {
      const pending = checkIn(event.id, row.id, session); await waitForEventWriters(observer, 1); now++;
      await release(); const result = await pending; expect(result.status).toBe(offset === 0 ? 201 : 409);
      if (offset !== 0) expect((await result.json()).error.code).toBe('CHECK_IN_CLOSED');
    });
    expect(await prisma.attendance.count({ where: { registrationId: row.id } })).toBe(offset === 0 ? 1 : 0);
  });
  it('serializes concurrent same-ID requests and preserves the original result on repeats outside the window', async () => {
    const event = await fixture(), row = await registration(event.id), session = await login(owner); now = initialStart;
    let saved: unknown;
    await lockEvent(event.id, async (observer, release) => {
      const first = checkIn(event.id, row.id, session); await waitForEventWriters(observer, 1);
      const second = checkIn(event.id, row.id, session); await waitForEventWriters(observer, 2); await release();
      const results = await Promise.all([first, second]); expect(results.map(r => r.status)).toEqual([201, 200]);
      saved = (await results[0].json()).data; expect((await results[1].json()).data).toEqual(saved);
    });
    now = initialStart + 3_600_000;
    const repeat = await checkIn(event.id, row.id, session); expect(repeat.status).toBe(200); expect((await repeat.json()).data).toEqual(saved);
    expect(await prisma.attendance.count({ where: { registrationId: row.id } })).toBe(1);
  });
  it('rejects cancelled history, wrong-event/missing IDs and forged inputs without changing lifecycle state', async () => {
    const event = await fixture(), cancelled = await registration(event.id, participant, 'CANCELLED'), active = await registration(event.id), other = await fixture(initialStart, initialStart + 3_600_000, outsider), foreign = await registration(other.id), session = await login(owner); now = initialStart;
    const before = await prisma.registration.findMany({ where: { eventId: event.id }, orderBy: { id: 'asc' } });
    const denied = await checkIn(event.id, cancelled.id, session); expect(denied.status).toBe(409); expect((await denied.json()).error.code).toBe('REGISTRATION_INELIGIBLE');
    for (const id of [foreign.id, randomUUID()]) { const response = await checkIn(event.id, id, session); expect(response.status).toBe(404); expect(await response.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Not found.' } }); }
    for (const body of [{ checkedInAt: new Date().toISOString() }, { participantId: participant }, []]) expect((await checkIn(event.id, active.id, session, body)).status).toBe(422);
    // Shared strict JSON parser rejects a top-level null before the route validator.
    expect((await checkIn(event.id, active.id, session, null)).status).toBe(400);
    expect((await checkIn('bad', active.id, session)).status).toBe(422); expect((await checkIn(event.id, 'bad', session)).status).toBe(422);
    expect((await request(`/api/organizer/events/${event.id}/registrations/${active.id}/check-in?extra=1`, session, 'POST', {})).status).toBe(422);
    expect(await prisma.registration.findMany({ where: { eventId: event.id }, orderBy: { id: 'asc' } })).toEqual(before);
    expect(await prisma.attendance.count({ where: { registration: { eventId: event.id } } })).toBe(0);
  });
  it('enforces anonymous/role/owner/expiry/CSRF/Origin read and write access with safe DTOs', async () => {
    const event = await fixture(), row = await registration(event.id), ownerSession = await login(owner), other = await login(outsider), student = await login(participant), teacher = await login(instructor1); now = initialStart;
    await prisma.instructorAssignment.create({ data: { eventId: event.id, instructorId: instructor1 } });
    for (const session of [undefined, student, teacher, other]) {
      const expected = !session ? 401 : session === other ? 404 : 403;
      expect((await roster(event.id, session)).status).toBe(expected); expect((await checkIn(event.id, row.id, session)).status).toBe(expected);
    }
    expect((await checkIn(event.id, row.id, { ...ownerSession, token: 'invalid' })).status).toBe(403);
    expect((await fetch(base + `/api/organizer/events/${event.id}/registrations/${row.id}/check-in`, { method: 'POST', headers: { Cookie: ownerSession.cookie, Origin: 'https://invalid.example', 'Content-Type': 'application/json', 'X-CSRF-Token': ownerSession.token }, body: '{}' })).status).toBe(403);
    for (const query of ['?page=0', '?pageSize=101', '?extra=1']) expect((await roster(event.id, ownerSession, query)).status).toBe(422);
    const result = (await (await roster(event.id, ownerSession)).json()).data;
    expect(Object.keys(result).sort()).toEqual(['event','registrations','serverNow','summary','window']);
    expect(Object.keys(result.event).sort()).toEqual(['endsAt','id','startsAt','title']);
    expect(Object.keys(result.registrations[0]).sort()).toEqual(['attendance','displayName','registeredAt','registrationId']);
    expect(await prisma.attendance.count({ where: { registrationId: row.id } })).toBe(0);
    await prisma.$executeRaw`UPDATE sessions SET expire = now() - interval '1 second' WHERE sess->>'userId' = ${owner}`;
    expect((await roster(event.id, ownerSession)).status).toBe(401); expect((await checkIn(event.id, row.id, ownerSession)).status).toBe(401);
    expect(await prisma.registration.findUniqueOrThrow({ where: { id: row.id } })).toEqual(row);
    expect((await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).version).toBe(0);
  });
  it.each(['cancel first', 'edit first'])('uses locked state after %s wins the event lock', async mode => {
    const event = await fixture(), row = await registration(event.id), session = await login(owner), person = await login(participant);
    await lockEvent(event.id, async (observer, release) => {
      const first = mode === 'cancel first' ? request(`/api/me/registrations/${row.id}/cancel`, person, 'POST', {}) : patch(event.id, session, { expectedVersion: 0, startsAt: new Date(initialStart + 1_800_000).toISOString() });
      await waitForEventWriters(observer, 1);
      const second = checkIn(event.id, row.id, session); await waitForEventWriters(observer, 2); await release();
      const results = await Promise.all([first, second]); expect(results[0].status).toBe(200); expect(results[1].status).toBe(409);
      expect((await results[1].json()).error.code).toBe(mode === 'cancel first' ? 'REGISTRATION_INELIGIBLE' : 'CHECK_IN_NOT_OPEN');
    });
    expect(await prisma.attendance.count({ where: { registrationId: row.id } })).toBe(0);
    expect((await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).version).toBe(mode === 'cancel first' ? 0 : 1);
  });
  it('prevents cancellation and edits after an in-window check-in wins, without altering attendance', async () => {
    const event = await fixture(), row = await registration(event.id), session = await login(owner), person = await login(participant); now = initialStart;
    await lockEvent(event.id, async (observer, release) => {
      const first = checkIn(event.id, row.id, session); await waitForEventWriters(observer, 1);
      const second = request(`/api/me/registrations/${row.id}/cancel`, person, 'POST', {}); await waitForEventWriters(observer, 2);
      const third = patch(event.id, session, { expectedVersion: 0, endsAt: new Date(initialStart + 7_200_000).toISOString() }); await waitForEventWriters(observer, 3); await release();
      const results = await Promise.all([first, second, third]); expect(results.map(r => r.status)).toEqual([201, 409, 409]);
    });
    expect((await patch(event.id, session, { expectedVersion: 0, endsAt: new Date(initialStart + 7_200_000).toISOString() })).status).toBe(409);
    expect((await prisma.registration.findUniqueOrThrow({ where: { id: row.id } })).status).toBe('ACTIVE');
    expect(await prisma.attendance.count({ where: { registrationId: row.id } })).toBe(1);
  });
  it('rechecks cancellation and check-in together after the lock wait crosses the event start', async () => {
    const event = await fixture(), row = await registration(event.id), session = await login(owner), person = await login(participant); now = initialStart - 1;
    await lockEvent(event.id, async (observer, release) => {
      const cancel = request(`/api/me/registrations/${row.id}/cancel`, person, 'POST', {}); await waitForEventWriters(observer, 1);
      const attendance = checkIn(event.id, row.id, session); await waitForEventWriters(observer, 2); now = initialStart; await release();
      const results = await Promise.all([cancel, attendance]); expect(results.map(r => r.status)).toEqual([409, 201]);
    });
    expect((await prisma.registration.findUniqueOrThrow({ where: { id: row.id } })).status).toBe('ACTIVE');
    expect((await prisma.attendance.findUniqueOrThrow({ where: { registrationId: row.id } })).checkedInAt).toEqual(new Date(initialStart));
  });
  it('rolls back attendance on a deferred commit failure and preserves event/registration state', async () => {
    const event = await fixture(), row = await registration(event.id), session = await login(owner); now = initialStart;
    const name = `attendance_rollback_${randomUUID().replaceAll('-', '')}`;
    try {
      await prisma.$executeRawUnsafe(`CREATE FUNCTION "${name}"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.registration_id='${row.id}'::uuid THEN RAISE EXCEPTION 'controlled attendance rollback'; END IF; RETURN NEW; END $$`);
      await prisma.$executeRawUnsafe(`CREATE CONSTRAINT TRIGGER "${name}" AFTER INSERT ON attendance DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "${name}"()`);
      expect((await checkIn(event.id, row.id, session)).status).toBe(500);
      expect(await prisma.attendance.count({ where: { registrationId: row.id } })).toBe(0);
      expect(await prisma.registration.findUniqueOrThrow({ where: { id: row.id } })).toEqual(row);
      expect((await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).version).toBe(0);
    } finally { await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS "${name}" ON attendance`); await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS "${name}"()`); }
  });
  it('returns bounded contention without writing when the event lock cannot be acquired', async () => {
    const event = await fixture(), row = await registration(event.id), session = await login(owner); now = initialStart;
    await lockEvent(event.id, async (observer) => {
      const pending = checkIn(event.id, row.id, session); await waitForEventWriters(observer, 1);
      const response = await pending; expect(response.status).toBe(503); expect((await response.json()).error.code).toBe('TEMPORARILY_UNAVAILABLE');
    });
    expect(await prisma.attendance.count({ where: { registrationId: row.id } })).toBe(0);
  });
  it('paginates 21 tied registration times deterministically without truncating legacy capacity', async () => {
    const event = await fixture(), session = await login(owner); await prisma.event.update({ where: { id: event.id }, data: { capacity: 80 } });
    const ids = Array.from({ length: 21 }, () => randomUUID());
    // CANCELLED historical rows may share a participant; ACTIVE unique pairs may not.
    const hash = (await prisma.user.findUniqueOrThrow({ where: { id: participant } })).passwordHash;
    try {
      await prisma.user.createMany({ data: ids.map(id => ({ id, email: `${id}@checkin.test`, role: 'PARTICIPANT', displayName: 'Tied name', passwordHash: hash })) });
      for (const id of ids) await prisma.registration.create({ data: { id, eventId: event.id, participantId: id, status: 'ACTIVE', registeredAt: new Date(initialStart - 10_000) } });
      const one = await (await roster(event.id, session)).json(), two = await (await roster(event.id, session, '?page=2')).json();
      expect(one.meta.total).toBe(21); expect(one.data.registrations).toHaveLength(20); expect(two.data.registrations).toHaveLength(1);
      expect([...one.data.registrations, ...two.data.registrations].map(r => r.registrationId)).toEqual([...ids].sort());
    } finally { await prisma.registration.deleteMany({ where: { eventId: event.id } }); await prisma.user.deleteMany({ where: { id: { in: ids } } }); }
  });
  it('retrieves the same saved attendance from a new app process without reseed', async () => {
    const event = await fixture(), row = await registration(event.id), session = await login(owner); now = initialStart;
    const saved = (await (await checkIn(event.id, row.id, session)).json()).data;
    let child: ChildProcess | undefined;
    try {
      const probe = createServer(); await new Promise<void>(resolve => probe.listen(0, '127.0.0.1', resolve)); const address = probe.address(); if (!address || typeof address === 'string') throw new Error('No port'); await new Promise<void>(resolve => probe.close(() => resolve()));
      child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], { cwd: process.cwd(), env: { ...process.env, NODE_ENV: 'test', PORT: String(address.port), DATABASE_URL: process.env.TEST_DATABASE_URL!, APP_ORIGIN: origin, SESSION_SECRET: 'synthetic-checkin-restart-secret-12345' }, stdio: 'ignore' });
      const url = `http://127.0.0.1:${address.port}`; let ready = false;
      for (let i = 0; i < 100 && !ready; i++) { if (child.exitCode !== null) throw new Error('App exited'); try { ready = (await fetch(url + '/api/ready')).ok; } catch { /* starting */ } if (!ready) await delay(100); }
      expect(ready).toBe(true); const current = await login(owner, url);
      const response = await request(`/api/organizer/events/${event.id}/check-ins`, current, undefined, undefined, url); expect(response.status).toBe(200);
      expect((await response.json()).data.registrations[0].attendance).toEqual({ id: saved.id, checkedInAt: saved.checkedInAt });
      expect(await prisma.attendance.count({ where: { registrationId: row.id } })).toBe(1);
    } finally { if (child && child.exitCode === null) { child.kill(); await new Promise<void>(resolve => child?.once('exit', () => resolve())); } }
  }, 15000);
});
