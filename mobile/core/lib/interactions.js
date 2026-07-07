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
  { id: 'alpha_lipoic', label: 'alpha-lipoic acid', keywords: ['alpha-lipoic', 'alpha lipoic', 'lipoic'], tip: 'Absorbs best on an empty stomach — ~30 min before food.', tag: 'empty stomach' },
  { id: 'ppi', label: 'acid reducer (PPI)', keywords: ['omeprazole', 'esomeprazole', 'pantoprazole', 'lansoprazole', 'prilosec', 'nexium'], tip: 'Take 30–60 min before your first meal of the day.', tag: 'empty stomach' },
  { id: 'uc2', label: 'UC-II collagen', keywords: ['uc-ii', 'uc ii', 'uc2', 'undenatured'], tip: 'Take on an empty stomach — many take it before bed; food can blunt it.', tag: 'empty stomach' },

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
  { id: 'enzymes', label: 'digestive enzymes', keywords: ['digestive enzyme', 'digest gold', 'enzima', 'enzimas', 'enzyme', 'enzymes', 'bio-gest', 'biogest', 'bromelain', 'lipase'], tip: 'Take right before or at the start of a meal.', tag: 'with food' },
  { id: 'multivitamin', label: 'multivitamin', keywords: ['multivitamin', 'multi vitamin', 'multi-vitamin', 'daily multi', 'one daily', 'centrum'], tip: 'Take with a meal — the fat-soluble vitamins in it need food.', tag: 'with food' },
  { id: 'astaxanthin', label: 'astaxanthin', keywords: ['astaxanthin'], tip: 'Fat-soluble — take with a meal that has fat.', tag: 'with food' },
  { id: 'lutein', label: 'lutein / zeaxanthin', keywords: ['lutein', 'zeaxanthin'], tip: 'Fat-soluble — take with food.', tag: 'with food' },
  { id: 'carotene', label: 'beta-carotene', keywords: ['carotene'], tip: 'Fat-soluble — take with food.', tag: 'with food' },
  { id: 'quercetin', label: 'quercetin', keywords: ['quercetin'], tip: 'Take with food; pairs with vitamin C.', tag: 'with food' },
  { id: 'resveratrol', label: 'resveratrol', keywords: ['resveratrol', 'pterostilbene'], tip: 'Fat-soluble — take with a meal that has fat.', tag: 'with food' },
  { id: 'glucosamine', label: 'glucosamine / MSM', keywords: ['glucosamine', 'chondroitin', 'msm'], tip: 'Take with food; be consistent for joints.', tag: 'with food' },
  { id: 'betaine_hcl', label: 'betaine HCl', keywords: ['betaine hcl', 'betaine hydrochloride'], tip: 'Take in the middle of a protein-containing meal.', tag: 'with food' },
  { id: 'saw_palmetto', label: 'saw palmetto', keywords: ['saw palmetto'], tip: 'Take with food to avoid stomach upset.', tag: 'with food' },
  { id: 'dhea', label: 'DHEA', keywords: ['dhea'], tip: 'Usually taken in the morning with food.', tag: 'with food' },
  { id: 'bacopa', label: 'bacopa', keywords: ['bacopa', 'brahmi'], tip: 'Take with food — it can upset an empty stomach.', tag: 'with food' },
  { id: 'metformin', label: 'metformin', keywords: ['metformin', 'glucophage'], tip: 'Take with meals to ease stomach upset.', tag: 'with food' },

  { id: 'allopurinol', label: 'allopurinol', keywords: ['allopurinol', 'alopurinol', 'alpurinol', 'alupurinol', 'alpurinon', 'zyloprim', 'zyloric'], tip: 'Take after a meal to ease stomach upset, with plenty of water.', tag: 'with food' },
  { id: 'apple_cider_vinegar', label: 'apple cider vinegar', keywords: ['apple cider vinegar', 'acv', 'vinagre de manzana'], tip: 'Dilute well in water and sip before a meal — never straight; it can harm teeth and throat.', tag: 'with food' },
  { id: 'caprylic', label: 'caprylic acid', keywords: ['caprylate', 'caprylic', 'caprilico'], tip: 'Take with meals.', tag: 'with food' },
  { id: 'isotretinoin', label: 'isotretinoin', keywords: ['isotretinoin', 'isotretinoina', 'isoface', 'accutane', 'roaccutane', 'absorica', 'claravis'], tip: 'Take with a meal that has fat — it needs dietary fat to absorb.', tag: 'with food' },
  { id: 'urolithin', label: 'urolithin A', keywords: ['urolithin', 'mitopure'], tip: 'Take with a meal.', tag: 'with food' },
  { id: 'polyphenol', label: 'polyphenols', keywords: ['polyphenol', 'polifenol'], tip: 'Take with food.', tag: 'with food' },
  { id: 'trace_minerals', label: 'trace minerals', keywords: ['trace mineral'], tip: 'Take with food.', tag: 'with food' },

  // ── energizing → morning ──
  { id: 'b_complex', label: 'B vitamins', keywords: ['b complex', 'b-complex', 'vitamin b', 'b12', 'b-12', 'methylcobalamin', 'methylcobalamina', 'metilcobalamina', 'cobalamina', 'b6', 'b1', 'thiamine', 'riboflavin', 'niacin'], tip: 'Energizing — take in the morning; late in the day it can disrupt sleep.', tag: 'morning' },
  { id: 'vitamin_c', label: 'vitamin C', keywords: ['vitamin c', 'vit c', 'vitamina c', 'ascorbic', 'ascorbico', 'ascorbate'], tip: 'Water-soluble, anytime — pairs well with iron to boost absorption.', tag: 'morning' },
  { id: 'rhodiola', label: 'rhodiola', keywords: ['rhodiola'], tip: 'Stimulating adaptogen — take in the morning, not at night.', tag: 'morning' },
  { id: 'tyrosine', label: 'L-tyrosine', keywords: ['tyrosine'], tip: 'Energizing — take in the morning on an empty stomach.', tag: 'morning' },
  { id: 'ginseng', label: 'ginseng', keywords: ['ginseng', 'panax', 'eleuthero'], tip: 'Energizing — take in the morning, not at night.', tag: 'morning' },
  { id: 'maca', label: 'maca', keywords: ['maca'], tip: 'Energizing — most take it in the morning.', tag: 'morning' },
  { id: 'cordyceps', label: 'cordyceps', keywords: ['cordyceps'], tip: 'Energizing mushroom — take earlier in the day.', tag: 'morning' },
  { id: 'alcar', label: 'acetyl-L-carnitine', keywords: ['carnitine', 'alcar'], tip: 'Energizing — take in the morning, away from meals.', tag: 'morning' },
  { id: 'choline', label: 'choline / alpha-GPC', keywords: ['alpha-gpc', 'alpha gpc', 'choline', 'citicoline', 'cdp-choline'], tip: 'Focus & energy — take earlier in the day.', tag: 'morning' },
  { id: 'nad', label: 'NMN / NR', keywords: ['nmn', 'nicotinamide riboside', 'nad+'], tip: 'Take in the morning — it can be mildly energizing.', tag: 'morning' },
  { id: 'sam_e', label: 'SAM-e', keywords: ['sam-e', 'ademetionine'], tip: 'Take in the morning on an empty stomach.', tag: 'morning' },

  { id: 'licorice', label: 'licorice root', keywords: ['licorice', 'liquorice', 'glycyrrhiza', 'regaliz', 'orozuz'], tip: 'Take earlier in the day.', tag: 'morning' },
  { id: 'methyl_guard', label: 'methylation support', keywords: ['methyl-guard', 'methyl guard', 'methyl gard', 'methyl gards', 'methylguard'], tip: 'Contains B vitamins — take earlier in the day.', tag: 'morning' },
  { id: 'methylene_blue', label: 'methylene blue', keywords: ['methylene blue', 'methylene', 'azul de metileno'], tip: 'Mildly energizing — take earlier in the day, not near bedtime.', tag: 'morning' },

  // ── calming → night ──
  { id: 'magnesium', label: 'magnesium', keywords: ['magnesium', 'magnesio', 'glycinate', 'glicinato', 'threonate', 'l-threonate', 'neuromag', 'magtein'], tip: 'Calming — most people take it in the evening.', tag: 'at night' },
  { id: 'glycine', label: 'glycine', keywords: ['glycine'], tip: 'Supports sleep — take in the evening.', tag: 'at night' },
  { id: 'melatonin', label: 'melatonin', keywords: ['melatonin'], tip: 'Take 30–60 min before bed, same time each night.', tag: 'at night' },
  { id: 'theanine', label: 'L-theanine', keywords: ['theanine'], tip: 'Calming — evening, or with coffee to smooth the jitters.', tag: 'at night' },
  { id: 'ashwagandha', label: 'ashwagandha', keywords: ['ashwagandha', 'ashwaganda', 'withania'], tip: 'Often taken in the evening to wind down (fine with food).', tag: 'at night' },
  { id: 'gaba', label: 'GABA', keywords: ['gaba'], tip: 'Calming — take in the evening.', tag: 'at night' },
  { id: 'five_htp', label: '5-HTP', keywords: ['5-htp', '5 htp', 'hydroxytryptophan'], tip: 'Take in the evening — supports sleep and mood.', tag: 'at night' },
  { id: 'tryptophan', label: 'L-tryptophan', keywords: ['tryptophan'], tip: 'Take in the evening.', tag: 'at night' },
  { id: 'valerian', label: 'valerian', keywords: ['valerian'], tip: 'Sedating — take shortly before bed.', tag: 'at night' },
  { id: 'calming_herbs', label: 'calming herbs', keywords: ['chamomile', 'passionflower', 'lemon balm', 'melissa'], tip: 'Calming — take in the evening.', tag: 'at night' },
  { id: 'inositol', label: 'inositol', keywords: ['inositol', 'myo-inositol', 'sensitol'], tip: 'Often taken in the evening for calm and sleep.', tag: 'at night' },
  { id: 'taurine', label: 'taurine', keywords: ['taurine'], tip: 'Calming — many take it in the evening.', tag: 'at night' },
  { id: 'progesterone', label: 'progesterone', keywords: ['progesterone', 'prometrium'], tip: 'Usually taken at bedtime — it can make you drowsy.', tag: 'at night' },

  // ── minerals that compete (see conflicts) ──
  { id: 'calcium', label: 'calcium', keywords: ['calcium', 'cal-mag', 'calmag'], tip: 'Take with food, and keep it apart from iron, zinc, and thyroid meds.', tag: 'minerals' },
  { id: 'iron', label: 'iron', keywords: ['iron', 'hierro', 'ferrous', 'ferric', 'ferrexel', 'bisglycinate'], tip: 'Away from coffee, tea, and calcium; vitamin C helps it absorb.', tag: 'minerals' },
  { id: 'zinc', label: 'zinc', keywords: ['zinc'], tip: 'Take with food to avoid nausea; keep it apart from iron and calcium.', tag: 'minerals' },
  { id: 'copper', label: 'copper', keywords: ['copper'], tip: 'Space it from zinc — they compete.', tag: 'minerals' },

  // ── special cases ──
  { id: 'fiber', label: 'fiber / psyllium', keywords: ['fiber', 'fibra', 'fibre', 'psyllium', 'metamucil', 'metamucill', 'glucomannan'], tip: 'Keep fiber apart from your other supplements and meds — it can bind them.', tag: 'space from others' },
  { id: 'charcoal', label: 'activated charcoal', keywords: ['activated charcoal', 'charcoal'], tip: 'Binds almost everything — keep it hours away from your supplements and meds.', tag: 'space from others' },
  { id: 'biotin', label: 'biotin', keywords: ['biotin'], tip: 'Anytime — but pause it a few days before thyroid/hormone lab tests; it can skew results.', tag: 'anytime' },
  { id: 'creatine', label: 'creatine', keywords: ['creatine'], tip: "Timing barely matters — just take it consistently every day.", tag: 'anytime' },
  { id: 'collagen', label: 'collagen', keywords: ['collagen', 'colageno', 'peptides'], tip: 'Anytime — vitamin C helps your body use it.', tag: 'anytime' },
  { id: 'probiotic', label: 'probiotic', keywords: ['probiotic', 'probiotico', 'lactobacillus', 'bifido', 'kefir', 'saccharomyces', 'akkermansia', 'metabolic daily', 'ultrabiotic', 'microbiot', 'microbiotfit'], tip: 'Take at a consistent time each day.', tag: 'anytime' },
  { id: 'lions_mane', label: "lion's mane", keywords: ["lion's mane", 'lions mane', 'melena de le', 'hericium'], tip: 'Anytime that suits you — be consistent.', tag: 'anytime' },
  { id: 'caffeine', label: 'coffee / caffeine', keywords: ['coffee', 'caffeine', 'espresso'], tip: 'Keep it away from levothyroxine and iron.', tag: 'anytime' },
  { id: 'nac', label: 'NAC', keywords: ['nac', 'n-acetyl', 'acetylcysteine'], tip: 'Anytime — some prefer it away from food.', tag: 'anytime' },
  { id: 'glutathione', label: 'glutathione', keywords: ['glutathione'], tip: 'Anytime — often taken on an empty stomach.', tag: 'anytime' },
  { id: 'glutamine', label: 'L-glutamine', keywords: ['glutamine'], tip: 'Anytime — often taken away from food for gut support.', tag: 'anytime' },
  { id: 'lysine', label: 'L-lysine', keywords: ['lysine'], tip: 'Take on an empty stomach for best absorption.', tag: 'anytime' },
  { id: 'beta_alanine', label: 'beta-alanine', keywords: ['beta-alanine', 'beta alanine'], tip: 'Anytime — split doses if the tingles bother you.', tag: 'anytime' },
  { id: 'citrulline', label: 'citrulline', keywords: ['citrulline'], tip: 'Take ~30–60 min before a workout, or anytime.', tag: 'anytime' },
  { id: 'bcaa', label: 'BCAAs / EAAs', keywords: ['bcaa', 'bcaas', 'eaa', 'eaas', 'branched-chain', 'branched chain'], tip: 'Around workouts, or anytime.', tag: 'anytime' },
  { id: 'hyaluronic', label: 'hyaluronic acid', keywords: ['hyaluronic'], tip: 'Anytime — be consistent.', tag: 'anytime' },
  { id: 'spermidine', label: 'spermidine', keywords: ['spermidine'], tip: 'Anytime — be consistent.', tag: 'anytime' },
  { id: 'pqq', label: 'PQQ', keywords: ['pqq'], tip: 'Anytime — often paired with CoQ10.', tag: 'anytime' },
  { id: 'reishi', label: 'reishi', keywords: ['reishi', 'ganoderma'], tip: 'Calming mushroom — many take it in the evening.', tag: 'anytime' },
  { id: 'ginkgo', label: 'ginkgo', keywords: ['ginkgo'], tip: 'Anytime — be consistent for cognitive support.', tag: 'anytime' },
  { id: 'saffron', label: 'saffron', keywords: ['saffron'], tip: 'Anytime — be consistent for mood support.', tag: 'anytime' },
  { id: 'holy_basil', label: 'holy basil / tulsi', keywords: ['holy basil', 'tulsi'], tip: 'Adaptogen — anytime, be consistent.', tag: 'anytime' },
  { id: 'dim', label: 'DIM', keywords: ['diindolylmethane', 'indole-3', 'dim'], tip: 'Take with food; supports estrogen balance.', tag: 'anytime' },
  { id: 'statin', label: 'statin', keywords: ['atorvastatin', 'rosuvastatin', 'simvastatin', 'lipitor', 'crestor'], tip: 'Take at the same time each day — some are best in the evening.', tag: 'anytime' },
  { id: 'glp1', label: 'GLP-1 (weekly)', keywords: ['semaglutide', 'tirzepatide', 'ozempic', 'wegovy', 'mounjaro', 'zepbound', 'rybelsus', 'retatrutide', 'reta'], tip: 'Weekly injection — take it on the same day each week.', tag: 'anytime' },
  { id: 'testosterone', label: 'testosterone', keywords: ['testosterone', 'trt', 'cypionate', 'enanthate'], tip: 'Follow your prescribed schedule and keep the timing consistent.', tag: 'anytime' },
  { id: 'estradiol', label: 'estradiol', keywords: ['estradiol', 'estrogen'], tip: 'Take at a consistent time each day.', tag: 'anytime' },
  { id: 'gabapentin', label: 'gabapentin', keywords: ['gabapentin', 'gabapentina', 'gabspentina', 'neurontin'], tip: 'Follow your prescribed schedule; it can be sedating, so many take a dose later in the day.', tag: 'anytime' },
  { id: 'dutasteride', label: 'dutasteride', keywords: ['dutasteride', 'avodart'], tip: 'Take at the same time each day, with or without food.', tag: 'anytime' },
  { id: 'telmisartan', label: 'telmisartan', keywords: ['telmisartan', 'micardis'], tip: 'Take at the same time each day.', tag: 'anytime' },
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
  { a: 'levothyroxine', b: 'fiber',     sep: '4 hours',    anchor: 'a', note: 'Fiber like psyllium can bind levothyroxine and reduce its absorption.' },
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

// Lowercase + strip accents, so Spanish / accented names match ASCII keywords
// (e.g. "Magnésio", "Melena de León", "Ácido ascórbico", "Alpuriñon").
const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const labelOf = (id) => INGREDIENTS.find((i) => i.id === id)?.label || id;

// Whole-word keyword match — so short keywords ("epa", "d3", "b1") don't match
// INSIDE unrelated words (e.g. "epa" in "tirzEPAtide"). Boundaries are non-letters.
// A trailing plural "s" is tolerated ("Enzymes"→"enzyme", "BCAAs"→"bcaa",
// "Trace Minerals"→"trace mineral") — it only affects the word END, so the
// "epa"/"tirzEPAtide" guard (a START boundary) is unaffected.
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const hasKeyword = (name, keywords) => {
  const n = norm(name);
  return keywords.some((k) => new RegExp(`(^|[^a-z])${esc(k)}s?([^a-z]|$)`, 'i').test(n));
};

// Ingredient ids present in a free-text supplement name.
export function detectIngredients(name) {
  const ids = [];
  for (const ing of INGREDIENTS) {
    if (hasKeyword(name, ing.keywords)) ids.push(ing.id);
  }
  return ids;
}

// Coarse timing character of each schedule slot — used to spot when an item is
// scheduled against its ideal (e.g. a "night" supp sitting in a morning slot).
const SLOT_TIMING = {
  rx: { food: false, tod: 'am' }, pre_breakfast: { food: false, tod: 'am' }, breakfast: { food: true, tod: 'am' },
  pre_lunch: { food: false, tod: 'mid' }, lunch: { food: true, tod: 'mid' },
  pre_dinner: { food: false, tod: 'pm' }, dinner: { food: true, tod: 'pm' }, after_dinner: { food: false, tod: 'night' },
  // intermittent-fasting slots (best-effort)
  wake: { food: false, tod: 'am' }, pre_meal_1: { food: false, tod: 'mid' }, meal_1: { food: true, tod: 'mid' },
  pre_meal_2: { food: false, tod: 'pm' }, meal_2: { food: true, tod: 'pm' },
  pre_meal_3: { food: false, tod: 'pm' }, meal_3: { food: true, tod: 'pm' }, evening: { food: false, tod: 'night' },
};

function slotOkFor(tag, k) {
  if (tag === 'with food') return k.food;
  if (tag === 'empty stomach') return !k.food;
  if (tag === 'at night') return k.tod === 'night' || k.tod === 'pm';
  if (tag === 'morning') return k.tod === 'am';
  return true; // minerals / space / anytime — no slot preference
}

// A short "move" suggestion if the item's scheduled slot(s) clash with its ideal
// timing; null otherwise. Anytime / unslotted items are never flagged.
function slotMove(supp, tag) {
  const kinds = (supp.slots || []).map((id) => SLOT_TIMING[id]).filter(Boolean);
  if (!kinds.length || kinds.some((k) => slotOkFor(tag, k))) return null;
  if (tag === 'with food') return 'you take it before eating — move it to a meal';
  if (tag === 'empty stomach') return 'you take it with a meal — move it away from food';
  if (tag === 'at night') return 'you take it in the morning — try the evening';
  if (tag === 'morning') return 'you take it in the evening — try the morning';
  return null;
}

// Per-supplement timing guidance across the WHOLE stack, grouped by tag (ordered
// by TAG_ORDER). Every recognized item contributes its tip — so a 30-item regimen
// gets rich, organized guidance ("take these 6 with food, these 3 at night") — and
// each item is checked against its scheduled slot for a personal "move" nudge.
export function timingTips(supps) {
  const byTag = {};
  for (const s of (supps || []).filter(isActiveSupp)) {
    // One tip per item — the first ingredient it matches (so a "D3 + K2" combo
    // gets a single, sensible line, not one per component).
    const ing = INGREDIENTS.find((i) => i.tip && hasKeyword(s.name, i.keywords));
    if (!ing) continue;
    (byTag[ing.tag] ||= []).push({ id: s.id, label: ing.label, suppName: s.name, tip: ing.tip, tag: ing.tag, move: slotMove(s, ing.tag) });
  }
  return TAG_ORDER.filter((t) => byTag[t]).map((tag) => ({ tag, items: byTag[tag] }));
}

// The subset of tips whose current slot clashes with their ideal timing — the
// actionable "worth moving" list, surfaced at the top of the view.
export function movers(supps) {
  return timingTips(supps).flatMap((g) => g.items).filter((i) => i.move);
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
