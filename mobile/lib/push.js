import * as Notifications from 'expo-notifications';
import { supa } from 'shared/lib/api';

// Native push registration. The iOS app registers an ExponentPushToken and
// stores it in `expo_push_tokens`; the server (process_notifications_queue)
// delivers reminders to it via the Expo Push API → APNs. This is the native
// analog of the web's push_subscriptions — accurate every day (recomputed
// server-side from the DB, so it knows real times AND skips already-done
// slots), even when the app is closed.
//
// Push does NOT work on the iOS Simulator — getExpoPushTokenAsync throws there,
// so registration returns null and we fall back to nothing (the toggle still
// records intent). Real devices / TestFlight get the token.

const EAS_PROJECT_ID = '98a830a3-c79b-48d0-accd-4399c119e323';
const TOKEN_KEY = 'origin.expo_push_token';

const token = () => global.localStorage.getItem('sb_token');

// Request permission, mint an Expo push token, and upsert it for this user.
// Returns the token string, or null if unavailable (simulator, denied, error).
export async function registerPushToken(userId) {
  try {
    const perm = await Notifications.getPermissionsAsync();
    let status = perm.status;
    if (status !== 'granted' && perm.canAskAgain) {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return null;

    const { data: expoToken } = await Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID });
    if (!expoToken) return null;

    await supa('POST', '/rest/v1/expo_push_tokens?on_conflict=token',
      { user_id: userId, token: expoToken, platform: 'ios' }, token());
    global.localStorage.setItem(TOKEN_KEY, expoToken);
    return expoToken;
  } catch (e) {
    // Simulator / no entitlement / network — non-fatal.
    console.log('[push] registerPushToken skipped:', e?.message ?? e);
    return null;
  }
}

// Remove this device's token (on sign-out or reminders-off) so the server stops
// pushing to it. Best-effort.
export async function unregisterPushToken() {
  const expoToken = global.localStorage.getItem(TOKEN_KEY);
  if (!expoToken) return;
  try {
    await supa('DELETE', `/rest/v1/expo_push_tokens?token=eq.${encodeURIComponent(expoToken)}`, null, token());
  } catch (e) {
    console.log('[push] unregisterPushToken failed:', e?.message ?? e);
  }
  global.localStorage.removeItem(TOKEN_KEY);
}
