import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import pg from 'pg';
import { checkAppliedMigrations, type MigrationRecord } from '../src/migration-history.js';

async function check(): Promise<void> {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const migrations = join(process.cwd(), 'prisma', 'migrations');
  const files = new Map<string, string>();
  for (const entry of await readdir(migrations, { withFileTypes: true })) {
    if (entry.isDirectory()) files.set(entry.name, await readFile(join(migrations, entry.name, 'migration.sql'), 'utf8'));
  }
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    const exists = await client.query<{ name: string | null }>("SELECT to_regclass('public._prisma_migrations') AS name");
    if (!exists.rows[0]?.name) return;
    const history = await client.query<MigrationRecord>('SELECT migration_name, checksum, finished_at, rolled_back_at FROM public._prisma_migrations');
    checkAppliedMigrations(history.rows, files);
  } finally { await client.end(); }
}

check().catch(() => { console.error('Migration history verification failed; check database access and migration history.'); process.exitCode = 1; });
