import { randomBytes, timingSafeEqual } from 'node:crypto';
import argon2 from 'argon2';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type pg from 'pg';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { ServerConfig } from './config.js';

declare module 'express-session' {
  interface SessionData { csrfToken?: string; userId?: string; authenticatedAt?: number }
}

export type Role = 'PARTICIPANT' | 'ORGANIZER' | 'INSTRUCTOR';
export type Identity = { id: string; displayName: string; role: Role };
const lifetime = 8 * 60 * 60 * 1000;
const token = () => randomBytes(32).toString('base64url');
const fail = (res: Response, status: number, code: string, message: string, fieldErrors?: Record<string, string>) =>
  res.status(status).json({ error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } });
const save = (req: Request) => new Promise<void>((resolve, reject) => req.session.save(err => err ? reject(err) : resolve()));
const regenerate = (req: Request) => new Promise<void>((resolve, reject) => req.session.regenerate(err => err ? reject(err) : resolve()));
const destroy = (req: Request) => new Promise<void>((resolve, reject) => req.session.destroy(err => err ? reject(err) : resolve()));

export function authMiddleware(config: ServerConfig, pool: pg.Pool) {
  const Store = connectPgSimple(session);
  const store = new Store({ pool, tableName: 'sessions', createTableIfMissing: false, pruneSessionInterval: false });
  return session({ name: 'regmeup.sid', secret: config.sessionSecret, resave: false, saveUninitialized: false, rolling: false, store,
    cookie: { httpOnly: true, sameSite: 'lax', path: '/', secure: config.nodeEnv === 'production', maxAge: lifetime } });
}

export function authHandlers(prisma: PrismaClient, config: ServerConfig, now: () => number = Date.now) {
  const noStore: RequestHandler = (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); };
  const csrf: RequestHandler = (req, res, next) => {
    const actual = req.get('X-CSRF-Token') ?? '';
    const expected = req.session.csrfToken ?? '';
    const a = Buffer.from(actual); const b = Buffer.from(expected);
    if (req.get('Origin') !== config.appOrigin || !b.length || a.length !== b.length || !timingSafeEqual(a, b)) {
      fail(res, 403, 'CSRF_INVALID', 'Invalid request token.'); return;
    }
    next();
  };
  const requireUser: RequestHandler = async (req, res, next) => {
    try {
      const { userId, authenticatedAt } = req.session;
      if (!userId || typeof authenticatedAt !== 'number' || now() >= authenticatedAt + lifetime) { fail(res, 401, 'UNAUTHENTICATED', 'Authentication required.'); return; }
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, displayName: true, role: true } });
      if (!user || (user.role !== 'PARTICIPANT' && user.role !== 'ORGANIZER' && user.role !== 'INSTRUCTOR')) { fail(res, 401, 'UNAUTHENTICATED', 'Authentication required.'); return; }
      res.locals.identity = user as Identity; next();
    } catch (err) { next(err); }
  };
  const requireRole = (role: Identity['role']): RequestHandler => (_req, res, next) => {
    if ((res.locals.identity as Identity | undefined)?.role !== role) { fail(res, 403, 'FORBIDDEN', 'Access denied.'); return; }
    next();
  };
  const jsonBody: RequestHandler = (req, res, next) => {
    if (!req.is('application/json')) { fail(res, 415, 'UNSUPPORTED_MEDIA_TYPE', 'JSON is required.'); return; }
    next();
  };
  const bootstrap: RequestHandler = async (req, res, next) => {
    try { req.session.csrfToken ??= token(); await save(req); res.json({ data: { csrfToken: req.session.csrfToken } }); } catch (err) { next(err); }
  };
  const login: RequestHandler = async (req, res, next) => {
    try {
      const body: unknown = req.body;
      const input = body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {};
      const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
      const password = typeof input.password === 'string' ? input.password : '';
      const errors: Record<string, string> = {};
      if (!email || [...email].length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email.';
      if (!password || Buffer.byteLength(password, 'utf8') > 1024) errors.password = 'Enter a valid password.';
      if (Object.keys(input).some(key => !['email', 'password'].includes(key))) errors.form = 'Unexpected field.';
      if (Object.keys(errors).length) { fail(res, 422, 'VALIDATION_ERROR', 'Invalid input.', errors); return; }
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !await argon2.verify(user.passwordHash, password) || (user.role !== 'PARTICIPANT' && user.role !== 'ORGANIZER' && user.role !== 'INSTRUCTOR')) {
        fail(res, 401, 'INVALID_CREDENTIALS', 'Incorrect email or password.'); return;
      }
      await regenerate(req);
      req.session.userId = user.id; req.session.authenticatedAt = now(); req.session.csrfToken = token();
      await save(req);
      res.json({ data: { user: { id: user.id, displayName: user.displayName, role: user.role }, csrfToken: req.session.csrfToken } });
    } catch (err) { next(err); }
  };
  const me: RequestHandler = (_req, res) => { res.json({ data: res.locals.identity }); };
  const logout: RequestHandler = async (req, res, next) => {
    try {
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) || Object.keys(req.body).length) { fail(res, 422, 'VALIDATION_ERROR', 'Invalid input.'); return; }
      await destroy(req); res.clearCookie('regmeup.sid', { httpOnly: true, sameSite: 'lax', path: '/', secure: config.nodeEnv === 'production' }); res.status(204).end();
    } catch (err) { next(err); }
  };
  const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) return;
    const type = (err as { type?: string })?.type;
    if (type === 'entity.parse.failed') { fail(res, 400, 'BAD_REQUEST', 'Invalid request.'); return; }
    if (type === 'entity.too.large') { fail(res, 413, 'PAYLOAD_TOO_LARGE', 'Request too large.'); return; }
    fail(res, 500, 'INTERNAL_ERROR', 'Unable to process request.');
  };
  return { noStore, csrf, requireUser, requireRole, jsonBody, bootstrap, login, me, logout, errorHandler };
}
