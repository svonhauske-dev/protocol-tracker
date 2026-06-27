import { useState } from 'react';
import { View, ScrollView, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MoreHorizontal, Plus, Pause, Play, Trash2 } from 'lucide-react-native';
import { isActiveSupp, isPausedSupp } from 'shared/lib/time';
import { Heading, Text, Button, Badge } from '../components';
import CategoryIcon from '../components/CategoryIcon';
import TabBar from '../components/TabBar';
import Modal from '../components/Modal';
import IconButton from '../components/IconButton';
import { theme, spacing, typography, touch, icon, fonts } from '../theme';

// Scoped single-user RN port of src/components/ProtocolDetailScreen.jsx — header
// (back / inline-rename / ⋯ menu / add), supplements list (Active/Paused tabs or
// flat when archived), and lifecycle actions. Clinician send / PDF share are out
// of mobile v1 scope. add/edit are delegated to the parent (Today) via callbacks.
const byName = (a, b) => a.name.localeCompare(b.name);

function IconBtn({ children, onPress, label }) {
  return <IconButton bare onPress={onPress} accessibilityLabel={label}>{children}</IconButton>;
}

function BorderedIconBtn({ children, onPress, label }) {
  return <IconButton onPress={onPress} accessibilityLabel={label}>{children}</IconButton>;
}

function SuppRow({ supp, onPress, isLast, right, multiline }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, minHeight: multiline ? touch.row : touch.min, borderBottomWidth: isLast ? 0 : theme.borderWidth.default, borderBottomColor: theme.border.subtle }}>
      <Pressable onPress={onPress} disabled={!onPress} style={{ flex: 1, minWidth: 0, paddingRight: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs2 }}>
          <Text allowFontScaling maxFontSizeMultiplier={1.4} weight="medium" numberOfLines={1} style={{ flexShrink: 1 }}>{supp.name}</Text>
          <CategoryIcon category={supp.category} color={theme.text.secondary} />
          {isPausedSupp(supp) ? <Badge variant="neutral">paused</Badge> : null}
        </View>
        {multiline && (supp.dose || supp.notes) ? (
          <Text allowFontScaling maxFontSizeMultiplier={1.4} tone="secondary" size="label" style={{ marginTop: spacing.xxxs, minHeight: 14 }}>
            {supp.dose}{supp.notes ? ` · ${supp.notes}` : ''}
          </Text>
        ) : null}
      </Pressable>
      {right}
    </View>
  );
}

function EmptyState({ title, body, onAdd }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: spacing.xl, paddingHorizontal: spacing.md, paddingBottom: spacing.xxl }}>
      <Heading level={2} visual="display" font="heading" style={{ color: theme.text.secondary, marginBottom: spacing.md }}>◯</Heading>
      <Text allowFontScaling maxFontSizeMultiplier={1.4} weight="semibold" style={{ marginBottom: spacing.xs, textAlign: 'center' }}>{title}</Text>
      <Heading level={2} visual="caption" font="heading" weight="medium" style={{ color: theme.text.secondary, textAlign: 'center', lineHeight: 21, marginBottom: onAdd ? spacing.lg : 0 }}>{body}</Heading>
      {onAdd ? <Button variant="primary" fullWidth onPress={onAdd}>Add supplement</Button> : null}
    </View>
  );
}

export default function ProtocolDetailScreen({
  protocol, supplements = [], activeProtocolNames = [], onBack,
  onUpdateProtocol, onArchiveProtocol, onActivateProtocol, onDeleteProtocol,
  onAddSupp, onEditSupp, onTogglePauseSupp, onResumeSupp, onDeleteSupp,
}) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('active');
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'archive' | 'delete'
  const [deletingSupp, setDeletingSupp] = useState(null);
  const [activateIntentOpen, setActivateIntentOpen] = useState(false);

  if (!protocol) return null;
  const isActive = protocol.status === 'active';
  const isArchived = !isActive;

  const protocolSupps = supplements.filter((s) => s.protocol_id === protocol.id);
  const activeSupps = protocolSupps.filter(isActiveSupp).sort(byName);
  const pausedSupps = protocolSupps.filter(isPausedSupp).sort(byName);

  const saveName = async () => {
    const trimmed = nameVal.trim();
    if (!trimmed || trimmed === protocol.name) { setEditingName(false); return; }
    await onUpdateProtocol({ ...protocol, name: trimmed });
    setEditingName(false);
  };

  const handleConfirm = async () => {
    const action = confirmAction;
    setConfirmAction(null);
    if (action === 'archive') await onArchiveProtocol(protocol);
    if (action === 'delete') { await onDeleteProtocol(protocol); onBack(); }
  };

  const confirmDeleteSupp = async () => {
    const s = deletingSupp;
    setDeletingSupp(null);
    if (s) await onDeleteSupp(s);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface.canvas }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: Math.max(insets.top, 20), paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: theme.borderWidth.default, borderBottomColor: theme.border.subtle }}>
        <BorderedIconBtn label="Back" onPress={onBack}><ArrowLeft size={icon.sm} color={theme.text.secondary} /></BorderedIconBtn>

        {editingName ? (
          <TextInput allowFontScaling maxFontSizeMultiplier={1.4}
            autoFocus
            value={nameVal}
            onChangeText={setNameVal}
            onBlur={saveName}
            onSubmitEditing={saveName}
            style={{ flex: 1, textAlign: 'center', marginHorizontal: spacing.sm, paddingVertical: spacing.xxs, color: theme.text.primary, fontSize: typography.body, fontFamily: fonts.grotesk.semibold, borderBottomWidth: theme.borderWidth.default, borderBottomColor: theme.accent.default }}
          />
        ) : (
          <Pressable onPress={() => { setNameVal(protocol.name); setEditingName(true); }} style={{ flex: 1, paddingHorizontal: spacing.sm }}>
            <Heading level={1} visual="body" font="body" style={{ textAlign: 'center' }} numberOfLines={1}>{protocol.name}</Heading>
          </Pressable>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <BorderedIconBtn label="Protocol actions" onPress={() => setMenuOpen(true)}><MoreHorizontal size={icon.sm} color={theme.text.secondary} /></BorderedIconBtn>
          <BorderedIconBtn label="Add supplement" onPress={onAddSupp}><Plus size={icon.sm} color={theme.text.secondary} /></BorderedIconBtn>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xxl }}>
        {isArchived ? (
          protocolSupps.length === 0 ? (
            <EmptyState title="No supplements in this protocol" body="Saved protocols can stay empty — they're a record of what you ran or plan to." />
          ) : (
            <View style={{ borderTopWidth: theme.borderWidth.default, borderTopColor: theme.border.subtle }}>
              {protocolSupps.map((supp, i) => (
                <SuppRow
                  key={supp.id}
                  supp={supp}
                  onPress={() => onEditSupp(supp)}
                  isLast={i === protocolSupps.length - 1}
                  right={<IconBtn label={`Delete ${supp.name}`} onPress={() => setDeletingSupp(supp)}><Trash2 size={icon.sm} color={theme.status.danger} /></IconBtn>}
                />
              ))}
            </View>
          )
        ) : (
          <>
            <TabBar
              tabs={[{ value: 'active', label: 'Active' }, { value: 'paused', label: 'Paused' }]}
              active={tab}
              onChange={setTab}
              style={{ marginBottom: spacing.lg }}
            />

            {tab === 'active' ? (
              activeSupps.length === 0 ? (
                <EmptyState title="Add your first supplement" body="Pick a name, dose, and when in the day it goes. You can edit anything later." onAdd={onAddSupp} />
              ) : (
                <View style={{ borderTopWidth: theme.borderWidth.default, borderTopColor: theme.border.subtle }}>
                  {activeSupps.map((supp, i) => (
                    <SuppRow
                      key={supp.id}
                      supp={supp}
                      multiline
                      onPress={() => onEditSupp(supp)}
                      isLast={i === activeSupps.length - 1}
                      right={<IconBtn label={`Pause ${supp.name}`} onPress={() => onTogglePauseSupp(supp)}><Pause size={icon.sm} color={theme.text.secondary} /></IconBtn>}
                    />
                  ))}
                </View>
              )
            ) : pausedSupps.length === 0 ? (
              <EmptyState title="Nothing paused" body="Pause a supplement from the Active tab to keep it in this protocol without tracking it for now." />
            ) : (
              <View style={{ borderTopWidth: theme.borderWidth.default, borderTopColor: theme.border.subtle }}>
                {pausedSupps.map((supp, i) => (
                  <SuppRow
                    key={supp.id}
                    supp={supp}
                    multiline
                    isLast={i === pausedSupps.length - 1}
                    right={
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <IconBtn label={`Delete ${supp.name}`} onPress={() => setDeletingSupp(supp)}><Trash2 size={icon.sm} color={theme.status.danger} /></IconBtn>
                        <IconBtn label={`Resume ${supp.name}`} onPress={() => onResumeSupp(supp)}><Play size={icon.sm} color={theme.text.primary} /></IconBtn>
                      </View>
                    }
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Overflow action sheet */}
      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title="Protocol options">
        <View style={{ gap: spacing.xs }}>
          {isActive ? (
            <Button variant="secondary" fullWidth onPress={() => { setMenuOpen(false); setConfirmAction('archive'); }}>Save protocol</Button>
          ) : (
            <Button variant="secondary" fullWidth onPress={() => { setMenuOpen(false); if (activeProtocolNames.length) setActivateIntentOpen(true); else onActivateProtocol(protocol, 'stack'); }}>Activate protocol</Button>
          )}
          {isArchived ? (
            <Button variant="destructive" fullWidth onPress={() => { setMenuOpen(false); setConfirmAction('delete'); }}>Delete protocol</Button>
          ) : null}
        </View>
      </Modal>

      {/* Lifecycle confirm */}
      <Modal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={confirmAction === 'delete' ? 'Delete protocol?' : 'Save this protocol?'}
        footer={
          <View style={{ gap: spacing.xs }}>
            <Button variant={confirmAction === 'delete' ? 'destructive' : 'primary'} fullWidth onPress={handleConfirm}>
              {confirmAction === 'delete' ? 'Delete' : 'Save protocol'}
            </Button>
            <Button variant="tertiary" fullWidth onPress={() => setConfirmAction(null)}>Cancel</Button>
          </View>
        }
      >
        <Text allowFontScaling maxFontSizeMultiplier={1.4} tone="secondary" style={{ lineHeight: 22 }}>
          {confirmAction === 'delete'
            ? `This permanently deletes "${protocol.name}" and its supplements.`
            : `Moves "${protocol.name}" to your Saved tab and stops tracking its supplements on the home screen.`}
        </Text>
      </Modal>

      {/* Delete-supplement confirm */}
      <Modal
        open={!!deletingSupp}
        onClose={() => setDeletingSupp(null)}
        title="Delete supplement?"
        footer={
          <View style={{ gap: spacing.xs }}>
            <Button variant="destructive" fullWidth onPress={confirmDeleteSupp}>Delete</Button>
            <Button variant="tertiary" fullWidth onPress={() => setDeletingSupp(null)}>Cancel</Button>
          </View>
        }
      >
        <Text allowFontScaling maxFontSizeMultiplier={1.4} tone="secondary" style={{ lineHeight: 22 }}>
          {deletingSupp ? `Remove "${deletingSupp.name}" from this protocol.` : ''}
        </Text>
      </Modal>

      {/* Activate-from-archive intent — only when other protocols are active */}
      <Modal open={activateIntentOpen} onClose={() => setActivateIntentOpen(false)} title={`Activate "${protocol.name}"`}>
        <View style={{ gap: spacing.sm }}>
          <Pressable
            onPress={() => { setActivateIntentOpen(false); onActivateProtocol(protocol, 'replace'); }}
            style={{ borderBottomWidth: theme.borderWidth.default, borderBottomColor: theme.border.subtle, paddingBottom: spacing.sm }}
          >
            <Text allowFontScaling maxFontSizeMultiplier={1.4} weight="medium" style={{ marginBottom: spacing.xxxs }}>Replace current</Text>
            <Text allowFontScaling maxFontSizeMultiplier={1.4} tone="secondary" size="caption" style={{ lineHeight: 20 }}>{activeProtocolNames.join(', ')} will be saved. {protocol.name} becomes your active protocol.</Text>
          </Pressable>
          <Pressable onPress={() => { setActivateIntentOpen(false); onActivateProtocol(protocol, 'stack'); }} style={{ paddingBottom: spacing.xs }}>
            <Text allowFontScaling maxFontSizeMultiplier={1.4} weight="medium" style={{ marginBottom: spacing.xxxs }}>Stack on top</Text>
            <Text allowFontScaling maxFontSizeMultiplier={1.4} tone="secondary" size="caption" style={{ lineHeight: 20 }}>Run it alongside your active protocols — supplements from all appear on your home screen.</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
