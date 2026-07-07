import { View, Pressable } from 'react-native';
import Text from './Text';
import { theme, spacing, typography, fonts } from '../theme';

// The daily "how you feel" vocabulary — one overall wellbeing state, 1–5. Backed
// by the check-in `mood` column (no migration). Shared so the home input and the
// Trends read-out speak the same language.
export const FEELING_STATES = ['rough', 'low', 'ok', 'good', 'great'];

// One-tap feeling input: the chosen state named large (the hero, echoing the
// clock/adherence numerals), on a calibrated tick rail with a marker you set —
// an instrument, not a boxed control. The filled marker is Origin's inverted
// primary, the same highlight language as the TODAY chip and done state.
export default function FeelingScale({ value, onSet }) {
  const last = FEELING_STATES.length - 1;
  const align = (i) => (i === 0 ? 'flex-start' : i === last ? 'flex-end' : 'center');
  return (
    <View>
      {/* The chosen state, named large. Empty prompt before you pick. */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', minHeight: 30, marginBottom: spacing.xs }}>
        {value != null ? (
          <Text style={{ fontFamily: fonts.grotesk.semibold, fontSize: typography.display, lineHeight: typography.display, color: theme.text.primary }}>{FEELING_STATES[value - 1]}</Text>
        ) : (
          <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.body, color: theme.text.tertiary }}>$ tap where you land today</Text>
        )}
      </View>

      {/* Calibrated tick rail. */}
      <View style={{ flexDirection: 'row', height: 20, alignItems: 'center' }}>
        <View style={{ position: 'absolute', left: 0, right: 0, height: theme.borderWidth.default, backgroundColor: theme.border.subtle }} />
        {FEELING_STATES.map((word, i) => {
          const n = i + 1;
          const selected = value === n;
          return (
            <Pressable
              key={n}
              onPress={() => onSet(selected ? null : n)}
              accessibilityRole="button"
              accessibilityLabel={`Feeling: ${word}`}
              accessibilityState={{ selected }}
              hitSlop={{ top: 14, bottom: 14 }}
              style={{ flex: 1, alignItems: align(i), justifyContent: 'center' }}
            >
              <View style={{ width: selected ? 11 : theme.borderWidth.default * 2, height: selected ? 11 : 9, backgroundColor: selected ? theme.text.primary : theme.text.tertiary }} />
            </Pressable>
          );
        })}
      </View>

      {/* End anchors — the scale legend, so it reads before you've picked. */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
        <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.label, color: theme.text.tertiary }}>{FEELING_STATES[0]}</Text>
        <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.label, color: theme.text.tertiary }}>{FEELING_STATES[last]}</Text>
      </View>
    </View>
  );
}
