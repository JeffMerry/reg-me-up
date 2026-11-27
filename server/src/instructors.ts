import type { RequestHandler, Response } from 'express';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { Identity } from './auth.js';
import { publicEventDto, publicEventSelection } from './event-dto.js';
import { withEventWrite } from './event-write.js';
import { validatePagination } from './events-validation.js';
import { hasCurrentInstructorConflict } from './instructor-schedule.js';
import { isConnectionLoss, isKnownContention } from './registrations.js';
import { validateRegistrationId } from './registrations-validation.js';
import { ownerEventDto, ownerEventSelection } from './owner-event-dto.js';

const invalid = (res: Response, fieldErrors?: Record<string, string>) => res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.', ...(fieldErrors ? { fieldErrors } : {}) } });
const missing = (res: Response) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } });
const messages = {
  EVENT_CHANGED: 'This event has changed. Reload it before saving.',
  EVENT_STARTED: 'This event has started and can no longer be assigned.',
  INSTRUCTOR_UNAVAILABLE: 'This Instructor is unavailable for the selected time.',
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type MutationBody = { expectedVersion: number; instructorId?: unknown };

function mutationBody(value: unknown, includeInstructor: boolean): MutationBody | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const allowed = includeInstructor ? ['expectedVersion', 'instructorId'] : ['expectedVersion'];
  if (Object.keys(body).some(key => !allowed.includes(key)) || !Number.isSafeInteger(body.expectedVersion) || (body.expectedVersion as number) < 0) return null;
  return body as MutationBody;
}

export function instructorHandlers(prisma: PrismaClient, now: () => number = Date.now) {
  const directory: RequestHandler = async (req, res, next) => {
    try {
      const pagination = validatePagination(req.query);
      if (!pagination) { invalid(res); return; }
      const { page, pageSize, skip } = pagination;
      const [rows, total] = await prisma.$transaction(async tx => Promise.all([
        tx.user.findMany({ where: { role: 'INSTRUCTOR' }, select: { id: true, displayName: true }, orderBy: [{ displayName: 'asc' }, { id: 'asc' }], skip, take: pageSize }),
        tx.user.count({ where: { role: 'INSTRUCTOR' } }),
      ]), { isolationLevel: 'RepeatableRead' });
      res.json({ data: rows, meta: { page, pageSize, total } });
    } catch (error) { next(error); }
  };

  const assign: RequestHandler = async (req, res, next) => {
    let wrote = false;
    try {
      const id = validateRegistrationId(req.params.eventId);
      const body = mutationBody(req.body, true);
      if (!id || Object.keys(req.query).length || !body) { invalid(res); return; }
      const instructorId = body.instructorId;
      if (typeof instructorId !== 'string' || !uuid.test(instructorId)) { invalid(res, { instructorId: 'Choose an existing Instructor.' }); return; }
      const identity = res.locals.identity as Identity;
      const result = await withEventWrite(prisma, { eventId: id, scope: 'schedule' }, async tx => {
        const event = await tx.event.findFirst({ where: { id, organizerId: identity.id }, select: ownerEventSelection });
        if (!event) return null;
        if (event.version !== body.expectedVersion) return { conflict: 'EVENT_CHANGED' as const };
        const decisionTime = new Date(now());
        if (decisionTime >= event.startsAt) return { conflict: 'EVENT_STARTED' as const };
        const candidate = await tx.user.findFirst({ where: { id: instructorId, role: 'INSTRUCTOR' }, select: { id: true } });
        if (!candidate) return { errors: { instructorId: 'Choose an existing Instructor.' } };
        const current = await tx.instructorAssignment.findFirst({ where: { eventId: id, endedAt: null }, select: { id: true, instructorId: true } });
        if (current?.instructorId === candidate.id) return { event };
        if (await hasCurrentInstructorConflict(tx, candidate.id, id, { startsAt: event.startsAt, endsAt: event.endsAt })) return { conflict: 'INSTRUCTOR_UNAVAILABLE' as const };
        if (current) { await tx.instructorAssignment.update({ where: { id: current.id }, data: { endedAt: decisionTime } }); wrote = true; }
        await tx.instructorAssignment.create({ data: { eventId: id, instructorId: candidate.id, assignedAt: decisionTime } }); wrote = true;
        return { event: await tx.event.update({ where: { id }, data: { version: { increment: 1 } }, select: ownerEventSelection }) };
      });
      if (!result.found || !result.value) { missing(res); return; }
      if ('errors' in result.value) { invalid(res, result.value.errors); return; }
      if ('conflict' in result.value) { res.status(409).json({ error: { code: result.value.conflict, message: messages[result.value.conflict as keyof typeof messages] ?? 'This event cannot be changed.' } }); return; }
      res.json({ data: ownerEventDto(result.value.event) });
    } catch (error) {
      if (wrote && isConnectionLoss(error)) { res.status(503).json({ error: { code: 'OUTCOME_UNKNOWN', message: 'We could not confirm the assignment. Reload before saving again.' } }); return; }
      if (isKnownContention(error)) { res.status(503).json({ error: { code: 'TEMPORARILY_UNAVAILABLE', message: 'Assignment is temporarily unavailable. Reload before saving again.' } }); return; }
      next(error);
    }
  };

  const remove: RequestHandler = async (req, res, next) => {
    let wrote = false;
    try {
      const id = validateRegistrationId(req.params.eventId);
      const body = mutationBody(req.body, false);
      if (!id || Object.keys(req.query).length || !body) { invalid(res); return; }
      const identity = res.locals.identity as Identity;
      const result = await withEventWrite(prisma, { eventId: id, scope: 'schedule' }, async tx => {
        const event = await tx.event.findFirst({ where: { id, organizerId: identity.id }, select: ownerEventSelection });
        if (!event) return null;
        if (event.version !== body.expectedVersion) return { conflict: 'EVENT_CHANGED' as const };
        const decisionTime = new Date(now());
        if (decisionTime >= event.startsAt) return { conflict: 'EVENT_STARTED' as const };
        const current = await tx.instructorAssignment.findFirst({ where: { eventId: id, endedAt: null }, select: { id: true } });
        if (!current) return { event };
        await tx.instructorAssignment.update({ where: { id: current.id }, data: { endedAt: decisionTime } }); wrote = true;
        return { event: await tx.event.update({ where: { id }, data: { version: { increment: 1 } }, select: ownerEventSelection }) };
      });
      if (!result.found || !result.value) { missing(res); return; }
      if ('conflict' in result.value) { res.status(409).json({ error: { code: result.value.conflict, message: messages[result.value.conflict as keyof typeof messages] ?? 'This event cannot be changed.' } }); return; }
      res.json({ data: ownerEventDto(result.value.event) });
    } catch (error) {
      if (wrote && isConnectionLoss(error)) { res.status(503).json({ error: { code: 'OUTCOME_UNKNOWN', message: 'We could not confirm the assignment change. Reload before saving again.' } }); return; }
      if (isKnownContention(error)) { res.status(503).json({ error: { code: 'TEMPORARILY_UNAVAILABLE', message: 'Assignment is temporarily unavailable. Reload before saving again.' } }); return; }
      next(error);
    }
  };

  const teachingList: RequestHandler = async (req, res, next) => {
    try {
      const pagination = validatePagination(req.query);
      if (!pagination) { invalid(res); return; }
      const { page, pageSize, skip } = pagination;
      const identity = res.locals.identity as Identity;
      const [assignments, total] = await prisma.$transaction(async tx => Promise.all([
        tx.instructorAssignment.findMany({ where: { instructorId: identity.id, endedAt: null }, select: { event: { select: publicEventSelection } }, orderBy: [{ event: { startsAt: 'asc' } }, { eventId: 'asc' }], skip, take: pageSize }),
        tx.instructorAssignment.count({ where: { instructorId: identity.id, endedAt: null } }),
      ]), { isolationLevel: 'RepeatableRead' });
      res.json({ data: assignments.map(({ event }) => publicEventDto(event)), meta: { page, pageSize, total } });
    } catch (error) { next(error); }
  };

  const teachingDetail: RequestHandler = async (req, res, next) => {
    try {
      const id = validateRegistrationId(req.params.eventId);
      if (!id || Object.keys(req.query).length) { invalid(res); return; }
      const identity = res.locals.identity as Identity;
      const assignment = await prisma.instructorAssignment.findFirst({ where: { eventId: id, instructorId: identity.id, endedAt: null }, select: { event: { select: publicEventSelection } } });
      if (!assignment) { missing(res); return; }
      res.json({ data: publicEventDto(assignment.event) });
    } catch (error) { next(error); }
  };

  return { directory, assign, remove, teachingList, teachingDetail };
}
