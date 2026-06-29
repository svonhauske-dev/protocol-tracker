import Svg, { Circle } from 'react-native-svg';
import { theme } from '../theme';

// Origin brand mark — IDENTICAL to the app icon: 3 concentric rings (gradual
// inner→outer weight taper) + a solid center point, monochrome on canvas. Same
// geometry/weights as the icon + splash PNGs so the mark reads the same
// everywhere (icon, splash, Auth, Onboarding).
const RINGS = [
  { r: 434, strokeWidth: 18, opacity: 0.42 },
  { r: 292, strokeWidth: 21, opacity: 0.7 },
  { r: 150, strokeWidth: 28, opacity: 1.0 },
];

export default function OriginGlyph({ size = 56 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {RINGS.map(({ r, strokeWidth, opacity }) => (
        <Circle key={r} cx={512} cy={512} r={r} fill="none" stroke={theme.text.primary} strokeWidth={strokeWidth} opacity={opacity} />
      ))}
      <Circle cx={512} cy={512} r={54} fill={theme.text.primary} />
    </Svg>
  );
}
