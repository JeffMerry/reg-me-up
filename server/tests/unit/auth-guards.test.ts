import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import express from 'express';
import session from 'express-session';
import argon2 from 'argon2';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { authHandlers } from '../../src/auth.js';

const origin = 'http://localhost:5173';
const password = 'synthetic-test-password';
let server: Server;
let base: string;
let failGet = false;
let failDestroy = false;

class FailingStore extends session.MemoryStore {
  override get(sid: string, callback: (err: any, session?: session.SessionData | null) => void): void {
    if (failGet) { callback(new Error('synthetic private store error')); return; }
    super.get(sid, callback);
  }
  override destroy(sid: string, callback?: (err?: any) => void): void {
    if (failDestroy) { callback?.(new Error('synthetic private destroy error')); return; }
    super.destroy(sid, callback);
  }
}

beforeAll(async () => {
  const hash = await argon2.hash(password);
  const users = [
    { id: 'p1', email: 'participant@auth.test', displayName: 'Participant', role: 'PARTICIPANT', passwordHash: hash },
    { id: 'o1', email: 'organizer@auth.test', displayName: 'Organizer', role: 'ORGANIZER', passwordHash: hash },
  ];
  const prisma = { user: { findUnique: async ({ where }: { where: { id?: string; email?: string } }) => users.find(user => where.id ? user.id === where.id : user.email === where.email) ?? null } } as unknown as PrismaClient;
  const config = { nodeEnv: 'test' as const, port: 3000, databaseUrl: 'postgresql://localhost/test', sessionSecret: 'synthetic-test-only-session-secret-123', appOrigin: origin };
  const h = authHandlers(prisma, config);
  const app = express();
  app.use(h.noStore, session({ secret: config.sessionSecret, resave: false, saveUninitialized: false, store: new FailingStore() }), express.json());
  app.get('/csrf', h.bootstrap);
  app.post('/login', h.csrf, h.login);
  app.post('/logout', h.requireUser, h.csrf, h.logout);
  app.get('/participant', h.requireUser, h.requireRole('PARTICIPANT'), (_req, res) => res.json({ allowed: true }));
  app.get('/organizer', h.requireUser, h.requireRole('ORGANIZER'), (_req, res) => res.json({ allowed: true }));
  app.use(h.errorHandler);
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('No HTTP address'); base = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => { if (server) await new Promise<void>(resolve => server.close(() => resolve())); });

async function signIn(email: string) {
  const bootstrap = await fetch(`${base}/csrf`);
  const cookie = bootstrap.headers.get('set-cookie')!.split(';')[0];
  const csrf = (await bootstrap.json()).data.csrfToken as string;
  const response = await fetch(`${base}/login`, { method: 'POST', headers: { Cookie: cookie, Origin: origin, 'X-CSRF-Token': csrf, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  expect(response.status).toBe(200);
  return { cookie: response.headers.get('set-cookie')!.split(';')[0], csrf: (await response.json()).data.csrfToken as string };
}

describe('identity middleware and store errors', () => {
  it('enforces authentication before role and permits only the matching role', async () => {
    const p = await signIn('participant@auth.test'); const o = await signIn('organizer@auth.test');
    expect((await fetch(`${base}/participant`)).status).toBe(401);
    expect((await fetch(`${base}/participant`, { headers: { Cookie: p.cookie } })).status).toBe(200);
    expect((await fetch(`${base}/organizer`, { headers: { Cookie: p.cookie } })).status).toBe(403);
    expect((await fetch(`${base}/organizer`, { headers: { Cookie: o.cookie } })).status).toBe(200);
    expect((await fetch(`${base}/participant`, { headers: { Cookie: o.cookie } })).status).toBe(403);
  });
  it('returns a safe server error when reading the session store fails', async () => {
    const signed = await signIn('participant@auth.test'); failGet = true;
    try {
      const response = await fetch(`${base}/participant`, { headers: { Cookie: signed.cookie } });
      expect(response.status).toBe(500); const body = await response.text();
      expect(body).not.toContain('synthetic private'); expect(JSON.parse(body).error.code).toBe('INTERNAL_ERROR');
    } finally { failGet = false; }
  });
  it('never reports logout success or clears the cookie if store destruction fails', async () => {
    const signed = await signIn('participant@auth.test'); failDestroy = true;
    try {
      const response = await fetch(`${base}/logout`, { method: 'POST', headers: { Cookie: signed.cookie, Origin: origin, 'X-CSRF-Token': signed.csrf, 'Content-Type': 'application/json' }, body: '{}' });
      expect(response.status).toBe(500); expect(response.headers.get('set-cookie')).toBeNull();
      expect(await response.text()).not.toContain('synthetic private');
    } finally { failDestroy = false; }
    expect((await fetch(`${base}/participant`, { headers: { Cookie: signed.cookie } })).status).toBe(200);
  });
});
