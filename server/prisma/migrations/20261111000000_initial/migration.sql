-- Keep all initial PostgreSQL DDL atomic.
BEGIN;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "organizer_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "location" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "description" TEXT,
    "publication_status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "participant_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "registered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "sid" VARCHAR NOT NULL,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "events_publication_status_starts_at_id_idx" ON "events"("publication_status", "starts_at", "id");

-- CreateIndex
CREATE INDEX "events_organizer_id_created_at_id_idx" ON "events"("organizer_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "registrations_event_id_status_registered_at_id_idx" ON "registrations"("event_id", "status", "registered_at", "id");

-- CreateIndex
CREATE INDEX "registrations_participant_id_registered_at_id_idx" ON "registrations"("participant_id", "registered_at", "id");

-- CreateIndex
CREATE INDEX "IDX_sessions_expire" ON "sessions"("expire");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domain checks are reviewed SQL because Prisma schema does not express them.
ALTER TABLE "users" ADD CONSTRAINT "users_email_normalized_check" CHECK (email = lower(btrim(email)) AND char_length(email) BETWEEN 1 AND 254);
ALTER TABLE "users" ADD CONSTRAINT "users_display_name_check" CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 100);
ALTER TABLE "users" ADD CONSTRAINT "users_role_check" CHECK (role IN ('PARTICIPANT', 'ORGANIZER'));
ALTER TABLE "events" ADD CONSTRAINT "events_title_check" CHECK (char_length(btrim(title)) BETWEEN 1 AND 200);
ALTER TABLE "events" ADD CONSTRAINT "events_location_check" CHECK (char_length(btrim(location)) BETWEEN 1 AND 300);
ALTER TABLE "events" ADD CONSTRAINT "events_capacity_check" CHECK (capacity > 0);
ALTER TABLE "events" ADD CONSTRAINT "events_time_check" CHECK (ends_at > starts_at);
ALTER TABLE "events" ADD CONSTRAINT "events_description_check" CHECK (description IS NULL OR char_length(description) <= 10000);
ALTER TABLE "events" ADD CONSTRAINT "events_publication_check" CHECK (publication_status IN ('PUBLISHED', 'UNPUBLISHED'));
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_status_check" CHECK (status = 'ACTIVE');
CREATE UNIQUE INDEX "registrations_active_pair_unique" ON "registrations" (event_id, participant_id) WHERE status = 'ACTIVE';

COMMIT;
