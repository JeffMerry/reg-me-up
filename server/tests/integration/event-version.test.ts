import { beforeAll, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { verifyTestDatabase } from '../../src/test-db-safety.js';

const migration = 'prisma/migrations/20261126010000_event_version/migration.sql';
beforeAll(async () => {
  if (!process.env.DATABASE_URL || !process.env.TEST_DATABASE_URL) throw new Error('Separate guarded app/test databases required');
  const app = new pg.Client({ connectionString: process.env.DATABASE_URL });
  const test = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  try { await app.connect(); await test.connect(); await verifyTestDatabase(app, test); }
  finally { await Promise.allSettled([app.end(), test.end()]); }
});
async function transaction(operation: (client: pg.Client) => Promise<void>) {
  const client = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  try { await client.connect(); await client.query('BEGIN'); await operation(client); }
  finally { await client.query('ROLLBACK').catch(() => undefined); await client.end(); }
}

describe('shared events.version foundation', () => {
  it('installs a non-null integer revision defaulting to zero', async () => transaction(async db => {
    const result = await db.query(`SELECT data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='version'`);
    expect(result.rows).toEqual([{ data_type: 'integer', is_nullable: 'NO', column_default: '0' }]);
    const existing = await db.query(`SELECT version FROM public.events WHERE id='30000000-0000-4000-8000-000000000002'::uuid`);
    expect(existing.rows).toEqual([{ version: 0 }]);
  }));

  it('defaults new events to zero and rejects negative or null revisions', async () => transaction(async db => {
    const id = randomUUID();
    const saved = await db.query(`INSERT INTO public.events(id,organizer_id,title,starts_at,ends_at,location,capacity,publication_status) VALUES($1,'20000000-0000-4000-8000-000000000001','Version foundation fixture','2030-01-15T02:00:00Z','2030-01-15T03:00:00Z','Room',100,'PUBLISHED') RETURNING version`, [id]);
    expect(saved.rows).toEqual([{ version: 0 }]);
    for (const [value, code] of [[-1, '23514'], [null, '23502']] as const) {
      await db.query('SAVEPOINT invalid_revision');
      await expect(db.query('UPDATE public.events SET version=$1 WHERE id=$2::uuid', [value, id])).rejects.toMatchObject({ code });
      await db.query('ROLLBACK TO SAVEPOINT invalid_revision');
    }
    const first = await db.query('UPDATE public.events SET version=version+1 WHERE id=$1::uuid AND version=0 RETURNING version', [id]);
    expect(first.rows).toEqual([{ version: 1 }]);
    expect((await db.query('UPDATE public.events SET title=$2 WHERE id=$1::uuid AND version=0', [id, 'Stale edit'])).rowCount).toBe(0);
    expect((await db.query('SELECT title,capacity,version FROM public.events WHERE id=$1::uuid', [id])).rows).toEqual([{ title: 'Version foundation fixture', capacity: 100, version: 1 }]);
  }));

  it('applies the exact additive SQL to an old table without rewriting legacy values', async () => transaction(async db => {
    // A temporary table shadows public.events only for this connection. The
    // production migration is exercised without altering the shared test table.
    await db.query('CREATE TEMP TABLE events (id uuid PRIMARY KEY,title text NOT NULL,capacity integer NOT NULL,starts_at timestamptz NOT NULL) ON COMMIT DROP');
    const id = randomUUID();
    await db.query(`INSERT INTO pg_temp.events VALUES($1,'Legacy capacity above 60',100,'2030-01-15T02:00:00Z')`, [id]);
    const before = (await db.query('SELECT * FROM pg_temp.events')).rows;
    await db.query('SET LOCAL search_path = pg_temp,public');
    await db.query(await readFile(migration, 'utf8'));
    const after = (await db.query('SELECT id,title,capacity,starts_at FROM pg_temp.events')).rows;
    expect(after).toEqual(before);
    expect((await db.query('SELECT version FROM pg_temp.events')).rows).toEqual([{ version: 0 }]);
  }));
});
