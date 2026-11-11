import express from 'express';
import type pg from 'pg';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { ServerConfig } from './config.js';
import { authHandlers, authMiddleware } from './auth.js';

export function createApp(checkDatabase: () => Promise<void>, auth?: { config: ServerConfig; pool: pg.Pool; prisma: PrismaClient; now?: () => number }) {
  const app = express();
  app.disable('x-powered-by');
  app.get('/api/health', async (_req, res) => {
    try { await checkDatabase(); res.status(200).json({ status: 'ok' }); }
    catch { res.status(503).json({ status: 'unavailable' }); }
  });
  if (auth) {
    const h = authHandlers(auth.prisma, auth.config, auth.now);
    app.use('/api', h.noStore, authMiddleware(auth.config, auth.pool));
    app.use('/api', express.json({ limit: '64kb' }));
    app.get('/api/auth/csrf', h.bootstrap);
    app.post('/api/auth/login', h.csrf, h.jsonBody, h.login);
    app.get('/api/auth/me', h.requireUser, h.me);
    app.post('/api/auth/logout', h.requireUser, h.csrf, h.jsonBody, h.logout);
    app.use(h.errorHandler);
  }
  return app;
}
