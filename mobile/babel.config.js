// Babel config for the Origin mobile (Expo) app.
//
// The `module-resolver` alias maps `shared` → `mobile/core`, the mobile-OWNED
// fork of the formerly-shared web logic (config / api / time / notifications /
// adherence / supplements-database). Imports keep the `shared/...` specifier
// (`import { CORE_SLOTS } from 'shared/config'`) but now resolve inside mobile,
// so the app builds + ships independently of the web app (`../src`), which is
// being sunset. Forked June 29, 2026; web was NOT modified.

const path = require('path');

// Safety net: mobile's own core/lib/api.js now uses `__DEV__` directly (the fork
// dropped the Vite `import.meta.env.DEV` web-ism), but this transform stays as a
// defensive no-op — any stray `import.meta` (e.g. from a dependency) is rewritten
// to an object exposing `.env.DEV` (mapped to RN's `__DEV__`) so Hermes won't choke.
function inlineImportMetaEnv() {
  return {
    name: 'inline-import-meta-env',
    visitor: {
      MetaProperty(p) {
        p.replaceWithSourceString(
          '({ env: { DEV: typeof __DEV__ !== "undefined" ? __DEV__ : false } })'
        );
      },
    },
  };
}

module.exports = function (api) {
  api.cache(true);
  return {
    // unstable_transformImportMeta lets babel-preset-expo accept `import.meta`
    // syntax (otherwise it throws "import.meta is not supported in Hermes").
    // Our inlineImportMetaEnv plugin (below, runs first) rewrites it to an
    // object exposing `.env.DEV` so the shared api.js logger works.
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
    plugins: [
      inlineImportMetaEnv,
      // NOTE: do NOT add explicit class-fields/private transforms here. SDK 53's
      // Hermes needed them (loose) to strip `#private`, but loose class-properties
      // transpiles class fields as plain assignments, which on RN 0.81 collides
      // with React Native's own `Object.defineProperty(Event,'NONE',{writable:false})`
      // → "Cannot assign to read-only property 'NONE'" crash on launch. SDK 54's
      // Hermes supports private fields natively, so babel-preset-expo handles
      // class fields correctly on its own.
      [
        'module-resolver',
        {
          alias: {
            // Mobile-owned fork (was a symlink → ../src). Absolute path so
            // resolution is unambiguous regardless of which file imports it.
            shared: path.resolve(__dirname, 'core'),
          },
        },
      ],
    ],
  };
};
