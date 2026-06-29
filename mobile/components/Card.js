import { Pressable, View } from 'react-native';
import { theme, spacing } from '../theme';

// Surface card (RN port of src/components/Card.jsx).
// variant: default | selected | accent | subtle. Pass onPress to make it
// button-semantic (accessibilityRole + pressed feedback).
const VARIANTS = {
  default: { bg: 'transparent', border: theme.border.subtle },
  selected: { bg: theme.accent.subtle, border: theme.accent.default },
  accent: { bg: theme.accent.subtle, border: theme.accent.border },
  subtle: { bg: theme.surface.cardSubtle, border: theme.border.subtle },
};

export default function Card({ variant = 'default', onPress, style, children, accessibilityLabel }) {
  const v = VARIANTS[variant] ?? VARIANTS.default;
  const base = {
    backgroundColor: v.bg,
    borderWidth: theme.borderWidth.default,
    borderColor: v.border,
    borderRadius: theme.radius.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  };

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [base, pressed && { opacity: 0.85 }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}
