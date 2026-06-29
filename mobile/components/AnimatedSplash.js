import { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import OriginGlyph from './OriginGlyph';
import { theme } from '../theme';

// Boot splash — the Origin mark centered on the canvas, sized to MATCH the native
// static splash (SplashScreenLegacy, ~172pt rings) so the hand-off is seamless:
// no size jump, no font-dependent wordmark flash. Plays through the rest of boot
// (fonts + session check). Fades in for a soft start.
export default function AnimatedSplash() {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading Origin"
      style={{ flex: 1, backgroundColor: theme.surface.canvas, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={{ opacity: fade }} importantForAccessibility="no-hide-descendants">
        <OriginGlyph size={200} />
      </Animated.View>
    </View>
  );
}
