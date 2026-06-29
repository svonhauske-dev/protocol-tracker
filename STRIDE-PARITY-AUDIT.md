# Stride × Origin Design Audit

> **Status:** Audit only — nothing changed in code. Drafted June 28, 2026.
> **Purpose:** Bring Origin to parity with the sharpened "Elevated Terminal" direction,
> using Stride's `../Running/DESIGN.md` as the *principles* lens and Sofia's own
> `terminal-elevated.html` prototype as the *target*.
> **Pick up here:** start at "Conflicts to resolve" (they gate everything), then work
> the ranked gap top-down.

---

## The key reframe

The `terminal-elevated.html` prototype (this branch, `terminal-elevated`) is Sofia's
interpretation of the direction, and it **deliberately diverges from a literal reading
of Stride** in three ways. This takes the most invasive findings *off the table by
choice*:

| Stride `DESIGN.md` says | `terminal-elevated.html` does | Verdict |
|---|---|---|
| §4.1 **No cards** → rules + ticks | Keeps elevated cards (`background:var(--card)` `#141414`, hairline border, radius 0) | **Kept — "Elevated" is the point.** Do NOT de-card. |
| §4.2 **No rings/gauges** → raw readouts | Keeps the ring motif (week + hero); comment: *"rings motif as the signature"* | **Kept as the signature.** Do NOT remove `AdherenceRing`. |
| §2 signal `#3BFD74` | Keeps `#5fe090`, *"the one signature color, live moments only"* | **Kept.** Do NOT adopt Stride's brighter green. |

Stride §1/§6 licenses this: *"apply principles, not pixels… domain components are
examples, not things to copy literally."* Origin took the **language** (voice, labels,
cursor, sharp-mono discipline) and rejected the **two most disruptive moves**
(de-card, de-ring). The real audit is therefore narrow: **current Origin app → the
prototype.** Mostly voice and polish, low risk.

---

## Where Origin already aligns (leave alone)

- **Sharp radius** — `radius.surface/button/badge: 0` enforced; zero rounded-surface smells in production. ✓ §4.4
- **Reserved color** — achromatic theme already does white=active, green=done-only. ✓ §4.3
- **No platform spinners** — no `ActivityIndicator` anywhere; loaders are custom. ✓ §4.5
- **Two type families, token scale, 8pt grid, 44pt targets** — enforced by the four prebuild scripts. ✓ §4.6/4.7
- **tabular-nums** — present, but only in 4 spots (see gap #4).

---

## The gap — ranked by payoff ÷ risk

### 1. Cursor primitive — the missing signature  `[new · low risk · high payoff]`
The prototype's blinking green block `▌` (after the username, in the hint line) is the
motion signature of the whole direction. **It does not exist anywhere in the app**
(only a `BlinkMacSystemFont` font-fallback match). Build a `Cursor` primitive; use it
in the header, loaders, and empty/hint lines. Stride §3/§4.5.
⚠️ Repeating blink → needs an explicit `prefers-reduced-motion` exception (hold static)
per CLAUDE.md's exception list + `index.html`.

### 2. Label voice / prompt markers  `[low risk]`
`src/components/Label.jsx` is a plain uppercase tracked label, no marker. Prototype
leads section labels with shell markers in a dimmer tone: `// PROTOCOL — 5 BLOCKS`,
`› STARTED AT`. Add an optional `marker` to `Label`; apply at Hero eyebrow,
`InsightsPanel` section label, `SlotCard`. Stride §4.5/4.9.

### 3. Shell-voiced empty/hint states  `[low risk]`
Current empties are calm but generic — `TodayPanel.jsx:101` "No supplements scheduled
for this day.", `ProtocolDetailScreen.jsx:398/463`, mobile `EmptyState`. Prototype
voice: `› tap a block to expand▌`. Rewrite to shell-prompt voice + cursor
(`$ <command>` style). Stride §4.5.
*(Mobile already has an `EmptyState` component — good base; web renders empties inline
with no primitive — candidate to extract.)*

### 4. tabular-nums everywhere  `[no risk · mechanical]`
Applied only in `SlotCard`, `Onboarding`, `ScheduleTab`. Prototype puts it on *every*
numeral. Missing on Hero %, `WeekStrip` day numbers, `AdherenceRing` %, `Badge` counts.
Cleanest fix: default it in the data/`Text` primitive.

### 5. Hero numeral scale-up  `[low-med risk · REVISIT ON RENDER]`
Prototype hero time is **48px Grotesk bold** vs current ceiling `display: 32`. "Data is
the hero" wants a bigger readout. Consider adding a `readout`/`metricXl` tier (Stride
§2). ⚠️ Decision: prototype keeps **Grotesk** for the hero number — a deliberate
divergence from Stride's "mono = data" rule.

### 6. Done-item + header polish  `[low risk]`
Strikethrough+dim on completed items (`.item.done` in prototype). Header avatar as a
sharp 1px mono box with the "origin center point" mark + green cursor + sharp
icon-buttons (bar-chart / plus).

### 7. DRY formatters  `[med · already on the backlog]`
4+ relative-date formatters reimplemented: `formatRelative` (PatientAnalyticsPanel:81),
`formatRelativeDate` (InsightsPanel:27), `formatLastLog` (App.jsx:145 **and**
PatientRoster:22), `formatWeekRange`, `shortDate`. Stride §3 wants one `lib/format`.
Already logged as open finding (G) in `ORIGIN-HANDOFF.md` — corroborated.

---

## Conflicts to resolve before any build

**A. Hairline contrast — the prototype breaks the deploy gate.** 🔴
Prototype `--line:#262626` on `#0d0d0d` is ≈1.3:1. `scripts/check-contrast.js:94`
enforces `border.subtle on canvas ≥ 3:1` and **blocks `prebuild` (every Vercel
deploy)**. Origin deliberately bumped subtle to `#606060` (3.12:1) for exactly this
reason. Can't ship the prototype's hairlines *and* the gate as-is. Pick: keep visible
WCAG-passing lines, or relax the gate (push back — it exists because this exact value
shipped invisible once).

**B. Confirm the three "kept" divergences** are intentional (cards, rings, `#5fe090`).
Read as deliberate from the prototype + branch name, but it's the single biggest fork —
if wrong, the audit inverts.

**C. Hero numeral font** — Grotesk (prototype) or mono (literal Stride)?

---

## Scope question (no default — decide first)

Tokens live web-side (`src/design-system.js`); `mobile/theme.js` re-exports them, so any
token change originates in web and flows to RN. The prototype is a phone screen, mapping
to both the web mobile-layout and the native app.
**Decide:** target the web app (`src/`), the React Native app (`mobile/`), or both?

---

## Suggested phasing (once A–C + scope are decided)

1. Contrast-policy decision (gates all token work).
2. `Cursor` primitive (+ reduced-motion exception).
3. `Label` marker/voice.
4. Shell-voiced empty/hint states.
5. tabular-nums sweep.
6. Hero numeral scale-up (REVISIT ON RENDER).
7. Done-item + header polish.
8. `lib/format` DRY consolidation.

---

## Reference files

- Stride language: `../Running/DESIGN.md`
- Target prototype: `terminal-elevated.html` (repo root, this branch)
- Web tokens: `src/design-system.js` (theme block ~line 158+)
- RN tokens: `mobile/theme.js` (re-exports web)
- Contrast gate: `scripts/check-contrast.js`
- Label primitive: `src/components/Label.jsx` · mobile `mobile/components/Label.js`
- Rings: `src/components/AdherenceRing.jsx` · `mobile/components/AdherenceRing.js`

---

# SETTINGS — focused audit + plan  (added June 29, 2026)

> Sofia flagged Stride's **Settings** (`IMG_3602`) as the screen with the most
> transferable design language. This section extends the audit above — which only
> reached the Today/home screen — to Settings specifically.

## Locked decisions (June 29)
- **Scope: mobile only** (`mobile/`). The native App-Store app. Web `src/` untouched.
- **Hairlines: add a whisper `border.divider`** token for separator rules.
  ⚠️ Per `mobile/theme.js`'s hard rule the web file is NEVER edited — so add the token
  as a **spread override in `mobile/theme.js`**, NOT in `src/design-system.js`:
  `theme = { ...themes.achromatic, border: { ...border, divider: '#2A2A2A' } }`.
  Keeps it mobile-scoped AND invisible to `check-contrast.js` (web-side gate). Decorative
  rules aren't interactive component edges, so WCAG 1.4.11's 3:1 floor doesn't govern them.
- **Title: keep the left back-chevron** (current Origin slide-over model; no centered title).

## The grammar Stride's Settings uses (the transferable part)
1. **Section header = tracked dim label + full-width hairline rule directly beneath** — the
   #1 signature. Origin uses a bare `<Heading visual="label">` with the divider floating
   *between* sections instead.
2. Setting **row = label-left / control-right**, value right-aligned + tabular-nums.
3. **Inline editable numeric** = large bold right value with an underline baseline.
4. **Stepper** = three sharp hairline boxes `[ − ] n [ + ]`.
5. **Segmented control** = sharp bordered boxes, selected = inverted white-on-dark fill.
6. **Ghost full-width button** (outline, tracked uppercase).
7. **Action-as-value** = a tappable affordance sitting in the value slot (`TAP TO SCAN`).

## Mobile plan — ranked by payoff ÷ risk
1. **`border.divider` token** — spread override in `mobile/theme.js` (gates the rule work).
2. **`SectionHeader` mobile component** `[low risk · highest payoff]` — tracked label +
   optional `//` marker + hairline rule beneath (uses `border.divider`). Replace every
   `<Heading level={2} visual="label">` in `mobile/screens/SettingsScreen.js` + rework the
   floating `<Divider>` so the rule sits under the label, not between groups.
3. **`SettingRow` convention** `[low risk]` — `mobile/components/Row.js` already does
   left/right + the reminders row already uses value-right. Formalize a right-aligned
   value (`text.secondary`, tabular-nums) so Schedule/Account/About rows read consistently.
4. **`Stepper` mobile primitive** `[low risk]` — sharp hairline boxes; pays off in
   `mobile/screens/ScheduleTab.js` (counts/offsets) as well as Settings.
5. **Segmented-control audit** `[low risk]` — confirm mobile `Button` selector =
   sharp box + inverted-fill-when-selected (likely small reconciliation, not new code).
6. **`Input variant="inline"`** `[low-med · REVISIT ON RENDER]` — right-aligned baseline
   underline for Account name/email; keep boxed variant for Auth/Onboarding.
7. **`Label` `marker` prop + tabular-nums sweep** `[mechanical]` — shared with the Today
   audit's gaps #2/#4; do once, both screens benefit.

## Reference files (mobile)
- `mobile/screens/SettingsScreen.js` · `mobile/screens/ScheduleTab.js`
- `mobile/theme.js` (divider override goes here) · `mobile/components/{Row,Label,Input,Button}.js`
- Registry / enforcement scripts are web-only — mobile components aren't gated by them.
