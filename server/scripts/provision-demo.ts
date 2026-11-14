import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { demoSettings, provisionDemoAccounts } from '../src/demo-provision.js';

async function main() {
  const settings = demoSettings(process.env);
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: settings.databaseUrl, connectionTimeoutMillis: 5000 }) });
  try {
    const results = await provisionDemoAccounts(prisma, settings.expectedDatabase, settings.accounts);
    for (const result of results) console.log(`${result.role}: ${result.status}${result.status === 'existing' ? ' (password unchanged)' : ''}`);
  } finally { await prisma.$disconnect(); }
}

main().catch(() => { console.error('Demo provisioning failed; check the target database, configuration and account conflicts.'); process.exitCode = 1; });
