import { useState } from 'react';
import { View, Pressable, Linking } from 'react-native';
import Modal from './Modal';
import Text from './Text';
import Button from './Button';
import Checkbox from './Checkbox';
import { theme, spacing } from '../theme';

// What Pro unlocks — the value list, in the app's terse shell voice.
const PRO_FEATURES = [
  'insights — adherence + how-you-feel trends',
  'timing & interaction guidance',
  'refill + reorder reminders',
  'protocol PDF export',
  'share protocols with anyone',
  'intermittent-fasting & adaptive schedules',
  'unlimited protocols & items',
  'apple health sync',
];

// Fallback display prices when RevenueCat offerings aren't loaded (dev / pre-SDK).
const FALLBACK = {
  annual: { price: '$29.99', sub: 'per year · save 50%' },
  monthly: { price: '$4.99', sub: 'per month' },
};

const TERMS_URL = 'https://origin-protocol.vercel.app/terms.html';
const PRIVACY_URL = 'https://origin-protocol.vercel.app/privacy.html';

// One selectable plan row — pill checkbox on the left, price on the right,
// a white border when selected (no fill — matches the app's selection grammar).
function PlanRow({ id, selected, onSelect, price, sub, badge }) {
  return (
    <Pressable
      onPress={() => onSelect(id)}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
        borderWidth: theme.borderWidth.default,
        borderColor: selected ? theme.text.primary : theme.border.subtle,
        backgroundColor: selected ? theme.status.nowBg : 'transparent',
        paddingVertical: spacing.md, paddingHorizontal: spacing.md, marginBottom: spacing.xs,
      }}
    >
      <Checkbox checked={selected} shape="pill" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Text weight="semibold">{price}</Text>
          {badge ? <Text size="label" style={{ color: theme.status.success, textTransform: 'uppercase', letterSpacing: 1 }}>{badge}</Text> : null}
        </View>
        <Text size="label" tone="tertiary" style={{ marginTop: 2 }}>{sub}</Text>
      </View>
    </Pressable>
  );
}

export default function Paywall({ visible, feature, packages = [], onClose, onPurchase, purchasing, onRestore }) {
  const [plan, setPlan] = useState('annual');

  // Prefer real localized prices from RevenueCat; fall back to display prices.
  const priceFor = (id) => {
    const pkg = packages.find((p) => (p.identifier || '').toLowerCase().includes(id) || (p.packageType || '').toLowerCase().includes(id));
    return pkg?.product?.priceString || FALLBACK[id].price;
  };

  return (
    <Modal
      open={visible}
      onClose={onClose}
      title="Origin Pro"
      footer={
        <Button variant="primary" fullWidth disabled={purchasing} onPress={() => onPurchase(plan)}>
          {purchasing ? 'starting…' : 'start 14-day free trial'}
        </Button>
      }
    >
      {feature ? (
        <Text tone="secondary" size="caption" style={{ marginBottom: spacing.md }}>{`${feature} is part of Origin Pro.`}</Text>
      ) : null}

      {/* value list */}
      <View style={{ marginBottom: spacing.lg }}>
        {PRO_FEATURES.map((f) => (
          <View key={f} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.xs }}>
            <Text tone="tertiary" style={{ marginRight: spacing.sm }}>★</Text>
            <Text tone="secondary" size="caption" style={{ flex: 1 }}>{f}</Text>
          </View>
        ))}
      </View>

      {/* plans */}
      <PlanRow id="annual" selected={plan === 'annual'} onSelect={setPlan} price={priceFor('annual')} sub={FALLBACK.annual.sub} badge="14-day trial" />
      <PlanRow id="monthly" selected={plan === 'monthly'} onSelect={setPlan} price={priceFor('monthly')} sub={FALLBACK.monthly.sub} badge="14-day trial" />

      <Text size="label" tone="tertiary" style={{ marginTop: spacing.xs, lineHeight: 18 }}>
        14 days free, then your plan renews automatically. cancel anytime in Settings.
      </Text>

      {/* restore + legal — App Store requirements */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.md }}>
        <Pressable onPress={onRestore} hitSlop={8} accessibilityRole="button"><Text size="label" style={{ color: theme.accent.default }}>restore</Text></Pressable>
        <Pressable onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8}><Text size="label" tone="tertiary">terms</Text></Pressable>
        <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={8}><Text size="label" tone="tertiary">privacy</Text></Pressable>
      </View>
    </Modal>
  );
}
