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
const secret = 'synthetic-cancellation-test-password';
const origin = 'http://localhost:5173';
const starts = Date.parse('2030-01-15T02:00:00Z');
let now = starts - 3_600_000;
let prisma: PrismaClient, pool: pg.Pool, server: Server, base: string, safe = false;
const applicationName = `cancel-${owner}`;
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
  const response = await request('/api/auth/login', session, 'POST', { email: `${id}@cancel.test`, password: secret }, url);
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
    await prisma.user.create({ data: { id, role, email: `${id}@cancel.test`, passwordHash: hash, displayName: `Cancel fixture ${id}` } });
  }
  server = createApp(async () => {}, { config: { nodeEnv: 'test', port: 3000, databaseUrl: process.env.TEST_DATABASE_URL, sessionSecret: 'synthetic-cancellation-session-secret', appOrigin: origin }, pool, prisma, now: () => now }).listen(0, '127.0.0.1');
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

describe('F-05 cancellation API and persisted lifecycle', () => {
  it('cancels an own ACTIVE registration and returns the seat with persisted history', async () => {
    const { event, registration } = await fixture(); const participant = await login(p1);
    const response = await cancel(registration.id, participant);
    expect(response.status).toBe(200);
    const result = (await response.json()).data;
    expect(result.status).toBe('CANCELLED');
    expect(result).toMatchObject({ id: registration.id, cancelledAt: new Date(now).toISOString(), event: { id: event.id, remainingSeats: 1, capacity: 1 } });
    expect(Object.keys(result).sort()).toEqual(['cancelledAt', 'event', 'id', 'participant', 'registeredAt', 'status']);
    const saved = await prisma.$queryRaw<Array<{ status: string; cancelled_at: Date }>>`SELECT status,cancelled_at FROM registrations WHERE id=${registration.id}::uuid`;
    expect(saved[0].status).toBe('CANCELLED'); expect(saved[0].cancelled_at.toISOString()).toBe(result.cancelledAt);
    expect(await active(event.id)).toBe(0);
    expect((await (await request(`/api/me/registrations/${registration.id}`, participant)).json()).data).toMatchObject({ id: registration.id, status: 'CANCELLED', cancelledAt: result.cancelledAt });
    expect((await (await request(`/api/me/registrations?eventId=${event.id}`, participant)).json()).data).toHaveLength(1);
    const organizer = await login(owner);
    const list = await (await request(`/api/organizer/events/${event.id}/registrations`, organizer)).json();
    expect(list.data.summary).toEqual({ capacity: 1, activeRegistrations: 0, remainingSeats: 1 });
    expect(list.data.registrations).toEqual([]);
  });

  it.each([-1, 0, 1])('checks the server clock at start offset %i milliseconds', async offset => {
    const { event, registration } = await fixture(); now = starts + offset;
    const response = await cancel(registration.id, await login(p1));
    expect(response.status).toBe(offset < 0 ? 200 : 409);
    if (offset >= 0) {
      expect((await response.json()).error.code).toBe('CANCELLATION_CLOSED');
      expect(await active(event.id)).toBe(1);
      expect((await prisma.registration.findUniqueOrThrow({ where: { id: registration.id } })).status).toBe('ACTIVE');
    }
  });

  it('repeats cancellation without changing the timestamp, including after the start', async () => {
    const { event, registration } = await fixture(); const participant = await login(p1);
    const first = (await (await cancel(registration.id, participant)).json()).data;
    now = starts + 1;
    const repeat = await cancel(registration.id, participant);
    expect(repeat.status).toBe(200); expect((await repeat.json()).data.cancelledAt).toBe(first.cancelledAt);
    expect(await active(event.id)).toBe(0);
    expect(await prisma.registration.count({ where: { eventId: event.id } })).toBe(1);
  });

  it('re-registers with a new ID and cancelling the old ID cannot cancel the new registration', async () => {
    const { event, registration } = await fixture(); const participant = await login(p1);
    expect((await cancel(registration.id, participant)).status).toBe(200);
    const created = await request(`/api/events/${event.id}/registrations`, participant, 'POST', {});
    expect(created.status).toBe(201); const newId = (await created.json()).data.id as string;
    expect(newId).not.toBe(registration.id);
    expect((await cancel(registration.id, participant)).status).toBe(200);
    expect((await prisma.registration.findUniqueOrThrow({ where: { id: newId } })).status).toBe('ACTIVE');
    expect(await active(event.id)).toBe(1);
    const history = await (await request(`/api/me/registrations?eventId=${event.id}`, participant)).json();
    expect(history.data.map((r: { status: string }) => r.status).sort()).toEqual(['ACTIVE', 'CANCELLED']);
    expect((await request(`/api/events/${event.id}/registrations`, participant, 'POST', {})).status).toBe(409);
    expect((await cancel(newId, participant)).status).toBe(200);
    now = starts;
    const closed = await request(`/api/events/${event.id}/registrations`, participant, 'POST', {});
    expect(closed.status).toBe(409); expect((await closed.json()).error.code).toBe('REGISTRATION_CLOSED');
    expect(await active(event.id)).toBe(0);
  });

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

  it('serializes concurrent cancellation requests and samples time after waiting for the event lock', async () => {
    const { event, registration } = await fixture(); const participant = await login(p1);
    const blocker = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL }); const observer = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
    let pending: Array<Promise<Response>> = [];
    try {
      await blocker.connect(); await observer.connect(); await blocker.query('BEGIN');
      await blocker.query('SELECT id FROM events WHERE id=$1::uuid FOR UPDATE', [event.id]);
      pending = [cancel(registration.id, participant), cancel(registration.id, participant)];
      await waitForWriters(observer, 2); await blocker.query('COMMIT');
      const results = await Promise.all(pending);
      expect(results.map(r => r.status)).toEqual([200, 200]);
      const data = await Promise.all(results.map(async r => (await r.json()).data));
      expect(data[0].cancelledAt).toBe(data[1].cancelledAt); expect(await active(event.id)).toBe(0);

      const later = await fixture(); await blocker.query('BEGIN');
      await blocker.query('SELECT id FROM events WHERE id=$1::uuid FOR UPDATE', [later.event.id]);
      pending = [cancel(later.registration.id, participant)]; await waitForWriters(observer, 1);
      now = starts; await blocker.query('COMMIT');
      expect((await pending[0]).status).toBe(409); expect(await active(later.event.id)).toBe(1);
    } finally { await blocker.query('ROLLBACK').catch(() => undefined); await Promise.allSettled(pending); await Promise.allSettled([blocker.end(), observer.end()]); }
  });

  it.each(['cancel-first', 'register-first'])('preserves last-seat integrity when cancel races register: %s', async order => {
    const { event, registration } = await fixture(); const own = await login(p1), other = await login(p2);
    const blocker = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL }); const observer = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
    const pending: Array<Promise<Response>> = [];
    try {
      await blocker.connect(); await observer.connect(); await blocker.query('BEGIN');
      await blocker.query('SELECT id FROM events WHERE id=$1::uuid FOR UPDATE', [event.id]);
      const registrationRequest = () => request(`/api/events/${event.id}/registrations`, other, 'POST', {});
      pending.push(order === 'cancel-first' ? cancel(registration.id, own) : registrationRequest());
      await waitForWriters(observer, 1);
      pending.push(order === 'cancel-first' ? registrationRequest() : cancel(registration.id, own));
      await waitForWriters(observer, 2); await blocker.query('COMMIT');
      const responses = await Promise.all(pending);
      expect(responses.map(r => r.status)).toEqual(order === 'cancel-first' ? [200, 201] : [409, 200]);
      expect(await active(event.id)).toBe(order === 'cancel-first' ? 1 : 0);
      expect(await active(event.id)).toBeLessThanOrEqual(1);
    } finally { await blocker.query('ROLLBACK').catch(() => undefined); await Promise.allSettled(pending); await Promise.allSettled([blocker.end(), observer.end()]); }
  });

  it('does not leave partial cancellation or return a seat when the database rolls back', async () => {
    const { event, registration } = await fixture(); const participant = await login(p1);
    const suffix = randomUUID().replaceAll('-', ''); const fn = `cancel_rollback_${suffix}`, trigger = `cancel_rollback_${suffix}`;
    try {
      await prisma.$executeRawUnsafe(`CREATE FUNCTION "${fn}"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.id='${registration.id}'::uuid AND NEW.status='CANCELLED' THEN RAISE EXCEPTION 'controlled cancellation failure' USING ERRCODE='23514'; END IF; RETURN NEW; END $$`);
      await prisma.$executeRawUnsafe(`CREATE TRIGGER "${trigger}" AFTER UPDATE ON registrations FOR EACH ROW EXECUTE FUNCTION "${fn}"()`);
      const response = await cancel(registration.id, participant);
      expect(response.status).toBe(500); expect(JSON.stringify(await response.json())).not.toContain('controlled cancellation failure');
      expect(await active(event.id)).toBe(1);
      expect((await prisma.registration.findUniqueOrThrow({ where: { id: registration.id } })).status).toBe('ACTIVE');
    } finally {
      await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS "${trigger}" ON registrations`);
      await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS "${fn}"()`);
    }
  });

  it('retains cancellation history after starting a new application process on the same database', async () => {
    const { event, registration } = await fixture(); const participant = await login(p1);
    const cancelled = await cancel(registration.id, participant); expect(cancelled.status).toBe(200);
    const saved = (await cancelled.json()).data;
    let child: ChildProcess | undefined;
    try {
      const probe = createServer(); await new Promise<void>(resolve => probe.listen(0, '127.0.0.1', resolve));
      const address = probe.address(); if (!address || typeof address === 'string') throw new Error('Missing restart port');
      await new Promise<void>(resolve => probe.close(() => resolve()));
      child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], { cwd: process.cwd(), env: { ...process.env, NODE_ENV: 'test', PORT: String(address.port), DATABASE_URL: process.env.TEST_DATABASE_URL!, APP_ORIGIN: origin, SESSION_SECRET: 'synthetic-cancel-restart-secret-123456' }, stdio: 'ignore' });
      const url = `http://127.0.0.1:${address.port}`; let ready = false;
      for (let i = 0; i < 100 && !ready; i++) {
        if (child.exitCode !== null) throw new Error('Restarted app exited');
        try { ready = (await fetch(url + '/api/health')).ok; } catch { await delay(100); }
      }
      expect(ready).toBe(true);
      const session = await login(p1, url);
      const response = await request(`/api/me/registrations/${registration.id}`, session, undefined, undefined, url);
      expect(response.status).toBe(200);
      expect((await response.json()).data).toMatchObject({ id: registration.id, status: 'CANCELLED', cancelledAt: saved.cancelledAt, event: { id: event.id } });
    } finally {
      if (child && child.exitCode === null) { child.kill(); await new Promise<void>(resolve => child?.once('exit', () => resolve())); }
    }
  });
});
