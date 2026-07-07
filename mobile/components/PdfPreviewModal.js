import { useEffect, useRef, useState } from 'react';
import { View, Pressable, Animated, Easing, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { X, Share } from 'lucide-react-native';
import Text from './Text';
import { theme, spacing, typography, icon, touch, fonts } from '../theme';

// Full-screen document preview — renders the protocol's HTML (identical to the
// exported PDF) in a WebView so you actually SEE the artifact before sending,
// then share from the header button. Slides up as an in-app overlay (same
// pattern as Modal), so it works on the simulator (unlike the OS share-sheet
// thumbnail, which is device-only).
export default function PdfPreviewModal({ open, html, title, onShare, onClose, sharing }) {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(open);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      setLoaded(false);
      slide.setValue(0);
      Animated.timing(slide, { toValue: 1, duration: 240, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    } else if (rendered) {
      Animated.timing(slide, { toValue: 0, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true })
        .start(({ finished }) => { if (finished) setRendered(false); });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!rendered) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1200 }}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: theme.surface.canvas,
          opacity: slide,
          transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Math.max(insets.top, 20), paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: theme.borderWidth.default, borderBottomColor: theme.border.subtle }}>
          <Pressable
            onPress={onClose}
            accessibilityLabel="Close preview"
            style={{ width: touch.min, height: touch.min, borderWidth: theme.borderWidth.default, borderColor: theme.border.subtle, alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={icon.sm} color={theme.text.secondary} />
          </Pressable>
          <Text style={{ fontSize: typography.body, color: theme.text.primary, fontFamily: fonts.grotesk.semibold }}>preview</Text>
          <Pressable
            onPress={onShare}
            disabled={sharing}
            accessibilityLabel="Share"
            style={{ width: touch.min, height: touch.min, borderWidth: theme.borderWidth.default, borderColor: theme.border.subtle, alignItems: 'center', justifyContent: 'center', opacity: sharing ? 0.5 : 1 }}
          >
            {sharing ? <ActivityIndicator color={theme.text.secondary} /> : <Share size={icon.sm} color={theme.text.secondary} strokeWidth={1.5} />}
          </Pressable>
        </View>

        {/* Document — framed like a page on a desk: the white paper floats on the
            dark canvas with breathing room + a hairline edge, rather than an
            abrupt edge-to-edge white slab inside the black app. */}
        <View style={{ flex: 1, backgroundColor: theme.surface.canvas, paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: Math.max(insets.bottom, spacing.md) }}>
          <View style={{ flex: 1, borderWidth: theme.borderWidth.default, borderColor: theme.border.subtle, overflow: 'hidden' }}>
            <WebView
              originWhitelist={['*']}
              source={{ html }}
              style={{ flex: 1, backgroundColor: '#ffffff' }}
              showsVerticalScrollIndicator
              onLoadEnd={() => setLoaded(true)}
            />
            {!loaded ? (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
                <ActivityIndicator color="#0d0d0d" />
              </View>
            ) : null}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
