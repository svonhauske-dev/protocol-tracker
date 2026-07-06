import { View } from 'react-native';
import Text from './Text';
import Button from './Button';
import Cursor from './Cursor';
import { theme, spacing } from '../theme';

// Shell-voiced empty state — the app's answer to the templated centered-gray-icon
// blank screen. A bordered block on canvas: `// eyebrow` + `$ line ▌`, left-
// aligned, optional preview (children) of what will live here, optional CTA.
//
// eyebrow  — the `//` context label (optional)
// line     — the `$ …` shell line (required)
// children — a faint preview of the content that belongs here (optional)
// action   — { label, onPress } → primary Button; second → tertiary Button
export default function EmptyState({ eyebrow, line, action, secondary, children, bordered = true, style }) {
  const hasBelow = !!children || !!action;
  return (
    <View style={[bordered ? { borderWidth: theme.borderWidth.default, borderColor: theme.border.subtle } : null, { paddingVertical: spacing.xl, paddingHorizontal: spacing.md }, style]}>
      {eyebrow ? (
        <Text size="label" weight="semibold" tone="tertiary" style={{ letterSpacing: 2, textTransform: 'uppercase', marginBottom: spacing.md }}>{`// ${eyebrow}`}</Text>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: hasBelow ? spacing.lg : 0 }}>
        <Text tone="secondary">{`$ ${line}`}</Text>
        <Cursor width={7} height={15} color={theme.text.secondary} style={{ marginLeft: 5 }} />
      </View>
      {children ? <View style={{ marginBottom: action ? spacing.lg : 0 }}>{children}</View> : null}
      {action ? <Button variant="primary" fullWidth onPress={action.onPress}>{action.label}</Button> : null}
      {secondary ? <Button variant="tertiary" fullWidth onPress={secondary.onPress} style={{ marginTop: spacing.xs }}>{secondary.label}</Button> : null}
    </View>
  );
}
