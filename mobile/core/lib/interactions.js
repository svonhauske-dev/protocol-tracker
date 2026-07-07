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

// Canonical ingredients + keywords that identify them in a free-text name
// (case-insensitive substring). Most also carry a `tip` (one-line TIMING guidance)
// and a `tag` used to group the stack in the Interactions view — so a big regimen
// gets a tip per item, not just the rare conflict. Timing/practical only: never
// dosage, diagnosis, or "don't take". `tag` order is TAG_ORDER below.
export const INGREDIENTS = [
  // ── take alone, on an empty stomach ──
  { id: 'levothyroxine', label: 'levothyroxine', keywords: ['levothyroxine', 'synthroid', 'levoxyl', 'euthyrox', 'tirosint', 'unithroid', 'levoxine', 'thyroxine', 'liothyronine', 'cytomel'], tip: 'Take first thing on an empty stomach, 30–60 min before food or coffee.', tag: 'empty stomach' },

  // ── fat-soluble / need a meal to absorb ──
  { id: 'vitamin_d', label: 'vitamin D', keywords: ['vitamin d', 'vit d', 'vitamin d3', 'cholecalciferol', 'd3'], tip: 'Fat-soluble — take with a meal that has some fat.', tag: 'with food' },
  { id: 'vitamin_k', label: 'vitamin K2', keywords: ['vitamin k', 'vit k', 'k2', 'menaquinone', 'mk-7', 'mk7'], tip: 'Fat-soluble — take with a meal (great alongside vitamin D).', tag: 'with food' },
  { id: 'vitamin_a', label: 'vitamin A', keywords: ['vitamin a', 'retinol', 'retinyl'], tip: 'Fat-soluble — take with food.', tag: 'with food' },
  { id: 'vitamin_e', label: 'vitamin E', keywords: ['vitamin e', 'tocopherol'], tip: 'Fat-soluble — take with food.', tag: 'with food' },
  { id: 'omega3', label: 'omega-3 / fish oil', keywords: ['omega', 'fish oil', 'epa', 'dha', 'krill', 'cod liver'], tip: 'Take with a meal — cuts fishy burps and helps it absorb.', tag: 'with food' },
  { id: 'coq10', label: 'CoQ10', keywords: ['coq10', 'coenzyme q10', 'ubiquinol', 'ubiquinone'], tip: 'Fat-soluble — take with a meal that has fat.', tag: 'with food' },
  { id: 'curcumin', label: 'curcumin / turmeric', keywords: ['curcumin', 'turmeric'], tip: 'Take with food (and fat) — absorbs poorly on its own.', tag: 'with food' },
  { id: 'selenium', label: 'selenium', keywords: ['selenium', 'selenomethionine'], tip: 'Take with food to avoid stomach upset.', tag: 'with food' },
  { id: 'berberine', label: 'berberine', keywords: ['berberine'], tip: 'Take with meals — it acts on blood sugar around eating.', tag: 'with food' },
  { id: 'milk_thistle', label: 'milk thistle', keywords: ['milk thistle', 'silymarin', 'cardo mariano', 'cardo mariã­'], tip: 'Take with food.', tag: 'with food' },
  { id: 'enzymes', label: 'digestive enzymes', keywords: ['digestive enzyme', 'digest gold', 'enzima', 'enzyme', 'bromelain', 'lipase'], tip: 'Take right before or at the start of a meal.', tag: 'with food' },

  // ── energizing → morning ──
  { id: 'b_complex', label: 'B vitamins', keywords: ['b complex', 'b-complex', 'vitamin b', 'b12', 'b-12', 'methylcobalamin', 'b6', 'b1', 'thiamine', 'riboflavin', 'niacin'], tip: 'Energizing — take in the morning; late in the day it can disrupt sleep.', tag: 'morning' },
  { id: 'vitamin_c', label: 'vitamin C', keywords: ['vitamin c', 'vit c', 'ascorbic', 'ascorbate'], tip: 'Water-soluble, anytime — pairs well with iron to boost absorption.', tag: 'morning' },
  { id: 'rhodiola', label: 'rhodiola', keywords: ['rhodiola'], tip: 'Stimulating adaptogen — take in the morning, not at night.', tag: 'morning' },
  { id: 'tyrosine', label: 'L-tyrosine', keywords: ['tyrosine'], tip: 'Energizing — take in the morning on an empty stomach.', tag: 'morning' },

  // ── calming → night ──
  { id: 'magnesium', label: 'magnesium', keywords: ['magnesium', 'glycinate', 'threonate'], tip: 'Calming — most people take it in the evening.', tag: 'at night' },
  { id: 'glycine', label: 'glycine', keywords: ['glycine'], tip: 'Supports sleep — take in the evening.', tag: 'at night' },
  { id: 'melatonin', label: 'melatonin', keywords: ['melatonin'], tip: 'Take 30–60 min before bed, same time each night.', tag: 'at night' },
  { id: 'theanine', label: 'L-theanine', keywords: ['theanine'], tip: 'Calming — evening, or with coffee to smooth the jitters.', tag: 'at night' },
  { id: 'ashwagandha', label: 'ashwagandha', keywords: ['ashwagandha', 'ashwaganda', 'withania'], tip: 'Often taken in the evening to wind down (fine with food).', tag: 'at night' },
  { id: 'gaba', label: 'GABA', keywords: ['gaba'], tip: 'Calming — take in the evening.', tag: 'at night' },

  // ── minerals that compete (see conflicts) ──
  { id: 'calcium', label: 'calcium', keywords: ['calcium', 'cal-mag', 'calmag'], tip: 'Take with food, and keep it apart from iron, zinc, and thyroid meds.', tag: 'minerals' },
  { id: 'iron', label: 'iron', keywords: ['iron', 'ferrous', 'ferric', 'bisglycinate'], tip: 'Away from coffee, tea, and calcium; vitamin C helps it absorb.', tag: 'minerals' },
  { id: 'zinc', label: 'zinc', keywords: ['zinc'], tip: 'Take with food to avoid nausea; keep it apart from iron and calcium.', tag: 'minerals' },
  { id: 'copper', label: 'copper', keywords: ['copper'], tip: 'Space it from zinc — they compete.', tag: 'minerals' },

  // ── special cases ──
  { id: 'fiber', label: 'fiber / psyllium', keywords: ['fiber', 'fibre', 'psyllium', 'metamucil', 'glucomannan'], tip: 'Keep fiber apart from your other supplements and meds — it can bind them.', tag: 'space from others' },
  { id: 'biotin', label: 'biotin', keywords: ['biotin'], tip: 'Anytime — but pause it a few days before thyroid/hormone lab tests; it can skew results.', tag: 'anytime' },
  { id: 'creatine', label: 'creatine', keywords: ['creatine'], tip: "Timing barely matters — just take it consistently every day.", tag: 'anytime' },
  { id: 'collagen', label: 'collagen', keywords: ['collagen', 'colageno', 'peptides'], tip: 'Anytime — vitamin C helps your body use it.', tag: 'anytime' },
  { id: 'probiotic', label: 'probiotic', keywords: ['probiotic', 'lactobacillus', 'bifido', 'kefir', 'saccharomyces'], tip: 'Take at a consistent time each day.', tag: 'anytime' },
  { id: 'lions_mane', label: "lion's mane", keywords: ["lion's mane", 'lions mane', 'melena de le', 'hericium'], tip: 'Anytime that suits you — be consistent.', tag: 'anytime' },
  { id: 'caffeine', label: 'coffee / caffeine', keywords: ['coffee', 'caffeine', 'espresso'], tip: 'Keep it away from levothyroxine and iron.', tag: 'anytime' },
];

// Group order for the "how to time your stack" section.
export const TAG_ORDER = ['empty stomach', 'with food', 'morning', 'at night', 'minerals', 'space from others', 'anytime'];

// Each rule is a timing separation between two ingredients. `note` explains the
// WHY in one plain sentence (absorption competition) — never a directive beyond
// spacing.
// `anchor: 'a'` marks the item that should be isolated / taken first (e.g.
// levothyroxine on an empty stomach) — the other one is the one to move later.
// Rules without an anchor just need spacing at different meals.
export const RULES = [
  { a: 'levothyroxine', b: 'calcium',   sep: '4 hours',    anchor: 'a', note: 'Calcium binds levothyroxine and reduces its absorption.' },
  { a: 'levothyroxine', b: 'iron',      sep: '4 hours',    anchor: 'a', note: 'Iron binds levothyroxine and reduces its absorption.' },
  { a: 'levothyroxine', b: 'magnesium', sep: '4 hours',    anchor: 'a', note: 'Magnesium can reduce levothyroxine absorption.' },
  { a: 'levothyroxine', b: 'caffeine',  sep: '30–60 min',  anchor: 'a', note: 'Coffee can cut levothyroxine absorption — take it on an empty stomach first.' },
  { a: 'calcium',       b: 'iron',      sep: '2 hours',    note: 'Calcium and iron compete for absorption.' },
  { a: 'zinc',          b: 'iron',      sep: '2 hours',    note: 'Zinc and iron compete for absorption.' },
  { a: 'zinc',          b: 'calcium',   sep: '2 hours',    note: 'Calcium can reduce zinc absorption.' },
  { a: 'zinc',          b: 'copper',    sep: '2 hours',    note: 'Zinc and copper compete for absorption.' },
];

// The actionable coaching line — the differentiator. Turns "these conflict" into
// "here's what to do." Timing only (never dosage): move the non-anchor to a
// later meal, or space unanchored pairs across meals.
export function coachLine(item) {
  if (item.anchor === 'a' || item.anchor === 'b') {
    const anchorLabel = item.anchor === 'a' ? item.aLabel : item.bLabel;
    const moverLabel = item.anchor === 'a' ? item.bLabel : item.aLabel;
    if (anchorLabel === 'levothyroxine') {
      return `Take ${anchorLabel} first thing on an empty stomach, then keep ${moverLabel} to lunch or the evening — at least ${item.sep} later.`;
    }
    return `Take ${anchorLabel} on its own, and move ${moverLabel} at least ${item.sep} later.`;
  }
  return `Take them at different meals — at least ${item.sep} apart.`;
}

const norm = (s) => (s || '').toLowerCase();
const labelOf = (id) => INGREDIENTS.find((i) => i.id === id)?.label || id;

// Whole-word keyword match — so short keywords ("epa", "d3", "b1") don't match
// INSIDE unrelated words (e.g. "epa" in "tirzEPAtide"). Boundaries are non-letters.
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const hasKeyword = (name, keywords) => {
  const n = norm(name);
  return keywords.some((k) => new RegExp(`(^|[^a-z])${esc(k)}([^a-z]|$)`, 'i').test(n));
};

// Ingredient ids present in a free-text supplement name.
export function detectIngredients(name) {
  const ids = [];
  for (const ing of INGREDIENTS) {
    if (hasKeyword(name, ing.keywords)) ids.push(ing.id);
  }
  return ids;
}

// Per-supplement timing guidance across the WHOLE stack, grouped by tag (ordered
// by TAG_ORDER). Every recognized item contributes its tip — so a 30-item regimen
// gets rich, organized guidance ("take these 6 with food, these 3 at night"), not
// just the rare conflict. De-duped by ingredient.
export function timingTips(supps) {
  const byTag = {};
  for (const s of (supps || []).filter(isActiveSupp)) {
    // One tip per item — the first ingredient it matches (so a "D3 + K2" combo
    // gets a single, sensible line, not one per component).
    const ing = INGREDIENTS.find((i) => i.tip && hasKeyword(s.name, i.keywords));
    if (!ing) continue;
    (byTag[ing.tag] ||= []).push({ id: s.id, label: ing.label, suppName: s.name, tip: ing.tip });
  }
  return TAG_ORDER.filter((t) => byTag[t]).map((tag) => ({ tag, items: byTag[tag] }));
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
      anchor: rule.anchor || null,
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
