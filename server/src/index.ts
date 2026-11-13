import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { createApp } from './app.js';
import { parseConfig } from './config.js';
import pg from 'pg';

async function main() {
  const config = parseConfig(process.env);
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: config.databaseUrl, connectionTimeoutMillis: 5000 }) });
  const pool = new pg.Pool({ connectionString: config.databaseUrl, connectionTimeoutMillis: 5000 });
  const server = createApp(async () => { await prisma.$queryRaw`SELECT 1`; }, { config, pool, prisma }).listen(config.port, () => console.log(`RegMeUp server listening on ${config.port}`));
  const shutdown = () => server.close(() => { void Promise.allSettled([prisma.$disconnect(), pool.end()]).finally(() => process.exit(0)); });
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

main().catch(() => { console.error('Server startup failed: invalid configuration or unavailable resource'); process.exitCode = 1; });
