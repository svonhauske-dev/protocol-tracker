-- ============================================================
-- ORIGIN SUPPLY / REFILL TRACKING MIGRATION (Phase 1)
--
-- Adds optional per-supplement supply tracking so the app can show
-- "N left · ≈X days" and (Phase 2) push a low-supply reorder reminder.
--
-- Columns (all nullable — supply tracking is opt-in per item):
--   units_per_dose   how many units one logged dose consumes (e.g. 2 pills)
--   stock_count      units in the bottle as of stock_filled_on
--   stock_filled_on  the date the count was last set / refilled (the anchor)
--   stock_unit       label for the unit ('pills' | 'servings' | 'doses' | …)
--   low_supply_days  warn when fewer than this many days of supply remain
--
-- "Remaining" is DERIVED, never stored: it's computed from daily_logs
--   remaining = stock_count − units_per_dose × (doses logged since stock_filled_on)
-- so un-checking / editing past days self-heal. Nothing here stores a
-- mutable counter.
--
-- Additive + idempotent. Safe to re-run.
--
-- Run via:
--   supabase db query --linked -f supabase/supply-tracking-migration.sql
-- ============================================================

BEGIN;

ALTER TABLE public.supplements ADD COLUMN IF NOT EXISTS units_per_dose  numeric;
ALTER TABLE public.supplements ADD COLUMN IF NOT EXISTS stock_count     numeric;
ALTER TABLE public.supplements ADD COLUMN IF NOT EXISTS stock_filled_on date;
ALTER TABLE public.supplements ADD COLUMN IF NOT EXISTS stock_unit      text NOT NULL DEFAULT 'pills';
ALTER TABLE public.supplements ADD COLUMN IF NOT EXISTS low_supply_days integer NOT NULL DEFAULT 7;

COMMIT;
