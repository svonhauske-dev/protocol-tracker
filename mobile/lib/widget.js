// Home-screen widget bridge.
//
// The widget process (targets/OriginWidget) is sandboxed from this app — they
// share data ONLY through the `group.app.origin-protocol` App Group container:
//
//   nextDose    (app → widget)  JSON snapshot of today's next dose.
//   pendingLogs (widget → app)  JSON queue of quick-log taps awaiting reconcile.
//   lastLogged  (widget → app)  marker so the widget can confirm a tap instantly.
//
// In JS-only contexts (web, Expo Go) the native ExtensionStorage module is
// absent and every call no-ops, so this is safe to call anywhere.

import { ExtensionStorage } from '@bacons/apple-targets';
import { fmtTime } from 'shared/lib/time';

const APP_GROUP = 'group.app.origin-protocol';
const WIDGET_NAME = 'OriginWidget';
const NEXT_DOSE_KEY = 'nextDose';
const PENDING_LOGS_KEY = 'pendingLogs';
const LAST_LOGGED_KEY = 'lastLogged';

const storage = new ExtensionStorage(APP_GROUP);

// Pick the "next dose" from today's timed slots. Rules, in order:
//  1. Earliest UPCOMING slot (time > now) that still has an unchecked item.
//  2. Else the earliest already-passed slot with an unchecked item, so a missed-
//     but-pending dose is still surfaced rather than claiming the day is done.
//  3. Else, if items are pending but none resolve to a time (schedule "none",
//     or an anchor day not started yet), show them without a time.
//  4. Else everything is taken → allTakenToday.
//
// Mirrors the app's own nextFixedSlot logic (Today.js) but spans every schedule
// mode and accounts for checked state. `todayKey` stamps the payload so a quick-
// log tap reconciles into the correct day-row even if the app opens later.
export function buildNextDose({ slotDefs, ctx, getSuppsForSlot, isChecked, getSlotTime, todayKey, now = new Date() }) {
  let upcoming = null; // { t, ...entry }
  let overdue = null;  // { t, ...entry }
  let timeless = null; // entry — pending but no resolvable time
  let anyPending = false;

  for (const sd of slotDefs) {
    const supps = getSuppsForSlot(sd.id);
    if (supps.length === 0) continue;
    const pending = supps.filter((s) => !isChecked(sd.id, s.id));
    if (pending.length === 0) continue;
    anyPending = true;
    const entry = {
      label: sd.label,
      slotId: sd.id,
      items: pending.map((s) => s.name),
      suppIds: pending.map((s) => s.id),
    };
    const t = getSlotTime(sd.id, ctx);
    if (!t) {
      if (!timeless) timeless = entry;
      continue;
    }
    entry.t = t;
    if (t > now) {
      if (!upcoming || t < upcoming.t) upcoming = entry;
    } else if (!overdue || t < overdue.t) {
      overdue = entry;
    }
  }

  const pick = upcoming || overdue;
  if (pick) {
    return { slotLabel: pick.label, slotId: pick.slotId, timeLabel: fmtTime(pick.t), items: pick.items, suppIds: pick.suppIds, date: todayKey, allTakenToday: false };
  }
  if (timeless) {
    return { slotLabel: timeless.label, slotId: timeless.slotId, timeLabel: '', items: timeless.items, suppIds: timeless.suppIds, date: todayKey, allTakenToday: false };
  }
  return { slotLabel: '', slotId: '', timeLabel: '', items: [], suppIds: [], date: todayKey, allTakenToday: !anyPending };
}

// Serialize + push to the App Group, then reload the widget. Guarded so a
// missing native module (web/Expo Go) or a write failure never breaks the app.
export function writeNextDose(payload) {
  try {
    storage.set(NEXT_DOSE_KEY, JSON.stringify(payload));
    ExtensionStorage.reloadWidget(WIDGET_NAME);
  } catch {
    // no-op
  }
}

// Drain the quick-log queue the widget's LogDoseIntent has been appending to.
// Returns an array of { date, slot, suppIds, at } (empty on any failure).
export function readPendingLogs() {
  try {
    const raw = storage.get(PENDING_LOGS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Clear the queue + the confirmation marker after a successful reconcile, then
// reload so the widget drops its "✓ Logged" state and shows the fresh snapshot.
export function clearPendingLogs() {
  try {
    storage.remove(PENDING_LOGS_KEY);
    storage.remove(LAST_LOGGED_KEY);
    ExtensionStorage.reloadWidget(WIDGET_NAME);
  } catch {
    // no-op
  }
}
