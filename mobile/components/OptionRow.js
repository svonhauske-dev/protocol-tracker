import { View, Pressable, Text } from 'react-native';
import Heading from './Heading';
import { theme, spacing, typography, fonts } from '../theme';

// Numbered, gutter-railed selectable option — `ix ▏ title / desc`. The terminal
// selector device (replaces option-card grids). Monochrome: active = white rail
// + faint white tint (green stays done-only, never selection).
export default function OptionRow({ ix, title, desc, active = false, onPress, right }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={title}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderLeftWidth: 2,
        borderLeftColor: active ? theme.text.primary : theme.border.subtle,
        backgroundColor: active ? theme.status.nowBg : 'transparent',
        marginBottom: spacing.xxs,
      }}
    >
      {ix ? <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.caption, color: active ? theme.text.primary : theme.text.tertiary, fontVariant: ['tabular-nums'], paddingTop: 3 }}>{ix}</Text> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Heading level={3} visual="title" font="heading" weight="semibold">{title}</Heading>
        {desc ? <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.caption, color: theme.text.secondary, marginTop: 3, lineHeight: 18 }}>{desc}</Text> : null}
      </View>
      {right ? <View style={{ alignSelf: 'center' }}>{right}</View> : null}
    </Pressable>
  );
}
