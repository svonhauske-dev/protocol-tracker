import { useState } from 'react';
import { View } from 'react-native';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import HelperText from './HelperText';
import { spacing } from '../theme';

// "Add several" — the activation flow. Type/paste one name per line, batch-create
// them with sensible defaults (anytime · every day · Oral), then refine each
// later in the normal edit form. Turns 20 add-flows into one.
export default function BulkAddModal({ open, onClose, onSubmit, submitting }) {
  const [lines, setLines] = useState(['', '', '']);

  const setLine = (i, v) => setLines((l) => l.map((x, idx) => (idx === i ? v : x)));
  const addLine = () => setLines((l) => [...l, '']);
  // Support pasting a multi-line block into one field: split it across lines.
  const onChange = (i, v) => {
    if (v.includes('\n')) {
      const parts = v.split('\n');
      setLines((l) => { const next = [...l]; next.splice(i, 1, ...parts); return next; });
    } else setLine(i, v);
  };

  const names = lines.map((s) => s.trim()).filter(Boolean);
  const reset = () => setLines(['', '', '']);
  const close = () => { reset(); onClose(); };
  const submit = () => onSubmit(names);

  return (
    <Modal
      open={open}
      onClose={close}
      title="add several"
      footer={
        <Button variant="primary" fullWidth disabled={names.length === 0 || submitting} onPress={submit}>
          {submitting ? 'adding…' : `add ${names.length || ''} item${names.length === 1 ? '' : 's'}`.replace('  ', ' ')}
        </Button>
      }
    >
      <HelperText>one per line — set doses & timing later</HelperText>
      {lines.map((v, i) => (
        <View key={i} style={{ marginBottom: spacing.xs }}>
          <Input value={v} placeholder={i === 0 ? 'e.g. Vitamin D3' : 'add another'} autoCapitalize="words" onChangeText={(t) => onChange(i, t)} />
        </View>
      ))}
      <Button variant="tertiary" onPress={addLine} style={{ marginTop: spacing.xxs }}>+ add a line</Button>
    </Modal>
  );
}
