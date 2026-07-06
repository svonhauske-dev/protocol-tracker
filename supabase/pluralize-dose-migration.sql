-- ============================================================
-- ORIGIN DOSE PLURALIZATION BACKFILL
--
-- Existing items saved before the pluralization fix show a singular form when
-- the amount is >1 (e.g. "3 capsule"). This bulk-fixes them to "3 capsules"
-- so users don't have to re-save each item one by one.
--
-- SAFE + PRECISE: only touches doses that are EXACTLY "<number> <countable-form>"
-- with the number > 1. It therefore never touches:
--   • strength doses ("50 mcg", "5 mg", "1000 IU")  — form not in the list
--   • mL / measures                                  — excluded
--   • amount = 1 ("1 capsule")                       — number filter
--   • already-plural ("3 capsules")                  — "capsule$" ≠ "capsules"
--   • multi-part legacy free-text ("2 Caps · Thorne")— exact-match anchors
--
-- Idempotent (re-running finds nothing to change). Additive (data only).
--
-- Run via:
--   supabase db query --linked -f supabase/pluralize-dose-migration.sql
-- (or paste into the Supabase Dashboard SQL editor)
-- ============================================================

BEGIN;

-- 1) Singular → plural when amount > 1:  "3 capsule" → "3 capsules"
UPDATE public.supplements
SET dose = regexp_replace(
      dose,
      '^([0-9]+)\s+(pill|tablet|capsule|softgel|caplet|troche|lozenge|gummy|drop|spray|scoop|sachet|patch|injection)$',
      '\1 \2s'
    )
WHERE dose ~ '^[0-9]+\s+(pill|tablet|capsule|softgel|caplet|troche|lozenge|gummy|drop|spray|scoop|sachet|patch|injection)$'
  AND (regexp_match(dose, '^([0-9]+)'))[1]::int > 1;

-- 2) Collapse the earlier double-plural bug: "20 dropss" → "20 drops". Scoped to
--    known plural forms + one extra trailing 's', so it can't mangle real words.
UPDATE public.supplements
SET dose = regexp_replace(
      dose,
      '^([0-9]+\s+)(pills|tablets|capsules|softgels|caplets|troches|lozenges|gummies|drops|sprays|scoops|sachets|patches|injections)s$',
      '\1\2'
    )
WHERE dose ~ '^[0-9]+\s+(pills|tablets|capsules|softgels|caplets|troches|lozenges|gummies|drops|sprays|scoops|sachets|patches|injections)s$';

COMMIT;
