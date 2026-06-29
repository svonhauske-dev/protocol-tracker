import { View, Pressable, Text } from 'react-native';
import Heading from './Heading';
import { theme, spacing, typography, touch, fonts } from '../theme';

// Config-listing row — the terminal/config-file device: `ix  key ····· value →`.
// Numbered + leader-dotted + monochrome (white key, dim everything else).
// `grotesk` renders the key as a Grotesk title (for names/titles, e.g. a protocol)
// vs the default mono key (for config keys like "schedule", "reminders").
export default function ConfigRow({ ix, label, value, valueNode, onPress, grotesk = false, dim = false }) {
  const interactive = !!onPress;
  return (
    <Pressable
      onPress={onPress}
      disabled={!interactive}
      accessibilityRole={interactive ? 'button' : undefined}
      accessibilityLabel={label}
      style={{ flexDirection: 'row', alignItems: 'center', minHeight: touch.min, paddingLeft: spacing.md, opacity: dim ? 0.55 : 1 }}
    >
      {ix ? <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.label, color: theme.text.tertiary, fontVariant: ['tabular-nums'], marginRight: spacing.sm }}>{ix}</Text> : null}
      {grotesk
        ? <Heading level={3} visual="title" font="heading" weight="semibold" numberOfLines={1} style={{ flexShrink: 1 }}>{label}</Heading>
        : <Text numberOfLines={1} style={{ fontFamily: fonts.mono.regular, fontSize: typography.body, color: theme.text.primary, flexShrink: 1 }}>{label}</Text>}
      <View style={{ flex: 1, height: 0, borderBottomWidth: 1, borderStyle: 'dotted', borderBottomColor: theme.border.subtle, marginHorizontal: spacing.sm, minWidth: spacing.md }} />
      {valueNode ? valueNode : (
        <>
          {value ? <Text numberOfLines={1} style={{ fontFamily: fonts.mono.regular, fontSize: typography.label, color: theme.text.secondary, letterSpacing: 0.5, textTransform: 'uppercase', maxWidth: 150 }}>{value}</Text> : null}
          {interactive ? <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.body, color: theme.text.tertiary, marginLeft: spacing.xs }}>→</Text> : null}
        </>
      )}
    </Pressable>
  );
}
