import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import argon2 from 'argon2';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { createApp } from '../../src/app.js';
import { verifyTestDatabase } from '../../src/test-db-safety.js';

const owner = randomUUID(), other = randomUUID(), participant = randomUUID(), visible = randomUUID(), hidden = randomUUID();
const secret = 'synthetic-event-test-password';
const origin = 'http://localhost:5173';
const valid = { title: '  Event fixture  ', startsAt: '2026-12-01T09:00:00+07:00', endsAt: '2026-12-01T11:00:00+07:00', location: ' Building A ', capacity: 3 };
let pool: pg.Pool, prisma: PrismaClient, server: Server, base: string, safe = false;
async function request(path: string, opts: { method?: string; cookie?: string; token?: string; body?: unknown } = {}) {
  return fetch(`${base}${path}`, { method: opts.method ?? 'GET', headers: { ...(opts.cookie ? { Cookie: opts.cookie } : {}), ...(opts.method ? { Origin: origin, 'Content-Type': 'application/json' } : {}), ...(opts.token ? { 'X-CSRF-Token': opts.token } : {}) }, ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}) });
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
  for (const [id, role] of [[owner, 'ORGANIZER'], [other, 'ORGANIZER'], [participant, 'PARTICIPANT']]) await prisma.user.create({ data: { id, email: `${id}@events.test`, passwordHash: hash, displayName: `Test ${id}`, role } });
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
    await prisma.$executeRaw`DELETE FROM sessions WHERE sess->>'userId' IN (${owner}, ${other}, ${participant})`;
    await prisma.user.deleteMany({ where: { id: { in: [owner, other, participant] } } });
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
  it('restricts My Events to the signed-in Organizer', async () => {
    const a = await login(owner), b = await login(other), p = await login(participant);
    expect((await request('/api/me/events')).status).toBe(401);
    expect((await request('/api/me/events', { cookie: p.cookie })).status).toBe(403);
    expect((await request(`/api/me/events?organizerId=${other}`, { cookie: a.cookie })).status).toBe(422);
    const responseA = await request('/api/me/events', { cookie: a.cookie }); const responseB = await request('/api/me/events', { cookie: b.cookie });
    const rowsA = (await responseA.json()).data as Array<{ id: string }>; const rowsB = (await responseB.json()).data as Array<{ id: string }>;
    expect(rowsA.some(row => row.id === visible)).toBe(true); expect(rowsB.some(row => row.id === visible)).toBe(false);
  });
});
