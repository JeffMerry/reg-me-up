import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
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
async function request(path: string, opts: { method?: string; cookie?: string; token?: string; body?: unknown; origin?: string } = {}) {
  return fetch(`${base}${path}`, { method: opts.method ?? 'GET', headers: { ...(opts.cookie ? { Cookie: opts.cookie } : {}), ...(opts.method ? { Origin: opts.origin ?? origin, 'Content-Type': 'application/json' } : {}), ...(opts.token ? { 'X-CSRF-Token': opts.token } : {}) }, ...(opts.body === undefined ? {} : { body: JSON.stringify(opts.body) }) });
}
async function login(id: string) {
  const boot = await request('/api/auth/csrf'); const cookie = boot.headers.get('set-cookie')!.split(';')[0]; const token = (await boot.json()).data.csrfToken as string;
  const response = await request('/api/auth/login', { method: 'POST', cookie, token, body: { email: `${id}@events.test`, password: secret } });
  expect(response.status).toBe(200); return { cookie: response.headers.get('set-cookie')!.split(';')[0], token: (await response.json()).data.csrfToken as string };
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
  it('does not insert events for invalid required fields, dates or boundary values', async () => {
    const organizer = await login(owner); const before = await prisma.event.count({ where: { organizerId: owner } });
    const invalidInputs: Record<string, unknown>[] = [];
    for (const field of ['title', 'startsAt', 'endsAt', 'location', 'capacity']) { const input: Record<string, unknown> = { ...valid }; delete input[field]; invalidInputs.push(input); }
    invalidInputs.push(
      { ...valid, title: '   ' }, { ...valid, location: '   ' }, { ...valid, title: 'x'.repeat(201) }, { ...valid, location: 'x'.repeat(301) },
      { ...valid, description: 'x'.repeat(10001) }, { ...valid, description: 1 }, { ...valid, startsAt: '2026-02-30T09:00:00+07:00' },
      { ...valid, startsAt: '2026-12-01T09:00:00' }, { ...valid, endsAt: valid.startsAt },
      { ...valid, capacity: -1 }, { ...valid, capacity: 1.5 }, { ...valid, capacity: '3' }, { ...valid, capacity: 2147483648 },
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
    const body = { ...valid, title: '😀'.repeat(200), location: 'x'.repeat(300), description: 'x'.repeat(10000), startsAt: '2020-12-31T23:30:00+07:00', endsAt: '2021-01-01T01:00:00+07:00', capacity: 2147483647 };
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
      expect(Object.keys(created).sort()).toEqual(['event', 'id', 'participant', 'registeredAt', 'status']);
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
    const duplicate = await request(`/api/events/${visible}/registrations`, { method: 'POST', cookie: p.cookie, token: p.token, body: {} });
    expect(duplicate.status).toBe(409); expect((await duplicate.json()).error).toMatchObject({ code: 'ALREADY_REGISTERED' });
    expect((await request(`/api/events/${visible}/registrations`, { method: 'POST', cookie: p2.cookie, token: p2.token, body: {} })).status).toBe(409);
    expect((await request(`/api/events/${hidden}/registrations`, { method: 'POST', cookie: p2.cookie, token: p2.token, body: {} })).status).toBe(404);
    expect((await request(`/api/events/${randomUUID()}/registrations`, { method: 'POST', cookie: p2.cookie, token: p2.token, body: {} })).status).toBe(404);
    expect((await request('/api/events/not-a-uuid/registrations', { method: 'POST', cookie: p2.cookie, token: p2.token, body: {} })).status).toBe(422);
    expect((await request(`/api/events/${visible}/registrations`, { method: 'POST', cookie: o.cookie, token: o.token, body: {} })).status).toBe(403);
    expect((await request(`/api/events/${visible}/registrations`, { method: 'POST', cookie: p2.cookie, token: p2.token, body: { participantId: owner } })).status).toBe(422);
    expect(await prisma.registration.count({ where: { eventId: visible } })).toBe(before);
    await prisma.event.update({ where: { id: visible }, data: { capacity: 2 } });
  });

  it('allows only one of two Participants to claim the last seat', async () => {
    const lastSeatEvent = randomUUID();
    await prisma.event.create({ data: { id: lastSeatEvent, organizerId: owner, title: 'Last seat', startsAt: new Date('2026-12-01T02:00:00Z'), endsAt: new Date('2026-12-01T04:00:00Z'), location: 'A', capacity: 1, publicationStatus: 'PUBLISHED' } });
    try {
      const [p1, p2] = await Promise.all([login(participant), login(participant2)]);
      const results = await Promise.all([p1, p2].map(p => request(`/api/events/${lastSeatEvent}/registrations`, { method: 'POST', cookie: p.cookie, token: p.token, body: {} })));
      expect(results.map(response => response.status).sort()).toEqual([201, 409]);
      const conflict = results.find(response => response.status === 409)!;
      expect((await conflict.json()).error.code).toBe('EVENT_FULL');
      expect(await prisma.registration.count({ where: { eventId: lastSeatEvent, status: 'ACTIVE' } })).toBe(1);
      const event = await prisma.event.findUniqueOrThrow({ where: { id: lastSeatEvent }, select: { capacity: true, _count: { select: { registrations: { where: { status: 'ACTIVE' } } } } } });
      expect(event._count.registrations).toBe(event.capacity);
    } finally {
      await prisma.registration.deleteMany({ where: { eventId: lastSeatEvent } });
      await prisma.event.deleteMany({ where: { id: lastSeatEvent } });
    }
  });
});
