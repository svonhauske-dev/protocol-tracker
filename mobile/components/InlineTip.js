import { useState, useEffect } from 'react';
import { View, Pressable, Text } from 'react-native';
import { X } from 'lucide-react-native';
import Cursor from './Cursor';
import { theme, spacing, typography, fonts } from '../theme';

// One-time inline tip (RN port of src/components/InlineTip.jsx) — shell-voiced.
// Left accent gutter + `// LABEL` + body + dismiss ✕. Dismissal persists in
// global.localStorage under `origin.tip.<id>` so it never returns for that user.
// Pass cursor to trail the body with the blinking Cursor (reads as a shell hint).
const PREFIX = 'origin.tip.';

export default function InlineTip({ id, label, children, cursor = false }) {
  const key = `${PREFIX}${id}`;
  const [dismissed, setDismissed] = useState(true); // hide until storage read

  useEffect(() => {
    try { setDismissed(global.localStorage.getItem(key) === 'dismissed'); }
    catch { setDismissed(false); }
  }, [key]);

  const dismiss = () => {
    try { global.localStorage.setItem(key, 'dismissed'); } catch { /* ignore */ }
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: theme.surface.cardSubtle, borderLeftWidth: 2, borderLeftColor: theme.accent.default }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        {label ? (
          <Text style={{ fontFamily: fonts.mono.semibold, fontSize: typography.label, color: theme.text.primary, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: spacing.xxs }}>{`// ${label}`}</Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
          <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.caption, color: theme.text.secondary, lineHeight: 21 }}>{children}</Text>
          {cursor ? <Cursor width={6} height={13} color={theme.text.secondary} style={{ marginLeft: 4 }} /> : null}
        </View>
      </View>
      <Pressable onPress={dismiss} hitSlop={10} accessibilityRole="button" accessibilityLabel="Dismiss tip" style={{ flexShrink: 0 }}>
        <X size={14} color={theme.text.tertiary} />
      </Pressable>
    </View>
  );
}
