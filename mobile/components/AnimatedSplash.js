import { useEffect, useRef } from 'react';
import { View, Animated, Text } from 'react-native';
import OriginGlyph from './OriginGlyph';
import Cursor from './Cursor';
import { theme, fonts, typography, spacing } from '../theme';

// Boot splash — black canvas, the Origin mark, the "Origin" wordmark + blinking
// cursor. On-brand (matches the app + the regenerated native splash); replaces
// the off-grey ring spinner. Background = canvas so the hand-off from the native
// static splash is seamless. Fades in for a soft start.
export default function AnimatedSplash() {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading Origin"
      style={{ flex: 1, backgroundColor: theme.surface.canvas, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={{ opacity: fade, alignItems: 'center' }} importantForAccessibility="no-hide-descendants">
        <OriginGlyph size={56} />
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg }}>
          <Text allowFontScaling={false} style={{ fontFamily: fonts.grotesk.bold, fontSize: typography.display, color: theme.text.primary, letterSpacing: -1 }}>Origin</Text>
          <Cursor width={9} height={28} style={{ marginLeft: 6 }} />
        </View>
      </Animated.View>
    </View>
  );
}
