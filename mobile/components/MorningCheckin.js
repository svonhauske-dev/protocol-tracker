import { useEffect, useRef, useState } from 'react';
import { View, Pressable, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import Text from './Text';
import FeelingScale, { FEELING_STATES } from './FeelingScale';
import { useReduceMotion } from '../lib/useReduceMotion';
import { theme, spacing, typography, icon, fonts } from '../theme';

function greetingFor(hour) {
  if (hour < 12) return 'good morning';
  if (hour < 18) return 'good afternoon';
  return 'good evening';
}

// The daily moment — a once-a-day, always-dismissible check-in ritual. Opens on
// first launch of the day when today's feeling isn't logged; a time-aware
// greeting at identity scale, the feeling axis as the centrepiece, and a one-tap
// save that lands on a held confirmation before it slips away. Never blocks the
// app: tap the backdrop, "not now", or the confirmation all close it.
export default function MorningCheckin({ open, name, dateLabel, hour = 8, streak = 0, onSelect, onNote, onClose }) {
  const reduceMotion = useReduceMotion();
  const slide = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const [rendered, setRendered] = useState(open);
  const [pickedN, setPickedN] = useState(null); // non-null → showing confirmation
  const closeTimer = useRef(null);

  useEffect(() => {
    if (open) {
      setRendered(true);
      setPickedN(null);
      slide.setValue(0);
      Animated.timing(slide, { toValue: 1, duration: 280, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    } else if (rendered) {
      Animated.timing(slide, { toValue: 0, duration: 220, easing: Easing.in(Easing.ease), useNativeDriver: true })
        .start(({ finished }) => { if (finished) setRendered(false); });
    }
    return () => clearTimeout(closeTimer.current);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!rendered) return null;

  const pick = (v) => {
    if (v == null || pickedN != null) return;
    setPickedN(v);
    onSelect(v);
    // A held, readable beat on the confirmation, then it eases away on its own.
    closeTimer.current = setTimeout(onClose, 2600);
  };

  const hero = { fontFamily: fonts.grotesk.semibold, fontSize: typography.display, lineHeight: Math.round(typography.display * 1.08), color: theme.text.primary };

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
          transform: [{ translateY: reduceMotion ? 0 : slide.interpolate({ inputRange: [0, 1], outputRange: [640, 0] }) }],
        }}
      >
        {/* Drag handle */}
        <View style={{ alignItems: 'center', paddingBottom: spacing.xl }}>
          <View style={{ width: 32, height: 3, backgroundColor: theme.border.strong }} />
        </View>

        {pickedN != null ? (
          // Confirmation — tap anywhere to dismiss now, or it eases away on its own.
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Done">
            <View style={{ paddingBottom: spacing.xxl }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
                <View style={{ width: 34, height: 34, borderWidth: theme.borderWidth.default, borderColor: theme.text.primary, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md }}>
                  <Check size={icon.sm} color={theme.text.primary} strokeWidth={2} />
                </View>
                <Text style={hero}>{FEELING_STATES[pickedN - 1]}</Text>
              </View>
              <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.body, color: theme.text.secondary }}>
                logged for today{streak >= 2 ? ` · ${streak + 1} days running` : ''}.
              </Text>
              <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.label, color: theme.text.tertiary, marginTop: spacing.sm }}>
                see you tomorrow ›
              </Text>
            </View>
          </Pressable>
        ) : (
          <>
            <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.label, color: theme.text.tertiary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: spacing.sm }}>// {dateLabel}</Text>
            <Text style={hero}>{greetingFor(hour)},</Text>
            <Text style={hero}>{name}</Text>

            <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.body, color: theme.text.secondary, marginTop: spacing.md, marginBottom: spacing.sm }}>
              how do you feel today?
            </Text>
            <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.label, color: theme.text.tertiary, marginBottom: spacing.xl }}>
              one tap — the whole scale, rough to great.
            </Text>

            {/* The axis — the centrepiece, given room to breathe. */}
            <FeelingScale value={null} onSet={pick} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xxl }}>
              <Pressable onPress={onNote} hitSlop={{ top: 12, bottom: 12, right: 12 }} accessibilityRole="button" accessibilityLabel="Add a note instead">
                <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.label, color: theme.text.tertiary }}>+ add a note ›</Text>
              </Pressable>
              <Pressable onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12 }} accessibilityRole="button" accessibilityLabel="Not now">
                <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.label, color: theme.text.tertiary }}>not now</Text>
              </Pressable>
            </View>
          </>
        )}
      </Animated.View>
    </View>
  );
}
