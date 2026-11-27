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
  it('persists an owner partial edit and increments the revision once', async () => {
    const { event } = await fixture(2); const organizer = await login(owner);
    const response = await request(`/api/organizer/events/${event.id}`, organizer, 'PATCH', { expectedVersion: 0, title: 'Updated workshop' });
    expect(response.status).toBe(200);
    const result = (await response.json()).data;
    expect(result.title).toBe('Updated workshop');
    expect(result.version).toBe(1);
    expect(await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).toMatchObject({ title: 'Updated workshop', version: 1, capacity: 2 });
  });
});
