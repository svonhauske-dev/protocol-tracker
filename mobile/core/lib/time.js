const pad = (n) => String(n).padStart(2, "0");

export const fmtTime    = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const addMins    = (d, m) => new Date(d.getTime() + m * 60000);
export const parseHHMM  = (s) => { const [h, m] = s.split(":"); const d = new Date(); d.setHours(+h, +m, 0, 0); return d; };
export const dateKey    = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const startOfDay = (d) => { const r = new Date(d); r.setHours(0, 0, 0, 0); return r; };
// "Jun 15" — the app's standard short date. Single source so the format can't
// drift across the ~5 screens that show it.
export const shortDate  = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const TODAY = startOfDay(new Date());

function convertToDays(value, unit) {
  if (unit === "days")   return value;
  if (unit === "weeks")  return value * 7;
  if (unit === "months") return value * 30;
  return 0;
}

const parseLocalDate = (s) => { const [y, m, d] = s.split("-").map(Number); return startOfDay(new Date(y, m - 1, d)); };

export function isSupplementActiveOn(supp, date) {
  const checkDate = startOfDay(date);

  // Don't show a supplement on days before it was added. created_at is the implicit
  // start date for indefinite supps; explicit starts_at takes priority for scheduled/cycled.
  if (supp.created_at) {
    const createdLocal = startOfDay(new Date(supp.created_at));
    if (checkDate < createdLocal) return false;
  }

  // Soft-deleted supps stop being expected from the deletion date forward.
  // Defensive check — `dbGetSupps` already filters `deleted_at IS NULL`, but if
  // a deleted row leaks through any other read path, this keeps the math clean.
  if (supp.deleted_at) {
    const deletedLocal = startOfDay(new Date(supp.deleted_at));
    if (checkDate >= deletedLocal) return false;
  }

  // Pause windows. A supp is not expected on days it was paused. Each interval is
  // [from, to) in local time; `to: null` means still paused (open-ended, covers
  // today + future). This is what keeps a paused-then-resumed supp's history
  // honest: pre-pause days still show, the paused window hides, resume shows
  // again. Pausing/resuming records the dates (App.jsx togglePause/resumeSupp);
  // without that history this check is a no-op (empty array).
  if (Array.isArray(supp.pause_intervals)) {
    for (const iv of supp.pause_intervals) {
      if (!iv || !iv.from) continue;
      const from = parseLocalDate(iv.from);
      if (checkDate < from) continue;
      if (iv.to == null) return false;           // open interval: paused from `from` onward
      if (checkDate < parseLocalDate(iv.to)) return false;  // within [from, to)
    }
  }

  if (!supp.treatment_mode || supp.treatment_mode === "indefinite") return true;

  const startsAt  = supp.starts_at ? parseLocalDate(supp.starts_at) : null;
  const endsAt    = supp.ends_at   ? parseLocalDate(supp.ends_at)   : null;

  if (startsAt && checkDate < startsAt) return false;
  if (endsAt   && checkDate >= endsAt)  return false;

  if (supp.treatment_mode === "scheduled") return true;

  if (supp.treatment_mode === "cycled") {
    if (!startsAt || !supp.cycle_on_value || !supp.cycle_off_value) return false;
    const daysSinceStart  = Math.floor((checkDate - startsAt) / (1000 * 60 * 60 * 24));
    const onDays          = convertToDays(supp.cycle_on_value,  supp.cycle_on_unit);
    const offDays         = convertToDays(supp.cycle_off_value, supp.cycle_off_unit);
    const cycleDays       = onDays + offDays;
    if (cycleDays === 0) return false;
    return (daysSinceStart % cycleDays) < onDays;
  }

  return true;
}

// ── Effective-dated schedule (slots/days) ────────────────────────────────────
// Like pause_intervals, `slot_history` records dated config versions
// [{ from: 'YYYY-MM-DD', slots, days }] so editing a supp's slots/days applies
// GOING FORWARD and never rewrites past days. Empty history → falls back to the
// supp's current slots/days (back-compat for every existing supplement).
export function scheduleOn(supp, date) {
  const cur = { slots: supp.slots || [], days: supp.days || [] };
  const hist = Array.isArray(supp.slot_history) ? supp.slot_history : [];
  if (hist.length === 0) return cur;
  const dk = dateKey(startOfDay(date));
  let chosen = null, earliest = null;
  for (const h of hist) {
    if (!h || !h.from) continue;
    if (!earliest || h.from < earliest.from) earliest = h;
    if (h.from <= dk && (!chosen || h.from > chosen.from)) chosen = h;
  }
  const pick = chosen || earliest;
  if (!pick) return cur;
  return {
    slots: Array.isArray(pick.slots) ? pick.slots : cur.slots,
    days: Array.isArray(pick.days) ? pick.days : cur.days,
  };
}

// Append a dated schedule version when slots/days change. Seeds the PRIOR config
// (effective from creation) the first time so past days resolve to the OLD
// schedule, not the new one. `todayStr`/`createdStr` are YYYY-MM-DD keys.
export function withScheduleChange(supp, newSlots, newDays, todayStr, createdStr) {
  let hist = Array.isArray(supp.slot_history) ? [...supp.slot_history] : [];
  if (hist.length === 0) {
    hist.push({ from: createdStr || '1970-01-01', slots: supp.slots || [], days: supp.days || [] });
  }
  hist = hist.filter((h) => h && h.from !== todayStr);
  hist.push({ from: todayStr, slots: newSlots || [], days: newDays || [] });
  hist.sort((a, b) => (a.from < b.from ? -1 : 1));
  return hist;
}

export function isActiveSupp(supp) {
  return supp.status === 'active' || (!supp.status && !supp.paused);
}

export function isPausedSupp(supp) {
  return supp.status === 'paused' || (!supp.status && supp.paused === true);
}

// "Stopped" = discontinued/archived (anything that's neither active nor paused).
// Stopped supps drop out of day views and adherence entirely. Paused supps do
// NOT — they flow through and are masked per-day by `pause_intervals` instead,
// so their pre-pause history stays visible. Use this (not `isActiveSupp`) as the
// gate for "should this supp be considered on a given day".
export function isStoppedSupp(supp) {
  return !isActiveSupp(supp) && !isPausedSupp(supp);
}

// Pure helpers for maintaining the pause_intervals history. `dateStr` is a local
// YYYY-MM-DD key (use dateKey). withPauseStarted opens an interval (no-op if one
// is already open); withPauseEnded closes the open interval at `dateStr`.
export function withPauseStarted(supp, dateStr) {
  const intervals = Array.isArray(supp.pause_intervals) ? [...supp.pause_intervals] : [];
  if (intervals.some(iv => iv && iv.to == null)) return intervals;
  intervals.push({ from: dateStr, to: null });
  return intervals;
}

export function withPauseEnded(supp, dateStr) {
  const intervals = Array.isArray(supp.pause_intervals) ? [...supp.pause_intervals] : [];
  return intervals.map(iv => (iv && iv.to == null) ? { ...iv, to: dateStr } : iv);
}
