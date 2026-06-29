import { View } from 'react-native';
import Text from './Text';
import { theme, fonts, typography } from '../theme';

// Block-fill meter — the evolution of the adherence RING into the app's own
// progress grammar: the same discrete blocks as the boot loader (`[████░░░░]`).
// One motif, stamped everywhere progress is shown. Vertical (hero) or
// horizontal (week cell). White = active fill, green only at 100% (done rule).
export default function Meter({
  pct,
  cells = 8,
  orientation = 'vertical',
  cellW = 20,
  cellH = 6,
  gap = 3,
  showText = false,
}) {
  const safe = Math.max(0, Math.min(100, Math.round(pct ?? 0)));
  const filled = Math.round((safe / 100) * cells);
  const fill = safe >= 100 ? theme.status.success : theme.text.primary;
  const empty = theme.border.divider;
  const vertical = orientation === 'vertical';

  return (
    <View style={{ alignItems: 'center', gap: showText ? 6 : 0 }}>
      <View style={{ flexDirection: vertical ? 'column' : 'row', gap }}>
        {Array.from({ length: cells }, (_, i) => {
          // vertical fills bottom-up; horizontal fills left-to-right
          const on = vertical ? i >= cells - filled : i < filled;
          return <View key={i} style={{ width: cellW, height: cellH, backgroundColor: on ? fill : empty }} />;
        })}
      </View>
      {showText ? (
        <Text style={{ fontFamily: fonts.mono.bold, fontSize: typography.label, color: theme.text.primary, fontVariant: ['tabular-nums'] }}>{safe}%</Text>
      ) : null}
    </View>
  );
}
