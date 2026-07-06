-- ============================================================
-- ORIGIN LOW-SUPPLY NOTIFY FLAG (refill Phase 2)
--
-- Adds one column so the server sends the "running low — reorder" push exactly
-- ONCE per fill cycle instead of every time the queue recomputes:
--
--   low_supply_notified_at  timestamptz  — when we last sent a low-supply push
--
-- Dedup rule (in recompute_user_logic.ts): notify only when the item is low AND
-- low_supply_notified_at < stock_filled_on. A refill moves stock_filled_on to
-- today, which makes the old flag stale → the nudge re-arms automatically. No
-- explicit reset needed anywhere.
--
-- Additive + idempotent.
--
-- Run via:
--   supabase db query --linked -f supabase/low-supply-notified-migration.sql
-- ============================================================

BEGIN;

ALTER TABLE public.supplements
  ADD COLUMN IF NOT EXISTS low_supply_notified_at timestamptz;

COMMIT;
