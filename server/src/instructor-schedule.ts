import type { Prisma } from '../generated/prisma/client.js';

export type EventInterval = { startsAt: Date; endsAt: Date };

export function overlapsHalfOpenInterval(candidate: EventInterval, other: EventInterval): boolean {
  return candidate.startsAt < other.endsAt && other.startsAt < candidate.endsAt;
}

export async function hasCurrentInstructorConflict(
  tx: Prisma.TransactionClient,
  instructorId: string,
  eventId: string,
  interval: EventInterval,
): Promise<boolean> {
  const assignments = await tx.instructorAssignment.findMany({
    where: { instructorId, endedAt: null, eventId: { not: eventId } },
    select: { event: { select: { startsAt: true, endsAt: true } } },
  });
  return assignments.some(({ event }) => overlapsHalfOpenInterval(interval, event));
}
