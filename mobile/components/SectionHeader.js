import { View, Text } from 'react-native';
import { theme, typography, spacing, fonts } from '../theme';

// Section group header — the signature of the "Elevated Terminal" / Stride
// settings grammar: a dim, tracked, uppercase label led by an optional shell
// marker (`//`), with a whisper hairline rule sitting DIRECTLY beneath it.
//
// This differs from the old pattern (a bare <Heading visual="label"> with a
// floating <Divider> between groups) — anchoring the rule under the label is
// what makes the screen read as a terminal. The rule uses the mobile-only
// `border.divider` whisper token (see mobile/theme.js).
//
// `marker` defaults to "//" (the section signature); pass marker={null} to drop it.
// Wider tracking than Label (2pt vs 1pt) for the airy terminal feel.
// `rule` (default true) draws the hairline beneath — full screen sections use it;
// dense modal field-groups pass rule={false} to keep the // marker without a
// heavy rule under every field.
export default function SectionHeader({ children, marker = '//', rule = true, style, ...rest }) {
  return (
    <View style={[{ marginBottom: rule ? spacing.md : spacing.xs }, style]} {...rest}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {marker ? (
          <Text
            allowFontScaling
            maxFontSizeMultiplier={1.4}
            style={{
              fontFamily: fonts.mono.semibold,
              fontSize: typography.label,
              color: theme.text.secondary,
              letterSpacing: 2,
              marginRight: spacing.xs,
            }}
          >
            {marker}
          </Text>
        ) : null}
        <Text
          accessibilityRole="header"
          allowFontScaling
          maxFontSizeMultiplier={1.4}
          style={{
            fontFamily: fonts.mono.semibold,
            fontSize: typography.label,
            color: theme.text.tertiary,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          {children}
        </Text>
      </View>
      {rule ? (
        <View
          style={{
            borderBottomWidth: theme.borderWidth.default,
            borderBottomColor: theme.border.divider,
            marginTop: spacing.xs,
          }}
        />
      ) : null}
    </View>
  );
}
