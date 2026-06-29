import { useEffect, useRef, useState } from 'react';
import { ScrollView, View, RefreshControl, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Library, Plus, Pencil } from 'lucide-react-native';
import {
  dbGetProtocols,
  dbAddProtocol,
  dbArchiveProtocol,
  dbActivateProtocol,
  dbUpdateProtocol,
  dbDeleteProtocol,
  dbGetSupps,
  dbGetSchedule,
  dbGetProfile,
  dbGetDailyLogsRange,
  dbUpsertLog,
  dbAddSupp,
  dbUpdateSupp,
  dbDeleteSupp,
  dbHardDeleteSupp,
  dbSaveSchedule,
  dbSendProtocol,
  dbLookupUserByEmail,
  dbNotifyProtocolSent,
  dbGetReceivedProtocols,
  dbUpdateProtocolSend,
  supa,
} from 'shared/lib/api';
import {
  dateKey,
  startOfDay,
  TODAY,
  fmtTime,
  shortDate,
  parseHHMM,
  isSupplementActiveOn,
  isStoppedSupp,
  isPausedSupp,
  withPauseStarted,
  withPauseEnded,
  scheduleOn,
  withScheduleChange,
} from 'shared/lib/time';
import { DEFAULT_CONFIG, deriveOffsets, getSlotLabelForMode, makeCheckKey, computeAdaptiveDelta } from 'shared/config';
import { SLOTS, IF_SLOTS } from 'shared/lib/notifications';
import { getSlotTime, slotStatus } from '../lib/schedule';
import { readCache, writeCache } from '../lib/cache';
import { requestNotificationPermission, rescheduleSlotReminders, cancelAllReminders } from '../lib/notifications';
import { tapHaptic } from '../lib/haptics';
import { theme, spacing, typography, icon as iconSize, touch, fonts } from '../theme';
import { Heading, Text, Button, Cursor, InlineTip } from '../components';
import Hero from '../components/Hero';
import SlotCard from '../components/SlotCard';
import WeekStrip from '../components/WeekStrip';
import Modal from '../components/Modal';
import EditForm from '../components/EditForm';
import Loader from '../components/Loader';
import OriginGlyph from '../components/OriginGlyph';
import InlineLoader from '../components/InlineLoader';
import { useToast } from '../components/Toast';
import SettingsScreen from './SettingsScreen';
import ProtocolLibrary from './ProtocolLibrary';
import ProtocolDetailScreen from './ProtocolDetailScreen';
import SlideScreen from '../components/SlideScreen';
import IconButton from '../components/IconButton';

const ANYTIME_SLOT = { id: 'anytime', label: 'Anytime', sublabel: 'No specific time', icon: '◦' };

// Day-1 inline tip per schedule mode — shows once in the empty state to teach the
// scheduling mental model in context, then never returns (RN port of web DAY1_TIP).
const DAY1_TIP = {
  medication: { label: 'how anchors work', body: 'each morning, tap "start my day" to set today\'s anchor. origin cascades pre-meal, meal, and evening items from there.' },
  wakeup: { label: 'how anchors work', body: 'each morning, tap "start my day" to set today\'s anchor. origin cascades pre-meal, meal, and evening items from there.' },
  fasting: { label: 'how your day works', body: 'items appear in slots based on your eating window. origin schedules pre-meal items, meals, and evening items from the window you set.' },
  fixed: { label: 'how your day works', body: 'items appear at the fixed times you set. edit them anytime from settings.' },
};

const addDays = (d, n) => { const r = new Date(d.getTime()); r.setDate(r.getDate() + n); return r; };
// Rolling 7-day window ENDING at `end` (today is the last cell) — matches App.jsx.
const getWeekDatesEndingAt = (end) => { const start = addDays(end, -6); return Array.from({ length: 7 }, (_, i) => addDays(start, i)); };
const formatWeekRange = (start, end) => {
  const sm = start.toLocaleDateString('en-US', { month: 'short' });
  const em = end.toLocaleDateString('en-US', { month: 'short' });
  const s = sm === em ? `${sm} ${start.getDate()} – ${end.getDate()}` : `${sm} ${start.getDate()} – ${em} ${end.getDate()}`;
  return s.toUpperCase();
};
const sliceForDay = (checked, dk) => {
  const out = {};
  const prefix = `${dk}_`;
  for (const k of Object.keys(checked)) if (k.startsWith(prefix)) out[k] = checked[k];
  return out;
};

// Avatar = a sharp 1px mono box with the initial. Square, not a round disc —
// it obeys the app's own zero-radius rule instead of the default Gmail/Slack
// circle-chip, and matches the square icon-buttons sitting beside it.
function Avatar({ initial, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Settings"
      style={{ width: touch.min, height: touch.min, borderWidth: 1, borderColor: theme.border.strong, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text weight="medium" size="body">{initial}</Text>
    </Pressable>
  );
}

export default function Today({ user, onSignOut }) {
  const [loading, setLoading] = useState(true);
  const [supps, setSupps] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [profile, setProfile] = useState(null);
  const [scheduleMode, setScheduleMode] = useState('none');
  const [scheduleConfig, setScheduleConfig] = useState(DEFAULT_CONFIG);
  const [anchorBehavior, setAnchorBehavior] = useState('flexible');
  const [consistentTime, setConsistentTime] = useState('07:00');
  const [adaptiveEnabled, setAdaptiveEnabled] = useState(false);
  const [checked, setChecked] = useState({});
  const [pillTimes, setPillTimes] = useState({});
  const [weekLogs, setWeekLogs] = useState([]);
  const [viewDate, setViewDate] = useState(TODAY);
  const [viewedWeekEnd, setViewedWeekEnd] = useState(TODAY);
  const [pastDayEditing, setPastDayEditing] = useState(false);
  const [flashGreen, setFlashGreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [detailProtocol, setDetailProtocol] = useState(null);
  const [remindersEnabled, setRemindersEnabled] = useState(() => global.localStorage.getItem('reminders_enabled') === '1');
  const [logAtTarget, setLogAtTarget] = useState(null); // { sid, suppId } — "log at…" picker
  const [logAtDate, setLogAtDate] = useState(() => new Date());
  const [eatingWindowOpens, setEatingWindowOpens] = useState({}); // dk → 'HH:MM' (Flexible IF)
  const [eatingWindowCloses, setEatingWindowCloses] = useState({});
  const [anchorEditOpen, setAnchorEditOpen] = useState(false); // edit "Started at HH:MM"
  const [anchorEditDate, setAnchorEditDate] = useState(() => new Date());
  // Add/Edit supplement form
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const { show: showToast } = useToast();
  const insets = useSafeAreaInsets();
  const token = () => global.localStorage.getItem('sb_token');
  const savedDay = useRef({});
  const loadedDays = useRef(new Set());
  const saveTimer = useRef(null);
  const pendingByDk = useRef({});
  const didMount = useRef(false);

  const dk = dateKey(viewDate);
  const viewDay = viewDate.getDay();

  // Gentle fade of the day's content when you switch days.
  const dayFade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    dayFade.setValue(0.35);
    Animated.timing(dayFade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [dk]); // eslint-disable-line react-hooks/exhaustive-deps
  const isToday = dk === dateKey(TODAY);
  const isFuture = startOfDay(viewDate) > TODAY;
  const isPast = !isToday && startOfDay(viewDate) < TODAY;
  const isDay1 = !!profile?.created_at && dateKey(new Date(profile.created_at)) === dateKey(TODAY);
  const editable = isToday || (isPast && pastDayEditing);
  const readOnly = !editable;

  function mergeDayLog(row, dayKey) {
    loadedDays.current.add(dayKey);
    const dayChecked = row?.checked || {};
    setChecked((c) => ({ ...c, ...dayChecked }));
    const pill = row?.pill_time ? row.pill_time.slice(0, 5) : null;
    if (pill) setPillTimes((p) => ({ ...p, [dayKey]: pill }));
    const ewo = row?.eating_window_open ? row.eating_window_open.slice(0, 5) : null;
    const ewc = row?.eating_window_close ? row.eating_window_close.slice(0, 5) : null;
    if (ewo) setEatingWindowOpens((m) => ({ ...m, [dayKey]: ewo }));
    if (ewc) setEatingWindowCloses((m) => ({ ...m, [dayKey]: ewc }));
    savedDay.current[dayKey] = JSON.stringify({ slice: dayChecked, pill, ewo, ewc });
  }

  async function fetchWeek(end) {
    const dates = getWeekDatesEndingAt(end);
    const rows = await dbGetDailyLogsRange(user.id, dateKey(dates[0]), dateKey(dates[6]), token()).catch(() => []);
    setWeekLogs(rows || []);
    return rows || [];
  }

  // Push a fetched-or-cached dataset into state. Shared by the offline-cache
  // hydration and the live network load so both paths populate identically.
  function applyStatic({ protos, supps: s, sched, prof, rows }) {
    setProtocols(protos || []);
    setProfile(prof ?? null);
    setSupps((s || []).map((x) => ({ ...x, paused: x.paused ?? false })));

    if (sched?.schedule_type) setScheduleMode(sched.schedule_type);
    setAdaptiveEnabled(sched?.adaptive_timing === true);
    let behavior = 'flexible';
    let cTime = '07:00';
    if (sched?.offsets) {
      const { _anchor_behavior, _consistent_time, ...savedConfig } = sched.offsets;
      if (_anchor_behavior) { behavior = _anchor_behavior; setAnchorBehavior(_anchor_behavior); }
      if (_consistent_time) { cTime = _consistent_time; setConsistentTime(_consistent_time); }
      setScheduleConfig({
        ...DEFAULT_CONFIG,
        ...savedConfig,
        fixed_times: { ...DEFAULT_CONFIG.fixed_times, ...(savedConfig.fixed_times || {}) },
      });
    }

    setWeekLogs(rows || []);
    const todayKey = dateKey(TODAY);
    const todayRow = (rows || []).find((l) => l.log_date === todayKey) || null;
    if (behavior === 'consistent' && !todayRow?.pill_time) setPillTimes((p) => ({ ...p, [todayKey]: cTime }));
    mergeDayLog(todayRow, todayKey);
  }

  async function loadStatic() {
    // Hydrate instantly from the last offline snapshot so a cold/offline launch
    // shows real content. If there's no cache yet, fall back to the loader.
    const cached = readCache(user.id);
    if (cached) { applyStatic(cached); setLoading(false); } else setLoading(true);
    try {
      const t = token();
      const [protos, s, sched, prof] = await Promise.all([
        dbGetProtocols(user.id, t).catch(() => []),
        dbGetSupps(user.id, t),
        dbGetSchedule(user.id, t),
        dbGetProfile(user.id, t).catch(() => null),
      ]);
      const dates = getWeekDatesEndingAt(viewedWeekEnd);
      const rows = await dbGetDailyLogsRange(user.id, dateKey(dates[0]), dateKey(dates[6]), t).catch(() => []);
      const snapshot = { protos, supps: s, sched, prof, rows };
      applyStatic(snapshot);
      writeCache(user.id, snapshot);
    } catch (e) {
      // Offline / fetch failed — keep whatever the cache hydrated (or defaults).
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStatic(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    fetchWeek(viewedWeekEnd);
  }, [viewedWeekEnd]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (loading) return;
    if (loadedDays.current.has(dk)) return;
    const row = weekLogs.find((l) => l.log_date === dk) || null;
    if (row || weekLogs.length) mergeDayLog(row, dk);
  }, [dk, weekLogs, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setPastDayEditing(false); }, [dk]);

  useEffect(() => {
    if (loading || (isPast && !pastDayEditing)) return; // never autosave a read-only past day
    const slice = sliceForDay(checked, dk);
    const pill = pillTimes[dk] || null;
    const ewo = eatingWindowOpens[dk] || null;
    const ewc = eatingWindowCloses[dk] || null;
    const snapshot = JSON.stringify({ slice, pill, ewo, ewc });
    if (snapshot === savedDay.current[dk]) { delete pendingByDk.current[dk]; return; }
    const payload = { user_id: user.id, log_date: dk, pill_time: pill, eating_window_open: ewo, eating_window_close: ewc, checked: slice };
    const doSave = () => dbUpsertLog(payload, token()).then(() => { savedDay.current[dk] = snapshot; delete pendingByDk.current[dk]; }).catch(() => {});
    pendingByDk.current[dk] = doSave;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(doSave, 400);
    return () => clearTimeout(saveTimer.current);
  }, [checked, pillTimes, eatingWindowOpens, eatingWindowCloses, dk, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // F7 — flush the PREVIOUS day's pending save immediately when the viewed day
  // changes, so rapid-toggle-then-navigate never silently drops edits.
  const prevDkRef = useRef(dk);
  useEffect(() => {
    const prev = prevDkRef.current;
    if (prev !== dk) { const pend = pendingByDk.current[prev]; if (pend) pend(); prevDkRef.current = dk; }
  }, [dk]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const activeProtocolIds = new Set(protocols.filter((p) => p.status === 'active').map((p) => p.id));
  const homeSupps = supps.filter(
    (s) => !isStoppedSupp(s) && isSupplementActiveOn(s, viewDate) && (!s.protocol_id || activeProtocolIds.has(s.protocol_id))
  );
  const slotOffsets = scheduleMode === 'fixed' || scheduleMode === 'fasting' ? null : deriveOffsets(scheduleMode, scheduleConfig);
  const pillTime = pillTimes[dk] || null;
  const effectivePillTime =
    scheduleMode === 'fixed' ? pillTime || '00:00' : anchorBehavior === 'consistent' ? pillTime || consistentTime : pillTime;
  // Adaptive timing — re-flow downstream anchor slots off the user's actual log
  // times (medication/wakeup, today only, when the toggle is on).
  const adaptiveActive = adaptiveEnabled && isToday && (scheduleMode === 'medication' || scheduleMode === 'wakeup');
  let adaptiveInfo = null;
  if (adaptiveActive && effectivePillTime && slotOffsets) {
    const eligible = { rx: 0 };
    for (const sid of Object.keys(slotOffsets)) {
      const off = slotOffsets[sid];
      if (off === null || off === undefined) continue;
      if (sid === 'after_dinner' && scheduleConfig.evening_mode !== undefined) continue; // absolute evening slot
      eligible[sid] = off;
    }
    const [ah, am] = effectivePillTime.split(':').map(Number);
    adaptiveInfo = computeAdaptiveDelta(eligible, ah * 60 + am, checked, dk);
  }
  const ctx = { scheduleMode, scheduleConfig, effectivePillTime, slotOffsets, isToday, isFuture, dk, eatingWindowOpens, adaptiveInfo };

  const isChecked = (sid, suppId) => {
    const v = checked[makeCheckKey(dk, sid, suppId)];
    return v === true || (v && typeof v === 'object' && v.checked) || false;
  };
  const checkedAtTime = (sid, suppId) => {
    const v = checked[makeCheckKey(dk, sid, suppId)];
    return v && typeof v === 'object' ? v.at || null : null;
  };
  const toggleCheck = (sid, suppId) => {
    if (readOnly) return;
    tapHaptic();
    const k = makeCheckKey(dk, sid, suppId);
    setChecked((c) => {
      const on = c[k] === true || (c[k] && typeof c[k] === 'object' && c[k].checked);
      if (on) { const { [k]: _omit, ...rest } = c; return rest; }
      // Adaptive on → stamp the actual time so downstream slots can re-flow.
      return { ...c, [k]: adaptiveActive ? { checked: true, at: fmtTime(new Date()) } : true };
    });
  };
  // "Log at…" — record a check WITH a specific clock time (for items taken at a
  // different time than now). Stored as { checked, at } so checkedAtTime reads it.
  const logCheckAt = (sid, suppId, atTime) => {
    if (readOnly) return;
    setChecked((c) => ({ ...c, [makeCheckKey(dk, sid, suppId)]: { checked: true, at: atTime } }));
  };
  const openLogAt = (sid, suppId) => {
    if (readOnly) return;
    setLogAtDate(new Date());
    setLogAtTarget({ sid, suppId });
  };
  const confirmLogAt = () => {
    if (logAtTarget) logCheckAt(logAtTarget.sid, logAtTarget.suppId, fmtTime(logAtDate));
    setLogAtTarget(null);
  };

  // Flexible-IF eating window — tap to stamp the actual open/close time. The
  // autosave persists it (eating_window deps), and getSlotTime re-anchors meals.
  const openEatingWindow = () => {
    if (readOnly) return;
    setEatingWindowOpens((m) => ({ ...m, [dk]: fmtTime(new Date()) }));
    setFlashGreen(true);
    setTimeout(() => setFlashGreen(false), 600);
  };
  const closeEatingWindow = () => {
    if (readOnly) return;
    setEatingWindowCloses((m) => ({ ...m, [dk]: fmtTime(new Date()) }));
  };

  // Anchor-time edit ("Started at HH:MM" → edit). Updating pillTimes[dk] re-flows
  // the cascade and the autosave persists the new pill_time.
  const onEditAnchor = () => {
    const d = new Date();
    if (effectivePillTime) { const [h, mi] = effectivePillTime.split(':').map(Number); d.setHours(h, mi, 0, 0); }
    setAnchorEditDate(d);
    setAnchorEditOpen(true);
  };
  const confirmAnchorEdit = () => {
    setPillTimes((pt) => ({ ...pt, [dk]: fmtTime(anchorEditDate) }));
    setAnchorEditOpen(false);
  };
  const takeAllInSlot = (sid, list) => {
    if (readOnly) return;
    tapHaptic();
    setChecked((c) => {
      const n = { ...c };
      for (const s of list) {
        const k = makeCheckKey(dk, sid, s.id);
        const on = n[k] === true || (n[k] && typeof n[k] === 'object' && n[k].checked);
        if (!on) n[k] = adaptiveActive ? { checked: true, at: fmtTime(new Date()) } : true;
      }
      return n;
    });
  };

  // Resolve each supp's slots/days AS OF the viewed day (slot_history) so a
  // schedule edit applies going forward and never rewrites past days.
  const inDay = (s) => { const d = scheduleOn(s, viewDate).days; return !Array.isArray(d) || d.includes(viewDay); };
  const getSuppsForSlot = (sid) => homeSupps.filter((s) => { const sl = scheduleOn(s, viewDate).slots; return Array.isArray(sl) && sl.includes(sid) && inDay(s); });

  const mealCount = scheduleConfig.meal_count ?? 3;
  const slotDefs =
    scheduleMode === 'fasting'
      ? IF_SLOTS.filter((s) => {
          if (s.id === 'pre_meal_2' || s.id === 'meal_2') return mealCount >= 2;
          if (s.id === 'pre_meal_3' || s.id === 'meal_3') return mealCount >= 3;
          if (s.id === 'evening') return !!scheduleConfig.evening_mode;
          return true;
        })
      : SLOTS;
  const coreSlotIds = slotDefs.map((s) => s.id);

  // Daily local-notification reminders — one per slot that has supps, at its
  // computed time. Reschedules when the times change; disabled → cancel all.
  const reminderSlots = remindersEnabled && isToday
    ? slotDefs
        .filter((sd) => getSuppsForSlot(sd.id).length > 0)
        .map((sd) => { const t = getSlotTime(sd.id, ctx); if (!t) return null; const names = getSuppsForSlot(sd.id).map((s) => s.name).filter(Boolean); return { label: sd.label, time: `${t.getHours()}:${t.getMinutes()}`, names }; })
        .filter(Boolean)
    : [];
  const reminderSig = JSON.stringify(reminderSlots);
  useEffect(() => {
    if (!remindersEnabled) { cancelAllReminders(); return; }
    if (reminderSlots.length) rescheduleSlotReminders(reminderSlots);
  }, [remindersEnabled, reminderSig]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleReminders = async (next) => {
    if (next) {
      const ok = await requestNotificationPermission();
      if (!ok) { showToast('allow notifications in ios settings', { tone: 'warning' }); return; }
    }
    global.localStorage.setItem('reminders_enabled', next ? '1' : '0');
    setRemindersEnabled(next);
    showToast(next ? 'reminders on' : 'reminders off', { tone: 'success' });
  };

  const anytimeSupps = homeSupps.filter((s) => { const sl = scheduleOn(s, viewDate).slots; return (!Array.isArray(sl) || sl.length === 0) && inDay(s); });
  const pinnedSupps = anytimeSupps.filter((s) => s.pinned_time);
  const untimedSupps = anytimeSupps.filter((s) => !s.pinned_time);
  // "Second dose": a supp in a timed slot AND with a pinned time — appears in its
  // slot AND gets a separate pinned card (checked in the 'anytime' namespace).
  const slottedPinnedSupps = homeSupps.filter((s) => { const sl = scheduleOn(s, viewDate).slots; return Array.isArray(sl) && sl.length > 0 && s.pinned_time && inDay(s); });

  let coreTotal = anytimeSupps.length + slottedPinnedSupps.length;
  let coreDone = 0;
  anytimeSupps.forEach((s) => { if (isChecked('anytime', s.id)) coreDone++; });
  slottedPinnedSupps.forEach((s) => { if (isChecked('anytime', s.id)) coreDone++; });
  coreSlotIds.forEach((sid) => {
    const sl = getSuppsForSlot(sid);
    coreTotal += sl.length;
    sl.forEach((s) => { if (isChecked(sid, s.id)) coreDone++; });
  });
  const pct = coreTotal > 0 ? Math.round((coreDone / coreTotal) * 100) : 0;

  // Next fixed slot (for the Hero "Next · …" line in fixed mode).
  let nextFixedSlot = null;
  if (scheduleMode === 'fixed' && isToday) {
    let earliest = null;
    const now = new Date();
    for (const sd of slotDefs) {
      if (getSuppsForSlot(sd.id).length === 0) continue;
      const t = getSlotTime(sd.id, ctx);
      if (!t || t <= now) continue;
      if (!earliest || t < earliest.t) earliest = { t, label: sd.label };
    }
    if (earliest) nextFixedSlot = { time: fmtTime(earliest.t), label: earliest.label };
  }

  const isAnchorMode = scheduleMode === 'medication' || scheduleMode === 'wakeup';
  function startDay() {
    if (isFuture) return;
    const now = fmtTime(new Date());
    setPillTimes((p) => ({ ...p, [dk]: now }));
    if (scheduleMode !== 'wakeup') {
      const rx = getSuppsForSlot('rx');
      setChecked((c) => { const n = { ...c }; rx.forEach((s) => { n[makeCheckKey(dk, 'rx', s.id)] = true; }); return n; });
    }
    setFlashGreen(true);
    setTimeout(() => setFlashGreen(false), 600);
  }

  // ── Add / edit supplement (ported from App.jsx) ─────────────────────────────
  const blankForm = (protocol_id = null) => ({
    name: '', dose: '', notes: '', slots: [], days: [], category: 'Oral', paused: false, status: 'active',
    protocol_id, treatment_mode: 'indefinite', starts_at: null, ends_at: null,
    cycle_on_value: null, cycle_on_unit: null, cycle_off_value: null, cycle_off_unit: null, pinned_time: null,
  });

  function openAdd() {
    const active = protocols.filter((p) => p.status === 'active');
    setEditingId(null);
    setForm(blankForm(active.length === 1 ? active[0].id : null));
    setSubmitError(null);
    setFormOpen(true);
  }
  function openEdit(supp) {
    setEditingId(supp.id);
    setForm({
      name: supp.name, dose: supp.dose, notes: supp.notes || '', slots: [...(supp.slots || [])], days: [...(supp.days || [])],
      category: supp.category || 'Oral', paused: supp.paused ?? false, status: supp.status ?? 'active',
      protocol_id: supp.protocol_id || null, treatment_mode: supp.treatment_mode || 'indefinite',
      starts_at: supp.starts_at || null, ends_at: supp.ends_at || null,
      cycle_on_value: supp.cycle_on_value || null, cycle_on_unit: supp.cycle_on_unit || null,
      cycle_off_value: supp.cycle_off_value || null, cycle_off_unit: supp.cycle_off_unit || null,
      pinned_time: supp.pinned_time || null,
    });
    setSubmitError(null);
    setFormOpen(true);
  }
  const closeForm = () => { setFormOpen(false); setEditingId(null); };

  async function submitForm() {
    if (!form.name.trim() || submitting) return;
    const txMode = form.treatment_mode || 'indefinite';
    if (txMode === 'scheduled') {
      if (!form.starts_at || !form.ends_at) { setSubmitError('Start and end dates are required for a scheduled course'); return; }
      if (form.ends_at <= form.starts_at) { setSubmitError('End date must be after start date'); return; }
    }
    if (txMode === 'cycled') {
      if (!form.starts_at) { setSubmitError('Start date is required for a cycled treatment'); return; }
      if (!form.cycle_on_value || form.cycle_on_value <= 0) { setSubmitError('On duration must be greater than 0'); return; }
      if (!form.cycle_off_value || form.cycle_off_value <= 0) { setSubmitError('Off duration must be greater than 0'); return; }
      if (form.ends_at && form.ends_at <= form.starts_at) { setSubmitError('End date must be after start date'); return; }
    }
    setSubmitting(true);
    setSubmitError(null);
    const cat = form.category || 'Oral';
    const finalDays = form.days.length === 0 ? [0, 1, 2, 3, 4, 5, 6] : form.days;
    const txFields = {
      treatment_mode: txMode,
      starts_at: txMode === 'indefinite' ? null : form.starts_at || null,
      ends_at: txMode === 'indefinite' ? null : form.ends_at || null,
      cycle_on_value: txMode === 'cycled' ? form.cycle_on_value || null : null,
      cycle_on_unit: txMode === 'cycled' ? form.cycle_on_unit || (form.cycle_on_value ? 'days' : null) : null,
      cycle_off_value: txMode === 'cycled' ? form.cycle_off_value || null : null,
      cycle_off_unit: txMode === 'cycled' ? form.cycle_off_unit || (form.cycle_off_value ? 'days' : null) : null,
    };
    const pinnedField = { pinned_time: form.pinned_time || null };
    try {
      const t = token();
      if (editingId) {
        // Version slots/days by date: if the schedule changed, append a dated
        // entry to slot_history (seeding the prior config from creation) so past
        // days keep the old schedule. Only touched when slots/days actually
        // change — dose/notes edits don't write slot_history.
        const oldSupp = supps.find((x) => x.id === editingId);
        const norm = (a) => JSON.stringify([...(a || [])].sort());
        const schedChanged = oldSupp && (norm(oldSupp.slots) !== norm(form.slots) || norm(oldSupp.days) !== norm(finalDays));
        const histField = schedChanged
          ? { slot_history: withScheduleChange(oldSupp, form.slots, finalDays, dateKey(TODAY), oldSupp.created_at ? dateKey(new Date(oldSupp.created_at)) : '1970-01-01') }
          : {};
        const updated = { ...form, days: finalDays, category: cat, id: editingId, ...txFields, ...pinnedField, ...histField };
        await dbUpdateSupp(updated, t);
        setSupps((s) => s.map((x) => (x.id === editingId ? { ...x, ...updated } : x)));
      } else {
        const rows = await dbAddSupp(
          { name: form.name, dose: form.dose, notes: form.notes, slots: form.slots, days: finalDays, category: cat, paused: false, status: 'active', stopped_at: null, user_id: user.id, protocol_id: form.protocol_id || null, ...txFields, ...pinnedField },
          t
        );
        if (rows?.[0]) setSupps((s) => [...s, { ...rows[0], paused: rows[0].paused ?? false }]);
      }
      showToast(editingId ? `updated · ${form.name}` : `added · ${form.name}`, { tone: 'success' });
      closeForm();
    } catch (err) {
      setSubmitError("couldn't save");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteSupp() {
    if (!editingId) return;
    const name = form?.name;
    try {
      await dbDeleteSupp(editingId, token());
      setSupps((s) => s.filter((x) => x.id !== editingId));
      closeForm();
      showToast(name ? `deleted · ${name}` : 'deleted', { tone: 'success' });
    } catch (err) {
      setSubmitError("couldn't delete");
    }
  }

  // Schedule save — ported from App.jsx saveSchedule. Returns true/false (false
  // surfaces "Couldn't save" in ScheduleTab). Notification recompute is Phase 5.
  async function saveSchedule(mode, config, behavior, cTime, adaptiveValue = adaptiveEnabled) {
    const offsets = mode === 'fasting' ? { ...config } : { ...config, _anchor_behavior: behavior, _consistent_time: cTime };
    try {
      await dbSaveSchedule({ user_id: user.id, schedule_type: mode, offsets, adaptive_timing: adaptiveValue }, token());
      setScheduleMode(mode);
      setScheduleConfig(config);
      setAdaptiveEnabled(adaptiveValue);
      setAnchorBehavior(behavior);
      setConsistentTime(cTime);
      if (behavior === 'flexible' && isToday) {
        const hasAnyChecks = Object.keys(checked).some((k) => k.startsWith(dk + '_') && (checked[k] === true || (checked[k] && checked[k].checked)));
        if (!hasAnyChecks) {
          setPillTimes((pt) => { const next = { ...pt }; delete next[dk]; return next; });
          dbUpsertLog({ user_id: user.id, log_date: dk, pill_time: null, eating_window_open: null, eating_window_close: null, checked: {} }, token()).catch(() => {});
        }
      }
      if (behavior === 'consistent' && isToday && cTime) setPillTimes((pt) => ({ ...pt, [dk]: cTime }));
    } catch (err) {
      return false;
    }
    return true;
  }


  // ── Peer-to-peer protocol send / receive (ports of App.jsx) ──
  const sendProtocolToUser = async (protocol, email) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (cleanEmail === (user.email || '').toLowerCase()) return { ok: false, error: "that's your own email" };
    try {
      const t = token();
      const match = await dbLookupUserByEmail(cleanEmail, t);
      if (!match?.user_id) return { ok: false, error: 'no origin user with that email' };
      const snapshot = supps.filter((s) => s.protocol_id === protocol.id).map((s) => ({ name: s.name, dose: s.dose, notes: s.notes, slots: s.slots, days: s.days, category: s.category }));
      const rows = await dbSendProtocol({ clinician_id: user.id, patient_id: match.user_id, source_protocol_id: protocol.id, name: protocol.name, supplements_snapshot: snapshot }, t);
      const sendRow = Array.isArray(rows) ? rows[0] : rows;
      const label = match.display_name?.trim().split(' ')[0] || cleanEmail;
      showToast(`sent to ${label}`, { tone: 'success' });
      if (sendRow?.id) dbNotifyProtocolSent(sendRow.id, profile?.display_name || 'someone', t).catch(() => {});
      return { ok: true };
    } catch (e) { console.error(e); return { ok: false, error: "couldn't send — try again" }; }
  };

  const declineReceived = async (send) => {
    try { await dbUpdateProtocolSend(send.id, { status: 'declined' }, token()); showToast(`${send.name} declined`, { tone: 'success' }); return true; }
    catch (e) { console.error(e); showToast("couldn't decline", { tone: 'error' }); return false; }
  };

  // intent: 'stack' (add on top) | 'replace' (archive actives first) | 'save_later' (add archived)
  const activateReceived = async (send, intent = 'stack') => {
    let newProto = null;
    try {
      const t = token();
      if (intent === 'replace') {
        const activeProtos = protocols.filter((p) => p.status === 'active');
        await Promise.all(activeProtos.map((p) => dbArchiveProtocol(p.id, t)));
        setProtocols((prev) => prev.map((p) => (p.status === 'active' ? { ...p, status: 'archived' } : p)));
        const archivedIds = new Set(activeProtos.map((p) => p.id));
        setSupps((s) => s.map((x) => (archivedIds.has(x.protocol_id) ? { ...x, status: 'active', paused: false } : x)));
      }
      const newStatus = intent === 'save_later' ? 'archived' : 'active';
      const protoRows = await dbAddProtocol({ name: send.name, status: newStatus, user_id: user.id, treatment_mode: 'indefinite', source: 'user' }, t);
      newProto = protoRows?.[0];
      if (!newProto) throw new Error('Protocol creation failed');
      const snapshot = send.supplements_snapshot || [];
      const suppRows = await Promise.all(snapshot.map((s) => dbAddSupp({ name: s.name, dose: s.dose || '', notes: s.notes || '', slots: s.slots || [], days: s.days?.length ? s.days : [0, 1, 2, 3, 4, 5, 6], category: s.category || 'Oral', paused: false, status: 'active', stopped_at: null, user_id: user.id, protocol_id: newProto.id, treatment_mode: 'indefinite', starts_at: null, ends_at: null, cycle_on_value: null, cycle_on_unit: null, cycle_off_value: null, cycle_off_unit: null }, t)));
      setProtocols((p) => [...p, newProto]);
      setSupps((s) => [...s, ...suppRows.flatMap((r) => r || []).map((x) => ({ ...x, paused: x.paused ?? false }))]);
      await dbUpdateProtocolSend(send.id, { status: 'activated' }, t);
      const verb = intent === 'save_later' ? 'saved' : 'activated';
      showToast(`${send.name} ${verb}`, { tone: 'success' });
      return true;
    } catch (e) {
      console.error(e);
      if (newProto) {
        try {
          const t = token();
          const inserted = await supa('GET', `/rest/v1/supplements?protocol_id=eq.${newProto.id}&select=id`, null, t).catch(() => []);
          await Promise.all((inserted || []).map((s) => dbHardDeleteSupp(s.id, t).catch(() => {})));
          await dbDeleteProtocol(newProto.id, t).catch(() => {});
        } catch (rb) { console.error('activateReceived rollback failed:', rb); }
      }
      showToast("couldn't save protocol", { tone: 'error' });
      return false;
    }
  };

  // WeekStrip data
  const activeSlotIds = new Set(coreSlotIds);
  const weekDates = getWeekDatesEndingAt(viewedWeekEnd);
  const logMap = {};
  weekLogs.forEach((l) => { logMap[l.log_date] = l; });
  logMap[dk] = { ...(logMap[dk] || {}), checked: sliceForDay(checked, dk), pill_time: pillTime };
  const rangeLabel = formatWeekRange(weekDates[0], weekDates[6]);
  const canNext = dateKey(viewedWeekEnd) < dateKey(TODAY);

  // Create a protocol (RN port of App.jsx addProtocol). `replace` archives the
  // current actives first; `save_later` creates it archived. No toast yet.
  async function addProtocol(data, intent = 'stack') {
    try {
      const t = token();
      const status = intent === 'save_later' ? 'archived' : 'active';
      if (intent === 'replace') {
        const activeProtos = protocols.filter((p) => p.status === 'active');
        await Promise.all(activeProtos.map((p) => dbArchiveProtocol(p.id, t)));
        setProtocols((prev) => prev.map((p) => (p.status === 'active' ? { ...p, status: 'archived' } : p)));
        const archivedIds = new Set(activeProtos.map((p) => p.id));
        setSupps((s) => s.map((x) => (archivedIds.has(x.protocol_id) ? { ...x, status: 'active', paused: false } : x)));
      }
      const rows = await dbAddProtocol({ ...data, status, user_id: user.id }, t);
      if (rows?.[0]) setProtocols((p) => [...p, rows[0]]);
      showToast(`created · ${data.name}`, { tone: 'success' });
      return rows?.[0] ?? null;
    } catch (err) {
      console.error(err);
      showToast("couldn't create protocol", { tone: 'error' });
      return null;
    }
  }

  // ── Protocol detail handlers (RN ports of App.jsx) ──
  const syncDetail = (id, patch) => setDetailProtocol((d) => (d && d.id === id ? { ...d, ...patch } : d));

  const updateProtocol = async (proto) => {
    try {
      await dbUpdateProtocol({ ...proto, user_id: user.id }, token());
      setProtocols((p) => p.map((x) => (x.id === proto.id ? { ...x, ...proto } : x)));
      syncDetail(proto.id, proto);
    } catch (err) { console.error(err); showToast("couldn't save", { tone: 'error' }); }
  };
  const archiveProtocol = async (proto) => {
    try {
      await dbArchiveProtocol(proto.id, token());
      setProtocols((p) => p.map((x) => (x.id === proto.id ? { ...x, status: 'archived' } : x)));
      setSupps((s) => s.map((x) => (x.protocol_id === proto.id ? { ...x, status: 'active', paused: false } : x)));
      syncDetail(proto.id, { status: 'archived' });
      showToast(`saved · ${proto.name}`, { tone: 'success' });
    } catch (err) { console.error(err); showToast("couldn't save", { tone: 'error' }); }
  };
  const activateProtocol = async (proto, intent = 'stack') => {
    try {
      const t = token();
      if (intent === 'replace') {
        const others = protocols.filter((p) => p.status === 'active' && p.id !== proto.id);
        await Promise.all(others.map((p) => dbArchiveProtocol(p.id, t)));
        setProtocols((prev) => prev.map((p) => (p.status === 'active' && p.id !== proto.id ? { ...p, status: 'archived' } : p)));
        const ids = new Set(others.map((p) => p.id));
        setSupps((s) => s.map((x) => (ids.has(x.protocol_id) ? { ...x, status: 'active', paused: false } : x)));
      }
      await dbActivateProtocol(proto.id, t);
      setProtocols((p) => p.map((x) => (x.id === proto.id ? { ...x, status: 'active' } : x)));
      syncDetail(proto.id, { status: 'active' });
      showToast(`activated · ${proto.name}`, { tone: 'success' });
    } catch (err) { console.error(err); showToast("couldn't activate", { tone: 'error' }); }
  };
  const deleteProtocol = async (proto) => {
    try {
      const t = token();
      // Hard-delete the protocol's supplements first — the FK
      // (supplements_protocol_id_fkey) blocks deleting a non-empty protocol.
      const protoSupps = supps.filter((s) => s.protocol_id === proto.id);
      await Promise.all(protoSupps.map((s) => dbHardDeleteSupp(s.id, t)));
      await dbDeleteProtocol(proto.id, t);
      setSupps((s) => s.filter((x) => x.protocol_id !== proto.id));
      setProtocols((p) => p.filter((x) => x.id !== proto.id));
      showToast(`deleted · ${proto.name}`, { tone: 'success' });
    } catch (err) { console.error(err); showToast("couldn't delete", { tone: 'error' }); }
  };
  const togglePauseSupp = async (supp) => {
    const wasPaused = isPausedSupp(supp);
    const day = dateKey(TODAY);
    const updated = { ...supp, status: wasPaused ? 'active' : 'paused', paused: !wasPaused, pause_intervals: wasPaused ? withPauseEnded(supp, day) : withPauseStarted(supp, day) };
    try { await dbUpdateSupp(updated, token()); setSupps((s) => s.map((x) => (x.id === supp.id ? updated : x))); showToast(wasPaused ? `resumed · ${supp.name}` : `paused · ${supp.name}`, { tone: 'success' }); } catch (err) { console.error(err); showToast("couldn't update", { tone: 'error' }); }
  };
  const resumeSuppById = async (supp) => {
    const updated = { ...supp, status: 'active', paused: false, pause_intervals: withPauseEnded(supp, dateKey(TODAY)) };
    try { await dbUpdateSupp(updated, token()); setSupps((s) => s.map((x) => (x.id === supp.id ? updated : x))); showToast(`resumed · ${supp.name}`, { tone: 'success' }); } catch (err) { console.error(err); showToast("couldn't resume", { tone: 'error' }); }
  };
  const deleteSuppById = async (supp) => {
    try { await dbDeleteSupp(supp.id, token()); setSupps((s) => s.filter((x) => x.id !== supp.id)); showToast(`deleted · ${supp.name}`, { tone: 'success' }); } catch (err) { console.error(err); showToast("couldn't delete", { tone: 'error' }); }
  };
  function openAddForProtocol(protocolId) {
    setEditingId(null);
    setForm(blankForm(protocolId));
    setSubmitError(null);
    setFormOpen(true);
  }

  // Add/edit supplement sheet — shared by the home screen and the protocol
  // detail screen (rendered over whichever is active).
  // Distinct past supplement names, most-recent first — feeds the name-field
  // autocomplete (a lightweight stand-in for the dedicated history table).
  const supplementHistory = [...new Set(supps.map((s) => s.name).filter(Boolean))];

  const formModal = (
    <Modal
      open={formOpen}
      onClose={closeForm}
      title={editingId ? 'edit item' : 'new item'}
      footer={
        form ? (
          <>
            {submitError ? (
              <Text style={{ fontSize: typography.label, color: theme.status.danger, marginBottom: spacing.xs, textAlign: 'center' }}>{submitError}</Text>
            ) : null}
            <Button variant="primary" fullWidth onPress={submitForm} disabled={submitting || !form?.name?.trim()}>
              {submitting ? <InlineLoader size="sm" color={theme.text.onAccent} /> : editingId ? 'Save changes' : 'Add to protocol'}
            </Button>
          </>
        ) : null
      }
    >
      {form ? (
        <EditForm
          form={form}
          setForm={setForm}
          editingId={editingId}
          scheduleMode={scheduleMode}
          mealCount={mealCount}
          eveningMode={scheduleConfig.evening_mode ?? null}
          supplementHistory={supplementHistory}
          activeProtocols={protocols.filter((p) => p.status === 'active')}
        />
      ) : null}
    </Modal>
  );

  // Sub-screens (Detail / Library / Settings) render as SlideScreen overlays at
  // the END of the main return so they slide in/out over the home (see below).

  // Initial data load shows the Origin mark — identical to the boot splash
  // (centered, full opacity) so launch → splash → data-load → home is one
  // continuous ring mark with no size jump or blink.
  if (loading) return (
    <View style={{ flex: 1, backgroundColor: theme.surface.canvas, alignItems: 'center', justifyContent: 'center' }}>
      <OriginGlyph size={200} />
    </View>
  );

  // ── Build cards: interleave pinned-time cards into the cascade by clock time ──
  const slotDefsWithSupps = slotDefs.filter((sd) => getSuppsForSlot(sd.id).length > 0);
  const pinnedDescs = [...pinnedSupps, ...slottedPinnedSupps].map((s) => ({ s, t: parseHHMM(s.pinned_time) })).sort((a, b) => a.t - b.t);

  const renderSlot = (sd) => {
    const sl = getSuppsForSlot(sd.id);
    const t = getSlotTime(sd.id, ctx);
    const overrideLabel = getSlotLabelForMode(sd.id, scheduleMode);
    return (
      <SlotCard
        key={sd.id}
        slot={overrideLabel ? { ...sd, label: overrideLabel } : sd}
        slotSupps={sl}
        status={slotStatus(sd.id, ctx, sl, isChecked)}
        timeLabel={t ? fmtTime(t) : (scheduleMode === 'none' ? null : '--:--')}
        noSchedule={scheduleMode === 'none'}
        isChecked={isChecked}
        checkedAtTime={checkedAtTime}
        openLogAt={openLogAt}
        toggleCheck={toggleCheck}
        takeAllInSlot={takeAllInSlot}
        openEdit={openEdit}
        isReadOnly={readOnly}
        isFuture={isFuture}
        isPast={isPast}
      />
    );
  };
  const renderPinned = (s) => {
    const t = parseHHMM(s.pinned_time);
    const on = isChecked('anytime', s.id);
    const diff = (Date.now() - t.getTime()) / 60000;
    const status = on ? 'done' : !isToday ? 'missed' : diff > 15 ? 'missed' : diff > -5 ? 'now' : 'future';
    return (
      <SlotCard
        key={`pinned_${s.id}`}
        single
        slot={{ id: 'anytime', label: s.name, sublabel: '', icon: ANYTIME_SLOT.icon }}
        slotSupps={[s]}
        timeLabel={fmtTime(t)}
        status={status}
        isChecked={isChecked}
        checkedAtTime={checkedAtTime}
        openLogAt={openLogAt}
        toggleCheck={toggleCheck}
        openEdit={openEdit}
        isReadOnly={readOnly}
        isFuture={isFuture}
        isPast={isPast}
      />
    );
  };

  const hasMultiSuppSlot = coreSlotIds.some((sid) => getSuppsForSlot(sid).length > 1);
  const cards = [];
  let pi = 0;
  for (const sd of slotDefsWithSupps) {
    const st = getSlotTime(sd.id, ctx);
    while (pi < pinnedDescs.length && st && pinnedDescs[pi].t <= st) { cards.push(renderPinned(pinnedDescs[pi].s)); pi++; }
    cards.push(renderSlot(sd));
  }
  while (pi < pinnedDescs.length) { cards.push(renderPinned(pinnedDescs[pi].s)); pi++; }
  if (untimedSupps.length > 0) {
    cards.push(
      <SlotCard
        key="anytime"
        slot={ANYTIME_SLOT}
        slotSupps={untimedSupps}
        status="future"
        timeLabel={null}
        noSchedule
        isChecked={isChecked}
        checkedAtTime={checkedAtTime}
        openLogAt={openLogAt}
        toggleCheck={toggleCheck}
        takeAllInSlot={takeAllInSlot}
        openEdit={openEdit}
        isReadOnly={readOnly}
        isFuture={isFuture}
        isPast={isPast}
      />
    );
  }

  const firstName = profile?.display_name?.trim().split(' ')[0] || 'Origin';
  const initial = (profile?.display_name?.trim()[0] || 'O').toUpperCase();

  return (
    <>
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.surface.canvas }}
      contentContainerStyle={{ paddingHorizontal: spacing.md, paddingTop: Math.max(insets.top, 20), paddingBottom: spacing.xxl }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => { loadedDays.current = new Set(); loadStatic(); }} tintColor={theme.text.secondary} />}
    >
      {/* Top bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, minWidth: 0 }}>
          <Avatar initial={initial} onPress={() => setShowSettings(true)} />
          <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
            <Heading level={1} visual="body" weight="medium" font="body" numberOfLines={1} style={{ color: theme.text.secondary, textTransform: 'lowercase' }}>{firstName}</Heading>
            {/* the blinking terminal cursor — the motion signature */}
            <Cursor width={7} height={15} style={{ marginLeft: 5 }} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <IconButton label="Open Library" onPress={() => setShowLibrary(true)}><Library size={iconSize.sm} strokeWidth={1.5} color={theme.text.secondary} /></IconButton>
          {isPast ? (
            <IconButton label={pastDayEditing ? 'Done editing' : 'Edit past day'} onPress={() => setPastDayEditing((e) => !e)}>
              {pastDayEditing ? <Text size="label" weight="semibold">Done</Text> : <Pencil size={iconSize.xs} strokeWidth={1.5} color={theme.text.secondary} />}
            </IconButton>
          ) : (
            <IconButton label="Add item" onPress={openAdd}><Plus size={iconSize.sm} strokeWidth={1.5} color={theme.text.secondary} /></IconButton>
          )}
        </View>
      </View>

      <WeekStrip
        weekDates={weekDates}
        logMap={logMap}
        supplements={supps}
        activeSlotIds={activeSlotIds}
        selectedDate={viewDate}
        today={TODAY}
        onSelectDate={setViewDate}
        onPrev={() => setViewedWeekEnd((d) => addDays(d, -7))}
        onNext={() => setViewedWeekEnd((d) => { const n = addDays(d, 7); return n > TODAY ? TODAY : n; })}
        canNext={canNext}
        rangeLabel={rangeLabel}
      />

      <Animated.View style={{ opacity: dayFade }}>
      <Hero
        scheduleMode={scheduleMode}
        isToday={isToday}
        viewDate={viewDate}
        pct={pct}
        coreTotal={coreTotal}
        coreDone={coreDone}
        pillTime={pillTime}
        anchorBehavior={anchorBehavior}
        consistentTime={consistentTime}
        eatingWindowStart={scheduleConfig.eating_window_start}
        isFlexibleIF={scheduleMode === 'fasting' && !!scheduleConfig.eating_window_flexible}
        eatingWindowOpen={eatingWindowOpens[dk] || null}
        eatingWindowClose={eatingWindowCloses[dk] || null}
        openEatingWindow={openEatingWindow}
        closeEatingWindow={closeEatingWindow}
        isFuture={isFuture}
        flashGreen={flashGreen}
        startDay={startDay}
        isPast={isPast}
        isReadOnly={readOnly}
        nextFixedSlot={nextFixedSlot}
        onEditAnchor={onEditAnchor}
      />

      {/* Floating slot cards — no outer wrapper; each card sits on the canvas. */}
      {homeSupps.length === 0 ? (
        <View style={{ borderWidth: theme.borderWidth.default, borderColor: theme.border.subtle, backgroundColor: 'transparent', paddingVertical: spacing.xl, paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
          {!isPast && isDay1 && DAY1_TIP[scheduleMode] ? (
            <View style={{ marginBottom: spacing.lg }}>
              <InlineTip id={`day1-${scheduleMode}`} label={DAY1_TIP[scheduleMode].label}>{DAY1_TIP[scheduleMode].body}</InlineTip>
            </View>
          ) : null}
          <Text style={{ fontFamily: fonts.mono.semibold, fontSize: typography.label, color: theme.text.tertiary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: spacing.md }}>// protocol — empty</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
            <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.body, color: theme.text.secondary }}>$ no items yet</Text>
            <Cursor width={7} height={15} color={theme.text.secondary} style={{ marginLeft: 5 }} />
          </View>
          {!isPast ? <Button variant="primary" fullWidth onPress={openAdd}>+ add item</Button> : null}
        </View>
      ) : (
        <View style={{ marginBottom: spacing.md }}>
          {!isPast && !isFuture && !readOnly && hasMultiSuppSlot ? (
            <View style={{ marginBottom: spacing.md }}>
              <InlineTip id="take-all-hint" label="tip" cursor>tap the icon at the left of a slot to log every item in it at once</InlineTip>
            </View>
          ) : null}
          {/* De-carded list with hairline rules between items — the break/hierarchy
              the flat gap was missing, without re-introducing grey card fills. */}
          {cards.map((c, i) => (
            <View key={c.key ?? `card-${i}`}>
              {c}
              {i < cards.length - 1 ? (
                <View style={{ height: theme.borderWidth.default, backgroundColor: theme.border.divider, marginVertical: spacing.sm }} />
              ) : null}
            </View>
          ))}
        </View>
      )}
      </Animated.View>

    </ScrollView>

    {formModal}

    {/* "Log at…" — pick the actual time an item was taken */}
    <Modal
      open={!!logAtTarget}
      onClose={() => setLogAtTarget(null)}
      title="When did you take it?"
      footer={<Button variant="primary" fullWidth onPress={confirmLogAt}>Log it</Button>}
    >
      <View style={{ alignItems: 'center' }}>
        <DateTimePicker value={logAtDate} mode="time" display="spinner" themeVariant="dark" accentColor={theme.accent.default} onChange={(_e, d) => { if (d) setLogAtDate(d); }} />
      </View>
    </Modal>

    {/* Edit the anchor ("Started at HH:MM") time */}
    <Modal
      open={anchorEditOpen}
      onClose={() => setAnchorEditOpen(false)}
      title="Anchor time"
      footer={<Button variant="primary" fullWidth onPress={confirmAnchorEdit}>Save</Button>}
    >
      <View style={{ alignItems: 'center' }}>
        <DateTimePicker value={anchorEditDate} mode="time" display="spinner" themeVariant="dark" accentColor={theme.accent.default} onChange={(_e, d) => { if (d) setAnchorEditDate(d); }} />
      </View>
    </Modal>

    {/* Sub-screens slide in/out over the home (iOS push feel). Mounted always; the
        SlideScreen owns the exit animation. Guard children so closing (state→null)
        doesn't render with stale props — SlideScreen keeps the last content during slide-out. */}
    <SlideScreen visible={!!detailProtocol} zIndex={600}>
      {detailProtocol ? (
        <ProtocolDetailScreen
          protocol={detailProtocol}
          supplements={supps}
          activeProtocolNames={protocols.filter((p) => p.status === 'active' && p.id !== detailProtocol.id).map((p) => p.name)}
          onBack={() => setDetailProtocol(null)}
          onUpdateProtocol={updateProtocol}
          onArchiveProtocol={archiveProtocol}
          onActivateProtocol={activateProtocol}
          onDeleteProtocol={deleteProtocol}
          onAddSupp={() => openAddForProtocol(detailProtocol.id)}
          onEditSupp={openEdit}
          onTogglePauseSupp={togglePauseSupp}
          onResumeSupp={resumeSuppById}
          onDeleteSupp={deleteSuppById}
          onSendProtocol={sendProtocolToUser}
        />
      ) : null}
    </SlideScreen>

    <SlideScreen visible={showLibrary}>
      {showLibrary ? (
        <ProtocolLibrary
          protocols={protocols}
          supplements={supps}
          onAddProtocol={addProtocol}
          onOpenDetail={setDetailProtocol}
          onBack={() => setShowLibrary(false)}
          userId={user.id}
          token={token()}
          onActivateReceived={activateReceived}
          onDeclineReceived={declineReceived}
        />
      ) : null}
    </SlideScreen>

    <SlideScreen visible={showSettings}>
      {showSettings ? (
        <SettingsScreen
          user={user}
          token={token()}
          profile={profile}
          onProfileUpdate={setProfile}
          onSignOut={onSignOut}
          onBack={() => setShowSettings(false)}
          scheduleMode={scheduleMode}
          scheduleConfig={scheduleConfig}
          anchorBehavior={anchorBehavior}
          consistentTime={consistentTime}
          adaptiveEnabled={adaptiveEnabled}
          onSaveSchedule={saveSchedule}
          supplements={supps}
          remindersEnabled={remindersEnabled}
          onToggleReminders={toggleReminders}
        />
      ) : null}
    </SlideScreen>
    </>
  );
}
