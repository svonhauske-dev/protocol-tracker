import { useEffect, useRef, useState } from 'react';
import { View, Pressable, ScrollView, Platform, Animated, Easing, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { PickerGroupContext } from './pickerGroup';
import Text from './Text';
import { useReduceMotion } from '../lib/useReduceMotion';
import { theme, spacing, typography, icon, touch, fonts } from '../theme';

// Bottom-sheet modal — rendered as an in-app ABSOLUTE OVERLAY rather than RN's
// native <Modal>. The native Modal (transparent) glitches on iOS: it flashes a
// blank frame when a TextInput elsewhere focuses, and can leave a lingering
// touch-capturing overlay on dismiss. An overlay View has none of those issues,
// and a translateY animation gives the slide-up. Returns null when closed, so
// nothing is mounted (and nothing can intercept touches) while hidden.
export default function Modal({ open, onClose, title, children, footer }) {
  const reduceMotion = useReduceMotion();
  const slide = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);
  const [openPickerId, setOpenPickerId] = useState(null);
  const { height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // RN ScrollViews don't size their frame to their content, so the sheet can't
  // know how tall to be — measure the content and set the scroll area to
  // min(content, cap). The sheet then grows to fit and only scrolls past the cap.
  const [contentH, setContentH] = useState(0);
  // Cap the scroll area at the sheet's max (90%) minus the fixed chrome
  // (handle + header + footer ≈ 220). Keyboard avoidance is handled by the
  // ScrollView's automaticallyAdjustKeyboardInsets (iOS) — it smoothly insets
  // content for the keyboard and lets you scroll to any field, with no sheet
  // resize/lift fighting each other (the source of the earlier jumpiness).
  const scrollCap = winH * 0.9 - 220;
  // Bottom clearance for the home indicator + breathing room.
  const SAFE_BOTTOM = insets.bottom + spacing.sm;

  // Keep the sheet mounted through its slide-OUT so close animates too (not an
  // instant unmount). `rendered` lags `open` by the exit animation.
  const [rendered, setRendered] = useState(open);
  useEffect(() => {
    if (open) {
      setRendered(true);
      slide.setValue(0);
      Animated.timing(slide, { toValue: 1, duration: 240, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    } else if (rendered) {
      Animated.timing(slide, { toValue: 0, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true })
        .start(({ finished }) => { if (finished) setRendered(false); });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!rendered) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, justifyContent: 'flex-end' }}>
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: slide }}>
        <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: theme.surface.backdrop }} />
      </Animated.View>

      <View>
        <Animated.View
          style={{
            maxHeight: winH * 0.9,
            // Terminal sheet: the canvas surface separated from the dimmed content
            // by a hairline top rule — not a rounded raised grey panel. Sharp
            // corners, per the app's zero-radius law.
            backgroundColor: theme.surface.canvas,
            borderTopWidth: theme.borderWidth.default,
            borderColor: theme.border.subtle,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            overflow: 'hidden',
            // Reduce Motion: fade the sheet in place instead of sliding it up.
            opacity: reduceMotion ? slide : 1,
            transform: [{ translateY: reduceMotion ? 0 : slide.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }],
          }}
        >
          {/* Drag handle */}
          <View style={{ paddingTop: 16, paddingBottom: 12, alignItems: 'center' }}>
            <View style={{ width: 32, height: 3, borderRadius: 0, backgroundColor: theme.border.strong }} />
          </View>

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: spacing.md,
              paddingTop: spacing.xs,
              paddingBottom: spacing.sm,
              borderBottomWidth: theme.borderWidth.default,
              borderBottomColor: theme.border.subtle,
            }}
          >
            <Text style={{ fontSize: typography.title, color: theme.text.primary, fontFamily: fonts.grotesk.semibold }}>{title}</Text>
            <Pressable
              onPress={onClose}
              accessibilityLabel="Close"
              style={{ width: touch.min, height: touch.min, borderWidth: theme.borderWidth.default, borderColor: theme.border.subtle, borderRadius: theme.radius.button, alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={icon.sm} color={theme.text.secondary} />
            </Pressable>
          </View>

          {/* Scrollable body — maxHeight lets the sheet grow to fit content and
              only scroll once the content actually exceeds the cap. Without a
              cap, a ScrollView in an auto-height parent gets a constrained
              height and clips instead of growing. */}
          <ScrollView
            ref={scrollRef}
            style={{ height: contentH ? Math.min(contentH, scrollCap) : undefined }}
            // Measure content only to size the sheet (min(content, cap)). We do NOT
            // auto-scroll on content growth: dynamic content like the name-field
            // autocomplete appears near the TOP, so a scrollToEnd would jump the
            // whole form to the bottom. iOS keyboard avoidance handles focus.
            onContentSizeChange={(w, h) => setContentH(h)}
            contentContainerStyle={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: footer ? spacing.sm : SAFE_BOTTOM }}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            keyboardDismissMode="interactive"
          >
            <PickerGroupContext.Provider value={{ openId: openPickerId, setOpenId: setOpenPickerId }}>
              {children}
            </PickerGroupContext.Provider>
          </ScrollView>

          {/* Sticky footer */}
          {footer ? (
            <View style={{ paddingTop: spacing.sm, paddingBottom: SAFE_BOTTOM, paddingHorizontal: spacing.md, borderTopWidth: theme.borderWidth.default, borderTopColor: theme.border.subtle }}>
              {footer}
            </View>
          ) : null}
        </Animated.View>
      </View>
    </View>
  );
}
