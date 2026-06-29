import { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Check } from 'lucide-react-native';
// Reused verbatim from the web app via the `shared` alias.
import { signInPassword, signUp, dbCreateProfile, requestPasswordReset } from 'shared/lib/api';
import { Heading, Label, Text, Button, Input, Cursor } from '../components';
import InlineLoader from '../components/InlineLoader';
import OriginGlyph from '../components/OriginGlyph';
import { theme, spacing, layout, icon, touch, letterSpacing as LS } from '../theme';

// RN port of src/components/Auth.jsx — sign in / sign up / forgot-password
// request. reset_confirm (set a new password via the recovery link) is handled
// on the web for now (the reset email's redirect points there) — mobile deep
// linking is deferred.
const RESET_REDIRECT = 'https://origin-protocol.vercel.app';

const PASSWORD_RULES = [
  { label: '8+ characters', test: (p) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Number', test: (p) => /[0-9]/.test(p) },
  { label: 'Special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const COPY = {
  signin: { title: 'welcome back', sub: 'pick up where you left off' },
  signup: { title: 'hello', sub: "let's set up your protocol" },
  reset_request: { title: 'reset password', sub: "we'll email you a link to set a new one" },
  reset_sent: { title: 'check your email', sub: 'if an account exists for that email, we sent a reset link. open it on the web to choose a new password.' },
};

function PasswordRule({ met, label }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xxs }}>
      <View style={{ width: icon.xs, height: icon.xs, borderRadius: theme.radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: met ? theme.accent.default : 'transparent', borderWidth: theme.borderWidth.default, borderColor: met ? theme.accent.default : theme.border.strong }}>
        {met ? <Check size={10} color={theme.text.onAccent} strokeWidth={3} /> : null}
      </View>
      <Text size="label" style={{ color: met ? theme.text.primary : theme.text.secondary }}>{label}</Text>
    </View>
  );
}

function LinkBtn({ children, onPress }) {
  return (
    <Pressable onPress={onPress} style={{ minHeight: touch.min, alignItems: 'center', justifyContent: 'center' }}>
      <Text size="caption" tone="secondary">{children}</Text>
    </Pressable>
  );
}

export default function Auth({ onSignedIn }) {
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const copy = COPY[mode];
  const emailOk = /\S+@\S+\.\S+/.test(email.trim());
  const rulesOk = PASSWORD_RULES.every((r) => r.test(password));
  const canSubmit = !busy && (
    mode === 'signin' ? emailOk && password.length > 0 :
    mode === 'signup' ? name.trim().length > 0 && emailOk && rulesOk :
    mode === 'reset_request' ? emailOk :
    false
  );

  const goTo = (next) => { setMode(next); setError(null); setPassword(''); };

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signin') {
        const { user } = await signInPassword(email.trim(), password);
        onSignedIn(user);
      } else if (mode === 'signup') {
        const { user, session } = await signUp(email.trim(), password);
        try { await dbCreateProfile({ id: user.id, display_name: name.trim() || null }, session.access_token); } catch {}
        onSignedIn(user, true); // new user → guided onboarding
      } else if (mode === 'reset_request') {
        await requestPasswordReset(email.trim(), RESET_REDIRECT);
        setMode('reset_sent');
      }
    } catch (e) {
      setError(
        e.message === 'EMAIL_TAKEN' ? 'that email already has an account' :
        mode === 'signin' ? 'email or password is incorrect' :
        mode === 'reset_request' ? "couldn't send the reset link" :
        'something went wrong'
      );
    } finally {
      setBusy(false);
    }
  }

  const submitLabel = mode === 'signin' ? 'sign in' : mode === 'signup' ? 'create account' : 'send reset link';

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.surface.canvas }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.md }} keyboardShouldPersistTaps="handled">
        <View style={{ width: '100%', maxWidth: layout.signInWidth }}>
          <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
            <OriginGlyph size={56} />
          </View>

          <Heading level={1} visual="heading" font="heading" weight="bold" style={{ textTransform: 'uppercase', letterSpacing: LS.labelWide, color: theme.text.primary, textAlign: 'center', marginBottom: spacing.lg }}>
            Origin
          </Heading>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs }}>
            <Heading level={1} visual="display" weight="bold" font="heading" style={{ textAlign: 'center' }}>
              {copy.title}
            </Heading>
            <Cursor width={10} height={26} style={{ marginLeft: 6 }} />
          </View>
          <Text tone="secondary" size="caption" style={{ textAlign: 'center', marginBottom: spacing.xl, lineHeight: 21 }}>
            {copy.sub}
          </Text>

          {mode === 'reset_sent' ? (
            <Button variant="tertiary" fullWidth onPress={() => goTo('signin')}>back to sign in</Button>
          ) : (
            <>
              {mode === 'signup' ? (
                <View style={{ marginBottom: spacing.md }}>
                  <Label>Full name</Label>
                  <Input value={name} onChangeText={(v) => { setName(v); setError(null); }} placeholder="e.g. Sofia von Hauske" autoCapitalize="words" autoComplete="name" editable={!busy} />
                </View>
              ) : null}

              <View style={{ marginBottom: spacing.md }}>
                <Label>Email</Label>
                <Input value={email} onChangeText={(v) => { setEmail(v); setError(null); }} placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="username" editable={!busy} />
              </View>

              {mode === 'signin' || mode === 'signup' ? (
                <View style={{ marginBottom: mode === 'signup' ? spacing.sm : spacing.md }}>
                  <Label>Password</Label>
                  <Input value={password} onChangeText={(v) => { setPassword(v); setError(null); }} placeholder="password" secureTextEntry autoCapitalize="none" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} textContentType={mode === 'signin' ? 'password' : 'newPassword'} editable={!busy} onSubmitEditing={canSubmit ? submit : undefined} />
                </View>
              ) : null}

              {mode === 'signup' ? (
                <View style={{ marginBottom: spacing.md }}>
                  {PASSWORD_RULES.map((r) => <PasswordRule key={r.label} label={r.label} met={r.test(password)} />)}
                </View>
              ) : null}

              {error ? <Text size="label" tone="danger" style={{ marginBottom: spacing.xs }}>{error}</Text> : null}

              <Button variant="primary" fullWidth onPress={submit} disabled={!canSubmit}>
                {busy ? <InlineLoader size="sm" color={theme.text.onAccent} /> : submitLabel}
              </Button>

              {mode === 'signin' ? (
                <View style={{ marginTop: spacing.xs }}>
                  <LinkBtn onPress={() => goTo('reset_request')}>forgot password?</LinkBtn>
                  <LinkBtn onPress={() => goTo('signup')}>don't have an account? sign up</LinkBtn>
                </View>
              ) : mode === 'signup' ? (
                <View style={{ marginTop: spacing.xs }}>
                  <LinkBtn onPress={() => goTo('signin')}>already have an account? sign in</LinkBtn>
                </View>
              ) : (
                <View style={{ marginTop: spacing.xs }}>
                  <LinkBtn onPress={() => goTo('signin')}>back to sign in</LinkBtn>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
