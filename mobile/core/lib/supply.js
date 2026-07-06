import { dateKey, startOfDay } from './time';

// Supply / refill math — pure, derived from the check-off history so it can't
// drift. "Remaining" is never stored; it's stock_count minus what you've logged
// since you filled the bottle.

export function trackingSupply(supp) {
  return supp && supp.units_per_dose != null && supp.stock_count != null;
}

// Pluralize a dose/supply unit for display. Never double-pluralizes (a custom
// "other" unit already ending in 's' like "drops" stays "drops"), and leaves
// measures like mL alone. count == 1 (or null) → singular.
export function pluralizeUnit(unit, count) {
  const u = (unit || '').trim();
  if (!u || count == null || count === 1 || u === 'mL' || u.endsWith('s')) return u;
  return `${u}s`;
}

// Count how many doses of `supp` were logged (checked) on/after `sinceStr`
// (YYYY-MM-DD), across the given daily_logs rows [{ log_date, checked }].
// A dose = any truthy check key `${date}_${slot}_${suppId}` for this supp.
export function dosesLoggedSince(supp, logs, sinceStr) {
  let n = 0;
  for (const row of logs || []) {
    if (!row || !row.log_date || row.log_date < sinceStr) continue;
    const checked = row.checked || {};
    // A supp can be checked under any of its slots (or 'anytime'); count each.
    for (const key of Object.keys(checked)) {
      if (!checked[key]) continue;
      // key = `${date}_${slot}_${suppId}` — match the trailing suppId exactly.
      if (key.endsWith(`_${supp.id}`) && key.startsWith(`${row.log_date}_`)) n++;
    }
  }
  return n;
}

// Expected doses per day from the schedule: number of slots the item occupies
// (or 1 for anytime) × the fraction of days it runs. Used for the days-left
// projection (rate), not for remaining (which is actual).
export function dosesPerDay(supp) {
  const slots = Array.isArray(supp.slots) ? supp.slots : [];
  const perDay = slots.length > 0 ? slots.length : 1;
  const days = Array.isArray(supp.days) && supp.days.length > 0 ? supp.days.length : 7;
  return perDay * (days / 7);
}

// Full supply snapshot for an item, given the logs since it was filled.
// Returns null when the item isn't tracking supply.
export function computeSupply(supp, logs, todayDate = new Date()) {
  if (!trackingSupply(supp)) return null;
  const filledOn = supp.stock_filled_on || dateKey(startOfDay(todayDate));
  const consumed = supp.units_per_dose * dosesLoggedSince(supp, logs, filledOn);
  const remaining = Math.max(0, supp.stock_count - consumed);

  const rate = supp.units_per_dose * dosesPerDay(supp); // units/day
  const daysLeft = rate > 0 ? Math.floor(remaining / rate) : null;
  const lowDays = supp.low_supply_days ?? 7;
  const low = daysLeft != null && daysLeft <= lowDays;
  const out = remaining <= 0;

  return {
    remaining,
    unit: supp.stock_unit || 'pills',
    daysLeft,
    low,
    out,
  };
}
