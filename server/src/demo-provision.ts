import argon2 from 'argon2';
import type { PrismaClient } from '../generated/prisma/client.js';

type DemoAccount = { id: string; email: string; displayName: string; role: 'PARTICIPANT' | 'ORGANIZER' | 'INSTRUCTOR'; password: string };
export const DEMO_IDENTITIES = [
  { id: 'd1000000-0000-4000-8000-000000000001', email: 'participant@example.test', displayName: 'Demo Participant', role: 'PARTICIPANT' },
  { id: 'd2000000-0000-4000-8000-000000000002', email: 'organizer@example.test', displayName: 'Demo Organizer', role: 'ORGANIZER' },
  { id: 'd3000000-0000-4000-8000-000000000003', email: 'instructor@example.test', displayName: 'Demo Instructor', role: 'INSTRUCTOR' },
] as const;

export function demoSettings(env: NodeJS.ProcessEnv) {
  const databaseUrl = env.DATABASE_URL ?? '';
  const expectedDatabase = env.DEMO_EXPECTED_DATABASE ?? '';
  const participantPassword = env.DEMO_PARTICIPANT_PASSWORD ?? '';
  const organizerPassword = env.DEMO_ORGANIZER_PASSWORD ?? '';
  const instructorPassword = env.DEMO_INSTRUCTOR_PASSWORD ?? '';
  const validPassword = (value: string) => Buffer.byteLength(value, 'utf8') >= 16 && Buffer.byteLength(value, 'utf8') <= 1024;
  const passwords = [participantPassword, organizerPassword, instructorPassword];
  if (env.ALLOW_DEMO_PROVISION !== '1' || !databaseUrl || !expectedDatabase || passwords.some(password => !validPassword(password)) || new Set(passwords).size !== passwords.length) {
    throw new Error('Invalid demo provisioning configuration');
  }
  return { databaseUrl, expectedDatabase, accounts: [
    { ...DEMO_IDENTITIES[0], password: participantPassword },
    { ...DEMO_IDENTITIES[1], password: organizerPassword },
    { ...DEMO_IDENTITIES[2], password: instructorPassword },
  ] };
}

export async function provisionDemoAccounts(prisma: PrismaClient, expectedDatabase: string, accounts: DemoAccount[]) {
  return prisma.$transaction(async tx => {
    const database = await tx.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
    if (!expectedDatabase || database[0]?.name !== expectedDatabase) throw new Error('Demo database confirmation failed');
    const results: Array<{ role: string; status: 'created' | 'existing' }> = [];
    for (const account of accounts) {
      const [byId, byEmail] = await Promise.all([
        tx.user.findUnique({ where: { id: account.id } }),
        tx.user.findUnique({ where: { email: account.email } }),
      ]);
      if (byId || byEmail) {
        if (!byId || !byEmail || byId.id !== byEmail.id || byId.email !== account.email || byId.role !== account.role) throw new Error('Demo account identity conflict');
        results.push({ role: account.role, status: 'existing' });
        continue;
      }
      const passwordHash = await argon2.hash(account.password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
      await tx.user.create({ data: { id: account.id, email: account.email, displayName: account.displayName, role: account.role, passwordHash } });
      results.push({ role: account.role, status: 'created' });
    }
    return results;
  });
}
