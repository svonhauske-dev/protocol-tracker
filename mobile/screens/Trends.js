import { useEffect, useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { dateKey, startOfDay } from 'shared/lib/time';
import {
  calculateAdherenceForDate,
  calculateSlotAdherence,
  calculateSupplementAdherence,
} from 'shared/lib/adherence';
import { dbGetDailyLogsRange, dbGetCheckinsRange } from 'shared/lib/api';
import { Heading, SectionHeader, Text, Meter, InlineTip, EmptyState } from '../components';
import IconButton from '../components/IconButton';
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

export default function Trends({ supps = [], activeSlotIds, slotDefs = [], userId, token, onBack, onClose, embedded = false }) {
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState(null);       // null = loading
  const [checkins, setCheckins] = useState([]);

  const dates = useMemo(() => lastNDates(WINDOW), []);

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

    // Outcomes — energy / mood / sleep as value/5 per day (null where no check-in).
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
    const outcomes = [
      { key: 'energy', label: 'energy', series: metric('energy'), avg: avg('energy') },
      { key: 'mood', label: 'mood', series: metric('mood'), avg: avg('mood') },
      { key: 'sleep', label: 'sleep', series: metric('sleep'), avg: avg('sleep') },
    ];
    const hasOutcomes = checkins.length > 0;

    return { dailyPcts, overall, suppRows, slotRows, worstSlot, outcomes, hasOutcomes };
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
            {/* Always show the three tracks — empty when unlogged, so the shape is
                visible — with a one-line prompt above until check-ins accrue. */}
            {!model.hasOutcomes ? (
              <Text tone="secondary" size="caption" style={{ marginBottom: spacing.md }}>rate energy, mood &amp; sleep from your home screen — they plot against what you're taking.</Text>
            ) : null}
            {model.outcomes.map((o) => (
              <View key={o.key} style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                  <Text>{o.label}</Text>
                  <Text size="label" tone="tertiary" style={{ fontVariant: ['tabular-nums'] }}>{o.avg == null ? '—' : `${o.avg.toFixed(1)} avg`}</Text>
                </View>
                <BarSeries values={o.series} height={28} />
              </View>
            ))}
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
    </View>
  );
}
