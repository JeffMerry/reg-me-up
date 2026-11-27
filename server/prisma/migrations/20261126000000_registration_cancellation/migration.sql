BEGIN;

ALTER TABLE "registrations" ADD COLUMN "cancelled_at" TIMESTAMPTZ(6);
ALTER TABLE "registrations" DROP CONSTRAINT "registrations_status_check";
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_status_check"
  CHECK (status IN ('ACTIVE', 'CANCELLED'));
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_cancellation_check"
  CHECK ((status = 'ACTIVE' AND cancelled_at IS NULL)
      OR (status = 'CANCELLED' AND cancelled_at IS NOT NULL));

-- Preserve the ACTIVE-only unique index and all existing IDs/history.
COMMIT;
