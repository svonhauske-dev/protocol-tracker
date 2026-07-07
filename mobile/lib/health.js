// Apple Health (HealthKit) integration — GUARDED SCAFFOLD.
//
// The native HealthKit module is NOT bundled yet (it rides a dedicated build —
// see the activation notes at the bottom of this file). Everything here is
// lazy-loaded + try/caught so the current dev client and any build that
// predates the native dep stay a NO-OP instead of crashing. When the module is
// present, these light up with zero call-site changes.
//
// Scope (timing/outcomes credibility, privacy-first):
//   READ   sleep (hours), steps, active energy — context for the outcomes loop
//   WRITE  reserved (e.g. mindful/State-of-Mind from the daily check-in) — off
//          until we've verified read on a real device.
//
// We NEVER read Health data without an explicit user opt-in (the Settings
// toggle), and we never send Health data off-device.
import { Platform } from 'react-native';

let _mod = null;      // resolved native module (or null)
let _loaded = false;  // have we attempted the require yet

// Lazy, guarded resolve. Uses a VARIABLE require (not a string literal) so Metro
// does NOT try to resolve the package at bundle time — it stays a runtime call
// that throws (and is caught) in any build where the native dep isn't present.
// This is what keeps the current dev client bundling before the Health build.
function mod() {
  if (_loaded) return _mod;
  _loaded = true;
  if (Platform.OS !== 'ios') return (_mod = null);
  try {
    const name = '@kingstinct/react-native-healthkit';
    _mod = require(name);
  } catch {
    _mod = null; // native module not in this build — stay no-op
  }
  return _mod;
}

// Is HealthKit usable in THIS build on THIS device?
export async function isHealthSupported() {
  const m = mod();
  if (!m) return false;
  try {
    const available = m.isHealthDataAvailable ?? m.default?.isHealthDataAvailable;
    return typeof available === 'function' ? !!(await available()) : true;
  } catch {
    return false;
  }
}

// The types we ask permission to READ. Kept minimal + relevant.
const READ_TYPES = [
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKCategoryTypeIdentifierSleepAnalysis',
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  'HKQuantityTypeIdentifierRestingHeartRate',
];
const WRITE_TYPES = []; // none yet — read-first until verified on device

// Request Health permissions. Returns true if the sheet was presented without
// error. iOS never reveals whether the user granted read access (privacy), so a
// true here means "asked", not "granted".
export async function requestHealthPermissions() {
  const m = mod();
  if (!m) return false;
  try {
    const req = m.requestAuthorization ?? m.default?.requestAuthorization;
    if (typeof req !== 'function') return false;
    await req(WRITE_TYPES, READ_TYPES);
    return true;
  } catch {
    return false;
  }
}

// Read last night's sleep in hours (sum of asleep samples for the window).
// Returns null if unavailable — callers must treat null as "no data".
export async function readSleepHours() {
  const m = mod();
  if (!m) return null;
  try {
    const query = m.queryCategorySamples ?? m.default?.queryCategorySamples;
    if (typeof query !== 'function') return null;
    const now = Date.now();
    const from = new Date(now - 24 * 60 * 60 * 1000);
    const samples = await query('HKCategoryTypeIdentifierSleepAnalysis', { from, to: new Date(now) });
    if (!Array.isArray(samples) || !samples.length) return null;
    // Sum "asleep" intervals (value/category ids vary by lib version — be lax).
    let ms = 0;
    for (const s of samples) {
      const asleep = s.value == null ? true : Number(s.value) >= 1;
      if (asleep && s.startDate && s.endDate) ms += new Date(s.endDate) - new Date(s.startDate);
    }
    return ms > 0 ? Math.round((ms / 3_600_000) * 10) / 10 : null;
  } catch {
    return null;
  }
}

// Read today's step count. Returns a number or null.
export async function readStepsToday() {
  const m = mod();
  if (!m) return null;
  try {
    const sum = m.queryStatisticsForQuantity ?? m.default?.queryStatisticsForQuantity;
    if (typeof sum !== 'function') return null;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const res = await sum('HKQuantityTypeIdentifierStepCount', ['cumulativeSum'], { from: start, to: new Date() });
    const val = res?.sumQuantity?.quantity ?? res?.sumQuantity ?? res?.value;
    return typeof val === 'number' ? Math.round(val) : null;
  } catch {
    return null;
  }
}

// Most-recent value for a quantity type over the last ~2 days (recovery metrics
// are written once/night). Lax across lib versions: prefer a dedicated
// "most recent" call, else take the latest of a sample query.
async function latestQuantity(typeId) {
  const m = mod();
  if (!m) return null;
  try {
    const recent = m.getMostRecentQuantitySample ?? m.default?.getMostRecentQuantitySample;
    if (typeof recent === 'function') {
      const s = await recent(typeId);
      const v = s?.quantity ?? s?.value;
      return typeof v === 'number' ? v : null;
    }
    const query = m.queryQuantitySamples ?? m.default?.queryQuantitySamples;
    if (typeof query !== 'function') return null;
    const now = Date.now();
    const samples = await query(typeId, { from: new Date(now - 2 * 24 * 60 * 60 * 1000), to: new Date(now) });
    if (!Array.isArray(samples) || !samples.length) return null;
    const last = samples[samples.length - 1];
    const v = last?.quantity ?? last?.value;
    return typeof v === 'number' ? v : null;
  } catch {
    return null;
  }
}

// Resting heart rate (bpm) and HRV (SDNN, ms) — the recovery signals. These are
// what Oura (as HRV/resting HR) and Whoop write into Health, so we get them
// without a direct integration. Returns a number or null.
export async function readRestingHeartRate() {
  const v = await latestQuantity('HKQuantityTypeIdentifierRestingHeartRate');
  return v == null ? null : Math.round(v);
}
export async function readHrv() {
  const v = await latestQuantity('HKQuantityTypeIdentifierHeartRateVariabilitySDNN');
  return v == null ? null : Math.round(v);
}

// One call for the daily objective layer — sleep + recovery. All fields are
// null-safe; callers render only what's present. Never leaves the device.
export async function readHealthSnapshot() {
  const [sleepHours, restingHr, hrv] = await Promise.all([
    readSleepHours(),
    readRestingHeartRate(),
    readHrv(),
  ]);
  return { sleepHours, restingHr, hrv };
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVATION (rides a dedicated native build — cannot be verified in Simulator):
//
//   NOTE: this project has a COMMITTED, git-tracked ios/ directory (bare /
//   prebuild workflow — EAS builds from the native project, not from app.json's
//   managed config). So the Kingstinct CONFIG PLUGIN in app.json will NOT apply
//   on its own. Configure the native project directly (or `expo prebuild --clean`,
//   which regenerates ios/ and would drop any manual native customizations —
//   diff carefully first).
//
//   1. npm i @kingstinct/react-native-healthkit react-native-nitro-modules
//      then `npx pod-install` (or `cd ios && pod install`).
//   2. In the native iOS project (Xcode / ios/):
//        • Signing & Capabilities → add the HealthKit capability
//          (adds com.apple.developer.healthkit to the .entitlements).
//        • Info.plist → add:
//            NSHealthShareUsageDescription  = "Origin reads sleep and activity
//              to show how your protocol tracks against how you feel."
//            NSHealthUpdateUsageDescription = "Origin can save your daily
//              check-in to Health."
//      (The privacy manifest already declares NSPrivacyCollectedDataTypeHealth.)
//   3. eas build (a native rebuild) → verify read on a real device (HealthKit is
//      unavailable on the iOS Simulator).
//   4. Then wire readSleepHours() to prefill the check-in's sleep rating, etc.
// ─────────────────────────────────────────────────────────────────────────────
