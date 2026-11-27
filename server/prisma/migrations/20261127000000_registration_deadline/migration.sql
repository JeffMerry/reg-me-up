ALTER TABLE "events"
  ADD COLUMN "registration_deadline" TIMESTAMPTZ(6),
  ADD CONSTRAINT "events_registration_deadline_check"
    CHECK (registration_deadline IS NULL OR registration_deadline <= starts_at);
