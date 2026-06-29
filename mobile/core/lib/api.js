const SUPA_URL = "https://yahimlivfieuknagusxp.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhaGltbGl2ZmlldWtuYWd1c3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3ODYwNDIsImV4cCI6MjA5MzM2MjA0Mn0._5_t5k1NCAHAFHEz0clqD8fSxsNCMzlqBoRPSmD7wxs";

// Dev-only logger. console.warn/console.error remain unguarded (they matter
// for prod debugging); console.log was leaking 12+ "[auth] getSession boot"
// lines per page load in production.
const logDev = (...args) => { if (__DEV__) console.log(...args); };

// Memoize the in-flight refresh. Without this, parallel 401s (e.g. boot-time
// Promise.all reads, or rapid card-click saves) each trigger their own
// /token POST, all of which race to overwrite localStorage. With this, all
// concurrent callers await the same promise and a single refresh runs.
let inFlightRefresh = null;

export async function refreshSession() {
  if (inFlightRefresh) return inFlightRefresh;
  inFlightRefresh = (async () => {
    const refreshToken = localStorage.getItem("sb_refresh_token");
    logDev("[auth] refreshSession — refresh token present:", !!refreshToken);
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPA_KEY },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      logDev("[auth] refresh endpoint status:", res.status);
      if (res.ok) {
        const d = await res.json();
        if (d.access_token) {
          localStorage.setItem("sb_token", d.access_token);
          if (d.refresh_token) localStorage.setItem("sb_refresh_token", d.refresh_token);
          logDev("[auth] refresh succeeded — new_refresh_token present:", !!d.refresh_token);
          return d.access_token;
        }
        console.warn("[auth] refresh ok but no access_token in body:", JSON.stringify(d));
      } else {
        const body = await res.json().catch(() => ({}));
        console.error("[auth] refresh failed:", res.status, JSON.stringify(body));
      }
    } catch (e) {
      console.error("[auth] refresh fetch threw:", e);
    }
    return null;
  })().finally(() => { inFlightRefresh = null; });
  return inFlightRefresh;
}

export async function supa(method, path, body, token) {
  const url = `${SUPA_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    "apikey": SUPA_KEY,
    "Authorization": `Bearer ${token || SUPA_KEY}`,
    "Prefer": "resolution=merge-duplicates,return=representation",
  };

  // keepalive lets writes survive PWA force-close mid-fetch. The browser keeps
  // the request alive after the page unloads (capped at 64KB body, which is
  // well above what we send). GETs are read-only so it doesn't matter, but we
  // pay the kept-alive overhead only for non-GETs to match intent.
  const keepalive = method !== "GET";
  const init = { method, headers, body: body ? JSON.stringify(body) : undefined, keepalive };

  let res = await fetch(url, init);

  if (res.status === 401 && token) {
    const newToken = await refreshSession();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(url, init);
    }
  }

  if (!res.ok) {
    let detail = null;
    try { detail = await res.json(); } catch {}
    const err = new Error(`Request failed: ${res.status}`);
    err.status = res.status;
    err.detail = detail;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function getSession() {
  const token = localStorage.getItem("sb_token");
  const storedRefresh = localStorage.getItem("sb_refresh_token");
  logDev("[auth] getSession boot — access_token:", !!token, "refresh_token:", !!storedRefresh);

  if (!token && !storedRefresh) {
    logDev("[auth] no credentials — showing sign-in");
    return null;
  }

  if (token) {
    try {
      const res = await fetch(`${SUPA_URL}/auth/v1/user`, {
        headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${token}` },
      });
      logDev("[auth] /user with access_token →", res.status);
      if (res.ok) { const d = await res.json(); return d.id ? d : null; }
      if (res.status !== 401 && res.status !== 403) {
        console.warn("[auth] unexpected /user status, not retrying:", res.status);
        return null;
      }
    } catch (e) {
      console.warn("[auth] /user fetch threw, falling through to refresh:", e);
    }
  }

  logDev("[auth] access_token expired or missing — attempting refresh...");
  if (!storedRefresh) {
    logDev("[auth] no refresh token — showing sign-in");
    return null;
  }
  const newToken = await refreshSession();
  if (!newToken) {
    logDev("[auth] refresh returned null — showing sign-in");
    return null;
  }

  try {
    const res = await fetch(`${SUPA_URL}/auth/v1/user`, {
      headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${newToken}` },
    });
    logDev("[auth] /user after refresh →", res.status);
    if (res.ok) { const d = await res.json(); return d.id ? d : null; }
  } catch (e) {
    console.error("[auth] /user retry threw:", e);
  }
  logDev("[auth] all paths exhausted — showing sign-in");
  return null;
}

export async function signUp(email, password) {
  const res = await fetch(`${SUPA_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPA_KEY },
    body: JSON.stringify({ email, password }),
  });
  const d = await res.json();
  if (!res.ok) {
    const text = d?.error_description || d?.msg || d?.error || "";
    if (/already registered|already exists/i.test(text)) throw new Error("EMAIL_TAKEN");
    throw new Error("SIGNUP_FAILED");
  }
  localStorage.setItem("sb_token", d.access_token);
  if (d.refresh_token) localStorage.setItem("sb_refresh_token", d.refresh_token);
  return { user: d.user, session: d };
}

export async function signInPassword(email, password) {
  const res = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPA_KEY },
    body: JSON.stringify({ email, password }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error("INVALID_CREDENTIALS");
  localStorage.setItem("sb_token", d.access_token);
  if (d.refresh_token) localStorage.setItem("sb_refresh_token", d.refresh_token);
  logDev("[auth] signIn — access_token stored:", !!d.access_token, "refresh_token stored:", !!d.refresh_token);
  return { user: d.user, session: d };
}

export function signOut() {
  localStorage.removeItem("sb_token");
  localStorage.removeItem("sb_refresh_token");
}

// Triggers Supabase's password-recovery email. Supabase intentionally returns
// 200 whether or not the address is registered — to avoid leaking which emails
// have accounts — so we don't surface registered/unregistered to the UI.
// `redirectTo` should be the production URL Supabase will append the recovery
// hash to (#access_token=…&type=recovery). It must also be whitelisted in the
// Supabase dashboard under Auth → URL Configuration → Redirect URLs.
export async function requestPasswordReset(email, redirectTo) {
  const res = await fetch(`${SUPA_URL}/auth/v1/recover`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPA_KEY },
    body: JSON.stringify({ email, ...(redirectTo ? { redirect_to: redirectTo } : {}) }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d?.msg || "RESET_REQUEST_FAILED");
  }
  return true;
}

// Protocols
export const dbGetProtocols    = (userId, t) => supa("GET",  `/rest/v1/protocols?user_id=eq.${userId}&select=*&order=created_at.asc`, null, t);
export const dbAddProtocol     = (p, t)    => supa("POST",   "/rest/v1/protocols", p, t);
// Defense-in-depth: filter by both id AND user_id so a client can't PATCH a
// protocol owned by someone else even if the server's RLS policy is wrong
// or absent. The `id=eq` is the natural key; `user_id=eq` is the guard.
export const dbUpdateProtocol  = (p, t)    => supa("PATCH",  `/rest/v1/protocols?id=eq.${p.id}&user_id=eq.${p.user_id}`, { name: p.name, status: p.status, treatment_mode: p.treatment_mode, starts_at: p.starts_at ?? null, ends_at: p.ends_at ?? null, updated_at: new Date().toISOString() }, t);
export const dbDeleteProtocol  = (id, t)   => supa("DELETE", `/rest/v1/protocols?id=eq.${id}`, null, t);

const dbResetProtocolSupps = (protocolId, t) =>
  supa("PATCH", `/rest/v1/supplements?protocol_id=eq.${protocolId}`, { status: 'active', paused: false, updated_at: new Date().toISOString() }, t);

export const dbArchiveProtocol = async (protocolId, t) => {
  await dbResetProtocolSupps(protocolId, t);
  return supa("PATCH", `/rest/v1/protocols?id=eq.${protocolId}`, { status: 'archived', updated_at: new Date().toISOString() }, t);
};
export const dbActivateProtocol = (protocolId, t) =>
  supa("PATCH", `/rest/v1/protocols?id=eq.${protocolId}`, { status: 'active', updated_at: new Date().toISOString() }, t);

// Supplements
// Reads filter out soft-deleted rows (deleted_at IS NULL) so the cockpit never
// shows deleted supps. Past-day adherence math iterates over this filtered set,
// so removed supps stop contributing to historical denominators — same
// "delete = it never happened in your live view" semantic as before, but the
// row is preserved in the DB for future audit-log / undo work.
export const dbGetSupps     = (userId, t) => supa("GET",  `/rest/v1/supplements?user_id=eq.${userId}&deleted_at=is.null&select=*&order=created_at.asc`, null, t);
export const dbAddSupp      = (s, t)    => supa("POST",   "/rest/v1/supplements", s, t);
export const dbUpdateSupp   = (s, t)    => supa("PATCH",  `/rest/v1/supplements?id=eq.${s.id}`, { name: s.name, dose: s.dose, notes: s.notes, slots: s.slots, days: s.days, category: s.category, paused: s.paused ?? false, status: s.status ?? 'active', stopped_at: s.stopped_at ?? null, protocol_id: s.protocol_id ?? null, treatment_mode: s.treatment_mode ?? "indefinite", starts_at: s.starts_at ?? null, ends_at: s.ends_at ?? null, cycle_on_value: s.cycle_on_value ?? null, cycle_on_unit: s.cycle_on_unit ?? null, cycle_off_value: s.cycle_off_value ?? null, cycle_off_unit: s.cycle_off_unit ?? null, pause_intervals: s.pause_intervals ?? [], pinned_time: s.pinned_time ?? null, updated_at: new Date().toISOString() }, t);
// User-facing delete — soft. Sets deleted_at = now(); row stays in DB but
// disappears from dbGetSupps reads. Use this for any user-initiated removal.
export const dbDeleteSupp   = (id, t)   => supa("PATCH",  `/rest/v1/supplements?id=eq.${id}`, { deleted_at: new Date().toISOString() }, t);
// Hard delete — for cascade cleanup (orphans on protocol delete) and rollback
// paths (failed bulk insert). Not user-reachable.
export const dbHardDeleteSupp = (id, t) => supa("DELETE", `/rest/v1/supplements?id=eq.${id}`, null, t);
export const dbGetLog       = (userId, date, t) => supa("GET",    `/rest/v1/daily_logs?user_id=eq.${userId}&select=*&log_date=eq.${date}`, null, t).then(r => r?.[0] || null);
export const dbUpsertLog    = (log, t)  => supa("POST",   "/rest/v1/daily_logs?on_conflict=user_id,log_date", log, t);
// user_schedule needs an explicit user_id filter on the read — without it
// PostgREST returns rows for every user (row-level security isn't blocking
// the SELECT), and `[0]` then returns a random other user's schedule.
// On save we also delete any older rows for the same user before inserting
// the new one, in case duplicates leaked through prior buggy upserts.
export const dbGetSchedule  = (userId, t) => supa("GET",    `/rest/v1/user_schedule?user_id=eq.${userId}&select=*&order=updated_at.desc.nullslast,created_at.desc`, null, t).then(r => r?.[0] || null);
export const dbSaveSchedule = async (data, t) => {
  // Capture the browser's IANA timezone on every save so the daily pg_cron
  // refill of notifications_queue knows what timezone to compute slot times
  // in. Without this the cron job has no way to know whether "8:00 AM" means
  // Denver, Bogotá, or UTC. Updated on every save so it tracks the user's
  // current device — if they travel and re-save their schedule, the cron
  // catches up.
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Read the existing row BEFORE delete so we can preserve columns that
  // aren't controlled by the schedule form (notifications_enabled, etc.).
  // Without this preservation step, the DELETE-then-INSERT cycle silently
  // reset notifications_enabled to FALSE on every schedule save — the bug
  // that took down Bego's notifications on May 18, discovered May 19 evening.
  const existing = await supa("GET", `/rest/v1/user_schedule?user_id=eq.${data.user_id}&select=notifications_enabled,adaptive_timing`, null, t).catch(() => []);
  const preservedFlags = {
    notifications_enabled: existing?.[0]?.notifications_enabled ?? data.notifications_enabled ?? false,
    // Adaptive timing is a per-user behavior flag (like notifications_enabled).
    // The DELETE+INSERT cycle would reset it without this preservation. A value
    // passed in `data` (the schedule editor saving a fresh choice) wins over the
    // existing DB value so the toggle can be changed in the same save.
    adaptive_timing: data.adaptive_timing ?? existing?.[0]?.adaptive_timing ?? false,
  };
  await supa("DELETE", `/rest/v1/user_schedule?user_id=eq.${data.user_id}`, null, t).catch(() => {});
  return supa("POST", "/rest/v1/user_schedule", { ...data, ...preservedFlags, timezone, updated_at: new Date().toISOString() }, t);
};

export const dbUpdateScheduleField = (field, value, userId, token) =>
  supa("PATCH", `/rest/v1/user_schedule?user_id=eq.${userId}`, { [field]: value }, token);

// Returns true on success so callers can show a quiet "notifications won't
// fire" hint if the edge function rejected the request. Most callers
// fire-and-forget; in App.jsx `recomputeAfterEnable` toasts on failure.
//
// Takes no token: reads the current access_token from localStorage at call
// time and retries once on 401 via refreshSession(). It deliberately does NOT
// accept a caller-passed token — by the time recompute fires (e.g. after a supp
// edit) the supa() refresh-on-401 path may have minted a newer token, and
// trusting a caller's stale snapshot 401'd every background recompute. See
// Jun 3 2026 fix in this file's git log.
export async function recomputeNotifications() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // NOTE: recompute_notifications runs with verify_jwt=false (see
  // supabase/config.toml), so the Supabase gateway does NOT require an `apikey`
  // header — the function verifies the user JWT internally via getUser(). The
  // June 3 "apikey for parity" addition only forced a CORS preflight asking to
  // send `apikey`, which the function's Access-Control-Allow-Headers never
  // listed → the browser blocked every JWT-mode recompute with
  // "TypeError: Load failed". Dropping it lets the preflight pass (Authorization
  // + Content-Type are both allowed). See Jun 15 2026 fix.
  const call = (jwt) => fetch(`${SUPA_URL}/functions/v1/recompute_notifications`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ timezone }),
  });
  try {
    let jwt = localStorage.getItem("sb_token") || "";
    let res = await call(jwt);
    if (res.status === 401) {
      const refreshed = await refreshSession();
      if (refreshed) res = await call(refreshed);
    }
    if (!res.ok) {
      console.error("Recompute failed:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("Recompute error:", e);
    return false;
  }
}

export const dbGetDailyLogsRange     = (userId, start, end, t) => supa("GET", `/rest/v1/daily_logs?user_id=eq.${userId}&select=*&log_date=gte.${start}&log_date=lte.${end}`, null, t);

// Filter by user so autocomplete only suggests this user's prior names (RLS
// not enforced at DB; without the filter every user sees everyone's history).
export const dbGetSupplementHistory  = (userId, t) => supa("GET",  `/rest/v1/user_supplement_history?user_id=eq.${userId}&select=name&order=created_at.desc`, null, t);
// Include user_id in the body — without it the row inserts as user_id=NULL,
// the on_conflict check then never matches (NULL ≠ NULL in SQL), and the
// table fills up with duplicates that pollute autocomplete.
export const dbAddSupplementHistory  = (userId, name, t) => supa("POST", "/rest/v1/user_supplement_history?on_conflict=user_id,name", { user_id: userId, name }, t);

export const dbGetProfile    = (userId, t)       => supa("GET",   `/rest/v1/user_profiles?id=eq.${userId}&select=*`, null, t).then(r => r?.[0] || null);
export const dbCreateProfile = (data, t)         => supa("POST",  "/rest/v1/user_profiles", data, t);
export const dbUpdateProfile = (userId, data, t) => supa("PATCH", `/rest/v1/user_profiles?id=eq.${userId}`, data, t);

export async function getThemePreference(userId, token) {
  const rows = await supa("GET", `/rest/v1/user_profiles?id=eq.${userId}&select=theme_preference`, null, token);
  const pref = rows?.[0]?.theme_preference;
  // Mirrors VALID_PREFS in src/lib/theme.jsx — achromatic is the only valid
  // production value. Returning null lets the caller fall back cleanly.
  return pref === "achromatic" ? pref : null;
}

// Clinician helpers
export const dbGetMyPatients    = (clinicianId, t)              => supa("GET", `/rest/v1/user_profiles?clinician_user_id=eq.${clinicianId}&select=*`, null, t);
export const dbGetPatientLogs   = (patientId, start, end, t)   => supa("GET", `/rest/v1/daily_logs?user_id=eq.${patientId}&log_date=gte.${start}&log_date=lte.${end}&select=*`, null, t);
export const dbSendProtocol     = (send, t)                     => supa("POST", "/rest/v1/protocol_sends", send, t);
// Patient-side view: protocols sent TO this user. Filter by patient_id so we
// don't return sends meant for other patients (RLS not enforced at DB level).
export const dbGetReceivedProtocols = (patientId, t)            => supa("GET", `/rest/v1/protocol_sends?patient_id=eq.${patientId}&status=eq.pending&select=*`, null, t);
export const dbUpdateProtocolSend   = (id, data, t)             => supa("PATCH", `/rest/v1/protocol_sends?id=eq.${id}`, data, t);

// Peer-to-peer protocol send: resolves an email to a user id via the
// lookup_user_by_email RPC (SECURITY DEFINER server-side function, see
// SQL migration in ORIGIN-HANDOFF.md). Returns { user_id, display_name }
// for a match or null if no Origin user has that email. The trim/lowercase
// happens server-side so casing/whitespace in the input doesn't miss matches.
export const dbLookupUserByEmail = async (email, t) => {
  const rows = await supa("POST", "/rest/v1/rpc/lookup_user_by_email", { target_email: email }, t);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
};

// Fire-and-forget notify edge function for peer-to-peer sends. Best-effort —
// the send itself already succeeded before this is called; push failure
// shouldn't undo the send. The function reads the protocol_send row,
// fetches the recipient's push_subscriptions, and sends a one-shot web push.
// Logs the response shape to console so push failures are visible during
// development without needing to dig through the Network tab.
export const dbNotifyProtocolSent = async (protocolSendId, senderName, t) => {
  try {
    const res = await fetch(`${SUPA_URL}/functions/v1/notify_protocol_sent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPA_KEY,
        'Authorization': `Bearer ${t}`,
      },
      body: JSON.stringify({ protocol_send_id: protocolSendId, sender_name: senderName }),
    });
    const text = await res.text();
    console.log('[push] notify_protocol_sent response', res.status, text);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    return text;
  } catch (err) {
    console.warn('[push] notify_protocol_sent failed', err);
    throw err;
  }
};

// ── Clinician-private notes + archive (Phase 4) ─────────────────────────
// The clinician_patient_notes table is RLS-restricted to the owning clinician.
// Patients cannot read or write it. One row per (clinician, patient) pair.
export const dbGetClinicianNote = (clinicianId, patientId, t) =>
  supa("GET", `/rest/v1/clinician_patient_notes?clinician_id=eq.${clinicianId}&patient_id=eq.${patientId}&select=*`, null, t)
    .then(r => r?.[0] || null);

// Upsert relies on the unique (clinician_id, patient_id) index and the
// global Prefer=resolution=merge-duplicates header in `supa`. Pass any
// subset of {notes, archived_at} along with clinician_id + patient_id.
export const dbUpsertClinicianNote = (row, t) =>
  supa("POST", "/rest/v1/clinician_patient_notes?on_conflict=clinician_id,patient_id", row, t);

// All clinician_patient_notes rows owned by this clinician. Used to
// derive the archived-patients view in the sidebar.
export const dbGetClinicianNotes = (clinicianId, t) =>
  supa("GET", `/rest/v1/clinician_patient_notes?clinician_id=eq.${clinicianId}&select=*`, null, t);

export async function setThemePreference(pref, userId, token) {
  await supa("PATCH", `/rest/v1/user_profiles?id=eq.${userId}`, { theme_preference: pref }, token);
  return pref;
}

export async function updateEmail(newEmail, token) {
  const res = await fetch(`${SUPA_URL}/auth/v1/user`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "apikey": SUPA_KEY, "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ email: newEmail }),
  });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d?.msg || "EMAIL_UPDATE_FAILED"); }
  return res.json();
}

export async function updatePassword(newPassword, token) {
  const res = await fetch(`${SUPA_URL}/auth/v1/user`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "apikey": SUPA_KEY, "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ password: newPassword }),
  });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d?.msg || "PASSWORD_UPDATE_FAILED"); }
  return res.json();
}
