// Origin mobile theme — adapts the shared web design tokens for React Native.
//
// Single source of truth for color / spacing / size VALUES is the web app's
// ../src/design-system.js (imported via the `shared` alias). The web file is
// NEVER edited. Here we re-export the values that port 1:1 and re-express the
// handful that are web-only (CSS box-shadow strings, `var(--font-*)` families,
// em letter-spacing) in React Native terms.
//
// Terminal Achromatic is the only production theme.

import {
  spacing,
  radius,
  icon,
  typography as webTypography,
  touch,
  layout,
  themes,
} from 'shared/design-system';

// ── Values that port unchanged (plain numbers) ──────────────────────────────
export { spacing, radius, icon, touch, layout };

// ── Active theme (colors). Hex + rgba() strings are valid in RN. ────────────
// Elevated terminal: the achromatic base + ONE signature color — phosphor green
// (#5FE090, the shared success token) as the accent, used on live moments
// (rings, checks, active/now, selected). Overridden here (mobile only); the
// shared web design-system.js is never edited.
const ACCENT = '#5FE090';
export const theme = {
  ...themes.achromatic,
  accent: {
    ...themes.achromatic.accent,
    default: ACCENT,
    hover: 'rgba(95,224,144,0.85)',
    subtle: 'rgba(95,224,144,0.12)',
    border: 'rgba(95,224,144,0.40)',
    onSubtle: ACCENT,
    track: 'rgba(95,224,144,0.12)',
  },
  status: {
    ...themes.achromatic.status,
    // "now"/active highlight switches from white to the green signature.
    nowBorder: 'rgba(95,224,144,0.45)',
    nowBg: 'rgba(95,224,144,0.06)',
    nowHover: 'rgba(95,224,144,0.10)',
    nowBadgeBg: 'rgba(95,224,144,0.16)',
    nowBadgeText: ACCENT,
  },
};

// ── Typography ──────────────────────────────────────────────────────────────
// Sizes port as-is. Font families become the names expo-font loads. RN
// font-weight must be a STRING, not a number.
export const typography = {
  caption2: webTypography.caption2,
  label: webTypography.label,
  caption: webTypography.caption,
  body: webTypography.body,
  title: webTypography.title,
  heading: webTypography.heading,
  display: webTypography.display,

  // Loaded via expo-font (see App.js). Until fonts load, RN falls back to system.
  fontBody: 'JetBrainsMono_400Regular',
  fontBodyMedium: 'JetBrainsMono_500Medium',
  fontHeading: 'SpaceGrotesk_600SemiBold',
  fontData: 'JetBrainsMono_400Regular',
};

// RN expects font weight as a string.
export const weight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// In RN the loaded font ENCODES the weight in its family name — you pick the
// family, you don't set fontWeight. These map a logical weight → the exact
// loaded family, per typeface. `mono` = JetBrains Mono (body/data),
// `grotesk` = Space Grotesk (headings). Primitives select via fonts.<face>.<weight>.
export const fonts = {
  mono: {
    regular: 'JetBrainsMono_400Regular',
    medium: 'JetBrainsMono_500Medium',
    semibold: 'JetBrainsMono_600SemiBold',
    bold: 'JetBrainsMono_700Bold',
  },
  grotesk: {
    // Space Grotesk has no 400 loaded; medium is the lightest we ship.
    regular: 'SpaceGrotesk_500Medium',
    medium: 'SpaceGrotesk_500Medium',
    semibold: 'SpaceGrotesk_600SemiBold',
    bold: 'SpaceGrotesk_700Bold',
  },
};

// Web tokens express letter-spacing in em strings; RN needs absolute points.
// Approximated from the web em values at their typical font sizes.
export const letterSpacing = {
  display: -1.3, // -0.04em @ 32px
  heading: -0.4, // -0.02em @ 22px
  label: 1.0, //  0.08em @ 12px
  labelWide: 1.2,
};

// ── Shadows ───────────────────────────────────────────────────────────────
// The web tokens are CSS box-shadow strings; RN needs discrete props
// (iOS: shadowColor/Offset/Opacity/Radius; Android: elevation).
export const shadow = {
  card: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  elevated: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  modal: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.10, shadowRadius: 32, elevation: 12 },
};
