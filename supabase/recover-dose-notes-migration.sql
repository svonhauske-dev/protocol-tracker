-- ============================================================
-- RECOVER dose-embedded strength → notes
--
-- Legacy free-text doses folded the strength/detail after a "|" pipe, e.g.
--   dose = "1 cápsula | 500mg Ashwaganda + 500mg Melena de León"
-- The structured-dose edit path only reads amount+form ("1 cápsula") and drops
-- everything after "|", so re-saving an item silently wiped that detail. This
-- moves the post-"|" text into `notes` (where it belongs and survives) and trims
-- `dose` to just amount+form. Display is unchanged (list shows "dose · notes").
--
-- Data-PRESERVING: nothing is deleted; text is moved between columns. Scoped to
-- rows that actually have the pattern AND an empty notes field (won't clobber
-- real notes). Verified affected: 11 rows / 1 user at migration time.
--
-- Run:  supabase db query --linked -f supabase/recover-dose-notes-migration.sql
-- ============================================================

BEGIN;

UPDATE public.supplements
SET
  notes = trim(substring(dose from position('|' in dose) + 1)),
  dose  = trim(substring(dose from 1 for position('|' in dose) - 1)),
  updated_at = now()
WHERE position('|' in dose) > 0
  AND coalesce(nullif(trim(notes), ''), '') = ''
  AND deleted_at IS NULL;

COMMIT;
