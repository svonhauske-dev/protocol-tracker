import { View } from 'react-native';
import Text from './Text';
import { theme, spacing } from '../theme';

// Non-dismissible note block — the persistent sibling of InlineTip. Same shell
// (2px status-toned left rule on a whisper cardSubtle fill, `// LABEL` eyebrow),
// but it stays put: for guidance that must always be visible (timing notes,
// interaction cards, disclaimers), not one-time tips.
//
// tone: warning (amber rule — attention) | accent | neutral (subtle rule)
// Children define the body so callers keep full control of internal structure.
export default function Callout({ tone = 'warning', label, children, style }) {
  const accent =
    tone === 'warning' ? theme.status.warning :
    tone === 'accent' ? theme.accent.default :
    theme.border.subtle;
  return (
    <View style={[{ borderLeftWidth: 2, borderLeftColor: accent, backgroundColor: theme.surface.cardSubtle, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }, style]}>
      {label ? (
        <Text weight="semibold" size="label" style={{ letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: spacing.xxs }}>{`// ${label}`}</Text>
      ) : null}
      {children}
    </View>
  );
}
