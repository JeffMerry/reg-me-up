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
import { withEventWrite } from '../../src/event-write.js';

const owner = randomUUID(), outsider = randomUUID(), p1 = randomUUID(), p2 = randomUUID();
const secret = 'synthetic-edit-test-password';
const origin = 'http://localhost:5173';
const starts = Date.parse('2030-01-15T02:00:00Z');
let now = starts - 3_600_000;
let prisma: PrismaClient, pool: pg.Pool, server: Server, base: string, safe = false;
const applicationName = `edit-${owner}`;
type Session = { cookie: string; token: string };
async function request(path: string, session?: Session, method?: string, body?: unknown, url = base) {
  return fetch(url + path, { method: method ?? 'GET', headers: {
    ...(session ? { Cookie: session.cookie, 'X-CSRF-Token': session.token } : {}),
    ...(method ? { Origin: origin, 'Content-Type': 'application/json' } : {}),
  }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
async function login(id: string, url = base): Promise<Session> {
  const bootstrap = await request('/api/auth/csrf', undefined, undefined, undefined, url);
  const session = { cookie: bootstrap.headers.get('set-cookie')!.split(';')[0], token: (await bootstrap.json()).data.csrfToken as string };
  const response = await request('/api/auth/login', session, 'POST', { email: `${id}@edit.test`, password: secret }, url);
  expect(response.status).toBe(200);
  return { cookie: response.headers.get('set-cookie')!.split(';')[0], token: (await response.json()).data.csrfToken as string };
}
async function fixture(capacity = 1) {
  const event = await prisma.event.create({ data: { id: randomUUID(), organizerId: owner, title: 'Cancellation test event', startsAt: new Date(starts), endsAt: new Date(starts + 3_600_000), location: 'Test room', capacity, publicationStatus: 'PUBLISHED' } });
  const registration = await prisma.registration.create({ data: { id: randomUUID(), eventId: event.id, participantId: p1, status: 'ACTIVE' } });
  return { event, registration };
}
const cancel = (id: string, session: Session) => request(`/api/me/registrations/${id}/cancel`, session, 'POST', {});
async function active(eventId: string) { return prisma.registration.count({ where: { eventId, status: 'ACTIVE' } }); }
async function waitForWriters(observer: pg.Client, count: number) {
  const limit = Date.now() + 1500;
  while (Date.now() < limit) {
    const result = await observer.query<{ count: number }>(`SELECT count(*)::int AS count FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock' AND query ILIKE '%FOR UPDATE%'`, [applicationName]);
    if (result.rows[0].count >= count) return;
    await delay(10);
  }
  throw new Error(`Expected ${count} cancellation/registration writer(s) waiting on event lock`);
}
beforeAll(async () => {
  if (!process.env.DATABASE_URL || !process.env.TEST_DATABASE_URL) throw new Error('Separate guarded app/test databases required');
  const app = new pg.Client({ connectionString: process.env.DATABASE_URL }); const test = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  try { await app.connect(); await test.connect(); await verifyTestDatabase(app, test); safe = true; }
  finally { await Promise.allSettled([app.end(), test.end()]); }
  pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL, application_name: applicationName }) });
  const hash = await argon2.hash(secret);
  for (const [id, role] of [[owner, 'ORGANIZER'], [outsider, 'ORGANIZER'], [p1, 'PARTICIPANT'], [p2, 'PARTICIPANT']]) {
    await prisma.user.create({ data: { id, role, email: `${id}@edit.test`, passwordHash: hash, displayName: `Cancel fixture ${id}` } });
  }
  server = createApp(async () => {}, { config: { nodeEnv: 'test', port: 3000, databaseUrl: process.env.TEST_DATABASE_URL, sessionSecret: 'synthetic-edit-session-secret', appOrigin: origin }, pool, prisma, now: () => now }).listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('Missing test port');
  base = `http://127.0.0.1:${address.port}`;
});
beforeEach(() => { now = starts - 3_600_000; });
afterAll(async () => {
  if (server) await new Promise<void>(resolve => server.close(() => resolve()));
  if (safe && prisma) {
    await prisma.registration.deleteMany({ where: { event: { organizerId: owner } } });
    await prisma.event.deleteMany({ where: { organizerId: owner } });
    await prisma.$executeRaw`DELETE FROM sessions WHERE sess->>'userId' IN (${owner}, ${outsider}, ${p1}, ${p2})`;
    await prisma.user.deleteMany({ where: { id: { in: [owner, outsider, p1, p2] } } });
  }
  await Promise.allSettled([pool?.end(), prisma?.$disconnect()]);
});

describe('F-06 owner edit API', () => {
  const patch = (id: string, session: Session, body: unknown) => request(`/api/organizer/events/${id}`, session, 'PATCH', body);
  it('persists an owner partial edit and increments the revision once', async () => {
    const { event } = await fixture(2); const organizer = await login(owner);
    const response = await request(`/api/organizer/events/${event.id}`, organizer, 'PATCH', { expectedVersion: 0, title: 'Updated workshop' });
    expect(response.status).toBe(200);
    const result = (await response.json()).data;
    expect(result.title).toBe('Updated workshop');
    expect(result.version).toBe(1);
    expect(await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).toMatchObject({ title: 'Updated workshop', version: 1, capacity: 2 });
  });
  it('preserves legacy capacity and omitted fields; explicit changes obey capacity bounds and ACTIVE count', async () => {
    const { event } = await fixture(100); const session = await login(owner);
    expect((await patch(event.id, session, { expectedVersion: 0, title: 'Legacy renamed' })).status).toBe(200);
    expect(await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).toMatchObject({ capacity: 100, location: event.location, startsAt: event.startsAt, version: 1 });
    for (const capacity of [0, 61, 100, 1.5, '60', null, true]) expect((await patch(event.id, session, { expectedVersion: 1, capacity })).status).toBe(422);
    expect((await patch(event.id, session, { expectedVersion: 1, capacity: 60 })).status).toBe(200);
    expect((await patch(event.id, session, { expectedVersion: 2, capacity: 1 })).status).toBe(200);
    const other = await fixture(3);
    await prisma.registration.create({ data: { eventId: other.event.id, participantId: p2, status: 'ACTIVE' } });
    const result = await patch(other.event.id, session, { expectedVersion: 0, capacity: 1 });
    expect(result.status).toBe(409); expect((await result.json()).error.code).toBe('CAPACITY_BELOW_ACTIVE');
    expect(await prisma.event.findUniqueOrThrow({ where: { id: other.event.id } })).toMatchObject({ capacity: 3, version: 0 });
  });
  it('keeps a no-op revision stable; stale version is rejected and nullable values can be cleared', async () => {
    const { event } = await fixture(2); const session = await login(owner);
    expect((await patch(event.id, session, { expectedVersion: 0, title: event.title })).status).toBe(200);
    const first = await patch(event.id, session, { expectedVersion: 0, description: 'Details', registrationDeadline: new Date(now - 1).toISOString() });
    expect(first.status).toBe(200); expect((await first.json()).data.version).toBe(1);
    expect((await patch(event.id, session, { expectedVersion: 0, title: 'Stale' })).status).toBe(409);
    const cleared = await patch(event.id, session, { expectedVersion: 1, description: null, registrationDeadline: null });
    expect(cleared.status).toBe(200); expect((await cleared.json()).data).toMatchObject({ version: 2, description: null, registrationDeadline: null, effectiveRegistrationCutoff: event.startsAt.toISOString(), currentInstructor: null });
  });
  it.each([-1, 0, 1])('enforces explicit deadline boundary at offset %s and keeps duplicate priority', async offset => {
    const { event } = await fixture(2); const session = await login(owner), participant = await login(p2), existing = await login(p1);
    const cutoff = starts - 1000;
    expect((await patch(event.id, session, { expectedVersion: 0, registrationDeadline: new Date(cutoff).toISOString() })).status).toBe(200);
    now = cutoff + offset;
    const response = await request(`/api/events/${event.id}/registrations`, participant, 'POST', {});
    expect(response.status).toBe(offset < 0 ? 201 : 409);
    if (offset >= 0) expect((await response.json()).error.code).toBe('REGISTRATION_CLOSED');
    const duplicate = await request(`/api/events/${event.id}/registrations`, existing, 'POST', {});
    expect((await duplicate.json()).error.code).toBe('ALREADY_REGISTERED');
    expect(await active(event.id)).toBe(offset < 0 ? 2 : 1);
  });
  it('uses start when deadline is null and rejects invalid resulting time/deadline atomically', async () => {
    const { event } = await fixture(2); const session = await login(owner);
    for (const body of [{ registrationDeadline: new Date(starts + 1).toISOString() }, { startsAt: new Date(now).toISOString() }, { endsAt: event.startsAt.toISOString() }, { title: '' }]) expect((await patch(event.id, session, { expectedVersion: 0, ...body })).status).toBe(422);
    expect(await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).toMatchObject({ version: 0, registrationDeadline: null });
    now = starts;
    expect((await patch(event.id, session, { expectedVersion: 0, title: 'Too late' })).status).toBe(409);
    const response = await request(`/api/events/${event.id}/registrations`, await login(p2), 'POST', {});
    expect((await response.json()).error.code).toBe('REGISTRATION_CLOSED');
  });
  it('denies anonymous, wrong-role, other owner, missing IDs, forged fields/query and bad CSRF without leaks or changes', async () => {
    const { event } = await fixture(2); const own = await login(owner), other = await login(outsider), participant = await login(p1);
    const url = `/api/organizer/events/${event.id}`; const before = await prisma.event.findUniqueOrThrow({ where: { id: event.id } });
    expect((await request(url)).status).toBe(401);
    expect((await request(url, participant)).status).toBe(403);
    for (const method of ['GET', 'PATCH']) {
      const denied = await request(url, other, method, method === 'PATCH' ? { expectedVersion: 0, title: 'Forbidden' } : undefined);
      expect(denied.status).toBe(404); expect(JSON.stringify(await denied.json())).not.toContain(event.title);
    }
    expect((await patch(randomUUID(), own, { expectedVersion: 0, title: 'Missing' })).status).toBe(404);
    expect((await patch('invalid', own, {})).status).toBe(422);
    expect((await request(url + '?extra=x', own)).status).toBe(422);
    expect((await patch(event.id, { ...own, token: 'bad-token' }, { expectedVersion: 0, title: 'Denied' })).status).toBe(403);
    for (const body of [{ title: 'Missing revision' }, { expectedVersion: 0 }, { expectedVersion: 0, organizerId: outsider }, { expectedVersion: 0, capacity: 2, version: 99 }]) expect((await patch(event.id, own, body)).status).toBe(422);
    expect(await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).toEqual(before);
    const dto = (await (await request(url, own)).json()).data;
    expect(Object.keys(dto).sort()).toEqual(['activeRegistrationCount', 'capacity', 'currentInstructor', 'description', 'effectiveRegistrationCutoff', 'endsAt', 'id', 'location', 'organizer', 'registrationDeadline', 'remainingSeats', 'startsAt', 'title', 'version'].sort());
    const publicDto = (await (await request(`/api/events/${event.id}`)).json()).data;
    expect(publicDto).not.toHaveProperty('version'); expect(publicDto).not.toHaveProperty('organizerId');
  });
  it('allows only one concurrent same-version edit and samples time after the schedule/event locks', async () => {
    const { event } = await fixture(2); const session = await login(owner);
    const blocker = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
    const observer = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL }); const pending: Promise<Response>[] = [];
    try {
      await blocker.connect(); await observer.connect(); await blocker.query('BEGIN'); await blocker.query('SELECT id FROM events WHERE id=$1::uuid FOR UPDATE', [event.id]);
      pending.push(patch(event.id, session, { expectedVersion: 0, title: 'First writer' })); await waitForWriters(observer, 1);
      pending.push(patch(event.id, session, { expectedVersion: 0, title: 'Second writer' }));
      const limit = Date.now() + 1500; let waiting = false;
      while (Date.now() < limit && !waiting) { waiting = (await observer.query(`SELECT count(*)::int AS n FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock' AND query ILIKE '%pg_advisory_xact_lock%'`, [applicationName])).rows[0].n > 0; if (!waiting) await delay(10); }
      expect(waiting).toBe(true); await blocker.query('COMMIT');
      expect((await Promise.all(pending)).map(r => r.status)).toEqual([200, 409]);
      expect(await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).toMatchObject({ version: 1, title: 'First writer' });
      const later = await fixture(2); await blocker.query('BEGIN'); await blocker.query('SELECT id FROM events WHERE id=$1::uuid FOR UPDATE', [later.event.id]);
      const delayed = patch(later.event.id, session, { expectedVersion: 0, title: 'After wait' }); pending.push(delayed); await waitForWriters(observer, 1); now = starts; await blocker.query('COMMIT');
      expect((await delayed).status).toBe(409);
      expect(await prisma.event.findUniqueOrThrow({ where: { id: later.event.id } })).toMatchObject({ title: later.event.title, version: 0 });
    } finally { await blocker.query('ROLLBACK').catch(() => undefined); await Promise.allSettled(pending); await Promise.allSettled([blocker.end(), observer.end()]); }
  });
  it.each(['edit-first', 'register-first'])('serializes deadline edit vs registration in %s order', async order => {
    const { event } = await fixture(2); const organizer = await login(owner), participant = await login(p2);
    const blocker = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL }), observer = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL }); const pending: Promise<Response>[] = [];
    const editing = () => patch(event.id, organizer, { expectedVersion: 0, registrationDeadline: new Date(now - 1).toISOString() });
    const registering = () => request(`/api/events/${event.id}/registrations`, participant, 'POST', {});
    try {
      await blocker.connect(); await observer.connect(); await blocker.query('BEGIN'); await blocker.query('SELECT id FROM events WHERE id=$1::uuid FOR UPDATE', [event.id]);
      pending.push(order === 'edit-first' ? editing() : registering()); await waitForWriters(observer, 1);
      pending.push(order === 'edit-first' ? registering() : editing()); await waitForWriters(observer, 2); await blocker.query('COMMIT');
      expect((await Promise.all(pending)).map(r => r.status)).toEqual(order === 'edit-first' ? [200, 409] : [201, 200]);
      expect(await active(event.id)).toBe(order === 'edit-first' ? 1 : 2);
    } finally { await blocker.query('ROLLBACK').catch(() => undefined); await Promise.allSettled(pending); await Promise.allSettled([blocker.end(), observer.end()]); }
  });
  it.each(['edit-first', 'register-first'])('serializes capacity increase vs last-seat registration in %s order', async order => {
    const { event } = await fixture(1); const organizer = await login(owner), participant = await login(p2);
    const blocker = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL }), observer = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL }); const pending: Promise<Response>[] = [];
    const editing = () => patch(event.id, organizer, { expectedVersion: 0, capacity: 2 });
    const registering = () => request(`/api/events/${event.id}/registrations`, participant, 'POST', {});
    try {
      await blocker.connect(); await observer.connect(); await blocker.query('BEGIN'); await blocker.query('SELECT id FROM events WHERE id=$1::uuid FOR UPDATE', [event.id]);
      pending.push(order === 'edit-first' ? editing() : registering()); await waitForWriters(observer, 1);
      pending.push(order === 'edit-first' ? registering() : editing()); await waitForWriters(observer, 2); await blocker.query('COMMIT');
      expect((await Promise.all(pending)).map(r => r.status)).toEqual(order === 'edit-first' ? [200, 201] : [409, 200]);
      expect(await active(event.id)).toBe(order === 'edit-first' ? 2 : 1);
      expect(await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).toMatchObject({ capacity: 2, version: 1 });
    } finally { await blocker.query('ROLLBACK').catch(() => undefined); await Promise.allSettled(pending); await Promise.allSettled([blocker.end(), observer.end()]); }
  });
  it('shares capacity/cancellation locks and does not restore a seat twice', async () => {
    const { event, registration } = await fixture(3); const organizer = await login(owner), participant = await login(p1);
    const blocker = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL }), observer = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL }); const pending: Promise<Response>[] = [];
    try {
      await blocker.connect(); await observer.connect(); await blocker.query('BEGIN'); await blocker.query('SELECT id FROM events WHERE id=$1::uuid FOR UPDATE', [event.id]);
      pending.push(patch(event.id, organizer, { expectedVersion: 0, capacity: 1 })); await waitForWriters(observer, 1);
      pending.push(cancel(registration.id, participant)); await waitForWriters(observer, 2); await blocker.query('COMMIT');
      expect((await Promise.all(pending)).map(r => r.status)).toEqual([200, 200]);
      expect((await cancel(registration.id, participant)).status).toBe(200);
      expect(await active(event.id)).toBe(0); expect(await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).toMatchObject({ capacity: 1, version: 1 });
    } finally { await blocker.query('ROLLBACK').catch(() => undefined); await Promise.allSettled(pending); await Promise.allSettled([blocker.end(), observer.end()]); }
  });
  it('rolls back metadata and version when a database error prevents commit', async () => {
    const { event } = await fixture(2); const organizer = await login(owner); const suffix = randomUUID().replaceAll('-', ''); const fn = `edit_rollback_${suffix}`;
    try {
      await prisma.$executeRawUnsafe(`CREATE FUNCTION "${fn}"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.id='${event.id}'::uuid THEN RAISE EXCEPTION 'controlled edit rollback'; END IF; RETURN NEW; END $$`);
      await prisma.$executeRawUnsafe(`CREATE TRIGGER "${fn}" AFTER UPDATE ON events FOR EACH ROW EXECUTE FUNCTION "${fn}"()`);
      const response = await patch(event.id, organizer, { expectedVersion: 0, title: 'Rollback', capacity: 1 });
      expect(response.status).toBe(500); expect(JSON.stringify(await response.json())).not.toContain('controlled edit rollback');
      expect(await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).toMatchObject({ title: event.title, version: 0, capacity: 2 });
    } finally { await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS "${fn}" ON events`); await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS "${fn}"()`); }
  });
  it('preserves existing data/defaults and enforces the deadline CHECK', async () => {
    const old = await prisma.event.findUniqueOrThrow({ where: { id: '30000000-0000-4000-8000-000000000002' } }); expect(old.registrationDeadline).toBeNull();
    const { event } = await fixture(100);
    await expect(prisma.$executeRaw`UPDATE events SET registration_deadline=starts_at+interval '1 second' WHERE id=${event.id}::uuid`).rejects.toMatchObject({ code: 'P2010' });
    expect(await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).toMatchObject({ capacity: 100, registrationDeadline: null, version: 0 });
  });
  it('reads edited metadata after starting a new application process without reseed', async () => {
    const { event } = await fixture(2); const organizer = await login(owner);
    expect((await patch(event.id, organizer, { expectedVersion: 0, title: 'Persisted edit', registrationDeadline: new Date(starts - 1000).toISOString() })).status).toBe(200);
    let child: ChildProcess | undefined;
    try {
      const probe = createServer(); await new Promise<void>(resolve => probe.listen(0, '127.0.0.1', resolve)); const address = probe.address(); if (!address || typeof address === 'string') throw new Error('No restart port'); await new Promise<void>(resolve => probe.close(() => resolve()));
      child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], { cwd: process.cwd(), env: { ...process.env, NODE_ENV: 'test', PORT: String(address.port), DATABASE_URL: process.env.TEST_DATABASE_URL!, APP_ORIGIN: origin, SESSION_SECRET: 'synthetic-edit-restart-secret-123456789' }, stdio: 'ignore' });
      const url = `http://127.0.0.1:${address.port}`; let ready = false;
      for (let i = 0; i < 100 && !ready; i++) { if (child.exitCode !== null) throw new Error('Restarted app exited'); try { ready = (await fetch(url + '/api/health')).ok; } catch { await delay(100); } }
      expect(ready).toBe(true); const session = await login(owner, url);
      const response = await request(`/api/organizer/events/${event.id}`, session, undefined, undefined, url);
      expect(response.status).toBe(200); expect((await response.json()).data).toMatchObject({ title: 'Persisted edit', version: 1, registrationDeadline: new Date(starts - 1000).toISOString() });
    } finally { if (child && child.exitCode === null) { child.kill(); await new Promise<void>(resolve => child?.once('exit', () => resolve())); } }
  }, 15000);
});
