import { useState, useMemo } from 'react';
import { View, Pressable } from 'react-native';
import { SUPPLEMENTS_DATABASE } from 'shared/data/supplements-database';
import Input from './Input';
import Text from './Text';
import { theme, spacing, typography, fonts } from '../theme';

// RN port of src/components/SupplementNameAutocomplete.jsx. Name field with an
// INLINE suggestion list (recents when empty+focused; history + database matches
// once 3+ chars typed). Inline rather than an absolute overlay — overlays get
// clipped inside the modal's ScrollView. `history` = the user's past names.
export default function SupplementNameAutocomplete({ value, onChangeText, history = [], placeholder, onBlur, editable = true }) {
  const [focused, setFocused] = useState(false);

  const recents = useMemo(() => history.slice(0, 4), [history]);
  const suggestions = useMemo(() => {
    const text = (value || '').trim();
    if (text.length < 3) return [];
    const lower = text.toLowerCase();
    const seen = new Set();
    const out = [];
    for (const name of history) {
      if (name.toLowerCase().includes(lower) && !seen.has(name.toLowerCase())) { seen.add(name.toLowerCase()); out.push(name); if (out.length >= 5) break; }
    }
    for (const name of SUPPLEMENTS_DATABASE) {
      if (out.length >= 5) break;
      if (name.toLowerCase().includes(lower) && !seen.has(name.toLowerCase())) { seen.add(name.toLowerCase()); out.push(name); }
    }
    return out.filter((n) => n.toLowerCase() !== lower); // hide exact match
  }, [value, history]);

  const showRecents = focused && !value && recents.length > 0;
  const list = showRecents ? recents : focused ? suggestions : [];

  const pick = (name) => { onChangeText(name); setFocused(false); };

  return (
    <View>
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        autoCapitalize="words"
        autoCorrect={false}
        editable={editable}
        onFocus={() => setFocused(true)}
        onBlur={(e) => { setTimeout(() => setFocused(false), 150); onBlur?.(e); }}
      />
      {list.length > 0 ? (
        <View style={{ marginTop: spacing.xxs, borderWidth: theme.borderWidth.default, borderColor: theme.border.subtle, borderRadius: theme.radius.surface, backgroundColor: theme.surface.canvas, overflow: 'hidden' }}>
          {showRecents ? (
            <Text style={{ paddingHorizontal: spacing.sm, paddingTop: spacing.xs, fontSize: typography.label, color: theme.text.tertiary, fontFamily: fonts.mono.semibold, letterSpacing: 0.5 }}>RECENT</Text>
          ) : null}
          {list.map((name, i) => (
            <Pressable
              key={name}
              onPress={() => pick(name)}
              accessibilityRole="button"
              accessibilityLabel={`Use ${name}`}
              style={{ paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderTopWidth: i === 0 ? 0 : theme.borderWidth.default, borderTopColor: theme.border.subtle }}
            >
              <Text numberOfLines={1}>{name}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
