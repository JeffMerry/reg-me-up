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
});
