import { useMemo, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, X } from 'lucide-react-native';
import { findInteractions, timingTips, movers, coachLine, TIMING_DISCLAIMER } from 'shared/lib/interactions';
import { Heading, SectionHeader, Text, HelperText, Callout } from '../components';
import IconButton from '../components/IconButton';
import { theme, spacing, icon } from '../theme';

// One timing-sensitive pair. Amber rule when the two share a slot (the
// actionable case — same time can't be spaced); subtle otherwise.
function InteractionCard({ item }) {
  return (
    <Callout tone={item.sameSlot ? 'warning' : 'neutral'} style={{ marginBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xxs }}>
        <Text weight="semibold">{item.aLabel} + {item.bLabel}</Text>
        <Text size="label" tone="tertiary" style={{ textTransform: 'uppercase', letterSpacing: 1, ...(item.sameSlot ? { color: theme.status.warning } : {}) }}>
          {item.sameSlot ? 'same slot' : 'spaced'}
        </Text>
      </View>
      <Text size="label" tone="tertiary" style={{ marginBottom: spacing.xs }}>
        {item.suppsA.join(', ')} ↔ {item.suppsB.join(', ')}
      </Text>
      <Text size="caption" tone="secondary">{item.note}</Text>
      {/* The coaching line — the actionable fix, the thing no other app gives. */}
      <View style={{ flexDirection: 'row', marginTop: spacing.xs }}>
        <Text size="caption" tone="tertiary" style={{ marginRight: spacing.xs }}>→</Text>
        <Text size="caption" style={{ flex: 1, color: theme.text.primary }}>{coachLine(item)}</Text>
      </View>
    </Callout>
  );
}

export default function Interactions({ supps = [], onBack, embedded = false }) {
  const insets = useSafeAreaInsets();
  const items = useMemo(() => findInteractions(supps), [supps]);
  const tips = useMemo(() => timingTips(supps), [supps]);
  const mv = useMemo(() => movers(supps), [supps]);
  const conflicts = items.filter((i) => i.sameSlot).length;

  // "Worth moving" nudges are dismissable — if you've deliberately kept an item
  // where it is, a permanent amber flag just nags. Dismissals persist per item.
  const [dismissed, setDismissed] = useState(() => {
    try { return new Set(JSON.parse(global.localStorage.getItem('dismissed_movers') || '[]')); }
    catch { return new Set(); }
  });
  const dismissMover = (id) => setDismissed((prev) => {
    const next = new Set(prev); next.add(id);
    try { global.localStorage.setItem('dismissed_movers', JSON.stringify([...next])); } catch {}
    return next;
  });
  const mvVisible = mv.filter((it) => !dismissed.has(it.id));
  const nothing = items.length === 0 && tips.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface.canvas }}>
      {/* Header — drill-in detail pattern. Skipped when embedded (Insights owns it). */}
      {!embedded ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Math.max(insets.top, 20), paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: theme.borderWidth.default, borderBottomColor: theme.border.subtle }}>
          <IconButton accessibilityLabel="Back" onPress={onBack}><ArrowLeft size={icon.sm} color={theme.text.secondary} /></IconButton>
          <Heading level={1} visual="body" font="body">Interactions</Heading>
          <View style={{ width: 44 }} />
        </View>
      ) : null}

      <ScrollView contentContainerStyle={{ paddingTop: spacing.lg, paddingHorizontal: spacing.md, paddingBottom: spacing.xxl }}>

        {/* ── Conflicts (absorption pairs) — only when there are any ── */}
        {items.length > 0 ? (
          <View style={{ marginBottom: spacing.xl }}>
            <SectionHeader>absorption conflicts</SectionHeader>
            {conflicts > 0 ? (
              <HelperText>{conflicts} share a slot — worth spacing out.</HelperText>
            ) : null}
            {items.map((item) => <InteractionCard key={item.key} item={item} />)}
          </View>
        ) : null}

        {/* ── Worth moving — items scheduled against their ideal timing ── */}
        {mvVisible.length > 0 ? (
          <View style={{ marginBottom: spacing.xl }}>
            <SectionHeader>worth moving</SectionHeader>
            {mvVisible.map((it) => (
              <Callout key={it.id} tone="warning" style={{ marginBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text weight="semibold" numberOfLines={1}>{it.suppName}</Text>
                    <Text size="caption" style={{ color: theme.status.warning, marginTop: 2 }}>{it.move}</Text>
                  </View>
                  <Pressable
                    onPress={() => dismissMover(it.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Dismiss the suggestion to move ${it.suppName}`}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ marginLeft: spacing.sm, marginTop: 1 }}
                  >
                    <X size={icon.sm} color={theme.text.tertiary} />
                  </Pressable>
                </View>
              </Callout>
            ))}
          </View>
        ) : null}

        {/* ── How to time your whole stack — grouped guidance ── */}
        {tips.length > 0 ? (
          <View>
            <SectionHeader>how to time your stack</SectionHeader>
            {tips.map((group) => (
              <View key={group.tag} style={{ marginBottom: spacing.lg }}>
                <Text size="label" weight="semibold" tone="tertiary" style={{ textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.xs }}>{group.tag}</Text>
                {group.items.map((it) => (
                  <View key={it.id} style={{ marginBottom: spacing.sm }}>
                    <Text size="caption" numberOfLines={1}>{it.suppName}</Text>
                    <Text size="caption" tone="secondary" style={{ marginTop: 2 }}>{it.tip}</Text>
                    {it.move ? <Text size="caption" style={{ color: theme.status.warning, marginTop: 2 }}>→ {it.move}</Text> : null}
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {/* ── Nothing recognized ── */}
        {nothing ? (
          <View>
            <SectionHeader marker="//">nothing to time yet</SectionHeader>
            <Text tone="secondary">$ add items to get timing guidance ▌</Text>
            <HelperText style={{ marginTop: spacing.md, marginBottom: 0 }}>
              Origin recognizes common supplements and medications and gives timing guidance for each. It isn't a complete interaction checker.
            </HelperText>
          </View>
        ) : null}

        {/* Disclaimer — the liability line, always visible. Quiet but legible. */}
        <View style={{ marginTop: spacing.lg, borderTopWidth: theme.borderWidth.default, borderTopColor: theme.border.divider, paddingTop: spacing.md }}>
          <Text size="label" tone="secondary">{TIMING_DISCLAIMER}</Text>
        </View>
      </ScrollView>
    </View>
  );
}
