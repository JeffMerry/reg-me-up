import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomInt, randomUUID } from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import type { Server } from 'node:http';
import argon2 from 'argon2';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { createApp } from '../../src/app.js';
import { verifyTestDatabase } from '../../src/test-db-safety.js';

const owner = randomUUID(), other = randomUUID(), participant = randomUUID(), participant2 = randomUUID(), visible = randomUUID(), hidden = randomUUID();
const secret = 'synthetic-event-test-password';
const origin = 'http://localhost:5173';
const valid = { title: '  Event fixture  ', startsAt: '2026-12-01T09:00:00+07:00', endsAt: '2026-12-01T11:00:00+07:00', location: ' Building A ', capacity: 3 };
let pool: pg.Pool, prisma: PrismaClient, server: Server, base: string, safe = false;
async function request(path: string, opts: { method?: string; cookie?: string; token?: string; body?: unknown; origin?: string } = {}, url = base) {
  return fetch(`${url}${path}`, { method: opts.method ?? 'GET', headers: { ...(opts.cookie ? { Cookie: opts.cookie } : {}), ...(opts.method ? { Origin: opts.origin ?? origin, 'Content-Type': 'application/json' } : {}), ...(opts.token ? { 'X-CSRF-Token': opts.token } : {}) }, ...(opts.body === undefined ? {} : { body: JSON.stringify(opts.body) }) });
}
async function login(id: string, url = base) {
  const boot = await request('/api/auth/csrf', {}, url); const cookie = boot.headers.get('set-cookie')!.split(';')[0]; const token = (await boot.json()).data.csrfToken as string;
  const response = await request('/api/auth/login', { method: 'POST', cookie, token, body: { email: `${id}@events.test`, password: secret } }, url);
  expect(response.status).toBe(200); return { cookie: response.headers.get('set-cookie')!.split(';')[0], token: (await response.json()).data.csrfToken as string };
}
async function waitForRegistrationLockWaiters(observer: pg.Client, expected: number, timeoutMs = 1500) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const result = await observer.query<{ waiters: number }>(`SELECT count(*)::int AS waiters FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid() AND wait_event_type = 'Lock' AND query ILIKE '%FOR UPDATE%'`);
    if (result.rows[0].waiters >= expected) return;
    await delay(10);
  }
  throw new Error(`Expected ${expected} registration request(s) to wait on the Event row lock.`);
}
async function waitForAdvisoryLockWaiter(observer: pg.Client, key1: number, key2: number, timeoutMs = 700) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const result = await observer.query<{ waiters: number }>(`SELECT count(*)::int AS waiters FROM pg_locks WHERE locktype = 'advisory' AND classid = $1::oid AND objid = $2::oid AND objsubid = 2 AND NOT granted`, [key1, key2]);
    if (result.rows[0].waiters >= 1) return;
    await delay(5);
  }
  throw new Error('The first registration request did not reach the controlled rollback barrier.');
}
beforeAll(async () => {
  if (!process.env.DATABASE_URL || !process.env.TEST_DATABASE_URL) throw new Error('Both database URLs required');
  const app = new pg.Client({ connectionString: process.env.DATABASE_URL }); const test = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  try { await app.connect(); await test.connect(); await verifyTestDatabase(app, test); safe = true; } finally { await Promise.allSettled([app.end(), test.end()]); }
  pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL }); prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL }) });
  const hash = await argon2.hash(secret);
  for (const [id, role] of [[owner, 'ORGANIZER'], [other, 'ORGANIZER'], [participant, 'PARTICIPANT'], [participant2, 'PARTICIPANT']]) await prisma.user.create({ data: { id, email: `${id}@events.test`, passwordHash: hash, displayName: `Test ${id}`, role } });
  for (const [id, publicationStatus] of [[visible, 'PUBLISHED'], [hidden, 'UNPUBLISHED']]) await prisma.event.create({ data: { id, organizerId: owner, title: `Fixture ${id}`, startsAt: new Date('2026-12-01T02:00:00Z'), endsAt: new Date('2026-12-01T04:00:00Z'), location: 'A', capacity: 2, publicationStatus } });
  await prisma.registration.create({ data: { id: randomUUID(), eventId: visible, participantId: participant, status: 'ACTIVE' } });
  const config = { nodeEnv: 'test' as const, port: 3000, databaseUrl: process.env.TEST_DATABASE_URL, sessionSecret: 'synthetic-event-session-secret-123456', appOrigin: origin };
  server = createApp(async () => { await prisma.$queryRaw`SELECT 1`; }, { config, pool, prisma }).listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address(); if (!address || typeof address === 'string') throw new Error('No address'); base = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => {
  if (server) await new Promise<void>(resolve => server.close(() => resolve()));
  if (safe && prisma) {
    await prisma.registration.deleteMany({ where: { event: { organizerId: { in: [owner, other] } } } });
    await prisma.event.deleteMany({ where: { organizerId: { in: [owner, other] } } });
    await prisma.$executeRaw`DELETE FROM sessions WHERE sess->>'userId' IN (${owner}, ${other}, ${participant}, ${participant2})`;
    await prisma.user.deleteMany({ where: { id: { in: [owner, other, participant, participant2] } } });
  }
  if (prisma) await prisma.$disconnect(); if (pool) await pool.end();
});
describe('F-02 event APIs', () => {
  it('allows anonymous discovery of published data with database-derived seats and excludes hidden/private data', async () => {
    const detail = await request(`/api/events/${visible}`); expect(detail.status).toBe(200); const dto = (await detail.json()).data;
    expect(dto).toMatchObject({ id: visible, capacity: 2, remainingSeats: 1, organizer: { displayName: `Test ${owner}` } });
    expect(Object.keys(dto).sort()).toEqual(['capacity', 'description', 'endsAt', 'id', 'location', 'organizer', 'remainingSeats', 'startsAt', 'title']);
    expect((await request(`/api/events/${hidden}`)).status).toBe(404);
    expect((await request('/api/events/not-a-uuid')).status).toBe(422);
    const list = await request('/api/events?page=1&pageSize=100'); expect(list.status).toBe(200);
    const data = (await list.json()).data as Array<{ id: string }>;
    expect(data.some(item => item.id === visible)).toBe(true); expect(data.some(item => item.id === hidden)).toBe(false);
    expect((await request('/api/events?organizerId=foo')).status).toBe(422);
  });
  it('allows only Organizer to publish, derives ownership and normalizes data', async () => {
    const organizer = await login(owner); const p = await login(participant);
    const before = await prisma.event.count({ where: { organizerId: owner } });
    expect((await request('/api/events', { method: 'POST', body: valid })).status).toBe(401);
    expect((await request('/api/events', { method: 'POST', cookie: p.cookie, token: p.token, body: valid })).status).toBe(403);
    expect((await request('/api/events', { method: 'POST', cookie: organizer.cookie, token: organizer.token, body: { ...valid, organizerId: other } })).status).toBe(422);
    expect((await request('/api/events', { method: 'POST', cookie: organizer.cookie, token: organizer.token, body: { ...valid, capacity: 0 } })).status).toBe(422);
    expect((await request('/api/events', { method: 'POST', cookie: organizer.cookie, body: valid })).status).toBe(403);
    expect(await prisma.event.count({ where: { organizerId: owner } })).toBe(before);
    const response = await request('/api/events', { method: 'POST', cookie: organizer.cookie, token: organizer.token, body: valid });
    expect(response.status).toBe(201); const dto = (await response.json()).data;
    expect(dto).toMatchObject({ title: 'Event fixture', location: 'Building A', description: null, startsAt: '2026-12-01T02:00:00.000Z', remainingSeats: 3, activeRegistrationCount: 0 });
    expect(await prisma.event.findUnique({ where: { id: dto.id }, select: { organizerId: true, publicationStatus: true } })).toEqual({ organizerId: owner, publicationStatus: 'PUBLISHED' });
  });
  it('publishes capacities 1, 30 and 60 and retrieves each stored value', async () => {
    const organizer = await login(owner);
    for (const capacity of [1, 30, 60]) {
      const response = await request('/api/events', { method: 'POST', cookie: organizer.cookie, token: organizer.token, body: { ...valid, capacity } });
      expect(response.status).toBe(201);
      const event = (await response.json()).data;
      expect(event.capacity).toBe(capacity);
      const stored = await prisma.event.findUniqueOrThrow({ where: { id: event.id }, select: { capacity: true } });
      expect(stored.capacity).toBe(capacity);
      const retrieved = await request(`/api/events/${event.id}`);
      expect(retrieved.status).toBe(200);
      expect((await retrieved.json()).data.capacity).toBe(capacity);
    }
  });
  it('rejects invalid publication capacities with a field error and no new event row', async () => {
    const organizer = await login(owner);
    const before = await prisma.event.count({ where: { organizerId: owner } });
    const invalidCapacities: Array<{ label: string; body: Record<string, unknown> }> = [];
    const missing = { ...valid } as Record<string, unknown>; delete missing.capacity;
    invalidCapacities.push({ label: 'missing', body: missing });
    for (const capacity of [null, 0, -1, 1.5, '3', 61, 2147483647, 2147483648, Number.MAX_SAFE_INTEGER, true, [], {}]) {
      invalidCapacities.push({ label: String(capacity), body: { ...valid, capacity } });
    }
    for (const { label, body } of invalidCapacities) {
      const response = await request('/api/events', { method: 'POST', cookie: organizer.cookie, token: organizer.token, body });
      expect(response.status, `capacity case ${label}`).toBe(422);
      const result = await response.json();
      expect(result.error.code, `capacity case ${label}`).toBe('VALIDATION_ERROR');
      expect(result.error.fieldErrors.capacity, `capacity case ${label}`).toBeTruthy();
    }
    expect(await prisma.event.count({ where: { organizerId: owner } })).toBe(before);
  });
  it('does not insert events for invalid required fields, dates or boundary values', async () => {
    const organizer = await login(owner); const before = await prisma.event.count({ where: { organizerId: owner } });
    const invalidInputs: Record<string, unknown>[] = [];
    for (const field of ['title', 'startsAt', 'endsAt', 'location', 'capacity']) { const input: Record<string, unknown> = { ...valid }; delete input[field]; invalidInputs.push(input); }
    invalidInputs.push(
      { ...valid, title: '   ' }, { ...valid, location: '   ' }, { ...valid, title: 'x'.repeat(201) }, { ...valid, location: 'x'.repeat(301) },
      { ...valid, description: 'x'.repeat(10001) }, { ...valid, description: 1 }, { ...valid, startsAt: '2026-02-30T09:00:00+07:00' },
      { ...valid, startsAt: '2026-12-01T09:00:00' }, { ...valid, endsAt: valid.startsAt },
      { ...valid, capacity: -1 }, { ...valid, capacity: 1.5 }, { ...valid, capacity: '3' }, { ...valid, capacity: 61 }, { ...valid, capacity: 2147483647 }, { ...valid, capacity: 2147483648 },
    );
    for (const body of invalidInputs) {
      const response = await request('/api/events', { method: 'POST', cookie: organizer.cookie, token: organizer.token, body });
      expect(response.status).toBe(422); expect((await response.json()).error.code).toBe('VALIDATION_ERROR');
    }
    expect(await prisma.event.count({ where: { organizerId: owner } })).toBe(before);
  });
  it('persists nullable description variants and an overnight date at field limits', async () => {
    const organizer = await login(owner);
    for (const description of [undefined, null, '', '   ']) {
      const body = description === undefined ? valid : { ...valid, description };
      const response = await request('/api/events', { method: 'POST', cookie: organizer.cookie, token: organizer.token, body });
      expect(response.status).toBe(201); const result = (await response.json()).data;
      expect(result.description).toBeNull(); expect((await prisma.event.findUniqueOrThrow({ where: { id: result.id } })).description).toBeNull();
    }
    const body = { ...valid, title: '😀'.repeat(200), location: 'x'.repeat(300), description: 'x'.repeat(10000), startsAt: '2020-12-31T23:30:00+07:00', endsAt: '2021-01-01T01:00:00+07:00', capacity: 60 };
    const response = await request('/api/events', { method: 'POST', cookie: organizer.cookie, token: organizer.token, body });
    expect(response.status).toBe(201); const event = (await response.json()).data;
    expect(event.startsAt).toBe('2020-12-31T16:30:00.000Z'); expect(event.endsAt).toBe('2020-12-31T18:00:00.000Z');
    expect(event.title).toBe(body.title); expect(event.location).toBe(body.location); expect(event.description).toBe(body.description);
  });
  it('keeps a full published event visible without exposing registrants', async () => {
    const extraUser = randomUUID(); const extraRegistration = randomUUID();
    try {
      await prisma.user.create({ data: { id: extraUser, email: `${extraUser}@events.test`, passwordHash: await argon2.hash(secret), displayName: 'Extra participant', role: 'PARTICIPANT' } });
      await prisma.registration.create({ data: { id: extraRegistration, eventId: visible, participantId: extraUser, status: 'ACTIVE' } });
      const response = await request(`/api/events/${visible}`); expect(response.status).toBe(200);
      const body = await response.json(); expect(body.data.remainingSeats).toBe(0);
      expect(JSON.stringify(body)).not.toContain('Extra participant'); expect(JSON.stringify(body)).not.toContain(extraRegistration);
    } finally { await prisma.registration.deleteMany({ where: { id: extraRegistration } }); await prisma.user.deleteMany({ where: { id: extraUser } }); }
  });
  it('returns stable sorted pages and rejects invalid pagination', async () => {
    const expected = await prisma.event.findMany({ where: { publicationStatus: 'PUBLISHED' }, orderBy: [{ startsAt: 'asc' }, { id: 'asc' }], select: { id: true } });
    const page1 = await request('/api/events?page=1&pageSize=2'); const page2 = await request('/api/events?page=2&pageSize=2');
    const one = await page1.json(), two = await page2.json();
    expect(one.meta).toEqual({ page: 1, pageSize: 2, total: expected.length });
    expect(two.meta).toEqual({ page: 2, pageSize: 2, total: expected.length });
    expect([...one.data, ...two.data].map((row: { id: string }) => row.id)).toEqual(expected.slice(0, 4).map(row => row.id));
    expect((await request('/api/events?pageSize=101')).status).toBe(422);
    expect((await request('/api/events?page=0')).status).toBe(422);
  });
  it('paginates 23 additional published events including tied timestamps using the server total', async () => {
    const fixtureIds = Array.from({ length: 23 }, () => randomUUID());
    const before = await prisma.event.count({ where: { publicationStatus: 'PUBLISHED' } });
    try {
      await prisma.event.createMany({ data: fixtureIds.map(id => ({ id, organizerId: other, title: `Pagination ${id}`, startsAt: new Date('2026-01-01T02:00:00Z'), endsAt: new Date('2026-01-01T04:00:00Z'), location: 'Pagination room', capacity: 1, publicationStatus: 'PUBLISHED' })) });
      const expected = await prisma.event.findMany({ where: { publicationStatus: 'PUBLISHED' }, orderBy: [{ startsAt: 'asc' }, { id: 'asc' }], select: { id: true } });
      const first = await (await request('/api/events?page=1')).json(); const second = await (await request('/api/events?page=2')).json();
      expect(first.meta).toEqual({ page: 1, pageSize: 20, total: before + 23 });
      expect(second.meta).toEqual({ page: 2, pageSize: 20, total: before + 23 });
      expect(first.data).toHaveLength(20);
      expect([...first.data, ...second.data].map((row: { id: string }) => row.id)).toEqual(expected.slice(0, 40).map(row => row.id));
      const organizer = await login(other); const owned = await (await request('/api/me/events?page=2', { cookie: organizer.cookie })).json();
      expect(owned.meta).toEqual({ page: 2, pageSize: 20, total: 23 }); expect(owned.data).toHaveLength(3);
    } finally { await prisma.event.deleteMany({ where: { organizerId: other, id: { in: fixtureIds } } }); }
  });
  it('restricts My Events to the signed-in Organizer', async () => {
    const a = await login(owner), b = await login(other), p = await login(participant);
    expect((await request('/api/me/events')).status).toBe(401);
    expect((await request('/api/me/events', { cookie: p.cookie })).status).toBe(403);
    expect((await request(`/api/me/events?organizerId=${other}`, { cookie: a.cookie })).status).toBe(422);
    const responseA = await request('/api/me/events', { cookie: a.cookie }); const responseB = await request('/api/me/events', { cookie: b.cookie });
    const rowsA = (await responseA.json()).data as Array<{ id: string }>; const rowsB = (await responseB.json()).data as Array<{ id: string }>;
    expect(rowsA.some(row => row.id === visible)).toBe(true); expect(rowsB.some(row => row.id === visible)).toBe(false);
  });
  it('isolates both Organizers with valid own events and rejects forged owner and bad CSRF', async () => {
    const a = await login(owner), b = await login(other); const before = await prisma.event.count();
    const badOrigin = await request('/api/events', { method: 'POST', cookie: a.cookie, token: a.token, origin: 'https://invalid.example', body: valid });
    const badToken = await request('/api/events', { method: 'POST', cookie: a.cookie, token: 'invalid', body: valid });
    expect(badOrigin.status).toBe(403); expect((await badOrigin.json()).error.code).toBe('CSRF_INVALID');
    expect(badToken.status).toBe(403); expect((await badToken.json()).error.code).toBe('CSRF_INVALID');
    const spoof = await request('/api/events', { method: 'POST', cookie: a.cookie, token: a.token, body: { ...valid, organizerId: other } });
    expect(spoof.status).toBe(422); expect(await prisma.event.count()).toBe(before);
    const created = await request('/api/events', { method: 'POST', cookie: b.cookie, token: b.token, body: valid });
    expect(created.status).toBe(201); const otherEvent = (await created.json()).data.id as string;
    expect((await prisma.event.findUniqueOrThrow({ where: { id: otherEvent } })).organizerId).toBe(other);
    const ownA = (await (await request('/api/me/events?pageSize=100', { cookie: a.cookie })).json()).data as Array<{ id: string }>;
    const ownB = (await (await request('/api/me/events?pageSize=100', { cookie: b.cookie })).json()).data as Array<{ id: string }>;
    expect(ownA.some(row => row.id === visible)).toBe(true); expect(ownA.some(row => row.id === otherEvent)).toBe(false);
    expect(ownB.some(row => row.id === otherEvent)).toBe(true); expect(ownB.some(row => row.id === visible)).toBe(false);
    expect((await request(`/api/events/${randomUUID()}`)).status).toBe(404);
  });
});

describe('F-03 registration APIs', () => {
  it('preserves legacy capacity 61 and existing registrations while admitting the last seat', async () => {
    // Direct DB setup models a pre-change row; new publication still uses the HTTP validator.
    const legacyEvent = randomUUID();
    const legacyParticipants = Array.from({ length: 60 }, () => randomUUID());
    const legacyRegistrations = Array.from({ length: 60 }, () => randomUUID());
    const fixtureHash = (await prisma.user.findUniqueOrThrow({ where: { id: owner } })).passwordHash;
    try {
      await prisma.user.createMany({ data: legacyParticipants.map(id => ({ id, email: `${id}@legacy.events.test`, passwordHash: fixtureHash, displayName: `Legacy ${id}`, role: 'PARTICIPANT' })) });
      await prisma.event.create({ data: { id: legacyEvent, organizerId: owner, title: 'Legacy capacity 61', startsAt: new Date('2026-12-01T02:00:00Z'), endsAt: new Date('2026-12-01T04:00:00Z'), location: 'A', capacity: 61, publicationStatus: 'PUBLISHED' } });
      await prisma.registration.createMany({ data: legacyParticipants.map((id, index) => ({ id: legacyRegistrations[index], eventId: legacyEvent, participantId: id, status: 'ACTIVE' })) });
      const beforeEvent = await prisma.event.findUniqueOrThrow({ where: { id: legacyEvent } });
      const beforeRegistrations = await prisma.registration.findMany({ where: { eventId: legacyEvent }, orderBy: { id: 'asc' } });
      expect(beforeRegistrations).toHaveLength(60);
      const publicDetail = await request(`/api/events/${legacyEvent}`);
      expect(publicDetail.status).toBe(200);
      expect((await publicDetail.json()).data).toMatchObject({ id: legacyEvent, capacity: 61, remainingSeats: 1 });
      const publicList = await request('/api/events?pageSize=100');
      expect(publicList.status).toBe(200);
      expect((await publicList.json()).data).toEqual(expect.arrayContaining([expect.objectContaining({ id: legacyEvent, capacity: 61, remainingSeats: 1 })]));
      const o = await login(owner);
      const owned = await request('/api/me/events?pageSize=100', { cookie: o.cookie });
      expect(owned.status).toBe(200);
      expect((await owned.json()).data).toEqual(expect.arrayContaining([expect.objectContaining({ id: legacyEvent, capacity: 61, activeRegistrationCount: 60, remainingSeats: 1 })]));
      const p = await login(participant);
      const registered = await request(`/api/events/${legacyEvent}/registrations`, { method: 'POST', cookie: p.cookie, token: p.token, body: {} });
      expect(registered.status).toBe(201);
      const created = (await registered.json()).data;
      expect(created).toMatchObject({ status: 'ACTIVE', event: { id: legacyEvent, remainingSeats: 0 } });
      expect(await prisma.registration.findUniqueOrThrow({ where: { id: created.id } })).toMatchObject({ eventId: legacyEvent, participantId: participant, status: 'ACTIVE' });
      expect(await prisma.registration.count({ where: { eventId: legacyEvent, status: 'ACTIVE' } })).toBe(61);
      const p2 = await login(participant2);
      const full = await request(`/api/events/${legacyEvent}/registrations`, { method: 'POST', cookie: p2.cookie, token: p2.token, body: {} });
      expect(full.status).toBe(409);
      expect((await full.json()).error.code).toBe('EVENT_FULL');
      expect(await prisma.registration.count({ where: { eventId: legacyEvent } })).toBe(61);
      expect(await prisma.registration.count({ where: { eventId: legacyEvent, participantId: participant2 } })).toBe(0);
      const fullDetail = await request(`/api/events/${legacyEvent}`);
      expect(fullDetail.status).toBe(200);
      expect((await fullDetail.json()).data).toMatchObject({ id: legacyEvent, capacity: 61, remainingSeats: 0 });
      expect(await prisma.event.findUniqueOrThrow({ where: { id: legacyEvent } })).toEqual(beforeEvent);
      expect(await prisma.registration.findMany({ where: { id: { in: legacyRegistrations } }, orderBy: { id: 'asc' } })).toEqual(beforeRegistrations);
    } finally {
      await prisma.registration.deleteMany({ where: { eventId: legacyEvent } });
      await prisma.event.deleteMany({ where: { id: legacyEvent } });
      await prisma.user.deleteMany({ where: { id: { in: legacyParticipants } } });
    }
  });

  it('rejects the next Participant registration when a capacity-one event is full', async () => {
    const fullEvent = randomUUID();
    await prisma.event.create({ data: { id: fullEvent, organizerId: owner, title: 'Capacity-one controlled exercise', startsAt: new Date('2026-12-01T02:00:00Z'), endsAt: new Date('2026-12-01T04:00:00Z'), location: 'A', capacity: 1, publicationStatus: 'PUBLISHED' } });
    try {
      const firstParticipant = await login(participant);
      const secondParticipant = await login(participant2);

      const firstResponse = await request(`/api/events/${fullEvent}/registrations`, { method: 'POST', cookie: firstParticipant.cookie, token: firstParticipant.token, body: {} });
      expect(firstResponse.status).toBe(201);

      const secondResponse = await request(`/api/events/${fullEvent}/registrations`, { method: 'POST', cookie: secondParticipant.cookie, token: secondParticipant.token, body: {} });
      expect(secondResponse.status).toBe(409);
      expect((await secondResponse.json()).error.code).toBe('EVENT_FULL');

      const activeCount = await prisma.registration.count({ where: { eventId: fullEvent, status: 'ACTIVE' } });
      const event = await prisma.event.findUniqueOrThrow({ where: { id: fullEvent }, select: { capacity: true } });
      expect(activeCount).toBe(1);
      expect(activeCount).toBeLessThanOrEqual(event.capacity);
      expect(await prisma.registration.count({ where: { eventId: fullEvent, participantId: participant2, status: 'ACTIVE' } })).toBe(0);
    } finally {
      await prisma.registration.deleteMany({ where: { eventId: fullEvent } });
      await prisma.event.deleteMany({ where: { id: fullEvent } });
    }
  });

  it('registers a Participant and returns only their own persisted registration', async () => {
    const freshEvent = randomUUID();
    await prisma.event.create({ data: { id: freshEvent, organizerId: owner, title: 'Open registration', startsAt: new Date('2026-12-01T02:00:00Z'), endsAt: new Date('2026-12-01T04:00:00Z'), location: 'A', capacity: 2, publicationStatus: 'PUBLISHED' } });
    try {
      const p = await login(participant);
      const response = await request(`/api/events/${freshEvent}/registrations`, { method: 'POST', cookie: p.cookie, token: p.token, body: {} });
      expect(response.status).toBe(201);
      const created = (await response.json()).data;
      expect(created).toMatchObject({ status: 'ACTIVE', participant: { displayName: `Test ${participant}` }, event: { id: freshEvent, remainingSeats: 1 } });
      expect(created.registeredAt).toBeTruthy();
      expect(Object.keys(created).sort()).toEqual(['cancelledAt', 'event', 'id', 'participant', 'registeredAt', 'status']);
      expect(created.cancelledAt).toBeNull();
      const list = await request(`/api/me/registrations?eventId=${freshEvent}`, { cookie: p.cookie });
      expect(list.status).toBe(200); expect((await list.json()).data[0].id).toBe(created.id);
      expect((await request(`/api/me/registrations/${created.id}`, { cookie: p.cookie })).status).toBe(200);
      const p2 = await login(participant2);
      expect((await request(`/api/me/registrations/${created.id}`, { cookie: p2.cookie })).status).toBe(404);
    } finally {
      await prisma.registration.deleteMany({ where: { eventId: freshEvent } });
      await prisma.event.deleteMany({ where: { id: freshEvent } });
    }
  });

  it('rejects duplicate, full, hidden, malformed, forged and unauthorized registration requests without extra rows', async () => {
    const p = await login(participant), p2 = await login(participant2), o = await login(owner);
    await prisma.event.update({ where: { id: visible }, data: { capacity: 1 } });
    const before = await prisma.registration.count({ where: { eventId: visible } });
    const anonymous = await request(`/api/events/${visible}/registrations`, { method: 'POST', body: {} });
    expect(anonymous.status).toBe(401);
    const badCsrf = await request(`/api/events/${visible}/registrations`, { method: 'POST', cookie: p2.cookie, token: 'invalid-token', body: {} });
    expect(badCsrf.status).toBe(403); expect((await badCsrf.json()).error.code).toBe('CSRF_INVALID');
    const duplicate = await request(`/api/events/${visible}/registrations`, { method: 'POST', cookie: p.cookie, token: p.token, body: {} });
    expect(duplicate.status).toBe(409); expect((await duplicate.json()).error).toMatchObject({ code: 'ALREADY_REGISTERED' });
    expect((await request(`/api/events/${visible}/registrations`, { method: 'POST', cookie: p2.cookie, token: p2.token, body: {} })).status).toBe(409);
    expect((await request(`/api/events/${hidden}/registrations`, { method: 'POST', cookie: p2.cookie, token: p2.token, body: {} })).status).toBe(404);
    expect((await request(`/api/events/${randomUUID()}/registrations`, { method: 'POST', cookie: p2.cookie, token: p2.token, body: {} })).status).toBe(404);
    expect((await request('/api/events/not-a-uuid/registrations', { method: 'POST', cookie: p2.cookie, token: p2.token, body: {} })).status).toBe(422);
    expect((await request(`/api/events/${visible}/registrations`, { method: 'POST', cookie: o.cookie, token: o.token, body: {} })).status).toBe(403);
    expect((await request(`/api/events/${visible}/registrations`, { method: 'POST', cookie: p2.cookie, token: p2.token, body: { participantId: owner } })).status).toBe(422);
    expect((await request('/api/me/registrations?participantId=' + participant2, { cookie: p2.cookie })).status).toBe(422);
    expect((await request('/api/me/registrations/not-a-uuid', { cookie: p2.cookie })).status).toBe(422);
    expect(await prisma.registration.count({ where: { eventId: visible } })).toBe(before);
    await prisma.event.update({ where: { id: visible }, data: { capacity: 2 } });
  });

  it('allows only one of two Participants to claim the last seat once plus 20 isolated repetitions', async () => {
    const blocker = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL }); const observer = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
    try {
      await Promise.all([blocker.connect(), observer.connect()]);
      for (let repetition = 0; repetition < 21; repetition++) {
        const lastSeatEvent = randomUUID();
        await prisma.event.create({ data: { id: lastSeatEvent, organizerId: owner, title: `Last seat ${repetition + 1}`, startsAt: new Date('2026-12-01T02:00:00Z'), endsAt: new Date('2026-12-01T04:00:00Z'), location: 'A', capacity: 1, publicationStatus: 'PUBLISHED' } });
        let requests: Promise<Response>[] = [];
        try {
          const [p1, p2] = await Promise.all([login(participant), login(participant2)]);
          await blocker.query('BEGIN'); await blocker.query('SELECT id FROM events WHERE id = $1::uuid FOR UPDATE', [lastSeatEvent]);
          const contenders = repetition % 2 === 0 ? [p1, p2] : [p2, p1];
          requests = contenders.map(p => request(`/api/events/${lastSeatEvent}/registrations`, { method: 'POST', cookie: p.cookie, token: p.token, body: {} }));
          await waitForRegistrationLockWaiters(observer, 2);
          await blocker.query('COMMIT');
          const results = await Promise.all(requests);
          expect(results.map(response => response.status).sort()).toEqual([201, 409]);
          const conflict = results.find(response => response.status === 409)!;
          expect((await conflict.json()).error.code).toBe('EVENT_FULL');
          expect(await prisma.registration.count({ where: { eventId: lastSeatEvent, status: 'ACTIVE' } })).toBe(1);
          const event = await prisma.event.findUniqueOrThrow({ where: { id: lastSeatEvent }, select: { capacity: true, _count: { select: { registrations: { where: { status: 'ACTIVE' } } } } } });
          expect(event._count.registrations).toBe(event.capacity);
        } finally {
          await blocker.query('ROLLBACK').catch(() => undefined);
          await Promise.allSettled(requests);
          await prisma.registration.deleteMany({ where: { eventId: lastSeatEvent } });
          await prisma.event.deleteMany({ where: { id: lastSeatEvent } });
        }
      }
    } finally {
      await Promise.all([blocker.end().catch(() => undefined), observer.end().catch(() => undefined)]);
    }
  }, 120_000);

  it('serializes simultaneous duplicate requests once plus 20 isolated repetitions', async () => {
    const blocker = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL }); const observer = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
    try {
      await Promise.all([blocker.connect(), observer.connect()]);
      for (let repetition = 0; repetition < 21; repetition++) {
        const duplicateEvent = randomUUID();
        await prisma.event.create({ data: { id: duplicateEvent, organizerId: owner, title: `Duplicate race ${repetition + 1}`, startsAt: new Date('2026-12-01T02:00:00Z'), endsAt: new Date('2026-12-01T04:00:00Z'), location: 'A', capacity: 3, publicationStatus: 'PUBLISHED' } });
        let requests: Promise<Response>[] = [];
        try {
          const [firstSession, secondSession] = await Promise.all([login(participant2), login(participant2)]);
          await blocker.query('BEGIN'); await blocker.query('SELECT id FROM events WHERE id = $1::uuid FOR UPDATE', [duplicateEvent]);
          const contenders = repetition % 2 === 0 ? [firstSession, secondSession] : [secondSession, firstSession];
          requests = contenders.map(p => request(`/api/events/${duplicateEvent}/registrations`, { method: 'POST', cookie: p.cookie, token: p.token, body: {} }));
          await waitForRegistrationLockWaiters(observer, 2);
          await blocker.query('COMMIT');
          const responses = await Promise.all(requests);
          expect(responses.map(response => response.status).sort()).toEqual([201, 409]);
          const created = responses.find(response => response.status === 201)!; const conflict = responses.find(response => response.status === 409)!;
          const registrationId = (await created.json()).data.id as string;
          expect((await conflict.json()).error).toMatchObject({ code: 'ALREADY_REGISTERED', registrationId });
          expect(await prisma.registration.count({ where: { eventId: duplicateEvent, participantId: participant2, status: 'ACTIVE' } })).toBe(1);
          await expect(prisma.registration.create({ data: { eventId: duplicateEvent, participantId: participant2, status: 'ACTIVE' } })).rejects.toMatchObject({ code: 'P2002' });
        } finally {
          await blocker.query('ROLLBACK').catch(() => undefined);
          await Promise.allSettled(requests);
          await prisma.registration.deleteMany({ where: { eventId: duplicateEvent } }); await prisma.event.deleteMany({ where: { id: duplicateEvent } });
        }
      }
    } finally {
      await Promise.all([blocker.end().catch(() => undefined), observer.end().catch(() => undefined)]);
    }
  }, 120_000);

  it('returns a safe temporary-unavailable response when the Event lock times out', async () => {
    const lockEvent = randomUUID();
    await prisma.event.create({ data: { id: lockEvent, organizerId: owner, title: 'Locked event', startsAt: new Date('2026-12-01T02:00:00Z'), endsAt: new Date('2026-12-01T04:00:00Z'), location: 'A', capacity: 2, publicationStatus: 'PUBLISHED' } });
    const blocker = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
    try {
      await blocker.connect(); await blocker.query('BEGIN'); await blocker.query('SELECT id FROM events WHERE id = $1::uuid FOR UPDATE', [lockEvent]);
      const p = await login(participant2);
      const response = await request(`/api/events/${lockEvent}/registrations`, { method: 'POST', cookie: p.cookie, token: p.token, body: {} });
      expect(response.status).toBe(503); expect((await response.json()).error.code).toBe('TEMPORARILY_UNAVAILABLE');
      expect(await prisma.registration.count({ where: { eventId: lockEvent } })).toBe(0);
    } finally {
      await blocker.query('ROLLBACK').catch(() => undefined); await blocker.end();
      await prisma.registration.deleteMany({ where: { eventId: lockEvent } }); await prisma.event.deleteMany({ where: { id: lockEvent } });
    }
  });

  it('rolls back a registration when the database fails after the insert', async () => {
    const rollbackEvent = randomUUID(); const suffix = rollbackEvent.replaceAll('-', '');
    const functionName = `f03_fail_after_insert_${suffix}`; const triggerName = `f03_fail_after_insert_${suffix}`;
    const triggerClient = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
    await prisma.event.create({ data: { id: rollbackEvent, organizerId: owner, title: 'Rollback registration', startsAt: new Date('2026-12-01T02:00:00Z'), endsAt: new Date('2026-12-01T04:00:00Z'), location: 'A', capacity: 1, publicationStatus: 'PUBLISHED' } });
    try {
      await triggerClient.connect();
      await triggerClient.query(`CREATE FUNCTION "${functionName}"() RETURNS trigger LANGUAGE plpgsql AS $f03$ BEGIN IF NEW.event_id = '${rollbackEvent}'::uuid THEN RAISE EXCEPTION 'intentional F-03 rollback test' USING ERRCODE = 'P0001'; END IF; RETURN NEW; END; $f03$`);
      await triggerClient.query(`CREATE TRIGGER "${triggerName}" AFTER INSERT ON registrations FOR EACH ROW EXECUTE FUNCTION "${functionName}"()`);
      const p = await login(participant2);
      const response = await request(`/api/events/${rollbackEvent}/registrations`, { method: 'POST', cookie: p.cookie, token: p.token, body: {} });
      expect(response.status).toBe(500); expect((await response.json()).error.code).toBe('INTERNAL_ERROR');
      expect(await prisma.registration.count({ where: { eventId: rollbackEvent } })).toBe(0);
    } finally {
      await triggerClient.query(`DROP TRIGGER IF EXISTS "${triggerName}" ON registrations`).catch(() => undefined);
      await triggerClient.query(`DROP FUNCTION IF EXISTS "${functionName}"()`).catch(() => undefined);
      await triggerClient.end().catch(() => undefined);
      await prisma.registration.deleteMany({ where: { eventId: rollbackEvent } });
      await prisma.event.deleteMany({ where: { id: rollbackEvent } });
    }
  });

  it('lets a waiting Participant claim the last seat after the first contender rolls back', async () => {
    const rollbackRaceEvent = randomUUID(); const suffix = rollbackRaceEvent.replaceAll('-', '');
    const functionName = `f03_waiting_rollback_${suffix}`; const triggerName = `f03_waiting_rollback_${suffix}`;
    const key1 = randomInt(1, 2_000_000_000); const key2 = randomInt(1, 2_000_000_000);
    const barrier = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL }); const observer = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
    let requests: Promise<Response>[] = [];
    await prisma.event.create({ data: { id: rollbackRaceEvent, organizerId: owner, title: 'Rollback with waiting registration', startsAt: new Date('2026-12-01T02:00:00Z'), endsAt: new Date('2026-12-01T04:00:00Z'), location: 'A', capacity: 1, publicationStatus: 'PUBLISHED' } });
    try {
      await Promise.all([barrier.connect(), observer.connect()]);
      await barrier.query('SELECT pg_advisory_lock($1::int, $2::int)', [key1, key2]);
      await barrier.query(`CREATE FUNCTION "${functionName}"() RETURNS trigger LANGUAGE plpgsql AS $f03$ BEGIN IF NEW.event_id = '${rollbackRaceEvent}'::uuid AND NEW.participant_id = '${participant}'::uuid THEN PERFORM pg_advisory_lock(${key1}, ${key2}); PERFORM pg_advisory_unlock(${key1}, ${key2}); RAISE EXCEPTION 'intentional first-contender rollback' USING ERRCODE = 'P0001'; END IF; RETURN NEW; END; $f03$`);
      await barrier.query(`CREATE TRIGGER "${triggerName}" AFTER INSERT ON registrations FOR EACH ROW EXECUTE FUNCTION "${functionName}"()`);

      const firstParticipant = await login(participant); const waitingParticipant = await login(participant2);
      requests.push(request(`/api/events/${rollbackRaceEvent}/registrations`, { method: 'POST', cookie: firstParticipant.cookie, token: firstParticipant.token, body: {} }));
      await waitForAdvisoryLockWaiter(observer, key1, key2);
      requests.push(request(`/api/events/${rollbackRaceEvent}/registrations`, { method: 'POST', cookie: waitingParticipant.cookie, token: waitingParticipant.token, body: {} }));
      await waitForRegistrationLockWaiters(observer, 1, 700);
      await barrier.query('SELECT pg_advisory_unlock($1::int, $2::int)', [key1, key2]);

      const [rolledBack, succeeded] = await Promise.all(requests);
      expect(rolledBack.status).toBe(500); expect((await rolledBack.json()).error.code).toBe('INTERNAL_ERROR');
      expect(succeeded.status).toBe(201);
      const created = (await succeeded.json()).data;
      expect(created).toMatchObject({ status: 'ACTIVE', participant: { displayName: `Test ${participant2}` }, event: { id: rollbackRaceEvent } });
      expect(await prisma.registration.count({ where: { eventId: rollbackRaceEvent, participantId: participant, status: 'ACTIVE' } })).toBe(0);
      expect(await prisma.registration.count({ where: { eventId: rollbackRaceEvent, status: 'ACTIVE' } })).toBe(1);
      const event = await prisma.event.findUniqueOrThrow({ where: { id: rollbackRaceEvent }, select: { capacity: true, _count: { select: { registrations: { where: { status: 'ACTIVE' } } } } } });
      expect(event._count.registrations).toBeLessThanOrEqual(event.capacity);
    } finally {
      await barrier.query('SELECT pg_advisory_unlock($1::int, $2::int)', [key1, key2]).catch(() => undefined);
      await Promise.allSettled(requests);
      await barrier.query(`DROP TRIGGER IF EXISTS "${triggerName}" ON registrations`).catch(() => undefined);
      await barrier.query(`DROP FUNCTION IF EXISTS "${functionName}"()`).catch(() => undefined);
      await Promise.all([barrier.end().catch(() => undefined), observer.end().catch(() => undefined)]);
      await prisma.registration.deleteMany({ where: { eventId: rollbackRaceEvent } });
      await prisma.event.deleteMany({ where: { id: rollbackRaceEvent } });
    }
  }, 10_000);

  it('keeps a Registration readable after restarting the app with the same database', async () => {
    const persistentEvent = randomUUID();
    await prisma.event.create({ data: { id: persistentEvent, organizerId: owner, title: 'Persistent registration', startsAt: new Date('2026-12-01T02:00:00Z'), endsAt: new Date('2026-12-01T04:00:00Z'), location: 'A', capacity: 1, publicationStatus: 'PUBLISHED' } });
    let registrationId: string | undefined; let child: ChildProcess | undefined;
    try {
      const p = await login(participant2);
      const created = await request(`/api/events/${persistentEvent}/registrations`, { method: 'POST', cookie: p.cookie, token: p.token, body: {} });
      expect(created.status).toBe(201); registrationId = (await created.json()).data.id as string;
      const probe = createServer(); await new Promise<void>(resolve => probe.listen(0, '127.0.0.1', resolve));
      const address = probe.address(); if (!address || typeof address === 'string') throw new Error('No restart-test port'); const port = address.port;
      await new Promise<void>(resolve => probe.close(() => resolve()));
      child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], { cwd: process.cwd(), env: { ...process.env, NODE_ENV: 'test', PORT: String(port), DATABASE_URL: process.env.TEST_DATABASE_URL!, APP_ORIGIN: origin, SESSION_SECRET: 'synthetic-restart-session-secret-123456' }, stdio: 'ignore' });
      const restartedBase = `http://127.0.0.1:${port}`; let ready = false;
      for (let attempt = 0; attempt < 100 && !ready; attempt++) {
        if (child.exitCode !== null) throw new Error(`Restarted app exited with ${child.exitCode}`);
        try { ready = (await fetch(`${restartedBase}/api/health`)).ok; } catch { await delay(100); }
      }
      expect(ready).toBe(true);
      const freshLogin = await login(participant2, restartedBase);
      const reread = await request(`/api/me/registrations/${registrationId}`, { cookie: freshLogin.cookie }, restartedBase);
      expect(reread.status).toBe(200); expect((await reread.json()).data).toMatchObject({ id: registrationId, event: { id: persistentEvent } });
      expect(await prisma.registration.count({ where: { id: registrationId } })).toBe(1);
    } finally {
      if (child && child.exitCode === null) { child.kill(); await new Promise<void>(resolve => child?.once('exit', () => resolve())); }
      if (registrationId) await prisma.registration.deleteMany({ where: { id: registrationId } });
      await prisma.event.deleteMany({ where: { id: persistentEvent } });
    }
  });
});

describe('F-04 Organizer registration list API', () => {
  it('authorizes the owner before returning a private, paginated read-only snapshot', async () => {
    const eventId = randomUUID(), emptyEventId = randomUUID();
    const participantIds = Array.from({ length: 21 }, () => randomUUID());
    const registrationIds = Array.from({ length: 21 }, () => randomUUID());
    const registeredAt = new Date('2026-11-01T10:00:00.000Z');
    try {
      await prisma.event.createMany({ data: [eventId, emptyEventId].map(id => ({
        id, organizerId: owner, title: `Private list ${id}`, startsAt: new Date('2026-12-01T02:00:00Z'),
        endsAt: new Date('2026-12-01T04:00:00Z'), location: 'Private room', capacity: 25, publicationStatus: 'PUBLISHED',
      })) });
      await prisma.user.createMany({ data: participantIds.map((id, index) => ({
        id, email: `${id}@events.test`, passwordHash: 'test-only-hash', displayName: `Registrant ${String(index + 1).padStart(2, '0')}`, role: 'PARTICIPANT',
      })) });
      await prisma.registration.createMany({ data: participantIds.map((participantId, index) => ({
        id: registrationIds[index], eventId, participantId, status: 'ACTIVE', registeredAt,
      })) });

      const organizer = await login(owner), otherOrganizer = await login(other), p = await login(participant);
      const beforeCount = await prisma.registration.count({ where: { eventId } });
      const path = `/api/organizer/events/${eventId}/registrations`;

      expect((await request(path)).status).toBe(401);
      expect((await request(path, { cookie: p.cookie })).status).toBe(403);

      const denied = await request(path, { cookie: otherOrganizer.cookie });
      const unknown = await request(`/api/organizer/events/${randomUUID()}/registrations`, { cookie: otherOrganizer.cookie });
      expect(denied.status).toBe(404); expect(unknown.status).toBe(404);
      expect(await denied.json()).toEqual(await unknown.json());
      expect((await request(`/api/events/${eventId}`)).status).toBe(200);

      expect((await request('/api/organizer/events/not-a-uuid/registrations', { cookie: organizer.cookie })).status).toBe(422);
      expect((await request(`${path}?pageSize=101`, { cookie: organizer.cookie })).status).toBe(422);

      const firstResponse = await request(path, { cookie: organizer.cookie });
      expect(firstResponse.status).toBe(200);
      expect(firstResponse.headers.get('cache-control')).toContain('no-store');
      const first = await firstResponse.json();
      expect(first.data.event).toMatchObject({ id: eventId, title: `Private list ${eventId}`, capacity: 25, remainingSeats: 4 });
      expect(first.data.summary).toEqual({ capacity: 25, activeRegistrations: 21, remainingSeats: 4 });
      expect(first.meta).toEqual({ page: 1, pageSize: 20, total: 21 });
      expect(first.data.registrations).toHaveLength(20);
      expect(first.data.registrations.map((row: { id: string }) => row.id)).toEqual([...registrationIds].sort().slice(0, 20));
      expect(Object.keys(first.data.registrations[0]).sort()).toEqual(['displayName', 'id', 'registeredAt', 'status']);
      expect(first.data.registrations[0]).toMatchObject({ displayName: expect.stringMatching(/^Registrant /), registeredAt: registeredAt.toISOString(), status: 'ACTIVE' });
      const serialized = JSON.stringify(first);
      for (const forbidden of ['@events.test', 'passwordHash', 'password_hash', 'participantId', 'phone', 'email']) expect(serialized).not.toContain(forbidden);

      const second = await (await request(`${path}?page=2`, { cookie: organizer.cookie })).json();
      expect(second.meta).toEqual({ page: 2, pageSize: 20, total: 21 });
      expect(second.data.registrations.map((row: { id: string }) => row.id)).toEqual([...registrationIds].sort().slice(20));

      const empty = await (await request(`/api/organizer/events/${emptyEventId}/registrations`, { cookie: organizer.cookie })).json();
      expect(empty.data.registrations).toEqual([]);
      expect(empty.data.summary).toEqual({ capacity: 25, activeRegistrations: 0, remainingSeats: 25 });
      expect(empty.meta).toEqual({ page: 1, pageSize: 20, total: 0 });
      expect(await prisma.registration.count({ where: { eventId } })).toBe(beforeCount);
    } finally {
      await prisma.registration.deleteMany({ where: { eventId } });
      await prisma.event.deleteMany({ where: { id: { in: [eventId, emptyEventId] } } });
      await prisma.user.deleteMany({ where: { id: { in: participantIds } } });
    }
  });
});
