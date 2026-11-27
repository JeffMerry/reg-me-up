BEGIN;

ALTER TABLE "users" DROP CONSTRAINT "users_role_check";
ALTER TABLE "users" ADD CONSTRAINT "users_role_check"
  CHECK (role IN ('PARTICIPANT', 'ORGANIZER', 'INSTRUCTOR'));

CREATE TABLE "instructor_assignments" (
  "id" UUID NOT NULL,
  "event_id" UUID NOT NULL,
  "instructor_id" UUID NOT NULL,
  "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ended_at" TIMESTAMPTZ(6),
  CONSTRAINT "instructor_assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "instructor_assignments_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "instructor_assignments_instructor_id_fkey"
    FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "instructor_assignments_time_check"
    CHECK ("ended_at" IS NULL OR "ended_at" >= "assigned_at")
);

CREATE UNIQUE INDEX "instructor_assignments_one_current_per_event"
  ON "instructor_assignments"("event_id") WHERE "ended_at" IS NULL;
CREATE INDEX "instructor_assignments_instructor_ended_event_idx"
  ON "instructor_assignments"("instructor_id", "ended_at", "event_id");

COMMIT;
