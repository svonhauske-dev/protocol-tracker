// ─────────────────────────────────────────────────────────────────────────────
// TIMING guidance — NOT medical advice.
//
// A small, curated set of well-established supplement / medication *timing*
// separations (things that compete for absorption when taken together). Matched
// against free-text supplement names by keyword.
//
// Deliberately scoped to TIMING ONLY — "take X apart from Y". No dosage, no
// diagnosis, no "don't take", no efficacy claims. Every surface that shows these
// carries the disclaimer below. This is the liability line: we help people SPACE
// what they already take; we do not tell them what to take or treat conditions.
// ─────────────────────────────────────────────────────────────────────────────
import { isActiveSupp } from './time';

export const TIMING_DISCLAIMER =
  'Timing guidance, not medical advice. Always confirm with your doctor or pharmacist.';

// Canonical ingredients + the keywords that identify them inside a free-text
// name (case-insensitive substring). Keep keywords specific to avoid false hits.
export const INGREDIENTS = [
  { id: 'levothyroxine', label: 'levothyroxine', keywords: ['levothyroxine', 'synthroid', 'levoxyl', 'euthyrox', 'tirosint', 'unithroid', 'levoxine', 'thyroxine'] },
  { id: 'calcium',   label: 'calcium',   keywords: ['calcium', 'cal-mag', 'calmag'] },
  { id: 'iron',      label: 'iron',      keywords: ['iron', 'ferrous', 'ferric'] },
  { id: 'magnesium', label: 'magnesium', keywords: ['magnesium'] },
  { id: 'zinc',      label: 'zinc',      keywords: ['zinc'] },
  { id: 'copper',    label: 'copper',    keywords: ['copper'] },
  { id: 'caffeine',  label: 'coffee / caffeine', keywords: ['coffee', 'caffeine', 'espresso'] },
];

// Each rule is a timing separation between two ingredients. `note` explains the
// WHY in one plain sentence (absorption competition) — never a directive beyond
// spacing.
export const RULES = [
  { a: 'levothyroxine', b: 'calcium',   sep: '4 hours',    note: 'Calcium binds levothyroxine and reduces its absorption.' },
  { a: 'levothyroxine', b: 'iron',      sep: '4 hours',    note: 'Iron binds levothyroxine and reduces its absorption.' },
  { a: 'levothyroxine', b: 'magnesium', sep: '4 hours',    note: 'Magnesium can reduce levothyroxine absorption.' },
  { a: 'levothyroxine', b: 'caffeine',  sep: '30–60 min',  note: 'Coffee can cut levothyroxine absorption — many take it on an empty stomach first.' },
  { a: 'calcium',       b: 'iron',      sep: '2 hours',    note: 'Calcium and iron compete for absorption.' },
  { a: 'zinc',          b: 'iron',      sep: '2 hours',    note: 'Zinc and iron compete for absorption.' },
  { a: 'zinc',          b: 'calcium',   sep: '2 hours',    note: 'Calcium can reduce zinc absorption.' },
  { a: 'zinc',          b: 'copper',    sep: '2 hours',    note: 'Zinc and copper compete for absorption.' },
];

const norm = (s) => (s || '').toLowerCase();
const labelOf = (id) => INGREDIENTS.find((i) => i.id === id)?.label || id;

// Ingredient ids present in a free-text supplement name.
export function detectIngredients(name) {
  const n = norm(name);
  const ids = [];
  for (const ing of INGREDIENTS) {
    if (ing.keywords.some((k) => n.includes(k))) ids.push(ing.id);
  }
  return ids;
}

// Scan an active regimen for timing-sensitive ingredient pairs. Returns one
// entry per triggered rule: the two sides (by ingredient label + the supp names
// that matched) plus whether any matched pair currently shares a slot (the
// actionable case — same time = can't be spaced).
export function findInteractions(supps) {
  const tagged = (supps || [])
    .filter(isActiveSupp)
    .map((s) => ({ supp: s, ings: detectIngredients(s.name) }))
    .filter((t) => t.ings.length);

  const out = [];
  for (const rule of RULES) {
    const as = tagged.filter((t) => t.ings.includes(rule.a));
    const bs = tagged.filter((t) => t.ings.includes(rule.b));
    if (!as.length || !bs.length) continue;

    // Need at least two DISTINCT supplements — a single combo pill that contains
    // both is formulated to be taken together; flagging it would be noise.
    const distinct = new Set([...as, ...bs].map((t) => t.supp.id));
    if (distinct.size < 2) continue;

    const sameSlot = as.some((ta) => bs.some((tb) =>
      ta.supp.id !== tb.supp.id &&
      (ta.supp.slots || []).some((sid) => (tb.supp.slots || []).includes(sid))
    ));

    out.push({
      key: `${rule.a}_${rule.b}`,
      aLabel: labelOf(rule.a),
      bLabel: labelOf(rule.b),
      sep: rule.sep,
      note: rule.note,
      suppsA: [...new Set(as.map((t) => t.supp.name))],
      suppsB: [...new Set(bs.map((t) => t.supp.name))],
      sameSlot,
    });
  }
  // Same-slot (actionable) conflicts first.
  return out.sort((x, y) => Number(y.sameSlot) - Number(x.sameSlot));
}

// Edit-time check: does the supplement being edited (its name + chosen slots)
// conflict with anything already in the regimen? Returns one hit per rule.
export function checkCandidate(name, slots, otherSupps) {
  const ings = detectIngredients(name);
  if (!ings.length) return [];

  const others = (otherSupps || [])
    .filter(isActiveSupp)
    .map((s) => ({ supp: s, ings: detectIngredients(s.name) }))
    .filter((t) => t.ings.length);

  const hits = [];
  const seen = new Set();
  for (const rule of RULES) {
    const hasA = ings.includes(rule.a);
    const hasB = ings.includes(rule.b);
    if (!hasA && !hasB) continue;
    if (seen.has(rule.a + rule.b)) continue;

    const otherId = hasA ? rule.b : rule.a; // the ingredient we need elsewhere
    const matches = others.filter((o) => o.ings.includes(otherId) && o.supp.name.toLowerCase() !== norm(name));
    if (!matches.length) continue;

    const sameSlot = matches.some((o) => (o.supp.slots || []).some((sid) => (slots || []).includes(sid)));
    seen.add(rule.a + rule.b);
    hits.push({
      key: `${rule.a}_${rule.b}`,
      otherLabel: labelOf(otherId),
      otherNames: [...new Set(matches.map((o) => o.supp.name))],
      sep: rule.sep,
      note: rule.note,
      sameSlot,
    });
  }
  // Same-slot conflicts first — those are the ones worth interrupting for.
  return hits.sort((x, y) => Number(y.sameSlot) - Number(x.sameSlot));
}
