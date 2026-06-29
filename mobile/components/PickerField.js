import { useState, useId, useContext } from 'react';
import { View, Pressable, useWindowDimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { dateKey, fmtTime } from 'shared/lib/time';
import Text from './Text';
import Button from './Button';
import { PickerGroupContext } from './pickerGroup';
import { theme, spacing, typography, touch, fonts } from '../theme';

// Reusable Input-styled field that reveals the native date/time picker INLINE
// (not a second modal — that breaks on iOS over a sheet). value is the stored
// string: 'YYYY-MM-DD' for mode="date", 'HH:MM' for mode="time". Calls
// onChange(newString). Standalone (module-level) so it never remounts mid-edit.
export default function PickerField({ value, mode = 'time', placeholder = 'Select', onChange, width }) {
  const { width: screenW } = useWindowDimensions();
  // Coordinated open state — only one picker in a Modal is open at a time, so
  // two spinners never overlap. Falls back to local state outside a group.
  const gid = useId();
  const group = useContext(PickerGroupContext);
  const [localOpen, setLocalOpen] = useState(false);
  const open = group ? group.openId === gid : localOpen;
  const setOpen = (next) => {
    const v = typeof next === 'function' ? next(open) : next;
    if (group) group.setOpenId(v ? gid : null);
    else setLocalOpen(v);
  };

  const parsed = () => {
    if (mode === 'date' && value) { const [y, m, d] = value.split('-').map(Number); return new Date(y, m - 1, d); }
    if (mode === 'time' && value) { const [h, mi] = value.split(':').map(Number); const dt = new Date(); dt.setHours(h, mi, 0, 0); return dt; }
    return new Date();
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={{
          minHeight: touch.min,
          width: width ?? '100%',
          borderWidth: theme.borderWidth.default,
          borderColor: open ? theme.accent.default : theme.border.subtle,
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
      {open ? (
        <View style={{ marginTop: spacing.xs, alignItems: mode === 'time' ? 'center' : 'stretch' }}>
          {/* Date wheel pinned to full screen width + pulled left out of the md
              padding (its 3 columns clip at the padded width); time wheel is
              narrow and centers. Done gets an EXPLICIT content width — flex
              stretch resolves wrong next to the bleeding wheel. Done closes it
              (the wheel fires onChange while spinning, so no auto-close). */}
          <DateTimePicker
            value={parsed()}
            mode={mode}
            display="spinner"
            themeVariant="dark"
            accentColor={theme.accent.default}
            style={mode === 'date' ? { width: screenW, marginLeft: -spacing.md } : undefined}
            onChange={(_e, d) => { if (d) onChange(mode === 'date' ? dateKey(d) : fmtTime(d)); }}
          />
          <Button variant="secondary" fullWidth onPress={() => setOpen(false)} style={{ marginTop: spacing.xs }}>Done</Button>
        </View>
      ) : null}
    </>
  );
}
