import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { theme, typography, fonts } from '../theme';
import { useReduceMotion } from '../lib/useReduceMotion';

// Inline working spinner — a braille CLI spinner, the universally-read "process
// running" glyph from npm/yarn/cargo. Replaces the old soft sonar-ring loader
// (borrowed from a different design language). Mono, fixed-advance, so it never
// shifts button layout. Reduce Motion → a static full-cell glyph.
const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const SIZE_PX = { sm: 14, md: 18, full: 40 };

export default function InlineLoader({ size = 'md', color = theme.text.primary }) {
  const reduceMotion = useReduceMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setI((x) => (x + 1) % FRAMES.length), 80);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const fontSize = SIZE_PX[size] ?? typography.title;
  return (
    <Text allowFontScaling={false} style={{ fontFamily: fonts.mono.bold, fontSize, lineHeight: fontSize + 2, color }}>
      {reduceMotion ? '⠿' : FRAMES[i]}
    </Text>
  );
}
