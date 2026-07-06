import { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { findInteractions, TIMING_DISCLAIMER } from 'shared/lib/interactions';
import { Heading, SectionHeader, Text, HelperText } from '../components';
import IconButton from '../components/IconButton';
import { theme, spacing, typography, fonts, icon } from '../theme';

// One timing-sensitive pair. Amber accent when the two share a slot (the
// actionable case — same time can't be spaced); subtle otherwise.
function InteractionCard({ item }) {
  const accent = item.sameSlot ? theme.status.warning : theme.border.subtle;
  return (
    <View style={{ marginBottom: spacing.md, borderLeftWidth: 2, borderLeftColor: accent, backgroundColor: theme.surface.cardSubtle, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xxs }}>
        <Text style={{ fontFamily: fonts.mono.semibold, fontSize: typography.body, color: theme.text.primary }}>{item.aLabel} + {item.bLabel}</Text>
        <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.label, color: item.sameSlot ? theme.status.warning : theme.text.tertiary, textTransform: 'uppercase', letterSpacing: 1 }}>
          {item.sameSlot ? 'same slot' : 'spaced'}
        </Text>
      </View>
      <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.label, color: theme.text.tertiary, marginBottom: spacing.xs }}>
        {item.suppsA.join(', ')} ↔ {item.suppsB.join(', ')}
      </Text>
      <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.caption, color: theme.text.secondary, lineHeight: 21 }}>
        {item.note} {item.sameSlot ? `They're in the same slot — consider moving one, ~${item.sep} apart.` : `Keep ~${item.sep} between them.`}
      </Text>
    </View>
  );
}

export default function Interactions({ supps = [], onBack }) {
  const insets = useSafeAreaInsets();
  const items = useMemo(() => findInteractions(supps), [supps]);
  const conflicts = items.filter((i) => i.sameSlot).length;

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface.canvas }}>
      {/* Header — drill-in detail pattern. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Math.max(insets.top, 20), paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: theme.borderWidth.default, borderBottomColor: theme.border.subtle }}>
        <IconButton accessibilityLabel="Back" onPress={onBack}><ArrowLeft size={icon.sm} color={theme.text.secondary} /></IconButton>
        <Heading level={1} visual="body" font="body">Interactions</Heading>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: spacing.lg, paddingHorizontal: spacing.md, paddingBottom: spacing.xxl }}>
        <HelperText>
          Common absorption-timing pairs found in your regimen. {conflicts > 0 ? `${conflicts} share a slot — worth spacing out.` : 'Nothing needs moving right now.'}
        </HelperText>

        {items.length === 0 ? (
          <View style={{ marginTop: spacing.lg }}>
            <SectionHeader marker="//">no timing pairs found</SectionHeader>
            <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.body, color: theme.text.secondary }}>$ nothing to space out ▌</Text>
            <HelperText style={{ marginTop: spacing.md, marginBottom: 0 }}>
              Origin checks a curated set of well-established timing separations (thyroid meds, calcium, iron, zinc, copper, caffeine). It isn't a complete interaction checker.
            </HelperText>
          </View>
        ) : (
          <View style={{ marginTop: spacing.sm }}>
            {items.map((item) => <InteractionCard key={item.key} item={item} />)}
          </View>
        )}

        {/* Disclaimer — the liability line, always visible. */}
        <View style={{ marginTop: spacing.lg, borderTopWidth: theme.borderWidth.default, borderTopColor: theme.border.divider, paddingTop: spacing.md }}>
          <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.caption2, color: theme.text.tertiary, lineHeight: 18 }}>{TIMING_DISCLAIMER}</Text>
        </View>
      </ScrollView>
    </View>
  );
}
