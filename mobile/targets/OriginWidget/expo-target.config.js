/** @type {import('@bacons/apple-targets/app.plugin').Config} */
// Origin home-screen widget target. @bacons/apple-targets links every file in
// this folder into a WidgetKit extension when `expo prebuild` runs.
//
// App Group: the widget process is sandboxed from the RN app, so the two share
// data only through the `group.app.origin-protocol` container. The RN app writes
// the "next dose" snapshot there; the widget reads it. Quick-log taps (Phase 3)
// write back into the same container as a pending queue the app reconciles.
module.exports = {
  type: 'widget',
  name: 'OriginWidget',
  displayName: 'Origin',
  // Terminal Achromatic: near-black surface, pure-white accent (see theme.js).
  colors: {
    $accent: '#FFFFFF',
    $surface: '#0D0D0D',
  },
  // AppIntents powers the iOS-17 quick-log button; SwiftUI/WidgetKit render the
  // widget. Declared explicitly so linking is guaranteed rather than relying on
  // implicit auto-link.
  frameworks: ['SwiftUI', 'WidgetKit', 'AppIntents'],
  entitlements: {
    'com.apple.security.application-groups': ['group.app.origin-protocol'],
  },
};
