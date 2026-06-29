import { useState } from 'react';
import { View, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dbSaveSchedule } from 'shared/lib/api';
import { DEFAULT_CONFIG, DISPLAY_MODES, ANCHOR_SUB_MODES } from 'shared/config';
import { Heading, Label, Text, Button, Cursor } from '../components';
import OriginGlyph from '../components/OriginGlyph';
import InlineLoader from '../components/InlineLoader';
import { requestNotificationPermission } from '../lib/notifications';
import { theme, spacing, layout } from '../theme';

// First-run flow for new sign-ups: pick a schedule type → (reminders prompt) →
// into the app. Lighter than the web's 596-line guided config — sensible
// defaults are saved and the user refines in Settings → Schedule.
function ModeCard({ title, desc, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: theme.borderWidth.default,
        borderColor: selected ? theme.accent.default : theme.border.subtle,
        backgroundColor: selected ? theme.accent.subtle : 'transparent',
        borderRadius: theme.radius.surface,
        padding: spacing.md,
        marginBottom: spacing.xs,
      }}
    >
      <Heading level={3} visual="title" font="heading" weight="semibold" style={{ color: selected ? theme.accent.onSubtle : theme.text.primary, marginBottom: spacing.xxxs }}>{title}</Heading>
      {desc ? <Text size="caption" tone="secondary" style={{ lineHeight: 20 }}>{desc}</Text> : null}
    </Pressable>
  );
}

export default function Onboarding({ user, onDone }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1); // 1 = schedule type, 2 = reminders
  const [selected, setSelected] = useState(null);
  const [anchorSub, setAnchorSub] = useState('medication');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const token = () => global.localStorage.getItem('sb_token');
  const resolvedMode = selected === 'anchor' ? anchorSub : selected;

  async function saveAndContinue() {
    if (!selected || saving) return;
    setSaving(true);
    setError(null);
    try {
      const config = resolvedMode === 'none' ? {} : DEFAULT_CONFIG;
      const offsets = resolvedMode === 'fasting' ? { ...config, _if_v2_migrated: true } : { ...config, _anchor_behavior: 'flexible', _consistent_time: '07:00' };
      await dbSaveSchedule({ user_id: user.id, schedule_type: resolvedMode, offsets, adaptive_timing: false }, token());
      if (resolvedMode === 'none') onDone(); // no times → skip the reminders prompt
      else setStep(2);
    } catch (e) {
      setError("couldn't save your schedule — check your connection and try again");
    } finally {
      setSaving(false);
    }
  }

  async function enableReminders() {
    await requestNotificationPermission().catch(() => {});
    global.localStorage.setItem('reminders_enabled', '1');
    onDone();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.surface.canvas }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingTop: Math.max(insets.top, 20) + spacing.lg, paddingHorizontal: spacing.md, paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
        <View style={{ width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' }}>
          {step === 1 ? (
            <>
              <View style={{ alignItems: 'center', marginBottom: spacing.md }}><OriginGlyph size={48} /></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs }}>
                <Heading level={1} visual="display" weight="bold" font="heading" style={{ textAlign: 'center' }}>let's set you up</Heading>
                <Cursor width={10} height={26} style={{ marginLeft: 6 }} />
              </View>
              <Text tone="secondary" size="caption" style={{ textAlign: 'center', marginBottom: spacing.xl, lineHeight: 21 }}>
                pick how your day is scheduled. you can change this anytime in settings.
              </Text>

              {DISPLAY_MODES.map((m) => (
                <ModeCard key={m.id} title={m.title} desc={m.desc} selected={selected === m.id} onPress={() => setSelected(m.id)} />
              ))}

              {selected === 'anchor' ? (
                <View style={{ marginTop: spacing.sm }}>
                  <Label style={{ marginBottom: spacing.xs }}>Anchor type</Label>
                  <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                    {ANCHOR_SUB_MODES.map((s) => (
                      <Button key={s.id} variant="selector" active={anchorSub === s.id} style={{ flexGrow: 1, flexShrink: 1, flexBasis: 'auto' }} onPress={() => setAnchorSub(s.id)}>{s.label}</Button>
                    ))}
                  </View>
                </View>
              ) : null}

              {error ? <Text size="label" tone="danger" style={{ marginTop: spacing.sm }}>{error}</Text> : null}

              <Button variant="primary" fullWidth onPress={saveAndContinue} disabled={!selected || saving} style={{ marginTop: spacing.lg }}>
                {saving ? <InlineLoader size="sm" color={theme.text.onAccent} /> : 'continue'}
              </Button>
            </>
          ) : (
            <>
              <View style={{ alignItems: 'center', marginBottom: spacing.md }}><OriginGlyph size={48} /></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs }}>
                <Heading level={1} visual="display" weight="bold" font="heading" style={{ textAlign: 'center' }}>want reminders?</Heading>
                <Cursor width={10} height={26} style={{ marginLeft: 6 }} />
              </View>
              <Text tone="secondary" size="caption" style={{ textAlign: 'center', marginBottom: spacing.xl, lineHeight: 21 }}>
                get a notification at each scheduled time so you never miss a dose.
              </Text>
              <Button variant="primary" fullWidth onPress={enableReminders} style={{ marginBottom: spacing.sm }}>enable reminders</Button>
              <Button variant="tertiary" fullWidth onPress={onDone}>not now</Button>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
