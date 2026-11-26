import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { verifyTestDatabase } from '../../src/test-db-safety.js';
import { withEventWrite } from '../../src/event-write.js';

// Stable shared two-int key proposed in the reviewed Sprint2 system design.
// Tests hold it on an independent connection and observe actual pg_locks waits.
const namespace = 334, scheduleKey = 2;
const owner = randomUUID(), eventA = randomUUID(), eventB = randomUUID(), hidden = randomUUID();
let prisma: PrismaClient, blocker: pg.Client, observer: pg.Client;
let safe = false;
let blockerPid: number;

async function waitForWaiter(pid: number, type: 'advisory' | 'transactionid' | 'tuple') {
  const deadline = Date.now() + 1500;
  while (Date.now() < deadline) {
    const result = await observer.query<{ waiting: boolean }>(
      'SELECT EXISTS (SELECT 1 FROM pg_locks WHERE pid=$1 AND locktype=$2 AND NOT granted) AS waiting', [pid, type],
    );
    if (result.rows[0]?.waiting) return;
    await delay(10);
  }
  throw new Error(`No ${type} lock wait observed for the competing transaction`);
}

async function findWriterPid(eventId: string, callbackEntered?: () => boolean) {
  const deadline = Date.now() + 1500;
  while (Date.now() < deadline) {
    if (callbackEntered) expect(callbackEntered()).toBe(false);
    // Each test has only one competing application transaction; identify it by
    // wait state, not by a timing assumption or Promise.all scheduling.
    const result = await observer.query<{ pid: number }>(
      `SELECT pid FROM pg_stat_activity WHERE datname=current_database()
       AND pid<>pg_backend_pid() AND pid<>$1 AND wait_event_type='Lock'
       AND (query ILIKE '%FOR UPDATE%' OR query ILIKE '%pg_advisory_xact_lock%')`, [blockerPid],
    );
    if (result.rows.length === 1) return result.rows[0].pid;
    await delay(10);
  }
  throw new Error(`No writer waiting for test event ${eventId}`);
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL || !process.env.TEST_DATABASE_URL) throw new Error('Both database URLs required');
  const app = new pg.Client({ connectionString: process.env.DATABASE_URL });
  const test = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    await app.connect(); await test.connect(); await verifyTestDatabase(app, test); safe = true;
  } finally { await Promise.allSettled([app.end(), test.end()]); }
  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL }) });
  blocker = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  observer = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  await Promise.all([blocker.connect(), observer.connect()]);
  blockerPid = (await blocker.query<{ pid: number }>('SELECT pg_backend_pid() AS pid')).rows[0].pid;
  await prisma.user.create({ data: { id: owner, email: `${owner}@event-write.test`, passwordHash: 'not-a-login-fixture', displayName: 'Lock test owner', role: 'ORGANIZER' } });
  for (const id of [eventA, eventB, hidden]) {
    await prisma.event.create({ data: { id, organizerId: owner, title: 'Lock fixture', startsAt: new Date('2030-01-15T02:00:00Z'), endsAt: new Date('2030-01-15T04:00:00Z'), location: 'Test room', capacity: 2, publicationStatus: id === hidden ? 'UNPUBLISHED' : 'PUBLISHED' } });
  }
});

afterAll(async () => {
  if (blocker) await blocker.query('ROLLBACK').catch(() => undefined);
  if (safe && prisma) {
    await prisma.event.deleteMany({ where: { id: { in: [eventA, eventB, hidden] }, organizerId: owner } });
    await prisma.user.deleteMany({ where: { id: owner } });
  }
  await Promise.allSettled([prisma?.$disconnect(), blocker?.end(), observer?.end()]);
});

describe('Sprint 2 shared Event write protocol', () => {
  it('skips callbacks for absent or excluded events and permits private writers on an unpublished event', async () => {
    let called = false;
    const write = async () => { called = true; return 'written'; };
    expect(await withEventWrite(prisma, { eventId: randomUUID() }, write)).toEqual({ found: false });
    expect(await withEventWrite(prisma, { eventId: hidden, publishedOnly: true }, write)).toEqual({ found: false });
    expect(called).toBe(false);
    expect(await withEventWrite(prisma, { eventId: hidden }, write)).toEqual({ found: true, value: 'written' });
  });

  it('waits for the event row lock before reading the committed capacity', async () => {
    let pending: Promise<unknown> | undefined;
    await blocker.query('BEGIN');
    try {
      await blocker.query('UPDATE events SET capacity=3 WHERE id=$1::uuid', [eventA]);
      pending = withEventWrite(prisma, { eventId: eventA }, tx => tx.event.findUniqueOrThrow({ where: { id: eventA }, select: { capacity: true } }));
      const pid = await findWriterPid(eventA); await waitForWaiter(pid, 'transactionid');
      await blocker.query('COMMIT');
      expect(await pending).toEqual({ found: true, value: { capacity: 3 } });
    } finally { await blocker.query('ROLLBACK'); await Promise.allSettled(pending ? [pending] : []); }
  });

  it('rolls back callback writes and releases locks after an exception', async () => {
    const previous = await prisma.event.findUniqueOrThrow({ where: { id: eventA }, select: { capacity: true } });
    await expect(withEventWrite(prisma, { eventId: eventA, scope: 'schedule' }, async tx => {
      await tx.event.update({ where: { id: eventA }, data: { capacity: 7 } });
      throw new Error('controlled transaction rollback');
    })).rejects.toThrow('controlled transaction rollback');
    expect(await prisma.event.findUniqueOrThrow({ where: { id: eventA }, select: { capacity: true } })).toEqual(previous);
    await blocker.query('BEGIN');
    try {
      expect((await blocker.query<{ acquired: boolean }>('SELECT pg_try_advisory_xact_lock($1,$2) AS acquired', [namespace, scheduleKey])).rows[0].acquired).toBe(true);
      await blocker.query('SELECT id FROM events WHERE id=$1::uuid FOR UPDATE NOWAIT', [eventA]);
    } finally { await blocker.query('ROLLBACK'); }
  });

  it('serializes schedule writers before taking the event lock while ordinary registration on another event remains independent', async () => {
    let pending: Promise<unknown> | undefined;
    let entered = false;
    await blocker.query('BEGIN');
    try {
      await blocker.query('SELECT pg_advisory_xact_lock($1,$2)', [namespace, scheduleKey]);
      pending = withEventWrite(prisma, { eventId: eventA, scope: 'schedule' }, async () => { entered = true; return 'schedule'; });
      const pid = await findWriterPid(eventA, () => entered);
      await waitForWaiter(pid, 'advisory');
      expect(entered).toBe(false);
      // If the writer took the event row first this NOWAIT would fail. The
      // mutex must precede the row, preventing a cycle with ordinary writers.
      await blocker.query('SELECT id FROM events WHERE id=$1::uuid FOR UPDATE NOWAIT', [eventA]);
      expect(await withEventWrite(prisma, { eventId: eventB }, async () => 'ordinary')).toEqual({ found: true, value: 'ordinary' });
      await blocker.query('COMMIT');
      expect(await pending).toEqual({ found: true, value: 'schedule' });
    } finally { await blocker.query('ROLLBACK'); await Promise.allSettled(pending ? [pending] : []); }
  });
});
