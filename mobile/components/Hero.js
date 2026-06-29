import { View, Pressable } from 'react-native';
import Card from './Card';
import Heading from './Heading';
import Text from './Text';
import Button from './Button';
import Meter from './Meter';
import { theme, spacing, typography } from '../theme';

// getHeroState — ported verbatim from src/components/Hero.jsx (pure, no DOM).
function getHeroState({
  scheduleMode, isToday, isPast, isFuture, isReadOnly, viewDate,
  pillTime, anchorBehavior, consistentTime, eatingWindowStart,
  isFlexibleIF, eatingWindowOpen, eatingWindowClose,
  nextFixedSlot, pct, coreTotal, coreDone,
}) {
  const isAnchor = scheduleMode === 'medication' || scheduleMode === 'wakeup';
  const isConsistent = anchorBehavior === 'consistent';
  const effectivePill = pillTime || (isConsistent ? consistentTime : null);
  const allDone = pct === 100 && coreTotal > 0;
  const completionText = coreTotal > 0 ? `${coreDone} of ${coreTotal} done` : null;
  const dateStr = viewDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (isFuture) {
    return { eyebrow: { text: `Viewing ${dateStr}` }, status: viewDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(), submeta: null, statusKind: 'text' };
  }

  if (isPast) {
    const pastSuffix = isReadOnly ? 'read-only' : 'editing';
    const pastEyebrow = { text: isReadOnly ? 'Read-only' : 'Editing' };
    const startedEyebrow = { text: 'Started at', suffix: pastSuffix, suffixTone: isReadOnly ? 'muted' : 'accent' };
    // Anchor day with a recorded time → the TIME stays the hero readout, even
    // when complete; the green 100% meter carries "done". We never replace the
    // data with a word, and never render a word at the numeric readout size.
    if (isAnchor && effectivePill) {
      return { eyebrow: startedEyebrow, status: effectivePill, submeta: completionText || 'add items to start tracking', statusKind: 'time' };
    }
    if (isAnchor) {
      return { eyebrow: pastEyebrow, status: 'no anchor recorded', submeta: completionText, statusKind: 'text' };
    }
    // Non-anchor (no time): prose status. Completed → calm green "complete" in
    // Grotesk (NOT the 44px numeral readout); the green meter is the celebration.
    if (allDone && coreTotal > 0) {
      return { eyebrow: pastEyebrow, status: 'complete', statusIsDone: true, submeta: completionText, statusKind: 'text' };
    }
    return { eyebrow: pastEyebrow, status: coreTotal === 0 ? 'no items logged' : completionText, submeta: null, statusKind: 'text' };
  }

  const todayEyebrowText = `Viewing Today, ${dateStr}`;

  if (scheduleMode === 'none') {
    return { eyebrow: { text: todayEyebrowText }, status: viewDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(), submeta: allDone ? 'protocol complete' : completionText, statusKind: 'text' };
  }

  if (scheduleMode === 'fixed') {
    if (allDone) return { eyebrow: { text: todayEyebrowText }, status: 'done for today', submeta: null, statusKind: 'text' };
    if (nextFixedSlot) return { eyebrow: { text: todayEyebrowText }, status: nextFixedSlot.time, submeta: `next · ${nextFixedSlot.label}`, statusKind: 'time' };
    return { eyebrow: { text: todayEyebrowText }, status: completionText || 'fixed schedule', submeta: null, statusKind: 'text' };
  }

  if (scheduleMode === 'fasting') {
    if (allDone) return { eyebrow: { text: todayEyebrowText }, status: 'done for today', submeta: null, statusKind: 'text' };
    if (isFlexibleIF) {
      if (eatingWindowClose) return { eyebrow: { text: todayEyebrowText }, status: 'fasting', submeta: eatingWindowOpen ? `window ${eatingWindowOpen}–${eatingWindowClose}` : `closed ${eatingWindowClose}`, statusKind: 'text' };
      if (eatingWindowOpen) return { eyebrow: { text: todayEyebrowText }, status: `open since ${eatingWindowOpen}`, submeta: completionText, statusKind: 'text', ifAction: 'close' };
      return { eyebrow: { text: todayEyebrowText }, status: eatingWindowStart || '--:--', submeta: 'tap to open your window', statusKind: 'time', ifAction: 'open' };
    }
    return { eyebrow: { text: todayEyebrowText }, status: eatingWindowStart || '--:--', submeta: 'eating window opens', statusKind: 'time' };
  }

  // Anchor (medication / wakeup)
  if (!effectivePill) {
    return { eyebrow: { text: todayEyebrowText }, status: 'not started yet', submeta: null, statusKind: 'text', showSetAnchor: true };
  }
  // Completed anchor day keeps the TIME as the hero readout (white), with the
  // green 100% meter signalling done — consistent with past anchor days, and the
  // hero never loses its number on success.
  if (allDone) return { eyebrow: { text: 'Started at' }, status: effectivePill, submeta: completionText, statusKind: 'time', canEditAnchor: true };
  // Eyebrow = "STARTED AT"; the time is the big number (the date is redundant — the picker shows it).
  if (!completionText) return { eyebrow: { text: 'Started at' }, status: effectivePill, submeta: 'add items to start tracking', statusKind: 'time', canEditAnchor: true };
  return { eyebrow: { text: 'Started at' }, status: effectivePill, submeta: completionText, statusKind: 'time', canEditAnchor: true };
}

const START_LABELS = { medication: 'start my day', wakeup: 'start my day' };

export default function Hero(props) {
  const {
    scheduleMode, isToday, viewDate, pct, coreTotal, coreDone,
    pillTime, anchorBehavior, consistentTime, eatingWindowStart,
    isFlexibleIF, eatingWindowOpen, eatingWindowClose, openEatingWindow, closeEatingWindow,
    isFuture, flashGreen, startDay, isPast, isReadOnly, nextFixedSlot, onEditAnchor,
  } = props;

  const state = getHeroState({
    scheduleMode, isToday, isPast, isFuture, isReadOnly, viewDate,
    pillTime, anchorBehavior, consistentTime, eatingWindowStart,
    isFlexibleIF, eatingWindowOpen, eatingWindowClose,
    nextFixedSlot, pct, coreTotal, coreDone,
  });

  const statusColor = state.statusIsDone ? theme.status.success : theme.text.primary;
  // Data is the hero: time/percent readouts render in oversized tabular MONO
  // (not Space Grotesk) so the app speaks one type language for data. Prose
  // statuses ("Done for today") stay in Grotesk title.
  const isTimeKind = state.statusKind === 'time';

  return (
    <Card
      style={{
        minHeight: 132,
        marginBottom: spacing.md,
        backgroundColor: flashGreen ? theme.status.successSubtle : 'transparent',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          {/* Eyebrow */}
          <Heading level={2} visual="label" font="heading" numberOfLines={1} style={{ marginBottom: spacing.xs, minHeight: 16 }}>
            {state.eyebrow.text}
            {state.eyebrow.suffix ? (
              <Text size="label" style={{ color: state.eyebrow.suffixTone === 'accent' ? theme.accent.default : theme.text.tertiary }}>
                {` · ${state.eyebrow.suffix}`}
              </Text>
            ) : null}
          </Heading>

          {/* Status */}
          {state.status ? (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, minHeight: 44 }}>
              <Heading
                level={2}
                visual={isTimeKind ? 'display' : 'title'}
                weight="bold"
                font={isTimeKind ? 'body' : 'heading'}
                numberOfLines={1}
                style={{
                  color: statusColor,
                  flexShrink: 1,
                  ...(isTimeKind ? { fontSize: typography.readout, lineHeight: 46, letterSpacing: -1, fontVariant: ['tabular-nums'] } : {}),
                }}
              >
                {state.status}
              </Heading>
              {state.canEditAnchor && !isReadOnly && onEditAnchor ? (
                <Pressable onPress={onEditAnchor} hitSlop={{ top: 15, bottom: 15, left: 14, right: 14 }} accessibilityRole="button" accessibilityLabel="Edit anchor time" style={{ marginBottom: 5 }}>
                  <Text tone="tertiary" size="label">edit</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* Submeta */}
          {state.submeta ? <Text tone="secondary" size="caption" numberOfLines={1} style={{ marginTop: spacing.xs }}>{state.submeta}</Text> : null}

          {/* CTAs */}
          {state.showSetAnchor && !isReadOnly ? (
            <View style={{ marginTop: spacing.sm }}>
              <Button variant="startDay" fullWidth onPress={startDay}>{START_LABELS[scheduleMode] || 'start my day'}</Button>
            </View>
          ) : null}
          {state.ifAction && !isReadOnly ? (
            <View style={{ marginTop: spacing.sm }}>
              <Button
                variant={state.ifAction === 'open' ? 'startDay' : 'secondary'}
                fullWidth
                onPress={state.ifAction === 'open' ? openEatingWindow : closeEatingWindow}
              >
                {state.ifAction === 'open' ? 'start eating window' : 'close eating window'}
              </Button>
            </View>
          ) : null}
        </View>

        <Meter pct={pct} cells={8} orientation="vertical" cellW={22} cellH={6} gap={3} showText />
      </View>
    </Card>
  );
}
