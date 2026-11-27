-- One atomic ALTER; preserve existing rows, capacity rules and migration history.
ALTER TABLE "events"
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0,
  ADD CONSTRAINT "events_version_check" CHECK ("version" >= 0);
