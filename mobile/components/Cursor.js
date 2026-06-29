import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { theme, motion } from '../theme';
import { useReduceMotion } from '../lib/useReduceMotion';

// The blinking terminal cursor — the motion signature of the whole identity.
// A solid phosphor block that blinks HARD (no fade, no ease — a CRT cursor
// snaps on/off). This is the one repeating animation we stamp wherever a
// machine is "waiting": after the username, at the end of empty/shell lines,
// inside the boot loader.
//
// Reduce Motion → holds solid (no blink), per the app's accessibility floor.
// Listed as a deliberate reduced-motion exception (functional brand signal).
export default function Cursor({ width = 8, height = 16, color = theme.accent.default, style }) {
  const reduceMotion = useReduceMotion();
  const [on, setOn] = useState(true);

  useEffect(() => {
    if (reduceMotion) { setOn(true); return; }
    const id = setInterval(() => setOn((v) => !v), motion.cursorBlink);
    return () => clearInterval(id);
  }, [reduceMotion]);

  return (
    <View
      style={[
        { width, height, backgroundColor: color, opacity: on ? 1 : 0 },
        style,
      ]}
    />
  );
}
