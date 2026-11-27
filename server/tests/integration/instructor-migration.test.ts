import { beforeAll, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { verifyTestDatabase } from '../../src/test-db-safety.js';

const migration = 'prisma/migrations/20261127010000_instructor_assignments/migration.sql';

beforeAll(async () => {
  if (!process.env.DATABASE_URL || !process.env.TEST_DATABASE_URL) throw new Error('Separate guarded app/test databases required');
  const app = new pg.Client({ connectionString: process.env.DATABASE_URL }); const test = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  try { await app.connect(); await test.connect(); await verifyTestDatabase(app, test); }
  finally { await Promise.allSettled([app.end(), test.end()]); }
});

async function transaction(operation: (client: pg.Client) => Promise<void>) {
  const client = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  try { await client.connect(); await client.query('BEGIN'); await operation(client); }
  finally { await client.query('ROLLBACK').catch(() => undefined); await client.end(); }
}

describe('Instructor assignment migration', () => {
  it('adds Instructor role and historical assignments while preserving existing users/events', async () => transaction(async db => {
    await db.query(`CREATE TEMP TABLE users (id uuid PRIMARY KEY, role text NOT NULL, CONSTRAINT users_role_check CHECK (role IN ('PARTICIPANT','ORGANIZER'))) ON COMMIT DROP`);
    await db.query('CREATE TEMP TABLE events (id uuid PRIMARY KEY) ON COMMIT DROP');
    const organizer = randomUUID(), instructor = randomUUID(), event = randomUUID();
    await db.query('INSERT INTO pg_temp.users(id,role) VALUES($1,\'ORGANIZER\')', [organizer]);
    await db.query('INSERT INTO pg_temp.events(id) VALUES($1)', [event]);
    const beforeUsers = (await db.query('SELECT * FROM pg_temp.users')).rows;
    const beforeEvents = (await db.query('SELECT * FROM pg_temp.events')).rows;
    await db.query('SET LOCAL search_path = pg_temp,public');
    const sql = (await readFile(migration, 'utf8')).replace(/^\s*BEGIN;\s*|\s*COMMIT;\s*$/gm, '');
    await db.query(sql);
    expect((await db.query('SELECT * FROM pg_temp.users')).rows).toEqual(beforeUsers);
    expect((await db.query('SELECT * FROM pg_temp.events')).rows).toEqual(beforeEvents);
    await db.query('INSERT INTO pg_temp.users(id,role) VALUES($1,\'INSTRUCTOR\')', [instructor]);
    await db.query('INSERT INTO pg_temp.instructor_assignments(id,event_id,instructor_id,assigned_at) VALUES($1,$2,$3,$4)', [randomUUID(), event, instructor, '2030-01-01T00:00:00Z']);
    const duplicate = randomUUID();
    await db.query('SAVEPOINT duplicate_current');
    await expect(db.query('INSERT INTO pg_temp.instructor_assignments(id,event_id,instructor_id) VALUES($1,$2,$3)', [duplicate, event, instructor])).rejects.toMatchObject({ code: '23505' });
    await db.query('ROLLBACK TO SAVEPOINT duplicate_current');
    await db.query('SAVEPOINT invalid_role');
    await expect(db.query('INSERT INTO pg_temp.users(id,role) VALUES($1,\'ADMIN\')', [randomUUID()])).rejects.toMatchObject({ code: '23514' });
    await db.query('ROLLBACK TO SAVEPOINT invalid_role');
  }));

  it('applies end-time and foreign-key constraints to assignment history', async () => transaction(async db => {
    await db.query(`CREATE TEMP TABLE users (id uuid PRIMARY KEY, role text NOT NULL, CONSTRAINT users_role_check CHECK (role IN ('PARTICIPANT','ORGANIZER'))) ON COMMIT DROP`);
    await db.query('CREATE TEMP TABLE events (id uuid PRIMARY KEY) ON COMMIT DROP');
    const organizer = randomUUID(), instructor = randomUUID(), event = randomUUID();
    await db.query('INSERT INTO pg_temp.users(id,role) VALUES($1,\'ORGANIZER\')', [organizer]);
    await db.query('INSERT INTO pg_temp.events(id) VALUES($1)', [event]);
    await db.query('SET LOCAL search_path = pg_temp,public');
    const sql = (await readFile(migration, 'utf8')).replace(/^\s*BEGIN;\s*|\s*COMMIT;\s*$/gm, '');
    await db.query(sql);
    await db.query('INSERT INTO pg_temp.users(id,role) VALUES($1,\'INSTRUCTOR\')', [instructor]);
    await db.query('SAVEPOINT invalid_end');
    await expect(db.query('INSERT INTO pg_temp.instructor_assignments(id,event_id,instructor_id,assigned_at,ended_at) VALUES($1,$2,$3,$4,$5)', [randomUUID(), event, instructor, '2030-01-02T00:00:00Z', '2030-01-01T00:00:00Z'])).rejects.toMatchObject({ code: '23514' });
    await db.query('ROLLBACK TO SAVEPOINT invalid_end');
    await db.query('SAVEPOINT missing_event');
    await expect(db.query('INSERT INTO pg_temp.instructor_assignments(id,event_id,instructor_id) VALUES($1,$2,$3)', [randomUUID(), randomUUID(), instructor])).rejects.toMatchObject({ code: '23503' });
    await db.query('ROLLBACK TO SAVEPOINT missing_event');
  }));
});
