import { useCallback, useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, LogBox } from 'react-native';

// Silence known-benign dev warnings so the debugger stays clean for real ones:
// • expo-notifications push-token warning fires ONLY on the iOS Simulator (real
//   devices mint a token silently) — it's expected in dev, gone in production.
// • Legacy Architecture notice is informational; New Architecture migration is
//   out of scope. Scoped substrings — real warnings still surface.
LogBox.ignoreLogs([
  'obtaining a push token',
  'Legacy Architecture',
]);
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
// Per-weight file imports (NOT the package root) so Metro bundles ONLY the six
// faces we use — importing from the package index pulls in every weight + italic.
import JetBrainsMono_400Regular from '@expo-google-fonts/jetbrains-mono/400Regular/JetBrainsMono_400Regular.ttf';
import JetBrainsMono_500Medium from '@expo-google-fonts/jetbrains-mono/500Medium/JetBrainsMono_500Medium.ttf';
import JetBrainsMono_600SemiBold from '@expo-google-fonts/jetbrains-mono/600SemiBold/JetBrainsMono_600SemiBold.ttf';
import JetBrainsMono_700Bold from '@expo-google-fonts/jetbrains-mono/700Bold/JetBrainsMono_700Bold.ttf';
import SpaceGrotesk_500Medium from '@expo-google-fonts/space-grotesk/500Medium/SpaceGrotesk_500Medium.ttf';
import SpaceGrotesk_600SemiBold from '@expo-google-fonts/space-grotesk/600SemiBold/SpaceGrotesk_600SemiBold.ttf';
import SpaceGrotesk_700Bold from '@expo-google-fonts/space-grotesk/700Bold/SpaceGrotesk_700Bold.ttf';

// Shared auth, reused verbatim from the web app (../src/lib/api.js) via the
// `shared` alias — works unchanged thanks to the storage shim (index.js) and
// the import.meta Babel transform (babel.config.js).
import { getSession, signOut, dbGetSchedule } from 'shared/lib/api';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from './theme';
import { ToastProvider } from './components/Toast';
import { identify, resetAnalytics } from './lib/analytics';
import Auth from './screens/Auth';
import Onboarding from './screens/Onboarding';
import Today from './screens/Today';
import AnimatedSplash from './components/AnimatedSplash';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Restore session on boot (reads sb_token via the storage shim → /auth/v1/user).
  // With the in-memory shim this is empty on a cold start, so it resolves to the
  // sign-in screen; once persistent storage lands (Phase 5) it'll auto-resume.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const u = await getSession();
        if (alive && u) {
          setUser(u);
          identify(u.id);
          // Re-show onboarding if a signed-in user has no schedule yet (e.g.
          // signed up but quit before finishing) — matches the web's gate.
          if (await needsSchedule(u)) { if (alive) setNeedsOnboarding(true); }
        } else if (alive) setUser(u);
      } catch {
        // fall through to sign-in
      } finally {
        if (alive) setBooting(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const needsSchedule = async (u) => {
    const sched = await dbGetSchedule(u.id, global.localStorage.getItem('sb_token')).catch(() => null);
    return !sched;
  };

  const ready = (fontsLoaded || fontError) && !booting;

  // Hand off from the native static splash to the animated JS splash as soon as
  // the root lays out (once) — the AnimatedSplash (graphics-only, no fonts) then
  // plays through the rest of boot + data-load.
  const splashHidden = useRef(false);
  const onLayoutRootView = useCallback(async () => {
    if (!splashHidden.current) { splashHidden.current = true; await SplashScreen.hideAsync(); }
  }, []);

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <View style={{ flex: 1, backgroundColor: theme.surface.canvas }} onLayout={onLayoutRootView}>
          {!ready ? (
            <AnimatedSplash />
          ) : user && needsOnboarding ? (
            <Onboarding user={user} onDone={() => setNeedsOnboarding(false)} />
          ) : user ? (
            <Today
              user={user}
              onSignOut={() => {
                signOut();
                resetAnalytics();
                setUser(null);
                setNeedsOnboarding(false);
              }}
            />
          ) : (
            <Auth onSignedIn={async (u, isNew) => { setUser(u); if (isNew || (await needsSchedule(u))) setNeedsOnboarding(true); }} />
          )}
          <StatusBar style="light" />
        </View>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
