import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
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
const applicationName = `instructor-${owner}`;
type Session = { cookie: string; token: string };

async function request(path: string, session?: Session, method?: string, body?: unknown, url = base) {
  return fetch(url + path, { method: method ?? 'GET', headers: {
    ...(session ? { Cookie: session.cookie, 'X-CSRF-Token': session.token } : {}),
    ...(method ? { Origin: origin, 'Content-Type': 'application/json' } : {}),
  }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
async function login(id: string): Promise<Session> {
  const bootstrap = await request('/api/auth/csrf');
  const initial = { cookie: bootstrap.headers.get('set-cookie')!.split(';')[0], token: (await bootstrap.json()).data.csrfToken as string };
  const response = await request('/api/auth/login', initial, 'POST', { email: `${id}@f09.test`, password: secret });
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
    await prisma.user.create({ data: { id, role, email: `${id}@f09.test`, passwordHash: hash, displayName: `F09 ${role} ${id.slice(0, 4)}` } });
  }
  server = createApp(async () => {}, { config: { nodeEnv: 'test', port: 3000, databaseUrl: process.env.TEST_DATABASE_URL, sessionSecret: 'synthetic-instructor-session-secret', appOrigin: origin }, pool, prisma, now: () => now }).listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('Missing test port');
  base = `http://127.0.0.1:${address.port}`;
});

beforeEach(() => { now = initialStart - 3_600_000; });

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

describe('F-09 Instructor assignment and teaching APIs', () => {
  it('uses the existing Instructor session, identity, logout and absolute-expiry lifecycle', async () => {
    const session = await login(instructor1);
    const identity = await request('/api/auth/me', session);
    expect(identity.status).toBe(200); expect((await identity.json()).data).toMatchObject({ id: instructor1, role: 'INSTRUCTOR' });
    now += 8 * 60 * 60 * 1000;
    expect((await request('/api/auth/me', session)).status).toBe(401);
    now = initialStart - 3_600_000;
    const fresh = await login(instructor1);
    expect((await request('/api/auth/logout', fresh, 'POST', {})).status).toBe(204);
    expect((await request('/api/auth/me', fresh)).status).toBe(401);
  });

  it('assigns, replaces, removes, retains history and versions only real changes', async () => {
    const event = await fixture(); const organizer = await login(owner), first = await login(instructor1), second = await login(instructor2);
    const initial = await request(`/api/organizer/events/${event.id}`, organizer);
    expect((await initial.json()).data.currentInstructor).toBeNull();
    const assigned = await assign(event.id, organizer, instructor1);
    expect(assigned.status).toBe(200); expect((await assigned.json()).data).toMatchObject({ version: 1, currentInstructor: { id: instructor1 } });
    expect((await assign(event.id, organizer, instructor1, 1)).status).toBe(200);
    expect(await prisma.instructorAssignment.count({ where: { eventId: event.id, endedAt: null } })).toBe(1);
    expect((await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).version).toBe(1);
    expect((await request(`/api/me/teaching-events/${event.id}`, first)).status).toBe(200);
    const replaced = await assign(event.id, organizer, instructor2, 1);
    expect(replaced.status).toBe(200); expect((await replaced.json()).data).toMatchObject({ version: 2, currentInstructor: { id: instructor2 } });
    const former = await prisma.instructorAssignment.findFirstOrThrow({ where: { eventId: event.id, instructorId: instructor1 } });
    expect(former.endedAt).toEqual(new Date(now));
    expect((await request(`/api/me/teaching-events/${event.id}`, first)).status).toBe(404);
    expect((await request(`/api/me/teaching-events/${event.id}`, second)).status).toBe(200);
    const removed = await remove(event.id, organizer, 2);
    expect(removed.status).toBe(200); expect((await removed.json()).data).toMatchObject({ version: 3, currentInstructor: null });
    expect((await remove(event.id, organizer, 3)).status).toBe(200);
    expect((await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).version).toBe(3);
    expect(await prisma.instructorAssignment.count({ where: { eventId: event.id, endedAt: null } })).toBe(0);
    expect(await prisma.instructorAssignment.count({ where: { eventId: event.id } })).toBe(2);
  });

  it('checks role, owner, CSRF, version, start and safe directory/DTO boundaries', async () => {
    const event = await fixture(); const organizer = await login(owner), other = await login(outsider), student = await login(participant), instructor = await login(instructor1);
    const directory = await request('/api/organizer/instructors?page=1', organizer);
    expect(directory.status).toBe(200);
    expect(Object.keys((await directory.json()).data[0]).sort()).toEqual(['displayName', 'id']);
    expect(JSON.stringify(await directory.json())).not.toContain('@f09.test');
    expect((await request('/api/organizer/instructors', instructor)).status).toBe(403);
    expect((await request(`/api/organizer/events/${event.id}/instructor`, student, 'PUT', { instructorId: instructor1, expectedVersion: 0 })).status).toBe(403);
    expect((await assign(event.id, other, instructor1)).status).toBe(404);
    expect((await assign(randomUUID(), organizer, instructor1)).status).toBe(404);
    expect((await assign(event.id, { ...organizer, token: 'bad-token' }, instructor1)).status).toBe(403);
    const absent = await assign(event.id, organizer, randomUUID());
    const wrongRole = await assign(event.id, organizer, participant);
    const missingAssignee = await request(`/api/organizer/events/${event.id}/instructor`, organizer, 'PUT', { expectedVersion: 0 });
    const malformedAssignee = await request(`/api/organizer/events/${event.id}/instructor`, organizer, 'PUT', { expectedVersion: 0, instructorId: 'not-a-uuid' });
    expect(absent.status).toBe(422); expect(wrongRole.status).toBe(422); expect(missingAssignee.status).toBe(422); expect(malformedAssignee.status).toBe(422);
    expect((await absent.json()).error).toEqual((await wrongRole.json()).error);
    expect((await absent.json()).error).toEqual((await missingAssignee.json()).error);
    expect((await absent.json()).error).toEqual((await malformedAssignee.json()).error);
    expect((await assign(event.id, organizer, instructor1, -1)).status).toBe(422);
    const stale = await assign(event.id, organizer, instructor1, 1);
    expect(stale.status).toBe(409); expect((await stale.json()).error.code).toBe('EVENT_CHANGED');
    const publicRead = await request(`/api/events/${event.id}`, instructor);
    expect(publicRead.status).toBe(200); expect((await publicRead.json()).data).not.toHaveProperty('version');
    now = event.startsAt.getTime();
    const started = await assign(event.id, organizer, instructor1);
    expect(started.status).toBe(409); expect((await started.json()).error.code).toBe('EVENT_STARTED');
    expect(await prisma.instructorAssignment.count({ where: { eventId: event.id } })).toBe(0);
  });

  it.each([
    ['one millisecond overlap', 3_599_999, 7_200_000, true],
    ['equal ranges', 0, 3_600_000, true],
    ['contained range', 900_000, 2_700_000, true],
    ['adjacent range', 3_600_000, 7_200_000, false],
  ])('enforces half-open overlap rule: %s', async (_name, startOffset, endOffset, overlaps) => {
    const scheduledInstructor = randomUUID();
    await prisma.user.create({ data: { id: scheduledInstructor, email: `${scheduledInstructor}@f09.test`, displayName: 'Temporary Instructor', passwordHash: 'synthetic-test-only', role: 'INSTRUCTOR' } });
    const first = await fixture(initialStart, initialStart + 3_600_000); const secondStart = initialStart + (startOffset as number);
    const secondEnd = initialStart + (endOffset as number);
    const second = await fixture(secondStart, secondEnd); const organizer = await login(owner);
    try {
      expect((await assign(first.id, organizer, scheduledInstructor)).status).toBe(200);
      const response = await assign(second.id, organizer, scheduledInstructor);
      expect(response.status).toBe(overlaps ? 409 : 200);
      if (overlaps) { expect((await response.json()).error).toMatchObject({ code: 'INSTRUCTOR_UNAVAILABLE' }); expect(JSON.stringify(await response.json())).not.toContain(first.id); }
      expect(await prisma.instructorAssignment.count({ where: { instructorId: scheduledInstructor, endedAt: null } })).toBe(overlaps ? 1 : 2);
    } finally {
      await prisma.instructorAssignment.deleteMany({ where: { instructorId: scheduledInstructor } });
      await prisma.user.delete({ where: { id: scheduledInstructor } });
    }
  });

  it('blocks F-06 time edits that overlap the assigned Instructor and keeps owner DTO current', async () => {
    const first = await fixture(initialStart, initialStart + 3_600_000); const second = await fixture(initialStart + 2 * 3_600_000, initialStart + 3 * 3_600_000);
    const organizer = await login(owner);
    expect((await assign(first.id, organizer, instructor1)).status).toBe(200);
    const secondAssignment = await assign(second.id, organizer, instructor1);
    expect(secondAssignment.status).toBe(200);
    expect((await secondAssignment.json()).data.currentInstructor).toMatchObject({ id: instructor1 });
    const response = await patch(second.id, organizer, { expectedVersion: 1, startsAt: new Date(initialStart + 30 * 60_000).toISOString(), endsAt: new Date(initialStart + 90 * 60_000).toISOString() });
    expect(response.status).toBe(409); expect((await response.json()).error).toMatchObject({ code: 'INSTRUCTOR_UNAVAILABLE' });
    expect(await prisma.event.findUniqueOrThrow({ where: { id: second.id } })).toMatchObject({ startsAt: second.startsAt, endsAt: second.endsAt, version: 1 });
  });

  it('keeps Instructor access read-only across existing protected APIs while public event data remains available', async () => {
    const event = await fixture(); const instructor = await login(instructor1);
    const registration = await prisma.registration.create({ data: { eventId: event.id, participantId: participant, status: 'ACTIVE' } });
    const denied = await Promise.all([
      request('/api/events', instructor, 'POST', { title: 'No permission', startsAt: new Date(initialStart).toISOString(), endsAt: new Date(initialStart + 3_600_000).toISOString(), location: 'Room', capacity: 1 }),
      patch(event.id, instructor, { expectedVersion: 0, title: 'No permission' }),
      request(`/api/events/${event.id}/registrations`, instructor, 'POST', {}),
      request(`/api/me/registrations/${registration.id}/cancel`, instructor, 'POST', {}),
      request(`/api/organizer/events/${event.id}/registrations`, instructor),
      assign(event.id, instructor, instructor2),
    ]);
    expect(denied.map(response => response.status)).toEqual([403, 403, 403, 403, 403, 403]);
    expect((await request(`/api/events/${event.id}`, instructor)).status).toBe(200);
    expect(await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).toMatchObject({ title: event.title, version: 0 });
    expect(await prisma.instructorAssignment.count({ where: { eventId: event.id } })).toBe(0);
  });

  it('returns only current assigned teaching events in stable pages and safe detail DTOs', async () => {
    const organizer = await login(owner), instructor = await login(instructor1), empty = await login(instructor2);
    const events = [];
    for (let index = 0; index < 21; index++) {
      const event = await fixture(initialStart + index * 2 * 3_600_000, initialStart + (index * 2 + 1) * 3_600_000);
      events.push(event); expect((await assign(event.id, organizer, instructor1, 0)).status).toBe(200);
    }
    const first = await request('/api/me/teaching-events?page=1&pageSize=20', instructor);
    const second = await request('/api/me/teaching-events?page=2&pageSize=20', instructor);
    expect(first.status).toBe(200); expect(second.status).toBe(200);
    const firstPage = await first.json() as { data: Array<Record<string, unknown>>; meta: { total: number; page: number } };
    const secondPage = await second.json() as { data: Array<Record<string, unknown>>; meta: { total: number; page: number } };
    expect(firstPage.data).toHaveLength(20); expect(firstPage.meta).toMatchObject({ total: 21, page: 1 });
    expect(secondPage.data).toHaveLength(1); expect(secondPage.meta.page).toBe(2);
    expect(firstPage.data[0].id).toBe(events[0].id); expect(firstPage.data[19].id).toBe(events[19].id); expect(secondPage.data[0].id).toBe(events[20].id);
    expect(firstPage.data[0]).toMatchObject({ id: events[0].id, organizer: { displayName: expect.any(String) } });
    for (const field of ['email', 'passwordHash', 'version', 'organizerId', 'registrations', 'instructorAssignments']) expect(firstPage.data[0]).not.toHaveProperty(field);
    expect((await (await request('/api/me/teaching-events', empty)).json()).meta.total).toBe(0);
  });

  it('serializes cross-event assign and F-06 edit races on the shared schedule mutex', async () => {
    const first = await fixture(initialStart, initialStart + 3_600_000); const second = await fixture(initialStart + 2 * 3_600_000, initialStart + 3 * 3_600_000);
    const organizer = await login(owner); const blocker = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL }); const observer = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
    const pending: Promise<Response>[] = [];
    try {
      await blocker.connect(); await observer.connect(); await blocker.query('BEGIN'); await blocker.query('SELECT pg_advisory_xact_lock(334,2)');
      pending.push(assign(first.id, organizer, instructor1));
      pending.push(patch(second.id, organizer, { expectedVersion: 0, startsAt: new Date(initialStart + 30 * 60_000).toISOString(), endsAt: new Date(initialStart + 90 * 60_000).toISOString() }));
      const limit = Date.now() + 2000; let count = 0;
      while (Date.now() < limit && count < 2) {
        count = (await observer.query<{ count: number }>("SELECT count(*)::int AS count FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock' AND query ILIKE '%pg_advisory_xact_lock%'", [applicationName])).rows[0].count;
        if (count < 2) await delay(10);
      }
      expect(count).toBe(2);
      await blocker.query('COMMIT');
      const responses = await Promise.all(pending);
      expect(responses.map(response => response.status).sort()).toEqual([200, 409]);
      const [assignment] = await prisma.instructorAssignment.findMany({ where: { instructorId: instructor1, endedAt: null }, include: { event: true } });
      const other = assignment.eventId === first.id ? await prisma.event.findUniqueOrThrow({ where: { id: second.id } }) : await prisma.event.findUniqueOrThrow({ where: { id: first.id } });
      expect(assignment.event.startsAt < other.endsAt && other.startsAt < assignment.event.endsAt).toBe(false);
    } finally {
      await blocker.query('ROLLBACK').catch(() => undefined); await Promise.allSettled(pending); await Promise.allSettled([blocker.end(), observer.end()]);
    }
  });
});
