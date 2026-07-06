import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { Heading } from '../components';
import IconButton from '../components/IconButton';
import TabBar from '../components/TabBar';
import Trends from './Trends';
import Interactions from './Interactions';
import { theme, spacing, icon } from '../theme';

// Insights — the regimen's read-only review surface. Folds the two low-frequency
// "look back" screens under one entry with a TabBar (same title + tabs pattern as
// ProtocolLibrary's active/saved). `timing` is quiet enough that it doesn't earn
// its own top-bar slot; the edit-time note + the amber home icon carry the
// urgent case, and `initialTab` opens straight to timing when a conflict exists.
const TABS = [
  { value: 'adherence', label: 'adherence' },
  { value: 'timing', label: 'timing' },
];

export default function Insights({ supps = [], activeSlotIds, slotDefs = [], userId, token, onBack, initialTab = 'adherence' }) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState(initialTab);

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface.canvas }}>
      {/* Header — nav-title, no own hairline (the TabBar below is the separator). */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Math.max(insets.top, 20), paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>
        <IconButton accessibilityLabel="Back" onPress={onBack}><ArrowLeft size={icon.sm} color={theme.text.secondary} /></IconButton>
        <Heading level={1} visual="body" font="body">Insights</Heading>
        <View style={{ width: 44 }} />
      </View>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'adherence' ? (
        <Trends embedded supps={supps} activeSlotIds={activeSlotIds} slotDefs={slotDefs} userId={userId} token={token} />
      ) : (
        <Interactions embedded supps={supps} />
      )}
    </View>
  );
}
