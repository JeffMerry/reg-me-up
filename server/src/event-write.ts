import type { Prisma, PrismaClient } from '../generated/prisma/client.js';

export type EventWriteScope = 'event' | 'schedule';
export type EventWriteResult<T> = { found: false } | { found: true; value: T };

// A shared, stable PostgreSQL two-int advisory key. F-06 and F-09 must use the
// same key for time/assignment edits, including edits on different events.
export const SCHEDULE_WRITE_LOCK = { namespace: 334, key: 2 } as const;

// All active-count/capacity writers lock the event before reading mutable state.
// Schedule mutations take the global schedule lock BEFORE the event row. Plain
// registration/cancellation only take the event row and cannot invert this order.
// Callers authorize ownership and sample decision time inside the callback.
export async function withEventWrite<T>(
  prisma: PrismaClient,
  options: { eventId: string; publishedOnly?: boolean; scope?: EventWriteScope },
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<EventWriteResult<T>> {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT set_config('lock_timeout', '2s', true)`;
    await tx.$queryRaw`SELECT set_config('statement_timeout', '5s', true)`;
    if (options.scope === 'schedule') {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(${SCHEDULE_WRITE_LOCK.namespace}::int, ${SCHEDULE_WRITE_LOCK.key}::int)::text`;
    }
    const publishedOnly = options.publishedOnly ?? false;
    const locked = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM events
      WHERE id = ${options.eventId}::uuid AND (${publishedOnly} = false OR publication_status = 'PUBLISHED')
      FOR UPDATE
    `;
    if (!locked.length) return { found: false };
    return { found: true, value: await operation(tx) };
  }, { isolationLevel: 'ReadCommitted', maxWait: 5000, timeout: 10000 });
}
