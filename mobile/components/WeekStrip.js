import { View, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { dateKey } from 'shared/lib/time';
import { calculateAdherenceForDate } from 'shared/lib/adherence';
import Text from './Text';
import AdherenceRing from './AdherenceRing';
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
          <Pressable onPress={onPrev} accessibilityRole="button" accessibilityLabel="Previous week" hitSlop={10} style={{ width: 30, height: 30, borderWidth: theme.borderWidth.default, borderColor: theme.border.subtle, alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={icon.xs} color={theme.text.secondary} />
          </Pressable>
          <Pressable onPress={canNext ? onNext : undefined} disabled={!canNext} accessibilityRole="button" accessibilityLabel="Next week" hitSlop={10} style={{ width: 30, height: 30, borderWidth: theme.borderWidth.default, borderColor: theme.border.subtle, alignItems: 'center', justifyContent: 'center', opacity: canNext ? 1 : 0.35 }}>
            <ChevronRight size={icon.xs} color={canNext ? theme.text.secondary : theme.text.tertiary} />
          </Pressable>
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
              {/* TODAY pill slot — web compact: height 14; pill caption2(10), padding 1px 4px */}
              <View style={{ height: 14, marginBottom: spacing.xxs, justifyContent: 'center', alignItems: 'center' }}>
                {isToday ? (
                  <View style={{ paddingHorizontal: 4, paddingVertical: 1, borderRadius: theme.radius.pill, backgroundColor: theme.status.nowBadgeBg }}>
                    <Text
                      allowFontScaling={false}
                      includeFontPadding={false}
                      // JetBrains Mono caps sit high in the line box; nudge down to
                      // optically center (re-measured for the 10px size).
                      style={{ fontSize: typography.caption2, lineHeight: typography.caption2, color: theme.status.nowBadgeText, fontFamily: fonts.mono.semibold, letterSpacing: 0.6, transform: [{ translateY: 1.5 }] }}
                    >
                      TODAY
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={{ fontSize: typography.caption2, color: theme.text.secondary, fontFamily: fonts.mono.regular, marginBottom: spacing.xxs }}>{DAYS_SHORT[date.getDay()]}</Text>
              <Text style={{ fontSize: typography.caption, color: theme.text.primary, fontFamily: isSelected ? fonts.mono.semibold : fonts.mono.regular, marginBottom: spacing.xs }}>{date.getDate()}</Text>
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
