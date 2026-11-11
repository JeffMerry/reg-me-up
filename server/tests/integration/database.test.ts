import { beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { createApp } from '../../src/app.js';
import { verifyTestDatabase, withVerifiedTestDatabase } from '../../src/test-db-safety.js';

const testUrl = process.env.TEST_DATABASE_URL;

describe('foundation database schema', () => {
  beforeAll(async () => {
    if (!testUrl || !process.env.DATABASE_URL) throw new Error('DATABASE_URL and TEST_DATABASE_URL are required');
    const app = new pg.Client({ connectionString: process.env.DATABASE_URL });
    const test = new pg.Client({ connectionString: testUrl });
    try {
      await app.connect();
      await test.connect();
      await verifyTestDatabase(app, test);
    } finally { await Promise.allSettled([app.end(), test.end()]); }
  });
  it('connects to the explicitly configured isolated test database', async () => {
    if (!testUrl) throw new Error('TEST_DATABASE_URL is required for integration tests');
    const client = new pg.Client({ connectionString: testUrl });
    try {
      await client.connect();
      const result = await client.query("SELECT to_regclass('public.users') AS users, to_regclass('public.events') AS events, to_regclass('public.registrations') AS registrations, to_regclass('public.sessions') AS sessions");
      expect(result.rows[0]).toEqual({ users: 'users', events: 'events', registrations: 'registrations', sessions: 'sessions' });
    } finally { await client.end(); }
  });

  it('rejects differently formatted URLs that reach the same database', async () => {
    if (!testUrl) throw new Error('TEST_DATABASE_URL is required');
    const alias = new URL(testUrl);
    alias.searchParams.set('application_name', 'same-database-safety-check');
    const first = new pg.Client({ connectionString: testUrl });
    const second = new pg.Client({ connectionString: alias.toString() });
    try {
      await first.connect();
      await second.connect();
      await expect(verifyTestDatabase(first, second)).rejects.toThrow('Unsafe test database target');
    } finally { await Promise.allSettled([first.end(), second.end()]); }
  });

  it('rejects a target without the explicit test-only marker', async () => {
    if (!testUrl || !process.env.DATABASE_URL) throw new Error('Two explicit database URLs are required');
    const app = new pg.Client({ connectionString: process.env.DATABASE_URL });
    const test = new pg.Client({ connectionString: testUrl });
    try {
      await app.connect();
      await test.connect();
      await expect(verifyTestDatabase(test, app)).rejects.toThrow('Unsafe test database target');
    } finally { await Promise.allSettled([app.end(), test.end()]); }
  });

  it('refuses cleanup of app data and allows isolated test cleanup without touching app sentinel', async () => {
    if (!testUrl || !process.env.DATABASE_URL) throw new Error('Two explicit database URLs are required');
    const app = new pg.Client({ connectionString: process.env.DATABASE_URL });
    const test = new pg.Client({ connectionString: testUrl });
    try {
      await app.connect(); await test.connect();
      await app.query('CREATE TEMP TABLE app_sentinel (id int PRIMARY KEY)');
      await app.query('INSERT INTO app_sentinel VALUES (1)');
      await test.query('CREATE TEMP TABLE synthetic_cleanup (id int PRIMARY KEY)');
      await test.query('INSERT INTO synthetic_cleanup VALUES (1)');
      const aliasUrl = new URL(process.env.DATABASE_URL);
      aliasUrl.searchParams.set('application_name', 'equivalent-target');
      const alias = new pg.Client({ connectionString: aliasUrl.toString() });
      try {
        await alias.connect();
        await expect(withVerifiedTestDatabase(app, alias, async client => { await client.query('DELETE FROM app_sentinel'); })).rejects.toThrow('Unsafe test database target');
      } finally { await alias.end(); }
      await withVerifiedTestDatabase(app, test, async client => { await client.query('DELETE FROM synthetic_cleanup'); });
      expect((await app.query('SELECT count(*)::int AS n FROM app_sentinel')).rows[0].n).toBe(1);
      expect((await test.query('SELECT count(*)::int AS n FROM synthetic_cleanup')).rows[0].n).toBe(0);
    } finally { await Promise.allSettled([app.end(), test.end()]); }
  });

  it('has stable synthetic rows and a verifiable password hash after repeated seed', async () => {
    if (!testUrl || !process.env.SEED_PASSWORD) throw new Error('Explicit test URL and synthetic seed password required');
    const client = new pg.Client({ connectionString: testUrl });
    try {
      await client.connect();
      const result = await client.query("SELECT (SELECT count(*)::int FROM users WHERE email LIKE '%@example.test') AS users, (SELECT count(*)::int FROM events WHERE id::text LIKE '30000000-%') AS events, (SELECT count(*)::int FROM registrations WHERE id::text LIKE '40000000-%') AS registrations");
      expect(result.rows[0]).toEqual({ users: 5, events: 4, registrations: 2 });
      const user = await client.query("SELECT password_hash FROM users WHERE email = 'p1@example.test'");
      expect(user.rows[0].password_hash).not.toBe(process.env.SEED_PASSWORD);
      expect(await argon2.verify(user.rows[0].password_hash, process.env.SEED_PASSWORD)).toBe(true);
    } finally { await client.end(); }
  });

  it('serves a safe health response backed by the actual database', async () => {
    if (!testUrl) throw new Error('TEST_DATABASE_URL is required');
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: testUrl }) });
    const server = createApp(async () => { await prisma.$queryRaw`SELECT 1`; }).listen(0, '127.0.0.1');
    try {
      await new Promise<void>(resolve => server.once('listening', resolve));
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('No HTTP address');
      const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ status: 'ok' });
    } finally {
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      await prisma.$disconnect();
    }
  });

  it.each([
    ['capacity', "INSERT INTO events (id, organizer_id, title, starts_at, ends_at, location, capacity, publication_status) VALUES ('50000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Test', '2027-01-01T00:00:00Z', '2027-01-01T01:00:00Z', 'Room', 0, 'PUBLISHED')", '23514'],
    ['time', "INSERT INTO events (id, organizer_id, title, starts_at, ends_at, location, capacity, publication_status) VALUES ('50000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Test', '2027-01-01T01:00:00Z', '2027-01-01T00:00:00Z', 'Room', 1, 'PUBLISHED')", '23514'],
    ['duplicate active pair', "INSERT INTO registrations (id, event_id, participant_id, status) VALUES ('50000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'ACTIVE')", '23505'],
    ['missing event FK', "INSERT INTO registrations (id, event_id, participant_id, status) VALUES ('50000000-0000-4000-8000-000000000004', '50000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'ACTIVE')", '23503'],
  ])('rejects invalid %s at the database boundary', async (_label, sql, code) => {
    if (!testUrl) throw new Error('TEST_DATABASE_URL is required');
    const client = new pg.Client({ connectionString: testUrl });
    try {
      await client.connect();
      await client.query('BEGIN');
      await expect(client.query(sql)).rejects.toMatchObject({ code });
    } finally { await client.query('ROLLBACK').catch(() => undefined); await client.end(); }
  });
});
