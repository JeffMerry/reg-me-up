-- Run only after migrations, and only against the dedicated Docker test database.
DO $$
BEGIN
  IF current_database() <> 'regmeup_test' THEN
    RAISE EXCEPTION 'Test guard may only be installed in regmeup_test';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.regmeup_test_guard (
  marker text PRIMARY KEY CHECK (marker = 'regmeup-isolated-test')
);
INSERT INTO public.regmeup_test_guard (marker)
VALUES ('regmeup-isolated-test') ON CONFLICT (marker) DO NOTHING;
