// ── Origin Design System ─────────────────────────────────────────────────────────
//
// Colors live inside `themes.<name>` below. Components consume them via
// `theme.text.primary`, `theme.surface.card`, etc. There is no top-level
// `colors` export — that lived here historically but every component now
// reads from the active theme.

export const spacing = {
  xxxs: 2,
  xxs:  4,
  xs:   8,
  xs2:  6,
  sm:   12,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
};

export const radius = {
  xs:    2,    // badges, tags
  sm:    4,    // checkboxes, tight UI elements
  md:    12,   // cards, modals, inputs — canonical surface radius
  modal: 20,   // bottom-sheet top corners (Modal.jsx) — only consumer
  full:  9999, // pill buttons, avatars
};

// Standalone icon sizes — for icons in buttons, headers, nav, and action
// affordances. Text-inline glyphs (icons inside running text that scale
// with the text, e.g. 10-14px Clock/CategoryIcon) should follow the
// typography scale, not this scale. If unclear: part of a Button or
// independent visual element → icon scale. Nested in running text → match
// the typography.fontSize of the surrounding text.
export const icon = {
  xs: 16,  // checkbox icons, inline glyphs
  sm: 18,  // row icons, edit affordances, nav icons (dominant size)
  md: 24,  // primary action icons, slot indicators
  lg: 32,  // reserved (avatar / display contexts — currently unused)
  xl: 40,  // reserved (hero / display contexts — currently unused)
};

// Motion tokens — durations in ms + canonical easings. Pre-Phase-2 the
// codebase had 8 distinct durations and 4 distinct easings scattered as
// magic numbers inside `transition:` strings. Reach for these.
export const motion = {
  state:         150,   // hover/focus/state changes (default)
  modalOpen:     200,   // bottom-sheet appear, popover, toast
  modalClose:    150,   // bottom-sheet dismiss
  screenSlide:   300,   // slide-in screen (Settings, ProtocolLibrary, ProtocolDetailScreen)
  chevronRotate: 300,   // collapse/expand chevron rotation
  toast:         200,   // toast appear
  pressed:       60,    // button:active opacity change (global rule)
  easeOut:       'cubic-bezier(0.16, 1, 0.3, 1)',
  ease:          'ease',
  easeIn:        'ease-in',
};

export const typography = {
  // Sizes — all multiples of 2
  caption2: 10,
  label:    12,
  caption:  14,
  body:     16,
  title:    18,
  heading:  22,
  display:  32,

  // Weights
  regular:  400,
  medium:   500,
  semibold: 600,
  bold:     700,

  // Letter spacing
  labelSpacingTight:    "0.04em",
  labelSpacing:         "0.08em",
  labelSpacingWide:     "0.1em",
  headingLetterSpacing: "-0.02em",
  displayLetterSpacing: "-0.04em",

  // Font families — single Geist system
  fontBody:    'var(--font-body)',
  fontHeading: 'var(--font-heading)',
  fontData:    'var(--font-data)',
};

export const touch = {
  min: 44, // single-line touch target — buttons, icon buttons
  row: 52, // multi-line touch target — supplement rows with name + dose
};

export const layout = {
  closeButton:      44,
  modeButtonHeight: 64,
  segHeight:        40,
  maxContentWidth:  480,
  signInWidth:      360,
  toastMaxWidth:    448,
  labelColumn:      60, // fixed-width label column in meal schedule rows
};

// (The old top-level `gradients` export referenced the deleted `colors`
// block. Components use `theme.gradients.bg` from the active theme.)

// Shadow tints derived from theme.surface.card (#1A1A1A = rgb(26,26,26)).
// Kept here rather than computed from the theme to avoid forcing every
// consumer through a function call. If the achromatic palette ever
// extends to a second theme variant, refactor to `makeShadows(theme)`.
export const shadows = {
  card:     "0 1px 2px rgba(26,26,26,0.04)",
  elevated: "0 2px 8px rgba(26,26,26,0.08)",
  modal:    "0 8px 32px rgba(26,26,26,0.08), 0 2px 8px rgba(26,26,26,0.04)",
  popover:  "0 4px 16px rgba(26,26,26,0.06)",
  toast:    "0 4px 16px rgba(26,26,26,0.10)",
  focus:    "0 0 0 3px rgba(26,26,26,0.15)",
};

export const zIndex = {
  backdrop: 199,
  modal:    200,
  toast:    400,
};

export const effects = {
  backdropBlur: "blur(8px) saturate(1.2)",
};

// ── Reusable style objects ──────────────────────────────────────────────────────

// Segmented-button style factory — NOT a Button variant.
//
// Style factories encapsulate styling only; primitives encapsulate styling +
// behavior + semantics. Segment controls in dense configuration contexts
// (Onboarding, ScheduleTab, IFMigrationScreen) use 40px height
// (layout.segHeight) vs Button's 44px (touch.min). They don't need
// Button's disabled/loading/type behavior — native <button> + this
// styling is the correct abstraction. 12 callsites use this factory.
// New segment-control needs should use it; do not migrate to Button.
export const makeSegBtnStyle = (theme) => (on) => ({
  flex: 1,
  padding: `${spacing.sm}px`,
  borderRadius: theme.radius.button,
  cursor: "pointer",
  fontSize: typography.caption,
  fontFamily: typography.fontBody,
  background: on ? theme.accent.subtle : "transparent",
  color: on ? theme.accent.onSubtle : theme.text.secondary,
  border: `${theme.borderWidth.default}px solid ${on ? theme.accent.default : theme.border.subtle}`,
  fontWeight: on ? typography.semibold : typography.regular,
  minHeight: layout.segHeight,
  WebkitTapHighlightColor: "transparent",
});

// ── Theme tokens ───────────────────────────────────────────────────────────────


export const themes = {
  achromatic: {
    surface: {
      canvas:        '#0D0D0D',
      gradientMid:   '#0D0D0D',
      gradientEnd:   '#0D0D0D',
      modal:         '#1A1A1A',
      card:          '#1A1A1A',
      cardSubtle:    '#161616',
      backdrop:      'rgba(0,0,0,0.75)',
      input:         '#1A1A1A',
      inputDisabled: '#161616',
      cardHover:     '#222222',
      hover:         '#222222',
      knob:          '#FFFFFF',
      toggleOff:     '#3A3A3A',
    },
    text: {
      primary:   '#FFFFFF',
      secondary: '#A0A0A0',
      tertiary:  '#666666',
      disabled:  '#6B6B6B', // WCAG: 3.70:1 on #0D0D0D canvas (was #444444 = 1.71:1, hard fail).
      onAccent:  '#0D0D0D',
      onDanger:  '#0D0D0D',
    },
    accent: {
      default:  '#FFFFFF',
      hover:    'rgba(255,255,255,0.85)',
      subtle:   'rgba(255,255,255,0.10)',
      border:   'rgba(255,255,255,0.35)',
      onSubtle: '#FFFFFF',
      track:    'rgba(255,255,255,0.10)',
    },
    border: {
      // WCAG 1.4.11 requires ≥3:1 for interactive UI component boundaries
      // (card edges, input outlines, focus-ring offset region). Since the
      // canvas (#0D0D0D) and elevated surfaces (#1A1A1A) only differ by
      // 1.14:1, cards rely entirely on borders to read as discrete surfaces
      // — so subtle borders had to clear the floor.
      subtle: '#606060', // 3.12:1 on #0D0D0D (was #2A2A2A = 1.26:1, hard fail).
      strong: '#808080', // 5.31:1 on #0D0D0D (was #404040 = 1.96:1, fail).
      focus:  '#FFFFFF',
    },
    slot: { default: '#FFFFFF' },
    status: {
      success:          '#5FE090',
      successSubtle:    'rgba(95,224,144,0.12)',
      successBorder:    'rgba(95,224,144,0.25)',
      danger:           '#FF6060',
      dangerSubtle:     'rgba(255,96,96,0.12)',
      dangerBorder:     'rgba(255,96,96,0.3)',
      warning:          '#FFC040',
      warningSubtle:    'rgba(255,192,64,0.15)',
      warningBorder:    'rgba(255,192,64,0.30)',
      missedBorder:     'rgba(255,255,255,0.25)',
      missedBg:         'rgba(255,255,255,0.03)',
      missedHover:      'rgba(255,255,255,0.06)',
      missedBadgeBg:    'rgba(255,255,255,0.10)',
      missedBadgeColor: '#A0A0A0',
      nowBorder:        'rgba(255,255,255,0.40)',
      nowBg:            'rgba(255,255,255,0.04)',
      nowHover:         'rgba(255,255,255,0.08)',
      nowBadgeBg:       'rgba(255,255,255,0.15)',
      nowBadgeText:     '#FFFFFF',
    },
    gradients: { bg: '#0D0D0D' },
    radius: { surface: 0, surfaceInner: 0, pill: 999, badge: 0, button: 0, iconButton: 999, toggle: 0 },
    borderWidth: { subtle: 1, default: 1, accent: 2 },
    typography: {
      fontBody:    '"JetBrains Mono", "Courier New", monospace',
      fontHeading: '"Space Grotesk", "Helvetica Neue", sans-serif',
      fontData:    '"JetBrains Mono", "Courier New", monospace',
    },
  },
};
export const breakpoints = {
  desktop: 1024,
};
