import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { createApp } from './app.js';
import { parseConfig } from './config.js';

async function main() {
  const config = parseConfig(process.env);
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: config.databaseUrl, connectionTimeoutMillis: 5000 }) });
  const server = createApp(async () => { await prisma.$queryRaw`SELECT 1`; }).listen(config.port, () => console.log(`RegMeUp server listening on ${config.port}`));
  const shutdown = () => server.close(() => { void prisma.$disconnect().finally(() => process.exit(0)); });
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

main().catch(() => { console.error('Server startup failed: invalid configuration or unavailable resource'); process.exitCode = 1; });
