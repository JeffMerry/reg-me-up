import type { RequestHandler, Response } from 'express';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { Identity } from './auth.js';
import { hasEmptyRegistrationBody, validateOwnRegistrationQuery, validateRegistrationId } from './registrations-validation.js';
import { withEventWrite } from './event-write.js';

const eventSelection = {
  id: true, title: true, startsAt: true, endsAt: true, location: true, capacity: true, description: true,
  organizer: { select: { displayName: true } },
  _count: { select: { registrations: { where: { status: 'ACTIVE' } } } },
} as const;
const publicEvent = (event: { id: string; title: string; startsAt: Date; endsAt: Date; location: string; capacity: number; description: string | null; organizer: { displayName: string }; _count: { registrations: number } }) => ({
  id: event.id, title: event.title, startsAt: event.startsAt.toISOString(), endsAt: event.endsAt.toISOString(), location: event.location, capacity: event.capacity,
  remainingSeats: event.capacity - event._count.registrations, description: event.description, organizer: event.organizer,
});
const invalid = (res: Response) => res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } });
const notFound = (res: Response) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } });
const ownSelection = {
  id: true, status: true, registeredAt: true, cancelledAt: true, participant: { select: { displayName: true } }, event: { select: eventSelection },
} as const;
const ownDto = (row: { id: string; status: string; registeredAt: Date; cancelledAt: Date | null; participant: { displayName: string }; event: Parameters<typeof publicEvent>[0] }) => ({
  id: row.id, status: row.status, registeredAt: row.registeredAt.toISOString(), cancelledAt: row.cancelledAt?.toISOString() ?? null, participant: row.participant, event: publicEvent(row.event),
});
function isKnownContention(error: unknown): boolean {
  const pending: unknown[] = [error]; const seen = new Set<object>();
  while (pending.length) {
    const value = pending.pop();
    if (!value || typeof value !== 'object' || seen.has(value)) continue;
    seen.add(value);
    const item = value as { code?: unknown; meta?: unknown; cause?: unknown; originalCode?: unknown };
    if (['55P03', '57014', '40P01', 'P2028'].includes(String(item.code)) || ['55P03', '57014', '40P01'].includes(String(item.originalCode))) return true;
    if (item.meta) pending.push(item.meta);
    if (item.cause) pending.push(item.cause);
    for (const child of Object.values(value)) if (child && typeof child === 'object') pending.push(child);
  }
  return false;
}
function isConnectionLoss(error: unknown): boolean {
  const pending: unknown[] = [error]; const seen = new Set<object>();
  while (pending.length) {
    const value = pending.pop();
    if (!value || typeof value !== 'object' || seen.has(value)) continue;
    seen.add(value);
    const item = value as { code?: unknown; meta?: unknown; cause?: unknown; originalCode?: unknown };
    if (['P1017', '08006', '57P01', '57P02', '57P03'].includes(String(item.code)) || ['08006', '57P01', '57P02', '57P03'].includes(String(item.originalCode))) return true;
    if (item.meta) pending.push(item.meta);
    if (item.cause) pending.push(item.cause);
    for (const child of Object.values(value)) if (child && typeof child === 'object') pending.push(child);
  }
  return false;
}

export function registrationHandlers(prisma: PrismaClient, now: () => number = Date.now) {
  const create: RequestHandler = async (req, res, next) => {
    let insertedBeforeConnectionLoss = false;
    try {
      const eventId = validateRegistrationId(req.params.eventId);
      if (!eventId || Object.keys(req.query).length || !hasEmptyRegistrationBody(req.body)) { invalid(res); return; }
      const participant = res.locals.identity as Identity;
      const write = await withEventWrite(prisma, { eventId, publishedOnly: true }, async tx => {
        const existing = await tx.registration.findFirst({ where: { eventId, participantId: participant.id, status: 'ACTIVE' }, select: { id: true } });
        if (existing) return { kind: 'ALREADY_REGISTERED' as const, registrationId: existing.id };
        const event = await tx.event.findUniqueOrThrow({ where: { id: eventId }, select: { startsAt: true, capacity: true, _count: { select: { registrations: { where: { status: 'ACTIVE' } } } } } });
        // F-06 will extend this start cutoff with its optional deadline. Do not
        // add the peer-owned schema here; existing own duplicates still win.
        if (now() >= event.startsAt.getTime()) return { kind: 'REGISTRATION_CLOSED' as const };
        if (event._count.registrations >= event.capacity) return { kind: 'EVENT_FULL' as const };
        const registration = await tx.registration.create({ data: { eventId, participantId: participant.id, status: 'ACTIVE' }, select: ownSelection });
        insertedBeforeConnectionLoss = true;
        return { kind: 'CREATED' as const, registration };
      });
      if (!write.found) { notFound(res); return; }
      const outcome = write.value;
      if (outcome.kind === 'ALREADY_REGISTERED') { res.status(409).json({ error: { code: outcome.kind, message: 'Already registered.', registrationId: outcome.registrationId } }); return; }
      if (outcome.kind === 'REGISTRATION_CLOSED') { res.status(409).json({ error: { code: outcome.kind, message: 'Registration is closed.' } }); return; }
      if (outcome.kind === 'EVENT_FULL') { res.status(409).json({ error: { code: outcome.kind, message: 'This event is full.' } }); return; }
      res.status(201).json({ data: ownDto(outcome.registration) });
    } catch (error) {
      if (insertedBeforeConnectionLoss && isConnectionLoss(error)) { res.status(503).json({ error: { code: 'OUTCOME_UNKNOWN', message: 'We could not confirm your registration. Check your registrations before trying again.' } }); return; }
      if (isKnownContention(error)) { res.status(503).json({ error: { code: 'TEMPORARILY_UNAVAILABLE', message: 'Registration is temporarily unavailable. Please check your registrations before trying again.' } }); return; }
      next(error);
    }
  };
  const ownList: RequestHandler = async (req, res, next) => {
    try {
      const query = validateOwnRegistrationQuery(req.query);
      if (!query) { invalid(res); return; }
      const participant = res.locals.identity as Identity;
      const where = { participantId: participant.id, ...(query.eventId ? { eventId: query.eventId } : {}) };
      const [rows, total] = await prisma.$transaction(async tx => Promise.all([
        tx.registration.findMany({ where, select: ownSelection, orderBy: [{ registeredAt: 'desc' }, { id: 'desc' }], skip: query.skip, take: query.pageSize }),
        tx.registration.count({ where }),
      ]), { isolationLevel: 'RepeatableRead' });
      res.json({ data: rows.map(ownDto), meta: { page: query.page, pageSize: query.pageSize, total } });
    } catch (error) { next(error); }
  };
  const ownDetail: RequestHandler = async (req, res, next) => {
    try {
      const id = validateRegistrationId(req.params.registrationId);
      if (!id || Object.keys(req.query).length) { invalid(res); return; }
      const participant = res.locals.identity as Identity;
      const row = await prisma.registration.findFirst({ where: { id, participantId: participant.id }, select: ownSelection });
      if (!row) { notFound(res); return; }
      res.json({ data: ownDto(row) });
    } catch (error) { next(error); }
  };
  const cancel: RequestHandler = async (req, res, next) => {
    let changedBeforeConnectionLoss = false;
    try {
      const id = validateRegistrationId(req.params.registrationId);
      if (!id || Object.keys(req.query).length || !hasEmptyRegistrationBody(req.body)) { invalid(res); return; }
      const participant = res.locals.identity as Identity;
      // Resolve only an owned row before finding its event lock. Re-read under
      // lock so repeated/concurrent cancellation acts on this exact ID/state.
      const target = await prisma.registration.findFirst({ where: { id, participantId: participant.id }, select: { eventId: true } });
      if (!target) { notFound(res); return; }
      const write = await withEventWrite(prisma, { eventId: target.eventId }, async tx => {
        const registration = await tx.registration.findFirst({ where: { id, participantId: participant.id }, select: ownSelection });
        if (!registration) return { kind: 'NOT_FOUND' as const };
        if (registration.status === 'CANCELLED') return { kind: 'CANCELLED' as const, registration };
        const decisionTime = new Date(now());
        if (decisionTime.getTime() >= registration.event.startsAt.getTime()) return { kind: 'CANCELLATION_CLOSED' as const };
        const updated = await tx.registration.update({ where: { id }, data: { status: 'CANCELLED', cancelledAt: decisionTime }, select: ownSelection });
        changedBeforeConnectionLoss = true;
        return { kind: 'CANCELLED' as const, registration: updated };
      });
      if (!write.found || write.value.kind === 'NOT_FOUND') { notFound(res); return; }
      if (write.value.kind === 'CANCELLATION_CLOSED') {
        res.status(409).json({ error: { code: 'CANCELLATION_CLOSED', message: 'Cancellation is closed because this event has started.' } }); return;
      }
      res.json({ data: ownDto(write.value.registration) });
    } catch (error) {
      if (changedBeforeConnectionLoss && isConnectionLoss(error)) {
        res.status(503).json({ error: { code: 'OUTCOME_UNKNOWN', message: 'We could not confirm cancellation. Check your registration before trying again.' } }); return;
      }
      if (isKnownContention(error)) {
        res.status(503).json({ error: { code: 'TEMPORARILY_UNAVAILABLE', message: 'Cancellation is temporarily unavailable. Check your registration before trying again.' } }); return;
      }
      next(error);
    }
  };
  return { create, ownList, ownDetail, cancel };
}
