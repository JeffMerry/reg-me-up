import { beforeAll, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { verifyTestDatabase } from '../../src/test-db-safety.js';

beforeAll(async () => {
  const app = new pg.Client({ connectionString: process.env.DATABASE_URL }), test = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  try { await app.connect(); await test.connect(); await verifyTestDatabase(app, test); }
  finally { await Promise.allSettled([app.end(), test.end()]); }
});

it('adds attendance without changing existing rows/hashes and enforces unique, required and restrictive foreign keys', async () => {
  const db = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    await db.connect(); await db.query('BEGIN');
    await db.query('CREATE TEMP TABLE users (id uuid PRIMARY KEY, password_hash text NOT NULL) ON COMMIT DROP');
    await db.query('CREATE TEMP TABLE registrations (id uuid PRIMARY KEY, status text NOT NULL) ON COMMIT DROP');
    const actor = randomUUID(), registration = randomUUID(), secondRegistration = randomUUID();
    await db.query('INSERT INTO pg_temp.users VALUES ($1,$2)', [actor, 'synthetic-hash-preservation-marker']);
    await db.query("INSERT INTO pg_temp.registrations VALUES ($1,'ACTIVE')", [registration]);
    const beforeUsers = (await db.query('SELECT * FROM pg_temp.users')).rows, beforeRows = (await db.query('SELECT * FROM pg_temp.registrations')).rows;
    await db.query('SET LOCAL search_path = pg_temp,public');
    const sql = (await readFile('prisma/migrations/20261127020000_attendance/migration.sql', 'utf8')).replace(/^\s*BEGIN;\s*|\s*COMMIT;\s*$/gm, '');
    await db.query(sql);
    expect((await db.query('SELECT * FROM pg_temp.users')).rows).toEqual(beforeUsers); expect((await db.query('SELECT * FROM pg_temp.registrations')).rows).toEqual(beforeRows);
    await db.query("INSERT INTO pg_temp.registrations VALUES ($1,'ACTIVE')", [secondRegistration]);
    const insert = 'INSERT INTO pg_temp.attendance(id,registration_id,checked_in_at,checked_in_by) VALUES($1,$2,$3,$4)';
    const time = '2030-01-15T02:00:00Z';
    await db.query(insert, [randomUUID(), registration, time, actor]);
    for (const [values, code] of [
      [[randomUUID(), registration, time, actor], '23505'],
      [[randomUUID(), randomUUID(), time, actor], '23503'],
      [[randomUUID(), secondRegistration, time, randomUUID()], '23503'],
      [[randomUUID(), randomUUID(), null, actor], '23502'],
    ] as const) {
      await db.query('SAVEPOINT invalid'); await expect(db.query(insert, [...values])).rejects.toMatchObject({ code }); await db.query('ROLLBACK TO SAVEPOINT invalid');
    }
    for (const table of ['users', 'registrations']) {
      await db.query('SAVEPOINT restricted'); await expect(db.query(`DELETE FROM pg_temp.${table}`)).rejects.toMatchObject({ code: '23503' }); await db.query('ROLLBACK TO SAVEPOINT restricted');
    }
  } finally { await db.query('ROLLBACK').catch(() => undefined); await db.end(); }
});
