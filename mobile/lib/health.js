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
import { dateKey } from 'shared/lib/time';

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
// Merge overlapping [startMs, endMs] intervals → total HOURS of their union.
// Critical: a naive SUM double/triple-counts because several devices (Apple
// Watch + Oura + Whoop) each write the same night, and "asleepUnspecified" often
// overlaps the core/deep/REM stage samples — so a real ~7.6h night sums to ~23h.
function unionHours(intervals) {
  if (!intervals.length) return 0;
  intervals.sort((a, b) => a[0] - b[0]);
  let ms = 0, curS = intervals[0][0], curE = intervals[0][1];
  for (let i = 1; i < intervals.length; i++) {
    const [s, e] = intervals[i];
    if (s <= curE) { if (e > curE) curE = e; }
    else { ms += curE - curS; curS = s; curE = e; }
  }
  ms += curE - curS;
  return ms / 3_600_000;
}

// [startMs, endMs] for each "asleep" segment (values 1, 3–5).
function asleepIntervals(samples) {
  const iv = [];
  for (const s of samples || []) {
    const v = s.value == null ? 1 : Number(s.value);
    if ((v === 1 || v >= 3) && s.startDate && s.endDate) {
      const st = +new Date(s.startDate), en = +new Date(s.endDate);
      if (en > st) iv.push([st, en]);
    }
  }
  return iv;
}

export async function readSleepHours() {
  const query = fn('queryCategorySamples');
  if (!query) return null;
  try {
    const samples = await query('HKCategoryTypeIdentifierSleepAnalysis', windowFilter(24, { limit: 2000, ascending: true }));
    const h = unionHours(asleepIntervals(samples));
    return h > 0 ? Math.round(h * 10) / 10 : null;
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

// Per-day history over the last `days` for the objective layer, keyed by the
// app's dateKey so it aligns 1:1 with the Trends date axis. Sleep is summed per
// wake-day (the date a segment ENDS); HRV / resting HR are averaged per day.
// Returns { sleep:{key:hours}, hrv:{key:ms}, restingHr:{key:bpm} } — empty maps
// when unavailable. Uses only the verified sample queries (not the stats API).
export async function readHealthSeries(days = 30) {
  const out = { sleep: {}, hrv: {}, restingHr: {} };
  const now = new Date();
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const filter = { filter: { date: { startDate: start, endDate: now } }, limit: 5000, ascending: true };

  // Sleep — group asleep segments by wake-day, then UNION per day (not sum) so
  // multi-source / stage-overlap nights don't multiply (see unionHours).
  const catQ = fn('queryCategorySamples');
  if (catQ) {
    try {
      const s = await catQ('HKCategoryTypeIdentifierSleepAnalysis', filter);
      if (Array.isArray(s)) {
        const byDay = {}; // wake-day key -> [[startMs,endMs], …]
        for (const seg of s) {
          const v = seg.value == null ? 1 : Number(seg.value);
          if ((v === 1 || v >= 3) && seg.startDate && seg.endDate) {
            const st = +new Date(seg.startDate), en = +new Date(seg.endDate);
            if (en > st) (byDay[dateKey(new Date(seg.endDate))] ||= []).push([st, en]);
          }
        }
        for (const k in byDay) out.sleep[k] = Math.round(unionHours(byDay[k]) * 10) / 10;
      }
    } catch { /* leave empty */ }
  }

  // HRV + resting HR — daily average of samples.
  const quantQ = fn('queryQuantitySamples');
  const avgByDay = async (typeId) => {
    const acc = {}; // key -> [sum, count]
    if (!quantQ) return {};
    try {
      const rows = await quantQ(typeId, filter);
      if (Array.isArray(rows)) {
        for (const r of rows) {
          if (typeof r.quantity === 'number' && r.startDate) {
            const k = dateKey(new Date(r.startDate));
            (acc[k] ||= [0, 0]);
            acc[k][0] += r.quantity; acc[k][1] += 1;
          }
        }
      }
    } catch { /* leave empty */ }
    const m = {};
    for (const k in acc) m[k] = Math.round(acc[k][0] / acc[k][1]);
    return m;
  };
  out.hrv = await avgByDay('HKQuantityTypeIdentifierHeartRateVariabilitySDNN');
  out.restingHr = await avgByDay('HKQuantityTypeIdentifierRestingHeartRate');
  return out;
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
