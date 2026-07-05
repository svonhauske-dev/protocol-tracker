// supabase/functions/process_notifications_queue/index.ts
// Called every minute by pg_cron. Reads pending notifications_queue rows,
// sends Web Push to each user's subscriptions, marks rows fired.
// Deploy with --no-verify-jwt (pg_cron calls with service role key, not user JWT).
// Auto-deploy: deployed by the Supabase GitHub integration on push to main.

// deno-lint-ignore-file no-explicit-any
import webpush from "npm:web-push@3";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getLocalDayOfWeek, isSupplementActiveOn } from "../_shared/helpers.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

// ── VAPID setup (module-level for warm-start efficiency) ───────────────────────
const VAPID_PUBLIC_KEY  = Deno.env.get("VAPID_PUBLIC_KEY")  ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT     = Deno.env.get("VAPID_SUBJECT")     ?? "mailto:support@tether.app";

const VAPID_READY = !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
if (VAPID_READY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// ── Admin client (service role — bypasses RLS) ─────────────────────────────────
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

// ── Expo push (native iOS via APNs) ────────────────────────────────────────────
// Deliver one queue row to a user's Expo push tokens. Returns how many sends
// succeeded + whether a transient error means we should retry next tick. Dead
// tokens (DeviceNotRegistered) are deleted so they don't loop forever.
async function sendExpoPush(
  tokens: string[],
  row: any,
): Promise<{ ok: number; retry: boolean }> {
  const valid = tokens.filter((t) => typeof t === "string" && t.startsWith("ExponentPushToken"));
  if (valid.length === 0) return { ok: 0, retry: false };

  const messages = valid.map((to) => ({
    to,
    title: row.title,
    body: row.body,
    sound: "default",
    priority: "high",
    ttl: 3600,
    data: { slot_id: row.slot_id, tag: row.tag },
  }));

  let res: Response;
  try {
    res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error(`Expo push network error for user ${row.user_id}:`, err);
    return { ok: 0, retry: true }; // network blip — retry next tick
  }

  if (!res.ok) {
    console.error(`Expo push HTTP ${res.status} for user ${row.user_id}`);
    return { ok: 0, retry: res.status >= 500 || res.status === 429 };
  }

  let ok = 0;
  let retry = false;
  try {
    const payload = await res.json();
    const tickets: any[] = payload?.data ?? [];
    for (let i = 0; i < tickets.length; i++) {
      const t = tickets[i];
      if (t?.status === "ok") { ok++; continue; }
      const errCode = t?.details?.error;
      if (errCode === "DeviceNotRegistered") {
        await admin.from("expo_push_tokens").delete().eq("token", valid[i]);
        console.log(`Removed dead Expo token: ${valid[i].slice(0, 30)}…`);
      } else {
        console.error(`Expo push error (${errCode ?? "unknown"}) for user ${row.user_id}: ${t?.message ?? ""}`);
        retry = true;
      }
    }
  } catch (err) {
    console.error("Expo push response parse failed:", err);
    return { ok: 0, retry: true };
  }
  return { ok, retry };
}

// ──────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });

  if (!VAPID_READY) {
    console.error("VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY not set");
    return json({ error: "VAPID keys not configured" }, 500);
  }

  // ── 1. Fetch pending rows ────────────────────────────────────────────────────
  const now = new Date().toISOString();
  const { data: pending, error: qErr } = await admin
    .from("notifications_queue")
    .select("id, user_id, fire_at, title, body, tag, slot_id, scheduled_for_date")
    .lte("fire_at", now)
    .eq("fired", false)
    .order("fire_at", { ascending: true })
    .limit(100);

  if (qErr) {
    console.error("Queue fetch failed:", qErr.message);
    return json({ error: "Queue fetch failed", detail: qErr.message }, 500);
  }

  const rows: any[] = pending ?? [];
  if (rows.length === 0) {
    return json({ processed: 0, sent: 0, failed: 0, skipped: 0 });
  }

  // ── 2. Batch-fetch user data (minimise round trips) ──────────────────────────
  const userIds = [...new Set<string>(rows.map((r) => r.user_id))];
  const userDatePairs = [
    ...new Set<string>(rows.map((r) => `${r.user_id}|${r.scheduled_for_date}`)),
  ];
  const logDates = [...new Set<string>(rows.map((r) => r.scheduled_for_date).filter(Boolean))];

  const [schedResult, subsResult, expoResult, suppsResult, logsResult] = await Promise.all([
    admin
      .from("user_schedule")
      .select("user_id, notifications_enabled, timezone")
      .in("user_id", userIds),
    admin
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth")
      .in("user_id", userIds),
    // Native (Expo/APNs) push tokens — the iOS app can't receive Web Push, so
    // it registers an ExponentPushToken here and we deliver via the Expo Push API.
    admin
      .from("expo_push_tokens")
      .select("user_id, token")
      .in("user_id", userIds),
    // Supps needed to determine which are assigned to each (user, slot) so we
    // can check whether they're all already logged before firing the push.
    admin
      .from("supplements")
      .select("id, user_id, slots, days, treatment_mode, starts_at, ends_at, cycle_on_value, cycle_on_unit, cycle_off_value, cycle_off_unit, created_at, deleted_at")
      .in("user_id", userIds)
      .eq("status", "active")
      .is("deleted_at", null),
    // Daily_logs.checked is the source of truth for "did the user log this?"
    // Fetch every (user, date) pair we have a pending row for.
    logDates.length > 0
      ? admin
          .from("daily_logs")
          .select("user_id, log_date, checked")
          .in("user_id", userIds)
          .in("log_date", logDates)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  // Build lookup maps
  const notifEnabled = new Map<string, boolean>();
  const userTz = new Map<string, string>();
  for (const s of schedResult.data ?? []) {
    notifEnabled.set(s.user_id, s.notifications_enabled ?? false);
    userTz.set(s.user_id, s.timezone || "UTC");
  }

  const userSubs = new Map<string, any[]>();
  for (const sub of subsResult.data ?? []) {
    const list = userSubs.get(sub.user_id) ?? [];
    list.push(sub);
    userSubs.set(sub.user_id, list);
  }

  const userExpoTokens = new Map<string, string[]>();
  for (const t of expoResult.data ?? []) {
    const list = userExpoTokens.get(t.user_id) ?? [];
    list.push(t.token);
    userExpoTokens.set(t.user_id, list);
  }

  const userSupps = new Map<string, any[]>();
  for (const supp of suppsResult.data ?? []) {
    const list = userSupps.get(supp.user_id) ?? [];
    list.push(supp);
    userSupps.set(supp.user_id, list);
  }

  // Keyed by `${user_id}|${log_date}` → checked jsonb
  const checkedMap = new Map<string, Record<string, any>>();
  for (const log of logsResult.data ?? []) {
    checkedMap.set(`${log.user_id}|${log.log_date}`, log.checked ?? {});
  }

  // ── 2b. Skip-if-already-logged helper ────────────────────────────────────────
  // Returns true if every supplement assigned to this (user, slot, date) has
  // already been logged. Unconditional slots (window_open / window_closing /
  // fasted / course_end — which carry zero assigned supps) naturally fall
  // through to "false" (fire as usual).
  const isSlotFullyLogged = (
    userId: string,
    slotId: string,
    dateStr: string,
  ): boolean => {
    if (!dateStr) return false;
    const tz = userTz.get(userId) || "UTC";
    let dayOfWeek: number;
    try {
      dayOfWeek = getLocalDayOfWeek(dateStr, tz);
    } catch {
      return false;
    }
    const supps = userSupps.get(userId) ?? [];
    const assigned = supps.filter(
      (s) =>
        Array.isArray(s.slots) && s.slots.includes(slotId) &&
        Array.isArray(s.days)  && s.days.includes(dayOfWeek) &&
        isSupplementActiveOn(s, dateStr),
    );
    if (assigned.length === 0) return false; // unconditional — let it fire
    const checked = checkedMap.get(`${userId}|${dateStr}`) ?? {};
    return assigned.every((s) => Boolean(checked[`${dateStr}_${slotId}_${s.id}`]));
  };

  // ── 3. Process each row ──────────────────────────────────────────────────────
  let sent = 0, failed = 0, skipped = 0;

  for (const row of rows) {
    // Skip if user disabled notifications
    if (!notifEnabled.get(row.user_id)) {
      skipped++;
      continue;
    }

    // Skip + mark fired if every supp in this slot was already logged.
    // Suppresses redundant pushes when the user takes supps slightly early.
    if (isSlotFullyLogged(row.user_id, row.slot_id, row.scheduled_for_date)) {
      await admin
        .from("notifications_queue")
        .update({ fired: true, fired_at: new Date().toISOString() })
        .eq("id", row.id);
      skipped++;
      continue;
    }

    const subs = userSubs.get(row.user_id) ?? [];
    const expoTokens = userExpoTokens.get(row.user_id) ?? [];
    if (subs.length === 0 && expoTokens.length === 0) {
      // No web subscriptions AND no native tokens — nothing to send, mark fired
      // so it doesn't loop forever.
      await admin
        .from("notifications_queue")
        .update({ fired: true, fired_at: new Date().toISOString() })
        .eq("id", row.id);
      skipped++;
      continue;
    }

    const payload = JSON.stringify({
      title: row.title,
      body:  row.body,
      tag:   row.tag,
      data:  { slot_id: row.slot_id },
    });

    let successCount  = 0;
    let retryableErr  = false;

    // ── Web Push (browsers) ──
    for (const sub of subs) {
      try {
        await (webpush as any).sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
          { TTL: 3600, urgency: "normal" },
        );
        successCount++;
      } catch (err: any) {
        const status: number = err?.statusCode ?? err?.status ?? 0;

        if (status === 404 || status === 410) {
          // Subscription expired or revoked — delete it
          console.log(`Dead subscription (${status}), removing: ${sub.endpoint.slice(0, 60)}…`);
          await admin
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint);
        } else {
          // Transient error — leave row unfired for next cron tick
          console.error(
            `Push failed (${status}) for user ${row.user_id}: ${err?.message ?? err}`,
          );
          retryableErr = true;
        }
      }
    }

    // ── Native Push (iOS app via Expo → APNs) ──
    if (expoTokens.length > 0) {
      const expo = await sendExpoPush(expoTokens, row);
      successCount += expo.ok;
      if (expo.retry) retryableErr = true;
    }

    if (successCount > 0) {
      await admin
        .from("notifications_queue")
        .update({ fired: true, fired_at: new Date().toISOString() })
        .eq("id", row.id);
      sent++;
    } else if (retryableErr) {
      // Leave unfired — cron will retry next minute
      failed++;
    } else {
      // All subs were dead/removed — nothing left to notify, mark fired
      await admin
        .from("notifications_queue")
        .update({ fired: true, fired_at: new Date().toISOString() })
        .eq("id", row.id);
      skipped++;
    }
  }

  console.log(`Done: processed=${rows.length} sent=${sent} failed=${failed} skipped=${skipped}`);
  return json({ processed: rows.length, sent, failed, skipped });
});
