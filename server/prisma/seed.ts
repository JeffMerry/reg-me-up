import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import argon2 from 'argon2';

async function seed() {
  if (process.env.NODE_ENV === 'production' || process.env.ALLOW_SYNTHETIC_SEED !== '1' || !process.env.DATABASE_URL || !process.env.SEED_PASSWORD) {
    throw new Error('Synthetic seed requires non-production mode, DATABASE_URL, SEED_PASSWORD and ALLOW_SYNTHETIC_SEED=1');
  }
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const people = [
      ['10000000-0000-4000-8000-000000000001', 'p1@example.test', 'Participant One', 'PARTICIPANT'],
      ['10000000-0000-4000-8000-000000000002', 'p2@example.test', 'Participant Two', 'PARTICIPANT'],
      ['10000000-0000-4000-8000-000000000003', 'p3@example.test', 'Participant Three', 'PARTICIPANT'],
      ['20000000-0000-4000-8000-000000000001', 'o1@example.test', 'Organizer One', 'ORGANIZER'],
      ['20000000-0000-4000-8000-000000000002', 'o2@example.test', 'Organizer Two', 'ORGANIZER'],
    ];
    await prisma.$transaction(async (tx) => {
      for (const [id, email, displayName, role] of people) {
        const passwordHash = await argon2.hash(process.env.SEED_PASSWORD!, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
        await tx.user.upsert({ where: { id }, update: {}, create: { id, email, displayName, role, passwordHash } });
      }
      const events = [
        ['30000000-0000-4000-8000-000000000001', 'Empty workshop', 3, 'PUBLISHED'],
        ['30000000-0000-4000-8000-000000000002', 'Partial workshop', 3, 'PUBLISHED'],
        ['30000000-0000-4000-8000-000000000003', 'Full workshop', 1, 'PUBLISHED'],
        ['30000000-0000-4000-8000-000000000004', 'Hidden workshop', 3, 'UNPUBLISHED'],
      ] as const;
      for (const [id, title, capacity, publicationStatus] of events) {
        await tx.event.upsert({ where: { id }, update: {}, create: { id, organizerId: people[3][0], title, capacity, publicationStatus, startsAt: new Date('2027-01-15T02:00:00Z'), endsAt: new Date('2027-01-15T04:00:00Z'), location: 'University room' } });
      }
      for (const [id, eventId, participantId] of [
        ['40000000-0000-4000-8000-000000000001', events[1][0], people[0][0]],
        ['40000000-0000-4000-8000-000000000002', events[2][0], people[1][0]],
      ]) {
        await tx.registration.upsert({ where: { id }, update: {}, create: { id, eventId, participantId, status: 'ACTIVE' } });
      }
    });
    console.log('Synthetic fixtures are present.');
  } finally { await prisma.$disconnect(); }
}

seed().catch(() => { console.error('Synthetic seed failed; check configuration and database state.'); process.exitCode = 1; });
