import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Text from './Text';
import Cursor from './Cursor';
import { theme, spacing, typography, fonts } from '../theme';
import { useReduceMotion } from '../lib/useReduceMotion';

// Full-screen boot loader. The app loads in its OWN grammar — a shell prompt
// with a blinking cursor and a mono block bar filling left-to-right — not the
// soft sonar/radar ping it used to show (borrowed from a different design
// language). A terminal doesn't pulse; it prints.
const CELLS = 10;

export default function Loader() {
  const reduceMotion = useReduceMotion();
  const [n, setN] = useState(reduceMotion ? CELLS : 0);

  useEffect(() => {
    if (reduceMotion) { setN(CELLS); return; }
    const id = setInterval(() => setN((x) => (x + 1) % (CELLS + 1)), 110);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const bar = '█'.repeat(n) + '░'.repeat(Math.max(0, CELLS - n));

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface.canvas, alignItems: 'flex-start', justifyContent: 'center', paddingHorizontal: spacing.xl }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
        <Text style={{ fontFamily: fonts.mono.semibold, fontSize: typography.body, color: theme.text.primary, letterSpacing: 0.5 }}>$ origin</Text>
        <Cursor style={{ marginLeft: 5 }} />
      </View>
      <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.body, color: theme.text.tertiary, letterSpacing: 1 }}>
        {`[${bar}]`}
      </Text>
    </View>
  );
}
