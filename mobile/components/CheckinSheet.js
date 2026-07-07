import { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import Text from './Text';
import SectionHeader from './SectionHeader';
import HelperText from './HelperText';
import FeelingScale from './FeelingScale';
import { isHealthSupported, readSleepHours } from '../lib/health';
import { theme, spacing } from '../theme';

// A 1–5 rating as a row of sharp cells, filled up to the selected level (block
// aesthetic, matching the Meter). Tapping a cell sets that level; tapping the
// current level again clears it (so a metric can be skipped).
function RatingRow({ label, value, onChange }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs }}>
        <Text>{label}</Text>
        <Text size="label" tone="tertiary">{value ? `${value}/5` : '—'}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = value != null && n <= value;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(value === n ? null : n)}
              accessibilityRole="button"
              accessibilityLabel={`${label} ${n} of 5`}
              hitSlop={{ top: 8, bottom: 8 }}
              style={{ flex: 1, height: 28, borderWidth: theme.borderWidth.default, borderColor: filled ? theme.text.primary : theme.border.subtle, backgroundColor: filled ? theme.text.primary : 'transparent' }}
            />
          );
        })}
      </View>
    </View>
  );
}

// Daily outcomes check-in — "how do you feel today?". Turns the app from an
// input tracker into an outcomes tracker (the retention loop).
export default function CheckinSheet({ open, onClose, initial, onSave, saving }) {
  const [energy, setEnergy] = useState(null);
  const [mood, setMood] = useState(null);
  const [sleep, setSleep] = useState(null);
  const [note, setNote] = useState('');
  const [healthSleep, setHealthSleep] = useState(null); // last night's hours, from Apple Health

  // Re-seed from the day's existing check-in each time the sheet opens.
  useEffect(() => {
    if (open) {
      setEnergy(initial?.energy ?? null);
      setMood(initial?.mood ?? null);
      setSleep(initial?.sleep ?? null);
      setNote(initial?.note ?? '');
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fill sleep from Apple Health (objective hours) when connected — so you
  // don't hand-rate it. Guarded no-op off-device.
  useEffect(() => {
    let alive = true;
    if (!open || global.localStorage.getItem('health_enabled') !== '1') { setHealthSleep(null); return; }
    isHealthSupported().then((ok) => {
      if (!ok || !alive) return;
      readSleepHours().then((h) => { if (alive) setHealthSleep(h); }).catch(() => {});
    }).catch(() => {});
    return () => { alive = false; };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const empty = energy == null && mood == null && sleep == null && !note.trim();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="how do you feel?"
      footer={
        <Button variant="primary" fullWidth disabled={empty || saving} onPress={() => onSave({ energy, mood, sleep, note: note.trim() })}>
          {saving ? 'saving…' : 'save check-in'}
        </Button>
      }
    >
      <HelperText>a few taps a day — spot your patterns and feel more in control</HelperText>

      {/* Feeling — the settled axis (same instrument as the daily moment). */}
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={{ marginBottom: spacing.md }}>feeling</Text>
        <FeelingScale value={mood} onSet={setMood} />
      </View>

      {/* Optional depth. */}
      <RatingRow label="energy" value={energy} onChange={setEnergy} />
      {healthSleep != null ? (
        <View style={{ marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text>sleep</Text>
          <Text size="label" tone="tertiary">{healthSleep}h · apple health</Text>
        </View>
      ) : (
        <RatingRow label="sleep" value={sleep} onChange={setSleep} />
      )}

      <View style={{ marginTop: spacing.xs }}>
        <SectionHeader>Notes</SectionHeader>
        <Input value={note} placeholder="symptoms, side-effects, anything…" onChangeText={setNote} />
      </View>
    </Modal>
  );
}
