import { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { dateKey, startOfDay } from 'shared/lib/time';
import {
  calculateAdherenceForDate,
  calculateSlotAdherence,
  calculateSupplementAdherence,
} from 'shared/lib/adherence';
import { dbGetDailyLogsRange, dbGetCheckinsRange, dbUpsertCheckin } from 'shared/lib/api';
import { Heading, SectionHeader, Text, Meter, InlineTip, EmptyState } from '../components';
import { FEELING_STATES } from '../components/FeelingScale';
import CheckinSheet from '../components/CheckinSheet';
import IconButton from '../components/IconButton';
import { isHealthSupported, readHealthSnapshot } from '../lib/health';
import { theme, spacing, typography, icon } from '../theme';

const WINDOW = 30; // days
const PREVIEW_BARS = Array.from({ length: WINDOW }, () => null); // faint empty-state track

// Build [today-29 … today] as startOfDay dates.
function lastNDates(n) {
  const today = startOfDay(new Date());
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(d);
  }
  return out;
}

function monthDay(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// A row of thin vertical bars, one per day, filled from the bottom by `value`
// (0–1). The app's block grammar stretched across a month — sharp, monochrome,
// green only where the day hit 100%. `emptyAt` marks days with no data (a faint
// baseline tick instead of a bar) so gaps read as "no entry", not "zero".
function BarSeries({ values, height = 44, green100 = false }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height }}>
      {values.map((v, i) => {
        const has = v != null;
        const frac = has ? Math.max(0, Math.min(1, v)) : 0;
        const full = green100 && frac >= 1;
        return (
          <View key={i} style={{ flex: 1, height, justifyContent: 'flex-end', backgroundColor: theme.status.missedBg }}>
            <View
              style={{
                height: has ? Math.max(2, frac * height) : 1,
                backgroundColor: has ? (full ? theme.status.success : theme.text.primary) : theme.border.subtle,
              }}
            />
          </View>
        );
      })}
    </View>
  );
}

// label + horizontal Meter + right-aligned percent — the by-time / by-supplement
// row. Sublabel (e.g. "12 of 40") sits under the name in tertiary.
function AdherenceRow({ label, sub, pct }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: theme.borderWidth.default, borderBottomColor: theme.border.divider, gap: spacing.sm }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1}>{label}</Text>
        {sub ? <Text size="label" tone="tertiary" style={{ marginTop: 2 }}>{sub}</Text> : null}
      </View>
      <Meter pct={pct} cells={5} orientation="horizontal" cellW={14} cellH={6} gap={3} />
      <Text weight="semibold" style={{ width: 46, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{pct}%</Text>
    </View>
  );
}

// One objective stat from Apple Health — big value + unit, small label under it.
function HealthStat({ label, value, unit }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text weight="semibold" style={{ fontVariant: ['tabular-nums'] }}>{value}</Text>
        <Text size="label" tone="tertiary" style={{ marginLeft: 2 }}>{unit}</Text>
      </View>
      <Text size="label" tone="tertiary" style={{ marginTop: 2 }}>{label}</Text>
    </View>
  );
}

export default function Trends({ supps = [], activeSlotIds, slotDefs = [], userId, token, onBack, onClose, embedded = false }) {
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState(null);       // null = loading
  const [checkins, setCheckins] = useState([]);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [checkinSaving, setCheckinSaving] = useState(false);
  const [health, setHealth] = useState(null); // { sleepHours, restingHr, hrv } — null off-device

  // Objective layer — read last night's sleep + recovery from Apple Health, only
  // if the user opted in. Guarded no-op everywhere but a Health build on device.
  useEffect(() => {
    let alive = true;
    if (global.localStorage.getItem('health_enabled') !== '1') return;
    isHealthSupported().then((ok) => {
      if (!ok || !alive) return;
      readHealthSnapshot().then((snap) => { if (alive) setHealth(snap); }).catch(() => {});
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const dates = useMemo(() => lastNDates(WINDOW), []);
  const todayKey = dateKey(dates[dates.length - 1]);
  const todayCheckin = checkins.find((c) => c.log_date === todayKey) || null;

  // Deliberate check-in / edit for today — the persistent path (the home surface
  // has no check-in; the daily moment is casual). Upsert + patch local state so
  // the tracks refresh without a refetch.
  const saveTodayCheckin = async (values) => {
    if (checkinSaving) return;
    setCheckinSaving(true);
    try {
      const rows = await dbUpsertCheckin({ user_id: userId, log_date: todayKey, ...values }, token);
      const saved = (Array.isArray(rows) ? rows[0] : rows) || { user_id: userId, log_date: todayKey, ...values };
      setCheckins((cs) => [...cs.filter((c) => c.log_date !== todayKey), saved]);
      setCheckinOpen(false);
    } catch (e) {
      // leave the sheet open on failure so the entry isn't lost
    } finally {
      setCheckinSaving(false);
    }
  };

  useEffect(() => {
    let alive = true;
    const start = dateKey(dates[0]);
    const end = dateKey(dates[dates.length - 1]);
    Promise.all([
      dbGetDailyLogsRange(userId, start, end, token).catch(() => []),
      dbGetCheckinsRange(userId, start, end, token).catch(() => []),
    ]).then(([lg, ck]) => {
      if (!alive) return;
      setLogs(Array.isArray(lg) ? lg : []);
      setCheckins(Array.isArray(ck) ? ck : []);
    });
    return () => { alive = false; };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const model = useMemo(() => {
    if (logs == null) return null;
    const logMap = {};
    logs.forEach((l) => { logMap[l.log_date] = l; });

    // Daily adherence trend (visual shape across the window).
    const dailyPcts = dates.map((d) => calculateAdherenceForDate(d, supps, logMap[dateKey(d)] || null, activeSlotIds));

    // Overall = doses taken / doses expected across the window (ignores days
    // with nothing scheduled, so it isn't dragged down by rest days).
    let taken = 0, expected = 0;
    const suppRows = [];
    for (const s of supps) {
      const a = calculateSupplementAdherence(s, logs, activeSlotIds, WINDOW);
      if (!a) continue;
      taken += a.taken; expected += a.expected;
      suppRows.push({ id: s.id, name: s.name, pct: a.pct, sub: `${a.taken} of ${a.expected} taken` });
    }
    suppRows.sort((a, b) => a.pct - b.pct); // worst first — that's the actionable end
    const overall = expected ? Math.round((taken / expected) * 100) : null;

    // Per-slot adherence — reveals "you miss evenings most".
    const slotRows = [];
    for (const sd of slotDefs) {
      const a = calculateSlotAdherence(sd.id, supps, logs, WINDOW);
      if (!a) continue;
      slotRows.push({ id: sd.id, label: sd.label, pct: a.pct, sub: `${a.taken} of ${a.expected} taken` });
    }
    const worstSlot = slotRows.length ? slotRows.reduce((w, r) => (r.pct < w.pct ? r : w), slotRows[0]) : null;

    // Outcomes — feeling is the primary track (the daily one-tap, backed by
    // `mood`); energy & sleep are optional depth, shown only once logged.
    const ckMap = {};
    checkins.forEach((c) => { ckMap[c.log_date] = c; });
    const metric = (key) => dates.map((d) => {
      const c = ckMap[dateKey(d)];
      const v = c && c[key] != null ? c[key] : null;
      return v == null ? null : v / 5;
    });
    const avg = (key) => {
      const vals = checkins.map((c) => c[key]).filter((v) => v != null);
      return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    };
    const hasData = (key) => checkins.some((c) => c[key] != null);
    const feeling = { key: 'mood', label: 'feeling', series: metric('mood'), avg: avg('mood') };
    const details = [
      { key: 'energy', label: 'energy', series: metric('energy'), avg: avg('energy') },
      { key: 'sleep', label: 'sleep', series: metric('sleep'), avg: avg('sleep') },
    ].filter((o) => hasData(o.key));
    const hasOutcomes = hasData('mood') || details.length > 0;

    return { dailyPcts, overall, suppRows, slotRows, worstSlot, feeling, details, hasOutcomes };
  }, [logs, checkins, supps, slotDefs, activeSlotIds, dates]);

  const startLabel = monthDay(dates[0]);
  const endLabel = 'today';

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface.canvas }}>
      {/* Header — drill-in detail pattern (body nav-title, back, hairline).
          Skipped when embedded: the Insights container owns the header + tabs. */}
      {!embedded ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Math.max(insets.top, 20), paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: theme.borderWidth.default, borderBottomColor: theme.border.subtle }}>
          <IconButton accessibilityLabel="Back" onPress={onBack}><ArrowLeft size={icon.sm} color={theme.text.secondary} /></IconButton>
          <Heading level={1} visual="body" font="body">Trends</Heading>
          <View style={{ width: 44 }} />
        </View>
      ) : null}

      {model == null ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text tone="tertiary" size="label">loading…</Text>
        </View>
      ) : model.overall == null ? (
        // First-use / no regimen activity in-window — an authored empty state, not a lonely "—".
        <ScrollView contentContainerStyle={{ paddingTop: spacing.lg, paddingHorizontal: spacing.md, paddingBottom: spacing.xxl }}>
          <EmptyState
            eyebrow="adherence — nothing to chart yet"
            line="log a few days and your streak, patterns & outcomes fill in here"
            action={onClose ? { label: 'go to today', onPress: onClose } : undefined}
          >
            <BarSeries values={PREVIEW_BARS} green100 />
          </EmptyState>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ paddingTop: spacing.lg, paddingHorizontal: spacing.md, paddingBottom: spacing.xxl }}>

          {/* ── Adherence ── */}
          <View style={{ marginBottom: spacing.xl }}>
            <SectionHeader>adherence · last {WINDOW} days</SectionHeader>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.md }}>
              <Text weight="bold" size="readout" style={{ lineHeight: typography.readout, fontVariant: ['tabular-nums'] }}>{model.overall == null ? '—' : `${model.overall}%`}</Text>
              <Text tone="secondary" size="caption" style={{ marginBottom: 6 }}>doses taken{'\n'}on schedule</Text>
            </View>
            <BarSeries values={model.dailyPcts.map((p) => p / 100)} green100 />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
              <Text tone="tertiary" size="label">{startLabel}</Text>
              <Text tone="tertiary" size="label">{endLabel}</Text>
            </View>
          </View>

          {/* ── How you feel (outcomes) ── */}
          <View style={{ marginBottom: spacing.xl }}>
            <SectionHeader>how you feel · last {WINDOW} days</SectionHeader>

            {/* Objective layer from Apple Health — the numbers your wearable
                recorded last night, alongside how you rated the day. Only renders
                when connected AND at least one value came back. */}
            {health && (health.sleepHours != null || health.hrv != null || health.restingHr != null) ? (
              <View style={{ marginBottom: spacing.lg, borderWidth: theme.borderWidth.default, borderColor: theme.border.subtle, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}>
                <Text size="label" tone="tertiary" style={{ textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.sm }}>apple health · last night</Text>
                <View style={{ flexDirection: 'row' }}>
                  {health.sleepHours != null ? <HealthStat label="sleep" value={`${health.sleepHours}`} unit="h" /> : null}
                  {health.hrv != null ? <HealthStat label="hrv" value={`${health.hrv}`} unit="ms" /> : null}
                  {health.restingHr != null ? <HealthStat label="resting hr" value={`${health.restingHr}`} unit="bpm" /> : null}
                </View>
              </View>
            ) : null}

            {/* Feeling always shows (the primary track) — empty when unlogged, so
                the shape is visible — with a one-line prompt until check-ins accrue. */}
            {!model.hasOutcomes ? (
              <Text tone="secondary" size="caption" style={{ marginBottom: spacing.md }}>check in daily to spot your patterns — how you feel over time.</Text>
            ) : null}

            {/* Feeling — the hero track, named in the scale's own words. */}
            <View style={{ marginBottom: model.details.length ? spacing.lg : 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                <Text>feeling</Text>
                <Text tone={model.feeling.avg == null ? 'tertiary' : 'primary'} weight={model.feeling.avg == null ? 'regular' : 'semibold'}>
                  {model.feeling.avg == null ? '—' : `${FEELING_STATES[Math.max(0, Math.min(4, Math.round(model.feeling.avg) - 1))]} on average`}
                </Text>
              </View>
              <BarSeries values={model.feeling.series} height={36} />
            </View>

            {/* Energy & sleep — optional depth, quieter, only once logged. */}
            {model.details.map((o) => (
              <View key={o.key} style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                  <Text size="caption" tone="secondary">{o.label}</Text>
                  <Text size="label" tone="tertiary" style={{ fontVariant: ['tabular-nums'] }}>{o.avg == null ? '—' : `${o.avg.toFixed(1)} avg`}</Text>
                </View>
                <BarSeries values={o.series} height={22} />
              </View>
            ))}

            {/* Persistent entry — the home has no check-in and the daily moment is
                once-a-day, so this is where you can always log or edit today. */}
            <Pressable
              onPress={() => setCheckinOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={todayCheckin?.mood != null ? 'Edit today’s feeling' : 'Check in for today'}
              style={{ marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: theme.borderWidth.default, borderColor: theme.border.subtle, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}
            >
              <Text tone="secondary" size="caption">
                {todayCheckin?.mood != null ? `today · ${FEELING_STATES[todayCheckin.mood - 1]}` : 'how do you feel today?'}
              </Text>
              <Text tone="tertiary" size="label">{todayCheckin?.mood != null ? 'edit ›' : 'check in ›'}</Text>
            </Pressable>
          </View>

          {/* ── By time of day ── */}
          {model.slotRows.length ? (
            <View style={{ marginBottom: spacing.xl }}>
              <SectionHeader>by time of day</SectionHeader>
              {model.worstSlot && model.worstSlot.pct < 80 ? (
                <InlineTip id="trends-worst-slot" label="pattern">you miss <Text size="caption" weight="semibold">{model.worstSlot.label.toLowerCase()}</Text> most — {model.worstSlot.pct}% on schedule.</InlineTip>
              ) : null}
              <View style={{ marginTop: model.worstSlot && model.worstSlot.pct < 80 ? spacing.sm : 0 }}>
                {model.slotRows.map((r) => <AdherenceRow key={r.id} label={r.label} sub={r.sub} pct={r.pct} />)}
              </View>
            </View>
          ) : null}

          {/* ── By supplement ── */}
          {model.suppRows.length ? (
            <View style={{ marginBottom: spacing.lg }}>
              <SectionHeader>by supplement</SectionHeader>
              {model.suppRows.map((r) => <AdherenceRow key={r.id} label={r.name} sub={r.sub} pct={r.pct} />)}
            </View>
          ) : null}

        </ScrollView>
      )}

      <CheckinSheet open={checkinOpen} onClose={() => setCheckinOpen(false)} initial={todayCheckin} onSave={saveTodayCheckin} saving={checkinSaving} />
    </View>
  );
}
