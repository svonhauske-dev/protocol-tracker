-- ============================================================
-- PRO GRANT — comp free Pro without StoreKit
--
-- A single grant marker on the profile. When non-null, ProProvider treats the
-- user as Pro (alongside the RevenueCat entitlement + the __DEV__ override), so
-- comped users get full access with no purchase. Additive + idempotent.
--
-- Grant / revoke by user id (App Store Connect / RevenueCat NOT required):
--   update user_profiles set pro_granted_at = now()  where id = '<uuid>';  -- grant
--   update user_profiles set pro_granted_at = null    where id = '<uuid>';  -- revoke
--
-- Granted at launch (Jul 6, 2026): Sofia, Tulum (OVH), Bego, App Review (so
-- Apple reviewers can exercise Pro features behind the paywall).
--
-- Run: supabase db query --linked -f supabase/pro-grant-migration.sql
-- ============================================================

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS pro_granted_at timestamptz;
