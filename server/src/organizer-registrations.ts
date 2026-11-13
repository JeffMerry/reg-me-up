import type { RequestHandler, Response } from 'express';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { Identity } from './auth.js';
import { validatePagination } from './events-validation.js';

const invalid = (res: Response) => res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } });
const notFound = (res: Response) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function organizerRegistrationHandlers(prisma: PrismaClient) {
  const list: RequestHandler = async (req, res, next) => {
    try {
      const pagination = validatePagination(req.query);
      if (!pagination || typeof req.params.eventId !== 'string' || !uuid.test(req.params.eventId)) { invalid(res); return; }
      const organizer = res.locals.identity as Identity;
      const result = await prisma.$transaction(async tx => {
        // Filter by owner before reading metadata, registrations, or totals.
        const event = await tx.event.findFirst({
          where: { id: req.params.eventId as string, organizerId: organizer.id },
          select: {
            id: true, title: true, startsAt: true, endsAt: true, location: true, capacity: true, description: true,
            organizer: { select: { displayName: true } },
          },
        });
        if (!event) return null;
        const where = { eventId: event.id, status: 'ACTIVE' };
        const [rows, total] = await Promise.all([
          tx.registration.findMany({
            where,
            select: { id: true, registeredAt: true, status: true, participant: { select: { displayName: true } } },
            orderBy: [{ registeredAt: 'asc' }, { id: 'asc' }],
            skip: pagination.skip,
            take: pagination.pageSize,
          }),
          tx.registration.count({ where }),
        ]);
        return { event, rows, total };
      }, { isolationLevel: 'RepeatableRead' });
      if (!result) { notFound(res); return; }
      const activeRegistrations = result.total;
      res.json({
        data: {
          event: {
            id: result.event.id,
            title: result.event.title,
            startsAt: result.event.startsAt.toISOString(),
            endsAt: result.event.endsAt.toISOString(),
            location: result.event.location,
            capacity: result.event.capacity,
            remainingSeats: result.event.capacity - activeRegistrations,
            description: result.event.description,
            organizer: result.event.organizer,
          },
          summary: { capacity: result.event.capacity, activeRegistrations, remainingSeats: result.event.capacity - activeRegistrations },
          registrations: result.rows.map(row => ({
            id: row.id,
            displayName: row.participant.displayName,
            registeredAt: row.registeredAt.toISOString(),
            status: row.status,
          })),
        },
        meta: { page: pagination.page, pageSize: pagination.pageSize, total: result.total },
      });
    } catch (error) { next(error); }
  };
  return { list };
}
