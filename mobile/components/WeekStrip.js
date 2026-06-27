import { View, Pressable } from 'react-native';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { dateKey } from 'shared/lib/time';
import { calculateAdherenceForDate } from 'shared/lib/adherence';
import Text from './Text';
import AdherenceRing from './AdherenceRing';
import IconButton from './IconButton';
import { theme, spacing, fonts, typography, icon, shadow, letterSpacing as LS } from '../theme';

// 7-day navigator (RN port of src/components/WeekStrip.jsx, compact/mobile mode).
// Each cell: reserved TODAY-pill slot, day abbrev, date number, 28px ring
// (hollow circle for future days). Selected cell gets the accent highlight.
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const RING = 28;

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
                borderWidth: isSelected ? theme.borderWidth.accent : theme.borderWidth.default,
                borderColor: isSelected ? theme.status.nowBorder : theme.border.subtle,
                backgroundColor: isSelected ? theme.status.nowHover : theme.surface.card,
                borderRadius: theme.radius.surface,
                ...(isSelected ? { zIndex: 1, transform: [{ scale: 1.02 }], ...shadow.elevated } : null),
              }}
            >
              <Text style={{ fontSize: typography.caption2, color: isToday ? theme.text.primary : theme.text.secondary, fontFamily: fonts.mono.regular, marginBottom: spacing.xxs }}>{DAYS_SHORT[date.getDay()]}</Text>
              {/* TODAY = the date in a filled chip (terminal-inverted). The transparent
                  chip on other days keeps every cell the same height (aligned). */}
              <View style={{ paddingHorizontal: 6, paddingVertical: 2, marginBottom: spacing.xs, borderRadius: theme.radius.badge, backgroundColor: isToday ? theme.text.primary : 'transparent' }}>
                <Text style={{ fontSize: typography.caption, color: isToday ? theme.surface.canvas : theme.text.primary, fontFamily: (isSelected || isToday) ? fonts.mono.semibold : fonts.mono.regular }}>{date.getDate()}</Text>
              </View>
              {pct !== null ? (
                <AdherenceRing percentage={pct} size={RING} showText={false} />
              ) : (
                <View style={{ width: RING, height: RING, borderRadius: RING / 2, borderWidth: 2, borderColor: theme.border.subtle, opacity: 0.35 }} />
              )}
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
