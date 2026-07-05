-- ============================================================
-- ORIGIN EXPO PUSH TOKENS MIGRATION (mobile notifications)
--
-- Adds:
--   • expo_push_tokens table — one row per (user, device) holding an
--     Expo push token (ExponentPushToken[...]). This is the native-app
--     analog of push_subscriptions (which holds browser Web Push endpoints).
--     The iOS app can't receive Web Push, so process_notifications_queue
--     sends to these tokens via the Expo Push API (→ APNs) in addition to
--     web-push, reusing the same notifications_queue + recompute brain.
--   • RLS: a user can only read/write their own tokens.
--
-- Why a separate table (not columns on push_subscriptions)?
--   Different shape — web push is (endpoint, p256dh, auth); Expo is a single
--   opaque token string. A separate table keeps the web path untouched.
--
-- Safe to re-run: every statement idempotent. Transactional.
--
-- Run via:
--   supabase db query --linked -f supabase/expo-push-tokens-migration.sql
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS expo_push_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token       text NOT NULL,
  platform    text NOT NULL DEFAULT 'ios',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- A given Expo token is unique to one device; upsert on it so re-registering
-- the same device updates rather than duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS expo_push_tokens_token_unique
  ON expo_push_tokens (token);

CREATE INDEX IF NOT EXISTS expo_push_tokens_user_idx
  ON expo_push_tokens (user_id);

ALTER TABLE expo_push_tokens ENABLE ROW LEVEL SECURITY;

-- A user can only see/manage their own tokens. The service-role edge function
-- (process_notifications_queue) bypasses RLS to read every user's tokens.
DROP POLICY IF EXISTS user_owns_expo_tokens ON expo_push_tokens;
CREATE POLICY user_owns_expo_tokens
  ON expo_push_tokens FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Auto-bump updated_at on UPDATE.
CREATE OR REPLACE FUNCTION expo_push_tokens_touch()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS expo_push_tokens_touch_trg ON expo_push_tokens;
CREATE TRIGGER expo_push_tokens_touch_trg
  BEFORE UPDATE ON expo_push_tokens
  FOR EACH ROW EXECUTE FUNCTION expo_push_tokens_touch();

COMMIT;
