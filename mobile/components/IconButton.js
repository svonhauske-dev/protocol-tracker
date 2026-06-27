import { Pressable } from 'react-native';
import { theme, touch } from '../theme';

// THE icon button — one implementation for every back / nav / action icon button
// in the app. Hairline bordered box, monochrome. shape: 'square' (radius.button)
// | 'circle' (radius.pill). size defaults to the 44pt touch target; smaller
// sizes keep a 44pt tap area via hitSlop.
export default function IconButton({ children, onPress, accessibilityLabel, label, shape = 'square', size, bare = false, disabled = false }) {
  const s = size || touch.min;
  const slop = Math.max(0, Math.round((touch.min - s) / 2));
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={slop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      style={({ pressed }) => ({
        width: s,
        height: s,
        borderRadius: shape === 'circle' ? theme.radius.pill : theme.radius.button,
        borderWidth: bare ? 0 : theme.borderWidth.default,
        borderColor: theme.border.subtle,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}
