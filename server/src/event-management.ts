import type { RequestHandler, Response } from 'express';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { Identity } from './auth.js';
import { validateRegistrationId } from './registrations-validation.js';
import { validateEventEdit } from './event-edit-validation.js';
import { withEventWrite } from './event-write.js';
import { ownerEventDto, ownerEventSelection } from './owner-event-dto.js';
import { hasCurrentInstructorConflict } from './instructor-schedule.js';
import { isKnownContention, isConnectionLoss } from './registrations.js';

const invalid = (res: Response, fieldErrors?: Record<string, string>) => res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.', ...(fieldErrors ? { fieldErrors } : {}) } });
const missing = (res: Response) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } });
const messages = { EVENT_CHANGED: 'This event has changed. Reload it before saving.', EVENT_STARTED: 'This event has started and cannot be edited.', CAPACITY_BELOW_ACTIVE: 'Capacity cannot be lower than active registrations.', INSTRUCTOR_UNAVAILABLE: 'This Instructor is unavailable for the selected time.' };

export function eventManagementHandlers(prisma: PrismaClient, now: () => number = Date.now) {
  const detail: RequestHandler = async (req, res, next) => {
    try {
      const id = validateRegistrationId(req.params.eventId);
      if (!id || Object.keys(req.query).length) { res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } }); return; }
      const identity = res.locals.identity as Identity;
      const row = await prisma.event.findFirst({ where: { id, organizerId: identity.id }, select: ownerEventSelection });
      if (!row) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } }); return; }
      res.json({ data: ownerEventDto(row) });
    } catch (error) { next(error); }
  };
  const edit: RequestHandler = async (req, res, next) => {
    let wrote = false;
    try {
      const id = validateRegistrationId(req.params.eventId);
      if (!id || Object.keys(req.query).length) { invalid(res); return; }
      const identity = res.locals.identity as Identity;
      const result = await withEventWrite(prisma, { eventId: id, scope: 'schedule' }, async tx => {
        const row = await tx.event.findFirst({ where: { id, organizerId: identity.id }, select: ownerEventSelection });
        if (!row) return null;
        const input = validateEventEdit(req.body, { ...row, activeRegistrationCount: row._count.registrations }, now());
        if (!('data' in input)) return input;
        if (!input.changed) return { row };
        const assignedInstructor = row.instructorAssignments[0]?.instructor;
        if (assignedInstructor && (input.data.startsAt.getTime() !== row.startsAt.getTime() || input.data.endsAt.getTime() !== row.endsAt.getTime())
          && await hasCurrentInstructorConflict(tx, assignedInstructor.id, id, { startsAt: input.data.startsAt, endsAt: input.data.endsAt })) {
          return { conflict: 'INSTRUCTOR_UNAVAILABLE' as const };
        }
        // Write supplied fields only, retaining omitted precision/legacy values.
        const fields = req.body as Record<string, unknown>;
        const data = Object.fromEntries(Object.entries(input.data).filter(([key]) => Object.hasOwn(fields, key)));
        const updated = await tx.event.update({ where: { id }, data: { ...data, version: { increment: 1 } }, select: ownerEventSelection });
        wrote = true;
        return { row: updated };
      });
      if (!result.found || !result.value) { missing(res); return; }
      const outcome = result.value;
      if ('errors' in outcome) { invalid(res, outcome.errors); return; }
      if ('conflict' in outcome) { res.status(409).json({ error: { code: outcome.conflict, message: messages[outcome.conflict as keyof typeof messages] ?? 'This event cannot be changed.' } }); return; }
      res.json({ data: ownerEventDto(outcome.row) });
    } catch (error) {
      if (wrote && isConnectionLoss(error)) { res.status(503).json({ error: { code: 'OUTCOME_UNKNOWN', message: 'We could not confirm the edit. Reload before saving again.' } }); return; }
      if (isKnownContention(error)) { res.status(503).json({ error: { code: 'TEMPORARILY_UNAVAILABLE', message: 'Editing is temporarily unavailable. Reload before saving again.' } }); return; }
      next(error);
    }
  };
  return { detail, edit };
}
