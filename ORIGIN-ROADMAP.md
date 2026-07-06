# Origin — Pre-Monetization & Launch Roadmap

*Goal: take Origin from "a great app" to "a sellable subscription business." A subscription lives or dies on three things — **activation** (people get their regimen in), **retention** (they open it daily for weeks), and the **machinery** to charge + measure. The **design already wins acquisition** (it's the download/listing magnet); these phases build the rest.*

**Guiding sequence:** measure → activate → retain → build Pro value → monetize → launch → scale. Each phase gates the next, so we never gamble on price before we know people activate and stay.

**Pricing target (from market research):** free download + freemium; **Origin Pro** at **$4.99/mo · $39.99/yr · $79 lifetime**, 7-day trial shown during onboarding. (Sources in the session brief; data strongly favors subscription over one-time for health apps.)

---

## Phase 1 — Measure & Activate
**Goal:** know the funnel, and let people get their *full* regimen in without friction.
**Why:** you can't improve what you can't measure; and setup friction is the #1 silent killer — people quit before they'd ever see a paywall.

**Build:**
- **Analytics / funnel instrumentation** — activation (regimen added), D1/D7/D30 retention, key events (add-item, check-off, reminder-enabled, protocol-created). Tool TBD (PostHog / Amplitude, or RevenueCat's built-in events later).
- **Faster add-item flow** (`components/EditForm.js`, `SupplementNameAutocomplete.js`, `data/supplements-database.js`):
  - Prefill dose / form / typical brand when a database item is picked (today autocomplete only fills the name).
  - "Add several" / quick-add a **common stack** (e.g. "starter thyroid stack", "IF basics").
  - Smarter search (fuzzy, categories).
- **Onboarding-to-aha** (`screens/Onboarding.js`) — trim the heavy step 2 so a new user reaches a *populated* home fast (audit flag).

**Decisions (Sofia):** analytics tool; which "common stacks" to seed.
**Gate to move on:** baseline activation + D7 retention captured; median setup time visibly down.

---

## Phase 2 — Retain (the outcomes loop)
**Goal:** a reason to open the app daily *beyond* ticking boxes.
**Why:** retention is everything for a subscription — this is what keeps someone paying in month 3, and it's your **Pro anchor**. For a thyroid/optimizer audience, symptoms are *how you dose*.

**Build:**
- **Daily "how do you feel" check-in** — energy / mood / sleep / custom symptoms (configurable), stored per day (extend `daily_logs` or a new `daily_checkins` table). New lightweight screen + a home entry point.
- **Outcomes ↔ regimen view** — plot how you feel against what you're taking / adherence.
- **History & trends** — adherence over time, per-supplement ("you miss evenings most"), beyond the current 7-day `WeekStrip`.

**Decisions:** which outcomes to track (fixed set vs custom); how much is free vs Pro.
**Gate:** measurable lift in D30 retention / daily opens.

---

## Phase 3 — Pro value (trust + differentiation)
**Goal:** features testers clearly say are worth ~$40/yr.

**Build:**
- **Interaction / timing guidance** — curated rules ("take levothyroxine 4h from calcium"). Framed as **timing guidance, not medical diagnosis** (liability line). Likely a curated rules table + a check at schedule/edit time.
- **Apple Health sync** — read/write relevant data; credibility + retention. (Native module → rides a build.)

**Decisions:** interaction-data source + scope (needs a liability read); Health data scope.
**Gate:** a Pro tier testers would pay for.

---

## Phase 4 — Monetization machinery
**Goal:** be able to charge, gate, and price.

**Build:**
- **RevenueCat (StoreKit)** — subscription products (mo/yr/lifetime) + 7-day trial. (Native → rides a build.)
- **Feature-gating** — a Pro context/hook; free vs Pro split:
  - **Free (habit loop):** daily checklist, basic reminders, ~1 protocol, ~10–15 items, one schedule mode.
  - **Pro:** unlimited protocols/items, refill/reorder push, PDF export, protocol sharing, advanced schedule modes (IF/adaptive), history/trends, outcomes insights, interaction guidance, Apple Health.
- **Onboarding trial paywall** — the highest-converting placement per the data.

**Decisions:** final free/Pro split; final prices; trial length.
**Gate:** paywall works end-to-end in TestFlight; purchase + restore tested.

---

## Phase 5 — Launch
**Goal:** turn it on, watch conversion, iterate.

**Do:**
- **App Store listing** — design-led screenshots (your edge vs the ugly incumbents), copy, keywords, subtitle.
- **Soft launch** to a small cohort; watch trial-start, trial→paid, early churn.
- **Iterate** paywall + pricing on real numbers.

**Gate:** healthy conversion (trial-start %, trial→paid ≥ category median ~40%) before scaling acquisition.

---

## Phase 6 — Scale (post-launch)
Barcode scan, product database at scale, **Android** (half the market), referral/community loops, deeper insights, clinician-facing features.

---

## Cross-cutting
- **Analytics runs through every phase** — instrument first, then every change is measurable.
- **Design is the acquisition wedge** — protect it; the listing + onboarding are conversion levers you already have an edge on.
- **What NOT to build pre-launch:** barcode, Android, scaled product DB — post-launch, once conversion is proven. Don't spend runway before you know people pay.

*Recommended start: **Phase 1** (analytics + activation) — it de-risks everything after by giving real numbers before we change the product or set a price.*
