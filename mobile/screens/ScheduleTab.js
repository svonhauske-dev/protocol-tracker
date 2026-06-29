import { useState, useRef, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { parseHHMM, fmtTime, addMins } from 'shared/lib/time';
import { DEFAULT_CONFIG, ANCHOR_NOTES, MODES, DISPLAY_MODES, ANCHOR_SUB_MODES, deriveOffsets, computeIFSlotTimes } from 'shared/config';
import { IF_SLOTS, SLOTS } from 'shared/lib/notifications';
import { Heading, Label, SectionHeader, HelperText, Text, Button, Card, Stepper, OptionRow } from '../components';
import PickerField from '../components/PickerField';
import Modal from '../components/Modal';
import { theme, spacing, typography, touch, layout, fonts } from '../theme';

// ── Config helpers (ported verbatim from src/components/ScheduleTab.jsx) ──────
const applyCascade = (cfg) => {
  const firstMeal = (cfg.first_meal_offset_hours ?? 1) * 60 + (cfg.first_meal_offset_minutes ?? 0);
  const interval = (cfg.meal_interval_hours ?? 4) * 60 + (cfg.meal_interval_minutes ?? 0);
  return { ...cfg, breakfast: firstMeal, lunch: firstMeal + interval, dinner: firstMeal + 2 * interval };
};
const migrateConfig = (merged) => {
  if (merged.first_meal_offset_hours !== undefined) return merged;
  const bfast = merged.breakfast ?? 60;
  const interval = Math.max(0, (merged.lunch ?? 300) - bfast);
  return {
    ...merged,
    first_meal_offset_hours: Math.floor(bfast / 60),
    first_meal_offset_minutes: bfast % 60,
    meal_interval_hours: Math.floor(interval / 60),
    meal_interval_minutes: interval % 60,
    evening_mode: null,
  };
};
const seedConfigForMode = (cfg, mode) => {
  if (mode === 'medication' || mode === 'wakeup') {
    return applyCascade({
      ...cfg,
      first_meal_offset_hours: cfg.first_meal_offset_hours ?? 1,
      first_meal_offset_minutes: cfg.first_meal_offset_minutes ?? 0,
      meal_interval_hours: cfg.meal_interval_hours ?? 4,
      meal_interval_minutes: cfg.meal_interval_minutes ?? 0,
      pre_meal_window: cfg.pre_meal_window ?? 30,
      evening_mode: cfg.evening_mode ?? null,
    });
  }
  if (mode === 'fasting') {
    return {
      ...cfg,
      eating_window_start: cfg.eating_window_start ?? DEFAULT_CONFIG.eating_window_start,
      eating_window_duration_hours: cfg.eating_window_duration_hours ?? 8,
      meal_count: cfg.meal_count ?? 3,
      pre_meal_window: cfg.pre_meal_window ?? 30,
      evening_mode: cfg.evening_mode ?? null,
      _if_v2_migrated: true,
    };
  }
  if (mode === 'fixed') {
    return { ...cfg, fixed_times: { ...DEFAULT_CONFIG.fixed_times, ...(cfg.fixed_times || {}) }, pre_meal_window: cfg.pre_meal_window ?? 30, _fixed_premeal_migrated: true };
  }
  return cfg;
};

const parseTime = (v) => { if (v) { const [h, m] = v.split(':').map(Number); const d = new Date(); d.setHours(h, m, 0, 0); return d; } return new Date(); };

// ── Small presentational pieces ──────────────────────────────────────────────
// Exact port of design-system makeSegBtnStyle: padding sm, radius.button (0),
// minHeight segHeight (40), accent.subtle/border when active.
function SegButton({ active, onPress, children }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        // flexBasis 'auto' (content width) + grow — like the Category selectors —
        // so a long label ("Before sleep") gets the room it needs and a short
        // one ("Off") shrinks, instead of equal-width buttons that truncate.
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 'auto',
        padding: spacing.sm,
        minHeight: layout.segHeight,
        borderRadius: theme.radius.button,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? theme.accent.subtle : 'transparent',
        borderWidth: theme.borderWidth.default,
        borderColor: active ? theme.accent.default : theme.border.subtle,
      }}
    >
      <Text numberOfLines={1} style={{ fontSize: typography.caption, color: active ? theme.accent.onSubtle : theme.text.secondary, fontFamily: active ? fonts.mono.semibold : fonts.mono.regular }}>
        {children}
      </Text>
    </Pressable>
  );
}

// Horizontal "label … value" card that expands a time spinner BELOW it on tap.
function TimeRow({ label, value, placeholder = 'Set', onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Card onPress={() => setOpen((o) => !o)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, marginBottom: 0 }}>
        <Text tone="secondary" size="caption" style={{ flex: 1 }}>{label}</Text>
        <Text size="caption" style={{ color: value ? theme.text.primary : theme.text.tertiary, fontFamily: fonts.mono.regular }}>{value || placeholder}</Text>
      </Card>
      {open ? (
        <View style={{ alignItems: 'center', marginTop: spacing.xs }}>
          <DateTimePicker value={parseTime(value)} mode="time" display="spinner" themeVariant="dark" onChange={(_e, d) => { if (d) onChange(fmtTime(d)); }} />
          <Button variant="secondary" fullWidth onPress={() => setOpen(false)}>done</Button>
        </View>
      ) : null}
    </View>
  );
}

// Count steppers (hr / min). Single field → label-left / stepper-right; dual
// (hr · min) → label on top, two steppers below so the wider [−] n [+] controls
// always fit the row.
function NumberCard({ label, fields }) {
  const dual = fields.length > 1;
  const steppers = (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      {fields.map((f, i) => (
        <Stepper key={i} value={f.value} unit={f.unit} onChange={f.onChange} max={f.max ?? 999} />
      ))}
    </View>
  );
  if (dual) {
    return (
      <Card style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, marginBottom: 0, gap: spacing.xs }}>
        <Text tone="secondary" size="caption">{label}</Text>
        {steppers}
      </Card>
    );
  }
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, marginBottom: 0 }}>
      <Text tone="secondary" size="caption" style={{ flex: 1 }}>{label}</Text>
      {steppers}
    </Card>
  );
}

function ModeCard({ active, title, desc, onPress }) {
  return (
    <Card variant={active ? 'selected' : 'default'} onPress={onPress} style={{ flex: 1, gap: spacing.xxs, minHeight: layout.modeButtonHeight, marginBottom: 0 }}>
      <Heading level={3} visual="title" font="heading" weight="semibold" style={{ color: active ? theme.accent.onSubtle : theme.text.primary }}>{title}</Heading>
      <Text tone="secondary" size="caption">{desc}</Text>
    </Card>
  );
}

export default function ScheduleTab({ scheduleMode, scheduleConfig, anchorBehavior, consistentTime, adaptive = false, onSave, supplements = [] }) {
  const needsMigration = useRef(scheduleMode !== 'fixed' && scheduleConfig.first_meal_offset_hours === undefined);
  const fixedNeedsMigration = useRef(scheduleMode === 'fixed' && !scheduleConfig._fixed_premeal_migrated);
  const debounceRef = useRef(null);

  const [localMode, setLocalMode] = useState(scheduleMode);
  const [selectedCard, setSelectedCard] = useState(scheduleMode === 'medication' || scheduleMode === 'wakeup' ? 'anchor' : scheduleMode);
  const [localConfig, setLocalConfig] = useState(() => {
    const merged = { ...DEFAULT_CONFIG, ...scheduleConfig, fixed_times: { ...DEFAULT_CONFIG.fixed_times, ...(scheduleConfig.fixed_times || {}) } };
    return scheduleMode === 'fixed' ? merged : migrateConfig(merged);
  });
  const [localBehavior, setLocalBehavior] = useState(anchorBehavior);
  const [localAdaptive, setLocalAdaptive] = useState(adaptive);
  const [localTime, setLocalTime] = useState(consistentTime);
  const [saveError, setSaveError] = useState(null);
  const [orphanConfirm, setOrphanConfirm] = useState(null);

  const scheduleSave = (mode, config, behavior, time, delay = 500, adaptiveVal = localAdaptive) => {
    setSaveError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (delay === 0) {
      Promise.resolve(onSave(mode, config, behavior, time, adaptiveVal)).then((ok) => { if (ok === false) setSaveError("couldn't save — try again"); });
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const ok = await onSave(mode, config, behavior, time, adaptiveVal);
      if (ok === false) setSaveError("couldn't save — try again");
    }, delay);
  };

  useEffect(() => {
    if (needsMigration.current) { scheduleSave(localMode, localConfig, localBehavior, localTime, 0); needsMigration.current = false; }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // One-time Fixed-mode migration: infer a global pre_meal_window from legacy
  // per-slot pre-meal times, drop those keys, tag _fixed_premeal_migrated.
  useEffect(() => {
    if (!fixedNeedsMigration.current) return;
    fixedNeedsMigration.current = false;
    const ft = localConfig.fixed_times || {};
    const diffs = [];
    for (const [preKey, mealKey] of [['pre_breakfast', 'breakfast'], ['pre_lunch', 'lunch'], ['pre_dinner', 'dinner']]) {
      if (ft[preKey] && ft[mealKey]) diffs.push((parseHHMM(ft[mealKey]).getTime() - parseHHMM(ft[preKey]).getTime()) / 60000);
    }
    const inferredWindow = diffs.length > 0 ? Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length) : (localConfig.pre_meal_window ?? 30);
    const newFixedTimes = { ...ft };
    delete newFixedTimes.pre_breakfast; delete newFixedTimes.pre_lunch; delete newFixedTimes.pre_dinner;
    const next = { ...localConfig, pre_meal_window: inferredWindow, fixed_times: newFixedTimes, _fixed_premeal_migrated: true };
    setLocalConfig(next);
    scheduleSave(localMode, next, localBehavior, localTime, 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateConfig = (key, value) => { const next = { ...localConfig, [key]: value }; setLocalConfig(next); scheduleSave(localMode, next, localBehavior, localTime); };
  const updateCascade = (key, value) => { const next = applyCascade({ ...localConfig, [key]: value }); setLocalConfig(next); scheduleSave(localMode, next, localBehavior, localTime); };
  const updateEvening = (updates) => {
    const next = { ...localConfig, ...updates };
    if (updates.evening_mode === 'before_sleep' && !next.sleep_time) next.sleep_time = '22:00';
    setLocalConfig(next);
    scheduleSave(localMode, next, localBehavior, localTime);
  };
  const tryUpdateMealCount = (newCount) => {
    const currentCount = localConfig.meal_count ?? 3;
    if (newCount >= currentCount) { updateConfig('meal_count', newCount); return; }
    const orphanSlots = [];
    if (newCount < 3) orphanSlots.push('meal_3', 'pre_meal_3');
    if (newCount < 2) orphanSlots.push('meal_2', 'pre_meal_2');
    const affected = supplements.filter((s) => s.slots?.some((sl) => orphanSlots.includes(sl)));
    if (affected.length > 0) setOrphanConfirm(newCount);
    else updateConfig('meal_count', newCount);
  };
  const updateFixed = (key, value) => { const next = { ...localConfig, fixed_times: { ...localConfig.fixed_times, [key]: value || null } }; setLocalConfig(next); scheduleSave(localMode, next, localBehavior, localTime); };
  const handleModeChange = (mode) => { const seeded = seedConfigForMode(localConfig, mode); setLocalMode(mode); setLocalConfig(seeded); scheduleSave(mode, seeded, localBehavior, localTime, 0); };
  const handleBehaviorChange = (behavior) => { setLocalBehavior(behavior); scheduleSave(localMode, localConfig, behavior, localTime, 0); };
  const handleTimeChange = (time) => { setLocalTime(time); scheduleSave(localMode, localConfig, localBehavior, time); };
  const handleAdaptiveChange = (val) => { setLocalAdaptive(val); scheduleSave(localMode, localConfig, localBehavior, localTime, 0, val); };

  const previewBase = parseHHMM('07:00');
  const derived = localMode !== 'fixed' && localMode !== 'fasting' ? deriveOffsets(localMode, localConfig) : null;
  const isOffsetMode = localMode === 'medication' || localMode === 'wakeup';
  const em = localConfig.evening_mode;

  const previewRows = (() => {
    if (localMode === 'fixed') {
      const ft = localConfig.fixed_times ?? {};
      const pmw = localConfig.pre_meal_window ?? 0;
      const rows = [];
      for (const [key, label] of [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner'], ['after_dinner', 'Evening']]) {
        if (ft[key]) { const d = parseHHMM(ft[key]); rows.push({ label, timeStr: fmtTime(d), sortKey: d.getTime() }); }
      }
      if (pmw > 0) {
        for (const [mealKey, label] of [['breakfast', 'Before Breakfast'], ['lunch', 'Before Lunch'], ['dinner', 'Before Dinner']]) {
          if (ft[mealKey]) { const d = addMins(parseHHMM(ft[mealKey]), -pmw); rows.push({ label, timeStr: fmtTime(d), sortKey: d.getTime() }); }
        }
      }
      return rows.sort((a, b) => a.sortKey - b.sortKey);
    }
    if (localMode === 'fasting') {
      const ifTimes = computeIFSlotTimes(localConfig);
      const rows = Object.entries(ifTimes).map(([sid, hhMM]) => { const d = parseHHMM(hhMM); return { label: IF_SLOTS.find((s) => s.id === sid)?.label ?? sid, timeStr: fmtTime(d), sortKey: d.getTime() }; });
      if (em === 'fixed' && localConfig.evening_time) { const d = parseHHMM(localConfig.evening_time); rows.push({ label: 'Evening', timeStr: fmtTime(d), sortKey: d.getTime() }); }
      else if (em === 'before_sleep' && localConfig.sleep_time) { const off = (localConfig.evening_offset_hours ?? 1) * 60 + (localConfig.evening_offset_minutes ?? 0); const d = addMins(parseHHMM(localConfig.sleep_time), -off); rows.push({ label: 'Evening', timeStr: fmtTime(d), sortKey: d.getTime() }); }
      return rows.sort((a, b) => a.sortKey - b.sortKey);
    }
    const rows = [
      { label: MODES.find((m) => m.id === localMode)?.title ?? 'Anchor', offset: 0 },
      ...Object.entries(derived || {}).filter(([sid, v]) => v != null && !(isOffsetMode && sid === 'after_dinner')).map(([sid, offset]) => ({ label: SLOTS.find((s) => s.id === sid)?.label ?? sid, offset })),
    ].sort((a, b) => a.offset - b.offset);
    if (isOffsetMode) {
      if (em === 'fixed' && localConfig.evening_time) rows.push({ label: 'Evening', timeStr: localConfig.evening_time });
      else if (em === 'before_sleep' && localConfig.sleep_time) { const off = (localConfig.evening_offset_hours ?? 1) * 60 + (localConfig.evening_offset_minutes ?? 0); rows.push({ label: 'Evening', timeStr: fmtTime(addMins(parseHHMM(localConfig.sleep_time), -off)) }); }
    }
    return rows;
  })();

  const showPreview =
    localMode !== 'none' &&
    ((selectedCard === 'anchor' && isOffsetMode) || (selectedCard === 'fasting' && localMode === 'fasting') || (selectedCard === 'fixed' && localMode === 'fixed'));

  const EveningEditor = () => (
    <View style={{ marginBottom: spacing.lg }}>
      <SectionHeader>Evening</SectionHeader>
      <HelperText>{selectedCard === 'fasting' ? 'a fixed slot at the end of your day' : 'a fixed slot independent of your anchor'}</HelperText>
      <View style={{ flexDirection: 'row', gap: spacing.xs, marginBottom: em ? spacing.sm : 0 }}>
        {[[null, 'Off'], ['fixed', 'Fixed time'], ['before_sleep', 'Before sleep']].map(([val, label]) => (
          <SegButton key={String(val)} active={em === val} onPress={() => updateEvening({ evening_mode: val })}>{label}</SegButton>
        ))}
      </View>
      {em === 'fixed' ? (
        <TimeRow label="Evening time" value={localConfig.evening_time || ''} onChange={(v) => updateEvening({ evening_mode: 'fixed', evening_time: v || null })} />
      ) : null}
      {em === 'before_sleep' ? (
        <View style={{ gap: spacing.xs }}>
          <TimeRow label="Bedtime" value={localConfig.sleep_time || ''} onChange={(v) => updateEvening({ evening_mode: 'before_sleep', sleep_time: v || null })} />
          <NumberCard
            label="Before bedtime"
            fields={[
              { value: localConfig.evening_offset_hours ?? 1, unit: 'hr', onChange: (n) => updateEvening({ evening_mode: 'before_sleep', evening_offset_hours: n }) },
              { value: localConfig.evening_offset_minutes ?? 0, unit: 'min', onChange: (n) => updateEvening({ evening_mode: 'before_sleep', evening_offset_minutes: n }) },
            ]}
          />
        </View>
      ) : null}
    </View>
  );

  return (
    <View>
      {saveError ? <Text size="caption" tone="danger" style={{ marginBottom: spacing.md }}>{saveError}</Text> : null}

      {/* Schedule type */}
      <View style={{ marginBottom: spacing.lg }}>
        <SectionHeader>Schedule type</SectionHeader>
        {localMode === 'none' ? <HelperText>add items without a time slot to use a simple checklist</HelperText> : null}
        <View>
          {DISPLAY_MODES.map((m, i) => (
            <OptionRow
              key={m.id}
              ix={String(i + 1).padStart(2, '0')}
              title={m.title}
              desc={m.desc}
              active={selectedCard === m.id}
              onPress={() => {
                setSelectedCard(m.id);
                if (m.id === 'anchor') { if (localMode !== 'medication' && localMode !== 'wakeup') handleModeChange('medication'); }
                else handleModeChange(m.id);
              }}
            />
          ))}
        </View>

        {selectedCard === 'anchor' ? (
          <View style={{ marginTop: spacing.sm }}>
            <SectionHeader>Anchor type</SectionHeader>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {ANCHOR_SUB_MODES.map((sub) => (
                <Button key={sub.id} variant="selector" active={localMode === sub.id} style={{ flex: 1 }} onPress={() => handleModeChange(sub.id)}>{sub.label}</Button>
              ))}
            </View>
            {isOffsetMode ? <HelperText style={{ marginTop: spacing.xs, marginBottom: 0 }}>{ANCHOR_NOTES[localMode]}</HelperText> : null}
          </View>
        ) : null}
      </View>

      {/* Daily timing */}
      {localMode !== 'fixed' && localMode !== 'none' && localMode !== 'fasting' ? (
        <View style={{ marginBottom: spacing.md }}>
          <SectionHeader>Daily timing</SectionHeader>
          {localBehavior === 'flexible' ? <HelperText>tap each morning to set your schedule for the day</HelperText> : null}
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            {[['flexible', 'Flexible'], ['consistent', 'Consistent']].map(([val, label]) => (
              <SegButton key={val} active={localBehavior === val} onPress={() => handleBehaviorChange(val)}>{label}</SegButton>
            ))}
          </View>
          {localBehavior === 'consistent' ? (
            <View style={{ marginTop: spacing.sm }}>
              <Label>Start time</Label>
              <PickerField mode="time" value={localTime} onChange={handleTimeChange} placeholder="set time" />
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Adaptive timing */}
      {isOffsetMode ? (
        <View style={{ marginBottom: spacing.md }}>
          <SectionHeader>Adaptive timing</SectionHeader>
          <HelperText>slot times shift based on when you actually log each step</HelperText>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            {[[false, 'Off'], [true, 'On']].map(([val, label]) => (
              <SegButton key={label} active={localAdaptive === val} onPress={() => handleAdaptiveChange(val)}>{label}</SegButton>
            ))}
          </View>
        </View>
      ) : null}

      {/* Anchor: meal cascade + pre-meal + evening */}
      {isOffsetMode ? (
        <>
          <View style={{ marginBottom: spacing.md }}>
            <SectionHeader>Meal schedule</SectionHeader>
            <View style={{ gap: spacing.xs }}>
              {[
                { key_h: 'first_meal_offset_hours', key_m: 'first_meal_offset_minutes', label: 'First meal', caption: 'hours after your anchor' },
                { key_h: 'meal_interval_hours', key_m: 'meal_interval_minutes', label: 'Meal interval', caption: 'hours between meals' },
              ].map(({ key_h, key_m, label, caption }) => (
                <View key={key_h}>
                  <NumberCard
                    label={label}
                    fields={[
                      { value: localConfig[key_h] ?? 0, unit: 'hr', onChange: (n) => updateCascade(key_h, n) },
                      { value: localConfig[key_m] ?? 0, unit: 'min', onChange: (n) => updateCascade(key_m, n) },
                    ]}
                  />
                  <HelperText style={{ marginTop: spacing.xxxs }}>{caption}</HelperText>
                </View>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: spacing.md }}>
            <SectionHeader>Pre-meal window</SectionHeader>
            <HelperText>how early before each meal to schedule pre-meal items</HelperText>
            <NumberCard label="Pre-meal items" fields={[{ value: localConfig.pre_meal_window ?? 30, unit: 'min', width: 64, onChange: (n) => updateConfig('pre_meal_window', n) }]} />
          </View>

          <EveningEditor />
        </>
      ) : null}

      {/* Fasting (IF) */}
      {selectedCard === 'fasting' ? (
        <View style={{ marginBottom: spacing.lg }}>
          <View style={{ marginBottom: spacing.md }}>
            <SectionHeader>Eating window</SectionHeader>
            <HelperText>{localConfig.eating_window_flexible ? 'tap to open your window each day; meal times flow from when you actually start' : 'your eating window opens at the same time every day'}</HelperText>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {[[false, 'Fixed'], [true, 'Flexible']].map(([val, label]) => (
                <SegButton key={label} active={!!localConfig.eating_window_flexible === val} onPress={() => updateConfig('eating_window_flexible', val)}>{label}</SegButton>
              ))}
            </View>
          </View>
          <View style={{ marginBottom: spacing.md }}>
            <Label>{localConfig.eating_window_flexible ? 'Target window start' : 'Eating window start'}</Label>
            <HelperText>{localConfig.eating_window_flexible ? 'when to nudge you to open your window' : 'when your eating window opens each day'}</HelperText>
            <PickerField mode="time" value={localConfig.eating_window_start || ''} onChange={(v) => updateConfig('eating_window_start', v || null)} placeholder="set time" />
          </View>
          <View style={{ marginBottom: spacing.md }}>
            <SectionHeader>Window duration</SectionHeader>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {[[4, '4 hr'], [6, '6 hr'], [8, '8 hr'], [10, '10 hr'], [12, '12 hr']].map(([val, lbl]) => (
                <SegButton key={val} active={(localConfig.eating_window_duration_hours ?? 8) === val} onPress={() => updateConfig('eating_window_duration_hours', val)}>{lbl}</SegButton>
              ))}
            </View>
          </View>
          <View style={{ marginBottom: spacing.md }}>
            <SectionHeader>Meals</SectionHeader>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {[[2, '2 meals'], [3, '3 meals']].map(([val, lbl]) => (
                <SegButton key={val} active={(localConfig.meal_count ?? 3) === val} onPress={() => tryUpdateMealCount(val)}>{lbl}</SegButton>
              ))}
            </View>
          </View>
          <View style={{ marginBottom: spacing.md }}>
            <SectionHeader>Pre-meal window</SectionHeader>
            <HelperText>how early before each meal to take pre-meal items</HelperText>
            <NumberCard label="Pre-meal items" fields={[{ value: localConfig.pre_meal_window ?? 30, unit: 'min', width: 64, onChange: (n) => updateConfig('pre_meal_window', n) }]} />
          </View>
          <EveningEditor />
        </View>
      ) : null}

      {/* Fixed times */}
      {selectedCard === 'fixed' ? (
        <>
          <View style={{ marginBottom: spacing.md }}>
            <SectionHeader>Fixed times</SectionHeader>
            <View style={{ gap: spacing.xs }}>
              {[['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner'], ['after_dinner', 'Evening']].map(([key, label]) => (
                <TimeRow key={key} label={label} value={localConfig.fixed_times?.[key] || ''} onChange={(v) => updateFixed(key, v)} />
              ))}
            </View>
          </View>
          <View style={{ marginBottom: spacing.lg }}>
            <SectionHeader>Pre-meal window</SectionHeader>
            <NumberCard label="Pre-meal items" fields={[{ value: localConfig.pre_meal_window ?? 30, unit: 'min', width: 64, onChange: (n) => updateConfig('pre_meal_window', n) }]} />
            <HelperText style={{ marginTop: spacing.xxxs, marginBottom: 0 }}>pre-breakfast, pre-lunch, and pre-dinner slots are scheduled this many minutes before their meal</HelperText>
          </View>
        </>
      ) : null}

      {/* Live preview */}
      {showPreview ? (
        <View style={{ marginBottom: spacing.lg }}>
          <Label>{localMode === 'fixed' || localMode === 'fasting' ? 'schedule preview' : 'preview — 7:00 am anchor'}</Label>
          <View style={{ borderRadius: theme.radius.surface, borderWidth: theme.borderWidth.default, borderColor: theme.border.subtle, backgroundColor: "transparent", padding: spacing.md, gap: spacing.xs }}>
            {previewRows.length === 0 ? (
              <Text tone="secondary" size="caption">no times configured yet</Text>
            ) : (
              previewRows.map((row, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Text style={{ fontFamily: fonts.grotesk.bold, fontSize: typography.title, color: theme.text.primary, fontVariant: ['tabular-nums'], minWidth: 72 }}>{row.timeStr ?? fmtTime(addMins(previewBase, row.offset))}</Text>
                  <Text tone="secondary" size="caption" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{row.label}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      ) : null}

      <Modal
        open={orphanConfirm !== null}
        onClose={() => setOrphanConfirm(null)}
        title="supplements will be hidden"
        footer={
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <Button variant="tertiary" fullWidth onPress={() => setOrphanConfirm(null)}>cancel</Button>
            <Button variant="primary" fullWidth onPress={() => { updateConfig('meal_count', orphanConfirm); setOrphanConfirm(null); }}>continue</Button>
          </View>
        }
      >
        <Text tone="secondary">you have supplements assigned to slots that won't exist with fewer meals. they'll be hidden from your home screen until you reassign them</Text>
      </Modal>
    </View>
  );
}
