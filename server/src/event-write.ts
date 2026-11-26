import type { Prisma, PrismaClient } from '../generated/prisma/client.js';

export type EventWriteScope = 'event' | 'schedule';
export type EventWriteResult<T> = { found: false } | { found: true; value: T };

// All active-count/capacity writers lock the event before reading mutable state.
// The schedule scope is reserved for the cross-event Instructor write protocol.
export async function withEventWrite<T>(
  prisma: PrismaClient,
  options: { eventId: string; publishedOnly?: boolean; scope?: EventWriteScope },
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<EventWriteResult<T>> {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT set_config('lock_timeout', '2s', true)`;
    await tx.$queryRaw`SELECT set_config('statement_timeout', '5s', true)`;
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
