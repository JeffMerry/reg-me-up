import type { RequestHandler, Response } from 'express';
import type { PrismaClient } from '../generated/prisma/client.js';
import { validateEvent, validatePagination } from './events-validation.js';
import type { Identity } from './auth.js';

const selected = {
  id: true, title: true, startsAt: true, endsAt: true, location: true, capacity: true, description: true,
  organizer: { select: { displayName: true } },
  _count: { select: { registrations: { where: { status: 'ACTIVE' } } } },
} as const;
type EventRow = { id: string; title: string; startsAt: Date; endsAt: Date; location: string; capacity: number; description: string | null; organizer: { displayName: string }; _count: { registrations: number } };
const publicDto = (row: EventRow) => ({ id: row.id, title: row.title, startsAt: row.startsAt.toISOString(), endsAt: row.endsAt.toISOString(), location: row.location, capacity: row.capacity, remainingSeats: row.capacity - row._count.registrations, description: row.description, organizer: row.organizer });
const ownedDto = (row: EventRow) => ({ ...publicDto(row), activeRegistrationCount: row._count.registrations });
const invalid = (res: Response, fieldErrors?: Record<string, string>) => res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.', ...(fieldErrors ? { fieldErrors } : {}) } });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function eventHandlers(prisma: PrismaClient) {
  const publicList: RequestHandler = async (req, res, next) => {
    try {
      const pagination = validatePagination(req.query); if (!pagination) { invalid(res); return; }
      const { page, pageSize, skip } = pagination;
      const [rows, total] = await prisma.$transaction(async tx => Promise.all([
        tx.event.findMany({ where: { publicationStatus: 'PUBLISHED' }, select: selected, orderBy: [{ startsAt: 'asc' }, { id: 'asc' }], skip, take: pageSize }),
        tx.event.count({ where: { publicationStatus: 'PUBLISHED' } }),
      ]), { isolationLevel: 'RepeatableRead' });
      res.json({ data: rows.map(publicDto), meta: { page, pageSize, total } });
    } catch (error) { next(error); }
  };
  const detail: RequestHandler = async (req, res, next) => {
    try {
      if (Object.keys(req.query).length || typeof req.params.eventId !== 'string' || !uuid.test(req.params.eventId)) { invalid(res); return; }
      const row = await prisma.event.findFirst({ where: { id: req.params.eventId, publicationStatus: 'PUBLISHED' }, select: selected });
      if (!row) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } }); return; }
      res.json({ data: publicDto(row) });
    } catch (error) { next(error); }
  };
  const publish: RequestHandler = async (req, res, next) => {
    try {
      if (Object.keys(req.query).length) { invalid(res); return; }
      const input = validateEvent(req.body);
      if (!input.data) { invalid(res, input.errors); return; }
      const user = res.locals.identity as Identity;
      const row = await prisma.event.create({ data: { ...input.data, organizerId: user.id, publicationStatus: 'PUBLISHED' }, select: selected });
      res.status(201).json({ data: ownedDto(row) });
    } catch (error) { next(error); }
  };
  const ownList: RequestHandler = async (req, res, next) => {
    try {
      const pagination = validatePagination(req.query); if (!pagination) { invalid(res); return; }
      const { page, pageSize, skip } = pagination; const user = res.locals.identity as Identity;
      const [rows, total] = await prisma.$transaction(async tx => Promise.all([
        tx.event.findMany({ where: { organizerId: user.id }, select: selected, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip, take: pageSize }),
        tx.event.count({ where: { organizerId: user.id } }),
      ]), { isolationLevel: 'RepeatableRead' });
      res.json({ data: rows.map(ownedDto), meta: { page, pageSize, total } });
    } catch (error) { next(error); }
  };
  return { publicList, detail, publish, ownList };
}
