import { beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { demoSettings, provisionDemoAccounts } from '../../src/demo-provision.js';
import { verifyTestDatabase } from '../../src/test-db-safety.js';

const firstPassword = 'synthetic-participant-password';
const secondPassword = 'synthetic-organizer-password';

describe('demo account provisioning', () => {
  beforeAll(async () => {
    if (!process.env.DATABASE_URL || !process.env.TEST_DATABASE_URL) throw new Error('Both database URLs required');
    const app = new pg.Client({ connectionString: process.env.DATABASE_URL });
    const test = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
    try { await app.connect(); await test.connect(); await verifyTestDatabase(app, test); }
    finally { await Promise.allSettled([app.end(), test.end()]); }
  });

  it('validates explicit consent and separate passwords without exposing values', () => {
    const env = { ALLOW_DEMO_PROVISION: '1', DATABASE_URL: 'postgresql://example/test', DEMO_EXPECTED_DATABASE: 'test', DEMO_PARTICIPANT_PASSWORD: firstPassword, DEMO_ORGANIZER_PASSWORD: secondPassword };
    expect(demoSettings(env).accounts).toHaveLength(2);
    for (const override of [{ ALLOW_DEMO_PROVISION: '' }, { DEMO_EXPECTED_DATABASE: '' }, { DEMO_PARTICIPANT_PASSWORD: 'short' }, { DEMO_ORGANIZER_PASSWORD: firstPassword }]) {
      try { demoSettings({ ...env, ...override }); throw new Error('Expected rejection'); }
      catch (error) { expect(String(error)).toContain('Invalid demo provisioning configuration'); expect(String(error)).not.toContain(firstPassword); }
    }
  });

  it('creates separate hashes, preserves existing accounts, and rolls back conflicts', async () => {
    const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL! }) });
    const ids = [randomUUID(), randomUUID(), randomUUID()];
    const accounts = [
      { id: ids[0], email: `${ids[0]}@demo.test`, displayName: 'Demo participant', role: 'PARTICIPANT' as const, password: firstPassword },
      { id: ids[1], email: `${ids[1]}@demo.test`, displayName: 'Demo organizer', role: 'ORGANIZER' as const, password: secondPassword },
    ];
    const name = (await client.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`)[0].name;
    try {
      await expect(provisionDemoAccounts(client, `${name}-wrong`, accounts)).rejects.toThrow('Demo database confirmation failed');
      expect(await client.user.count({ where: { id: { in: ids } } })).toBe(0);
      expect(await provisionDemoAccounts(client, name, accounts)).toEqual([{ role: 'PARTICIPANT', status: 'created' }, { role: 'ORGANIZER', status: 'created' }]);
      const participant = await client.user.findUniqueOrThrow({ where: { id: ids[0] } });
      const organizer = await client.user.findUniqueOrThrow({ where: { id: ids[1] } });
      expect(participant.role).toBe('PARTICIPANT'); expect(organizer.role).toBe('ORGANIZER');
      expect(participant.passwordHash).not.toBe(organizer.passwordHash);
      expect(await argon2.verify(participant.passwordHash, firstPassword)).toBe(true);
      expect(await argon2.verify(organizer.passwordHash, secondPassword)).toBe(true);
      const changedPasswords = accounts.map(account => ({ ...account, password: 'different-test-password' }));
      expect(await provisionDemoAccounts(client, name, changedPasswords)).toEqual([{ role: 'PARTICIPANT', status: 'existing' }, { role: 'ORGANIZER', status: 'existing' }]);
      expect((await client.user.findUniqueOrThrow({ where: { id: ids[0] } })).passwordHash).toBe(participant.passwordHash);
      const conflict = [{ ...accounts[0], id: ids[2], email: `${ids[2]}@demo.test` }, { ...accounts[1], role: 'PARTICIPANT' as const }];
      await expect(provisionDemoAccounts(client, name, conflict)).rejects.toThrow('Demo account identity conflict');
      expect(await client.user.findUnique({ where: { id: ids[2] } })).toBeNull();
    } finally {
      await client.user.deleteMany({ where: { id: { in: ids } } });
      await client.$disconnect();
    }
  });
});
