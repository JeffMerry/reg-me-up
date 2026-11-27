import type { Prisma } from '../generated/prisma/client.js';

export const publicEventSelection = {
  id: true, title: true, startsAt: true, endsAt: true, location: true, capacity: true, description: true, registrationDeadline: true,
  organizer: { select: { displayName: true } },
  _count: { select: { registrations: { where: { status: 'ACTIVE' } } } },
} as const;
export type PublicEventRow = Prisma.EventGetPayload<{ select: typeof publicEventSelection }>;
export const effectiveCutoff = (row: { startsAt: Date; registrationDeadline: Date | null }) => row.registrationDeadline ?? row.startsAt;
export const publicEventDto = (row: PublicEventRow) => ({
  id: row.id, title: row.title, startsAt: row.startsAt.toISOString(), endsAt: row.endsAt.toISOString(), location: row.location,
  capacity: row.capacity, remainingSeats: row.capacity - row._count.registrations, description: row.description, organizer: row.organizer,
  registrationDeadline: row.registrationDeadline?.toISOString() ?? null, effectiveRegistrationCutoff: effectiveCutoff(row).toISOString(),
});
