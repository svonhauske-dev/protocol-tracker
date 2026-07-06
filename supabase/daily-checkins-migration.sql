-- ============================================================
-- ORIGIN DAILY CHECK-INS (Phase 2 — the outcomes / retention loop)
--
-- A once-a-day "how do you feel" check-in that turns Origin from an input-only
-- tracker (did you take it) into an outcomes tracker (is it working) — the
-- retention engine + a Pro anchor. One row per (user, day), upserted.
--
--   energy / mood / sleep  smallint 1–5 (nullable — skip any)
--   note                   free-text (symptoms, side-effects, context)
--
-- Additive + idempotent. RLS: a user only sees their own check-ins.
--
-- Run via:
--   supabase db query --linked -f supabase/daily-checkins-migration.sql
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date    date NOT NULL,
  energy      smallint CHECK (energy BETWEEN 1 AND 5),
  mood        smallint CHECK (mood   BETWEEN 1 AND 5),
  sleep       smallint CHECK (sleep  BETWEEN 1 AND 5),
  note        text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- One check-in per user per day → the REST upsert (on_conflict) target.
CREATE UNIQUE INDEX IF NOT EXISTS daily_checkins_user_date_unique
  ON public.daily_checkins (user_id, log_date);

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_owns_checkins ON public.daily_checkins;
CREATE POLICY user_owns_checkins
  ON public.daily_checkins FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION daily_checkins_touch()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS daily_checkins_touch_trg ON public.daily_checkins;
CREATE TRIGGER daily_checkins_touch_trg
  BEFORE UPDATE ON public.daily_checkins
  FOR EACH ROW EXECUTE FUNCTION daily_checkins_touch();

COMMIT;
