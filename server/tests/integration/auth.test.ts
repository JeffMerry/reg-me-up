import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import pg from 'pg';
import argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { createApp } from '../../src/app.js';
import { verifyTestDatabase } from '../../src/test-db-safety.js';

const password = 'synthetic-test-password';
const id = randomUUID();
const organizerId = randomUUID();
const email = `${id}@auth.test`;
const origin = 'http://localhost:5173';
let pool: pg.Pool;
let prisma: PrismaClient;
let server: Server;
let base: string;
let clock = Date.now();
let safe = false;

async function call(path: string, options: { cookie?: string; method?: string; csrf?: string; origin?: string; body?: unknown } = {}) {
  return fetch(`${base}${path}`, { method: options.method ?? 'GET', headers: {
    ...(options.cookie ? { Cookie: options.cookie } : {}),
    ...(options.method ? { 'Content-Type': 'application/json', Origin: options.origin ?? origin } : {}),
    ...(options.csrf ? { 'X-CSRF-Token': options.csrf } : {}),
  }, ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }) });
}
const cookie = (response: Response) => response.headers.get('set-cookie')!.split(';')[0];
async function bootstrap() { const response = await call('/api/auth/csrf'); expect(response.status).toBe(200); return { cookie: cookie(response), token: (await response.json()).data.csrfToken as string }; }
async function login() { const anon = await bootstrap(); const response = await call('/api/auth/login', { method: 'POST', cookie: anon.cookie, csrf: anon.token, body: { email, password } }); expect(response.status).toBe(200); return { anon, cookie: cookie(response), data: (await response.json()).data }; }

beforeAll(async () => {
  if (!process.env.DATABASE_URL || !process.env.TEST_DATABASE_URL) throw new Error('DATABASE_URL and TEST_DATABASE_URL are required');
  const app = new pg.Client({ connectionString: process.env.DATABASE_URL });
  const test = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  try { await app.connect(); await test.connect(); await verifyTestDatabase(app, test); safe = true; }
  finally { await Promise.allSettled([app.end(), test.end()]); }
  pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL }) });
  const hash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  await prisma.user.create({ data: { id, email, passwordHash: hash, displayName: 'Synthetic participant', role: 'PARTICIPANT' } });
  await prisma.user.create({ data: { id: organizerId, email: `${organizerId}@auth.test`, passwordHash: await argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 }), displayName: 'Synthetic organizer', role: 'ORGANIZER' } });
  const config = { nodeEnv: 'test' as const, port: 3000, databaseUrl: process.env.TEST_DATABASE_URL, sessionSecret: 'synthetic-secret-only-for-testing-123456', appOrigin: origin };
  server = createApp(async () => { await prisma.$queryRaw`SELECT 1`; }, { config, pool, prisma, now: () => clock }).listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('No HTTP address'); base = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => {
  if (server) await new Promise<void>(resolve => server.close(() => resolve()));
  if (safe && prisma) { await prisma.$executeRaw`DELETE FROM sessions WHERE sess->>'userId' IN (${id}, ${organizerId})`; await prisma.user.deleteMany({ where: { id: { in: [id, organizerId] } } }); }
  if (prisma) await prisma.$disconnect(); if (pool) await pool.end();
});

describe('F-01 identity with PostgreSQL sessions', () => {
  it('issues secure sessions behind an explicitly trusted HTTPS proxy', async () => {
    const cloudOrigin = 'https://regmeup.example.test';
    const config = { nodeEnv: 'production' as const, port: 3000, databaseUrl: process.env.TEST_DATABASE_URL!, sessionSecret: 'synthetic-cloud-session-secret-123456', appOrigin: cloudOrigin, trustProxyHops: 1 as const };
    const cloudServer = createApp(async () => { await prisma.$queryRaw`SELECT 1`; }, { config, pool, prisma }).listen(0, '127.0.0.1');
    let plainToken: string | undefined; let anonymousToken: string | undefined;
    try {
      await new Promise<void>(resolve => cloudServer.once('listening', resolve));
      const address = cloudServer.address(); if (!address || typeof address === 'string') throw new Error('No HTTP address');
      const cloudBase = `http://127.0.0.1:${address.port}`;
      const plain = await fetch(`${cloudBase}/api/auth/csrf`);
      expect(plain.status).toBe(200); expect(plain.headers.get('set-cookie')).toBeNull();
      plainToken = (await plain.json()).data.csrfToken;
      const forwarded = { 'X-Forwarded-Proto': 'https' };
      const boot = await fetch(`${cloudBase}/api/auth/csrf`, { headers: forwarded });
      const initialCookie = boot.headers.get('set-cookie');
      expect(initialCookie).toMatch(/; Secure/i); expect(initialCookie).toMatch(/; HttpOnly/i); expect(initialCookie).toMatch(/; SameSite=Lax/i);
      anonymousToken = (await boot.json()).data.csrfToken;
      const signed = await fetch(`${cloudBase}/api/auth/login`, { method: 'POST', headers: { ...forwarded, Cookie: initialCookie!.split(';')[0], Origin: cloudOrigin, 'X-CSRF-Token': anonymousToken!, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      expect(signed.status).toBe(200);
      const signedCookie = signed.headers.get('set-cookie'); expect(signedCookie).toMatch(/; Secure/i);
      const signedData = (await signed.json()).data;
      const headers = { ...forwarded, Cookie: signedCookie!.split(';')[0] };
      expect((await fetch(`${cloudBase}/api/auth/me`, { headers })).status).toBe(200);
      const logout = await fetch(`${cloudBase}/api/auth/logout`, { method: 'POST', headers: { ...headers, Origin: cloudOrigin, 'X-CSRF-Token': signedData.csrfToken, 'Content-Type': 'application/json' }, body: '{}' });
      expect(logout.status).toBe(204);
      expect((await fetch(`${cloudBase}/api/auth/me`, { headers })).status).toBe(401);
    } finally {
      await new Promise<void>(resolve => cloudServer.close(() => resolve()));
      if (plainToken) await prisma.$executeRaw`DELETE FROM sessions WHERE sess->>'csrfToken' = ${plainToken}`;
      if (anonymousToken) await prisma.$executeRaw`DELETE FROM sessions WHERE sess->>'csrfToken' = ${anonymousToken}`;
    }
  });
  it('rotates SID and CSRF, persists identity and invalidates logout replay', async () => {
    const signed = await login(); expect(signed.cookie).not.toBe(signed.anon.cookie); expect(signed.data.csrfToken).not.toBe(signed.anon.token);
    expect(signed.data.user).toEqual({ id, displayName: 'Synthetic participant', role: 'PARTICIPANT' });
    expect((await call('/api/auth/me', { cookie: signed.anon.cookie })).status).toBe(401);
    expect((await call('/api/auth/me', { cookie: signed.cookie })).status).toBe(200);
    expect((await call('/api/auth/logout', { method: 'POST', cookie: signed.cookie, csrf: signed.anon.token, body: {} })).status).toBe(403);
    expect((await call('/api/auth/logout', { method: 'POST', cookie: signed.cookie, csrf: signed.data.csrfToken, body: {} })).status).toBe(204);
    expect((await call('/api/auth/me', { cookie: signed.cookie })).status).toBe(401);
  });
  it('rejects unknown and wrong credentials identically, and rejects origin and extra fields', async () => {
    const anon = await bootstrap();
    const wrong = await call('/api/auth/login', { method: 'POST', cookie: anon.cookie, csrf: anon.token, body: { email, password: 'wrong' } });
    const missing = await call('/api/auth/login', { method: 'POST', cookie: anon.cookie, csrf: anon.token, body: { email: 'unknown@example.test', password: 'wrong' } });
    expect(wrong.status).toBe(401); expect(missing.status).toBe(401); expect(await wrong.json()).toEqual(await missing.json());
    expect((await call('/api/auth/me', { cookie: anon.cookie })).status).toBe(401);
    expect((await call('/api/auth/login', { method: 'POST', cookie: anon.cookie, csrf: anon.token, origin: 'https://evil.example', body: { email, password } })).status).toBe(403);
    expect((await call('/api/auth/login', { method: 'POST', cookie: anon.cookie, csrf: anon.token, body: { email, password, role: 'ORGANIZER' } })).status).toBe(422);
    expect((await call('/api/auth/login', { method: 'POST', cookie: anon.cookie, body: { email, password } })).status).toBe(403);
    expect((await call('/api/auth/login', { method: 'POST', cookie: anon.cookie, csrf: 'wrong', body: { email, password } })).status).toBe(403);
    expect((await call('/api/auth/login', { method: 'POST', cookie: anon.cookie, csrf: anon.token, body: { email: 'bad', password } })).status).toBe(422);
    expect((await call('/api/auth/login', { method: 'POST', cookie: anon.cookie, csrf: anon.token, body: { email, password: 'x'.repeat(1025) } })).status).toBe(422);
  });
  it('enforces the exact absolute eight-hour boundary', async () => {
    const signed = await login(); const started = clock;
    clock = started + 8 * 60 * 60 * 1000 - 1; expect((await call('/api/auth/me', { cookie: signed.cookie })).status).toBe(200);
    clock++; expect((await call('/api/auth/me', { cookie: signed.cookie })).status).toBe(401);
    clock = Date.now();
  });
  it('authenticates an organizer and rotates the existing SID on reauthentication', async () => {
    const initial = await login();
    const response = await call('/api/auth/login', { method: 'POST', cookie: initial.cookie, csrf: initial.data.csrfToken, body: { email: `${organizerId}@auth.test`, password } });
    expect(response.status).toBe(200);
    const replacement = cookie(response); const data = (await response.json()).data;
    expect(data.user).toEqual({ id: organizerId, displayName: 'Synthetic organizer', role: 'ORGANIZER' });
    expect(replacement).not.toBe(initial.cookie);
    expect((await call('/api/auth/me', { cookie: initial.cookie })).status).toBe(401);
    expect((await (await call('/api/auth/me', { cookie: replacement })).json()).data.role).toBe('ORGANIZER');
  });
  it('loads the current role from the database on every authenticated request', async () => {
    const signed = await login();
    try {
      await prisma.user.update({ where: { id }, data: { role: 'ORGANIZER' } });
      expect((await (await call('/api/auth/me', { cookie: signed.cookie })).json()).data.role).toBe('ORGANIZER');
    } finally { await prisma.user.update({ where: { id }, data: { role: 'PARTICIPANT' } }); }
  });
  it('handles invalid transport without leaking parser errors', async () => {
    const anon = await bootstrap();
    const headers = { Cookie: anon.cookie, Origin: origin, 'X-CSRF-Token': anon.token };
    const bad = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{' });
    expect(bad.status).toBe(400); expect((await bad.json()).error.code).toBe('BAD_REQUEST');
    const large = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'x'.repeat(65536) }) });
    expect(large.status).toBe(413);
    const media = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { ...headers, 'Content-Type': 'text/plain' }, body: 'test' });
    expect(media.status).toBe(415);
  });
  it('enforces email code-point and password UTF-8 byte boundaries without trimming passwords', async () => {
    const anon = await bootstrap();
    const submit = (address: string, secret: string) => call('/api/auth/login', { method: 'POST', cookie: anon.cookie, csrf: anon.token, body: { email: address, password: secret } });
    const suffix = '@example.test';
    expect((await submit(`${'a'.repeat(254 - suffix.length)}${suffix}`, password)).status).toBe(401);
    expect((await submit(`${'a'.repeat(255 - suffix.length)}${suffix}`, password)).status).toBe(422);
    expect((await submit(email, 'é'.repeat(512))).status).toBe(401);
    expect((await submit(email, 'é'.repeat(513))).status).toBe(422);
    expect((await submit(email, ` ${password} `)).status).toBe(401);
    const valid = await submit(`  ${email.toUpperCase()}  `, password);
    expect(valid.status).toBe(200);
  });
  it('does not expose passwords, hashes or the session secret in auth responses or captured application logs', async () => {
    const logs: string[] = [];
    const log = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => { logs.push(args.map(String).join(' ')); });
    const error = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { logs.push(args.map(String).join(' ')); });
    try {
      const anon = await bootstrap();
      const failed = await call('/api/auth/login', { method: 'POST', cookie: anon.cookie, csrf: anon.token, body: { email, password: `${password}-wrong` } });
      const signed = await call('/api/auth/login', { method: 'POST', cookie: anon.cookie, csrf: anon.token, body: { email, password } });
      expect(signed.status).toBe(200);
      const signedCookie = cookie(signed); const successBody = await signed.text(); const failureBody = await failed.text();
      const me = await call('/api/auth/me', { cookie: signedCookie }); const meBody = await me.text();
      const user = await prisma.user.findUniqueOrThrow({ where: { id }, select: { passwordHash: true } });
      const captured = [successBody, failureBody, meBody, ...logs].join('\n');
      for (const secret of [password, user.passwordHash, 'synthetic-secret-only-for-testing-123456']) expect(captured).not.toContain(secret);
      expect(Object.keys(JSON.parse(successBody).data.user).sort()).toEqual(['displayName', 'id', 'role']);
      expect(Object.keys(JSON.parse(meBody).data).sort()).toEqual(['displayName', 'id', 'role']);
      expect(signed.headers.get('cache-control')).toBe('no-store'); expect(me.headers.get('cache-control')).toBe('no-store');
    } finally { log.mockRestore(); error.mockRestore(); }
  });
  it('uses a separate salt for each new hash', async () => {
    if (!process.env.SEED_PASSWORD) throw new Error('Synthetic seed password is required');
    const users = await prisma.user.findMany({ where: { email: { in: ['p1@example.test', 'p2@example.test'] } }, select: { passwordHash: true } });
    expect(users).toHaveLength(2);
    expect(users[0].passwordHash).not.toBe(users[1].passwordHash);
    for (const user of users) { expect(user.passwordHash).toContain('$argon2id$v=19$m=19456,t=2,p=1$'); expect(await argon2.verify(user.passwordHash, process.env.SEED_PASSWORD)).toBe(true); expect(await argon2.verify(user.passwordHash, 'incorrect')).toBe(false); }
  });
});
