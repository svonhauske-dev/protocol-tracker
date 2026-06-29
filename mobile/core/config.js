// ── App-level constants shared across components ──────────────────────────────
// Product config (schedule defaults, slot definitions, copy) lives here.
// Design tokens (colors, spacing, etc.) live in design-system.js.

export const DEFAULT_CONFIG = {
  pre_meal_window: 30, breakfast: 60, lunch: 300, dinner: 540, after_dinner: 660,
  // IF v2 fields
  eating_window_start: "12:00", eating_window_duration_hours: 8, meal_count: 3,
  // Legacy IF fields (kept so old configs don't break on read)
  window_start: 0, window_length: 480, meals_per_day: 2,
  fixed_times: {
    pre_breakfast: "07:30", breakfast: "08:00", pre_lunch: "11:30", lunch: "12:00",
    pre_dinner: "17:30", dinner: "18:00", after_dinner: "20:00", injectable: null, topical: null,
  },
};

export const FIXED_SLOTS = [
  { key: "pre_breakfast", label: "Before Breakfast" },
  { key: "breakfast",     label: "Breakfast" },
  { key: "pre_lunch",     label: "Before Lunch" },
  { key: "lunch",         label: "Lunch" },
  { key: "pre_dinner",    label: "Before Dinner" },
  { key: "dinner",        label: "Dinner" },
  { key: "after_dinner",  label: "Evening" },
  { key: "injectable",    label: "Injectables" },
  { key: "topical",       label: "Topicals" },
];

export const ANCHOR_NOTES = {
  medication: "Your anchor is when you take your medication each morning.",
  fasting:    "Your anchor is when your eating window opens.",
  wakeup:     "Your anchor is when you wake up each morning.",
};

export const toHrMin = (totalMins) => {
  if (!totalMins && totalMins !== 0) return { h: 0, m: 0 };
  return { h: Math.floor(totalMins / 60), m: totalMins % 60 };
};

export const fromHrMin = (h, m) => (parseInt(h) || 0) * 60 + (parseInt(m) || 0);

export const MODES = [
  { id: "none",       title: "No Schedule",          desc: "Just a checklist — no times, no notifications" },
  { id: "medication", title: "Medication Anchor",    desc: "Your day cascades from when you take your medication" },
  { id: "wakeup",     title: "Wake Up Anchor",       desc: "Your day cascades from when you wake up" },
  { id: "fasting",    title: "Intermittent Fasting", desc: "Built around your eating window" },
  { id: "fixed",      title: "Fixed Times",          desc: "Same schedule every day, no anchor" },
];

// 4-card UI grouping: medication + wakeup collapsed under "Anchor".
// DB still stores 'medication' or 'wakeup' — this is presentation only.
export const DISPLAY_MODES = [
  { id: "none",    title: "No Schedule",          desc: "Just a checklist — no times, no notifications" },
  { id: "anchor",  title: "Anchor",               desc: "Cascade from when you take your medication or wake up" },
  { id: "fasting", title: "Intermittent Fasting", desc: "Built around your eating window" },
  { id: "fixed",   title: "Fixed Times",          desc: "Same schedule every day, no anchor" },
];

export const ANCHOR_SUB_MODES = [
  { id: "medication", label: "Medication" },
  { id: "wakeup",     label: "Wake Up" },
];

export function getSlotLabelForMode(slotId, mode) {
  if (slotId === "rx") {
    if (mode === "wakeup")   return "Empty Stomach";
    return "Anchor Medication";
  }
  return null;
}

// Slot IDs used on the home screen for adherence totals and slot ordering (non-IF modes).
export const CORE_SLOTS = ["rx", "pre_breakfast", "breakfast", "pre_lunch", "lunch", "pre_dinner", "dinner", "after_dinner"];

// All IF slot IDs in chronological display order.
export const IF_SLOT_IDS = ["fasted", "meal_1", "pre_meal_2", "meal_2", "pre_meal_3", "meal_3", "evening"];

/**
 * Compute absolute HH:MM times for each IF slot from the v2 config.
 * Returns a partial map — only slots that exist for the current meal_count.
 * The `evening` slot is not included here; it's handled via evening_mode like offset modes.
 *
 * `effectiveWs` (optional, "HH:MM") — Flexible IF: the ACTUAL eating-window open
 * the user tapped today. When given, meal_1 and all downstream meal/pre-meal slots
 * re-anchor to it (window length still counts from it). `fasted` always stays at
 * the configured TARGET (eating_window_start − pre_meal_window), because the
 * pre-first-meal supps are taken before the user opens the window.
 */
export function computeIFSlotTimes(cfg, effectiveWs = null) {
  const ws = cfg.eating_window_start;
  if (!ws) return {};
  const durationMins = (cfg.eating_window_duration_hours ?? 8) * 60;
  const mealCount    = cfg.meal_count ?? 3;
  const pmw          = cfg.pre_meal_window ?? 30;
  const toMins = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  const targetWsMins = toMins(ws);          // configured target — drives `fasted`
  const anchor       = effectiveWs || ws;   // meal anchor — actual open if flexible+opened
  const wsMins       = toMins(anchor);

  const toHHMM = (mins) => {
    const t = ((mins % 1440) + 1440) % 1440;
    return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  };

  const result = {
    fasted: toHHMM(targetWsMins - pmw),
    meal_1: anchor,
  };
  if (mealCount >= 2) {
    // Last meal (2-meal) or middle meal (3-meal).
    // Last meal fires at windowEnd - pmw so it coincides with window_closing warning.
    const meal2Mins = mealCount === 2 ? wsMins + durationMins - pmw : wsMins + durationMins / 2;
    result.pre_meal_2 = toHHMM(meal2Mins - pmw);
    result.meal_2     = toHHMM(meal2Mins);
  }
  if (mealCount >= 3) {
    // Last meal fires at windowEnd - pmw, coinciding with window_closing warning.
    const meal3Mins   = wsMins + durationMins - pmw;
    result.pre_meal_3 = toHHMM(meal3Mins - pmw);
    result.meal_3     = toHHMM(meal3Mins);
  }
  return result;
}

export function deriveOffsets(mode, cfg) {
  // IF is now absolute-time (like Fixed) — handled by computeIFSlotTimes, not offsets.
  if (mode === "none" || mode === "fixed" || mode === "fasting") return null;
  const pmw       = cfg.pre_meal_window ?? 30;
  const pre_bfast = (cfg.breakfast ?? 60) - pmw;
  return {
    pre_breakfast: pre_bfast,
    breakfast:     cfg.breakfast ?? 60,
    pre_lunch:     (cfg.lunch ?? 300) - pmw,
    lunch:         cfg.lunch ?? 300,
    pre_dinner:    (cfg.dinner ?? 540) - pmw,
    dinner:        cfg.dinner ?? 540,
    after_dinner:  cfg.after_dinner ?? 660,
    injectable:    null,
    topical:       null,
  };
}

const _hhmmToMin = (s) => {
  if (typeof s !== "string") return null;
  const [h, m] = s.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

// ── Adaptive cascade delta (mirrors computeAdaptiveDelta in
//    supabase/functions/_shared/helpers.ts — keep the two in sync) ───────────
//
// In offset-based modes (medication/wakeup), when "adaptive timing" is on, the
// rest of today's schedule re-flows off when the user ACTUALLY logged each step.
// This returns the scalar shift (in integer local minutes) plus the per-slot
// actual times, so display (App.jsx getSlotTime) and notifications (the server
// mirror) can apply it identically.
//
//   slotOffsets — { slotId: offsetMinutesFromAnchor }. Caller builds the
//                 eligible set: includes rx:0, drops null offsets, and drops
//                 after_dinner when it's an absolute evening slot (evening_mode
//                 set) so it neither sources nor receives the shift.
//   anchorMin   — anchor time as minutes-of-day (hh*60+mm).
//   checked     — the day's `checked` map (keys `${dateKey}_${slotId}_${suppId}`,
//                 value `true` or `{checked, at:"HH:MM"}`).
//   dateKey     — that day's "YYYY-MM-DD" key prefix.
//
// Rule: a slot is "logged" if ≥1 of its supps has an `at`; its actual time is
// the MAX `at` across them (slot-finished time). S* = the logged slot with the
// greatest offset; delta = A(S*) − (anchorMin + offset(S*)). Nothing logged → 0.
export function computeAdaptiveDelta(slotOffsets, anchorMin, checked, dateKey) {
  const actuals = {}; // slotId -> actual minutes-of-day (max `at` in the slot)
  const ck = checked || {};
  for (const slotId of Object.keys(slotOffsets)) {
    const prefix = checkKeyPrefix(dateKey, slotId);
    let maxAt = null;
    for (const key of Object.keys(ck)) {
      if (!key.startsWith(prefix)) continue;
      const v = ck[key];
      const at = v && typeof v === "object" ? v.at : null;
      const mins = _hhmmToMin(at);
      if (mins == null) continue;
      if (maxAt == null || mins > maxAt) maxAt = mins;
    }
    if (maxAt != null) actuals[slotId] = maxAt;
  }

  let sStarOffset = null, sStarActual = null;
  for (const slotId of Object.keys(actuals)) {
    const off = slotOffsets[slotId];
    if (sStarOffset == null || off > sStarOffset) { sStarOffset = off; sStarActual = actuals[slotId]; }
  }
  if (sStarOffset == null) return { delta: 0, sStarOffset: null, actuals };
  return { delta: sStarActual - (anchorMin + sStarOffset), sStarOffset, actuals };
}

// Daily-log `checked` map key: `${dateKey}_${slotId}_${suppId}` (anytime supps
// use slotId "anytime"). Single client-side source of truth for the format —
// the server keeps its own copy in helpers.ts since it can't import this module.
export const makeCheckKey   = (dateKey, slotId, suppId) => `${dateKey}_${slotId}_${suppId}`;
export const checkKeyPrefix = (dateKey, slotId)         => `${dateKey}_${slotId}_`;
