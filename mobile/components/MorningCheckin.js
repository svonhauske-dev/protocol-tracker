import { useEffect, useRef, useState } from 'react';
import { View, Pressable, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from './Text';
import Cursor from './Cursor';
import FeelingScale, { FEELING_STATES } from './FeelingScale';
import { useReduceMotion } from '../lib/useReduceMotion';
import { theme, spacing, typography, fonts } from '../theme';

function greetingFor(hour) {
  if (hour < 12) return 'good morning';
  if (hour < 18) return 'good afternoon';
  return 'good evening';
}

// The daily moment — a once-a-day, always-dismissible check-in ritual. Opens on
// first launch of the day when today's feeling isn't logged yet; a time-aware
// greeting at identity scale, the feeling instrument as the centerpiece, and a
// one-tap save that lands on a short confirmation beat before it slips away.
// Never blocks the app: tap the backdrop, "not now", or swipe intent all close.
export default function MorningCheckin({ open, name, dateLabel, hour = 8, streak = 0, onSelect, onNote, onClose }) {
  const reduceMotion = useReduceMotion();
  const slide = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const [rendered, setRendered] = useState(open);
  const [pickedN, setPickedN] = useState(null); // non-null → showing confirmation

  useEffect(() => {
    if (open) {
      setRendered(true);
      setPickedN(null);
      slide.setValue(0);
      Animated.timing(slide, { toValue: 1, duration: 260, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    } else if (rendered) {
      Animated.timing(slide, { toValue: 0, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true })
        .start(({ finished }) => { if (finished) setRendered(false); });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!rendered) return null;

  const pick = (v) => {
    if (v == null || pickedN != null) return;
    setPickedN(v);
    onSelect(v);
    // A held beat on the confirmation, then it slips away on its own.
    setTimeout(onClose, 1150);
  };

  const line = { fontFamily: fonts.grotesk.semibold, fontSize: typography.display, lineHeight: Math.round(typography.display * 1.08), color: theme.text.primary };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1100, justifyContent: 'flex-end' }}>
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: slide }}>
        <Pressable onPress={onClose} accessibilityLabel="Dismiss" style={{ flex: 1, backgroundColor: theme.surface.backdrop }} />
      </Animated.View>

      <Animated.View
        style={{
          backgroundColor: theme.surface.canvas,
          borderTopWidth: theme.borderWidth.default,
          borderColor: theme.border.subtle,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.xl,
          opacity: reduceMotion ? slide : 1,
          transform: [{ translateY: reduceMotion ? 0 : slide.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }],
        }}
      >
        {/* Drag handle */}
        <View style={{ alignItems: 'center', paddingBottom: spacing.xl }}>
          <View style={{ width: 32, height: 3, backgroundColor: theme.border.strong }} />
        </View>

        {pickedN != null ? (
          // Confirmation beat — echo the state, then a warm sign-off.
          <View style={{ paddingBottom: spacing.xl }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              <Text style={line}>{FEELING_STATES[pickedN - 1]}</Text>
              <Cursor width={9} height={26} color={theme.text.primary} style={{ marginLeft: 6, marginBottom: 6 }} />
            </View>
            <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.body, color: theme.text.secondary, marginTop: spacing.md }}>
              logged{streak >= 2 ? ` · ${streak + 1} days running` : ''} — see you tomorrow.
            </Text>
          </View>
        ) : (
          <>
            <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.label, color: theme.text.tertiary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: spacing.sm }}>// {dateLabel}</Text>
            <Text style={line}>{greetingFor(hour)},</Text>
            <Text style={line}>{name}</Text>

            <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.body, color: theme.text.secondary, marginTop: spacing.md, marginBottom: spacing.xl }}>
              how do you feel today?
            </Text>

            {/* The instrument — identical to the home card, given room to breathe.
                The greeting already asks the question, so the scale stays quiet. */}
            <FeelingScale value={null} onSet={pick} emptyLabel="" />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl }}>
              <Pressable onPress={onNote} hitSlop={{ top: 10, bottom: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Add a note instead">
                <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.label, color: theme.text.tertiary }}>+ add a note ›</Text>
              </Pressable>
              <Pressable onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10 }} accessibilityRole="button" accessibilityLabel="Not now">
                <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.label, color: theme.text.tertiary }}>not now</Text>
              </Pressable>
            </View>
          </>
        )}
      </Animated.View>
    </View>
  );
}
