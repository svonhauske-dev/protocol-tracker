// Pro / subscription gating — GUARDED wrapper around RevenueCat (StoreKit).
//
// The native SDK (react-native-purchases) rides a build; until it's installed
// this stays a NO-OP (variable require, caught) so the current dev client keeps
// bundling and free-tier behaviour is the default. A __DEV__ override lets us
// exercise BOTH free and Pro states in the Simulator before StoreKit exists.
//
// Products (App Store Connect, to create): monthly $4.99, annual $29.99, both
// with a 14-day free trial. Single entitlement: "pro".
import { Platform } from 'react-native';

// MASTER SWITCH. While false the whole app is open — every gate passes, no
// paywall, no onboarding trial prompt (ProProvider forces isPro = true). Flip to
// true to re-enable the Phase-4 subscription machinery (which is left intact).
export const MONETIZATION_ENABLED = false;

// RevenueCat public SDK key (safe to ship — it's a client key). Set once the
// RevenueCat project exists; until then configure() no-ops.
export const RC_API_KEY_IOS = ''; // e.g. 'appl_xxxxxxxxxxxxxxxxxxxxxxxxx'
export const PRO_ENTITLEMENT = 'pro';

let _mod = null, _loaded = false, _configured = false;

// Variable require so Metro doesn't resolve the (not-yet-installed) package at
// bundle time — it stays a runtime call that throws and is caught.
function mod() {
  if (_loaded) return _mod;
  _loaded = true;
  if (Platform.OS !== 'ios') return (_mod = null);
  try {
    const name = 'react-native-purchases';
    const m = require(name);
    _mod = m.default || m;
  } catch {
    _mod = null; // native SDK not in this build — stay no-op (free tier)
  }
  return _mod;
}

// ── __DEV__ override (Simulator testing only; never in production) ────────────
const DEV_KEY = 'origin.dev.pro';
export function getDevPro() {
  if (!__DEV__) return false;
  try { return global.localStorage.getItem(DEV_KEY) === '1'; } catch { return false; }
}
export function setDevPro(on) {
  if (!__DEV__) return;
  try { global.localStorage.setItem(DEV_KEY, on ? '1' : '0'); } catch { /* ignore */ }
}

// Configure RevenueCat for a user. Safe to call repeatedly; no-ops without the
// SDK or an API key.
export async function configurePro(userId) {
  const m = mod();
  if (!m || !RC_API_KEY_IOS) return false;
  try {
    if (!_configured) { m.configure({ apiKey: RC_API_KEY_IOS, appUserID: userId }); _configured = true; }
    return true;
  } catch { return false; }
}

// Current entitlement status. Returns { isPro, available } — `available` is false
// when the SDK/key isn't present (so callers can fall back to the dev override).
export async function fetchProStatus() {
  const m = mod();
  if (!m || !RC_API_KEY_IOS) return { isPro: false, available: false };
  try {
    const info = await m.getCustomerInfo();
    return { isPro: !!info?.entitlements?.active?.[PRO_ENTITLEMENT], available: true };
  } catch {
    return { isPro: false, available: false };
  }
}

// The available packages (monthly / annual) from the current offering.
export async function getOfferings() {
  const m = mod();
  if (!m || !RC_API_KEY_IOS) return [];
  try {
    const offerings = await m.getOfferings();
    return offerings?.current?.availablePackages || [];
  } catch { return []; }
}

// Purchase a package → returns { isPro } after the transaction, or throws.
export async function purchasePackage(pkg) {
  const m = mod();
  if (!m) throw new Error('purchases-unavailable');
  const { customerInfo } = await m.purchasePackage(pkg);
  return { isPro: !!customerInfo?.entitlements?.active?.[PRO_ENTITLEMENT] };
}

// Restore prior purchases (required by App Store guidelines).
export async function restorePurchases() {
  const m = mod();
  if (!m) return { isPro: false };
  try {
    const info = await m.restorePurchases();
    return { isPro: !!info?.entitlements?.active?.[PRO_ENTITLEMENT] };
  } catch { return { isPro: false }; }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVATION (rides a build — react-native-purchases is native):
//   1. Create a RevenueCat project; set RC_API_KEY_IOS above (public iOS key).
//   2. App Store Connect → Subscriptions: monthly (app.origin-protocol.pro.monthly,
//      $4.99) + annual (…pro.annual, $29.99), each with a 14-day free trial intro
//      offer. Attach both to a RevenueCat "pro" entitlement + a "default" offering.
//   3. npm i react-native-purchases  →  add its config plugin OR (bare workflow —
//      committed ios/) configure StoreKit capability in the native project. Then
//      eas build. See [[mobile-bare-workflow]].
//   4. Sandbox-test purchase + restore in TestFlight.
// ─────────────────────────────────────────────────────────────────────────────
