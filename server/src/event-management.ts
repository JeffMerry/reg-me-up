import type { RequestHandler } from 'express';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { Identity } from './auth.js';
import { validateRegistrationId } from './registrations-validation.js';

// Test-first owner read scaffold. PATCH is initially a read so the persisted
// edit/version assertions can demonstrate domain RED before mutation code.
export function eventManagementHandlers(prisma: PrismaClient, _now: () => number = Date.now) {
  const detail: RequestHandler = async (req, res, next) => {
    try {
      const id = validateRegistrationId(req.params.eventId);
      if (!id || Object.keys(req.query).length) { res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } }); return; }
      const identity = res.locals.identity as Identity;
      const row = await prisma.event.findFirst({ where: { id, organizerId: identity.id }, select: { id: true, title: true, version: true } });
      if (!row) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } }); return; }
      res.json({ data: row });
    } catch (error) { next(error); }
  };
  return { detail, edit: detail };
}
