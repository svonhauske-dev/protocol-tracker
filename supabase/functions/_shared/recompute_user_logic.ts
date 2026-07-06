// Per-user notification recompute logic.
//
// Extracted from recompute_notifications/index.ts so it can be invoked from
// two paths:
//   1. JWT-authenticated single-user calls from the frontend (existing flow)
//   2. Service-role cron loop that refills the queue daily for every enabled
//      user without waiting for them to open the app (added May 18 to fix
//      "notifications stopped firing because the queue ran out")
//
// Caller is responsible for providing the admin Supabase client and the
// user's IANA timezone (frontend reads Intl.DateTimeFormat; cron reads the
// `timezone` column on user_schedule that the frontend keeps fresh).

import {
  addMins,
  getLocalDateStr,
  getLocalDayOfWeek,
  parseLocalHHMM,
  deriveOffsets,
  computeAdaptiveDelta,
  getModeSlotLabel,
  getAnchorTitle,
  isSupplementActiveOn,
  computeIFSlotTimesHHMM,
  SLOT_LABELS,
  TIMED_SLOT_IDS,
  IF_TIMED_SLOT_IDS,
} from "./helpers.ts";

export type RecomputeResult = {
  queued: number;
  reason?: string;
  hasSub?: boolean;
  notifEnabled?: boolean;
  mode?: string;
  anchorBehavior?: string;
};

// deno-lint-ignore no-explicit-any
export async function recomputeForUser(admin: any, userId: string, tz: string): Promise<RecomputeResult> {
  const localToday    = getLocalDateStr(tz, 0);
  const localTomorrow = getLocalDateStr(tz, 1);

  // Auto-pause supplements whose treatment window has ended.
  // Use `lt` (strict less-than) not `lte`: a supplement with ends_at = today
  // is still active today and should still fire today's notifications. It'll
  // be auto-paused on tomorrow's recompute.
  //
  // (Lifecycle note May 18: this used to write status='stopped' but that
  // state was dropped from the cockpit. Writing 'paused' means an expired
  // scheduled course surfaces in the Paused tab where the user can decide
  // whether to delete it or resume it. Semantic isn't perfect — "paused"
  // implies user-initiated and reversible — but it's the closest in-system
  // state to "treatment course completed" until we add a dedicated
  // 'completed' state.)
  await admin
    .from("supplements")
    .update({ status: "paused", paused: true, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .in("treatment_mode", ["scheduled", "cycled"])
    .eq("status", "active")
    .not("ends_at", "is", null)
    .lt("ends_at", localToday);

  const [schedResult, suppsResult, logResult, subResult] = await Promise.all([
    admin.from("user_schedule").select("*").eq("user_id", userId).maybeSingle(),
    // Soft-deleted supps (deleted_at IS NOT NULL) are excluded — they were
    // removed from the cockpit so their notifications shouldn't fire either.
    // Selecting created_at + deleted_at so isSupplementActiveOn's date
    // bounds can be evaluated (defense in depth).
    admin.from("supplements")
      .select("id, name, dose, slots, days, pinned_time, treatment_mode, starts_at, ends_at, cycle_on_value, cycle_on_unit, cycle_off_value, cycle_off_unit, created_at, deleted_at, units_per_dose, stock_count, stock_filled_on, low_supply_days, low_supply_notified_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .is("deleted_at", null),
    admin.from("daily_logs")
      .select("pill_time, checked, eating_window_open, eating_window_close")
      .eq("user_id", userId)
      .eq("log_date", localToday)
      .maybeSingle(),
    admin.from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const sched    = schedResult.data;
  // deno-lint-ignore no-explicit-any
  const supps: any[] = suppsResult.data ?? [];
  const pillTime: string | null = logResult.data?.pill_time?.slice(0, 5) ?? null;
  // deno-lint-ignore no-explicit-any
  const checkedToday: Record<string, any> = logResult.data?.checked ?? {};
  const eatingWindowOpenToday:  string | null = logResult.data?.eating_window_open?.slice(0, 5)  ?? null;
  const eatingWindowCloseToday: string | null = logResult.data?.eating_window_close?.slice(0, 5) ?? null;
  const hasSub   = (subResult.count ?? 0) > 0;
  const adaptive: boolean = sched?.adaptive_timing === true;

  // ── Early exits ───────────────────────────────────────────────────────────────
  const mode: string = sched?.schedule_type ?? "none";

  // Any supp with a pinned_time fires regardless of schedule mode (anytime supps
  // as their only reminder; slotted supps as a second fixed-clock dose). A
  // No-Schedule user with a pinned supp still needs a recompute.
  const hasPinned = supps.some((s) => !!s.pinned_time);

  if (!hasSub || !sched?.notifications_enabled || (mode === "none" && !hasPinned)) {
    return { queued: 0, reason: "skip", hasSub, notifEnabled: sched?.notifications_enabled ?? false, mode };
  }

  // ── Extract schedule config ───────────────────────────────────────────────────
  // deno-lint-ignore no-explicit-any
  const cfg: Record<string, any> = sched.offsets ?? {};
  const anchorBehavior: string = cfg._anchor_behavior ?? "flexible";
  const consistentTime: string | null = cfg._consistent_time ?? null;

  // ── Compute notifications for today + tomorrow ────────────────────────────────
  const now = new Date();
  const plus48 = new Date(now.getTime() + 48 * 3_600_000);

  type QueueRow = {
    user_id: string;
    fire_at: string;
    scheduled_for_date: string;
    title: string;
    body: string;
    slot_id: string;
    tag: string;
    fired: boolean;
  };

  const rows: QueueRow[] = [];

  for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
    const dateStr   = getLocalDateStr(tz, dayOffset);
    const dayOfWeek = getLocalDayOfWeek(dateStr, tz);
    const isToday   = dayOffset === 0;

    // ── Pinned-time reminders (mode-independent absolute reminders) ──────────────
    // Any supp with a pinned_time fires at that exact local clock time on every
    // active day, in ANY mode. For anytime supps this is the only reminder; for
    // slotted supps it is a second independent reminder (a second dose). Each
    // gets its own row keyed by supp id; sw.js branches on data.type, never
    // slot_id, so the synthetic id is safe.
    for (const supp of supps) {
      if (!supp.pinned_time) continue;
      if (!Array.isArray(supp.days) || !supp.days.includes(dayOfWeek)) continue;
      if (!isSupplementActiveOn(supp, dateStr)) continue;
      const fireAt = parseLocalHHMM(dateStr, (supp.pinned_time as string).slice(0, 5), tz);
      if (fireAt <= now) continue;
      rows.push({
        user_id:            userId,
        fire_at:            fireAt.toISOString(),
        scheduled_for_date: fireAt.toLocaleDateString("sv-SE", { timeZone: tz }),
        title:              `Time for ${supp.name}`,
        body:               supp.dose ?? "",
        slot_id:            `pinned_${supp.id}`,
        tag:                `${dateStr}_pinned_${supp.id}`,
        fired:              false,
      });
    }

    // ── Fixed mode ──────────────────────────────────────────────────────────────
    if (mode === "fixed") {
      const fixedTimes: Record<string, string | null> = cfg.fixed_times ?? {};
      const preMealWindow: number = (cfg.pre_meal_window as number) ?? 0;

      for (const slotId of TIMED_SLOT_IDS) {
        if (slotId === "rx") continue; // no single anchor in fixed mode

        let fireAt: Date;
        // Pre-meal slots derive from their meal time minus the global window.
        if (slotId === "pre_breakfast" || slotId === "pre_lunch" || slotId === "pre_dinner") {
          const mealId = slotId.replace("pre_", "");
          const mealTime = fixedTimes[mealId];
          if (!mealTime) continue;
          fireAt = addMins(parseLocalHHMM(dateStr, mealTime, tz), -preMealWindow);
        } else {
          const fixedTime = fixedTimes[slotId];
          if (!fixedTime) continue;
          fireAt = parseLocalHHMM(dateStr, fixedTime, tz);
        }

        if (fireAt <= now) continue;

        const slotSupps = supps.filter(
          (s) => Array.isArray(s.slots) && s.slots.includes(slotId) &&
                 Array.isArray(s.days)  && s.days.includes(dayOfWeek) &&
                 isSupplementActiveOn(s, dateStr),
        );
        if (!slotSupps.length) continue;

        rows.push({
          user_id:             userId,
          fire_at:             fireAt.toISOString(),
          scheduled_for_date:  fireAt.toLocaleDateString("sv-SE", { timeZone: tz }),
          title:               `Time for ${SLOT_LABELS[slotId] ?? slotId}`,
          body:                slotSupps.map((s) => s.name).join(", "),
          slot_id:             slotId,
          tag:                 `${dateStr}_${slotId}`,
          fired:               false,
        });
      }
      continue; // done with this day for fixed mode
    }

    // ── IF v2 (fasting, migrated) ────────────────────────────────────────────────
    if (mode === "fasting" && cfg._if_v2_migrated) {
      const wsHHMM = cfg.eating_window_start as string | undefined;
      if (!wsHHMM) continue;

      const durationMins = ((cfg.eating_window_duration_hours as number) ?? 8) * 60;
      const flexible     = cfg.eating_window_flexible === true;
      // Actual open/close only apply to today (the fetched log is today's). Tomorrow
      // has no anchor yet, so flexible tomorrow shows only the target nudges.
      const openHHMM     = (flexible && isToday) ? eatingWindowOpenToday : null;
      const closeAt      = (flexible && isToday && eatingWindowCloseToday)
        ? parseLocalHHMM(dateStr, eatingWindowCloseToday, tz) : null;
      const afterClose   = (d: Date) => closeAt != null && d > closeAt;
      const effectiveWs  = flexible ? (openHHMM || wsHHMM) : wsHHMM;
      const slotTimes    = computeIFSlotTimesHHMM(cfg, flexible ? effectiveWs : null);

      // fasted — unconditional window-opening warning, body lists fasted supplements if any
      if (slotTimes.fasted) {
        const fastedAt = parseLocalHHMM(dateStr, slotTimes.fasted, tz);
        if (fastedAt > now) {
          const fastedSupps = supps.filter(
            (s) => Array.isArray(s.slots) && s.slots.includes("fasted") &&
                   Array.isArray(s.days)  && s.days.includes(dayOfWeek) &&
                   isSupplementActiveOn(s, dateStr),
          );
          rows.push({
            user_id:            userId,
            fire_at:            fastedAt.toISOString(),
            scheduled_for_date: fastedAt.toLocaleDateString("sv-SE", { timeZone: tz }),
            title:              "Your eating window opens in 30 minutes",
            body:               fastedSupps.map((s) => s.name).join(", "),
            slot_id:            "fasted",
            tag:                `${dateStr}_fasted`,
            fired:              false,
          });
        }
      }

      if (flexible && !openHHMM) {
        // Flexible, not yet opened (today-before-tap, or tomorrow): emit the
        // target-time "open your window" PROMPT (no supps). Meal/closing rows wait
        // until she taps open — there's no anchor yet. The next recompute after the
        // tap deletes this unfired prompt and emits the real meal_1 + closing.
        const promptAt = parseLocalHHMM(dateStr, wsHHMM, tz);
        if (promptAt > now) {
          rows.push({
            user_id:            userId,
            fire_at:            promptAt.toISOString(),
            scheduled_for_date: promptAt.toLocaleDateString("sv-SE", { timeZone: tz }),
            title:              "Time to open your eating window",
            body:               "",
            slot_id:            "window_open_prompt",
            tag:                `${dateStr}_window_open_prompt`,
            fired:              false,
          });
        }
      } else {
        // Fixed, or flexible + opened: window-open + closing + meal slots, anchored
        // to effectiveWs (the actual open in flexible). Rows past a recorded close
        // are dropped.

        // meal_1 / window open — state transition, lists meal_1 supplements
        const windowOpenAt = parseLocalHHMM(dateStr, effectiveWs, tz);
        if (windowOpenAt > now && !afterClose(windowOpenAt)) {
          const meal1Supps = supps.filter(
            (s) => Array.isArray(s.slots) && s.slots.includes("meal_1") &&
                   Array.isArray(s.days)  && s.days.includes(dayOfWeek) &&
                   isSupplementActiveOn(s, dateStr),
          );
          rows.push({
            user_id:            userId,
            fire_at:            windowOpenAt.toISOString(),
            scheduled_for_date: windowOpenAt.toLocaleDateString("sv-SE", { timeZone: tz }),
            title:              "Your eating window is open",
            body:               meal1Supps.map((s) => s.name).join(", "),
            slot_id:            "meal_1",
            tag:                `${dateStr}_meal_1`,
            fired:              false,
          });
        }

        // window_closing — 30-min warning, unless a meal slot with supplements fires at the same minute.
        const closingAt    = addMins(windowOpenAt, durationMins - 30);
        const closingTime  = closingAt.getTime();
        const CLOSING_DEDUPE_MS = 5 * 60 * 1000;
        const closingCoveredByMeal = IF_TIMED_SLOT_IDS.some((slotId) => {
          if (slotId === "evening") return false;
          const hhmm = slotTimes[slotId as string];
          if (!hhmm) return false;
          const at = parseLocalHHMM(dateStr, hhmm, tz);
          if (Math.abs(at.getTime() - closingTime) >= CLOSING_DEDUPE_MS) return false;
          return supps.some(
            (s) => Array.isArray(s.slots) && s.slots.includes(slotId) &&
                   Array.isArray(s.days)  && s.days.includes(dayOfWeek) &&
                   isSupplementActiveOn(s, dateStr),
          );
        });
        if (closingAt > now && !closingCoveredByMeal && !afterClose(closingAt)) {
          rows.push({
            user_id:            userId,
            fire_at:            closingAt.toISOString(),
            scheduled_for_date: closingAt.toLocaleDateString("sv-SE", { timeZone: tz }),
            title:              "Your eating window closes in 30 minutes",
            body:               "",
            slot_id:            "window_closing",
            tag:                `${dateStr}_window_closing`,
            fired:              false,
          });
        }

        // Meal slots conditional on supplements (pre_meal_2, meal_2, pre_meal_3, meal_3).
        for (const slotId of IF_TIMED_SLOT_IDS) {
          if (slotId === "evening") continue; // handled separately below
          const hhmm = slotTimes[slotId as string];
          if (!hhmm) continue;
          const fireAt = parseLocalHHMM(dateStr, hhmm, tz);
          if (fireAt <= now) continue;
          if (afterClose(fireAt)) continue;
          const slotSupps = supps.filter(
            (s) => Array.isArray(s.slots) && s.slots.includes(slotId) &&
                   Array.isArray(s.days)  && s.days.includes(dayOfWeek) &&
                   isSupplementActiveOn(s, dateStr),
          );
          if (!slotSupps.length) continue;
          rows.push({
            user_id:            userId,
            fire_at:            fireAt.toISOString(),
            scheduled_for_date: fireAt.toLocaleDateString("sv-SE", { timeZone: tz }),
            title:              `Time for ${SLOT_LABELS[slotId] ?? slotId}`,
            body:                slotSupps.map((s) => s.name).join(", "),
            slot_id:             slotId,
            tag:                 `${dateStr}_${slotId}`,
            fired:               false,
          });
        }
      }

      // evening — conditional on evening_mode and supplements
      {
        let eveningAt: Date | null = null;
        const em = cfg.evening_mode;
        if (em === "fixed" && cfg.evening_time) {
          eveningAt = parseLocalHHMM(dateStr, cfg.evening_time as string, tz);
        } else if (em === "before_sleep" && cfg.sleep_time) {
          const offsetMins = ((cfg.evening_offset_hours as number) ?? 1) * 60 + ((cfg.evening_offset_minutes as number) ?? 0);
          eveningAt = addMins(parseLocalHHMM(dateStr, cfg.sleep_time as string, tz), -offsetMins);
        }
        if (eveningAt && eveningAt > now) {
          const slotSupps = supps.filter(
            (s) => Array.isArray(s.slots) && s.slots.includes("evening") &&
                   Array.isArray(s.days)  && s.days.includes(dayOfWeek) &&
                   isSupplementActiveOn(s, dateStr),
          );
          if (slotSupps.length) {
            rows.push({
              user_id:            userId,
              fire_at:            eveningAt.toISOString(),
              scheduled_for_date: eveningAt.toLocaleDateString("sv-SE", { timeZone: tz }),
              title:              "Time for Evening",
              body:               slotSupps.map((s) => s.name).join(", "),
              slot_id:            "evening",
              tag:                `${dateStr}_evening`,
              fired:              false,
            });
          }
        }
      }

      continue; // done with this day for IF v2
    }

    // ── Offset-based modes (medication / wakeup / fasting v1) ───────────────────

    // Determine anchor time for this day
    let anchorHHMM: string | null = null;

    if (anchorBehavior === "consistent" && consistentTime) {
      anchorHHMM = consistentTime;
    } else {
      // flexible — only today has a known anchor (user sets it each morning)
      if (!isToday || !pillTime) continue;
      anchorHHMM = pillTime;
    }

    const anchorDate = parseLocalHHMM(dateStr, anchorHHMM, tz);

    if (mode === "fasting") {
      // IF v1 — state transitions for the eating window.
      if (anchorDate > now) {
        rows.push({
          user_id:             userId,
          fire_at:             anchorDate.toISOString(),
          scheduled_for_date:  anchorDate.toLocaleDateString("sv-SE", { timeZone: tz }),
          title:               "Your eating window is open",
          body:                "",
          slot_id:             "window_open",
          tag:                 `${dateStr}_window_open`,
          fired:               false,
        });
      }
      const windowLength: number = ((cfg.window_length as number) ?? 480);
      const closingAt = addMins(anchorDate, windowLength - 30);
      if (closingAt > now) {
        rows.push({
          user_id:             userId,
          fire_at:             closingAt.toISOString(),
          scheduled_for_date:  closingAt.toLocaleDateString("sv-SE", { timeZone: tz }),
          title:               "Your eating window closes in 30 minutes",
          body:                "",
          slot_id:             "window_closing",
          tag:                 `${dateStr}_window_closing`,
          fired:               false,
        });
      }
    } else {
      // medication / wakeup: rx fires at anchor time, gated on supplements
      const rxSupps = supps.filter(
        (s) => Array.isArray(s.slots) && s.slots.includes("rx") &&
               Array.isArray(s.days)  && s.days.includes(dayOfWeek) &&
               isSupplementActiveOn(s, dateStr),
      );
      if (rxSupps.length > 0 && anchorDate > now) {
        rows.push({
          user_id:             userId,
          fire_at:             anchorDate.toISOString(),
          scheduled_for_date:  anchorDate.toLocaleDateString("sv-SE", { timeZone: tz }),
          title:               getAnchorTitle(mode),
          body:                rxSupps.map((s) => s.name).join(", "),
          slot_id:             "rx",
          tag:                 `${dateStr}_rx`,
          fired:               false,
        });
      }
    }

    // All other timed slots (anchor + offset)
    const offsets = deriveOffsets(mode, cfg);
    if (!offsets) continue;

    // Adaptive cascade: when enabled, today's downstream slots re-flow off the
    // user's actual log times. Computed once per day; only today has logs.
    const adaptiveActive = adaptive && isToday && (mode === "medication" || mode === "wakeup");
    let adaptiveInfo: { delta: number; sStarOffset: number | null; actuals: Record<string, number> } =
      { delta: 0, sStarOffset: null, actuals: {} };
    if (adaptiveActive) {
      // Eligible set: rx:0 anchor, real numeric offsets, minus the absolute
      // evening slot (it neither sources nor receives the shift).
      const eligible: Record<string, number> = { rx: 0 };
      for (const sid of Object.keys(offsets)) {
        const off = offsets[sid];
        if (off === null || off === undefined) continue;
        if (sid === "after_dinner" && cfg.evening_mode !== undefined) continue;
        eligible[sid] = off as number;
      }
      const [ah, am] = anchorHHMM.split(":").map(Number);
      adaptiveInfo = computeAdaptiveDelta(eligible, ah * 60 + am, checkedToday, dateStr);
    }

    for (const slotId of TIMED_SLOT_IDS) {
      if (slotId === "rx") continue; // already handled above

      // Evening bucket override for medication/wakeup with evening_mode set.
      if (slotId === "after_dinner" && (mode === "medication" || mode === "wakeup") && cfg.evening_mode !== undefined) {
        let fireAt: Date | null = null;
        const em = cfg.evening_mode;
        if (em === "fixed" && cfg.evening_time) {
          fireAt = parseLocalHHMM(dateStr, cfg.evening_time as string, tz);
        } else if (em === "before_sleep" && cfg.sleep_time) {
          const offsetMins = ((cfg.evening_offset_hours as number) ?? 1) * 60 + ((cfg.evening_offset_minutes as number) ?? 0);
          fireAt = addMins(parseLocalHHMM(dateStr, cfg.sleep_time as string, tz), -offsetMins);
        }
        if (fireAt && fireAt > now) {
          const slotSupps = supps.filter(
            (s) => Array.isArray(s.slots) && s.slots.includes("after_dinner") &&
                   Array.isArray(s.days)  && s.days.includes(dayOfWeek) &&
                   isSupplementActiveOn(s, dateStr),
          );
          if (slotSupps.length) {
            rows.push({
              user_id:             userId,
              fire_at:             fireAt.toISOString(),
              scheduled_for_date:  fireAt.toLocaleDateString("sv-SE", { timeZone: tz }),
              title:               "Time for Evening",
              body:                slotSupps.map((s) => s.name).join(", "),
              slot_id:             "after_dinner",
              tag:                 `${dateStr}_after_dinner`,
              fired:               false,
            });
          }
        }
        continue;
      }

      const offset = offsets[slotId];
      if (offset === null || offset === undefined) continue;

      // Adaptive: a slot the user already logged needs no reminder; downstream
      // unlogged slots shift by the active delta. Earlier unlogged slots stay put.
      if (adaptiveActive && adaptiveInfo.actuals[slotId] != null) continue;
      const effOffset = (adaptiveActive && adaptiveInfo.sStarOffset != null && offset > adaptiveInfo.sStarOffset)
        ? offset + adaptiveInfo.delta
        : offset;

      const fireAt = addMins(anchorDate, effOffset);
      if (fireAt <= now) continue;
      // Midnight clamp: if the shift pushes the slot onto another local day, drop
      // today's row so it can't collide with tomorrow's independently-computed one.
      if (adaptiveActive && fireAt.toLocaleDateString("sv-SE", { timeZone: tz }) !== dateStr) continue;

      const slotSupps = supps.filter(
        (s) => Array.isArray(s.slots) && s.slots.includes(slotId) &&
               Array.isArray(s.days)  && s.days.includes(dayOfWeek) &&
               isSupplementActiveOn(s, dateStr),
      );
      if (!slotSupps.length) continue;

      rows.push({
        user_id:             userId,
        fire_at:             fireAt.toISOString(),
        scheduled_for_date:  fireAt.toLocaleDateString("sv-SE", { timeZone: tz }),
        title:               `Time for ${getModeSlotLabel(slotId, mode)}`,
        body:                slotSupps.map((s) => s.name).join(", "),
        slot_id:             slotId,
        tag:                 `${dateStr}_${slotId}`,
        fired:               false,
      });
    }
  }

  // ── End-of-treatment notifications (fires morning of last active day) ─────────
  for (const supp of supps) {
    if (supp.ends_at !== localTomorrow) continue;
    const fireAt = parseLocalHHMM(localToday, "08:00", tz);
    if (fireAt <= now) continue;
    rows.push({
      user_id:            userId,
      fire_at:            fireAt.toISOString(),
      scheduled_for_date: localToday,
      title:              "Course ending today",
      body:               `Your ${supp.name} course is ending today. Continue or stop?`,
      slot_id:            "course_end",
      tag:                `${localToday}_course_end_${supp.id}`,
      fired:              false,
    });
  }

  // ── Low-supply "reorder" nudge (refill Phase 2) ───────────────────────────────
  // For each supply-tracked item, "remaining" is DERIVED from the check-off
  // history (same math as the app): stock_count − units_per_dose × doses logged
  // since stock_filled_on. When days-of-supply-left ≤ the item's threshold, queue
  // ONE reorder push per fill cycle (deduped by low_supply_notified_at vs
  // stock_filled_on — a refill re-arms it automatically). Fired at 09:00 local.
  const supplyTracked = supps.filter(
    (s) => s.units_per_dose != null && s.stock_count != null && s.stock_filled_on,
  );
  if (supplyTracked.length > 0) {
    const earliestFill = supplyTracked.map((s) => s.stock_filled_on).sort()[0];
    const { data: histLogs } = await admin
      .from("daily_logs")
      .select("log_date, checked")
      .eq("user_id", userId)
      .gte("log_date", earliestFill);
    const logs = histLogs ?? [];

    const toNotify: { supp: any; daysLeft: number }[] = [];
    for (const s of supplyTracked) {
      let doses = 0;
      for (const row of logs) {
        if (!row?.log_date || row.log_date < s.stock_filled_on) continue;
        const checked = row.checked ?? {};
        for (const k of Object.keys(checked)) {
          if (checked[k] && k.endsWith(`_${s.id}`) && k.startsWith(`${row.log_date}_`)) doses++;
        }
      }
      const remaining = Math.max(0, s.stock_count - s.units_per_dose * doses);
      const perDay = Array.isArray(s.slots) && s.slots.length ? s.slots.length : 1;
      const daysFrac = (Array.isArray(s.days) && s.days.length ? s.days.length : 7) / 7;
      const rate = s.units_per_dose * perDay * daysFrac; // units/day
      if (rate <= 0) continue;
      const daysLeft = Math.floor(remaining / rate);
      const lowDays = s.low_supply_days ?? 7;
      const notifiedThisCycle = s.low_supply_notified_at && s.low_supply_notified_at >= s.stock_filled_on;
      if (daysLeft <= lowDays && !notifiedThisCycle) toNotify.push({ supp: s, daysLeft });
    }

    if (toNotify.length > 0) {
      const today9 = parseLocalHHMM(getLocalDateStr(tz, 0), "09:00", tz);
      const fireAt = today9 > now ? today9 : parseLocalHHMM(getLocalDateStr(tz, 1), "09:00", tz);
      for (const { supp, daysLeft } of toNotify) {
        rows.push({
          user_id:            userId,
          fire_at:            fireAt.toISOString(),
          scheduled_for_date: fireAt.toLocaleDateString("sv-SE", { timeZone: tz }),
          title:              "Running low",
          body:               daysLeft <= 0
            ? `You're out of ${supp.name} — time to reorder.`
            : `About ${daysLeft} day${daysLeft === 1 ? "" : "s"} of ${supp.name} left — reorder soon.`,
          slot_id:            "low_supply",
          tag:                `low_supply_${supp.id}_${supp.stock_filled_on}`,
          fired:              false,
        });
      }
      await admin
        .from("supplements")
        .update({ low_supply_notified_at: new Date().toISOString() })
        .in("id", toNotify.map((t) => t.supp.id));
    }
  }

  // ── Delete stale pending rows in the 48-hour window ───────────────────────────
  // Exclude low_supply rows: they're deduped by a per-supp flag (not rebuilt each
  // run) and their fire_at can be up to ~24h out, so the wipe-and-rebuild must
  // not erase them before they fire.
  const { error: delErr } = await admin
    .from("notifications_queue")
    .delete()
    .eq("user_id", userId)
    .eq("fired", false)
    .neq("slot_id", "low_supply")
    .gte("fire_at", now.toISOString())
    .lt("fire_at", plus48.toISOString());

  if (delErr) {
    throw new Error(`Delete failed: ${delErr.message}`);
  }

  // ── Insert fresh rows ─────────────────────────────────────────────────────────
  if (rows.length > 0) {
    const { error: insErr } = await admin.from("notifications_queue").insert(rows);
    if (insErr) {
      throw new Error(`Insert failed: ${insErr.message}`);
    }
  }

  return { queued: rows.length, mode, anchorBehavior };
}
