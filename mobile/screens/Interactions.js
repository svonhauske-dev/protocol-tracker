import { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { findInteractions, coachLine, TIMING_DISCLAIMER } from 'shared/lib/interactions';
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
  const conflicts = items.filter((i) => i.sameSlot).length;

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
        <HelperText>
          Common absorption-timing pairs found in your regimen. {conflicts > 0 ? `${conflicts} share a slot — worth spacing out.` : 'Nothing needs moving right now.'}
        </HelperText>

        {items.length === 0 ? (
          <View style={{ marginTop: spacing.lg }}>
            <SectionHeader marker="//">no timing pairs found</SectionHeader>
            <Text tone="secondary">$ nothing to space out ▌</Text>
            <HelperText style={{ marginTop: spacing.md, marginBottom: 0 }}>
              Origin checks a curated set of well-established timing separations (thyroid meds, calcium, iron, zinc, copper, caffeine). It isn't a complete interaction checker.
            </HelperText>
          </View>
        ) : (
          <View style={{ marginTop: spacing.sm }}>
            {items.map((item) => <InteractionCard key={item.key} item={item} />)}
          </View>
        )}

        {/* Disclaimer — the liability line, always visible. Quiet but legible. */}
        <View style={{ marginTop: spacing.lg, borderTopWidth: theme.borderWidth.default, borderTopColor: theme.border.divider, paddingTop: spacing.md }}>
          <Text size="label" tone="secondary">{TIMING_DISCLAIMER}</Text>
        </View>
      </ScrollView>
    </View>
  );
}
