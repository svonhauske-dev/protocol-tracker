import { useState, useEffect } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { shortDate } from 'shared/lib/time';
import { dbGetReceivedProtocols } from 'shared/lib/api';
import { Heading, Label, Text, Button, Input, Row, HelperText, InlineTip, Cursor } from '../components';
import DateRangeField from '../components/DateRangeField';
import Modal from '../components/Modal';
import TabBar from '../components/TabBar';
import IconButton from '../components/IconButton';
import { theme, spacing, typography, touch, icon, fonts } from '../theme';

// Scoped single-user RN port of src/components/ProtocolLibrary.jsx — list
// (Active/Saved), create (name + duration + stack/replace intent), open detail.
// Clinician/received-protocol flows are out of mobile v1 scope and omitted.

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return shortDate(new Date(y, m - 1, d));
}
function addDuration(startStr, value, unit) {
  const d = startStr ? new Date(startStr + 'T00:00:00') : new Date();
  if (unit === 'weeks') d.setDate(d.getDate() + value * 7);
  if (unit === 'months') d.setMonth(d.getMonth() + value);
  return d.toISOString().split('T')[0];
}
const DURATION_UNITS = ['days', 'weeks', 'months'];
const errStyle = { fontSize: typography.label, color: theme.status.danger, marginTop: spacing.xxxs };

function IconBtn({ children, onPress, label }) {
  return <IconButton onPress={onPress} accessibilityLabel={label}>{children}</IconButton>;
}

function ProtocolRow({ protocol, count, onTap }) {
  const isArchived = protocol.status !== 'active';
  const sub =
    `${count} ${count === 1 ? 'supplement' : 'supplements'}` +
    (protocol.status === 'archived' ? ' · Saved' : '') +
    (protocol.ends_at && protocol.status === 'active' ? ` · Ends ${formatDate(protocol.ends_at)}` : '');
  return (
    <Row
      onPress={onTap}
      rightContent={onTap ? undefined : null}
      leftContent={
        <View style={{ flex: 1, minWidth: 0 }}>
          <Heading level={3} visual="title" font="heading" weight="semibold" style={{ marginBottom: 2 }}>{protocol.name}</Heading>
          <Text tone="secondary" size="caption">{sub}</Text>
        </View>
      }
      style={{ borderBottomWidth: theme.borderWidth.default, borderBottomColor: theme.border.subtle, paddingVertical: spacing.sm, opacity: isArchived ? 0.55 : 1 }}
    />
  );
}

function IntentOption({ label, description, onPress }) {
  return (
    <Row
      onPress={onPress}
      rightContent={null}
      leftContent={
        <View style={{ flex: 1, paddingRight: spacing.sm }}>
          <Text weight="medium" style={{ marginBottom: spacing.xxxs }}>{label}</Text>
          <Text tone="secondary" size="caption" style={{ lineHeight: 20 }}>{description}</Text>
        </View>
      }
      style={{ borderBottomWidth: theme.borderWidth.default, borderBottomColor: theme.border.subtle, paddingVertical: spacing.sm }}
    />
  );
}

// Shell-voiced empty state matching the home screen: bordered block on canvas,
// `// eyebrow` + `$ line ▌`, left-aligned. No centered ◯ glyph.
function EmptyState({ eyebrow, line, onNew }) {
  return (
    <View style={{ borderWidth: theme.borderWidth.default, borderColor: theme.border.subtle, paddingVertical: spacing.xl, paddingHorizontal: spacing.md }}>
      <Text style={{ fontFamily: fonts.mono.semibold, fontSize: typography.label, color: theme.text.tertiary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: spacing.md }}>{`// ${eyebrow}`}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: onNew ? spacing.lg : 0 }}>
        <Text style={{ fontFamily: fonts.mono.regular, fontSize: typography.body, color: theme.text.secondary }}>{`$ ${line}`}</Text>
        <Cursor width={7} height={15} color={theme.text.secondary} style={{ marginLeft: 5 }} />
      </View>
      {onNew ? <Button variant="primary" fullWidth onPress={onNew}>+ new protocol</Button> : null}
    </View>
  );
}

export default function ProtocolLibrary({ protocols = [], supplements = [], onAddProtocol, onOpenDetail, onBack, userId, token, onActivateReceived, onDeclineReceived }) {
  const insets = useSafeAreaInsets();
  const today = new Date().toISOString().split('T')[0];
  const [tab, setTab] = useState('active');
  // Received protocols (peer-to-peer) — pending sends to this user.
  const [received, setReceived] = useState([]);
  const [activateSend, setActivateSend] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!userId) return;
    dbGetReceivedProtocols(userId, token).then((r) => setReceived(r || [])).catch(() => {});
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReceived = async (intent) => {
    if (busy || !activateSend) return;
    setBusy(true);
    const ok = await onActivateReceived?.(activateSend, intent);
    setBusy(false);
    if (ok) { setReceived((r) => r.filter((x) => x.id !== activateSend.id)); setActivateSend(null); }
  };
  const handleDecline = async () => {
    if (busy || !activateSend) return;
    setBusy(true);
    const ok = await onDeclineReceived?.(activateSend);
    setBusy(false);
    if (ok) { setReceived((r) => r.filter((x) => x.id !== activateSend.id)); setActivateSend(null); }
  };
  const [showNew, setShowNew] = useState(false);
  const [step, setStep] = useState('form');
  const [newName, setNewName] = useState('');
  const [txMode, setTxMode] = useState('indefinite');
  const [schedSub, setSchedSub] = useState('duration');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [durValue, setDurValue] = useState('');
  const [durUnit, setDurUnit] = useState('weeks');
  const [creating, setCreating] = useState(false);

  const activeProtocols = protocols.filter((p) => p.status === 'active');
  const archivedProtocols = protocols.filter((p) => p.status !== 'active').sort((a, b) => a.name.localeCompare(b.name));
  const suppCount = (pid) => supplements.filter((s) => s.protocol_id === pid).length;

  const dateError = txMode === 'scheduled' && schedSub === 'dates' && startsAt && endsAt && endsAt <= startsAt;
  const step1Valid =
    newName.trim() &&
    (txMode === 'indefinite' ||
      (txMode === 'scheduled' && schedSub === 'dates' && startsAt && endsAt && !dateError) ||
      (txMode === 'scheduled' && schedSub === 'duration' && Number(durValue) > 0));

  const resetNew = () => {
    setShowNew(false); setStep('form'); setNewName(''); setTxMode('indefinite'); setSchedSub('duration');
    setStartsAt(''); setEndsAt(''); setDurValue(''); setDurUnit('weeks'); setCreating(false);
  };

  const handleCreate = async (intent) => {
    if (creating) return;
    setCreating(true);
    const computedStartsAt = txMode === 'indefinite' ? null : startsAt || today;
    const computedEndsAt =
      txMode === 'indefinite' ? null :
      txMode === 'scheduled' && schedSub === 'duration' ? addDuration(today, Number(durValue), durUnit) :
      endsAt || null;
    const created = await onAddProtocol({ name: newName.trim(), treatment_mode: txMode, starts_at: computedStartsAt, ends_at: computedEndsAt }, intent);
    if (created) resetNew();
    else setCreating(false);
  };

  const handleStep1Continue = () => {
    if (!step1Valid || creating) return;
    if (activeProtocols.length === 0) handleCreate('stack');
    else setStep('intent');
  };

  const replacedNames = activeProtocols.map((p) => p.name).join(', ');

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface.canvas }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Math.max(insets.top, 20), paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: theme.borderWidth.default, borderBottomColor: theme.border.subtle }}>
        <IconBtn label="Back" onPress={onBack}><ArrowLeft size={icon.sm} color={theme.text.secondary} /></IconBtn>
        <Heading level={1} visual="body" font="body">Protocols</Heading>
        <IconBtn label="New protocol" onPress={() => setShowNew(true)}><Plus size={icon.sm} color={theme.text.secondary} /></IconBtn>
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: spacing.lg, paddingHorizontal: spacing.md, paddingBottom: spacing.xxl }}>
        {received.length > 0 ? (
          <View style={{ marginBottom: spacing.xl }}>
            <Label style={{ marginBottom: spacing.xs }}>Received</Label>
            <InlineTip id="first-received" label="what you can do">tap a protocol to add it on top of your current one, replace it, or save it for later.</InlineTip>
            <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
              {received.map((send) => (
                <Row
                  key={send.id}
                  onPress={() => setActivateSend(send)}
                  rightContent={<Text size="body" tone="tertiary">→</Text>}
                  leftContent={
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Heading level={3} visual="title" font="heading" weight="semibold" numberOfLines={1}>{send.name}</Heading>
                      <Text tone="secondary" size="caption">{(send.supplements_snapshot || []).length} supplements</Text>
                    </View>
                  }
                  style={{ borderWidth: theme.borderWidth.default, borderColor: theme.border.subtle, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}
                />
              ))}
            </View>
          </View>
        ) : null}

        <TabBar
          tabs={[{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Saved' }]}
          active={tab}
          onChange={setTab}
          style={{ marginBottom: spacing.lg }}
        />

        {tab === 'active' ? (
          activeProtocols.length === 0 ? (
            <EmptyState eyebrow="protocols — empty" line="build your first protocol" onNew={() => setShowNew(true)} />
          ) : (
            <View style={{ borderTopWidth: theme.borderWidth.default, borderTopColor: theme.border.subtle }}>
              {activeProtocols.map((p) => (
                <ProtocolRow key={p.id} protocol={p} count={suppCount(p.id)} onTap={onOpenDetail ? () => onOpenDetail(p) : undefined} />
              ))}
            </View>
          )
        ) : archivedProtocols.length === 0 ? (
          <EmptyState eyebrow="saved — empty" line="nothing saved yet" />
        ) : (
          <View style={{ borderTopWidth: theme.borderWidth.default, borderTopColor: theme.border.subtle }}>
            {archivedProtocols.map((p) => (
              <ProtocolRow key={p.id} protocol={p} count={suppCount(p.id)} onTap={onOpenDetail ? () => onOpenDetail(p) : undefined} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create modal */}
      <Modal
        open={showNew}
        onClose={resetNew}
        title={step === 'form' ? 'new protocol' : `adding "${newName.trim()}"`}
        footer={
          step === 'form' ? (
            <Button variant="primary" fullWidth onPress={handleStep1Continue} disabled={!step1Valid || creating}>
              {creating ? 'creating…' : activeProtocols.length === 0 ? 'create protocol' : 'continue'}
            </Button>
          ) : (
            <Button variant="tertiary" fullWidth onPress={() => setStep('form')}>back</Button>
          )
        }
      >
        {step === 'form' ? (
          <View>
            <View style={{ marginBottom: spacing.md }}>
              <Label>Name</Label>
              <Input value={newName} onChangeText={setNewName} placeholder="e.g. Immunity Protocol" autoCapitalize="words" />
            </View>

            <View style={{ marginBottom: spacing.md }}>
              <Label>Duration</Label>
              <View style={{ flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm }}>
                {[['indefinite', 'Indefinite'], ['scheduled', 'Scheduled']].map(([val, label]) => (
                  <Button key={val} variant="selector" active={txMode === val} style={{ flex: 1 }} onPress={() => setTxMode(val)}>{label}</Button>
                ))}
              </View>

              {txMode === 'scheduled' ? (
                <View>
                  <View style={{ flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm }}>
                    {[['duration', 'For a duration'], ['dates', 'Specific dates']].map(([val, label]) => (
                      <Button key={val} variant="selector" active={schedSub === val} style={{ flex: 1 }} onPress={() => setSchedSub(val)}>{label}</Button>
                    ))}
                  </View>

                  {schedSub === 'duration' ? (
                    <View>
                      <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }}>
                        <Input variant="number" width={72} value={durValue} placeholder="0" onChangeText={setDurValue} />
                        <View style={{ flexDirection: 'row', gap: spacing.xs, flex: 1 }}>
                          {DURATION_UNITS.map((u) => (
                            <Button key={u} variant="selector" active={durUnit === u} style={{ flex: 1 }} onPress={() => setDurUnit(u)}>{u}</Button>
                          ))}
                        </View>
                      </View>
                      {Number(durValue) > 0 ? <HelperText style={{ marginTop: spacing.xxs }}>Ends {formatDate(addDuration(today, Number(durValue), durUnit))}</HelperText> : null}
                    </View>
                  ) : (
                    <View>
                      <DateRangeField
                        startValue={startsAt}
                        endValue={endsAt}
                        onChangeStart={setStartsAt}
                        onChangeEnd={setEndsAt}
                      />
                      {dateError ? <Text style={errStyle}>end date must be after start date</Text> : null}
                    </View>
                  )}
                </View>
              ) : null}
            </View>
          </View>
        ) : (
          <View>
            <IntentOption label="replace current" description={`${replacedNames} will be archived · ${newName.trim()} becomes your active protocol`} onPress={() => handleCreate('replace')} />
            <IntentOption label="stack on top" description="supplements from all active protocols appear on your home screen simultaneously" onPress={() => handleCreate('stack')} />
            <IntentOption label="save for later" description="added to your library without activating. enable it whenever you're ready" onPress={() => handleCreate('save_later')} />
          </View>
        )}
      </Modal>

      {/* Review a received protocol — add / replace / save / decline */}
      <Modal
        open={!!activateSend}
        onClose={() => (busy ? null : setActivateSend(null))}
        title={activateSend?.name || ''}
      >
        <Text tone="secondary" style={{ marginBottom: spacing.md, lineHeight: 21 }}>
          {(activateSend?.supplements_snapshot || []).length} supplement{(activateSend?.supplements_snapshot || []).length !== 1 ? 's' : ''} included.
        </Text>
        <IntentOption label="add on top" description="appears alongside your current protocols on the home screen" onPress={() => handleReceived('stack')} />
        <IntentOption label="replace current" description="archives your active protocols and makes this the active one" onPress={() => handleReceived('replace')} />
        <IntentOption label="save for later" description="added to your saved tab without activating" onPress={() => handleReceived('save_later')} />
        <View style={{ marginTop: spacing.sm }}>
          <Button variant="destructive" fullWidth disabled={busy} onPress={handleDecline}>decline</Button>
        </View>
      </Modal>
    </View>
  );
}
