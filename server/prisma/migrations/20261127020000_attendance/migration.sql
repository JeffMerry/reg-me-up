BEGIN;
CREATE TABLE attendance (
  id uuid PRIMARY KEY,
  registration_id uuid NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE RESTRICT,
  checked_in_at timestamptz NOT NULL,
  checked_in_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT
);
COMMIT;
