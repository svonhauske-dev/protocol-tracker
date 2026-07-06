# Origin — App Store Listing (Phase 5)

Copy-paste-ready App Store Connect metadata + a screenshot plan + the launch
checklist. Positioning: the **design-led** supplement & medication tracker for
people who run a real protocol (thyroid, hormones, optimizers) — the wedge vs.
the cluttered incumbents is (1) how it looks, (2) that it tracks **how you feel**,
not just what you take, and (3) timing guidance + shareable protocols.

**Category:** Health & Fitness (primary). **Age rating:** 12+ (health/medical references).

---

## App name  (30 char max)
**Recommended:** `Origin: Supplement Tracker`  *(26)*
Alternates: `Origin — Supplements & Meds` (27) · `Origin: Protocol Tracker` (24)

## Subtitle  (30 char max)
**Recommended:** `Supplements & how you feel`  *(26)*
Alternates: `Your protocol, beautifully run` (30) · `Track meds, supplements, mood` (29)

## Keywords  (100 char max · comma-separated · NO spaces · don't repeat name/subtitle words)
```
medication,reminder,vitamin,pill,dose,protocol,thyroid,routine,intake,stack,regimen,med,schedule
```
*(Apple indexes the name + subtitle separately, so those words are omitted here to
avoid waste. Swap in `levothyroxine`, `nootropic`, or `adherence` to test.)*

## Promotional text  (170 char max · editable anytime without review)
```
The supplement tracker that finally looks as considered as your protocol. Track what you take, log how you feel, and see what's actually working. 14-day free trial.
```

## Description  (4000 char max)
```
Origin is a supplement and medication tracker for people who take their protocol seriously — and want a tool that looks the part.

Most trackers are cluttered checklists. Origin is a calm, considered daily view: what to take, when, and whether it's working. Built for thyroid patients, people on hormones, and anyone optimizing a real regimen.

WHAT YOU CAN DO FREE
• Build your daily protocol — supplements, medications, doses, schedules
• A clean daily checklist with smart reminders
• Cascade, anchor, and meal-based timing
• Everything synced across your day

ORIGIN PRO
• Insights — see your adherence over time, and how energy, mood, and sleep track against what you're taking
• The daily check-in — log how you feel in seconds; watch the trend build
• Timing & interaction guidance — know what to space apart (e.g. levothyroxine and calcium)
• Refill & reorder reminders — never run out
• Protocol PDF — hand your doctor a clean, readable protocol
• Share protocols with anyone
• Intermittent-fasting & adaptive schedules
• Unlimited protocols and items
• Apple Health (coming soon)

WHY ORIGIN
It's the first supplement tracker that tracks the thing that matters — not just whether you took it, but whether it's working. And it's designed to be something you actually want to open every day.

Origin Pro is an auto-renewing subscription with a 14-day free trial. Monthly or annual. Cancel anytime.

Origin is a personal wellness tool, not a medical device, and does not provide medical advice. Always consult your doctor or pharmacist before changing what you take.

Terms: https://origin-protocol.vercel.app/terms.html
Privacy: https://origin-protocol.vercel.app/privacy.html
```

## What's New  (for v1.0.0)
```
Welcome to Origin. Build your protocol, track how you feel, and see what's working — beautifully.
```

---

## Screenshots  (6.7" 1290×2796 required · up to 10 · captions above each frame)
Shoot from the **App Review account** (clean, generic demo protocol — NO real
medical data, per the design-system rule). Suggested sequence (first 3 matter
most — they're what shows in search):

1. **Home / today** — caption: *"Your protocol, beautifully organized."*
2. **Insights · adherence** — *"See what you actually take."*
3. **Daily check-in** — *"Track how you feel, not just what you take."*
4. **Insights · outcomes trend** — *"Watch it work over time."*
5. **Insights · interactions** — *"Timing guidance, built in."*
6. **Protocol PDF** — *"Hand your doctor a clean protocol."*
7. *(optional)* **Onboarding / schedule** — *"Set it up once."*

Frame in your device mockup + the Terminal-Achromatic palette (canvas #0D0D0D,
white/green accents). Keep captions in Space Grotesk to match the brand.

---

## Launch checklist

**Blockers before submission (mostly your App Store Connect / RevenueCat work):**
- [ ] **RevenueCat + StoreKit** (Phase 4 remaining, task #18): create the RevenueCat project, set `RC_API_KEY_IOS` in `mobile/lib/pro.js`, create the two ASC subscription products (monthly $4.99 `…pro.monthly`, annual $29.99 `…pro.annual`, each with a 14-day free-trial intro offer), attach both to a `pro` entitlement + `default` offering, `npm i react-native-purchases`, native StoreKit config (bare workflow — see `lib/pro.js` notes), then a build. Sandbox-test purchase + restore.
- [ ] **Cut the submission build** — must include Phase 4 (paywall/gates/grants). The current TestFlight build (18) predates Phase 4.
- [ ] **App privacy "nutrition labels"** in ASC — declare: Email, Name, User ID (App Functionality); **Health data** (App Functionality); **Product Interaction / Analytics** (Analytics, via PostHog). The privacy manifest in `app.json` already lists these types.
- [ ] Legal links live: **Terms** `/terms.html` (NEW — created) + **Privacy** `/privacy.html` (updated for server push + analytics). Deploy the web app so both resolve.
- [ ] Paste the metadata above; upload screenshots.
- [ ] Review notes: demo account `appreview@abismo.design` (granted Pro so reviewers see all features) + a one-line "how to reach Pro features" note.

**Soft launch (after approval):**
- [ ] Release to a small cohort (not full public) — TestFlight external or a phased release.
- [ ] Watch the funnel in PostHog: install → onboarding complete → trial start → trial→paid → D7/D30 retention.
- [ ] Iterate the paywall + price on real numbers before scaling acquisition. Gate: trial→paid ≥ ~40% (category median) before spending on ads.

**Explicitly NOT now (Phase 6, post-launch):** barcode scan, Android, scaled product DB, referrals. Don't spend runway before conversion is proven.
```
