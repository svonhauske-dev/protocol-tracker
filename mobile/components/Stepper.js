import { View, Pressable, Text } from 'react-native';
import { theme, typography, touch, fonts, spacing } from '../theme';

// [ − ] n [ + ] stepper — sharp hairline boxes with merged borders, the authored
// count control that replaces raw number fields. White tabular value, dim
// borders; matches the segmented-control vocabulary on the home/settings spine.
export default function Stepper({ value, onChange, min = 0, max = 999, step = 1, unit }) {
  const v = Number(value) || 0;
  const set = (n) => onChange?.(Math.max(min, Math.min(max, n)));

  const btn = (label, onPress, disabled) => (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      style={{ width: touch.min, height: touch.min, borderWidth: theme.borderWidth.default, borderColor: theme.border.subtle, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1 }}
    >
      <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.title, color: theme.text.primary }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {btn('−', () => set(v - step), v <= min)}
      <View style={{ minWidth: 48, height: touch.min, borderTopWidth: theme.borderWidth.default, borderBottomWidth: theme.borderWidth.default, borderColor: theme.border.subtle, marginLeft: -1, marginRight: -1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: spacing.xs }}>
        <Text style={{ fontFamily: fonts.mono.semibold, fontSize: typography.body, color: theme.text.primary, fontVariant: ['tabular-nums'] }}>{v}</Text>
        {unit ? <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.label, color: theme.text.tertiary }}>{unit}</Text> : null}
      </View>
      {btn('+', () => set(v + step), v >= max)}
    </View>
  );
}
