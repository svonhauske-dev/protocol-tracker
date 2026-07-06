import { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dbSaveSchedule } from 'shared/lib/api';
import { DEFAULT_CONFIG } from 'shared/config';
import { Heading, Text, Button, Cursor } from '../components';
import OriginGlyph from '../components/OriginGlyph';
import ScheduleTab from './ScheduleTab';
import { requestNotificationPermission } from '../lib/notifications';
import { track } from '../lib/analytics';
import { theme, spacing, layout } from '../theme';

// First-run wizard — builds the user's schedule using the SAME components as
// Settings → Schedule (so it matches exactly), split into steps:
//   1 · schedule type      (ScheduleTab showOnly='type')
//   2 · fine-tune timing   (ScheduleTab showOnly='details' — same mounted instance)
//   3 · reminders
// 'none' (just a checklist) has no timing → skips straight to done after step 1.

// Step progress — N short bars, filled up to the current step.
function StepDots({ step, total }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs, justifyContent: 'center', marginBottom: spacing.lg }}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={{ width: 28, height: 3, backgroundColor: i < step ? theme.text.primary : theme.border.subtle }} />
      ))}
    </View>
  );
}

function StepHeader({ title, sub }) {
  return (
    <>
      <View style={{ alignItems: 'center', marginBottom: spacing.md }}><OriginGlyph size={44} /></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs }}>
        <Heading level={1} visual="display" weight="bold" font="heading" style={{ textAlign: 'center' }}>{title}</Heading>
        <Cursor width={10} height={26} style={{ marginLeft: 6 }} />
      </View>
      <Text tone="secondary" size="caption" style={{ textAlign: 'center', marginBottom: spacing.xl, lineHeight: 21 }}>{sub}</Text>
    </>
  );
}

const HEADERS = {
  1: { title: "let's set you up", sub: 'pick how your day is scheduled. you can change this anytime in settings.' },
  2: { title: 'fine-tune timing', sub: 'set when each part of your day happens — the defaults are sensible, adjust what you like.' },
  3: { title: 'want reminders?', sub: 'get a notification at each scheduled time so you never miss a dose.' },
};

export default function Onboarding({ user, onDone }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1); // 1 type · 2 details · 3 reminders
  const [mode, setMode] = useState('medication'); // tracked from ScheduleTab onSave

  const token = () => global.localStorage.getItem('sb_token');

  // ScheduleTab autosaves on every change (and on mount via saveOnMount); we
  // persist it here and remember the chosen mode so step nav can branch on 'none'.
  const saveSchedule = async (m, config, behavior, cTime, adaptiveVal) => {
    setMode(m);
    const offsets = m === 'fasting' ? { ...config } : { ...config, _anchor_behavior: behavior, _consistent_time: cTime };
    try {
      await dbSaveSchedule({ user_id: user.id, schedule_type: m, offsets, adaptive_timing: !!adaptiveVal }, token());
      return true;
    } catch {
      return false;
    }
  };

  // One completion path so onboarding_complete fires exactly once, with the mode.
  const finish = () => { track('onboarding_complete', { mode }); onDone(); };

  async function enableReminders() {
    await requestNotificationPermission().catch(() => {});
    global.localStorage.setItem('reminders_enabled', '1');
    finish();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.surface.canvas }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: Math.max(insets.top, 20) + spacing.lg, paddingHorizontal: spacing.md, paddingBottom: spacing.xxl, justifyContent: step === 3 ? 'center' : 'flex-start' }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' }}>
          <StepDots step={step} total={3} />
          <StepHeader title={HEADERS[step].title} sub={HEADERS[step].sub} />

          {step <= 2 ? (
            <>
              {/* ONE ScheduleTab across steps 1–2 so its state persists; the step
                  just toggles which sections render. */}
              <ScheduleTab
                scheduleMode="medication"
                scheduleConfig={DEFAULT_CONFIG}
                anchorBehavior="flexible"
                consistentTime="07:00"
                adaptive={false}
                onSave={saveSchedule}
                supplements={[]}
                showOnly={step === 1 ? 'type' : 'details'}
                saveOnMount
              />
              {step === 1 ? (
                <Button variant="primary" fullWidth onPress={() => (mode === 'none' ? finish() : setStep(2))} style={{ marginTop: spacing.lg }}>continue</Button>
              ) : (
                <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.lg }}>
                  <Button variant="secondary" style={{ flex: 1 }} onPress={() => setStep(1)}>back</Button>
                  <Button variant="primary" style={{ flex: 1 }} onPress={() => setStep(3)}>continue</Button>
                </View>
              )}
            </>
          ) : (
            <>
              <Button variant="primary" fullWidth onPress={enableReminders} style={{ marginBottom: spacing.sm }}>enable reminders</Button>
              <Button variant="tertiary" fullWidth onPress={finish}>not now</Button>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
