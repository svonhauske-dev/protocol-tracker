import { useState, useRef } from 'react';
import { View, ScrollView, Pressable, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { dbUpdateProfile, updateEmail, updatePassword } from 'shared/lib/api';
import { deleteAccount } from '../lib/account';
import { Heading, Label, SectionHeader, Text, Button, Row, Input, Checkbox, Cursor, ConfigRow } from '../components';
import InlineLoader from '../components/InlineLoader';
import Modal from '../components/Modal';
import IconButton from '../components/IconButton';
import ScheduleTab from './ScheduleTab';
import SlideScreen from '../components/SlideScreen';
import OriginGlyph from '../components/OriginGlyph';
import Constants from 'expo-constants';
import { theme, spacing, typography, touch, icon, fonts } from '../theme';

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';
const BUILD_NUMBER = Constants.expoConfig?.ios?.buildNumber || '';

// Public privacy-policy URL — required in-app and in App Store Connect by
// Guideline 5.1.1(i).
const PRIVACY_URL = 'https://origin-protocol.vercel.app/privacy.html';

// RN port of src/components/SettingsScreen.jsx (batch 1): Main + Account views +
// sign-out confirm. Schedule sub-view (ScheduleTab) and Notifications (push =
// Phase 5) are deferred. Toasts deferred — success is silent, errors inline.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RULES = [
  { label: '8+ characters', test: (p) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Number', test: (p) => /[0-9]/.test(p) },
  { label: 'Special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordRule({ met, label }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xxs }}>
      <Checkbox checked={met} size={icon.xs} shape="pill" />
      <Text size="label" tone={met ? 'primary' : 'secondary'}>{label}</Text>
    </View>
  );
}

const TITLES = { main: 'Settings', account: 'Account', schedule: 'Schedule' };

// Nav rows report STATE, not a generic chevron. The schedule row shows the
// active mode; the account row shows the signed-in email.
const SCHED_LABEL = { none: 'NO SCHEDULE', medication: 'MEDICATION', wakeup: 'WAKE-UP', fixed: 'FIXED', fasting: 'FASTING' };

export default function SettingsScreen({
  user, token, profile, onProfileUpdate, onSignOut, onBack,
  scheduleMode, scheduleConfig, anchorBehavior, consistentTime, adaptiveEnabled = false, onSaveSchedule, supplements = [],
  remindersEnabled = false, onToggleReminders,
}) {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState('main');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [nameSaving, setNameSaving] = useState(false);
  const debounceRef = useRef(null);
  const [newEmail, setNewEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState('');

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteErr('');
    try {
      await deleteAccount();
      setShowDeleteConfirm(false);
      onSignOut?.(); // clears the session locally; the account is already gone server-side
    } catch {
      setDeleteErr("Couldn't delete your account. Try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDisplayNameChange = (val) => {
    setDisplayName(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (val.trim() === (profile?.display_name || '')) return;
      setNameSaving(true);
      try {
        await dbUpdateProfile(user.id, { display_name: val.trim() || null, updated_at: new Date().toISOString() }, token);
        onProfileUpdate?.({ ...profile, display_name: val.trim() || null });
      } catch {
        // keep silent — name re-saves on next edit
      } finally {
        setNameSaving(false);
      }
    }, 600);
  };

  const handleSaveEmail = async () => {
    setEmailMsg('');
    if (!EMAIL_RE.test(newEmail.trim())) { setEmailMsg('Enter a valid email address'); return; }
    setEmailSaving(true);
    try {
      await updateEmail(newEmail.trim(), token);
      setNewEmail('');
      setEmailMsg('Check your inbox to confirm the new email.');
    } catch {
      setEmailMsg("Couldn't update email — try again");
    } finally {
      setEmailSaving(false);
    }
  };

  const pwRulesOk = PASSWORD_RULES.every((r) => r.test(newPassword));
  const pwMatch = newPassword.length > 0 && confirmPw.length > 0 && newPassword === confirmPw;
  const handleSavePassword = async () => {
    if (!pwRulesOk || !pwMatch) return;
    setPwSaving(true);
    try {
      await updatePassword(newPassword, token);
      setNewPassword('');
      setConfirmPw('');
    } catch {
      // surfaced via disabled state; toast deferred
    } finally {
      setPwSaving(false);
    }
  };

  const Divider = () => <View style={{ borderTopWidth: theme.borderWidth.default, borderTopColor: theme.border.subtle, marginVertical: spacing.md }} />;

  // Layer header — back chevron + title. Rendered via a plain call (not a nested
  // component) so it doesn't remount on every keystroke in the Account inputs.
  const header = (title, onBackPress) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Math.max(insets.top, 20),
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: theme.borderWidth.default,
        borderBottomColor: theme.border.subtle,
      }}
    >
      <IconButton onPress={onBackPress} accessibilityLabel="Back"><ArrowLeft size={icon.sm} strokeWidth={1.5} color={theme.text.secondary} /></IconButton>
      <Heading level={1} visual="body" font="body">{title}</Heading>
      <View style={{ width: touch.min }} />
    </View>
  );

  const scrollProps = {
    contentContainerStyle: { paddingTop: spacing.lg, paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
    keyboardShouldPersistTaps: 'handled',
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface.canvas }}>
      {/* Main layer — always mounted; sub-pages slide in over it (iOS push feel) */}
      {header(TITLES.main, onBack)}
      <ScrollView {...scrollProps}>
        {/* Identity block — the dominant top, gives the screen a hero */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.lg, borderBottomWidth: theme.borderWidth.default, borderBottomColor: theme.border.subtle, marginBottom: spacing.md }}>
          <View style={{ width: 46, height: 46, borderWidth: 1, borderColor: theme.border.strong, alignItems: 'center', justifyContent: 'center' }}>
            <Text weight="medium" size="body">{(profile?.display_name?.trim()[0] || user.email?.[0] || 'O').toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Heading level={2} visual="title" font="heading" weight="semibold" numberOfLines={1} style={{ textTransform: 'lowercase' }}>
              {(profile?.display_name?.trim().split(' ')[0] || user.email?.split('@')[0] || 'you').toLowerCase()}
            </Heading>
            <Text tone="tertiary" size="label" numberOfLines={1} style={{ marginTop: 2 }}>{user.email}</Text>
          </View>
        </View>


        <SectionHeader>protocol</SectionHeader>
        <View style={{ borderLeftWidth: 2, borderLeftColor: theme.border.subtle, marginBottom: spacing.lg }}>
          <ConfigRow ix="01" label="schedule" value={SCHED_LABEL[scheduleMode] || ''} onPress={() => setView('schedule')} />
          <ConfigRow ix="02" label="account" value={user.email} onPress={() => setView('account')} />
        </View>

        <SectionHeader>system</SectionHeader>
        <View style={{ borderLeftWidth: 2, borderLeftColor: theme.border.subtle, marginBottom: spacing.lg }}>
          <ConfigRow
            ix="03"
            label="reminders"
            valueNode={
              <View style={{ flexDirection: 'row' }}>
                <Button variant="selector" active={remindersEnabled} onPress={() => { if (!remindersEnabled) onToggleReminders?.(true); }} style={{ minWidth: 48 }}>on</Button>
                <Button variant="selector" active={!remindersEnabled} onPress={() => { if (remindersEnabled) onToggleReminders?.(false); }} style={{ minWidth: 48, marginLeft: -1 }}>off</Button>
              </View>
            }
          />
          <ConfigRow ix="04" label="privacy" onPress={() => Linking.openURL(PRIVACY_URL)} />
        </View>

        <Button variant="secondary" fullWidth style={{ marginTop: spacing.sm }} onPress={() => setShowSignOutConfirm(true)}>$ sign out</Button>

        {/* about footer — the one place the brand names itself in the logged-in app */}
        <View style={{ alignItems: 'center', marginTop: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md }}>
          <OriginGlyph size={24} />
          <Text style={{ fontFamily: fonts.grotesk.semibold, fontSize: typography.body, color: theme.text.tertiary, letterSpacing: 0.5, marginTop: spacing.sm }}>origin</Text>
          <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.label, color: theme.text.tertiary, marginTop: spacing.xs }}>{`v${APP_VERSION}${BUILD_NUMBER ? ` (${BUILD_NUMBER})` : ''}`}</Text>
        </View>
      </ScrollView>

      {/* Account — slides in from the right */}
      <SlideScreen visible={view === 'account'}>
        <View style={{ flex: 1, backgroundColor: theme.surface.canvas }}>
          {header(TITLES.account, () => setView('main'))}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView {...scrollProps}>
            <SectionHeader>name</SectionHeader>
            <View style={{ marginBottom: spacing.lg }}>
              <Input value={displayName} onChangeText={handleDisplayNameChange} placeholder="e.g. Sofia von Hauske" autoComplete="name" autoCapitalize="words" />
              {nameSaving ? (
                <View style={{ position: 'absolute', right: spacing.sm, top: 0, bottom: 0, justifyContent: 'center' }}>
                  <InlineLoader size="sm" />
                </View>
              ) : null}
            </View>

            <SectionHeader>email</SectionHeader>
            <View style={{ marginBottom: spacing.lg }}>
              <Text tone="secondary" size="caption" style={{ marginBottom: spacing.xs }}>{user.email}</Text>
              <Input
                value={newEmail}
                onChangeText={(v) => { setNewEmail(v); setEmailMsg(''); }}
                placeholder="new email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={{ marginBottom: spacing.xs }}
              />
              {emailMsg ? <Text size="label" tone="danger" style={{ marginBottom: spacing.xs }}>{emailMsg}</Text> : null}
              <Button variant="secondary" fullWidth disabled={emailSaving || !newEmail.trim()} onPress={handleSaveEmail}>
                {emailSaving ? <InlineLoader size="sm" /> : 'update email'}
              </Button>
            </View>

            <SectionHeader>password</SectionHeader>
            <View style={{ marginBottom: spacing.lg }}>
              <Input value={newPassword} onChangeText={setNewPassword} placeholder="new password" secureTextEntry autoCapitalize="none" style={{ marginBottom: spacing.xs }} />
              <Input value={confirmPw} onChangeText={setConfirmPw} placeholder="confirm new password" secureTextEntry autoCapitalize="none" style={{ marginBottom: spacing.xs }} />
              {confirmPw && !pwMatch ? <Text size="label" tone="danger" style={{ marginBottom: spacing.xs }}>passwords don't match</Text> : null}
              <View style={{ marginBottom: spacing.xs }}>
                {PASSWORD_RULES.map((r) => <PasswordRule key={r.label} label={r.label} met={r.test(newPassword)} />)}
              </View>
              <Button variant="secondary" fullWidth disabled={pwSaving || !pwRulesOk || !pwMatch} onPress={handleSavePassword}>
                {pwSaving ? <InlineLoader size="sm" /> : 'update password'}
              </Button>
            </View>

            <SectionHeader>danger</SectionHeader>
            <Button variant="destructive" fullWidth onPress={() => { setDeleteErr(''); setShowDeleteConfirm(true); }}>delete account</Button>
            <Text tone="tertiary" size="label" style={{ marginTop: spacing.xs }}>permanently deletes your account and all your data. this can't be undone.</Text>
          </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </SlideScreen>

      {/* Schedule — slides in from the right */}
      <SlideScreen visible={view === 'schedule'}>
        <View style={{ flex: 1, backgroundColor: theme.surface.canvas }}>
          {header(TITLES.schedule, () => setView('main'))}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView {...scrollProps}>
            <ScheduleTab
              scheduleMode={scheduleMode}
              scheduleConfig={scheduleConfig}
              anchorBehavior={anchorBehavior}
              consistentTime={consistentTime}
              adaptive={adaptiveEnabled}
              onSave={onSaveSchedule}
              supplements={supplements}
            />
          </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </SlideScreen>

      <Modal
        open={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        title="sign out?"
        footer={
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <Button variant="secondary" style={{ flex: 1 }} onPress={() => setShowSignOutConfirm(false)}>cancel</Button>
            <Button variant="primary" style={{ flex: 1 }} onPress={() => { setShowSignOutConfirm(false); onSignOut?.(); }}>sign out</Button>
          </View>
        }
      >
        <Text tone="secondary">you'll need to sign in again to access your protocol. your data stays safe.</Text>
      </Modal>

      <Modal
        open={showDeleteConfirm}
        onClose={() => (deleting ? null : setShowDeleteConfirm(false))}
        title="delete your account?"
        footer={
          <View style={{ gap: spacing.xs }}>
            {deleteErr ? <Text size="label" tone="danger" style={{ textAlign: 'center' }}>{deleteErr}</Text> : null}
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              <Button variant="secondary" style={{ flex: 1 }} disabled={deleting} onPress={() => setShowDeleteConfirm(false)}>cancel</Button>
              <Button variant="destructive" style={{ flex: 1 }} disabled={deleting} onPress={handleDeleteAccount}>
                {deleting ? <InlineLoader size="sm" /> : 'delete'}
              </Button>
            </View>
          </View>
        }
      >
        <Text tone="secondary">this permanently deletes your account, protocols, schedule, and history. it can't be undone.</Text>
      </Modal>
    </View>
  );
}
