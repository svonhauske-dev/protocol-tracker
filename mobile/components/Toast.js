import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from './Text';
import { successHaptic, errorHaptic } from '../lib/haptics';
import { useReduceMotion } from '../lib/useReduceMotion';
import { theme, spacing, typography, fonts, shadow } from '../theme';

// Feedback prints like stdout: a mono log line that rises from the bottom with a
// leading status glyph (✓ / ✗ / ! / ›), not a floating Material snackbar from
// the top. Part of the terminal conceit instead of a notification on top of it.
const ToastContext = createContext(null);
export function useToast() {
  return useContext(ToastContext) || { show: () => {} };
}

const TONE_GLYPH = { success: '✓', error: '✗', warning: '!', info: '›' };
const toneColor = (tone) => ({ success: theme.status.success, error: theme.status.danger, warning: theme.status.warning, info: theme.text.secondary }[tone] ?? theme.text.secondary);

function ToastItem({ toast }) {
  const reduceMotion = useReduceMotion();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: toast.leaving ? 0 : 1,
      duration: toast.leaving ? 200 : 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [toast.leaving]); // eslint-disable-line react-hooks/exhaustive-deps

  const glyph = toast.tone ? TONE_GLYPH[toast.tone] : '›';
  return (
    <Animated.View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: theme.surface.canvas,
        borderWidth: theme.borderWidth.default,
        borderColor: theme.border.strong,
        borderRadius: theme.radius.surface,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        ...shadow.elevated,
        opacity: anim,
        // Rises from the bottom (stdout). Reduce Motion: fade only, no slide.
        transform: [{ translateY: reduceMotion ? 0 : anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
      }}
    >
      <Text style={{ fontFamily: fonts.mono.bold, fontSize: typography.body, color: toneColor(toast.tone) }}>{glyph}</Text>
      <Text style={{ flex: 1, fontFamily: fonts.mono.regular, fontSize: typography.caption, color: theme.text.primary }} numberOfLines={2}>{toast.message}</Text>
    </Animated.View>
  );
}

let nextId = 0;
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});
  const insets = useSafeAreaInsets();

  const show = useCallback((message, options = {}) => {
    if (options.tone === 'success') successHaptic();
    else if (options.tone === 'error') errorHaptic();
    const dur = options.duration ?? 3000;
    const id = ++nextId;
    setToasts((ts) => [...ts, { id, message, tone: options.tone, leaving: false }]);
    const leaveTimer = setTimeout(() => setToasts((ts) => ts.map((x) => (x.id === id ? { ...x, leaving: true } : x))), Math.max(0, dur - 250));
    const removeTimer = setTimeout(() => { setToasts((ts) => ts.filter((x) => x.id !== id)); delete timersRef.current[id]; }, dur);
    timersRef.current[id] = { leaveTimer, removeTimer };
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      <View style={{ flex: 1 }}>
        {children}
        {toasts.length ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: spacing.md, right: spacing.md, bottom: insets.bottom + spacing.md, zIndex: 2000, gap: spacing.xs }}>
            {toasts.map((t) => <ToastItem key={t.id} toast={t} />)}
          </View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}
