import { useState } from 'react';
import { View, Pressable, useWindowDimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import DateRangeField from './DateRangeField';
import SupplementNameAutocomplete from './SupplementNameAutocomplete';
import { SLOTS, IF_SLOTS } from 'shared/lib/notifications';
import { dateKey, fmtTime, isPausedSupp } from 'shared/lib/time';
import { pluralizeUnit } from 'shared/lib/supply';
import Label from './Label';
import SectionHeader from './SectionHeader';
import Input from './Input';
import Button from './Button';
import Badge from './Badge';
import HelperText from './HelperText';
import Text from './Text';
import { theme, spacing, typography, touch, fonts } from '../theme';

// RN port of src/components/EditForm.jsx. Text + selector fields are fully
// functional. Date (scheduled/cycled) and time (pinned) inputs render as fields
// that open the native picker via onPickDate/onPickTime — wired in the rebuild.
const CATEGORIES = ['Oral', 'Rx', 'Injectable', 'Topical'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TREATMENT_MODES = [
  { value: 'indefinite', label: 'indefinite' },
  { value: 'scheduled', label: 'scheduled' },
  { value: 'cycled', label: 'cycled' },
];
const UNITS = ['days', 'weeks', 'months'];

// Minimal common dosage forms, shown as chips (like Category/Treatment) — solids
// + liquid + powder cover the overwhelming majority; "other" is a free-text
// escape for the rest (troche, patch, injection…). Strength (mg/mcg) → Notes.
const DOSE_FORMS = ['pill', 'tablet', 'capsule', 'mL'];
const OTHER = '__OTHER__';

const errStyle = { fontSize: typography.label, color: theme.status.danger, marginTop: spacing.xxxs };

// Input-styled field that opens a picker on tap (native date/time).
function FieldButton({ value, placeholder, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        minHeight: touch.min,
        borderWidth: theme.borderWidth.default,
        borderColor: theme.border.subtle,
        backgroundColor: "transparent",
        borderRadius: theme.radius.surface,
        paddingHorizontal: spacing.md,
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: value ? theme.text.primary : theme.text.tertiary, fontSize: typography.body, fontFamily: fonts.mono.regular }}>
        {value || placeholder}
      </Text>
    </Pressable>
  );
}

export default function EditForm({
  form,
  setForm,
  editingId,
  scheduleMode,
  mealCount = 3,
  eveningMode = null,
  supplementHistory = [],
  activeProtocols = [],
}) {
  const [nameTouched, setNameTouched] = useState(false);
  const [touched, setTouched] = useState({});
  const [pinnedOpen, setPinnedOpen] = useState(!!form.pinned_time);
  const [activePicker, setActivePicker] = useState(null); // { field, mode } — inline date/time picker
  const { width: screenW } = useWindowDimensions();

  const today = dateKey(new Date());
  const touchField = (field) => setTouched((t) => ({ ...t, [field]: true }));

  const pickerDate = (value, mode) => {
    if (mode === 'date' && value) { const [y, m, d] = value.split('-').map(Number); return new Date(y, m - 1, d); }
    if (mode === 'time' && value) { const [h, mi] = value.split(':').map(Number); const dt = new Date(); dt.setHours(h, mi, 0, 0); return dt; }
    return new Date();
  };

  // Date/time field: an Input-styled button that reveals the native picker
  // INLINE (not a second modal — that breaks on iOS over the form sheet).
  const PickerField = ({ field, mode, placeholder }) => {
    const open = activePicker?.field === field;
    return (
      <>
        <FieldButton value={form[field]} placeholder={placeholder} onPress={() => setActivePicker(open ? null : { field, mode })} />
        {open ? (
          <View style={{ marginTop: spacing.xs, alignItems: mode === 'time' ? 'center' : 'stretch' }}>
            <DateTimePicker
              value={pickerDate(form[field], mode)}
              mode={mode}
              display="spinner"
              themeVariant="dark"
              accentColor={theme.accent.default}
              style={mode === 'date' ? { width: screenW, marginLeft: -spacing.md } : undefined}
              onChange={(_e, d) => { if (d) setForm((f) => ({ ...f, [field]: mode === 'date' ? dateKey(d) : fmtTime(d) })); }}
            />
            <Button variant="secondary" fullWidth onPress={() => setActivePicker(null)} style={{ marginTop: spacing.xs }}>done</Button>
          </View>
        ) : null}
      </>
    );
  };

  const toggleSlot = (sid) =>
    setForm((f) => ({ ...f, slots: f.slots.includes(sid) ? f.slots.filter((x) => x !== sid) : [...f.slots, sid] }));
  const toggleDay = (i) =>
    setForm((f) => ({ ...f, days: f.days.includes(i) ? f.days.filter((x) => x !== i) : [...f.days, i] }));

  const handleModeChange = (newMode) => {
    setTouched({});
    setForm((f) => {
      const next = { ...f, treatment_mode: newMode };
      if (newMode === 'indefinite') {
        next.starts_at = null; next.ends_at = null;
        next.cycle_on_value = null; next.cycle_on_unit = null;
        next.cycle_off_value = null; next.cycle_off_unit = null;
      } else {
        if (!next.starts_at) next.starts_at = today;
        if (newMode === 'scheduled') {
          next.cycle_on_value = null; next.cycle_on_unit = null;
          next.cycle_off_value = null; next.cycle_off_unit = null;
        }
        if (newMode === 'cycled') {
          next.ends_at = null;
          if (!next.cycle_on_unit) next.cycle_on_unit = 'days';
          if (!next.cycle_off_unit) next.cycle_off_unit = 'days';
        }
      }
      return next;
    });
  };

  const mode = form.treatment_mode || 'indefinite';
  const dateOrderError = mode !== 'indefinite' && form.starts_at && form.ends_at && form.ends_at <= form.starts_at;

  return (
    <View>
      {editingId && isPausedSupp(form) ? (
        <View style={{ marginBottom: spacing.md, flexDirection: 'row' }}>
          <Badge variant="neutral">currently paused</Badge>
        </View>
      ) : null}

      {activeProtocols.length > 1 ? (
        <View style={{ marginBottom: spacing.md }}>
          <SectionHeader>Protocol</SectionHeader>
          <View style={{ gap: spacing.xs }}>
            {activeProtocols.map((p) => (
              <Button key={p.id} variant="selector" active={form.protocol_id === p.id} fullWidth onPress={() => setForm((f) => ({ ...f, protocol_id: p.id }))}>
                {p.name}
              </Button>
            ))}
            <Button variant="selector" active={!form.protocol_id} fullWidth onPress={() => setForm((f) => ({ ...f, protocol_id: null }))}>None</Button>
          </View>
        </View>
      ) : null}

      <View style={{ marginBottom: spacing.md }}>
        <SectionHeader>Name</SectionHeader>
        <SupplementNameAutocomplete
          value={form.name}
          history={supplementHistory}
          placeholder="e.g. Magnesium Glycinate"
          onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
          onBlur={() => setNameTouched(true)}
        />
        {nameTouched && !form.name?.trim() ? <Text style={errStyle}>name is required</Text> : null}
      </View>

      {/* Dose — amount + form chips (matches Category/Treatment). "other" reveals
          a free-text unit. Amount doubles as units-per-dose; strength → Notes. */}
      {(() => {
        const isOther = form.stock_unit === OTHER || (!!form.stock_unit && !DOSE_FORMS.includes(form.stock_unit));
        return (
          <View style={{ marginBottom: spacing.md }}>
            <SectionHeader>Dose</SectionHeader>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
              <Input width={72} keyboardType="numeric" value={form.units_per_dose} placeholder="1" onChangeText={(v) => setForm((f) => ({ ...f, units_per_dose: v.replace(/[^0-9.]/g, '') }))} />
              <Text tone="tertiary" size="label">per dose</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {DOSE_FORMS.map((fm) => (
                <Button key={fm} variant="selector" active={form.stock_unit === fm} style={{ flexGrow: 0, flexShrink: 0, flexBasis: 'auto' }} onPress={() => setForm((f) => ({ ...f, stock_unit: fm }))}>{fm}</Button>
              ))}
              <Button variant="selector" active={isOther} style={{ flexGrow: 0, flexShrink: 0, flexBasis: 'auto' }} onPress={() => setForm((f) => ({ ...f, stock_unit: isOther ? '' : OTHER }))}>other</Button>
            </View>
            {isOther ? (
              <Input value={form.stock_unit === OTHER ? '' : form.stock_unit} placeholder="e.g. troche" autoCapitalize="none" style={{ marginTop: spacing.xs }} onChangeText={(v) => setForm((f) => ({ ...f, stock_unit: v }))} />
            ) : null}
          </View>
        );
      })()}

      {/* Supply — directly under Dose so the unit flows ("90 capsules in the
          bottle"). Optional; "N left · ≈X days" derives from your check-off history. */}
      <View style={{ marginBottom: spacing.md }}>
        <SectionHeader>Supply</SectionHeader>
        <HelperText>optional — how many in the bottle, to track refills</HelperText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Input width={100} keyboardType="numeric" value={form.stock_count} placeholder="e.g. 90" onChangeText={(v) => setForm((f) => ({ ...f, stock_count: v.replace(/[^0-9.]/g, '') }))} />
          <Text tone="tertiary" size="label">{form.stock_unit && form.stock_unit !== OTHER ? `${pluralizeUnit(form.stock_unit, 2)} in the bottle` : 'in the bottle'}</Text>
        </View>
      </View>

      <View style={{ marginBottom: spacing.md }}>
        <SectionHeader>Notes</SectionHeader>
        <Input value={form.notes} placeholder="e.g. 50 mcg · Thorne · with food" onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))} />
      </View>

      <View style={{ marginBottom: spacing.md }}>
        <SectionHeader>Category</SectionHeader>
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          {CATEGORIES.map((cat) => (
            <Button key={cat} variant="selector" active={form.category === cat} style={{ flexGrow: 1, flexShrink: 1, flexBasis: 'auto' }} onPress={() => setForm((f) => ({ ...f, category: cat, slots: [] }))}>
              {cat}
            </Button>
          ))}
        </View>
      </View>

      {/* Treatment */}
      <View style={{ marginBottom: spacing.md }}>
        <SectionHeader>Treatment</SectionHeader>
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          {TREATMENT_MODES.map(({ value, label }) => (
            <Button key={value} variant="selector" active={mode === value} style={{ flex: 1 }} onPress={() => handleModeChange(value)}>{label}</Button>
          ))}
        </View>

        {mode === 'scheduled' ? (
          <View style={{ marginTop: spacing.sm }}>
            <HelperText style={{ marginBottom: spacing.sm }}>set a start and end date for this course</HelperText>
            <DateRangeField
              startValue={form.starts_at || ''}
              endValue={form.ends_at || ''}
              onChangeStart={(v) => setForm((f) => ({ ...f, starts_at: v }))}
              onChangeEnd={(v) => setForm((f) => ({ ...f, ends_at: v }))}
              onTouched={(which) => touchField(which === 'start' ? 'starts_at' : 'ends_at')}
            />
            {(touched.starts_at && !form.starts_at) || (touched.ends_at && !form.ends_at) ? <Text style={[errStyle, { marginTop: spacing.xxs }]}>start and end dates are required</Text> : null}
            {dateOrderError ? <Text style={[errStyle, { marginTop: spacing.xs }]}>end date must be after start date</Text> : null}
          </View>
        ) : null}

        {mode === 'cycled' ? (
          <View style={{ marginTop: spacing.sm }}>
            <HelperText style={{ marginBottom: spacing.sm }}>cycle this on and off. leave 'ends' blank for indefinite cycling</HelperText>
            <View style={{ marginBottom: spacing.sm }}>
              <Label style={{ marginBottom: spacing.xxs }}>Starts</Label>
              <PickerField field="starts_at" mode="date" placeholder="select date" />
              {touched.starts_at && !form.starts_at ? <Text style={errStyle}>required</Text> : null}
            </View>

            {[['On', 'cycle_on_value', 'cycle_on_unit'], ['Off', 'cycle_off_value', 'cycle_off_unit']].map(([lbl, valKey, unitKey]) => (
              <View key={valKey} style={{ marginBottom: spacing.sm }}>
                <Label style={{ marginBottom: spacing.xxs }}>{lbl}</Label>
                <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }}>
                  <Input
                    variant="number"
                    value={form[valKey] ? String(form[valKey]) : ''}
                    placeholder="0"
                    onChangeText={(v) => setForm((f) => ({ ...f, [valKey]: v ? Number(v) : null }))}
                    onBlur={() => touchField(valKey)}
                  />
                  <View style={{ flexDirection: 'row', gap: spacing.xs, flex: 1 }}>
                    {UNITS.map((u) => (
                      <Button key={u} variant="selector" active={form[unitKey] === u} style={{ flex: 1 }} onPress={() => setForm((f) => ({ ...f, [unitKey]: u }))}>{u}</Button>
                    ))}
                  </View>
                </View>
                {touched[valKey] && (!form[valKey] || form[valKey] <= 0) ? <Text style={errStyle}>must be greater than 0</Text> : null}
              </View>
            ))}

            <View>
              <Label style={{ marginBottom: spacing.xxs }}>Ends (optional)</Label>
              <PickerField field="ends_at" mode="date" placeholder="select date" />
            </View>
            {dateOrderError ? <Text style={[errStyle, { marginTop: spacing.xs }]}>end date must be after start date</Text> : null}
          </View>
        ) : null}
      </View>

      {/* When to take it */}
      <View style={{ marginBottom: spacing.md }}>
        <SectionHeader>When to take it</SectionHeader>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {(scheduleMode === 'fasting'
            ? IF_SLOTS.filter((s) => {
                if (s.id === 'pre_meal_2' || s.id === 'meal_2') return mealCount >= 2;
                if (s.id === 'pre_meal_3' || s.id === 'meal_3') return mealCount >= 3;
                if (s.id === 'evening') return !!eveningMode;
                return true;
              })
            : SLOTS.filter((s) => (s.id === 'rx' ? scheduleMode === 'medication' || form.slots.includes('rx') : true))
          ).map((slot) => (
            <Button key={slot.id} variant="selector" active={form.slots.includes(slot.id)} onPress={() => toggleSlot(slot.id)}>
              {slot.label}
            </Button>
          ))}
          {/* Anytime + Specific time flow in the SAME wrap row as the slots, so
              they sit next to Evening instead of dropping to their own block. */}
          <Button variant="selector" active={form.slots.length === 0} onPress={() => setForm((f) => ({ ...f, slots: [] }))}>Anytime</Button>
          <Button
            variant="selector"
            active={pinnedOpen}
            onPress={() => {
              if (pinnedOpen) { setPinnedOpen(false); setForm((f) => ({ ...f, pinned_time: null })); }
              else setPinnedOpen(true);
            }}
          >
            Specific time
          </Button>
        </View>

        {pinnedOpen ? (
          <View style={{ marginTop: spacing.sm }}>
            <PickerField field="pinned_time" mode="time" placeholder="select time" />
            <HelperText style={{ marginTop: spacing.xxxs }}>
              {form.slots.length === 0
                ? 'reminder at this exact time each day, independent of your schedule'
                : 'additional reminder at this exact time, on top of your cascade slot'}
            </HelperText>
          </View>
        ) : null}
      </View>

      {/* Which days */}
      {mode !== 'cycled' ? (
        <View style={{ marginBottom: spacing.md }}>
          <SectionHeader>Which days</SectionHeader>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            {DAYS.map((d, i) => (
              <Button key={i} variant="circle" active={form.days.includes(i)} onPress={() => toggleDay(i)}>{d[0]}</Button>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
