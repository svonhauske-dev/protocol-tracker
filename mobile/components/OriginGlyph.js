import Svg, { Circle } from 'react-native-svg';
import { theme } from '../theme';

// Origin brand mark — 5 concentric rings + center dot (RN port of OriginGlyph.jsx).
// The web's feGaussianBlur glow on the center dot is omitted (RN SVG filter
// support is inconsistent); the solid dot reads the same at this size.
const RINGS = [
  { r: 439, strokeWidth: 2.56, opacity: 0.25 },
  { r: 347, strokeWidth: 2.82, opacity: 0.4 },
  { r: 256, strokeWidth: 3.58, opacity: 0.6 },
  { r: 165, strokeWidth: 4.35, opacity: 0.85 },
  { r: 91, strokeWidth: 5.12, opacity: 1.0 },
];

export default function OriginGlyph({ size = 56 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {RINGS.map(({ r, strokeWidth, opacity }) => (
        <Circle key={r} cx={512} cy={512} r={r} fill="none" stroke={theme.text.primary} strokeWidth={strokeWidth} opacity={opacity} />
      ))}
      <Circle cx={512} cy={512} r={26} fill={theme.status.success} />
    </Svg>
  );
}
