import { useState } from 'react';
import { View, Pressable, LayoutAnimation, UIManager, Platform } from 'react-native';
import { Pencil, ChevronDown, Clock, Check } from 'lucide-react-native';
import Text from './Text';
import Heading from './Heading';
import Badge from './Badge';
import Checkbox from './Checkbox';
import CategoryIcon from './CategoryIcon';
import { theme, spacing, typography, touch, icon, fonts } from '../theme';

// Faithful RN port of src/components/SlotCard.jsx — status-colored container,
// collapsible body (auto-expand now/late), take-all icon button in the header,
// category icons, dose·notes subline, and the pinned-time `single` mode.
// Deferred: the "log at…" pill (needs the native time picker — Phase 5).

// Android needs this opt-in for LayoutAnimation; iOS has it on by default.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
// Gentle, consistent collapse/expand easing.
const EXPAND_ANIM = { duration: 220, create: { type: 'easeInEaseOut', property: 'opacity' }, update: { type: 'easeInEaseOut' }, delete: { type: 'easeInEaseOut', property: 'opacity' } };

const statusColors = () => ({
  done: { border: theme.border.subtle, bg: theme.surface.cardSubtle, hbg: 'transparent', badge: null },
  missed: { border: theme.border.subtle, bg: theme.surface.cardSubtle, hbg: 'transparent', badge: 'late' },
  now: { border: theme.status.nowBorder, bg: theme.status.nowBg, hbg: theme.status.nowHover, badge: 'now' },
  future: { border: theme.border.subtle, bg: theme.surface.cardSubtle, hbg: 'transparent', badge: null },
});

function StatusBadge({ kind, isReadOnly }) {
  if (kind === 'now') return <Badge variant="now">now</Badge>;
  if (kind === 'late') return <Badge variant={isReadOnly ? 'neutral' : 'missed'}>late</Badge>;
  return null;
}

function SuppRow({ slotId, supp, done, atTime, onToggle, onEdit, isReadOnly, isPast, status, openLogAt, supply }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: touch.row }}>
      <Pressable
        onPress={onToggle}
        hitSlop={10}
        disabled={!onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={supp.name}
      >
        <Checkbox checked={done} size={icon.md} shape="square" weight="accent" />
      </Pressable>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs2 ?? 4 }}>
          <Text
            weight={done ? 'regular' : 'medium'}
            style={[{ flexShrink: 1 }, done ? { textDecorationLine: 'line-through', color: theme.text.secondary } : null]}
          >
            {supp.name}
          </Text>
          <CategoryIcon category={supp.category} color={theme.text.secondary} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xxxs, minHeight: 14 }}>
          <Text tone="secondary" size="label" numberOfLines={1} style={{ flexShrink: 1 }}>
            {supp.dose}{supp.notes ? ` · ${supp.notes}` : ''}
          </Text>
          {done && atTime ? (
            <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Clock size={10} color={theme.text.tertiary} />
              <Text tone="tertiary" size="label">at {atTime}</Text>
            </View>
          ) : !done && status === 'missed' && !isReadOnly && openLogAt ? (
            <Pressable onPress={() => openLogAt(slotId, supp.id)} hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={`Log ${supp.name} at a time`} style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: theme.borderWidth.default, borderColor: theme.status.warning, borderRadius: theme.radius.badge, paddingVertical: 2, paddingHorizontal: spacing.xs }}>
              <Clock size={10} color={theme.status.warning} />
              <Text size="label" style={{ color: theme.status.warning }}>log at…</Text>
            </Pressable>
          ) : null}
        </View>
        {/* Low-supply alert — only surfaces on home when it actually matters
            (running low or out), so the take-now surface stays clean. */}
        {supply && (supply.out || supply.low) ? (
          <Text size="label" numberOfLines={1} style={{ marginTop: spacing.xxxs, color: supply.out ? theme.status.danger : theme.status.warning, fontFamily: fonts.mono.regular, letterSpacing: 0.3 }}>
            {supply.out ? 'out — refill' : `≈${supply.daysLeft}d left — refill soon`}
          </Text>
        ) : null}
      </View>
      {!isReadOnly && !isPast && onEdit ? (
        <Pressable onPress={() => onEdit(supp)} hitSlop={14} accessibilityRole="button" accessibilityLabel={`Edit ${supp.name}`}>
          <Pencil size={icon.xs} color={theme.text.tertiary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function SlotCard({
  slot,
  slotSupps,
  status,
  timeLabel,
  isChecked,
  checkedAtTime,
  toggleCheck,
  takeAllInSlot,
  openEdit,
  openLogAt,
  noSchedule = false,
  isReadOnly = false,
  isFuture = false,
  isPast = false,
  single = false,
  supplyMap,
}) {
  const SC = statusColors();
  const sc = SC[status] || SC.future;
  const allDone = slotSupps.length > 0 && slotSupps.every((s) => isChecked(slot.id, s.id));
  const [expanded, setExpanded] = useState(status === 'now' || status === 'missed');

  // De-carded: no filled surface — a left STATUS GUTTER carries state (white =
  // now/live, green = done, amber = missed, dim = future) and the row sits on the
  // canvas, separated from neighbours by the list gap. More authored than a stack
  // of grey boxes; status now reads from one element instead of a background tint.
  const gutter =
    status === 'done' ? theme.status.success :
    status === 'missed' ? theme.status.warning :
    status === 'now' ? theme.text.primary :
    theme.border.subtle;
  const container = {
    borderLeftWidth: 3,
    borderLeftColor: gutter,
    overflow: 'hidden',
  };

  // ── Single (pinned-time anytime supp) ──
  if (single) {
    const supp = slotSupps[0];
    if (!supp) return null;
    const done = isChecked(slot.id, supp.id);
    const atTime = checkedAtTime ? checkedAtTime(slot.id, supp.id) : null;
    return (
      <View style={container}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minHeight: touch.row }}>
          <Pressable onPress={isFuture || isReadOnly ? undefined : () => toggleCheck(slot.id, supp.id)} hitSlop={10} accessibilityRole="checkbox" accessibilityState={{ checked: done }} accessibilityLabel={supp.name}>
            <Checkbox checked={done} size={icon.md} shape="square" weight="accent" />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs2 }}>
              {/* Title follows the same state rules as the grouped cards: it only
                  reaches full-white when it's actionable (now/missed). A future
                  pinned item recedes to secondary instead of popping. */}
              <Text
                weight={done ? 'regular' : 'medium'}
                style={[
                  { flexShrink: 1, color: done || status === 'future' ? theme.text.secondary : theme.text.primary },
                  done ? { textDecorationLine: 'line-through' } : null,
                ]}
              >
                {supp.name}
              </Text>
              <CategoryIcon category={supp.category} color={theme.text.secondary} />
              <StatusBadge kind={sc.badge} isReadOnly={isReadOnly} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xxxs, minHeight: 14 }}>
              <Text tone="secondary" size="label" numberOfLines={1} style={{ flexShrink: 1 }}>{supp.dose}{supp.notes ? ` · ${supp.notes}` : ''}</Text>
              {done && atTime ? (
                <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Clock size={10} color={theme.text.tertiary} />
                  <Text tone="tertiary" size="label">at {atTime}</Text>
                </View>
              ) : !done && status === 'missed' && !isReadOnly && openLogAt ? (
                <Pressable onPress={() => openLogAt(slot.id, supp.id)} hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={`Log ${supp.name} at a time`} style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: theme.borderWidth.default, borderColor: theme.status.warning, borderRadius: theme.radius.badge, paddingVertical: 2, paddingHorizontal: spacing.xs }}>
                  <Clock size={10} color={theme.status.warning} />
                  <Text size="label" style={{ color: theme.status.warning }}>log at…</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
          {timeLabel ? <Text tone="secondary" size="caption" weight="semibold">{timeLabel}</Text> : null}
          {!isReadOnly && !isPast && openEdit ? (
            <Pressable onPress={() => openEdit(supp)} hitSlop={14} accessibilityRole="button" accessibilityLabel={`Edit ${supp.name}`}><Pencil size={icon.xs} color={theme.text.tertiary} /></Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  // ── Grouped slot ──
  const canTakeAll = !isReadOnly && !isFuture && !allDone && !!takeAllInSlot;
  const sublabelText = allDone && !expanded ? `${slotSupps.length} item${slotSupps.length !== 1 ? 's' : ''} done` : slot.sublabel;

  return (
    <View style={container}>
      <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
        {/* Take-all icon button */}
        <Pressable
          onPress={canTakeAll ? () => takeAllInSlot(slot.id, slotSupps) : undefined}
          disabled={!canTakeAll}
          style={{ paddingVertical: spacing.md, paddingLeft: spacing.md, paddingRight: spacing.xs, justifyContent: 'center' }}
          accessibilityLabel={allDone ? `${slot.label} all done` : `Take all in ${slot.label}`}
        >
          {allDone ? (
            <View style={{ width: 20, height: 20, borderRadius: theme.radius.surfaceInner, backgroundColor: theme.accent.default, alignItems: 'center', justifyContent: 'center' }}>
              <Check size={13} color={theme.text.onAccent} strokeWidth={3} />
            </View>
          ) : (
            <Text style={{ color: theme.slot?.default ?? theme.text.primary, fontSize: typography.caption, fontFamily: fonts.mono.regular, width: 20, textAlign: 'center' }}>{slot.icon}</Text>
          )}
        </Pressable>

        {/* Expand toggle */}
        <Pressable
          onPress={() => { LayoutAnimation.configureNext(EXPAND_ANIM); setExpanded((e) => !e); }}
          style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, paddingRight: spacing.md, paddingLeft: spacing.xs }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Heading level={2} visual="title" weight="medium" style={{ color: status === 'now' ? theme.text.primary : theme.text.secondary }}>{slot.label}</Heading>
              <StatusBadge kind={sc.badge} isReadOnly={isReadOnly} />
            </View>
            {sublabelText ? <Text tone="secondary" size="label" style={{ marginTop: spacing.xxxs, minHeight: 16 }}>{sublabelText}</Text> : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            {!noSchedule && timeLabel ? <Text tone="secondary" size="caption" weight="semibold">{timeLabel}</Text> : null}
            <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
              <ChevronDown size={16} color={theme.text.secondary} />
            </View>
          </View>
        </Pressable>
      </View>

      {expanded ? (
        <View style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderTopWidth: theme.borderWidth.default, borderTopColor: theme.border.divider, gap: spacing.sm }}>
          {slotSupps.map((supp) => {
            const done = isChecked(slot.id, supp.id);
            return (
              <SuppRow
                key={supp.id}
                slotId={slot.id}
                supp={supp}
                done={done}
                atTime={checkedAtTime ? checkedAtTime(slot.id, supp.id) : null}
                onToggle={isFuture || isReadOnly ? null : () => toggleCheck(slot.id, supp.id)}
                onEdit={openEdit}
                isReadOnly={isReadOnly}
                isPast={isPast}
                status={status}
                openLogAt={openLogAt}
                supply={supplyMap?.[supp.id]}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
