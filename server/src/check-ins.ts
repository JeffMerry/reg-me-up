import type { RequestHandler, Response } from 'express';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { Identity } from './auth.js';
import { validatePagination } from './events-validation.js';
import { validateRegistrationId } from './registrations-validation.js';
import { withEventWrite } from './event-write.js';
import { isConnectionLoss, isKnownContention } from './registrations.js';

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
  const create: RequestHandler = async (req, res, next) => {
    let wrote = false;
    try {
      const eventId = validateRegistrationId(req.params.eventId), registrationId = validateRegistrationId(req.params.registrationId);
      if (!eventId || !registrationId || Object.keys(req.query).length || !req.body || typeof req.body !== 'object' || Array.isArray(req.body) || Object.keys(req.body).length) { invalid(res); return; }
      const identity = res.locals.identity as Identity;
      const result = await withEventWrite(prisma, { eventId }, async tx => {
        const event = await tx.event.findFirst({ where: { id: eventId, organizerId: identity.id }, select: { startsAt: true, endsAt: true } });
        if (!event) return null;
        const row = await tx.registration.findFirst({ where: { id: registrationId, eventId }, select: { status: true, attendance: { select: { id: true, registrationId: true, checkedInAt: true } } } });
        if (!row) return null;
        if (row.status !== 'ACTIVE') return { conflict: 'REGISTRATION_INELIGIBLE' as const };
        if (row.attendance) return { attendance: row.attendance, created: false };
        // Trusted clock is sampled only after the shared event lock and eligibility read.
        const decisionTime = new Date(now());
        if (decisionTime < event.startsAt) return { conflict: 'CHECK_IN_NOT_OPEN' as const };
        if (decisionTime >= event.endsAt) return { conflict: 'CHECK_IN_CLOSED' as const };
        const attendance = await tx.attendance.create({ data: { registrationId, checkedInBy: identity.id, checkedInAt: decisionTime }, select: { id: true, registrationId: true, checkedInAt: true } });
        wrote = true;
        return { attendance, created: true };
      });
      if (!result.found || !result.value) { missing(res); return; }
      if (result.value.conflict) {
        const messages = { REGISTRATION_INELIGIBLE: 'This registration is no longer eligible.', CHECK_IN_NOT_OPEN: 'Check-in is not open yet.', CHECK_IN_CLOSED: 'Check-in has closed.' };
        res.status(409).json({ error: { code: result.value.conflict, message: messages[result.value.conflict] } }); return;
      }
      res.status(result.value.created ? 201 : 200).json({ data: result.value.attendance });
    } catch (error) {
      if (wrote && isConnectionLoss(error)) { res.status(503).json({ error: { code: 'OUTCOME_UNKNOWN', message: 'We could not confirm check-in. Check status before trying again.' } }); return; }
      if (isKnownContention(error)) { res.status(503).json({ error: { code: 'TEMPORARILY_UNAVAILABLE', message: 'Check-in is temporarily unavailable. Check status before trying again.' } }); return; }
      next(error);
    }
  };
  return { list, create };
}
