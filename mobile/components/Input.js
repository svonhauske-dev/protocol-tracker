import { useState } from 'react';
import { TextInput } from 'react-native';
import { theme, typography, spacing, touch, fonts } from '../theme';

// Text input (RN port of src/components/Input.jsx). Focus swaps the border to
// the accent at 2px, matching the web. variant "number" → numeric keypad +
// right-aligned compact width. (variant "time" renders as text for now; the
// native time picker — @react-native-community/datetimepicker — lands with the
// EditForm in Phase 4.)
export default function Input({ variant = 'text', width, style, onFocus, onBlur, ...rest }) {
  const [focused, setFocused] = useState(false);

  const base = {
    // Hairline field on the canvas — defined by its border, not a grey fill.
    // Focus brightens the border to white (the live/active accent).
    backgroundColor: 'transparent',
    color: theme.text.primary,
    borderWidth: focused ? theme.borderWidth.accent : theme.borderWidth.default,
    borderColor: focused ? theme.accent.default : theme.border.subtle,
    borderRadius: theme.radius.surface,
    fontSize: typography.body,
    fontFamily: fonts.mono.regular,
    minHeight: touch.min,
  };

  const v =
    variant === 'number'
      ? { width: width ?? 52, textAlign: 'right', paddingVertical: spacing.xs, paddingHorizontal: spacing.sm }
      : { width: width ?? '100%', paddingVertical: spacing.sm, paddingHorizontal: spacing.md };

  return (
    <TextInput allowFontScaling maxFontSizeMultiplier={1.4}
      placeholderTextColor={theme.text.tertiary}
      keyboardType={variant === 'number' ? 'numeric' : 'default'}
      style={[base, v, style]}
      onFocus={(e) => { setFocused(true); onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); onBlur?.(e); }}
      {...rest}
    />
  );
}
