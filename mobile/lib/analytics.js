// Thin analytics wrapper. The app instruments events against THIS interface;
// the backing client (PostHog) is attached later via setAnalyticsClient() once
// the project key exists + the SDK ships in a build. Until then it's a safe
// no-op (with a dev-console echo), so instrumentation can be added everywhere
// now without blocking on the SDK/key.
//
// Event taxonomy (the pre-monetization funnel — keep names stable):
//   signup                — account created
//   onboarding_complete   — finished first-run setup  { mode }
//   item_added            — a supplement/med added     { category, hasSupply }
//   item_checked          — a dose ticked off          { slot }
//   reminders_enabled     — turned reminders on
//   protocol_created      — created a protocol
//   protocol_sent         — sent a protocol to someone
//   supply_set            — set a bottle count         { daysLeft }
//   pdf_shared            — exported/shared a PDF
// Retention comes from identify(userId) + the automatic $app_open the SDK sends.

let client = null; // PostHog instance, or null (no-op)

export function setAnalyticsClient(c) { client = c; }

const echo = (kind, a, b) => {
  if (typeof __DEV__ !== 'undefined' && __DEV__ && !client) {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${kind}`, a ?? '', b ?? '');
  }
};

export function track(event, props) {
  try { client?.capture?.(event, props); } catch {}
  echo(`track ${event}`, props);
}

export function identify(userId, traits) {
  try { client?.identify?.(userId, traits); } catch {}
  echo('identify', userId, traits);
}

export function screen(name, props) {
  try { client?.screen?.(name, props); } catch {}
  echo(`screen ${name}`, props);
}

// Call on sign-out so events don't bleed across accounts on a shared device.
export function resetAnalytics() {
  try { client?.reset?.(); } catch {}
  echo('reset');
}
