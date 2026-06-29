import { dateKey, startOfDay, isActiveSupp, isStoppedSupp, isSupplementActiveOn } from './time';
import { makeCheckKey } from '../config';

// One "expected check" per (slot, supp) pair, plus one for each anytime supp.
// Iterating per supplement (not per fixed slot set) keeps this correct for any
// schedule mode — including IF v2, whose slot IDs are not in the legacy CORE_SLOTS.
//
// `activeSlotIds` (optional Set): when provided, only slot ids in this set
// count toward the expected denominator. Needed because IF v2 migration left
// some supplements with both legacy and IF v2 slot ids in their `slots` array;
// without filtering, the denominator gets inflated by uncheckable legacy slots.
function countExpectedChecks(supp, dk, checked, activeSlotIds) {
  if (!supp.slots || supp.slots.length === 0) {
    return { total: 1, done: checked[makeCheckKey(dk, 'anytime', supp.id)] ? 1 : 0 };
  }
  let total = 0, done = 0;
  for (const sid of supp.slots) {
    if (activeSlotIds && !activeSlotIds.has(sid)) continue;
    total++;
    if (checked[makeCheckKey(dk, sid, supp.id)]) done++;
  }
  return { total, done };
}

export function calculateAdherenceForDate(date, supplements, log, activeSlotIds = null) {
  if (!log) return 0;
  const dk = dateKey(date);
  const dayOfWeek = date.getDay();
  const checked = log.checked || {};

  const activeSupps = supplements.filter(s =>
    !isStoppedSupp(s) && isSupplementActiveOn(s, date) && s.days.includes(dayOfWeek)
  );

  let total = 0, done = 0;
  for (const supp of activeSupps) {
    const r = countExpectedChecks(supp, dk, checked, activeSlotIds);
    total += r.total;
    done  += r.done;
  }
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

// Per-protocol adherence for the clinician's patient view (Phase 2).
// Filters supplements to those belonging to `protocol.id`, then averages
// daily adherence over a window that starts at the protocol's start date
// (or `created_at` if no explicit start) but no earlier than `daysWindow`
// days ago. Returns `{ pct, days }` where `days` is the elapsed window
// length, or `null` if the protocol has no supplements or the window is
// empty (e.g. protocol started today).
export function calculateProtocolAdherence(protocol, supplements, logs, activeSlotIds = null, daysWindow = 30) {
  if (!protocol || !supplements?.length) return null;
  const protocolSupps = supplements.filter(s => s.protocol_id === protocol.id);
  if (protocolSupps.length === 0) return null;

  const today = startOfDay(new Date());
  const startStr = protocol.starts_at || protocol.created_at;
  if (!startStr) return null;
  const startDate = startOfDay(new Date(startStr));

  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - (daysWindow - 1));
  const computeFrom = startDate > windowStart ? startDate : windowStart;
  if (computeFrom > today) return null;

  const logMap = {};
  for (const log of (logs || [])) logMap[log.log_date] = log;

  let total = 0, daysCounted = 0;
  const d = new Date(computeFrom);
  while (d <= today) {
    const k = dateKey(d);
    total += calculateAdherenceForDate(d, protocolSupps, logMap[k] || null, activeSlotIds);
    daysCounted++;
    d.setDate(d.getDate() + 1);
  }
  if (daysCounted === 0) return null;
  return { pct: Math.round(total / daysCounted), days: daysCounted };
}

// Per-supplement adherence over a rolling window. Iterates the days the
// supplement was active (per `isSupplementActiveOn` + day-of-week filter)
// and returns avg pct, plus the count of expected check-ins (so the
// clinician can see "30%" alongside "12 expected" — context matters when
// a supp is only 2× a week).
export function calculateSupplementAdherence(supp, logs, activeSlotIds = null, daysWindow = 30) {
  if (!supp || !isActiveSupp(supp)) return null;
  const today = startOfDay(new Date());
  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - (daysWindow - 1));

  const logMap = {};
  for (const log of (logs || [])) logMap[log.log_date] = log;

  let total = 0, done = 0, activeDays = 0;
  const d = new Date(windowStart);
  while (d <= today) {
    if (isSupplementActiveOn(supp, d) && supp.days?.includes(d.getDay())) {
      activeDays++;
      const dk = dateKey(d);
      const checked = logMap[dk]?.checked || {};
      const r = countExpectedChecks(supp, dk, checked, activeSlotIds);
      total += r.total;
      done  += r.done;
    }
    d.setDate(d.getDate() + 1);
  }
  if (total === 0) return null;
  return { pct: Math.round((done / total) * 100), expected: total, taken: done, activeDays };
}

// Adherence per slot — averaged across all supplements assigned to that slot
// for each day, then averaged over the window. Tells the clinician "evening
// 40%, morning 95%" so they can move critical things to better times.
export function calculateSlotAdherence(slotId, supplements, logs, daysWindow = 30) {
  if (!slotId || !supplements?.length) return null;
  const supps = supplements.filter(s =>
    isActiveSupp(s) && s.slots?.includes(slotId)
  );
  if (supps.length === 0) return null;

  const today = startOfDay(new Date());
  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - (daysWindow - 1));

  const logMap = {};
  for (const log of (logs || [])) logMap[log.log_date] = log;

  let total = 0, done = 0;
  const d = new Date(windowStart);
  while (d <= today) {
    const dk = dateKey(d);
    const dow = d.getDay();
    const log = logMap[dk] || null;
    const checked = log?.checked || {};
    for (const s of supps) {
      if (!isSupplementActiveOn(s, d)) continue;
      if (!s.days?.includes(dow)) continue;
      total++;
      if (checked[makeCheckKey(dk, slotId, s.id)]) done++;
    }
    d.setDate(d.getDate() + 1);
  }
  if (total === 0) return null;
  return { pct: Math.round((done / total) * 100), expected: total, taken: done };
}

// Recent activity log — reverse-chronological list of supplement/protocol
// state changes inferred from timestamps + current status. Origin doesn't
// have a true audit log, so this is best-effort: "added X" comes from
// `created_at`, "paused X" from `updated_at`
// when status='paused' (close approximation when the patient hasn't edited
// the row otherwise). Good enough for "what changed since last check-in."
export function buildActivityLog(supplements = [], protocols = [], daysBack = 30, limit = 10) {
  const today = startOfDay(new Date());
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - daysBack);

  const events = [];

  for (const s of supplements) {
    if (s.created_at) {
      const t = new Date(s.created_at);
      if (t >= cutoff) {
        const sourceTag = s.protocol_id ? '' : ' (anytime)';
        events.push({ at: t, kind: 'added_supp', text: `Added ${s.name}${sourceTag}` });
      }
    }
    if (s.status === 'paused' && s.updated_at) {
      const t = new Date(s.updated_at);
      if (t >= cutoff) events.push({ at: t, kind: 'paused_supp', text: `Paused ${s.name}` });
    }
  }

  for (const p of protocols) {
    if (p.created_at) {
      const t = new Date(p.created_at);
      if (t >= cutoff) {
        const sourceTag = p.source === 'clinician' ? ' (from clinician)' : '';
        events.push({ at: t, kind: 'activated_protocol', text: `Activated ${p.name}${sourceTag}` });
      }
    }
    if (p.status === 'archived' && p.updated_at) {
      const t = new Date(p.updated_at);
      if (t >= cutoff) events.push({ at: t, kind: 'archived_protocol', text: `Archived ${p.name}` });
    }
  }

  events.sort((a, b) => b.at - a.at);
  return events.slice(0, limit);
}

export function getUpcomingEndings(supplements, daysAhead = 14) {
  const today = startOfDay(new Date());
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + daysAhead);

  return supplements
    .filter(s => {
      if (!s.ends_at) return false;
      if (!isActiveSupp(s)) return false;
      const [y, m, dd] = s.ends_at.split('-').map(Number);
      const endDate = startOfDay(new Date(y, m - 1, dd));
      return endDate >= today && endDate <= horizon;
    })
    .sort((a, b) => new Date(a.ends_at) - new Date(b.ends_at));
}
