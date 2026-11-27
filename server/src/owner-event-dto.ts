import type { Prisma } from '../generated/prisma/client.js';
import { publicEventDto, publicEventSelection } from './event-dto.js';

export const ownerEventSelection = {
  ...publicEventSelection,
  version: true,
  organizerId: true,
  instructorAssignments: { where: { endedAt: null }, select: { instructor: { select: { id: true, displayName: true } } }, take: 1 },
} as const;

export type OwnerEventRow = Prisma.EventGetPayload<{ select: typeof ownerEventSelection }>;

export const ownerEventDto = (row: OwnerEventRow) => ({
  ...publicEventDto(row),
  activeRegistrationCount: row._count.registrations,
  version: row.version,
  currentInstructor: row.instructorAssignments[0]?.instructor ?? null,
});
