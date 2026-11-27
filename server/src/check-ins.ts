import type { RequestHandler, Response } from 'express';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { Identity } from './auth.js';
import { validatePagination } from './events-validation.js';
import { validateRegistrationId } from './registrations-validation.js';

const invalid = (res: Response) => res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } });
const missing = (res: Response) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } });

export function checkInHandlers(prisma: PrismaClient, now: () => number = Date.now) {
  const list: RequestHandler = async (req, res, next) => {
    try {
      const id = validateRegistrationId(req.params.eventId), pagination = validatePagination(req.query);
      if (!id || !pagination) { invalid(res); return; }
      const identity = res.locals.identity as Identity;
      const result = await prisma.$transaction(async tx => {
        const event = await tx.event.findFirst({ where: { id, organizerId: identity.id }, select: { id: true, title: true, startsAt: true, endsAt: true } });
        if (!event) return null;
        const where = { eventId: id, status: 'ACTIVE' };
        const [rows, total, attended] = await Promise.all([
          tx.registration.findMany({ where, select: { id: true, registeredAt: true, participant: { select: { displayName: true } }, attendance: { select: { id: true, checkedInAt: true } } }, orderBy: [{ registeredAt: 'asc' }, { id: 'asc' }], skip: pagination.skip, take: pagination.pageSize }),
          tx.registration.count({ where }),
          tx.attendance.count({ where: { registration: where } }),
        ]);
        return { event, rows, total, attended, serverNow: now() };
      }, { isolationLevel: 'RepeatableRead' });
      if (!result) { missing(res); return; }
      const { event, rows, total, attended, serverNow } = result;
      res.json({ data: { event, serverNow: new Date(serverNow).toISOString(), window: serverNow < event.startsAt.getTime() ? 'NOT_OPEN' : serverNow >= event.endsAt.getTime() ? 'CLOSED' : 'OPEN', summary: { activeRegistrations: total, attended }, registrations: rows.map(row => ({ registrationId: row.id, displayName: row.participant.displayName, registeredAt: row.registeredAt, attendance: row.attendance })) }, meta: { page: pagination.page, pageSize: pagination.pageSize, total } });
    } catch (error) { next(error); }
  };
  // Executable test-first scaffold: the eligible in-window assertion must fail.
  const create: RequestHandler = (_req, res) => { res.status(409).json({ error: { code: 'CHECK_IN_NOT_OPEN', message: 'Check-in is not open yet.' } }); };
  return { list, create };
}
