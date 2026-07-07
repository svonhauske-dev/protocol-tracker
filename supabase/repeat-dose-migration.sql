-- Interval dosing: an optional second dose taken N hours after the first dose.
-- Nullable, additive; only meaningful for a slotted supp (its first dose is the
-- cascade slot; the second fires at first-dose-time + repeat_after_hours).
ALTER TABLE public.supplements ADD COLUMN IF NOT EXISTS repeat_after_hours numeric;
