// Apple Health (HealthKit) integration — GUARDED, written for the v14 API of
// @kingstinct/react-native-healthkit (Nitro).
//
// The native module + HealthKit capability + Info.plist strings are committed,
// but they only take effect once a native build links HealthKit. Until then
// (current dev client, Simulator, any pre-Health build) every call here is
// lazy-loaded + try/caught and returns a null/false NO-OP instead of crashing.
// When the Health build ships, these light up with zero call-site changes.
//
// Scope (privacy-first): READ sleep + the two recovery signals every wearable
// (Apple Watch, and Oura/Whoop via Health sync) writes — HRV (SDNN) and resting
// heart rate. No WRITE yet (read-first until verified on a real device). We
// never read without an explicit opt-in (the Settings toggle), and Health data
// never leaves the device.
import { Platform } from 'react-native';

let _mod = null;      // resolved native module (or null)
let _loaded = false;  // have we attempted the require yet

// Lazy, guarded resolve. Uses a VARIABLE require (not a string literal) so Metro
// does NOT try to resolve the package at bundle time — it stays a runtime call
// that throws (and is caught) in any build where the native dep isn't linked.
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

// Resolve a named function off the module (v14 exposes both named exports and a
// default HealthKit object).
function fn(name) {
  const m = mod();
  if (!m) return null;
  const f = m[name] ?? m.default?.[name];
  return typeof f === 'function' ? f : null;
}

// Is HealthKit usable in THIS build on THIS device? (false in Simulator + any
// build without the native module).
export async function isHealthSupported() {
  const avail = fn('isHealthDataAvailable') || fn('isHealthDataAvailableAsync');
  if (!avail) return false;
  try {
    return !!(await avail());
  } catch {
    return false;
  }
}

// The types we ask permission to READ. Kept minimal + relevant.
const READ_TYPES = [
  'HKCategoryTypeIdentifierSleepAnalysis',
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  'HKQuantityTypeIdentifierRestingHeartRate',
];

// Request Health permissions (v14: a single { toShare, toRead } arg). iOS never
// reveals whether the user granted READ access (privacy), so a true here means
// "asked", not "granted".
export async function requestHealthPermissions() {
  const req = fn('requestAuthorization');
  if (!req) return false;
  try {
    const res = await req({ toShare: [], toRead: READ_TYPES });
    return res !== false; // v14 returns a boolean; undefined → treat as asked
  } catch {
    return false;
  }
}

// v14 query filter: { filter: { date: { startDate, endDate } }, limit, ascending }.
function windowFilter(hoursBack, extra = {}) {
  const now = new Date();
  const startDate = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);
  return { filter: { date: { startDate, endDate: now } }, ...extra };
}

// Read last night's sleep in hours (sum of "asleep" segments over the last day).
// Sleep-analysis values: 0 inBed · 1 asleepUnspecified · 2 awake · 3 core ·
// 4 deep · 5 REM — count 1 and 3–5 as asleep. Returns null if unavailable.
export async function readSleepHours() {
  const query = fn('queryCategorySamples');
  if (!query) return null;
  try {
    const samples = await query('HKCategoryTypeIdentifierSleepAnalysis', windowFilter(24, { limit: 1000, ascending: false }));
    if (!Array.isArray(samples) || !samples.length) return null;
    let ms = 0;
    for (const s of samples) {
      const v = s.value == null ? 1 : Number(s.value);
      const asleep = v === 1 || v >= 3;
      if (asleep && s.startDate && s.endDate) ms += new Date(s.endDate) - new Date(s.startDate);
    }
    return ms > 0 ? Math.round((ms / 3_600_000) * 10) / 10 : null;
  } catch {
    return null;
  }
}

// Most-recent value for a quantity type (recovery metrics are written ~once/
// night). v14: getMostRecentQuantitySample(identifier) → sample with .quantity.
async function latestQuantity(typeId) {
  const recent = fn('getMostRecentQuantitySample');
  if (recent) {
    try {
      const s = await recent(typeId);
      const v = s?.quantity;
      if (typeof v === 'number') return v;
    } catch {
      // fall through to a sample query
    }
  }
  const query = fn('queryQuantitySamples');
  if (!query) return null;
  try {
    const samples = await query(typeId, windowFilter(48, { limit: 1, ascending: false }));
    if (!Array.isArray(samples) || !samples.length) return null;
    const v = samples[0]?.quantity;
    return typeof v === 'number' ? v : null;
  } catch {
    return null;
  }
}

// Resting heart rate (bpm) and HRV (SDNN, ms) — the recovery signals Oura/Whoop
// write into Health, so we get them without a direct integration.
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
// ACTIVATION STATUS — native config is DONE (committed), only a build remains:
//   ✓ deps: @kingstinct/react-native-healthkit + react-native-nitro-modules
//   ✓ ios/Origin.entitlements: com.apple.developer.healthkit
//   ✓ ios/Origin/Info.plist: NSHealth{Share,Update}UsageDescription
//   ✓ App ID HealthKit capability enabled in the Apple Developer portal
//   □ EAS build (autolinks the pod) → verify reads on a REAL device
//     (HealthKit is unavailable in the iOS Simulator).
//   □ then wire readHealthSnapshot() into the check-in / trends / report.
// ─────────────────────────────────────────────────────────────────────────────
