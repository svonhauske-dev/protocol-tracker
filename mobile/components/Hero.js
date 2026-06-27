import { View, Pressable } from 'react-native';
import Card from './Card';
import Heading from './Heading';
import Text from './Text';
import Button from './Button';
import AdherenceRing from './AdherenceRing';
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
    return { eyebrow: { text: `Viewing ${dateStr}` }, status: viewDate.toLocaleDateString('en-US', { weekday: 'long' }), submeta: null, statusKind: 'text' };
  }

  if (isPast) {
    const pastEyebrow = { text: `Viewing ${dateStr}`, suffix: isReadOnly ? 'read-only' : 'editing', suffixTone: isReadOnly ? 'muted' : 'accent' };
    const completionLine = coreTotal === 0 ? 'No items logged' : allDone ? 'Completed' : completionText;
    if (isAnchor && effectivePill) {
      // Match today's treatment: "STARTED AT" eyebrow + the time as the big number.
      const startedEyebrow = { text: 'Started at', suffix: isReadOnly ? 'read-only' : 'editing', suffixTone: isReadOnly ? 'muted' : 'accent' };
      if (allDone) return { eyebrow: startedEyebrow, status: 'Completed', statusIsDone: true, submeta: `Started at ${effectivePill}`, statusKind: 'text' };
      return { eyebrow: startedEyebrow, status: effectivePill, submeta: completionLine, statusKind: 'time' };
    }
    if (isAnchor) {
      if (allDone) return { eyebrow: pastEyebrow, status: 'Completed', statusIsDone: true, submeta: 'No anchor recorded', statusKind: 'text' };
      return { eyebrow: pastEyebrow, status: 'No anchor recorded', submeta: coreTotal === 0 ? null : completionLine, statusKind: 'text' };
    }
    return { eyebrow: pastEyebrow, status: completionLine, statusIsDone: allDone, submeta: null, statusKind: 'text' };
  }

  const todayEyebrowText = `Viewing Today, ${dateStr}`;

  if (scheduleMode === 'none') {
    return { eyebrow: { text: todayEyebrowText }, status: viewDate.toLocaleDateString('en-US', { weekday: 'long' }), submeta: allDone ? 'Protocol complete' : completionText, statusKind: 'text' };
  }

  if (scheduleMode === 'fixed') {
    if (allDone) return { eyebrow: { text: todayEyebrowText }, status: 'Done for today', submeta: null, statusKind: 'text' };
    if (nextFixedSlot) return { eyebrow: { text: todayEyebrowText }, status: nextFixedSlot.time, submeta: `Next · ${nextFixedSlot.label}`, statusKind: 'time' };
    return { eyebrow: { text: todayEyebrowText }, status: completionText || 'Fixed schedule', submeta: null, statusKind: 'text' };
  }

  if (scheduleMode === 'fasting') {
    if (allDone) return { eyebrow: { text: todayEyebrowText }, status: 'Done for today', submeta: null, statusKind: 'text' };
    if (isFlexibleIF) {
      if (eatingWindowClose) return { eyebrow: { text: todayEyebrowText }, status: 'Fasting', submeta: eatingWindowOpen ? `Window ${eatingWindowOpen}–${eatingWindowClose}` : `Closed ${eatingWindowClose}`, statusKind: 'text' };
      if (eatingWindowOpen) return { eyebrow: { text: todayEyebrowText }, status: `Open since ${eatingWindowOpen}`, submeta: completionText, statusKind: 'text', ifAction: 'close' };
      return { eyebrow: { text: todayEyebrowText }, status: eatingWindowStart || '--:--', submeta: 'Tap to open your window', statusKind: 'time', ifAction: 'open' };
    }
    return { eyebrow: { text: todayEyebrowText }, status: eatingWindowStart || '--:--', submeta: 'Eating window opens', statusKind: 'time' };
  }

  // Anchor (medication / wakeup)
  if (!effectivePill) {
    return { eyebrow: { text: todayEyebrowText }, status: 'Not started yet', submeta: null, statusKind: 'text', showSetAnchor: true };
  }
  const anchorLine = `Started at ${effectivePill}`;
  if (allDone) return { eyebrow: { text: 'Started at' }, status: 'Done for today', statusIsDone: true, submeta: anchorLine, statusKind: 'text', canEditAnchor: true };
  // Eyebrow = "STARTED AT"; the time is the big number (the date is redundant — the picker shows it).
  if (!completionText) return { eyebrow: { text: 'Started at' }, status: effectivePill, submeta: 'Add items to start tracking', statusKind: 'time', canEditAnchor: true };
  return { eyebrow: { text: 'Started at' }, status: effectivePill, submeta: completionText, statusKind: 'time', canEditAnchor: true };
}

const START_LABELS = { medication: 'Start my day', wakeup: 'Start my day' };

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
  const statusVisual = state.statusKind === 'time' ? 'display' : 'title';

  return (
    <Card
      style={{
        minHeight: 132,
        marginBottom: spacing.md,
        backgroundColor: flashGreen ? theme.status.successSubtle : theme.surface.card,
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
              <Heading level={2} visual={statusVisual} weight="bold" font="heading" numberOfLines={1} style={{ color: statusColor, flexShrink: 1 }}>
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
              <Button variant="startDay" fullWidth onPress={startDay}>{START_LABELS[scheduleMode] || 'Start my day'}</Button>
            </View>
          ) : null}
          {state.ifAction && !isReadOnly ? (
            <View style={{ marginTop: spacing.sm }}>
              <Button
                variant={state.ifAction === 'open' ? 'startDay' : 'secondary'}
                fullWidth
                onPress={state.ifAction === 'open' ? openEatingWindow : closeEatingWindow}
              >
                {state.ifAction === 'open' ? 'Start eating window' : 'Close eating window'}
              </Button>
            </View>
          ) : null}
        </View>

        <AdherenceRing percentage={pct} size={72} />
      </View>
    </Card>
  );
}
