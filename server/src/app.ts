import express from 'express';
import type pg from 'pg';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { ServerConfig } from './config.js';
import { authHandlers, authMiddleware } from './auth.js';
import { eventHandlers } from './events.js';
import { registrationHandlers } from './registrations.js';
import { organizerRegistrationHandlers } from './organizer-registrations.js';

export function createApp(checkDatabase: () => Promise<void>, auth?: { config: ServerConfig; pool: pg.Pool; prisma: PrismaClient; now?: () => number }) {
  const app = express();
  app.disable('x-powered-by');
  if (auth?.config.nodeEnv === 'production' && auth.config.trustProxyHops === 1) app.set('trust proxy', 1);
  app.get(['/api/health', '/api/ready'], async (_req, res) => {
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
    const events = eventHandlers(auth.prisma);
    const registrations = registrationHandlers(auth.prisma);
    const organizerRegistrations = organizerRegistrationHandlers(auth.prisma);
    app.get('/api/events', events.publicList);
    app.get('/api/events/:eventId', events.detail);
    app.post('/api/events', h.requireUser, h.requireRole('ORGANIZER'), h.csrf, h.jsonBody, events.publish);
    app.get('/api/me/events', h.requireUser, h.requireRole('ORGANIZER'), events.ownList);
    app.get('/api/organizer/events/:eventId/registrations', h.requireUser, h.requireRole('ORGANIZER'), organizerRegistrations.list);
    app.post('/api/events/:eventId/registrations', h.requireUser, h.requireRole('PARTICIPANT'), h.csrf, h.jsonBody, registrations.create);
    app.get('/api/me/registrations', h.requireUser, h.requireRole('PARTICIPANT'), registrations.ownList);
    app.get('/api/me/registrations/:registrationId', h.requireUser, h.requireRole('PARTICIPANT'), registrations.ownDetail);
    app.use(h.errorHandler);
  }
  return app;
}
