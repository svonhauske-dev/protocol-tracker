import { View, Pressable } from 'react-native';
import Text from './Text';
import { theme, spacing, typography, fonts } from '../theme';

// The daily "how you feel" vocabulary — one overall wellbeing state, 1–5. Backed
// by the check-in `mood` column (no migration). Shared so the input and the
// Trends read-out speak the same language.
export const FEELING_STATES = ['rough', 'low', 'ok', 'good', 'great'];

// The feeling axis — an evenly-calibrated scale you tap, not a boxed control.
// Every state is labelled (so it reads before you've picked), the marker is
// Origin's inverted-primary block (the TODAY-chip / done language), and the
// ticks sit at even 20% intervals with a rail spanning end to end.
export default function FeelingScale({ value, onSet }) {
  return (
    <View>
      {/* Rail + ticks — 5 equal cells, tick centred in each → even spacing. */}
      <View style={{ height: 24, justifyContent: 'center' }}>
        <View style={{ position: 'absolute', left: '10%', right: '10%', height: theme.borderWidth.default, backgroundColor: theme.border.subtle }} />
        <View style={{ flexDirection: 'row' }}>
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
                hitSlop={{ top: 18, bottom: 18 }}
                style={{ flex: 1, alignItems: 'center' }}
              >
                <View style={{ width: selected ? 13 : theme.borderWidth.default * 2, height: selected ? 13 : 11, backgroundColor: selected ? theme.text.primary : theme.text.tertiary }} />
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* All five labels, evenly under their ticks — the whole scale is legible. */}
      <View style={{ flexDirection: 'row', marginTop: spacing.sm }}>
        {FEELING_STATES.map((word, i) => {
          const n = i + 1;
          const selected = value === n;
          return (
            <View key={n} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontFamily: selected ? fonts.mono.semibold : fonts.mono.regular, fontSize: typography.label, color: selected ? theme.text.primary : theme.text.tertiary }}>{word}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
