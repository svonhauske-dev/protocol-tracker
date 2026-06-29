import { useState } from 'react';
import { View, Pressable, useWindowDimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { dateKey } from 'shared/lib/time';
import Label from './Label';
import Text from './Text';
import Button from './Button';
import { theme, spacing, typography, touch, fonts } from '../theme';

// Side-by-side Starts/Ends date fields (matches the web's two-up date inputs),
// with a SINGLE full-width picker dropdown rendered BELOW the row — so the wheel
// and Done span the full sheet width instead of being trapped in a half-width
// column. Only one field's picker is open at a time.
function parse(v) {
  if (!v) return new Date();
  const [y, m, d] = v.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function label(v) {
  if (!v) return null;
  const [y, m, d] = v.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function FieldBox({ value, placeholder, open, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        minHeight: touch.min,
        borderWidth: theme.borderWidth.default,
        borderColor: open ? theme.accent.default : theme.border.subtle,
        backgroundColor: "transparent",
        borderRadius: theme.radius.surface,
        paddingHorizontal: spacing.md,
        justifyContent: 'center',
      }}
    >
      <Text numberOfLines={1} style={{ color: value ? theme.text.primary : theme.text.tertiary, fontSize: typography.body, fontFamily: fonts.mono.regular }}>
        {label(value) || placeholder}
      </Text>
    </Pressable>
  );
}

export default function DateRangeField({ startLabel = 'Starts', endLabel = 'Ends', startValue, endValue, onChangeStart, onChangeEnd, onTouched, placeholder = 'Select date' }) {
  const { width: screenW } = useWindowDimensions();
  const [open, setOpen] = useState(null); // 'start' | 'end' | null
  const toggle = (which) => setOpen((o) => (o === which ? null : which));
  const activeValue = open === 'start' ? startValue : endValue;
  const setActive = open === 'start' ? onChangeStart : onChangeEnd;

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <View style={{ flex: 1 }}>
          <Label style={{ marginBottom: spacing.xxs }}>{startLabel}</Label>
          <FieldBox value={startValue} placeholder={placeholder} open={open === 'start'} onPress={() => toggle('start')} />
        </View>
        <View style={{ flex: 1 }}>
          <Label style={{ marginBottom: spacing.xxs }}>{endLabel}</Label>
          <FieldBox value={endValue} placeholder={placeholder} open={open === 'end'} onPress={() => toggle('end')} />
        </View>
      </View>

      {open ? (
        <View style={{ marginTop: spacing.xs }}>
          {/* Full-width wheel + Done. The wheel is pinned to the full screen
              width and pulled left out of the md padding (its 3 columns clip at
              the padded width). Rendered here, below the row, both span the
              full sheet — not the half-width field column. */}
          <DateTimePicker
            value={parse(activeValue)}
            mode="date"
            display="spinner"
            themeVariant="dark"
            accentColor={theme.accent.default}
            style={{ width: screenW, marginLeft: -spacing.md }}
            onChange={(_e, d) => { if (d) setActive(dateKey(d)); }}
          />
          <Button variant="secondary" fullWidth onPress={() => { if (onTouched && open) onTouched(open); setOpen(null); }} style={{ marginTop: spacing.xs }}>Done</Button>
        </View>
      ) : null}
    </View>
  );
}
