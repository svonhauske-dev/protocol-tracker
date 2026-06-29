import { View, Pressable } from 'react-native';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { dateKey } from 'shared/lib/time';
import { calculateAdherenceForDate } from 'shared/lib/adherence';
import Text from './Text';
import Meter from './Meter';
import IconButton from './IconButton';
import { theme, spacing, fonts, typography, icon, letterSpacing as LS } from '../theme';

// 7-day navigator (RN port of src/components/WeekStrip.jsx, compact/mobile mode).
// Each cell: reserved TODAY-pill slot, day abbrev, date number, 28px ring
// (hollow circle for future days). Selected cell gets the accent highlight.
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeekStrip({
  weekDates, logMap, supplements, activeSlotIds,
  selectedDate, today, onSelectDate, onPrev, onNext, canNext, rangeLabel,
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
        <Text tone="tertiary" size="label" style={{ fontFamily: fonts.mono.semibold, letterSpacing: LS.labelWide, textTransform: 'uppercase' }}>{`// ${rangeLabel}`}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <IconButton size={32} onPress={onPrev} accessibilityLabel="Previous week"><ArrowLeft size={icon.xs} color={theme.text.secondary} /></IconButton>
          <IconButton size={32} onPress={canNext ? onNext : undefined} disabled={!canNext} accessibilityLabel="Next week"><ArrowRight size={icon.xs} color={theme.text.secondary} /></IconButton>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.xxs }}>
        {weekDates.map((date) => {
          const dk = dateKey(date);
          const isFuture = date.getTime() > today.getTime();
          const isToday = dk === dateKey(today);
          const isSelected = dk === dateKey(selectedDate);
          const pct = isFuture ? null : calculateAdherenceForDate(date, supplements, logMap[dk] || null, activeSlotIds);
          return (
            <Pressable
              key={dk}
              onPress={() => onSelectDate(date)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${DAYS_SHORT[date.getDay()]} ${date.getDate()}${isToday ? ', today' : ''}${pct !== null ? `, ${pct}% done` : ''}`}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.xxs,
                // Constant border width + no scale/shadow → the cell never changes
                // size on selection or week-nav, so neighbours don't reflow/jump.
                // Selection now reads from a white border + a faint tint on the
                // same transparent-on-canvas surface every other cell uses.
                borderWidth: theme.borderWidth.default,
                borderColor: isSelected ? theme.text.primary : theme.border.subtle,
                backgroundColor: isSelected ? theme.status.nowBg : 'transparent',
                borderRadius: theme.radius.surface,
              }}
            >
              <Text style={{ fontSize: typography.caption2, color: isToday ? theme.text.primary : theme.text.secondary, fontFamily: fonts.mono.regular, marginBottom: spacing.xxs }}>{DAYS_SHORT[date.getDay()]}</Text>
              {/* TODAY = the date in a filled chip (terminal-inverted). The transparent
                  chip on other days keeps every cell the same height (aligned). */}
              <View style={{ paddingHorizontal: 6, paddingVertical: 2, marginBottom: spacing.xs, borderRadius: theme.radius.badge, backgroundColor: isToday ? theme.text.primary : 'transparent' }}>
                <Text style={{ fontSize: typography.caption, color: isToday ? theme.surface.canvas : theme.text.primary, fontFamily: (isSelected || isToday) ? fonts.mono.semibold : fonts.mono.regular }}>{date.getDate()}</Text>
              </View>
              {/* block-fill meter (future days render an empty track) — sits
                  tight under the date, not floating in a tall reserved box */}
              <View style={{ marginTop: spacing.xxs }}>
                <Meter pct={pct ?? 0} cells={5} orientation="horizontal" cellW={5} cellH={5} gap={2} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = {
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
};
