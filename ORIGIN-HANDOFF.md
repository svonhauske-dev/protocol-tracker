# Origin — Project Handoff Document

*Last updated: July 6, 2026 — **Business roadmap (`ORIGIN-ROADMAP.md`) + Phase 1 (analytics wrapper → PostHog, bulk-add — activate next build) + Phase 2 outcomes/retention loop SHIPPED: daily energy/mood/sleep check-in (`daily_checkins` table + `CheckinSheet` + home `// how you feel` card) and a Trends screen (30-day adherence bars + outcomes sparklines + per-slot/per-supp breakdown, via new Activity top-bar icon) — both sim-verified, commits `8c078ca`/`e49a961` on main. Build 16 → TestFlight. **Phase 3 also shipped:** timing-interaction guidance (curated timing-SEPARATION-only rules — `core/lib/interactions.js`; edit-time `// timing note` + a Shield-icon Interactions view; heavy 'not medical advice' framing; sim-verified on the real levothyroxine+magnesium pair) and a guarded Apple Health scaffold (`lib/health.js` — variable-require no-op until a dedicated build; Settings row hidden until then). Commits `902f78e`/`5fe320a`. RECOMMENDED: build 17 = the sim-verified JS work (Phase 1/2/3-interactions); Apple Health rides its own build 18. See "Session of July 6 (cont.)". — Earlier July 6:** Refill/supply tracking (Phase 1 in-app count + amber low alert; Phase 2 server-side "reorder" push at 9am local, deduped per fill cycle — no build needed, purely backend); structured Dose = amount + form chips (pill/tablet/capsule/mL/other), strength → notes, display pluralized; keyboard field-tap jump fixed (was scrollToEnd on the name autocomplete); debugger warnings cleaned (LogBox); dose-pluralize DB migration run. Notifications confirmed WORKING on-device (test push delivered). All on `terminal-elevated`, merged to main this session. See "Session of July 6". — Prior (July 5):** Notifications re-architected to SERVER PUSH for mobile (Expo/APNs); keyboard-aware modal scroll (fixes top-field-hidden in every form); protocol PDF rebuilt to match the web artifact + in-app WebView preview → share with a proper filename; build 14 submitted to TestFlight; demo account for App Review. See "Session of July 5" for detail. — Prior session (June 30):** Icon/splash unified to one 3-ring mark; splash = rings all the way to home; onboarding rebuilt as a 3-step wizard reusing ScheduleTab; schedule versioning (`slot_history`) shipped + migrated; confirm-modal buttons fixed to 50/50; Settings about-footer. See "Session of June 29–30" for detail. — Earlier:** "Elevated Terminal" reskin of the mobile app (`mobile/`) + two features (peer-to-peer protocol send/receive, PDF share). MOBILE-ONLY; the web `src/` and shared `api.js` were NOT edited (hard rule kept).** Established a single surface SPINE measured against the home screen: lines on the canvas, NO grey fills (surfaces are transparent + 1px hairline; lists use left STATUS GUTTERS — white=now, green=done, amber=late, dim=future — separated by `border.divider` hairlines); DATA is oversized mono, PROSE is Grotesk; color rationed (white=live/active, **green `#5FE090` = done only**, amber=late); section headers carry a `// ` marker + rule; lowercase terse shell-voice copy (`$ no items yet ▌`, `// tip`, `+ add item`, toasts `✓ added · …`); one motion signature — the **hard blinking cursor** (530ms). **New primitives** (`mobile/components/`): `Cursor` (blink, reduced-motion→static), `Meter` (block-fill, REPLACED `AdherenceRing` in Hero + WeekStrip; AdherenceRing deleted), `SectionHeader` (`//`+rule), `InlineTip` (one-time, persisted in `global.localStorage` `origin.tip.<id>`), `Stepper` (`[−] n [+]` — BUILT but NOT yet wired into ScheduleTab; dual hr/min layout needs an on-device check). **New tokens** (`mobile/theme.js` ONLY, so web's contrast gate never sees them): `border.divider #2A2A2A` (whisper, decorative — WCAG 3:1 governs interactive edges, not separator rules), `typography.readout 44`, `motion`. **Reskinned primitives:** Input/Card(default)/Modal → transparent + hairline + sharp (Modal: canvas sheet, sharp top, hairline rule, sharp handle); `InlineLoader` → braille CLI spinner; `Loader` → terminal boot (`$ origin ▌` + block bar); `Toast` → rises from BOTTOM as stdout w/ tone glyph (`✓ ✗ ! ›`). **Home:** Hero readout = oversized tabular mono (data is hero; **completed-day fix** — readout reserved for data/time, completion shown by the green 100% meter, never a word at numeral size, fixed 3 divergent completed treatments); de-carded `SlotCard` (left status gutter, no fill) with hairline dividers between items; `WeekStrip` block meters + STABLE selection (constant border, no scale/shadow — fixed the week-nav size jump) + tightened cell height; SQUARE avatar w/ origin center-point dot; blinking cursor in header; shell-voiced empty state. **Screens swept to the bar:** Settings (SectionHeader, segmented On/Off reminders, state-reporting nav rows), Auth + Onboarding (lowercase shell copy + blinking cursor on identity titles), ScheduleTab (SectionHeader on all 10 sections + lowercase copy), EditForm/ProtocolDetail/ProtocolLibrary (lowercase shell copy; empty states → `// eyebrow` + `$ line ▌`). **Feature 1 — P2P send/receive:** backend already existed and is reachable from mobile via the `shared` symlink (`protocol_sends` table; `dbSendProtocol`/`dbLookupUserByEmail`/`dbGetReceivedProtocols`/`dbUpdateProtocolSend`/`dbNotifyProtocolSent`) — this was a UI-only port. Detail ⋯ → "send to a person" (email lookup → send + push); Library gained a "Received" section + review modal (add-on-top / replace / save-for-later / decline, porting web's `activateReceived` incl. replace-archives-actives + partial-write rollback); first-received tip now has a home. Handlers (`sendProtocolToUser`/`activateReceived`/`declineReceived`) live in `Today.js`. **Feature 2 — PDF:** `expo-print` + `expo-sharing` installed + **native rebuild done** (`npx expo run:ios`, 0 errors); `mobile/lib/protocolPdf.js` generates a terminal-styled PDF and opens the iOS share sheet (lazy-imported so the app bundles on older binaries). **Tips ported to iOS** (were web-only): Day-1 schedule tip (empty state) + take-all hint (above slot list) + first-received. **VERIFICATION GAP (important):** only the HOME screen was eyeballed on the simulator (the agent env has no tap tooling and the app boots to home) — modals, forms, ScheduleTab, Auth, Onboarding, the P2P send/receive flow, and the PDF share sheet are CODE-CONFIDENT (bundle clean throughout) but NOT yet visually verified. **Branch `terminal-elevated`, NOT merged to main.** Commits: `8a82263` (design system), `544d8e7` (screens), `4c2762f` (pdf/native). **Pending (Sofia):** (1) on-device pass — wire `Stepper` into ScheduleTab (verify dual hr/min layout live), eyeball modals/forms/ScheduleTab/Auth/Onboarding/send-receive/PDF; (2) confirm the cursor is intentionally WHITE not green (green is reserved for done-only — a green cursor would break that rule); (3) cosmetic leftovers — `TabBar`/`ProtocolRow` Title-case labels ("Active"/"Saved"), Settings Account a few Title-case strings, optional dim gutter on Detail supp rows; (4) merge to main when satisfied. Audit docs: `STRIDE-PARITY-AUDIT.md` (Settings + parity rubric), `terminal-elevated.html` (target prototype).***

*June 29, 2026 (cont.) — **Parity pass against the home screen + DE-COUPLED mobile from the web codebase.** Same session as the entry above; this supersedes two of its points. **(1) Title parity:** card/row titles were rendering in MONO on ScheduleTab mode cards, ProtocolLibrary protocol + received rows, and Onboarding mode cards — but home reserves mono for data/metadata and uses **Grotesk for card/slot titles** (which stay Title-Case). Switched all to `Heading visual="title" font="heading"`. **(2) Stepper WIRED** (was "built, not wired"): `NumberCard` in ScheduleTab now renders `[− n +]` steppers instead of raw number inputs — single value inline (label-left), dual hr/min stacked under the label so the wider controls fit. Dropped the now-unused `Input` import there. **(3) WeekStrip + Hero polish:** fixed the week-nav cell size-jump (constant border width, no scale/shadow on selected) + tightened the meter cell; Hero completed-day treatment finalized (readout reserved for data, green meter = done, no word at numeral size). **(4) Avatar:** REMOVED the bottom-right "origin center-point" dot (the earlier entry's "SQUARE avatar w/ origin center-point dot") — on device it read as a stray circle; it's a clean square box now. **(5) DE-COUPLE (the big one):** mobile was importing 7 modules from the LIVE web app through a `shared` symlink → `../src` (`config`, `design-system`, `lib/{time,api,notifications,adherence}`, `data/supplements-database`), so deleting web would break the mobile build. Forked them verbatim into **`mobile/core/`**, repointed the babel `shared` alias → `./core`, removed the symlink, and cleaned `api.js`'s Vite `import.meta.env.DEV` → `__DEV__` (kept the babel import-meta shim as a defensive net). **Verified: app boots + runs entirely from `core/` on the simulator; `../src` untouched, web still serving.** `mobile/core/` is now the SOURCE OF TRUTH for that logic — no more web↔mobile sync, and the "never edit web" constraint is gone for these modules. **(6)** With `config.js` now mobile-owned, lowercased the Schedule **mode descriptions** (`DISPLAY_MODES` descs) + **anchor notes** (`ANCHOR_NOTES`) to match home's mono sub-text voice; mode TITLES + slot labels (`MODES`) left Title-Case. **KILLING THE WEB APP — guidance:** "web" = the FRONTEND only (`src/`, the Vercel project, `/design-system`, the four prebuild enforcement scripts) — safe to delete whenever; mobile no longer depends on it. **The Supabase backend + `supabase/functions/*` (recompute_notifications, delete_account, notify_protocol_sent, process_notifications_queue) MUST STAY — mobile uses them for auth, data, and push.** **Commits (branch `terminal-elevated`, after the entry above):** `a0a96e4` (titles→Grotesk), `864a910` (Stepper wired), `e73ec3f` (fork → `mobile/core`), `673ef4c` (config lowercase), + avatar-dot removal & this handoff. **Cursor stays WHITE** (Sofia confirmed — green is done-only). **VERIFICATION GAP unchanged:** only home + the de-couple were eyeballed on the sim (no tap tooling; app boots to home) — modals, forms, ScheduleTab, Auth, Onboarding, P2P send/receive, and the PDF share sheet are bundle-clean + code-confident but NOT visually verified. **Pending (Sofia):** on-device pass of those screens (esp. ScheduleTab dual hr/min steppers); cosmetic leftovers (`TabBar`/`ProtocolRow` "Active"/"Saved" Title-case, Settings "Sign out" Title-case); merge `terminal-elevated` → main; then the web frontend can be deleted independently.***

*Earlier: June 26, 2026 — **iOS App Store prep — full HIG/App-Store audit + two TestFlight builds (10, 11) carrying the fixes.** The Expo SDK 54 / RN 0.81 mobile app (`mobile/`, native RN views, shares `../src` pure-JS logic via the `shared` symlink) went through a structured Apple-readiness audit (ground-truth → layout → touch/input → legibility → accessibility → review-risk), HIG verified against live docs. Big review items are LOW risk: it's native (not a web-shell → 4.2 fine) and the "terminal" aesthetic is purely visual (no code execution → 2.5.2 N/A). **Two real rejection risks found + fixed:** (1) **Account deletion** (Guideline 5.1.1(v)) — new `supabase/functions/delete_account` Edge Function (service-role deletes the caller's rows across daily_logs / supplements / protocols / user_schedule / user_supplement_history / push_subscriptions / user_profiles, then `auth.admin.deleteUser`; the id comes from the verified JWT, never the request body; `verify_jwt=false`, validates internally like `recompute_notifications`; **deployed + smoke-tested** 204 OPTIONS / 401 no-auth). Client helper `mobile/lib/account.js` carries its own copy of the public `SUPA_URL`/anon key (the read-only web `api.js` doesn't export them). Destructive "Delete account" flow + confirm modal in Settings → Account. (2) **Privacy policy** link in Settings → About → `origin-protocol.vercel.app/privacy.html` (5.1.1(i)). **Accessibility floor closed without touching the aesthetic:** Dynamic Type was globally disabled (`allowFontScaling={false}` everywhere) → switched the text primitives (Text / Heading / Label / HelperText / Button / Input) + ProtocolDetailScreen inline text to `allowFontScaling maxFontSizeMultiplier={1.4}` (capped so the mono grid survives; compact numerics — WeekStrip / AdherenceRing / Badge — intentionally left fixed, flagged for a rendered check). Reduce Motion was unhonored → new `mobile/lib/useReduceMotion.js` hook; InlineLoader stops looping (static rings + dot) and SlideScreen / Modal / Toast cross-fade instead of sliding when the iOS setting is on (everyone else keeps the normal transitions). VoiceOver: fixed an `accessibilitylabel` casing typo that silently dropped the SlotCard edit label, added the missing pinned-pencil label, hid decorative graphics (StatusDot / CategoryIcon / OriginGlyph) and made AnimatedSplash announce "Loading Origin". Tap targets (Hero "edit", "log at…" pills) bumped toward 44pt via hitSlop. Settings Account/Schedule sub-views wrapped in `KeyboardAvoidingView`. Export compliance: `ITSAppUsesNonExemptEncryption=false` (Info.plist + app.json) to stop the recurring TestFlight prompt. **Also fixed (real-use bugs Sofia hit on device):** Library→protocol tap did nothing (3 sibling `SlideScreen` overlays all shared `zIndex:500` → Detail painted BEHIND Library; gave SlideScreen a configurable zIndex, Detail=600); Settings sub-pages didn't slide (instant content swap → now SlideScreen layers); pinned/specific-time pill cards rendered the name full-white regardless of state (now follows the state rules — `text.secondary` when future, `text.primary` at now/missed; **diverges from web by design**, web left untouched); long notes overlapped the "log at…" button (dose·notes now flexShrink + `numberOfLines={1}` truncate, button flexShrink:0); offline showed a blank app (new `mobile/lib/cache.js` read-through snapshot hydrates protocols/schedule on cold/offline launch via `Today.loadStatic`, refreshes from network); app icon looked pixelated (thin ~2.5px ring strokes → regenerated icon/splash/adaptive PNGs at ~3.3× stroke weight + lifted opacity, verified smooth at 120px). **Builds:** 10 (z-index / settings-slide / pill-color / offline / icon) submitted to TestFlight + in Beta App Review; 11 (everything above) building + auto-submitting (EAS `autoIncrement` 10→11; `ascAppId` 6784084989 added to `eas.json` so auto-submit works). **Hard rule kept:** the web app (`../src`) and shared `api.js` were NOT edited. **Pending (Sofia):** (1) test account deletion with a throwaway account on build 11, (2) eyeball Dynamic Type at 1.4× + Reduce Motion on-device, (3) submit **build 11** (not 10) for external Beta App Review (remove build 10 from the slot first; once any 1.0.0 build is approved, later builds skip re-review). Minor open: align Info.plist deployment target (12.0 vs 15.1, cosmetic), add in-app-deletion mention to the privacy-policy copy.***

*Earlier: June 23, 2026 — **Pinned-time supplements shipped — an anytime supp can carry a fixed clock time, independent of the cascade.** Built for the real case of a daily-fixed med (birth control at 19:00) that must NOT drift when the anchor moves or adaptive timing re-flows the day. **Design decision (with Sofia):** the feature lives on the existing `anytime` bucket rather than as a new mode or slot — anytime supps already sit outside the cascade (empty `slots` → no offset → invisible to `computeAdaptiveDelta`, mode-independent, own `${dk}_anytime_${suppId}` check namespace), so the only things they lacked were a time and a reminder. Adding optional `pinned_time` gives them both with zero new cascade math. **Data model:** one additive nullable column `supplements.pinned_time text` ("HH:MM"). Only meaningful when `slots` is empty; `submitForm` nulls it defensively if the supp has cascade slots, and `EditForm.toggleSlot` clears it when a slot is added. **Editor (`EditForm.jsx`):** a "Specific time (optional)" `<Input type="time">` appears under the Anytime button only when no slot is selected. **Display (`App.jsx`):** `anytimeSupps` splits into `pinnedSupps` (rendered as their own single-item `SlotCard`s with a real time label + past/now/future status, via new `renderPinnedCard`) and `untimedSupps` (the existing "Anytime · No specific time" card, label now honest). Pinned cards interleave into the day by clock time — they slot in before the first cascade slot whose time is later (new `mergedCards` merge loop; the cascade `.map` was extracted to `renderSlotCard`). Zero pinned supps → byte-identical ordering to before. In No Schedule mode (no slot times) pinned cards append after the timeless checklist — **this is the only path that shows a timed item to a checklist-only user.** Daily totals/adherence unchanged (both still count the full `anytimeSupps` list via the `anytime` key). Pinned cards render via a new `single` mode on `SlotCard` (no group/expand affordance — a standalone item shouldn't borrow the collapsible-slot UI): the supp shows flat in one row (checkbox + name + dose) with time + status badge on the right, name appearing exactly once. `single` mode shares the cascade card's container + status (`sc`) styling so it sits as a visual peer, just without the chevron — which also correctly signals "fixed standalone reminder," not "slot that groups items." Registered with two examples (now/done) on the design-system page. **Notifications (`supabase/functions/_shared/recompute_user_logic.ts`):** added `dose, pinned_time` to the supps select; a new emission block at the top of the day loop fires a row per pinned supp at its absolute time on every active day, in ANY mode, keyed `pinned_${supp.id}` (sw.js branches on `data.type` not `slot_id`, so the synthetic id is safe; verified during the IF v2 work). The `mode === "none"` early-exit now only short-circuits when there are NO pinned supps (`hasPinned`), so a No-Schedule user with a pinned reminder still gets a recompute. Rows participate in the existing 48h delete+reinsert. **Finding A deliberately NOT bundled** — folding the persist-then-recompute fix into this PR would muddy the live notification test; Sofia confirmed reminders are working, so it stays a separate fix in the queue. **Migration:** `supabase/add-pinned-time.sql` → `ALTER TABLE public.supplements ADD COLUMN IF NOT EXISTS pinned_time text;`. **Shipped live June 23 (all done this session):** migration ran via Supabase CLI against the linked prod DB (`supabase db query --linked -f`) and verified (`supplements.pinned_time text`, nullable); `recompute_notifications` edge function redeployed (the only function bundling the updated `_shared/recompute_user_logic.ts`); frontend deployed via `main` — `803e372` (data + display + server emission) and `2c5eb3a` (flat single-card render). Migration ran BEFORE both deploys, so no save ever hit a missing column. Build + all four enforcement checks clean throughout. **Pending: Sofia's real-use feel test only.** Sofia reviewed the flat single-card render and approved it ("looks good, keep as is"); two questions she'll judge in use, not blockers: (1) does the flat card sit coherently next to the expandable cascade cards, (2) is the now/late status badge on a single fixed item useful signal or noise. Both are easy adjustments if real use says so.***

*Earlier: June 15, 2026 (evening) — **Full-stack audit + safe cleanup pass.** Ran a four-dimension read-only audit (dead code, correctness bugs, performance, duplication) across the whole tree, then shipped only the behavior-preserving fixes (commit `0574cf5`); behavioral/notification-path findings are staged below for live testing rather than shipped blind. **Shipped:** (1) **Data-loss fix** — `saveSchedule`'s "don't wipe logged checks when switching to flexible anchor" guard read `checked[dk]`, but `checked` is a FLAT map keyed `${dk}_${slot}_${suppId}` (no `[dk]` sub-object), so the guard was always false and every flexible switch on today wiped that day's logged checks + pill_time. Now scans flat keys for the day, honoring both value shapes (`true` / `{checked,at}`). (2) Removed dead exports `dbGetAdherenceCounts` + `dbGetPatientLog` (api.js, zero refs). (3) Dropped the unused `token` param from `recomputeNotifications` + 6 call sites (already ignored; was a trap inviting a re-thread of the stale token that caused the Jun 3 CORS-adjacent bug). (4) Deduped `CORE_SLOTS` — App.jsx imported from config.js instead of a byte-identical local copy. (5) De-Tethered `sw.js` comment + `config.toml` project_id (hard-rule violation). **Open findings — NOT yet fixed (tracked queue, in priority order):** **(A) Flexible-IF recompute race [bug]** — `openEatingWindow`/`closeEatingWindow` (App.jsx ~968-978) call `recomputeNotifications()` *before* the 200ms autosave persists the eating-window time, and `shouldReflow` (line 908) is false for fasting mode so the autosave never re-recomputes → meal/close reminders anchor off the stale/empty window until the 4h cron corrects. `setPillForDay` (line ~960) has the same shape for medication/wakeup "start my day". Fix: persist-then-recompute (mirror the day-switch flush at line 893). Needs a live test on a fasting + a medication schedule. **(B) Streak shows 0 every morning [bug/UX]** — the inline streak effect (App.jsx 920-937) starts counting at TODAY and breaks if today isn't fully logged yet, so a real multi-day streak reads 0 until the day is complete. The library `calculateCurrentStreak` (adherence.js:43) already steps back to yesterday first (correct). Decide the intended semantics, then wire up the library version (also kills a duplicate impl) — display-only, but verify on-device. **(C) Server recompute pause divergence [latent]** — `recompute_user_logic.ts` excludes paused supps via `status='active'` filter, NOT `pause_intervals` like the client. Fully-paused supps are correctly excluded, so no active leak, but the two halves use different mechanisms; port `pause_intervals` to `helpers.ts` for one source of truth. Edge-function redeploy required. **(D) Orphaned server fasting branch [dead code]** — `helpers.ts:231-263` `deriveOffsets` still computes legacy fasting offsets; client returns `null` for fasting (IF-v2 absolute-time rewrite). Confirm `recompute_notifications` routes IF through `computeIFSlotTimesHHMM`, then delete. Edge-function redeploy required. **(E) Performance [non-urgent]** — `homeSupps` + a `suppsBySlot` map should be `useMemo`'d (re-filtered ~3×/slot/render on the toggle hot path); `activeSlotIds={new Set(coreSlotIds)}` passed fresh each render to WeekStrip/InsightsPanel invalidates their internal memos every render; no `React.memo` anywhere. Real but low-urgency for a single-user app; touches App.jsx's hot render path so wants care. **(F) Structure [refactor]** — App.jsx is 2409 lines; `ProtocolApp` is ~2080. Cleanest extractions: `useInitialLoad` (743-823), `useSlotSchedule` (983-1185, highest value), `useProtocolActions` (1391-1595), `useSuppActions` (1238-1389), `useClinician` (408-619). Mechanical, no behavior change. **(G) Duplication [maintainability]** — 4 relative-date formatters → one `format.js`; the `checked`-key string built by hand in 6+ places → export `makeCheckKey`/`parseCheckKey`; adherence counting reimplemented in 4 functions → route through `countExpectedChecks`. **In-sync verified (no action):** `computeIFSlotTimes`, `computeAdaptiveDelta`, `isSupplementActiveOn` client/server pairs all match line-for-line.***

*Earlier: June 15, 2026 — **Notification recompute fixed — a CORS preflight regression that had been silently broken since June 3, surfaced by the Flexible-IF deploy.** Sofia reported reminders erroring after the new feature; toggling them off/on threw. **Diagnostic-first path:** the in-app toast ("Notifications didn't update — try again later") only fires from `recomputeAfterEnable` and discards the real error, so we temporarily made `recomputeNotifications` return the server detail string (commit `66820ee`) and surfaced it in the toast. It read **"exception — TypeError: Load failed"** — Safari's wording for a fetch blocked *before reaching the server*, i.e. a CORS preflight failure, not a 500. **Root cause:** the June 3 token-refresh fix added an `apikey: SUPA_KEY` header to the `recompute_notifications` fetch "for gateway parity" — but that function runs **`verify_jwt = false`** (`supabase/config.toml`), so the Supabase gateway never required `apikey`, and the function's `Access-Control-Allow-Headers` (`Authorization, Content-Type, X-Cron-Secret`) never listed it. So every JWT-mode recompute's preflight asked to send `apikey`, the function said no, and the browser blocked the request. **Why it stayed hidden June 3 → June 15:** background recomputes go through `recomputeQuiet` (errors log to console only), and push notifications kept arriving via the 4-hour pg_cron refill loop (server-to-server, no CORS) — so the queue never ran dry. The only path that surfaces the failure is explicitly toggling reminders *on* (`recomputeAfterEnable`), which Sofia hadn't done since June 3 until debugging the "new feature." The IF feature was a red herring; the migration (`daily_logs.eating_window_open/close`, confirmed present via `information_schema`) was correctly run. **Fix (commit `087915c`):** dropped the unneeded `apikey` header from the `recompute_notifications` call in `api.js` (keeps the user JWT in `Authorization`, which the function verifies internally via `getUser()`) — this works against the already-deployed function, no edge-function redeploy needed, only a Vercel frontend deploy. Also added `apikey, x-client-info` to the function's `Access-Control-Allow-Headers` for future-proofing (matches the May 20 `e0ccffd` `notify_protocol_sent` CORS fix). **Verified working live by Sofia.** Debug instrumentation reverted in a follow-up; `recomputeAfterEnable` restored to the clean fallback message. **Lesson:** `apikey` is only needed on edge-function calls where `verify_jwt=true`; adding it to a `verify_jwt=false` function silently requires a matching CORS allow-list entry or the preflight breaks. Build + all four enforcement checks clean.***

*Earlier: June 12, 2026 (midday) — **Flexible IF shipped — an opt-in fasting sub-mode where the eating window is bracketed by two taps the user makes, with meal slots + reminders flowing from the actual open.** Reported by a real IF user: her fast isn't a fixed clock (16:8 one day, 18:6 the next — start AND length both move), so the absolute-window v2 model didn't fit. New **Fixed/Flexible** toggle in the IF schedule config (`ScheduleTab.jsx`, fasting block; default Fixed). **Flexible behavior:** two TARGET-based pre-window nudges (they precede the open tap) — `target − pre_meal_window` = the existing `fasted` slot carrying pre-first-meal supps, and `target` = a new **`window_open_prompt`** ("Time to open your eating window", no supps). The user taps **"Start eating window"** (Hero CTA) to set the actual open; meal_1+ re-anchor to it and the window length counts from the tap (close target = actual open + duration). A "window closes soon" nudge fires at actual open + duration − 30; the user taps **"Close eating window / start fast"** to confirm the end, and unfired meal reminders after close are dropped. Never tapping close → window stays open until the next day's open. **Storage:** two additive `daily_logs` columns `eating_window_open` / `eating_window_close` (text HH:MM, threaded through the autosave payload + day-switch flush so the in-memory mirror never desyncs); the Fixed/Flexible flag lives in the schedule config blob as `offsets.eating_window_flexible` (safe there — the toggle lives in the schedule editor which always rewrites offsets, unlike adaptive_timing which needed a column). **Shared math:** `computeIFSlotTimes` (src/config.js) + `computeIFSlotTimesHHMM` (helpers.ts) gained an `effectiveWs` override — meal_1+ re-anchor to the actual open, `fasted` always stays at the configured target; node-tested for parity (12 cases). **Client:** new `eatingWindowOpens`/`eatingWindowCloses` state, `openEatingWindow`/`closeEatingWindow` handlers (each recomputes notifications), `getSlotTime` fasting branch passes `effectiveWs` for today, Hero gains a 4-state machine (not-opened → "Start eating window" accent CTA / open → "Close eating window" outlined CTA / closed → "Fasting · Window HH:MM–HH:MM" / done). **Server (`recompute_user_logic.ts` IF v2 block):** reads `eating_window_open`/`eating_window_close`; flexible-not-opened emits only `fasted` + `window_open_prompt`; flexible-opened emits `meal_1`+closing+meal slots from the actual-open anchor and drops rows past a recorded close; tomorrow always shows just the two target nudges. `process_notifications_queue` unchanged — `window_open_prompt` carries zero supps so it fires unconditionally like `fasted`/`window_closing`; verified `public/sw.js` only branches on `data.type`, never `slot_id`, so the new id is safe. Adaptive timing (shipped earlier today) has no collision — it's gated to medication/wakeup. **Supabase migration (Sofia must run BEFORE deploy):** `alter table daily_logs add column if not exists eating_window_open text, add column if not exists eating_window_close text;`. Build + all four enforcement checks clean. Plan: `~/.claude/plans/dynamic-tickling-rossum.md`. **Known v1 limitation:** for a very-late opener whose window crosses midnight, the "closes soon" warning may not fire (tomorrow's recompute won't re-derive a yesterday-anchored row) — the window just persists visually until the next open. **Pending: Sofia runs the migration, then live verification (display states, queue inspection, Fixed-IF regression).***

*Earlier: June 12, 2026 (late morning) — **Adaptive timing shipped — an opt-in toggle that re-flows today's cascade off your actual log times, symmetrically, including push notifications.** In medication/wakeup modes the cascade was `anchor + fixed offset`; if you logged a dose late or early, the rest of the day stayed pinned to the original plan and reminders fired at stale times. Now, with "Adaptive timing" on (Schedule setup, offset modes only, default OFF): logging a slot records *when* you took it and the rest of today's slots — and their reminders — shift to preserve the gaps. **The rule:** planned `P(slot) = anchor + offset`; a slot is "logged" if ≥1 of its supps has an `{at}`, its actual time is the MAX `at` across them; `S*` = the logged slot with the greatest offset; `activeDelta = A(S*) − P(S*)`. Logged slots show their own actual; unlogged slots downstream of `S*` shift by the delta; earlier unlogged slots stay put. Delta is computed once from `S*` (never accumulated). Scope: today only, offset modes only; the absolute evening slot (`evening_mode` set), fixed mode, and fasting are excluded. **Shared math, duplicated per the repo pattern:** `computeAdaptiveDelta` is a pure integer-minutes function living in both `src/config.js` (client/display) and `supabase/functions/_shared/helpers.ts` (server/notifications) with a "keep in sync" comment; a node parity test (`/tmp/adaptive_test.mjs`, 10 cases incl. out-of-order, multi-supp max, prefix safety, early/negative) is green. **Client (`App.jsx`):** `adaptiveEnabled` state loaded from `user_schedule.adaptive_timing`; `getSlotTime` offset branch applies the delta with a midnight fallback (if a shift crosses out of today, show the unshifted plan); `toggleCheck`/`takeAllInSlot` stamp `at: now` when checking ON on today with adaptive on (adaptive-off + past-day edits still store bare `true` — zero regression); a debounced `recomputeQuiet()` is chained off the existing 200ms autosave `.then()` (not a parallel timer) so the edge function reads the just-persisted `at`. **Toggle UI:** `ScheduleTab.jsx`, beside Flexible/Consistent, gated on `isOffsetMode`, using the same `segBtnStyle` idiom as the anchor control; threaded through `onSave`→`saveSchedule`→`dbSaveSchedule`. **Server (`recompute_user_logic.ts`):** reads `daily_logs.checked` (added to the today select), gates on `adaptive && offset-mode && isToday`, computes the delta, shifts downstream `fire_at`, **skips emitting a row for an already-logged slot** (no reminder for something you took), and **midnight-clamps** (drops a today row that shifts onto another local day so it can't collide with tomorrow's). Already-fired rows are never touched (the delete+reinsert only clears `fired=false`), so a late shift never re-notifies a slot you were already pinged for. **Storage:** dedicated `user_schedule.adaptive_timing boolean` column (not in the `offsets` jsonb — that blob is rewritten on every schedule edit and would wipe the flag, the same class of bug that hit `notifications_enabled`); added to `dbSaveSchedule`'s preservedFlags so the DELETE+INSERT carries it, with the editor's choice winning over the stored value. **Supabase migration (Sofia must run BEFORE deploy — the client sends the field on save):** `alter table public.user_schedule add column if not exists adaptive_timing boolean not null default false;`. Build + all four enforcement checks clean. Plan: `~/.claude/plans/dynamic-tickling-rossum.md`. **Pending: Sofia runs the migration, then live verification (display re-flow, queue inspection, midnight stress, adaptive-OFF regression).***

*Earlier: June 12, 2026 — **Paused supplements no longer leak into past days — pause/resume now records dated intervals so history stays honest.** Bug (reported by Sofia): pausing a supplement then resuming it made it reappear on every past day from `created_at` forward, including the days it was actually paused. Root cause: pause stored only *current* state (`status`/`paused`) with no timing; `homeSupps` gated day membership on `isActiveSupp` — a current-state check applied retroactively to all of history — and `isSupplementActiveOn` (time.js) never looked at pause at all. So pause/resume acted as a global, history-less, retroactive toggle (pausing also erased pre-pause history; resuming re-added it everywhere including the paused window). **Fix:** new additive `supplements.pause_intervals` jsonb column — array of `{from, to}` local-date windows where `to:null` means still paused. `togglePause`/`resumeSupp` open an interval on pause (`from`=today, `to`=null) and close it on resume (`to`=today) via pure helpers `withPauseStarted`/`withPauseEnded` (time.js). `isSupplementActiveOn` now returns false for any day inside an interval `[from, to)`. Day-membership gates across the app switched from `isActiveSupp(s)` to `!isStoppedSupp(s)` (new helper = neither active nor paused) so PAUSED supps flow through and are masked per-day by the interval logic, while STOPPED/discontinued supps stay excluded as before — touched `homeSupps` (App.jsx:653), the inline streak calc (App.jsx:902, which also gained the previously-missing `isSupplementActiveOn` date check so a resumed supp's paused days don't break the streak), `calculateAdherenceForDate` + `calculateCurrentStreak` (adherence.js — keeps week-strip rings consistent with the home list), and the parked `PatientDetailPanel` mirror. `dbUpdateSupp` (api.js) persists `pause_intervals`. **Supabase migration (Sofia ran June 12):** `ALTER TABLE public.supplements ADD COLUMN IF NOT EXISTS pause_intervals jsonb NOT NULL DEFAULT '[]'::jsonb;` plus a one-time backfill giving currently-paused supps an open interval from `COALESCE(updated_at, created_at)` so they stayed hidden today/forward (that one date is approximate for supps paused before this fix; all new pause/resume cycles record exact dates). Build + all four enforcement checks clean. Pending Sofia's live verification on the deployed build.*

*Earlier: June 3, 2026 (late morning) — **`/design-system` made responsive on desktop, plus alignment and overlap fixes uncovered by the wider viewport.** **(1) Phone-frame opt-out.** The May 20 mobile-only pivot wrapped body in a centered 440px column at ≥1024px. That's correct for the app shell but wrong for `/design-system`, which is a public, portfolio-linked surface. Boot script (`index.html`) now tags `<html>` with `design-system-route` synchronously when `location.pathname === '/design-system'` (or the legacy `/design`) so the phone-frame opts out on first paint — no flash. The desktop media query scopes via `html:not(.design-system-route)` for both the html background and the body's 440px cap. **(2) Content maxWidth.** Without a max, section descriptions stretched to ~1500px on a single line at 1920px viewports, and `ComposedSection` example wrappers stretched mobile-targeted components (Hero / WeekStrip / SlotCard / ProtocolRow) into surfaces they were never sized for. Capped main content at `maxWidth: 1100`, each composed example wrapper at `maxWidth: 480` so phone-targeted components render in realistic context. **(3) IntroHeader alignment.** The page h1 anchored to viewport-left at 32px while section h2s sat at 268px (sidebar + main padding) — visually disconnected. `IntroHeader` now takes `isDesktop` and indents its inner content to `SIDEBAR_W + spacing.xxl` (220+48=268), so h1 and section h2s left-align. Also stripped the stale "(bottom right)" theme-picker copy — DevThemePicker was removed in the May 20 pivot. **(4) `VariantGrid` + playground caption alignment.** Switched the three `flexWrap` rows from `alignItems: 'flex-end'` to `'flex-start'`. Previously component bottoms shared a baseline, which scattered the captions above when component heights varied — most visibly in the Heading section where `display=32px` and `label=12px` put captions 20px apart on the same row. Top-aligning keeps the captions on a single header line; components hang below at natural heights. **(5) Radius/Shadows label overlap.** `radius.surfaceInner` (~143px wide in mono) bled into the next 96px item, reading as `radius.surfaceInnerradius.pill`. Dropped the redundant `radius.` and `shadows.` prefixes (section headers already provide context, matching Typography's prefix-free convention), bumped Radius item width 96→110, added `wordBreak: break-word` as a safety net. **(6) Build break + recovery.** Initial commit `5c3db44` shipped a misplaced `{/* ... */}` JSX comment inside `RADIUS_TOKENS.map()`'s `return` (two top-level expressions, not one) — esbuild failed on Vercel. Fixed in follow-up `11b469f` by hoisting the comment above the map block. Lesson: JSX comments inside JSX work fine; as a sibling of a returned element they don't. **Commits (in order):** `314155c` phone-frame opt-out, `9645edb` content maxWidth + IntroHeader alignment, `4c749d9` flex-start caption alignment, `5c3db44` Radius/Shadows prefix drop (broken), `11b469f` JSX comment hoist (recovery). Vercel auto-deploys `11b469f` as the live `/design-system` build.***

*Earlier: June 3, 2026 (morning) — **Two fixes: (1) "Notifications didn't update — try again later" toast firing on every supp add/edit. Root cause: `App.jsx:308` snapshots `localStorage.sb_token` once into the `ProtocolApp` prop and never updates it. `supa()` (api.js:67) silently refresh-and-retries on 401 so PostgREST calls stayed healthy after Supabase's hourly JWT rotation; `recomputeNotifications(token)` had no refresh-retry, so once a session's token had been rotated, every JWT-mode recompute (fired by every supp add/edit/pause/delete/IF-migration) 401'd and surfaced the toast. Sofia's notification queue was actually healthy throughout — the 4-hour pg_cron mode kept refilling it (49 fired in last 7 days, 5 pending) — only the JWT-mode path was broken. Fix at `src/lib/api.js:283`: ignore the caller-passed token, read `sb_token` fresh from localStorage at call time, retry once via `refreshSession()` on 401 (mirrors the `supa()` refresh pattern). Also added the `apikey: SUPA_KEY` header that other edge-function calls (`dbNotifyProtocolSent`) already include, for gateway-level parity. While in the area, split `recomputeWithToast` into `recomputeQuiet` (silent — used for background recomputes after supp/protocol writes; failure logs to console only) and `recomputeAfterEnable` (toasts on failure — used only by the two `onNotificationsEnabled` callbacks where the user explicitly turned reminders on and would expect a result). The toast that fires from `recomputeAfterEnable` now uses `tone: "warning"`. **(2) Toast tone system — new `tone: "success" | "error" | "warning" | "info"` option in `showToast(msg, { tone })`.** Default lucide icon auto-renders for each tone (CheckCircle2 / AlertCircle / AlertTriangle / Info, at `icon.xs` with strokeWidth 2.25) in the matching `theme.status.*` color. Explicit `icon` overrides the tone default (the Undo-delete `Trash2` case stays as before, no tone). Threaded tone through all ~30 toast call sites: successes (Added/Updated/Deleted/Resumed/Paused/Created/Activated/Saved/Sent/Declined/Password updated/Name updated/Reminders on-off) → success, "Couldn't…" errors → error, "Permission denied" + "Reminders not configured yet" → warning, "Check your inbox to confirm" → info. Files touched: `Toast.jsx`, `ToastContext.jsx`, `App.jsx`, `SettingsScreen.jsx`. Design-system page updated: `registry.js` Toast entry gains success/error/warning/info variants; `previews.jsx` ToastPreviewInner wires the tone branches; all 4 enforcement checks (`check:all`) pass clean, vite build clean.***

*Earlier: May 26, 2026 — **Apple-bar screen audit + Tier 3 typography sweep + Phase A primitive adoption + Phase B spacing + Phase C enforcement completed across 8 sessions.** Highlights: (1) Full screen-by-screen audit of every text element in the app (183 elements across 10+ screens). (2) 9 typography/color fixes shipped — slot label hierarchy, time label color, Hero CTA size, paused dose alignment, LogAtSheet explainer, Account label overrides, autocomplete "Recent" label, LogAtSheet "Time taken" label. (3) `text.faint` token retired (WCAG violation on every surface). (4) `text.muted` renamed to `text.tertiary` (primary/secondary/tertiary ladder). (5) `check-contrast.js` refactored to self-discover new tokens — no more hand-maintained pair list. (6) `<Heading>` primitive expanded with `font` prop; all production `<h1>` tags migrated to Heading (zero raw heading tags remain). (7) Hero eyebrow + InsightsPanel SectionLabel migrated to `<Heading>`. (8) ScheduleTab mode cards aligned to Onboarding (Card variant adoption + typography alignment). (9) Account sub-screen section spacing bumped from spacing.md to spacing.xl. (10) `check-bypasses.js` added — primitive bypass lint rule covering raw buttons, headings, position:fixed; blocks prebuild. (11) `makeSegBtnStyle` documented as intentional style-factory distinction. (12) CLAUDE.md updated with five operational lessons from the audit cycle. Enforcement layer now has 4 scripts: check-contrast, check-tokens, check-registry, check-bypasses — all blocking deploys.*

*Earlier: May 23, 2026 (late afternoon) — **Phase 3 of the design-system audit shipped — the enforcement layer. The meta-finding ("declared, not enforced") now has machinery between the spec and the codebase.** Built as Node scripts rather than ESLint to keep the dependency tree lean. **(1) `scripts/check-contrast.js` — WCAG 2.x contrast verification, blocking.** Loads `themes.achromatic`, computes relative-luminance contrast ratios for every text/surface and UI-component/surface pair that matters (text.primary/secondary/muted/disabled × canvas/card; border.subtle/strong × canvas; status colors × canvas; informational card-on-canvas surface separation). Fails the build with `process.exit(1)` if any pair drops below its WCAG floor (4.5:1 for body text per 1.4.3, 3:1 for UI components per 1.4.11). Current state verified clean: text.disabled 3.65:1, border.subtle 3.09:1, border.strong 4.92:1, text.muted 3.38:1 — every pair above its floor. This is the check that would have caught the May 23 audit's CI-1 (1.71:1) and CI-2 (1.26:1) on the day the token values were authored. Wired into `npm run build` via the `prebuild` script so a deploy can't ship invisible UI; Vercel auto-runs npm scripts so this fires every deploy. **(2) `scripts/check-tokens.js` — token-discipline audit, reporting.** Scans `src/**/*.jsx` for off-palette hex literals in JSX `style={}`, off-scale fontSize values, and `outline: "none"` suppressions of the global `:focus-visible` rule. Reports counts + file:line for each violation, exits 0 by default so accidental false positives don't block deploys; pass `--fail` for CI strict mode. Skips `design-system.js`, `OriginGlyph.jsx` (brand-asset constants), and `design-system-page/` registry stubs. Current state: 0 off-palette hex literals (theme is fully real and used), 1 off-scale fontSize (`PromptName.jsx:22` — the 👋 emoji at 40px, design call deferred), 2 `outline:none` suppressions (both in parked clinician code: `PatientAnalyticsPanel.jsx`, `Sidebar.jsx`). **(3) `package.json` script wire-up.** Three new entries: `check:contrast` (manual), `check:tokens` (manual; pass `-- --fail` for strict), `check:all` (runs both). Plus `prebuild` chains the contrast check to every `npm run build`. **(4) What enforcement Phase 3 does NOT cover (deferred — would need external tools or more design work):** (a) Visual regression / snapshot diffs — needs Chromatic, Percy, or similar; out of scope without a vendor commit. (b) Primitive-bypass lint (`<button>` outside Button.jsx, `position: fixed; inset:0` outside Modal/SidePanel/Popover) — the allowlist of legitimate exceptions is large enough (Sidebar's parked buttons, the 4 slide-in screens that use `position: fixed; inset: 0` as full-screen takeovers, etc.) that a strict lint would be more noise than signal until the bypass landscape settles. (c) Design-system-page coverage check (every primitive must have a registry entry) — could be added when registry.js stabilizes. **(5) Meta-finding closure.** The May 23 audit identified "the design system is declared, not enforced" as the root cause connecting contrast failures, primitive bypasses, missing focus states, and unsemantic headings. Phase 1 closed the bleeding (visible failures); Phase 2 + 2.5 built the tokens + primitives the system needed; Phase 3 adds the machinery that prevents regression. The contrast check specifically closes the "[REVISIT ON RENDER] never gets revisited" failure mode — there's no way to author a new theme value that fails WCAG and ship it. Combined effect: the design system can now lose contributors without immediately decaying back to today's state. **Vercel deploy will run check-contrast on next build.** If you see a Vercel build fail with `WCAG contrast check`, the failure output names the offending pair + ratio + floor — fix the token value and redeploy.*

*Earlier May 23, 2026 (afternoon) — **Phase 2 of the design-system audit shipped — single commit, new tokens + primitives + selective callsite migration. Two audit findings revised.** **(1) New tokens in `design-system.js`.** `icon` scale (`xs:16, sm:18, md:24, lg:32, xl:40`) for the 9 distinct magic px sizes the audit found. `motion` tokens (`state:150, modalOpen:200, modalClose:150, screenSlide:300, chevronRotate:300, toast:200, pressed:60`) + named easings — replaces inline `transition: 0.3s ease-out` magic numbers. `radius.lg` (0 usages, dead) deleted; `radius.xl` (1 usage) renamed to `radius.modal` and Modal.jsx updated. Shadow tokens stay as RGB literals but now have a doc comment naming the smell (full refactor to `makeShadows(theme)` deferred until a second theme variant actually exists). **(2) New primitives.** `src/components/Heading.jsx` — required `level` prop (1–6) maps to DOM tag, separate optional `visual` prop maps to typography size. Throws in dev when `level` missing — copies the Stripe Press / Arc pattern where you can't render a heading without specifying its semantic role. `src/components/Checkbox.jsx` — consolidates the indicator-with-checkmark pattern. Takes `size` (default `icon.sm`), `shape: "square" | "pill"`, `checked`. Auth + SettingsScreen `PasswordRule` components both migrated to use it (was inline duplicated 16px circular indicators with lucide Check). **(3) Applied.** `Heading` lands on the two screens the May 23 morning h1 pass deferred — `ProtocolDetailScreen.jsx` (both read-only and editable-button title paths now render `<Heading level={1} visual="body">`; the input branch during edit stays as bare `<input>`) and `IFMigrationScreen.jsx`. `motion.chevronRotate` migrated at the one true chevron callsite (SlotCard.jsx:107 — was 200ms, unified to 300ms). `motion.screenSlide` migrated to the three slide-in screens (SettingsScreen, ProtocolLibrary, ProtocolDetailScreen — all were inline `transform 0.3s ease-out`). **(4) Audit revisions — two findings were overreached and not fixed:** (a) the audit flagged "4 modal reimplementations" (IFMigrationScreen, SettingsScreen, ProtocolLibrary, ProtocolDetailScreen) as bypassing the Modal primitive. On closer inspection none of these are modals — IFMigrationScreen is a one-time full-screen takeover (`position:fixed, inset:0`), and the other 3 are route-like slide-in screens that use the App-level `screenStack` pattern for navigation. Migrating them to `<Modal>` (which is a bottom-sheet) would visually break them. They're using the right pattern; the audit miscategorized. (b) The SidePanel `aria-modal="false"` finding from Phase 1 audit was similarly overreached — `role="dialog"` + `aria-modal="false"` is the documented non-modal-dialog pattern. **(5) Deferred from Phase 2 to Phase 2.5 (focused mini-sessions):** (a) Hand-rolled button migration — 20 buttons across 12 files. Each needs per-button analysis (which Button variant fits, or extend Button's variant set). Doing in one commit risks visual regressions; recommend per-component mini-sessions (SlotCard's 4 buttons first — highest traffic). (b) Focus-visible coverage on ~10 components — needs centralization through a primitive or shared mixin. (c) SlotCard + SupplementRow checkbox consolidation to the new `Checkbox` primitive — visual treatments differ across the 3 sites (lucide Check vs custom SVG path vs unicode `✓`); needs a design call on which check style to standardize on before mechanical migration. (d) Icon-scale callsite migration — token exists; the 9 magic px values (16, 18, 20, 22, 24, 28, 32, 36, 40) don't all cleanly map to the 5 scale points, so per-callsite rounding decisions are needed. (e) Section-level h2 sweep — Settings sections, Onboarding sections, etc. still use `<Label>` for what's semantically a section heading. **Net for Phase 2:** the token + primitive layer is now real; future contributors have something to reach for. The mechanical "migrate everything" passes are sized as focused mini-sessions rather than one-shot rewrites.*

*Earlier May 23, 2026 (early afternoon) — **Phase 1 of the design-system audit shipped — three commits stopping the bleed.** Full audit lives in conversation history (Head of Design + Head of Product dual-lens, May 23). Meta-finding: the design system is declared, not enforced — 770-line rules doc, real tokens, working primitives, but zero machinery between the spec and the codebase, so every rule is followed only when a contributor remembers to. Phase 1 closed five Critical Issues. **(1) Card primitive keyboard accessibility — `b848727`.** `src/components/Card.jsx:25` was rendering interactive Cards as `<div onClick>` with no role, tabIndex, or keyboard handler — every clickable card in the app was unreachable to keyboard-only users and announced as non-interactive by screen readers. Card now sets `role="button"`, `tabIndex=0`, and an Enter/Space handler when `onClick` is set, while keeping the `<div>` element so callsites can still nest interactive children without invalid `<button>`-in-`<button>` markup. Adds optional `ariaLabel` prop. Affects the two current `onClick` callsites (Onboarding schedule picker, ScheduleTab). **(2) SupplementRow edit button — `b848727`.** Bumped from 32px to `touch.min` (44) per Category 1; visual icon still 14px, hit-area now meets the mobile floor. **(3) CI-5 from audit (SidePanel `aria-modal="false"`) dismissed.** Re-examined: `role="dialog"` + `aria-modal="false"` is the documented non-modal-dialog pattern per ARIA spec, and Category 3 line 167 explicitly says SidePanel is non-modal on desktop ("scroll lock and surface dim are both intentionally absent — the underlying context stays interactive-looking"). Original audit overstated the contradiction; no change needed. **(4) Contrast bump — `0ec4a3e`.** The most consequential change. `text.disabled` was shipping at **1.71:1** on `#0D0D0D` canvas — disabled buttons were functionally invisible. `border.subtle` at **1.26:1** meant card edges, input outlines, and the global focus-ring offset region all vanished into the canvas. Bumped to WCAG-passing values (recomputed from scratch — the audit's suggested `#5C5C5C` was actually still 2.93:1, a fail; needed brighter): `text.disabled: #444444 → #6B6B6B` (3.70:1 ✓), `border.subtle: #2A2A2A → #606060` (3.12:1 ✓), `border.strong: #404040 → #808080` (5.31:1 ✓). Side effect: cards will read slightly more "outlined" than before because canvas-vs-card surface contrast is only 1.14:1 — cards rely entirely on borders to read as discrete surfaces. **Phase 2 followup flagged:** if dividers (which also use `border.subtle`) feel too prominent in production, split into `border.divider` (decorative, can stay low-contrast) and `border.interactive` (≥3:1). **(5) Semantic h1 pass — `331d8c3`.** Before: 3 `<h1>`/`<h2>` tags total across 44 components, all in PatientRoster + DesignSystemPage. After: every canonical-flow screen has exactly one h1 — Auth (copy.title), Onboarding Step 1 ("Set up your protocol"), Step 2 ("Configure your schedule"), NotificationPrompt (both branches), PromptName, App home greeting ("Hello, [name]"), SettingsScreen (`TITLES[view]` — Settings / Schedule / Account / Insights / Add to home screen), ProtocolLibrary ("Protocols"). All inline styles preserved; `margin: 0` added so default h1 margin doesn't push layout. **Phase 2 picks up:** `<Heading level visual>` primitive, ProtocolDetailScreen inline-editable title (span/input/button toggle), IFMigrationScreen, section-level h2 sweep, replace 4 modal reimplementations with `<Modal>`/`<SidePanel>`, migrate 20 hand-rolled buttons to `<Button>`, add icon-size scale, extract `<Checkbox>` primitive, retire dead tokens (`radius.lg`, rename `radius.xl`). **Vercel deployments:** all three commits auto-deploy via main.*

*Earlier May 22, 2026 (very late) — **Forgot-password flow refresh-bypass closed.** Caught while reviewing the reset code path before Sofia's end-to-end phone test. **The gap:** when the user clicked an email recovery link, `App.jsx` extracted `#access_token` to `localStorage.sb_token`, cleared the URL hash, and set React state `recoveryMode=true` to route Auth to `reset_confirm`. But the recovery token is a fully valid Supabase session token — if the user refreshed the page mid-flow (or hit the back/forward button), React state cleared, the URL hash was already gone, `recoveryMode` re-initialized to `false`, and `getSession()` read the still-live recovery token from localStorage → user got dropped into ProtocolApp without ever having reset the password. Supabase recovery tokens default to ~1 hour validity, so the window was small but real. **The fix:** mirror the flag into `sessionStorage` (`origin.recovery_mode = "1"`) on initial hash-parse so a refresh stays in `reset_confirm`. sessionStorage is per-tab and clears naturally when the tab closes, which is the right granularity — we want the recovery flow to survive a refresh but not a tab close. The `onSignIn` handler clears the flag on successful password update. **Known minor gap not fixed:** if the user closes the recovery tab mid-flow and reopens within ~1 hour, sessionStorage is gone but the recovery token in localStorage is still valid → `getSession()` will treat it as a normal session and drop them into ProtocolApp. Fixing this would require storing the recovery token in a separate localStorage slot (`sb_recovery_token`) and only promoting it to `sb_token` after a successful password update — meaningful complexity for a low-risk window on a personal supplement tracker. Documented for future hardening. **Forgot-password flow verified live end-to-end on May 22 evening.** Sofia configured the Supabase Dashboard (Authentication → URL Configuration → Site URL + Redirect URLs allowlist set to `https://origin-protocol.vercel.app/**`) and customized the Reset Password email template with Origin-branded HTML (black-on-white achromatic, inline SVG glyph, `#5FE090` accent-green hyperlink CTA, JetBrains Mono fallback chain via doubled `<font>` + `<span style>` for sanitizer-resilience). Real-email test from iPhone Safari: request reset → email lands in inbox → tap link → Auth screen renders in `reset_confirm` with the OriginGlyph and "Set a new password" copy → submit → drops onto home screen logged in. Mid-flow refresh stayed in `reset_confirm` (sessionStorage flag working). **Note on Dashboard preview:** Supabase's in-Dashboard email preview strips most inline styles for security, so it renders the template as sparse serif-y text — not representative of actual email-client rendering. Trust the inbox, not the preview. **Also in this commit:** the FK-cascade audit query result from earlier (zero rows — every FK to `auth.users(id)` already cascades, only `user_schedule` had been the outlier) is now recorded as "audit closed" in the previous handoff entry instead of "followup TODO".*

*Earlier May 22 (night) — **All open footnotes from today's notification work cleared: stricter iOS/iPadOS detection, sign-out cleanup retry queue, brand-glyph applied to NotificationPrompt.** Closes out the "fix all of it" sweep after Sofia's iPhone test pass. **(1) Platform detection (lib/notifications.js `isIOS` / `isIOSPWA`):** iPadOS Safari since iPadOS 13 reports a macOS UA in its default desktop rendering mode, so the previous `/iPad|iPhone|iPod/.test(navigator.userAgent)` returned false for iPads-in-desktop-mode and routed them through the wrong NotificationPrompt branch — they'd see "Want reminders?", tap Enable, and `subscribeToPush` would throw silently because the `needsHomeScreenInstall()` check inside threw `"PWA install required on iOS"`. Fixed by adding an `isIPadOSDesktop()` helper: `navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1` (real macOS reports `maxTouchPoints === 0` even with Magic Trackpad; iPads expose touch points). `isIOS()` now ORs the UA test with `isIPadOSDesktop()`. `isIOSPWA()` gains a `matchMedia('(display-mode: standalone)')` fallback since `navigator.standalone` may be undefined under iPadOS-desktop-mode. Real macOS Safari (no touch points) correctly stays out of the iOS branch and uses the default push-supported path — macOS Safari natively supports web push since macOS 13. **(2) Sign-out cleanup retry queue (lib/notifications.js):** `unsubscribeFromPush` now writes the endpoint to `localStorage["origin.pending_push_cleanup"]` if the DB DELETE fails (network flake during sign-out), and a new `retryPendingPushCleanup()` drains the queue on the next successful sign-in. The SW-level `subscription.unsubscribe()` is attempted first regardless — it's a local browser call with no network dependency, so the privacy-relevant step (endpoint goes dead at the push service) succeeds even when the DB cleanup fails. `App.jsx` calls `retryPendingPushCleanup()` from both sign-in code paths (`getSession()` resolved-with-user on boot, and `Auth onSignIn`). RLS keeps the queued DELETE scoped to whoever's currently signed in — if it filters silently (queued cleanup belonged to a different prior user), we clear the queue anyway because the now-dead endpoint will be cleaned passively by the existing 404/410 handler on the next push attempt. **(3) Brand glyph on NotificationPrompt (components/NotificationPrompt.jsx):** the 🔔 emoji on the default branch was the only emoji left in the production app (everywhere else is monochrome Terminal Achromatic). Replaced with `<OriginGlyph size={56} />` to match the Auth screen. Also added the glyph to the iOS install-instructions branch which previously had no visual identifier above the heading — both branches now lead with the brand mark for visual continuity. **(4) FK-cascade audit closed — zero findings.** Sofia ran the query below in the SQL Editor and it returned **0 rows**, confirming that every FK referencing `auth.users(id)` already declares `ON DELETE CASCADE`. The May 22 afternoon work on `user_schedule` was the only outlier — all other `public.*` tables with FKs to `auth.users(id)` were declared cascading in their original migrations, so no further ALTERs were needed. Keeping the audit query archived here for future use (e.g., after a new table with a `user_id` FK is added): ```sql
SELECT tc.table_schema || '.' || tc.table_name AS child_table, kcu.column_name AS child_column, rc.delete_rule, tc.constraint_name, 'ALTER TABLE ' || tc.table_schema || '.' || tc.table_name || ' DROP CONSTRAINT ' || tc.constraint_name || ', ADD CONSTRAINT ' || tc.constraint_name || ' FOREIGN KEY (' || kcu.column_name || ') REFERENCES auth.users(id) ON DELETE CASCADE;' AS suggested_fix FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_schema = 'auth' AND ccu.table_name = 'users' AND rc.delete_rule != 'CASCADE' ORDER BY tc.table_schema, tc.table_name;
```*

*Earlier May 22 (late evening) — **Push subscriptions now scoped to one user per device — closes the cross-account leak surfaced earlier.** Two-pronged fix so the privacy window closes from both ends. **(1) `subscribeToPush` (lib/notifications.js):** before creating a fresh subscription, look up any existing SW subscription via `pushManager.getSubscription()` and tear it down — `existing.unsubscribe()` invalidates the endpoint at the push service, then we DELETE the current user's row at that endpoint (RLS-bounded, so if it belongs to another user the DELETE silently filters and the row stays orphan with a dead endpoint, which the existing 404/410 auto-cleanup in `process_notifications_queue` + `notify_protocol_sent` catches on the next push attempt). After teardown, `pushManager.subscribe` creates a fresh subscription with a new endpoint that maps unambiguously to the current user; we POST that. Reordered `getSession()` to the top of the function so we fail fast before invoking the OS notification permission dialog when not authenticated. **(2) Sign-out path (App.jsx outer `onSignOut`):** wrapped the existing `signOut(); setUser(null);` in `async () => { await unsubscribeFromPush(); signOut(); setUser(null); }` — `unsubscribeFromPush` calls `subscription.unsubscribe()` + DELETE on `push_subscriptions` for the current endpoint, both of which need to happen *before* the session token clears so the DELETE can authorize against RLS. `unsubscribeFromPush` was already in lib/notifications.js but App.jsx wasn't importing it; added to the import line. Wrapped in `try/catch` so a network failure during teardown still lets sign-out proceed (worst case: the row sticks around as an orphan with a dead endpoint, auto-cleaned on next push attempt). Dropped the now-unused `getCurrentSubscription` from App.jsx's notifications import while in there. **Result on shared devices:** sign out → device's push binding is gone (both at the push service and in the DB), so a subsequent push attempt to the prior account would hit a dead endpoint and the row gets cleaned. New user signs in + enables → fresh endpoint mapped only to them. No more cross-account push leaks. **Edge case still latent (not fixed):** if the device's sign-out call to `unsubscribeFromPush` fails *and* the new user never re-enables notifications, the old account's row + endpoint sit live on the device — a backend push targeting the old account would still land here. The try/catch swallows the failure to keep sign-out responsive; could be made stricter (block sign-out on cleanup failure, or queue a retry). Real-user risk is small given how rarely network calls fail on the sign-out tap, but flagging for future hardening.*

*Earlier May 22 (evening) — **Brand glyph on Auth, forgot-password flow end-to-end, push-subscription gate fix, Home empty-state polish.** Several shipped together since they all surfaced during the same iPhone test pass. **(1) Home empty-state polish (commit `efa92f9`):** Day-1 InlineTip moved from below the CTA to the top of the card so the schedule-mode mental model lands before the empty state + CTA — `App.jsx:2102–2117`. Tip wrapper is `textAlign: "left"` since the rest of the card stays center-aligned and the tip looks wrong centered. CTA copy `"Add to protocol"` → `"Add an item to protocol"` (verbs the actual action; protocols already exist by default). **(2) Brand glyph on Auth screen:** new reusable `src/components/OriginGlyph.jsx` — 5 concentric rings + glowing center dot, mirrors `/public/icon.svg` minus the dark background rect so it overlays any theme surface. Ring radii + stroke widths kept as brand-asset constants in the component (out of call sites). Auth.jsx renders `<OriginGlyph size={56} />` above the "ORIGIN" wordmark. Filter `id` uses `useId()` so multiple glyphs on one page don't collide. Future call sites (Loader, NotificationPrompt, Onboarding header) can drop the same component in without copying brand math. **(3) Forgot-password flow:** Auth.jsx grows two new modes — `reset_request` (email-only form → POST `/auth/v1/recover`) and `reset_confirm` (new password + confirm + rules; reachable only via the recovery email link). New "Forgot password?" tertiary link below the password input on signin mode. Between submitting the request and clicking the email link, the form is replaced by a `reset_sent` confirmation state ("Check your email — if an account exists for that email, we sent a reset link") with a Back-to-sign-in link. Recovery email lands on `${origin}/#access_token=…&refresh_token=…&type=recovery`; `App.jsx` parses the hash **synchronously** in `useState` initializer (before the session-load effect runs), pumps tokens into localStorage, clears the URL via `history.replaceState`, and sets a `recoveryMode` flag. Auth gets `recoveryMode` as a prop and initializes its mode to `reset_confirm`. Submit-reset path: `updatePassword(newPassword, sb_token) → getSession() → onSignIn(user)` — user lands logged-in on the home screen, no double sign-in. Reused the existing `updatePassword` helper from `lib/api.js:388`; new `requestPasswordReset(email, redirectTo)` added next to `signOut` at `lib/api.js:173`. Mode switcher hidden on `reset_confirm` (one-way path from email link). Supabase intentionally returns 200 on `/recover` regardless of whether the email exists, so we don't surface registered/unregistered to the UI — the confirmation copy is phrased accordingly ("If an account exists for that email…"). **(4) Push-subscription gate fix:** dropped the browser-level `getCurrentSubscription()` check from Onboarding `onComplete` (App.jsx). Surfaced today during testing — Sofia signed up as a new user inside the already-installed PWA and the notification prompt never appeared because the PWA's service-worker still had a push subscription from a prior account. `pushManager.getSubscription()` is browser-level, not per-user, so it returned a stale truthy sub and the branch skipped. Fix: a first-time onboarding completer is, by definition, a new user with no prior consent on this device — always show the prompt. Removed the SW lookup, added a comment explaining the why. **(5) Followup gaps flagged during today's tests, not fixed:** (a) The same stale-SW-sub issue affects the `subscribeToPush` write path — when a user clicks Enable on a device with an existing endpoint, the POST to `push_subscriptions` will associate this endpoint with the new user's `user_id`, but the OLD user's row stays (since we only DELETE on explicit Off). Result: same endpoint, two `user_id` rows, both users would receive pushes routed to this device until the old user unsubscribes. Real-user impact is small (only matters when a device is shared between accounts) but the cleanup-on-subscribe pattern would close it. (b) iPad in desktop-mode Safari and macOS Safari still go through the default branch and silently fail `subscribeToPush`; stricter detection (`isIOS()` + `navigator.maxTouchPoints > 1` for iPadOS) would catch them. **Supabase Dashboard config required for the reset-password flow to work end-to-end (Sofia must do this manually before testing on phone):** Dashboard → Authentication → URL Configuration → Site URL set to production URL (e.g. `https://origin-protocol.vercel.app` or custom domain); add the same URL to Redirect URLs allowlist. Without this, Supabase will reject the `redirect_to` value we pass and the recovery email link won't route back to the app. The Supabase email template under Authentication → Email Templates → "Reset Password" can stay default — the placeholder link Supabase generates uses the configured Site URL.*

*Earlier May 22 (late afternoon) — **Onboarding notification prompt now covers iOS-Safari-non-PWA users with home-screen install instructions.** Before: `App.jsx:1494` gated the post-onboarding `NotificationPrompt` on `isPushSupported() && !needsHomeScreenInstall()` — iOS users in Safari (the common case before they install) were silently dropped into the app with zero guidance about why reminders weren't an option. After: `App.jsx` splits the gate into two branches — `needsHomeScreenInstall()` triggers the prompt for iOS-non-PWA, else fall through to the existing `isPushSupported()` + no-active-sub check. `NotificationPrompt.jsx` branches internally on the same helper: install-required users get a new screen — heading "Add Origin to your home screen", explainer ("Reminders on iOS need Origin installed to your home screen. Once it's installed, open Origin from there and turn on reminders in Settings."), 4-step `<ol>` mirroring the SettingsScreen install view (Tap Share → "Add to Home Screen" → Open Origin from home screen → Open Settings and turn on reminders), single primary "Got it" → `onSkip`. Step 4 of the iOS list directs users to Settings rather than back to the prompt because `needsNotificationPrompt` is React state — once they install + relaunch as a PWA, the prompt won't auto-show on subsequent loads, so Settings is the only re-entry point. Non-iOS / iOS-PWA path unchanged (existing `🔔 Want reminders?` screen with Enable / Maybe later). Style extracted into `screenStyle` / `headingStyle` / `bodyStyle` consts to avoid duplicating layout values across the two branches. **Known edge cases left alone (out of scope per "isIOS() as-is" decision):** iPad in desktop-mode Safari (reports macOS UA so `isIOS()` returns false) and macOS Safari hit the default branch — if push isn't actually supportable in that browser, `subscribeToPush()` throws "PWA install required on iOS" and the error gets swallowed by the `try/catch` at `App.jsx:1505–1510`. Worth a stricter detection later (UA + `navigator.maxTouchPoints > 1`). 🔔 emoji on the default branch preserved as-is; flagged it's the only emoji in Origin against Terminal Achromatic but didn't change without explicit ask. **Pending verification:** real-iPhone test (Sofia is taking it for a spin) — confirm install instructions render legibly inside the phone-frame, copy reads correctly in iOS Safari's narrow viewport, the 4 install steps actually work, and the relaunch-from-home-screen → Settings → toggle-on flow is intuitive. DevTools iOS UA spoof renders the right branch but doesn't validate real touch / Share-sheet UX.*

*Earlier May 22 (afternoon) — **Production auth cleanup: 7 test accounts deleted, `user_schedule.user_id` FK promoted to `ON DELETE CASCADE`.** Hard-deleted these test/demo rows from `auth.users` via SQL Editor (the dashboard "Delete N users" button would have done the same thing, but scripted delete leaves a clear audit trail): `alex@origin-demo.com` (`265d7943-…`), `dra.orozcobp@gmail.com` (`b2264962-…`), `jordan@origin-demo.com` (`9ec20fba-…`), `maria@origin-demo.com` (`e17592d4-…`), `priya@origin-demo.com` (`d4b37b4d-…`), `sofia.vh.v@gmail.com` (`b39d3a9d-…`), `test+origin-may12@mailinator.com` (`3546b358-…`). Initial `DELETE FROM auth.users WHERE id IN (…)` errored with `23503: violates foreign key constraint "user_schedule_user_id_fkey" on table "user_schedule"` — a latent footgun: `user_schedule.user_id` was a plain FK with no cascade rule (W3's soft-delete pass only touched the supplement pipeline; never closed this gap). Resolved in one transaction: `DELETE FROM public.user_schedule WHERE user_id IN (…)` first, then the auth `DELETE`. Afterward promoted the constraint so future cleanups don't trip on it: `ALTER TABLE public.user_schedule DROP CONSTRAINT user_schedule_user_id_fkey, ADD CONSTRAINT user_schedule_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;`. **Production users count drops from 12 → 5** (see refreshed list in "What Origin Is" below; two new real signups since the May 11 snapshot — Isabela on May 13, Mariana on May 14 — joined Sofia / OVH / Bego). **Followups not done this pass:** (1) only `user_schedule` was audited for FK cascade — every other table that references `auth.users(id)` should be checked via `information_schema.referential_constraints` and promoted to cascade if it makes product sense (most `public.*` rows are user-private and would want cascade — `daily_logs`, `supplements`, `protocols`, `user_supplement_history`, `notifications_queue`, `protocol_sends`, `clinician_patient_notes`, `push_subscriptions`, `user_profiles`); (2) no parallel sweep of orphaned `public.*` rows belonging to the 7 deleted UIDs was run — if any of those tables had rows for the deleted users *and* a non-cascading FK, those rows are now dangling (unlikely since RLS would have blocked most test accounts from writing real data, but worth a one-shot orphan-scan next session).*

*Earlier May 22 (morning) — **Share as PDF shipped.** ProtocolDetailScreen's ⋯ overflow menu gains a "Share as PDF" action (sits above Delete, available on both active and archived protocols). Generates a single-page (US Letter, portrait) printable artifact describing the SHAPE of a protocol — no times anywhere, no execution data. Header reads "[Protocol name] · ORIGIN" with a near-black hairline below; status row reads "For: [display_name] · Active · Started [Month D, YYYY] · [Indefinite | Through [date] | Scheduled]" in Space Grotesk sentence case; supplements grouped by slot in display order (SLOTS for non-IF, IF_SLOTS for IF v2; Anytime bucket last), with category icons rendered via pdf-lib's `drawSvgPath` from hardcoded Lucide path data (Pill / Syringe / Droplet; Oral reserves the 14pt column space with no icon). Three-column rows: icon+name (col1) | dose right-aligned (col2 ~80pt) | metadata (col3, 1.4× col1). Metadata column shows ONE string per row, precedence: cycle pattern → scheduled-through date → day restriction (when not all 7) → notes (truncated to ~30 chars). Footer: "Generated by Origin · [today]" left, "Personal wellness tracking · Not medical advice" right, above a #E5E5E5 hairline. Pagination: header + status row repeat per page, no row splits, slot label gets "(cont.)" suffix on continuation pages. Empty state: protocols with zero active supps render "No active items in this protocol." centered. Paused + soft-deleted supps are excluded. Handler tries Web Share API (`navigator.canShare({ files: [pdfFile] })`) → falls back to download blob. Toast copy: "Protocol shared" / "Protocol downloaded" / "Could not generate PDF" (AbortError on share-sheet dismiss is silent — not a real failure). **Implementation:** new `src/lib/pdf.js` (`exportProtocolPdf({ protocol, supps, profile, schedule })` → `Blob`); `pdf-lib@^1.17.1` + `@pdf-lib/fontkit@^1.1.1` added to package.json; JetBrains Mono Regular/Medium + Space Grotesk Regular/Medium downloaded into `public/fonts/` and embedded at PDF-build time via `pdfDoc.registerFontkit(fontkit) + pdfDoc.embedFont(fontBytes)`. **Bundle:** pdf.js is dynamic-imported inside the share handler so pdf-lib doesn't bloat the main bundle — main went from 1.4MB (623KB gzipped) to 395KB (111KB gzipped); pdf-lib chunk is 1.0MB (510KB gzipped), loads only on first Share click. ProtocolDetailScreen gained `profile`, `schedule`, `onToast` props plumbed from App.jsx. **Pre-existing build break fixed in passing:** `src/lib/theme.jsx` had been renamed to `src/lib/theme.js` in an uncommitted refactor but still contained JSX — Vite production build was rejecting it. Renamed back to `theme.jsx` to restore the build (dev server had been forgiving).*

*Earlier May 20, 2026 (evening) — **Peer-to-peer protocol sharing shipped + polished + test pass.** End-to-end live and verified across these flows during testing: send via ProtocolDetailScreen ⋯ overflow (works for both active and archived protocols; menu order is lifecycle → share → destructive), email-based recipient lookup, three-intent receive (Stack on current / Replace current / Save for later) plus Decline, Library icon green square badge (9+ cap, design-system theme.status.success) showing pending received count, each Received protocol as its own bordered card. Bug found + fixed mid-test: `protocols.source` CHECK constraint allows only `'user'` or `'clinician'` — initial peer-to-peer activate path passed `source: 'shared'` which violated the constraint and silently rolled back the protocol insert. Only Decline worked initially; switched to `source: 'user'` (peer provenance preserved in the `protocol_sends.clinician_id` field for future attribution UI). Also fixed during the same test pass: mobile ProtocolLibrary callsite was missing `userId={user.id}` so the Received fetch was running against `patient_id=eq.undefined` (badge appeared because App.jsx's own fetch had user.id, but the Library Received section never rendered). Added a sibling activate-from-archive intent picker — activating an archived protocol via ProtocolDetailScreen ⋯ now opens a Stack-on-current / Replace-current modal instead of activating immediately, keeping the mental model consistent with the receive flow. Phone-frame containing-block (translateZ(0) + clip-path on body for desktop ≥1024px) was restored after an interim removal — Popover compensates by subtracting bodyRect offset on desktop so its position:fixed coords land correctly under the transformed body. Modal bottom sheets, slide-in screens (SettingsScreen / ProtocolLibrary / ProtocolDetailScreen / SidePanel-as-Modal), and Toast all stay inside the 440px phone-frame on desktop now. DevThemePicker fully deleted (file removed, both call sites removed, `setTheme` removed from theme.jsx context). **Push notification verified end-to-end with Bego** — initial sends were failing silently because the new `notify_protocol_sent` edge function's CORS preflight didn't include the `apikey` header in its `Access-Control-Allow-Headers`. Supabase's gateway requires `apikey` and the client sends it alongside the user JWT in Authorization; the browser was blocking every push request after the OPTIONS preflight. Fixed by expanding `Access-Control-Allow-Headers` to `"Authorization, Content-Type, apikey, x-client-info"` and redeploying via `supabase functions deploy notify_protocol_sent --project-ref yahimlivfieuknagusxp` (commit `e0ccffd`). After the fix, Bego received the push notification immediately on her own device — full peer-to-peer pipeline verified live. Diagnostic kept in `dbNotifyProtocolSent` as `console.log` of response status + body for future debugging without re-instrumentation. **Today's session shipped these commits in order:** `10415af` `7472f9e` `724518a` (DevThemePicker hotfix + Vercel build mode pin), `3ccaf22` (handoff for hotfix), `0381f02` (mobile-only pivot + clinician dashboard parked), `e51057e` `60d1315` (phone-frame polish), `0c3e2f9` (peer-to-peer share shipped), `6efbb8f` `ec4a24d` `88e9f0b` `c31d25f` `4e15a7c` `3a1dc6f` `0d2a997` `628137a` (peer-to-peer polish + Decline + Stack/Replace + archive flow + send-from-archived + menu order + diagnostic toast). WIP branch `wip/clinician-product` at `f1423ca` preserves Templates work for the future clinician product.*

*Earlier May 20 (late afternoon) — **Peer-to-peer protocol sharing shipped.** Any Origin user can now send a protocol to any other Origin user by email. Recipient gets a push notification, opens Origin, sees the protocol in their Received section in Library, and picks one of three intents: **Stack on current** (add as new active protocol alongside existing), **Replace current** (archive their actives, activate this one), or **Save for later** (clone as archived). **What was built:** (1) New `lookup_user_by_email(text)` SECURITY DEFINER Postgres function — resolves an email to `{user_id, display_name}` without exposing arbitrary `auth.users` data; granted to `authenticated`. Sofia ran this in Supabase Dashboard. (2) `dbLookupUserByEmail(email, t)` + `dbNotifyProtocolSent(sendId, senderName, t)` API helpers in `src/lib/api.js`. (3) "Send to someone" entry in ProtocolDetailScreen's ⋯ overflow menu (gated on `!isClinician && isActive && onSendToUser` so it shows for personal users on active protocols, not in the parked clinician path). Opens a compact Modal with email input; submit → lookup → existing `dbSendProtocol` → toast → best-effort push notification. (4) `sendProtocolToUser(protocol, email)` handler in App.jsx; returns `{ ok, error? }` so the Modal can show inline errors ("No Origin user with that email", "That's your own email"). (5) Extended `activateReceived(send, intent)` to take `'stack' | 'replace' | 'save_later'` intents — same semantics as the existing `addProtocol` intent system (replace archives current actives; save_later sets status='archived'). (6) ProtocolLibrary's "Received" section relabeled from "From your clinician" → "Received", rows now tap-to-review, modal shows the supplement-snapshot list + three intent buttons. (7) Library icon in mobile top bar gains a pendingReceivedCount badge (achromatic dot with number, 9+ cap) — fetched on initial load alongside other data, refreshed on visibilitychange (covers "app comes back to foreground"). (8) New Supabase edge function `supabase/functions/notify_protocol_sent/index.ts` — verifies caller JWT, checks `protocol_sends.clinician_id == auth.uid()` so only the actual sender can trigger the push, fetches recipient's push_subscriptions, sends a Web Push ("{sender_name} sent you a protocol · {protocol_name} · N supplements"), auto-cleans 404/410 dead subscriptions. Best-effort: push failure doesn't block the send. **SQL migration (already run by Sofia in this session):** `CREATE OR REPLACE FUNCTION public.lookup_user_by_email(target_email text) RETURNS TABLE(user_id uuid, display_name text) LANGUAGE sql SECURITY DEFINER SET search_path = public, auth AS $$ SELECT u.id, p.display_name FROM auth.users u LEFT JOIN public.user_profiles p ON p.id = u.id WHERE LOWER(u.email) = LOWER(TRIM(target_email)) LIMIT 1; $$; REVOKE ALL ON FUNCTION public.lookup_user_by_email(text) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.lookup_user_by_email(text) TO authenticated;` Initial attempt failed with `column p.user_id does not exist` — corrected to `p.id = u.id` (user_profiles uses `id` as both PK and FK to auth.users.id). **Edge function deploy:** auto-deploys via the Supabase GitHub integration on push to main. **Reuses existing infrastructure:** the `protocol_sends` table (with awkwardly-named `clinician_id`/`patient_id` columns kept as-is — semantically just sender/recipient at the RLS level), existing RLS policies (sender INSERT, recipient SELECT/UPDATE), existing `dbSendProtocol` / `dbGetReceivedProtocols` / `dbUpdateProtocolSend` helpers. The clinician-product fork (parked) can rename these columns later when the dashboard product spins off.*

*Earlier May 20 (afternoon) — **Major product direction reset: Origin is mobile-only. Clinician dashboard is parked and will spin off into its own product.** Mid-test of the Templates surface (today's WIP), Sofia called the cleanup: the desktop clinician dashboard concept has become entangled enough that it should be a separate product that connects to Origin, not bolted on to the personal mobile app. **Decision rationale:** Origin (personal mobile tracker) and the clinician dashboard (Patient Roster + Templates + analytics) serve different users, solve different problems, and have different polish requirements. Mixing them in one App.jsx desktop branch was creating decision drift and friction. **What changed on main:** (1) `App.jsx` `isDesktop` hard-coded to `false` — the entire desktop branch (~700 lines, including PatientRoster, Sidebar, Templates routing, PatientDetailPanel, PatientAnalyticsPanel, send-to-patient flows in clinician chrome) is preserved as dead code but never renders. (2) `Modal.jsx` and `SidePanel.jsx` `useIsDesktop()` now hard-coded to `false` so adaptive primitives always render their mobile (bottom-sheet) variants. (3) `index.html` gained a desktop CSS media query (≥1024px) that constrains body to a centered 440px phone-frame column with subtle achromatic side borders and `translateZ(0)` to keep fixed-position portals (Modal, Toast, Popover) anchored inside the frame instead of stretching across the viewport. All viewports — phone, tablet, desktop — now render the mobile UI; desktop visitors see it in a curated phone-screen frame against a dark canvas. **What's preserved:** the clinician backend (DB tables: `protocol_sends`, `clinician_patient_notes`, RLS policies, analytics math in `lib/adherence.js`, notes API helpers, `dbSendProtocol`) all stay in place — they cost nothing to keep and the future clinician product will rebuild on top of them. **Today's Templates WIP** (Templates.jsx, Sidebar Templates entry, App.jsx wiring, `dbGetTemplates` / `dbGetTemplateSendCounts` / `dbCloneTemplateForOwner` API helpers) was committed to a separate branch `wip/clinician-product` (commit `f1423ca`) and is no longer on main. See the new "Parked: Clinician Dashboard → separate product" section below for the full reactivation playbook and inventory of what was built. Earlier in the day the mid-day hotfix pass shipped (DevThemePicker leak + vercel.json buildCommand pin).*

*Earlier May 20 (mid-day) — **Production dev-mode build leak found + fixed; DevThemePicker hardened against future regressions.** Sofia reported the DevThemePicker (intended dev-only, gated by `import.meta.env.DEV`) was visible on the live site. Investigation found the deployed JS bundle contained `jsxDEV` (React's development JSX runtime) — meaning the entire production build was running in development mode, so `import.meta.env.DEV` evaluated to `true` in production and every dev gate leaked. No repo-side build config had changed; Vercel dashboard inspection (project `origin`) showed Framework Preset = Vite, all Build/Install/Output Override toggles OFF, no `NODE_ENV=development` env var. Root cause not definitively identified — most likely a transient Vercel platform/preset behavior. **Three commits shipped to fix + harden:** `10415af` gated the `/design-system` route's DevThemePicker call with `import.meta.env.DEV` (was rendered unconditionally — public route, so this was already leaking even before the build-mode regression); `7472f9e` added an in-component hostname check inside DevThemePicker as defense in depth (returns null unless hostname is localhost / 127.0.0.1 / 0.0.0.0) so the picker cannot render on the live domain regardless of how the bundle is built; `724518a` pinned `"buildCommand": "vite build"` in `vercel.json` so the production build mode is now deterministic — overrides any dashboard or platform default. Post-deploy bundle verified: 0 `jsxDEV` hits, 0 `DevThemePicker` references, bundle back to production mode. **Side effects:** the dashboard now shows a yellow warning *"Configuration Settings in the current Production deployment differ from your current Project Settings"* — this is expected and intended; `vercel.json` is now the source of truth for the build command. The Templates WIP (Sidebar.jsx, api.js, Templates.jsx, App.jsx imports + state) was stashed during the first hotfix commit and cleanly restored via `git stash pop` — no Templates progress was lost. **Templates state confirmed mid-day:** DB migration already run (`protocols.is_template` column exists, verified via REST probe; `protocol_sends` table exists). API helpers complete (`dbGetTemplates`, `dbGetTemplateSendCounts`, `dbCloneTemplateForOwner`; `dbGetProtocols` filtered to `is_template=is.false`). `Templates.jsx` UI scaffolded with TemplateRow + Send Popover + Use icon + empty state. Sidebar entry wired (FileText icon, `activeNavItem='templates'`). **Only App.jsx wiring remains:** fetch `templates` + `templateSendCounts` on protocol load, add routing branch for `activeNavItem === 'templates'`, implement 4 handlers (`onCreateTemplate` / `onOpenTemplate` / `onSendToPatient` / `onUseForMyself`), then test + ship.*

*Earlier May 20 (mid-morning) — **Supabase edge function auto-deploy is now wired up + redundant-push suppression shipped.** Connected the Supabase GitHub integration (Dashboard → Project Settings → Integrations → GitHub) to `svonhauske-dev/origin`, production branch `main`, working directory `.`, Deploy to production = ON. Verified by pushing a no-op comment change and seeing `recompute_notifications` redeploy automatically (timestamp moved to "a minute ago"). Future edge-function changes now ship by `git push origin main` — no more manual `supabase functions deploy`. The CLI stays installed as a fallback. This closes the next-session-priority item flagged in the May 18 night note. **Also shipped (commit `6f53fbc`, manually CLI-deployed before integration was live): redundant-push suppression in `process_notifications_queue`.** Sofia reported getting evening-slot pushes after she'd already logged the supps slightly early. Root cause: `process_notifications_queue` fires any pending row at `fire_at ≤ now AND fired = false` with no read of `daily_logs.checked`. Fix: at fire time, batch-fetch supps + `daily_logs` for the rows in this tick, and for each row compute the supps assigned to `(user, slot, date)` filtered by day-of-week + `isSupplementActiveOn`. If every assigned supp has a truthy `checked[${date}_${slot_id}_${supp_id}]` key → mark `fired=true`, skip the push. Truthy covers both legacy `true` and the new log-at shape `{ checked: true, at: "HH:MM" }`. Unconditional IF v2 slots (`window_open`, `window_closing`, `fasted`, `course_end` — zero assigned supps) fall through and fire as before since the "0 supps" branch returns false. Cost: two batched queries per cron tick scoped to that minute's users. Negligible.*

*Earlier May 20 — **Hero no-anchor empty state restyled.** Reverted the small "+ Set anchor" pill (D1 implementation) back to the original "Start my day" intent, now as a filled-accent CTA. New shape on today no-anchor: eyebrow → "Not started yet" in the status row (same slot as "Completed" sits on past all-done days) → full-width filled-accent "Start my day" button using `flex: 1` to absorb remaining card height. D1 still holds — logging works without an anchor; the CTA is invitational, not gating. Spacing tuned for vertical rhythm parity with past days: eyebrow `marginBottom: xs`, submeta `marginTop: xs` (was xxs / xxxs), symmetric 19px effective gaps around the centered status text. Hero card stays locked at 132px across past / today / future. Diagnostic notes for future contributors: Card has a 1px border on each side that consumes 2px of the inner space under `box-sizing: border-box`, so the no-anchor pill drops its `minHeight` entirely and relies on `flex: 1` to pick up whatever's left (typically ~30px). Memory file `feedback_hero_card_height.md` saved capturing the card-height parity principle. Also seeded the `b39d3a9d-e498-4a9f-bd1d-43948bce531f` test account with a medication-anchor schedule, 5 backdated supplements (Metformin / Vitamin D3 / Magnesium Glycinate / Probiotic / Methylfolate B12), and daily_logs (today cleared, May 19 = 100%, May 18 = ~70%) for visual QA on past-day Hero states.*

*Earlier May 19 (~1am Mountain) — **Notifications fully fixed. Three stacked bugs, all resolved.** (1) `dbSaveSchedule` was silently flipping `notifications_enabled` to false on every save because the DELETE-then-INSERT pattern lost the column — fixed in `2e34371` by reading the existing value pre-DELETE and merging it back into the INSERT. Sofia's saves had been disabling her own (and patient) notifications without anyone noticing. (2) The deployed edge function was 13 days stale (last deployed May 5, before the May 17 IF v2 work) so Bego's `_if_v2_migrated: true` config hit a legacy code path that needed a daily `pill_time` anchor — but the IF v2 frontend doesn't ask for one. Bego got zero notifications May 17 → May 18 because of this gap. Fixed by deploying via Supabase CLI tonight (installed locally, used a personal access token because OAuth login was erroring with "Unable to create CLI sign-in"). Deploy command: `supabase functions deploy recompute_notifications --project-ref yahimlivfieuknagusxp`. (3) There was no daily cron to refill the queue for users who don't open the app — fixed by the cron-mode branch in the function + pg_cron job calling it every 4 hours with `X-Cron-Secret: 7c8d3f91...` (env var in Supabase Edge Functions Secrets). Plus latent drift fixes: auto-pause now writes `status='paused'` instead of orphan `status='stopped'`; `dbGetSupps` and the function's SELECT filter `deleted_at IS NULL`; `_shared/helpers.ts isSupplementActiveOn` mirrors frontend with `created_at` floor + `deleted_at` ceiling. New `timezone TEXT` column on user_schedule (frontend writes `Intl.DateTimeFormat().resolvedOptions().timeZone` on every save; cron reads it). After deploy + manual cron trigger, Bego's queue went from 0 → 8 rows (next fire: tonight 20:00 Mexico_City, her evening slot). Auto-deploy from GitHub to Supabase Edge Functions remains NOT wired up — future function changes still require manual `supabase functions deploy`. Next time this needs to happen, the SUPABASE_ACCESS_TOKEN can be set as an env var to skip the broken OAuth flow.*

*Earlier May 18 night — **CRITICAL FINDING: Supabase edge function auto-deploy is NOT wired up to this GitHub repo.** Confirmed via Dashboard → Edge Functions → recompute_notifications which shows "Last deployed: May 5" — 13 days old. None of tonight's commits (9b461d4, bb3392a, d78dd29, e4864de) actually reached the deployed function. The production function is still running pre-lifecycle code with no cron-mode branch, no `verify_jwt = false`, no timezone reading, none of the May 18 audit fixes. **This is the root cause of every 401 we chased tonight** — the new auth path simply doesn't exist on the deployed function. The tonight-unblock (Sofia + Bego each open the app once → triggers JWT-mode recompute on the May-5 function code → queue refills for 48h) still works because the May-5 JWT path is intact. **Next-session priority is wiring up a deploy path before any further function changes.** Two options: (1) **Set up Supabase GitHub integration** via Dashboard → Project Settings → Integrations → GitHub. One-time config. Future pushes to main auto-deploy edge functions. (2) **Install Supabase CLI** (`brew install supabase/tap/supabase`) + `supabase login` + `supabase functions deploy recompute_notifications --project-ref yahimlivfieuknagusxp`. One install, manual deploys when needed — closer to standard Supabase workflow. Once a deploy path exists, run a deploy to ship 9b461d4-e4864de, then resume cron verification (CRON_SECRET is already set in Supabase env to `7c8d3f91a4e25b86c0d72f1a5e94b380fcd6a7e2185b4f93c08d6e7a1f2c5b94`, pg_cron job already registered, `timezone` column already added to user_schedule). Alternative simpler cron architectures worth considering before deploying the current design: **Vercel Cron Job** (no Supabase secret management, calls function with anon key) OR **piggyback on `process_notifications_queue`** (the every-minute drain that already works cleanly — extend it to opportunistically call `recomputeForUser` for users with low queue depth). Both sidestep the Supabase gateway auth + pg_cron + CRON_SECRET stack entirely.*

*Earlier May 18, late evening — **Web Push refill bug found + cron-based fix shipped (code only).** Sofia reported notifications stopped firing for her and Bego after the day's lifecycle merge; diagnostic SQL showed `scheduled_future = 0` in `notifications_queue` with `fired_last_24h = 8`. Root cause was a pre-existing design gap: `recompute_notifications` (the function that fills the queue) only ran on user actions from the frontend. With no user activity in 24h, the queue drained and never refilled. The merge timing was coincidental, not causal. Fix: (1) extracted the 450-line per-user recompute body into a new `supabase/functions/_shared/recompute_user_logic.ts` helper; (2) rewrote `recompute_notifications/index.ts` (now 130 lines, was 516) with two modes — JWT path (existing frontend flow) and cron path (loop over all users with `notifications_enabled=true`, refill each using their stored timezone); (3) cron path is authenticated by a new `X-Cron-Secret` header matched against the `CRON_SECRET` env var; (4) added a `timezone TEXT` column to `user_schedule` so cron knows what TZ to use per user (frontend writes `Intl.DateTimeFormat().resolvedOptions().timeZone` on every `dbSaveSchedule`, and the function persists the request's tz to this column on every JWT-path call so it stays fresh); (5) pg_cron job calls the function every 4 hours via `net.http_post`. Three drift bugs fixed in passing (none were the immediate cause but all real): line-78 auto-stop write changed from `status: 'stopped'` (orphan after W1) to `status: 'paused', paused: true`, supps SELECT gained `.is('deleted_at', null)` filter, and `_shared/helpers.ts` `isSupplementActiveOn` now mirrors the frontend with `created_at` floor + `deleted_at` ceiling. Sofia ran `ALTER TABLE user_schedule ADD COLUMN timezone TEXT;` plus the pg_cron registration SQL in the Dashboard. Deploy via Supabase's GitHub integration (auto-deploys edge functions on push to main).*

*Earlier May 18 evening — Handoff cleanup + pre-lifecycle code/file/design-system audit + HIGH cleanup pass. Audit ran as 3 parallel sweeps (code/dead-code, design system, file hygiene). HIGH findings cleared in this session: (1) deleted `src/components/PatientsPanel.jsx` (150 lines, zero callsites — superseded by PatientRoster + PatientDetailPanel); (2) deleted `src/components/ManageProtocolScreen.jsx` (315 lines, zero callsites — superseded by ProtocolLibrary + ProtocolDetailScreen); (3) stripped stale `timePreference` field from `dbUpdateSupp` PATCH body in `src/lib/api.js:199` (column still exists in DB but UI hasn't written to it since the slot system shipped). Sidebar.jsx comment that referenced PatientsPanel adherence thresholds simplified. Handoff doc earlier in evening: removed orphan `---` separators, fixed "Read-only past days" description for post-audit pattern, expanded primitives list (Popover/SidePanel/Sparkline/StatusDot/InlineTip), added clinician surfaces to module structure, re-counted API helpers (22 → 43), corrected App.jsx line count (~554 → ~2040 post-merge), restructured backlog as locked active queue (6 items) + 4 explicitly-discarded items, added "Next session — Lifecycle consolidation + soft delete" section with 3 workstreams + ordered migrations. Three DB migrations run earlier in session: `ALTER TABLE supplements ADD COLUMN deleted_at timestamptz;` (column added; 0 rows touched), `UPDATE supplements SET status = 'paused' WHERE status = 'stopped';` (0 rows), `UPDATE protocols SET status = 'archived' WHERE status = 'paused';` (0 rows — DB was already clean of the soon-to-be-dropped statuses). MED design-system items also cleared in this session: registered `Modal`, `Popover`, `SidePanel` in `src/components/design-system-page/registry.js` via small trigger-button preview wrappers in a new `src/components/design-system-page/previews.jsx` (portal-based components can't render statically in the variant grid — wrappers expose them via click-to-open). Updated `ORIGIN-DESIGN-RULES.md` Category 3: documented Modal `size` prop (default 480 / compact 360), SidePanel context-preserving editing pattern with mobile→Modal delegation via `useIsDesktop`, Popover anchored menu/picker pattern with `PopoverItem` + `PopoverSection` sub-components, and rewrote the "Required for new work" decision tree so future contributors pick the right primitive (Modal vs Modal compact vs SidePanel vs Popover) without needing to read the source.

**Lifecycle consolidation + soft delete shipped — all 3 workstreams in one session.**

**W3 (Soft delete + active-on-date adherence) — fixes the 35-of-36 bug.**
`dbGetSupps` now filters `&deleted_at=is.null` so soft-deleted rows never reach the cockpit. `dbDeleteSupp` is now a PATCH that writes `deleted_at = now()` (was a hard DELETE). New `dbHardDeleteSupp` preserves a real DELETE path for the two cascade/rollback callsites in App.jsx (orphans on protocol delete, rollback on failed `activateReceived` bulk insert) — those write paths intentionally hard-delete since the rows were never user-acknowledged. `isSupplementActiveOn(supp, date)` in `lib/time.js` gained a `deleted_at` ceiling check as defense in depth. Past-day adherence math iterates over the filtered set, so deleting a supp cleanly drops its expected slots from both numerator and denominator (no retroactive % shift).

**W1 (Supp Stop → Pause consolidation).**
Dropped the `stopped` state entirely. EditForm: removed the archive view (`form.status === 'stopped'` branch), the Stop button, the Stop confirm Modal, and the `onStop` / `onResume` / `showStopConfirm` plumbing. App.jsx: deleted `stopSupp`, `resumeSuppFromForm`, and the dead `handleEditFormTogglePause` handler; `resumeSupp` now writes `{ status: 'active', paused: false }` (no more `stopped_at`). `isStoppedSupp` removed from `lib/time.js`. ProtocolDetailScreen tabs flipped from `[Active, Stopped]` → `[Active, Paused]`; Active tab now shows strictly `status='active'` (paused supps no longer mixed in at the bottom). New Paused tab body: `[name + (paused) Badge] ———— [trash icon] [play icon]`. Trash routes through `onDeleteSupp` → soft-delete via `dbDeleteSupp`; Play routes through `onResumeSupp` → status='active'. Active-tab pause icon button is now Pause-only (no toggle-to-resume since paused supps aren't here). EditForm "Edit item" footer ternary that gated on `form.status !== 'stopped'` simplified — that branch is unreachable now. `adherence.js` `getUpcomingEndings` filter swapped `s.paused || s.status === 'stopped'` → `!isActiveSupp(s)`; stopped-supp activity-log branch removed.

**W2 (Protocol Pause → Archive consolidation).**
Dropped the `paused` state for protocols entirely. `dbPauseProtocol` removed from `lib/api.js`; `pauseProtocol` handler removed from App.jsx along with the two `onPauseProtocol={pauseProtocol}` prop callsites. ProtocolDetailScreen: removed `isPaused` and `onPauseProtocol` props; `isArchived` simplified to `!isActive` (any non-active protocol is archived); overflow menu collapsed — Active state offers only Archive (+ Send to patient for clinicians), Archived state offers Activate + Delete. ProtocolLibrary: removed dead `" · Paused"` row badge (the "archived" tab already swallows both states via `status !== 'active'`). `adherence.js` activity-log: removed dead `'paused_protocol'` branch.

**Net surface change:** UI now has exactly two lifecycle states per entity. Supplements: Active / Paused (with soft-delete via trash icon on paused rows). Protocols: Active / Archived. Stop button gone from EditForm; Pause-protocol menu item gone from ProtocolDetailScreen overflow. All Vite-transformed files parse 200 on the dev server.*

*Earlier on May 18 (afternoon) — Phase 3 of the clinician-surfaces audit shipped: **Patient Roster as the default clinician landing** (`483eec0`). New `PatientRoster.jsx` — heading + 3 KPI cards (Total / Need review / Quiet 7d) + filter chips + sortable table (Patient · 7d · 30d · Trend sparkline · Protocols · Last log · Status). Default sort: alphabetical by name (Sofia: "alphabetical always"); columns are click-to-sort, numeric columns default to descending for worst-first triage. Whole-row click opens patient detail. `patientStats` enrichment expanded to capture `lastLogDate` (drives the Last log column + Quiet 7d KPI). Right aside collapses on roster view — there's no patient-scoped content to host; aside reappears when a patient is selected or on My Origin. New `activeNavItem` value `'roster'` (default for clinicians); `'home'` is reserved for My Origin. New **Overview** sidebar entry at top with LayoutDashboard icon — explicit nav back to roster from anywhere, addressing the gap where the only way back was clicking the same patient twice. Earlier in the session: §748 modal-lane completion. `bf41bd3` shipped two new primitives — `Popover.jsx` (anchored floating panel + `PopoverItem` + `PopoverSection`) and `SidePanel.jsx` (right-side 480px panel on desktop, delegates to Modal bottom sheet on mobile) — and migrated 3 misused modals: Patient actions overflow → Popover, Send-to-patient picker → Popover, EditForm → SidePanel. SupplementRow pencil layout shift fixed (always rendered, opacity-faded on hover) so the column doesn't bounce when the cursor passes over rows. `8f1e752` added `size` prop to Modal (compact 360 / default 480), applied `size="compact"` to 6 confirm modals (Archive patient, Stop supp, Orphan supps, Activate received protocol, Archive/Delete protocol, Delete supplement), and flipped flowing-prose body copy from JetBrains Mono → Space Grotesk in confirm bodies + HelperText globally + empty-state subtitles. Principle: monospace for UI labels, identifying names, button text, and data; sans-serif (Space Grotesk) for any flowing-sentence prose. `6073549` converted ProtocolDetailScreen overflow ⋯ menu + Send-to-patient picker to Popovers anchored to the same ⋯ trigger. Then **merged with mobile UX audit from origin/main** (commit `1c6eaec`) — one conflict in App.jsx resolved by keeping both upstream's `logAtTarget` state and the new `'roster'` activeNavItem default. All my changes (PatientRoster wiring, Overview entry, aside collapse, lastLogDate enrichment) preserved through the merge. Next: build the Protocol Templates surface (per design conversation — `is_template` flag on protocols, new sidebar entry below My Origin, "+ New template" + per-row Send-to-patient popover + "Use for myself" clone action).*

*Earlier on May 18 — full mobile patient UX/UI audit shipped end-to-end across 6 sessions on branch `worktree-session-2-autocomplete-expand` and merged into main. All 12 audit recommendations + 4 audit-discovered bugs + the design decision ladder (D1–D5) implemented. Highlights: mobile week strip (extracted DayCell with compact mode), Hero rewritten around a single state-helper (anchor-aware copy ladder, Start-day decoupled per D1, anchor-info as primary status line, success-green unified to status row, inline-edit preserves prefix), past-day pattern (eyebrow inside Hero card with read-only/editing suffix, Edit in header), Day-1 inline tip + reusable `InlineTip` primitive, log-at pill + `LogAtSheet` time-picker with per-supplement timestamp persistence in `daily_logs.checked` (new `{ checked: true, at: "HH:MM" }` shape coexists with legacy `true` via backwards-compat reads — no DB migration needed), take-all on slot icon with first-run InlineTip hint, Onboarding Step 2 live "Your day will look like" preview. Slide-in screen header icons normalized to 18px. Production bundle ~387 KB pre-merge.*

*Earlier May 18 — Three bundled clinician commits landed and pushed: `961d2d6` clinician backend (DB migrations: `clinician-link-migration.sql` adds `shares_adherence_with_clinician` consent toggle + patient↔clinician RLS, `clinician-notes-migration.sql` adds `clinician_patient_notes` table; analytics math in `lib/adherence.js`: `calculateProtocolAdherence` + per-supp + per-slot + `getUpcomingEndings` + `buildActivityLog`; notes API in `lib/api.js`: `dbGetClinicianNote` / `dbUpsertClinicianNote` / `dbGetClinicianNotes`; demo-seed stamps demo patients with `shares_adherence_with_clinician=true`). `738956c` clinician surfaces (PatientAnalyticsPanel new; ProtocolLibrary gains adherence-per-row + send-to-patient; ProtocolDetailScreen send-to-patient flow in overflow menu; SettingsScreen `desktop` prop swaps container shape; Modal primitive `useIsDesktop` → centered 480px / 80dvh card on desktop instead of bottom sheet; WeekStrip `activeSlotIds` plumbed through DayCell so IF v2 ring math doesn't inflate; index.html hides native scrollbars globally). `2ce9af7` chore (gitignore `supabase/.temp/`, untrack `cli-latest` tool artifact). Plus prior `c94792d` clinician desktop — primitives + sidebar revival + top bar restructure. Open §748 decisions still on the table: (1) modal sizing variants (compact/default/wide), (2) Onboarding + IFMigrationScreen desktop treatment, (3) Settings/Library/Detail host when aside collapses on roster view, (4) EditForm duplication across desktop/mobile branches. Next implementation: Phase 3 (Patient Roster as default landing).*

*Previous milestone (May 17): IF v2 shipped + follow-up bugs fixed + full frontend/backend audit done across three rounds. Critical: schedule-not-saving bug traced to `dbGetSchedule` returning every user's rows because RLS wasn't on; client-side `user_id=eq.` filter added to dbGetSchedule + dbGetAdherenceCounts + dbGetSupplementHistory + dbGetReceivedProtocols; RLS enabled at the DB perimeter via Supabase Dashboard; UNIQUE constraints added on `user_schedule(user_id)`, `daily_logs(user_id, log_date)`, `user_supplement_history(user_id, name)`. Design system tightened: dead Light/Dark/Terminal-* themes deleted (production bundle −10.5KB), single makeSegBtnStyle helper replaces three local copies, shadows.elevated added, touch.row applied to multi-line rows. Backend hardened: cascade-delete on protocol delete, transactional rollback on activateReceived, refreshSession memoized, recomputeNotifications surfaces failures via toast.*
*Owner: Sofia von Hauske (sofiavonhauske@gmail.com)*
*Purpose: Hand this document to a fresh AI chat to pick up Origin work without losing context.*

---

## Maintenance Protocol (NEW)

**This document is the source of truth for Origin's state.** At the end of every working session:

1. Update the "Last updated" line at the top with date and one-line session summary
2. Add new shipped features to "Features Shipped" section
3. Add new bug fixes to "Bug History"
4. Update "Today's Major Work" with the session's actual passes
5. Update "Pending Queue" — remove completed items, add new ones surfaced
6. Update "Known Stale / Legacy Items" if any new debt is created or cleared
7. Update Supabase schema reference if columns/tables changed
8. Update component inventory if new components shipped or any renamed/removed

**Sofia's workflow:** download updated doc → save to repo → next session reads it fresh.

Both Claude (chat) and Claude Code (in Cursor) reference this document for continuity. Keep it accurate; future sessions depend on it.

---

## Parked: Clinician Dashboard → separate product (May 20, 2026)

**Decision:** Origin ships as a mobile-only personal supplement tracker. The clinician dashboard — Patient Roster, Templates, send-to-patient flows, patient analytics, clinician chrome — becomes its own product that connects to Origin via shared backend (Supabase). The two surfaces are not the same app.

**Why:** Different users (patient vs clinician), different problems (personal tracking vs cohort management), different polish requirements (mobile-first warmth vs clinical-instrument density). Mixing them in one App.jsx desktop branch caused decision drift and friction (e.g. "Templates" sidebar entry vs "Protocol Library" right-aside — two surfaces, same domain, confusing verbs). Splitting cleanly now is cheaper than refactoring after more entanglement.

**State on main as of May 20 afternoon:**
- `App.jsx` constant `isDesktop = false` (line ~316). The entire `if (isDesktop) { ... }` desktop branch (~700 lines starting around line ~1450) is preserved as dead code but never renders. All viewports route through the mobile branch.
- `Modal.jsx` and `SidePanel.jsx` `useIsDesktop()` hard-coded to `false`. Adaptive primitives always render their mobile (bottom-sheet) variants. Desktop variants preserved as dead code.
- `index.html` has a `@media (min-width: 1024px)` block that constrains `body` to a centered 440px phone-frame column with subtle achromatic side borders. `transform: translateZ(0)` on body makes it a containing block so fixed-position portals (Modal bottom sheet, Toast, Popover) anchor to the phone-frame edges. Desktop visitors get a curated mobile-screen frame against a dark canvas.

**Dead-code inventory (what to delete OR salvage when the clinician product spins off):**
- `src/components/Sidebar.jsx` — clinician left sidebar with patient list, search, KPI ("N need review"), Overview + My Origin footer.
- `src/components/PatientRoster.jsx` — default clinician landing (KPI cards + filter chips + sortable patient table).
- `src/components/PatientDetailPanel.jsx` — patient cockpit (their week strip + slot view, read-only).
- `src/components/PatientAnalyticsPanel.jsx` — clinician diagnostic stack (per-supp + per-slot adherence + clinician notes textarea).
- `src/App.jsx` desktop branch — top bar (`Origin` wordmark + AccountAvatar), three-panel row (Sidebar + main + right aside), `showRoster` routing, `activeNavItem` ('home' / 'roster' / 'templates'), clinician-only effects (lines ~370–460: patients fetch, patient stats enrichment, lastLogDate, patientTrendLogs, etc.), `sendProtocol` handler (line ~1274), `activateReceived` handler (line ~1252), `dbSendProtocol` API helper usage.
- `AccountAvatar` named export inside `Sidebar.jsx` — used by desktop top bar.

**Clinician backend that stays on main (cheap to keep, future product will reuse):**
- DB tables: `protocol_sends`, `clinician_patient_notes`. RLS policies for clinician→patient reads.
- `lib/adherence.js` analytics math: `calculateProtocolAdherence`, per-supp + per-slot rollups, `getUpcomingEndings`, `buildActivityLog`.
- `lib/api.js` helpers: `dbSendProtocol`, `dbGetClinicianNote`, `dbUpsertClinicianNote`, `dbGetClinicianNotes`, `dbGetPatientsForClinician`, `dbActivateProtocolSend`.
- `protocols.is_template` column on the protocols table (column exists, currently unused since dbGetProtocols filter was reverted with the WIP rollback).
- `user_profiles.is_clinician` flag.

**WIP preserved on branch `wip/clinician-product` (commit `f1423ca`):**
The full Templates surface as of May 20 mid-day — `Templates.jsx` (TemplateRow + Send Popover + Use icon + empty state), Sidebar Templates entry with `FileText` icon, App.jsx wiring (initial-load fetch, `createTemplate` handler, `useTemplateForMyself` handler, routing branch, archive/activate/delete/update keep templates state in sync, send-count optimistic update), `dbGetTemplates` / `dbGetTemplateSendCounts` / `dbCloneTemplateForOwner` API helpers, `dbGetProtocols` filtered to `is_template=is.false`.

**Reactivation playbook (when spinning the clinician product off):**
1. Decide architecture: separate Vite app in a sibling directory, separate Vercel project, shared Supabase backend? Or monorepo with two builds? Most likely: separate repo + separate Vercel project, sharing Supabase keys (anon + RLS already handles per-user access).
2. Copy the dead-code components (Sidebar, PatientRoster, PatientDetailPanel, PatientAnalyticsPanel, clinician chrome from App.jsx) into the new app.
3. Cherry-pick `wip/clinician-product` (commit `f1423ca`) for the Templates surface, OR rebuild on top of the cleaner architecture.
4. Strip the dead code from Origin's `main` (App.jsx desktop branch, Sidebar.jsx, PatientRoster.jsx, etc.) once the clinician app is its own deployable surface. Keep `is_clinician` flag + clinician backend helpers — they're useful for the connection (e.g. clinician app reads patient data via the existing RLS-gated queries).
5. Establish the connection point: probably "this clinician can see these patients" — already modeled by the existing `is_clinician` + RLS policies + (TODO) clinician-patient link table from `clinician-link-migration.sql`.

**Hard rule going forward:** Do not add new clinician-facing features (patient lists, templates, send flows, analytics) to Origin's `main`. Either build them in the clinician product (when it exists) or branch off `wip/clinician-product` for prototyping. Origin's `main` is for personal-mobile-tracker features only.

---

## What Origin Is

Origin (formerly Tether) is a personal supplement and medication tracker built around anchor-based scheduling. The core insight: most supplements need to be timed relative to *when you take your medication* (or *when you wake up*, or *when you eat*) — not at fixed clock times. Origin makes those cascading schedules legible and trackable.

**Live:** [origin-protocol.vercel.app](https://origin-protocol.vercel.app)
**Repo:** [github.com/svonhauske-dev/origin](https://github.com/svonhauske-dev/origin)
**Stack:** React + Vite, Supabase (project `yahimlivfieuknagusxp`), Vercel
**Built via:** Claude Code in Cursor with AI orchestration

**Users (production, 5 registered accounts after May 22 test-cleanup; was 12 pre-cleanup):**
- Sofia (sofiavonhauske@gmail.com) — `68848e43-3c43-4259-b4ff-bc4f8e3a37ab` — active
- OVH (ovh@contranyc.com) — `dce9c618-7475-4f39-a492-8b6b43c6a339` — display name "Tulum", active
- Bego (bego_bayon@hotmail.com) — `db10e317-0089-4dad-8368-5b69f26ccc11` — display name "Bego Bayón", active (IF mode)
- Isabela (isabelafreydellv@gmail.com) — `45665dbc-7bc8-4845-a445-f72e7ba640df` — signed up May 13 (kept through May 22 cleanup as a real user)
- Mariana (marianabayon2@gmail.com) — `528b93bd-9686-4d69-92f0-9467400196f9` — signed up May 14 (kept through May 22 cleanup as a real user)

**Activity totals (as of May 11):** 49 supplements across all users, 30 daily logs, 68 notifications queued, 3 users with schedule rows, 2 users with `notifications_enabled = true`.

---

## Visual Identity (NEW — locked May 11)

**Direction:** Terminal Achromatic — precision-instrument aesthetic inspired by Marathon (Bungie) and Raw Materials editorial design.

After exploring four directional themes (Clinical Instrument, Editorial Material, Soft Futurism, Terminal Precision) and five Terminal color variants (Amber, Cyan, Phosphor, Achromatic, Magenta), **Terminal Achromatic** was selected as Origin's production identity. The other directions and variants remain accessible via the dev theme switcher for future reference.

**Palette (Achromatic):**
- Surface base: near-black `#0D0D0D`
- Surface elevated: `#1A1A1A`
- Text primary: pure white `#FFFFFF`
- Text secondary: `#A0A0A0`
- Text muted: `#666666`
- Accent: pure white `#FFFFFF` (no chroma)
- Borders: subtle `#2A2A2A`, strong `#404040`
- Status success: muted green `#5FE090`
- Status danger: cool red `#FF6060`
- Status warning: amber `#FFC040`
- "Now" state: pure white tint

**Typography:**
- `fontBody` — JetBrains Mono (body text, button labels, supplement names)
- `fontHeading` — Space Grotesk (section labels, greetings, large displays)
- `fontData` — JetBrains Mono (numbers, times, percentages, technical content)

**Radius:**
- Zero across all UI elements (`radius.xs/sm/md/lg/xl` all = 0)
- `radius.full` (9999) reserved for genuinely circular shapes only (adherence rings, avatars, status dots)

**Borders:**
- 1px sharp, no shadows
- Depth via tonal value, not material effects

**Production theme system:**
- Achromatic is the ONLY production theme
- `VALID_PREFS = ["achromatic"]` — no other production preferences
- Light, Dark, and System preferences silently migrate to Achromatic on next load
- Settings theme picker removed entirely (no choice in production)
- Dev theme switcher retained for variant exploration (Light, Dark, Terminal Amber, Cyan, Phosphor, Achromatic, Magenta)

**Reference voices:** Marathon (Bungie), Raw Materials editorial design, NASA mission control, lab terminals. NOT: wellness apps, lifestyle apps, generic productivity SaaS.

---

## Design System State

The design system uses a token-based theme architecture. All components consume `theme.*` tokens via `useTheme()`. Single token change propagates to every relevant element.

**CSS variable font system:** `typography.fontBody/fontHeading/fontData` resolve to `var(--font-body/heading/data)`. ThemeProvider sets those CSS vars on every theme change. All existing components automatically get the right font for whichever theme is active.

**Primitives:**
- `Button` — variants: primary, secondary, tertiary, destructive, icon, selector, startDay (+ size: default/compact)
- `Input` — text / time / number variants. `colorScheme: dark` so native UI renders correctly. Time picker indicator hidden globally in index.html.
- `Card`
- `Badge` — variants: now / missed / category / neutral
- `Label`
- `Modal` — bottom sheet on mobile (drag-to-dismiss), centered modal on desktop (`useIsDesktop` hook, 480px max / 80dvh max). `size` prop: `compact` (360px) / `default` (480px).
- `Toast` — supports optional `action` prop for Undo affordances, top-anchored
- `TabBar` — keyboard-accessible tab buttons (`minHeight: touch.min`)
- `InlineTip` (NEW May 18) — dismissible inline tip, `localStorage`-backed under `origin.tip.<id>`; powers Day-1 explainer + take-all hint
- `Popover` (NEW May 18) — anchored to a trigger; replaces misused modals for overflow menus + send-to-patient picker
- `SidePanel` (NEW May 18) — slide-from-right panel; hosts EditForm on mobile and desktop
- `Sparkline` — single-color SVG trend line for dense list rows (clinician roster)
- `StatusDot` — colored 4–6px dot keyed by status token

**Notable patterns:**
- Pill width-locked via CSS `::before` pseudo-element so bold-active state doesn't cause layout shift
- Border hierarchy inverted: inactive selectors use `borderSubtle`, active selectors use `accent` border
- `schedSaveRef` ref pattern bridges ScheduleModal's internal save handler to footer button
- Three-tier helper text convention (T1 section explanation, T2 item description, T3 inline unit hint)
- Copy voice convention — "considered, precise instrument":
  - Architectural restraint as baseline
  - Sentence case throughout (not title case)
  - No exclamation marks, no marketing energy
  - All inline errors and toasts: period-free
  - Generic noun is "item" not "supplement" (Origin tracks Oral/Rx/Injectable/Topical)
  - "Your" not "the" (your protocol, your schedule, your anchor)
  - Reference voices: Bear, Things 3, Apple Health for mobile; Marathon, Raw Materials, lab terminals for visual identity

---

## Features Shipped

**4 schedule modes UI, 5 underlying values** (default for new users = No Schedule):
- No Schedule — pure checklist, no times, no notifications
- Anchor (groups Medication + Wake Up) — onboarding and Manage Protocol show 4 cards in a 2×2 grid; tapping Anchor reveals a sub-selector below the grid (Medication / Wake Up); DB stores `medication` or `wakeup` directly (never `anchor`; no migration needed)
- Intermittent Fasting — built around a fixed eating window (IF v2, shipped May 17): user sets a daily window start time + duration (4/6/8/10/12 hr) + meal count (2 or 3) + optional Evening slot. Slot times are absolute (like Fixed mode), not relative to a daily anchor. Existing v1 users (anchor-relative window) are upgraded through IFMigrationScreen on next load. New fasting users skip the migration screen.
- Fixed Times — same schedule every day

**Categories:** Oral, Rx, Injectable, Topical (with category-aware form behavior)

**Slot vocabulary (non-IF modes — Medication, Wakeup, Fixed):**
- Anchor (Medication Anchor mode only)
- Pre-Breakfast, Breakfast
- Pre-Lunch, Lunch
- Pre-Dinner, Dinner
- Evening (time-of-day bucket — Fixed time OR Before sleep)
- Anytime (explicit pill, stored as `slots: []`) — optionally carries a `pinned_time` ("HH:MM") to become a fixed-time reminder independent of the cascade, in any mode (June 23; see "Pinned-time (anytime) supplements" in schema reference)

**Slot vocabulary (Intermittent Fasting v2):** entirely separate IDs — never appear outside fasting mode.
- Fasted (pre-window — 30 min before eating window opens)
- Meal 1 (window opens — fires unconditionally as the "your eating window is open" notification)
- Pre-Meal 2, Meal 2 (visible when meal_count ≥ 2)
- Pre-Meal 3, Meal 3 (visible when meal_count ≥ 3)
- Evening (only when evening_mode is set — Fixed time OR Before sleep)
- Anytime (explicit pill, `slots: []`)
- Window closes — unconditional 30-min warning, suppressed when a meal slot with supplements fires at the same minute (so default pre_meal_window=30 doesn't stack a meal notification on top of the closing warning).

**Recoverable late state** — slots that pass without check-ins get a small muted ochre "late" badge. Slot card stays standard. Frame is "you can still take this," not "you failed."

**Protocol Library** (replaces ManageProtocolScreen, May 16):
- Slide-in screen at zIndex 101 with Protocols nav button at top-right of home screen
- Two tabs: Active / Archived, both always visible with empty states
- Active tab lists protocols with supplement count and end date (if scheduled)
- Archived tab lists all non-active protocols alphabetically
- "+" button opens two-step new protocol modal:
  - Step 1: Name + Duration (Indefinite / Scheduled with dates / For a set time: N weeks or months)
  - Step 2 (skipped if no active protocols): Intent — Replace current / Stack on top / Save for later
  - Intent "replace": archives all active protocols + resets their supplements, creates new as 'active', shows toast "[Name] created · [Old] archived"
  - Intent "stack": creates new as 'active', existing protocols unchanged
  - Intent "save_later": creates new as 'archived' (library entry, not active)
- Tapping a protocol row pushes ProtocolDetailScreen

**ProtocolDetailScreen** (new, May 16, zIndex 102):
- Inline name editing in header (tap → input → blur saves)
- Two lifecycle action buttons at top of content, above tabs: varies by protocol status
  - Active: Pause + Archive (side by side)
  - Paused: Activate + Archive (side by side)
  - Archived: Activate + Delete (side by side)
- Confirmation modals for each destructive action
- Two tabs: Active supplements / Stopped supplements (both always visible with empty states)
- "+" FAB-style button to add supplement directly into this protocol
- Supplement rows show name + dose, tap to edit

**Share as PDF** (shipped May 22):
- ProtocolDetailScreen overflow menu gains "Share as PDF" action (sits above Delete, available on both active and archived protocols — you might want to share something you ran last year)
- Generates single-page (US Letter, portrait) printable artifact
- Design: Terminal Achromatic translated to print — white surface, near-black text, JetBrains Mono + Space Grotesk, zero radius, hairline rules
- No times anywhere — the PDF describes protocol shape, not execution
- Owner name in status row: `For: [display_name]  ·  Active  ·  Started [Month D, YYYY]  ·  [treatment mode]` (treatment mode resolves to "Indefinite" / "Through [date]" / "Scheduled")
- Supplements grouped by slot in display order (SLOTS for non-IF modes, IF_SLOTS for IF v2; Anytime bucket renders last); category icons (Pill / Syringe / Droplet) match on-screen Lucide vocabulary; Oral reserves the icon column space but draws nothing so alignment holds
- Metadata column shows ONE string per row (precedence: cycle pattern → scheduled-through date → day restriction → notes, notes truncated to ~30 chars)
- Paused + soft-deleted supps are excluded
- Empty state (zero active supps): renders "No active items in this protocol." centered in JetBrains Mono 13pt #666666
- Pagination defensive: header + status row repeat on each page, slot label gets "(cont.)" suffix on continuation pages, supplement rows never split
- Mobile: triggers native Web Share API share sheet (`navigator.canShare({ files: [pdfFile] })`); falls back to download blob; AbortError on share-sheet dismiss is silent
- Toast copy (achromatic identity, period-free, no celebration): "Protocol shared" / "Protocol downloaded" / "Could not generate PDF"
- Implementation: `pdf-lib@^1.17.1` + `@pdf-lib/fontkit@^1.1.1` for custom font embedding; JetBrains Mono Regular/Medium + Space Grotesk Regular/Medium hosted in `public/fonts/`
- Single export entry point: `src/lib/pdf.js` → `exportProtocolPdf({ protocol, supps, profile, schedule })` → `Blob`
- Bundle: `pdf.js` is dynamic-imported inside the share handler so pdf-lib doesn't bloat the main bundle (~510KB gzipped chunk loads only on first Share click)
- Lucide icon paths hardcoded in `LUCIDE_PATHS` constant (`lucide-react@1.14.0`) to avoid runtime dependency on lucide-react internals

**Protocol lifecycle semantics:**
- Active: shows on home screen. Pausing/archiving resets all supplements in that protocol to `status: 'active', paused: false` (template reset, not a user-state change)
- Multiple active protocols stack: home screen shows supplements from all active protocols simultaneously
- `homeSupps` filter: `(!s.protocol_id || activeProtocolIds.has(s.protocol_id))` — supplements without protocol always appear

**Settings panel** (slide-in screen, view-based sub-navigation, May 16):
- Main view: Schedule → "Edit schedule" row / Account → "Edit account" row / Notifications / Sign out
- Schedule view: ScheduleTab inline (same component used in old ManageProtocol)
- Account view: display name, email, password change
- Back button returns to main view or exits Settings
- (Theme picker removed in production — Achromatic is the only theme)

**Onboarding flow** for new users:
- Triggered when no `user_schedule` row exists
- Two-step: schedule type selection → optional configuration (skipped for No Schedule)
- Full-screen, not a modal
- Returns success/failure to gate dismissal

**Auth:** Supabase with refresh tokens (stores access + refresh, `supa()` helper retries on 401)

**Manage Account** (now dissolved into Settings as inline sections):
- Display name (editable, used for personalized greeting)
- Email (with confirmation flow via Supabase)
- Password change (with complexity validation)

**`user_profiles` Supabase table** — separate from auth.users, holds display_name and any future user metadata. RLS-protected per-user.

**Full auth screen validation:**
- Email regex check, password complexity rules (8+ chars, uppercase, number, special character)
- Live PasswordRule checklist with check icons
- Submit button disabled until valid
- Three error cases handled inline (wrong credentials, email taken with "Sign in instead?" link, generic)
- Mode-distinct copy: "Welcome back" / "Pick up where you left off" for sign-in, "Hello" / "Let's set up your protocol" for sign-up

**Read-only past days** (mobile + desktop):
- Past days default to read-only mode
- Mobile (post-May 18 audit): no opacity dim. Hero card carries an eyebrow `Viewing [date] · read-only` (suffix `text.muted`) or `Viewing [date] · editing` (suffix accent white) when editing. Edit/Done lives in the top-right of the App header (replaces the `+` icon on past days, alongside the Library icon). Late-slot badge uses `variant="neutral"` (achromatic) in read-only mode, `variant="missed"` (warning ochre) when editing.
- Desktop: PAST DAY label in Today panel header, slot rows still expandable for review. Edit button in panel header.
- Edit mode allows ONLY checkbox toggling, pill_time editing, and (post-Session 5) log-at retroactive timestamps.
- Add/edit/delete supplements and schedule editing remain hidden in both states

**Length of treatment (per-supplement, via `treatment_mode` column):**

Three modes, default `indefinite`:
- **Indefinite** — no date bounds, always active. `isSupplementActiveOn()` returns true unconditionally.
- **Scheduled** — uses `starts_at` and/or `ends_at` date fields. Adherence and notifications filtered by date bounds. Edge function auto-stops supplements when `ends_at ≤ today` (sets `status = 'stopped'`, `stopped_at = today`).
- **Cycled** — uses `cycle_on_value` + `cycle_on_unit` + `cycle_off_value` + `cycle_off_unit`. Modulo math in `isSupplementActiveOn()`: `daysSinceStart = (date - starts_at) in days`, `cycleDays = onDays + offDays`, `active = (daysSinceStart % cycleDays) < onDays`. Days-of-week picker hidden for cycled mode (all days implied). Which-days adherence check skipped for cycled supps. Cycle units: `days`, `weeks`, `months`.

Treatment selector appears in EditForm between Category and "When to take it" sections (reordered Treatment-first in commit 28b3e3b).

Insights panel (desktop) shows "Upcoming" section with supplements ending in next 14 days. Format: "Berberine course ends Fri" (up to 3 visible, "+N more" overflow).

**Pinned-time (anytime) supplements (June 23):**
- `supplements.pinned_time` (text, nullable, `"HH:MM"`). Only meaningful on an **anytime** supp (empty `slots`). Set in EditForm via the "Specific time (optional)" picker, shown only when no slot is selected; cleared automatically if a cascade slot is later added (`EditForm.toggleSlot`), and nulled defensively on save if `slots` is non-empty (`submitForm`).
- A pinned supp fires a reminder at that exact local clock time **every active day, in any schedule mode** — the only notification path that works in `none`/No-Schedule mode. It stays outside the cascade (no offset → invisible to `computeAdaptiveDelta`) and keeps the `${dk}_anytime_${suppId}` check namespace, so checks/adherence/daily totals are unchanged.
- **Display (App.jsx):** `anytimeSupps` splits into `pinnedSupps` (own flat single-item cards, interleaved into the day by clock time via the `mergedCards` loop) and `untimedSupps` (the existing "Anytime · No specific time" card). Zero pinned supps → ordering identical to before. Pinned cards render through `SlotCard`'s `single` mode (flat row, no expand/chevron, name shown once, time + status badge on the right).
- **Notifications (`recompute_user_logic.ts`):** supps select includes `dose, pinned_time`; an emission block at the top of the day loop pushes a row per pinned supp keyed `pinned_${supp.id}` (sw.js branches on `data.type`, not `slot_id`). The `mode === "none"` early-exit only short-circuits when there are no pinned supps (`hasPinned`).

**Stop a supplement (via `status` column):**
- `status` column on supplements: values `active`, `paused`, `stopped`. Replaces legacy `paused` boolean (which still exists but unused).
- Stop button in EditForm (existing supplements only) → confirmation modal → sets `status = 'stopped'`, `stopped_at = today`
- Confirmation modal: "Stop this supplement? This moves it to your archive. You can restart anytime."
- Archive (Stopped tab in Manage Protocol) shows: name + dose + stopped date + adherence count
- **Note:** Stopped supplements cannot currently be restarted from UI (despite the confirmation copy suggesting "you can restart anytime"). Real product gap to address.
- Delete moved from EditForm to Stopped tab only (gated behind Stop placement)
- Friction hierarchy: Pause = toast undo, Stop = confirmation modal, Delete = modal (gated behind Stop)

**Supplement name autocomplete:**
- Static curated list (~300 entries) in `src/data/supplements-database.js`
- Per-user personal history table `user_supplement_history` (RLS-protected)
- 3+ character trigger with 200ms debounce
- Dropdown below input, max 5 results (capped to fit without scroll)
- Personal additions automatic on new supplement creation (not on edits)
- Free-text always allowed (never blocks input)
- Names only — no dose pre-fill (deliberate scope to avoid recommending)

**Cascading meal times (Phase 1):**
- Replaces per-meal manual offsets with global cascade rules
- `first_meal_offset_hours` — hours after anchor before first meal
- `meal_interval_hours` — hours between subsequent meals (uniform spacing)
- `evening_mode` — Off / Fixed time / Before sleep
- Auto-infer migration silent for uniform legacy schedules

**Fixed Times pre-meal window (Phase 2 Prompt B):**
- Single global `pre_meal_window` field for Fixed Times mode
- Replaces individual pre-meal time pickers
- 4 meal time pickers (Breakfast/Lunch/Dinner/Evening) + global pre-meal offset
- Pre-meal slot times derived from meal_time minus pre_meal_window

**Injectable/Topical inline (Phase 2 Prompt C):**
- Unified slot picker for all four categories
- Icons render to right of name (variable position based on name length)
- Lucide icons: Pill (Rx), Syringe (Injectable), Droplet (Topical), no icon for Oral
- Migration moved existing Injectable/Topical to slots: [] (Anytime)

**IF window closing notification + cleanup:**
- "Your eating window opens" fires unconditionally at anchor time (independent of supplements)
- "Your eating window closes in 30 minutes" notification 30min before window end
- New slot IDs: `window_open` and `window_closing` (distinct from `rx` for semantic clarity)
- rx slot hidden from IF mode in EditForm
- Migration removed rx tag from any IF user supplements
- **Note — client SLOTS vs. edge function slot IDs:** `src/lib/notifications.js` exports a client-side `SLOTS` object with 8 entries (`rx`, `pre_breakfast`, `breakfast`, `pre_lunch`, `lunch`, `pre_dinner`, `dinner`, `after_dinner`) used for UI display. `window_open`, `window_closing`, and `course_end` exist only inside the `recompute_notifications` edge function and `notifications_queue` table — they are not in client SLOTS and never will be.

**OVH timezone fix:**
- visibilitychange listener compares `Intl.DateTimeFormat().resolvedOptions().timeZone` to last known
- If different on app foreground, immediately calls `recomputeNotifications(token)` with new timezone
- Wipes and rebuilds 48-hour window at correct local times
- Self-corrects automatically next time user opens the app

**Web Push notifications (fully shipped):**
- Service Worker registered at `/sw.js`
- VAPID subscription flow: `subscribeToPush()` / `unsubscribeFromPush()` / `getCurrentSubscription()` in `src/lib/notifications.js`
- Notifications toggle in Settings (with iOS PWA install gate + permission-denied copy)
- `recompute_notifications` edge function: generates today + tomorrow (48hr window), auto-stops supplements past `ends_at`, fires for all slot types + IF window events + course_end
- `process_notifications_queue` edge function: pg_cron every minute, sends Web Push via `web-push@3`, auto-deletes dead subscriptions (404/410)
- Slot IDs in queue: `rx`, `pre_breakfast`, `breakfast`, `pre_lunch`, `lunch`, `pre_dinner`, `dinner`, `after_dinner`, `window_open`, `window_closing`, `course_end`
- Travel timezone auto-fix: `visibilitychange` listener triggers recompute when timezone changes
- 2 of 4 users currently subscribed, 68 notifications in queue as of May 11

**Notification opt-in prompt (NotificationPrompt.jsx):**
Full-screen prompt shown to new users immediately after first sign-in when they have no existing push subscription. "Want reminders?" heading with body copy ("Origin can ping you when it's time to take your medication and supplements. You can change this any time in Settings."), a primary "Enable reminders" button, and a tertiary "Maybe later" button. Triggered in App.jsx via `needsNotificationPrompt` state (set when subscription check returns null on first load). Entirely skippable — both paths dismiss the prompt. Settings toggle remains the persistent control.

**Notifications toggle refactored to On/Off selector:**
- Settings (SettingsScreen.jsx) and dead-code SettingsModal.jsx — replaced iOS-style circular switch with two `Button variant="selector"` buttons (On / Off), consistent with Treatment, Category, and Anchor sub-mode selectors. Disabled state on On when permission = denied; helper text covers all permission states. Design system registry updated with three binary selector examples. Commit `f897a42`.

**HIG foundational accessibility (shipped May 12):**
- **Touch targets:** SlotCard expand header converted from `<div>` to `<button aria-expanded>`. SlotCard checkbox converted from `<div>` to `<button aria-label aria-pressed>` with 44pt tap area (padding: 10 / margin: -10, visual 24px preserved). WeekStrip nav arrows: `minWidth: 32, minHeight: 32`. SupplementRow pencil: `minWidth: 32, minHeight: 32`. Hero "edit" button: `minHeight: touch.min` with inline-flex centering.
- **`prefers-reduced-motion`:** Global CSS rule kills all transitions and animations. Four HIG-compliant exceptions re-enabled via CSS class overrides: Loader rings/dot, Toast slide-in, SupplementRow checkbox transition, and row hover (SupplementRow, SidebarNavItem, DayCell). CSS classes: `.toast-item`, `.supp-checkbox`, `.supp-row`, `.sidebar-nav-item`, `.day-cell`. Loader exception in its inline `<style>` block. All others in `index.html`. Rationale comments at each override site. Category 9 of ORIGIN-DESIGN-RULES.md and CLAUDE.md updated with exception list and future-contribution guidance.
- **`:focus-visible`:** `outline: 1px solid #FFFFFF; outline-offset: 2px` in `index.html` — keyboard navigation only, no mouse focus rings.
- **Modal keyboard:** Escape key closes any open modal. Tab key trapped within sheet (cycles first→last focusable element). First focusable element auto-focused 50ms after open (allows enter animation).
- Commits: `f2b3da4` (touch targets + reduced-motion + focus states), `c6ff004` (reduced-motion exceptions).

**Design system reference page (`/design-system` — public, portfolio-linked):**
- Publicly accessible at `origin-protocol.vercel.app/design-system`
- Foundation sections auto-rendered from `design-system.js`: Palette (all 7 themes), Typography scale, Spacing scale, Radius tokens, Shadow tokens
- Component registry in `src/components/design-system-page/registry.js`: all primitives (Button 14 variants, Input 5, Card 4, Badge 4, Label 2, AdherenceRing 6) and all composed components (Hero 5, SlotCard 5, SlotRow 4, SupplementRow 5, DayCell 5, InsightsPanel 2)
- Playgrounds for interactive primitives: Button, Input, AdherenceRing — live theme-aware rendering
- DevThemePicker always shown on this route (even in production) for portfolio theme exploration
- Full-width IntroHeader band: "Origin Design System" heading + description + "← Back to Origin" link
- Mobile: sidebar collapses to sticky horizontal scroll nav strip (1024px breakpoint, same as app)
- `noindex` meta tag (not search-indexed but portfolio-visible)
- `/design` redirects to `/design-system` (legacy URL)
- Stub data: all generic (Vitamin D3, Magnesium Glycinate, Metformin, Tirzepatide) — no personal data

**Loader animation:**
- Full-screen wave-ring loader for auth and protocol load states
- Minimum 3000ms display time (commit 3c38e6a) prevents jarring flashes on fast loads
- Frozen theme colors during animation prevent reset on theme switch
- Single continuous instance across auth and protocol loading (commit dab4f54)
- Inline loader variant for in-button / toggle loading states

---

## EditForm — Current Field Order

(Verified May 11 via diagnostic. Order matters — Treatment was reordered first within its grouping in commit 28b3e3b.)

1. **Name** — text input with autocomplete (history + static DB, max 5 results, no scroll)
2. **Dose** — text input
3. **Notes** — text input
4. **Category** — selector: Oral / Rx / Injectable / Topical
5. **Treatment** — selector: Indefinite / Scheduled / Cycled
   - If Scheduled: Starts (date) + Ends (date, optional)
   - If Cycled: On (value + unit) + Off (value + unit) + Starts (date)
6. **When to take it** — selector: rx (shown if mode = medication OR already tagged), pre_breakfast, breakfast, pre_lunch, lunch, pre_dinner, dinner, after_dinner, Anytime
7. **Which days** — circle day-of-week buttons (hidden when treatment_mode = cycled)
8. **Stop button** — edit mode only, at bottom, destructive style

---

## Desktop Responsive Home (NEW — shipped May 11)

Locked direction: responsive (same content, broader layout on desktop). Hard breakpoint at 1024px. Below: mobile rendering exactly as today. Above: new two-region cockpit layout with persistent left sidebar.

**Phase 1 — Sidebar + layout shell:**
- 240px persistent left sidebar
- Brand wordmark at top ("Origin")
- Nav items: Home (active), Protocol
- Settings at bottom of sidebar (bottom-left)
- Account avatar top-right of content area
- Greeting "Hello, [name]" top-left of content area
- Sidebar slightly elevated/darker than content (subtle frame effect)

**Phase 2 — Week strip:**
- 7 day cells in horizontal grid, full content width
- Each cell: day abbreviation + date number + 56px adherence ring with % inside
- Today's cell: "TODAY" badge using `nowBadgeBg/nowBadgeText` tokens (separate from selected treatment)
- Selected day: slate-blue-equivalent border + tint (now using Achromatic's white accent)
- Today and Selected are SEPARATE visual signals — both stack when today is selected
- Past navigation arrows above strip (◀ ▶), forward disabled at current week
- Rolling 7-day window, today on the right
- 100% adherence rings use `status.success` (muted green) color
- Click any past day → loads that day in Today panel below
- AdherenceRing component shared between Hero (mobile) and DayCell (desktop)

**Phase 3 — Today panel:**
- Compressed slot rows (one line per slot) with click-to-expand for supplement detail
- Slot row shows: name, time, completion status (e.g., "3/4"), chevron
- Current slot auto-expanded by default (based on time-of-day)
- Past days: all slots collapsed by default (user clicks to expand for review)
- Expand-on-click works in read-only mode (not gated on edit mode)
- Edit pencil on supplement rows revealed on hover
- Past day Edit/Done button in panel header
- Hero info distributed (no separate Hero card on desktop) — anchor time + Start my day CTA in panel header
- Hover states throughout via `theme.surface.hover` token

**Phase 4 — Insights panel:**
- "This week" section: big % number + 7-bar sparkline (today's bar in accent color)
- "Current streak" section: visible only if streak ≥ 2 consecutive 100% days
- "Your schedule" section: single line summary (e.g., "Medication Anchor · 06:39 consistent")
- "Upcoming" section: supplements with length-of-treatment ending in next 14 days (hidden if empty)
- Quick actions: "Configure schedule" + "Manage protocol" buttons
- Sections separated by hairlines (no nested cards)

**Engineering notes:**
- App.jsx detects `window.innerWidth >= 1024` on mount + resize
- Desktop branch renders new layout; mobile branch unchanged
- Below 1024px: pixel-for-pixel identical to mobile experience
- Above 1024px: full desktop cockpit

---

## Bug History (for context)

- **Schedule save 403** — was an RLS policy issue. Fixed by full SELECT/INSERT/UPDATE/DELETE policy reset on `user_schedule` table.
- **Auth refresh tokens** — implemented after users were getting signed out hourly. Stores access + refresh, `supa()` retries on 401.
- **Onboarding routing for new users** — initially didn't fire. Bug was deployment-side (stale code), not code-side.
- **Centered Modal** — replaced bottom sheets after iOS safe-area struggles; then switched back to bottom sheets with drag-to-dismiss; then bottom sheets on mobile + centered modals on desktop.
- **Day-of-week default** — empty by default, silently fills to all 7 if user saves without picking.
- **Consistent-time bug** — when switching from consistent → flexible, today's pre-populated `pill_time` clears (so "Start my day" CTA reappears) — but only if the user hasn't checked anything off yet today.
- **OVH timezone bug** — OVH traveled Mexico→Austria, notifications fired on Mexico time because `user_profiles` had no timezone column and queue only refreshed on user actions. Fixed via visibilitychange listener.
- **Autocomplete dropdown scroll on iOS** — multiple fix attempts failed (CSS overflow, portal, body scroll lock), final solution was capping results to 5 (no scroll needed).
- **Manage Protocol scroll-to-top** — mount-only useEffect fired once at app boot when screen was hidden, never refired. Fixed by watching `isOpen` prop.
- **Modal scroll-to-top on every open** — same pattern, fixed via Modal primitive's bodyRef + isOpen useEffect.
- **Radius leak round 1 under Terminal themes** — UI selectors + chevron buttons + settings gear used `radius.full` (9999) directly. Fixed by referencing `radius.button` token instead, leaving `radius.full` for genuinely circular shapes.
- **Radius leak round 2** — Round 1 fix didn't catch selector variants and day-of-week picker. Category, Treatment, When-to-take selectors and Which-days circles all still rendered circular under Achromatic. Fixed in commit a14f8e3.
- **Pause/resume broken (May 16 morning)** — `togglePause` only flipped the `paused` boolean but `isPausedSupp` checks `status === 'paused'`. Since `status` was always `'active'`, pausing had no visible effect — toast fired but nothing changed. Fixed by having `togglePause` set `status: 'paused'` when pausing and `status: 'active'` when resuming, keeping both fields in sync. Also fixed `resumeSupp` (stop→resume flow) which was incorrectly calling `openEdit` after resume, causing unexpected edit form to open; and added null guards to `openEdit` for `slots`/`days` fields.
- **WCAG contrast audit (May 12)** — full inventory of `text.muted` (#666666, ~3.5:1 contrast) usages across all components. Audit-only doc committed as `1fcff08`. Migration pass (→ `text.secondary`, #A0A0A0, ~7.7:1) shipped May 15 across 7 files (Onboarding, ScheduleTab, ManageProtocolScreen, ManageSupplementsSheet, SlotCard, SlotRow, TodayPanelHeader). Two intentional `text.muted` exceptions retained: ANYTIME_SLOT decorative bullet (App.jsx) and disabled nav arrow in WeekStrip (WCAG exempts inactive controls).
- **Selected day visual hierarchy inverted** — slate blue tint was too subtle against white-elevated cells, making selected cell look recessed. Fixed by strengthening opacity values.
- **Past day expansion locked in read-only mode** — chevron click toggle was gated on `!isReadOnly`. Fixed by removing that gate (only checkbox/edit are gated, expansion is always available).
- **Week strip adherence ring stale after past-day edit** — week strip read from snapshot `weekLogs` not updated by checkbox toggle. Fixed by updating `weekLogs` state alongside `loggedSupps` on toggle.
- **`/design-system` 404 in production** — Vite SPA outputs static files; Vercel returned 404 for any path without a matching file. `/design-system` is the only URL-based route in the app (all other screens use in-app state, no URL changes). Fixed by adding `vercel.json` with `/(.*) → /index.html` rewrite rule. Commit `361007c`.
- **Modal residue in full-page screenshots** — Modal.jsx always portaled to `document.body` regardless of `open` state. When closed, the sheet sat at `transform: translateY(100%)` — off-screen but still in the DOM. Arc's full-page screenshot tool (and similar) captured it at the bottom of the document. Fixed: added `mounted` state with 300ms delayed unmount after `open → false`, matching the CSS exit animation duration. Portal is removed from DOM after animation completes. Commit `5d177fc`.
- **Onboarding card grid layout** — Onboarding Step 1 card container was a vertical flex list after the 4-card condensation landed. ScheduleTab used a 2-column CSS grid. Fixed by wrapping the DISPLAY_MODES map in a grid container (`gridTemplateColumns: 1fr 1fr`), `none` card spanning both columns, `minHeight: layout.modeButtonHeight` for equal-height cells. Commit `fb5a9ce`.
- **Onboarding cascade parity** — Onboarding Step 2 wrote per-meal absolute offsets (`breakfast: 60`, `lunch: 300`, etc.) but not cascade fields (`first_meal_offset_hours`, `meal_interval_hours`, `evening_mode`). New users hit `migrateConfig` on every Schedule tab mount — the function inferred cascade fields from absolute offsets and re-saved to DB each time. Fixed: Onboarding Step 2 now uses the same cascade rule editor as ScheduleTab (First meal offset + Meal interval + Evening mode picker). Initial config has cascade defaults (`first_meal_offset_hours: 1`, `meal_interval_hours: 4`). MEAL_ROWS constant removed. Commit `71b62d0`.
- **migrateConfig firing on every Schedule tab mount for new users** — side effect of the cascade parity bug above. Now that Onboarding writes cascade fields on first save, `migrateConfig` sees `first_meal_offset_hours !== undefined` and skips. No extra DB write on mount for any user. Resolved by `71b62d0`.
- **Anchor helper text rendering before selection** — `ANCHOR_NOTES` HelperText in ScheduleTab rendered immediately above the card grid for any user already on `medication` or `wakeup` mode, before any interaction. Moved to inside the Anchor sub-selector block, below the two buttons, conditional on `localMode` having a value. Commit `71b62d0`.
- **Grid layout remaining span** — after the first grid fix (`fb5a9ce`), `gridColumn: "1 / -1"` spread was still left in both Onboarding and ScheduleTab card style objects. Full-width span caused No Schedule to occupy its own row, Fixed Times to be stranded. Removed spread entirely. Commit `42b3eaa`.
- **Sign-in nav stack stale** — `NavigationProvider` is mounted above both `Auth` and `ProtocolApp` and survives sign-out. When user signed in after signing out, `ProtocolApp` remounted and read the stale `screenStack` (e.g. `[home, settings]`), rendering Settings open. Navigation state is not persisted to localStorage — purely in-memory. Fixed by adding `resetStack()` to `NavigationProvider` and calling it in `ProtocolApp`'s mount effect (fires on every sign-in, harmless on refresh since stack already starts at home). Commit `f7b8bb8`.
- **New supplements appearing on past days as unchecked (May 18 audit)** — `isSupplementActiveOn` returned `true` for any indefinite-mode supp regardless of date, ignoring `created_at`. Net effect: a supp added today appeared on every past day too, marked as unchecked, dragging past-day adherence rings down. Fix in `src/lib/time.js`: added `created_at` floor at the top of `isSupplementActiveOn` (applies across all treatment modes — indefinite, scheduled, cycled).
- **Protocol detail title not centered on screen (May 18 audit)** — `ProtocolDetailScreen` header used `flex justify-content: space-between` with the title at `flex: 1, text-align: center`. Because the right-side group had 1–2 icons while the left had 1, the title centered to the *available flex space*, not the screen. Fix: CSS grid `gridTemplateColumns: minmax(60px, 1fr) minmax(0, auto) minmax(60px, 1fr)` — outer columns equal-flex, title in auto-sized center column always screen-centered. Added overflow ellipsis for long names. `ProtocolLibrary` header unaffected (its title is a plain span and the side buttons are balanced).
- **Late badge stayed bright under read-only past-day dim (May 18 audit)** — the `theme.status.warningSubtle` / `theme.status.warning` ochre on the "late" badge didn't dim uniformly with the 0.6 opacity parent wrapper, so late slots looked highlighted in read-only mode. Fix in `SlotCard.jsx`: when `isReadOnly`, switch Badge from `variant="missed"` to `variant="neutral"` (achromatic). Edit mode + today retain the warning ochre. (The deeper fix — replacing the opacity dim with an in-Hero eyebrow — followed in Session 3 of the mobile audit.)
- **Week strip cells too tight at 320px viewport (May 18 audit)** — at iPhone SE 1st gen width, each cell rendered ~38px wide; with the 28px compact ring + `xs` (8) horizontal padding, the ring overflowed the cell content area. Fix in `WeekStrip.jsx`: compact mode now uses `xxs` (4) horizontal padding while keeping `xs` (8) vertical. Ring fits with 4+px breathing room at 320px, 9+px at 375px, 11+px at 390px.
- **TODAY badge straddled the cell border / staggered cell heights (May 18 mobile audit)** — initial absolute-positioning approach put the badge half above / half overlapping the cell's top border, and in-flow rendering pre-fix added 2–3px of extra height to the today cell. Final fix: reserved-height top slot inside every cell (compact: 14px + `xxs` marginBottom) — today renders the badge inside that slot, non-today cells get an empty slot of identical height. Badge sized down to 8px font + tight padding to fit cell width.
- **Hero card "looked empty" on today vs past (May 18 mobile audit)** — content was anchored to the top of a `minHeight: 132` card with extra space below. Fix: Card itself is now `display: flex, flexDirection: column, justifyContent: center` so content always vertically centers regardless of how many lines (no submeta vs with submeta) — past and today render at the same visual shape.
- **"Started at" text jumped when entering anchor edit (May 18 mobile audit)** — display-mode status div had `lineHeight: 1.2`; edit-mode prefix span inherited a different line-height. Parent flex also switched from `alignItems: baseline` to `alignItems: center`. Fix: extracted a single `statusTextStyle` object used by both display and edit-mode prefix; unified parent alignment to `alignItems: center`. Edit input slimmed with `padding: xxs xs` so its natural height matches the title-text row.
- **Production build leaked dev mode + DevThemePicker visible on live (May 20)** — the deployed JS bundle started shipping React's development JSX runtime (`jsxDEV`) and `import.meta.env.DEV` evaluated to `true` in production, leaking `DevThemePicker` and other dev-only code to the live site. No repo-side build config had changed and the Vercel dashboard showed clean Project Settings (Framework: Vite, all overrides OFF, no `NODE_ENV=development`). Root cause never definitively identified — most likely a transient Vercel platform/preset behavior that flipped the resolved build command. Compounding bug: the `/design-system` route call site at `App.jsx:220` was rendering `DevThemePicker` unconditionally (no DEV gate at all), so it was already leaking on that public route even before the build-mode regression. Three-layer fix shipped: (1) `App.jsx:220` gated with `import.meta.env.DEV` (`10415af`), (2) hostname-based early return added inside `DevThemePicker` itself — returns null unless hostname is localhost / 127.0.0.1 / 0.0.0.0, so the component cannot render on the live domain regardless of build mode (`7472f9e`), (3) `"buildCommand": "vite build"` pinned in `vercel.json` to make production build mode deterministic regardless of dashboard or platform defaults (`724518a`). Post-deploy verification: 0 `jsxDEV` hits, 0 `DevThemePicker` references in the production bundle. Do not remove the `vercel.json` buildCommand pin without verifying the production bundle still ships in production mode (curl the bundle, grep for `jsxDEV` — should be 0 hits).

---

## Today's Major Work (Sequential Sessions)

### Session of July 6 — Refill/supply tracking, structured dose, keyboard-jump + warnings cleanup
**Refill/supply tracking (opt-in per item).** "Remaining" is DERIVED from the check-off history (never a stored counter): `stock_count − units_per_dose × doses logged since stock_filled_on` (`mobile/core/lib/supply.js`, pure). New nullable columns on `supplements` (`units_per_dose, stock_count, stock_filled_on, stock_unit, low_supply_days, low_supply_notified_at`) — migrations `supply-tracking-migration.sql` + `low-supply-notified-migration.sql` (both RUN on prod). **Phase 1 (visible):** EditForm `// supply` = just "how many in the bottle" (unit inherited from the dose); Protocol Detail rows show `N left · ≈Xd` (secondary tone, amber when ≤ threshold, "out — refill" red); HOME slot rows show a low/out alert ONLY when low/out (keeps the take-now surface clean); refill = editing the bottle count re-anchors `stock_filled_on`. `supplyMap` memoized in Today. **Phase 2 (proactive push, PURELY server-side — NO build needed):** `recompute_user_logic.ts` queues a "Running low — reorder soon" push when days-left ≤ threshold, fired 09:00 local, deduped ONCE per fill cycle via `low_supply_notified_at` vs `stock_filled_on` (a refill re-arms it), excluded from recompute's delete-stale wipe. `recompute_notifications` deployed. **Verified end-to-end** (throwaway low item → recompute → correct 9am-local row → cleaned up).
**Structured Dose = amount + form.** Dose is now `[amount]` + a minimal form **chip** set (`pill · tablet · capsule · mL · other`; "other" = free-text) matching the form's chip language (was a foreign dropdown). Strength ("50 mcg") → Notes (Sofia's call). On save the display string is composed ("2 capsules") so every screen keeps reading `supp.dose` unchanged; legacy free-text doses are best-effort parsed on edit. The amount doubles as `units_per_dose`. Pluralization via `pluralizeUnit()` (never double-pluralizes — fixed a "drops"→"dropss" bug; leaves mL). **DB migration `pluralize-dose-migration.sql` RUN** — bulk-fixed existing singular/double-plural doses so users don't re-save one by one.
**Design-audit fixes.** Dose UI redesigned (chip consistency, "per dose" label, Supply moved directly under Dose); Anytime/Specific-time chips flow next to Evening; PDF preview framed (white page floats on dark canvas). Confirmed decisions (unchanged): onboarding keeps the full config step; strength stays in notes.
**Keyboard field-tap jump — fixed at root.** The name field's autocomplete renders an INLINE list on focus → content grew → Modal's `onContentSizeChange` fired `scrollToEnd`, yanking the form to the bottom. Removed the scrollToEnd; iOS `automaticallyAdjustKeyboardInsets` handles focus (replaced the earlier KeyboardAvoidingView + manual keyboard-height tracking, which fought each other).
**Debugger warnings cleaned.** `LogBox.ignoreLogs` for the two benign dev-only warnings (expo-notifications push-token — Simulator-only; Legacy Architecture — informational). The "dashed/dotted border" warnings were historical (leader-dots fixed earlier).
**Notifications CONFIRMED WORKING on-device** (diagnosed Sofia's account: token registered, queue filling, test push delivered — receipt ok). Latent (not fixed): a web-push success can mask an Expo-push failure in `process_notifications_queue` (needs per-channel tracking).

### Session of July 6 (cont.) — Business roadmap, Phase 1 (analytics + activation), Phase 2 (retention loop)
**Business direction.** Market research + monetization strategy → `ORIGIN-ROADMAP.md` (6 pre-monetization phases). Model: freemium subscription (Health median ~$9.70/mo, ~$38/yr); the outcomes loop is the Pro anchor; gating deferred to Phase 4 (RevenueCat + trial paywall).
**Phase 1 — measure + activate.** (1) Analytics decoupled behind a wrapper — NEW `mobile/lib/analytics.js` (`setAnalyticsClient/track/identify/screen/resetAnalytics`, no-op + dev echo until a client attaches). `App.js` lazily + guardedly attaches PostHog (`posthog-react-native`, US host, key `phc_ngd4…`) so pre-dep builds stay no-op; `identify` on session, `reset` on sign-out. Instrumented `checkin_logged` etc. (2) Bulk/quick-add — NEW `mobile/components/BulkAddModal.js` (paste splits on `\n` → N items with defaults), opened from Today with a tap-bleed guard. **PostHog + bulk-add activate on the NEXT EAS build** (need the native dep bundled).
**Phase 2 — the outcomes / retention loop (BOTH halves shipped + sim-verified).**
- **Daily "how do you feel" check-in.** NEW table `daily_checkins` (energy/mood/sleep smallint 1–5 nullable + note, unique `(user_id,log_date)`, RLS, touch trigger — `supabase/daily-checkins-migration.sql`, RUN + verified). NEW `mobile/components/CheckinSheet.js` (block-cell 1–5 rating rows, tap-current-to-clear; notes Input; disabled-when-empty save). `mobile/core/lib/api.js` fork: `dbGetCheckin/dbUpsertCheckin/dbGetCheckinsRange`. Today: `// how you feel` card after the Hero — prompt when empty, `energy · mood · sleep` summary + `edit ›` once logged; per-day cached read keyed on `dk`; `saveCheckin` → upsert → toast + `checkin_logged`. **Verified end-to-end on sim** (rate → save → DB row → card summary + toast).
- **Trends screen.** NEW `mobile/screens/Trends.js` — reachable from a new `Activity` icon in the home top bar, renders as a SlideScreen overlay (drill-in detail pattern). Reuses the shared adherence helpers (`calculateAdherenceForDate/calculateSlotAdherence/calculateSupplementAdherence`) — NO new math. Sections: **adherence** (overall % = taken/expected ignoring rest days + a 30-day bar series in the block grammar, green only on 100% days), **how you feel** (energy/mood/sleep 30-day sparklines + averages; empty-state copy until check-ins accumulate), **by time of day** (per-slot adherence + a "you miss {worst} most" pattern callout), **by supplement** (worst-first). **Verified on sim** (open → all sections render with real data → back). Commits `8c078ca` (check-in), `e49a961` (trends) on `main`.
**Phase 3 — Pro value (trust + differentiation).** (1) **Timing-interaction guidance** — scoped strictly to TIMING SEPARATIONS (the liability line: help people SPACE what they already take; NO dosage/diagnosis/"don't take"). NEW `mobile/core/lib/interactions.js` — canonical ingredient keyword-matchers + a small curated rules table (levothyroxine↔calcium/iron/magnesium/caffeine, calcium↔iron, zinc↔iron/calcium/copper); `detectIngredients` / `findInteractions` / `checkCandidate`; skips single combo pills. **Two surfaces** (Sofia's call): EditForm shows a live `// timing note` (amber, never blocks save, carries the disclaimer) when the edited item conflicts with the regimen; NEW `mobile/screens/Interactions.js` scans the active regimen (one card per pair, same-slot flagged amber vs "spaced", empty-state + disclaimer), reached from a NEW `Shield` top-bar icon that ambers when a same-slot conflict exists. Every surface carries `TIMING_DISCLAIMER`. **Verified on sim** — correctly detected the real levothyroxine+magnesium pair (different slots → "spaced"). Edit-time note is code-confident (idb couldn't scroll the modal to shoot it). (2) **Apple Health scaffold** — NEW `mobile/lib/health.js`, a GUARDED wrapper (`isHealthSupported`/`requestHealthPermissions`/`readSleepHours`/`readStepsToday`) using a VARIABLE `require('@kingstinct/react-native-healthkit')` so Metro doesn't resolve the (not-yet-installed) native dep — stays a runtime no-op until the Health build. Settings shows an `apple health` row ONLY when `isHealthSupported()` (native module + real device) → invisible now, no dead control ships. **Activation steps** (deps + config plugin + entitlement) documented inline in `health.js`. HealthKit can't run on Simulator → real verification is the Health build. Commits `902f78e` (interactions), `5fe320a` (health).
**Release ops + sequencing.** Build 16 submitted to TestFlight (background, exit 0). **RECOMMENDED sequencing:** cut **build 17** with the JS-only, sim-verified work (Phase 1 PostHog+bulk-add, Phase 2 check-in+Trends, Phase 3 interaction guidance) FIRST — all low-risk. Let **Apple Health ride its OWN build (18)** — installing the untested HealthKit native module + config plugin into build 17 could fail the native build and block all the verified features. The `health.js` seam is already in place; activation is just the deps+config in the file's footer.
**Pending:** device-verify bulk-add + confirm PostHog events land (US region assumed); cut build 17; then the Apple Health build (18) per the activation notes; then Phase 4 (RevenueCat + gating + trial paywall).

### Session of July 5 — Server-push notifications, keyboard fix, PDF rebuild + preview, TestFlight
**Notifications → SERVER PUSH (fixes two bugs: fired on un-anchored days + for already-done items).** Root cause: mobile used daily-REPEAT LOCAL notifications set once (`mobile/lib/notifications.js` `rescheduleSlotReminders`), so they fired every day regardless of whether the day was anchored ("start my day") and couldn't know a slot was already checked. Re-architected to reuse the web's server brain: `recompute_notifications` fills `notifications_queue` from the DB (real slot times + done-state), and `process_notifications_queue` — which ALREADY skips fully-logged slots + `notifications_enabled=false` users — now ALSO delivers to iOS. Changes: (1) migration `supabase/expo-push-tokens-migration.sql` — new `expo_push_tokens` table (user-owned RLS); (2) `process_notifications_queue/index.ts` — added `sendExpoPush()` beside web-push (Expo Push API → APNs; marks a row fired if EITHER channel sends; prunes `DeviceNotRegistered`); (3) NEW `mobile/lib/push.js` — `registerPushToken`/`unregisterPushToken` (ExponentPushToken, projectId `98a830a3-…`, upsert on `token`); (4) `Today.js` reminders toggle + boot register the token, set `notifications_enabled` via `dbUpdateScheduleField`, call `recomputeNotifications()`; local scheduling retired (leftover local schedules cleared on boot via `cancelAllReminders`). Note: `mobile/core/lib/notifications.js` is DEAD web code (uses `navigator`/`serviceWorker`). **Verified on sim:** import resolves, no errors, graceful fallback (sim can't mint a token). **NOT verifiable on sim — push needs a real device.** REQUIRES: run the migration; `process_notifications_queue` auto-deploys on push to `main` (Supabase GitHub integration) — so it deploys when `terminal-elevated` merges (or deploy manually); 1 EAS build; device test.
**Keyboard-aware modal scroll.** Shared `Modal` (`components/Modal.js`) capped its ScrollView at a FIXED height that didn't shrink when the keyboard opened, so KeyboardAvoidingView lifted the sheet and pushed the first field off-screen with no way to scroll up. Now tracks keyboard height (`Keyboard` listeners) and `scrollCap = min(winH*0.9, winH - kbHeight - insets.top - 8) - 220`. Fixes EVERY form (add item, account, create protocol) since they share this Modal.
**Protocol PDF rebuilt + in-app preview.** Was a flat 4-column table missing most of the web artifact. `mobile/lib/protocolPdf.js` rebuilt to mirror `src/lib/pdf.js`: ORIGIN header, owner/status row (For: … · Active · Started … · treatment mode), slot-grouped sections (ported `groupBySlot`), per-item metadata (cycle / scheduled-end / day-restriction / notes), disclaimer footer — as HTML → `expo-print`. Verified via headless-Chrome render. **Preview + filename (needs the deps below):** installed `react-native-webview` + `expo-file-system`; NEW `components/PdfPreviewModal.js` renders the doc HTML full-screen in a WebView (identical to the PDF, and visible on the simulator — the OS share-sheet thumbnail is device-only); `share PDF` menu → opens the preview → header `share` button → `shareProtocolPdf` renders the PDF, copies it to a human filename ("`{Protocol}.pdf`" via `expo-file-system` `File`/`Paths.cache`, SDK-54 API), and opens the share sheet. Collapsed the earlier two menu items (had a `Print.printAsync` "preview" that opened a PRINT dialog) into one `share PDF`. **Needs a local `expo run:ios` rebuild (native modules) — done this session — to verify the WebView preview on sim.**
**Release ops.** Build 14 built + submitted to TestFlight (EAS). Demo account for App Review: create `appreview@abismo.design` (Auth → Add user, Auto Confirm), seed via a plain-statements SQL block (profile + `user_schedule` `none` + generic supplements — NOTE `slots`/`days` are Postgres `text[]`/int-array literals `'{}'`/`'{0,1,2,3,4,5,6}'`, NOT jsonb), put creds in TestFlight → Test Information → "Sign-In required". EAS free plan caps at 15 builds/month — `expo run:ios` (local) does NOT count; `eas build` does. Only ~1 EAS build spent this cycle (14). **Push notifications don't work on the iOS Simulator — device/TestFlight only.**

### Session of June 29–30 — Icon/splash system, onboarding wizard, confirm-modal fixes, schedule versioning
**Brand mark unified to ONE 3-ring icon.** App icon regenerated (via `sharp`, `mobile/assets/*.png`) → monochrome, thin gradual inner→outer weight taper (strokes `28/21/18`) + white center point on `#0D0D0D`. `OriginGlyph.js` rewritten to render the SAME 3-ring mark (was 5 thin rings) so icon = splash = Auth = Onboarding = Settings footer. **GOTCHA:** `expo run:ios` does NOT regenerate native assets — the icon/splash PNGs must be copied into `ios/Origin/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png` + `SplashScreenLegacy.imageset/image{,@2x,@3x}.png`, the splash bg set in `SplashScreenBackground.colorset/Contents.json` (`#1A1A1A`→`#0D0D0D`) and `app.json` splash/adaptiveIcon backgroundColor, then rebuilt.
**Splash = rings all the way.** Was native-rings → grey ring-spinner → cramped "Origin"+tiny-glyph (3 inconsistent things). Now: bg `#0D0D0D` everywhere (killed the grey); `AnimatedSplash` = `OriginGlyph size 200` (matches the ~172pt native splash — no size jump, no font-flash wordmark); `Today` initial-load renders the same centered `OriginGlyph` (not the terminal `Loader`) → one continuous ring mark launch→home. The large rings + "Downloading 100%" in the simulator are the Expo dev-client, NOT in TestFlight/prod.
**Settings about-footer.** The only in-app place the brand names itself: ring mark + lowercase `origin` + `v{version} ({build})` (live from `expo-constants`) at the bottom of Settings. Brand name otherwise lives only on Auth (the `ORIGIN` lockup); chrome stays name-free.
**Schedule versioning (effective-dated slots/days).** Editing a supp's slots/days used to rewrite PAST days (+ adherence). New `supplements.slot_history jsonb` (mirrors `pause_intervals`): `scheduleOn(supp,date)` resolves slots/days as-of a day; `withScheduleChange(...)` appends a dated entry seeding the prior config from creation. Readers in `Today` (`getSuppsForSlot`/`inDay`/anytime/pinned) + `adherence.calculateAdherenceForDate` resolve per-day; `dbUpdateSupp` persists `slot_history` only when present. Empty history → current config (back-compat). Migration RUN: `ALTER TABLE public.supplements ADD COLUMN IF NOT EXISTS slot_history jsonb NOT NULL DEFAULT '[]'::jsonb;`. Magnesium past-pollution repaired via one-off UPDATE (RUN).
**Onboarding → 3-step wizard reusing ScheduleTab.** Was a one-off boxed mode-picker that only set schedule TYPE. Now step 1 type → step 2 fine-tune timing → step 3 reminders, with step-dot progress. Reuses `ScheduleTab` (same OptionRow picker + full config as Settings) via new `showOnly` prop (`'type'`/`'details'`) on ONE mounted instance + `saveOnMount` so defaults persist; `'none'` skips to done after step 1.
**Confirm-modal button rows.** `fullWidth` only sets `alignSelf:'stretch'` (cross-axis) → in a ROW the buttons sized to their text. Fixed sign-out / delete-account / meal-orphan footers to `flex:1` each (true 50/50) + lowercased titles/labels/bodies.
**Also:** leader dots now render (RN can't do `borderStyle:'dotted'` → clipped run of `· ` middots in `ConfigRow` + `ScheduleTab` TimeRow); modal `// SECTION` underlines restored; copy-case sweep (lowercase modal titles, Detail tabs, EditForm treatment). **idb self-verification** (tap+screenshot via `idb`/`xcrun simctl`, iPhone 16 Pro = 402×874 logical points) is now standard for verifying screens on-device before handing off.

### Session of May 11 (this session)

**Pass — Phase 1 desktop responsive Home (sidebar + layout shell)**
Persistent 240px sidebar with brand wordmark, nav items, Settings + account at bottom. Content area with greeting top-left, avatar top-right, placeholder sections for week strip + today panel + insights panel. Mobile rendering below 1024px unchanged. Initial sidebar Sofia row was visually awkward and removed; account identity consolidated to top-right of content.

**Pass — Phase 2 (week strip with adherence)**
7 day cells in horizontal grid with adherence visualization. AdherenceRing extracted from Hero, made reusable with size prop. New `dbGetDailyLogsRange` API helper. Week navigation state in App.jsx, prev/next handlers with forward arrow disabled at current week.

**Pass — Phase 2 polish**
Ring size 40 → 56px with % text inside. Today cell stronger treatment ("TODAY" + "Mon" stacked, accent border, surface tint). Each cell as distinct card with hairline border. Vertical spacing inside cells comfortable. Outer container border removed entirely.

**Pass — Selected/Today separation + 100% success color rings**
Real product instinct: separate visual signals for "today" (the actual date) vs "selected" (which day's content is loaded). Today gets small TODAY badge using `nowBadgeBg/nowBadgeText`. Selected gets stronger slate-blue treatment (`nowBorder + nowBg`). Both stack when today is selected. AdherenceRing uses `status.success` (sage green) color at 100% adherence, ink color below. Cross-app consistency — Hero ring on mobile also gets success color at 100%.

**Pass — Phase 3 (Today panel with compressed slot rows + hover states)**
Compressed slot rows (one line each) with click-to-expand. Current slot auto-expanded on initial render. Hover states throughout (`theme.surface.hover` token added). Supplement rows reveal edit pencil on hover. Past day handling: Today panel loads selected date, read-only by default, Edit button unlocks. Past day initial state was all-expanded (changed in Phase 4).

**Pass — Phase 3 bug fixes (3 fixes)**
1. Selected day visual hierarchy — strengthened slate blue values so selected cell pops forward instead of receding.
2. Past day expansion locked when not in edit mode — removed read-only gate on chevron toggle (only checkbox/edit gated).
3. Week strip adherence ring stale after past-day edit — `weekLogs` state updated alongside `loggedSupps` on toggle (no page refresh needed).

**Pass — Phase 4 (Insights panel + past day collapsed)**
INSIGHTS placeholder filled with: weekly adherence (big % + sparkline), current streak (consecutive 100% days, hidden if <2), schedule summary (mode · anchor time), upcoming endings (length-of-treatment ending next 14 days, hidden if empty), quick actions (Configure schedule, Manage protocol). Sections separated by hairlines. Past day initial state changed from all-expanded to all-collapsed (cleaner scannability).

**Pass — 4 directional themes for visual identity exploration (dev-only)**
Replaced Brutal Light + Brutal Dark with 4 new directional themes: Clinical Instrument (cool steel, IBM Plex Sans), Editorial Material (warm paper, Crimson Pro serif), Soft Futurism (deep blue-black, luminous cyan), Terminal Precision (true black, amber signal, JetBrains Mono). Each with full token coverage and real fonts loaded. CSS variable font system added (`--font-body/heading/data` set on theme change). Dev theme switcher updated to show all 6 themes.

**Pass — 5 Terminal color variants**
Locked Terminal as the direction. Removed Clinical/Editorial/Soft Futurism themes. Renamed Terminal Precision to Terminal Amber. Added 4 new Terminal variants: Cyan (aerospace), Phosphor (CRT green), Achromatic (pure white, no chroma), Magenta (punk-tech). All share base architecture (mono type, zero radius, hard borders, black surfaces), differ in accent color and text tint.

**Pass — Achromatic as production identity (LOCKED)**
Renamed `terminalAchromatic` to `achromatic`. `VALID_PREFS = ["achromatic"]` — only achromatic is a valid production preference. All themes.light fallback references → themes.achromatic. SettingsScreen theme picker removed entirely (single production theme, nothing to pick). Silent migration of existing users with light/dark/system preference. Dev theme switcher retains all variants for future reference.

**Pass — Radius leak fix (Achromatic production)**
UI selector elements (chevron navigation buttons, Settings gear button, theme picker) referenced `radius.full` (9999) directly, so they stayed circular under Achromatic's zero-radius treatment. Fixed by introducing `radius.button` token that maps to theme's UI radius (0 under Achromatic). Account avatar kept at `radius.full` (legitimate circular shape). Adherence rings unchanged.

**Document — HIG-informed design rules drafted**
Apple HIG audit document drafted covering 15 categories: Touch targets, State systems, Modals & sheets, Navigation, Accessibility, Typography, Spacing, Color & contrast, Animation & motion, Forms & inputs, Feedback patterns, Buttons, Lists & rows, Empty states, Onboarding. v1 baseline with HIG-compliant defaults. Pending: save to repo as `/ORIGIN-DESIGN-RULES.md`, then bulk fix pass to apply to existing components.

**Pass — Radius leak fix round 2 (May 11 late evening)**
Round 1 didn't catch selector variants and day-of-week picker. Category, Treatment, and When-to-take selectors and day-of-week circles in EditForm were still rendering rounded under Achromatic. Fixed in commit a14f8e3.

**Document update — Comprehensive diagnostic (May 11 late evening)**
Ran full state diagnostic via Claude Code: schema verification, component inventory, API helper inventory, recent commits, production user count. Surfaced: Treatment mode column structure (treatment_mode + cycle_on/off_value/unit), status column replacing legacy `paused` boolean, 4th user account (dra.orozcobp, abandoned onboarding), Loader minimum 3000ms behavior, 22 API helpers, multiple legacy/stale items worth tracking. Handoff document updated to match actual production state.

**Pass — Design system reference page (May 11 evening, second block)**
Built `src/components/design-system-page/DesignSystemPage.jsx` and `registry.js`. Foundation sections auto-render from design-system.js tokens. Component registry catalogs all primitives and composed components with generic stub data. Playgrounds for Button, Input, AdherenceRing. Route: `/design-system` (public, portfolio-linked). `/design` redirects. IntroHeader with "← Back to Origin" link. Sidebar → horizontal scroll nav strip below 1024px. DevThemePicker always shown. `noindex` meta via useEffect. `DayCell` named export added to WeekStrip for registry import. CLAUDE.md updated with public-page maintenance rules. Commits: `70a8de3` (initial dev route), `7731a6c` (public release).

**Fix — Vercel SPA fallback (May 11 evening)**
`/design-system` returned Vercel 404 in production because no `vercel.json` existed. All other app screens use in-app state (no URL changes) — this was the first real URL-based route. Added `vercel.json` with `/(.*) → /index.html` catch-all rewrite. Commit `361007c`.

**Fix — Modal unmount after exit animation (May 11 evening)**
Modal.jsx kept its portal mounted at `translateY(100%)` when closed, making it visible in full-page screenshot tools. Added `mounted` state with 300ms delayed unmount (matching `transform 0.3s ease-out`). Entry animation unaffected; exit animation plays in full before DOM removal. Audit confirmed all other overlays (Toast, SupplementNameAutocomplete) already unmount cleanly. Commit `5d177fc`.

### Session of May 15

**Pass — WCAG text.muted → text.secondary migration (completed)**
All functional `text.muted` (#666666, ~3.5:1 contrast) usages migrated to `text.secondary` (#A0A0A0, ~7.7:1 contrast) across: Onboarding, ScheduleTab, ManageProtocolScreen, ManageSupplementsSheet, SlotCard, SlotRow, TodayPanelHeader. Two intentional `text.muted` exceptions retained: ANYTIME_SLOT decorative `◦` bullet (App.jsx) and disabled nav arrow state in WeekStrip (WCAG exempts disabled controls). Color contrast gap in Pending Queue marked complete.

---

### Session of May 12

**Pass — Schedule modes condensed to 4 (Anchor sub-selector)**
Onboarding and Manage Protocol → Schedule tab now show 4 mode cards (No Schedule, Anchor, Intermittent Fasting, Fixed Times) instead of 5. Tapping Anchor reveals a sub-selector below the grid (Button variant="selector", two options: Medication / Wake Up). DB values unchanged — `schedule_type` still stores `medication` or `wakeup` directly. New config.js exports: `DISPLAY_MODES` (4-item UI array) and `ANCHOR_SUB_MODES`. `MODES` kept intact for all internal lookups. Onboarding: Continue disabled until sub-mode explicitly selected when Anchor card is active. ScheduleTab: Anchor card shows as selected when `localMode` is medication or wakeup; sub-selector pre-selects current value on load.

**Refactor — Button variant "pill" renamed to "selector"**
`variant="pill"` → `variant="selector"` across the codebase. CSS class `.pill-label` → `.selector-label` (definition in index.html inline style, usage in Button.jsx). Internal variable `pillBase` → `selectorBase`. All 7 usages in EditForm.jsx updated. Design system page registry Button entries updated. `theme.radius.pill` token kept as-is — it names a visual shape (fully rounded, 999px) used for drag handles, progress dots, status indicators, not the UI component. ORIGIN-DESIGN-RULES.md and ORIGIN-HANDOFF.md updated.

**Fix — Onboarding cascade parity + grid layout + helper text (4 bugs, May 12 morning)**
Follow-up bug fixes after the schedule mode condensation work:
1. Grid layout: Onboarding Step 1 card container changed to 2×2 grid to match ScheduleTab. Commit `fb5a9ce`.
2. Cascade parity: Onboarding Step 2 replaced per-meal absolute-offset inputs (MEAL_ROWS) with the same First meal / Meal interval / Evening mode editor used by ScheduleTab. Initial config now writes `first_meal_offset_hours: 1`, `meal_interval_hours: 4`. Commit `71b62d0`.
3. migrateConfig side effect resolved: new users no longer trigger a DB re-save on every Schedule tab mount. Commit `71b62d0`.
4. Anchor helper text moved: `ANCHOR_NOTES` HelperText in ScheduleTab relocated from above the card grid to below the sub-selector buttons. Commit `71b62d0`.

**Fix — Grid layout remaining span (May 12)**
Second grid fix: `gridColumn: "1 / -1"` spread was still present in both Onboarding and ScheduleTab after the first fix, stranding No Schedule and Fixed Times in their own rows. Removed entirely. Commit `42b3eaa`.

**Refactor — Notifications toggle to selector pattern (May 12)**
Replaced iOS-style circular switch in SettingsScreen.jsx (and dead-code SettingsModal.jsx) with two-option `Button variant="selector"` (On / Off). Consistent with rest of app's binary selector pattern. Design system registry updated with three binary selector examples. Commit `f897a42`.

**Pass — HIG foundational accessibility (May 12)**
Touch targets, prefers-reduced-motion, focus states, keyboard accessibility — all in one pass:
- SlotCard expand header `<div>` → `<button aria-expanded>` (keyboard accessible, accessible name from children)
- SlotCard checkbox `<div>` → `<button aria-label aria-pressed>` with 44pt tap area (padding+margin negative offset, visual preserved)
- WeekStrip nav arrows: `minWidth/minHeight: 32`
- SupplementRow pencil: `minWidth/minHeight: 32`
- Hero "edit" button: `minHeight: touch.min`, inline-flex centering
- Global `@media (prefers-reduced-motion: reduce)` kills all transitions/animations
- `:focus-visible { outline: 1px solid #FFFFFF; outline-offset: 2px }` for keyboard nav
- Modal: Escape closes, Tab cycles within sheet, first focusable element auto-focused on open
- Commit `f2b3da4`

**Pass — prefers-reduced-motion exceptions (May 12)**
Four HIG-compliant animations re-enabled under reduced-motion as functional feedback exceptions: Loader rings/dot, SupplementRow checkbox state transition, Toast slide-in, row hover (SupplementRow, SidebarNavItem, DayCell). Pattern: CSS class on each element, override in index.html's reduced-motion block. Loader extends its own inline `<style>`. Rationale comments at each override site. ORIGIN-DESIGN-RULES.md Category 9 and CLAUDE.md updated. Commit `c6ff004`.

**Fix — Navigation stack stale on sign-in (May 12)**
`NavigationProvider` survives sign-out (mounted above `ProtocolApp`), so stale screen stack caused Settings to reopen after sign-out/sign-in. Fixed: `resetStack()` added to `NavigationProvider`, called in `ProtocolApp` mount effect. Commit `f7b8bb8`.

**Pass — HIG-compliant form patterns (May 12, commit `3bdedb3`)**
SettingsScreen: email section wrapped in `<form onSubmit>` with `autoComplete="email"`, `inputMode="email"`, `autoCapitalize/autoCorrect/spellCheck` off, submit button changed to `type="submit"`. Password section wrapped in `<form onSubmit>` with `autoComplete="new-password"` on both password inputs, submit button `type="submit"`. Display name input gained `autoComplete="name"`. EditForm: `autoComplete="off"` on Dose and Notes; `inputMode="numeric"` + `pattern="[0-9]*"` on cycle on/off value fields. Auth already had a real `<form>` element prior to this commit — not touched.

---

### Session of May 16 (morning)

**Fix — pause/resume bugs**
`togglePause` only flipped the `paused` boolean but `isPausedSupp` checks `status === 'paused'` — so pausing never visually worked. Fixed by syncing both `status` and `paused` fields. `resumeSupp` incorrectly called `openEdit()` after resuming, opening the edit form unexpectedly; removed that call. Added null guards to `openEdit` for `slots`/`days` fields to prevent crashes on malformed supplement records.

### Session of May 16 (afternoon)

**Feature — Protocol Library Phase 1-3 (complete)**
Full multi-protocol system shipped across three phases:

*Phase 1 — Data model + API:*
Protocols table in Supabase (id, user_id, name, status, treatment_mode, starts_at, ends_at). API helpers: `dbGetProtocols`, `dbAddProtocol`, `dbUpdateProtocol`, `dbDeleteProtocol`, `dbPauseProtocol`, `dbArchiveProtocol`, `dbActivateProtocol`. `dbResetProtocolSupps` bulk-patches all supplements in a protocol back to `{status: 'active', paused: false}` when protocol is paused or archived (template reset). `dbUpdateSupp` updated to send `protocol_id`. `homeSupps` computed from `activeProtocolIds` Set — supplements with no protocol always show, supplements with a protocol show only if their protocol is active.

*Phase 2 — ProtocolLibrary + ProtocolDetailScreen + SettingsScreen refactor:*
`ProtocolLibrary.jsx`: slide-in full screen at zIndex 101. Active/Archived tabs via TabBar. New protocol two-step modal (form → intent). `ProtocolDetailScreen.jsx`: zIndex 102, inline header name editing, lifecycle buttons (Pause/Archive, Activate/Archive, Activate/Delete) at top above tabs, Active/Stopped supplement tabs. `SettingsScreen.jsx`: refactored from single long scroll to view-based sub-navigation (main → schedule / account / install). Schedule and Account each get their own slide-in view; main view shows label + action row pattern matching rest of app. `ManageProtocolScreen` removed. `TabBar.jsx` extracted as design system primitive, registered in `registry.js`.

*Phase 3 — Protocol picker in EditForm:*
When 2+ active protocols exist, EditForm shows a Protocol section above Name. Selector buttons for each active protocol + "None". Protocol assignment stored in `form.protocol_id`. `blankForm(protocol_id)` helper in App.jsx pre-selects single active protocol when opening add form. `openAddToProtocol(protocol)` opens add form pre-assigned to a specific protocol.

*Intent handling in `addProtocol`:*
Three intents: `replace` (archives all active protocols + client-side resets their supplements, creates new as 'active', shows archived names in toast), `stack` (creates new as 'active', existing unchanged), `save_later` (creates new as 'archived'). Intent step skipped entirely when no active protocols exist.

### Session of May 17

**Feature — IF v2: anchor-relative → absolute-time eating window**

Existing IF (intermittent fasting) was anchor-relative: a single "pill time" anchor drove a derived eating window via `window_start` / `window_length` / `meals_per_day` offsets. Resuming supplements was broken for fasting users because the home surface and Start-Day CTA assumed every non-Fixed mode needed a daily anchor. Rebuilt fasting as a fixed-schedule model — same shape as Fixed mode, with its own dedicated slot vocabulary.

*Core (`src/config.js`, `src/lib/notifications.js`):*
New config fields `eating_window_start` (HH:MM), `eating_window_duration_hours` (4/6/8/10/12), `meal_count` (2/3), reusing existing `pre_meal_window`, `evening_mode`, `evening_time`, `sleep_time`. `computeIFSlotTimes(cfg)` derives absolute HH:MM times for each slot. New `IF_SLOTS` array with IF-only slot IDs — `fasted`, `meal_1`, `pre_meal_2`, `meal_2`, `pre_meal_3`, `meal_3`, `evening`. v1 config fields kept in `DEFAULT_CONFIG` so unmigrated reads don't error.

*Schedule editor (`ScheduleTab.jsx`):*
New fasting block — window start input (required), duration segmented control, meals 2/3, pre-meal-window number, evening sub-mode (Off / Fixed time / Before sleep). Live preview renders all active slot times computed from current state. Flexible/Consistent toggle hidden for fasting (always fixed-schedule). Orphan-supplement modal warns when dropping meal_count would strand supplements assigned to disappearing slots.

*Slot picker (`EditForm.jsx`):*
Mode-aware. In fasting mode, picker uses `IF_SLOTS` filtered by `meal_count` (hides meal_2/3 + pre slots when not used) and `evening_mode` (hides evening when off). All other modes use the original `SLOTS` list.

*Onboarding (`Onboarding.jsx`):*
Fasting block now collects the v2 fields directly. Get Started disabled until eating window start is provided. New fasting users are stamped `_if_v2_migrated: true` at save time so they skip the migration screen on next load.

*Today surface (`Hero.jsx`, `TodayPanel.jsx`, `TodayPanelHeader.jsx`, `App.jsx`):*
Fasting users see "Eating window: HH:MM" in the hero/header instead of the anchor Start-Day CTA. `activeSlotList` and `coreSlotIds` become mode-aware so the home renders only IF slots active for current `meal_count` / `evening_mode`, and adherence math counts the correct slot set. `getSlotTime()` handles fasting by reading from `computeIFSlotTimes` (plus evening sub-mode logic). `saveSchedule` strips anchor metadata for fasting. The legacy `fasted → pre_breakfast` slot rename is guarded by `_if_v2_migrated` so it stops firing for v2 users (in v2, `fasted` is a real slot).

*Migration screen (`IFMigrationScreen.jsx`, new):*
Full-screen confirm flow for existing IF users. Infers v2 fields from the user's old config (`_consistent_time` → window start, `window_length / 60` → duration hours, `meals_per_day` → meal_count, `pre_meal_window` carried), shows them with editable controls, requires the user to confirm. On confirm: persists v2 config with `_if_v2_migrated: true`, remaps every supplement's slot IDs from v1 → v2 (`pre_breakfast → fasted`, `breakfast → meal_1`, `pre_lunch → pre_meal_2`, `lunch → meal_2`, `pre_dinner → pre_meal_3`, `dinner → meal_3`, `after_dinner → evening`), writes each updated supplement to Supabase, and triggers a notification recompute. Trigger in App.jsx: `sched.schedule_type === "fasting" && !sched.offsets._if_v2_migrated`.

*Backend (`supabase/functions/_shared/helpers.ts`, `supabase/functions/recompute_notifications/index.ts`):*
Server-side `computeIFSlotTimesHHMM` mirrors the client. New IF v2 branch in `recompute_notifications` (gated on `_if_v2_migrated`):
- Unconditional notifications: `fasted` (30-min warning before window opens), `meal_1` ("Your eating window is open"), `window_closing` (30-min warning before window closes).
- `window_closing` is suppressed when its fire time coincides with a meal slot that has supplements (default `pre_meal_window=30` puts the last meal at exactly window_close − 30 → would otherwise stack two notifications at the same minute).
- Conditional notifications (only fire if supplements assigned): `pre_meal_2`, `meal_2`, `pre_meal_3`, `meal_3`, `evening`.
- v1 IF users (no migration flag) fall through to the legacy anchor-relative offset branch — no behavior change for them until they confirm migration.

*Data migration (`supabase/if-logs-migration.sql`, not yet run):*
One-shot SQL that renames slot keys inside `daily_logs.checked` JSONB for users with `_if_v2_migrated = true`. CASE branches ordered longer-prefix-first to avoid double-substitution (e.g. `pre_breakfast` matched before `breakfast`). Intended to be run manually via Supabase Dashboard once all real IF users (currently just Bego) have completed the in-app migration. Without this, past daily logs would show as un-checked under v2 slot IDs even though they were completed under v1 slot IDs — adherence history would visually regress.

*Commits (May 17 — IF v2 base):* `80a386d` core, `d091e5b` UI, `ee5d94c` home surface + migration screen, `25e0a36` notification scheduling, `82d2ef8` daily_logs migration SQL.

**Follow-up — bug fixes from real use (May 17, same session):**
- `5aa7ce9` — ScheduleTab seeds cascade/fasting/fixed defaults when switching modes, so the editor no longer renders empty inputs when you flip from one mode to another.
- `7770c27` — Protocol creation now auto-pushes to the detail screen and opens the add-supp modal. Archived protocols get a `+` button, lose the Active/Stopped tabs, and gain inline delete per row. Stopped tab on Active/Paused protocols also got an inline delete. New `deleteSuppById` helper for delete-without-edit-form. Mobile ProtocolLibrary call site got the missing `token` / `onActivateReceived` props (clinician-sent protocols were invisible on mobile).
- `3d049f4` — Schedule editor blocks gate on `selectedCard` not `localMode` (clicking Anchor while previously on fasting kept rendering the fasting form). Trash icons in ProtocolDetailScreen use `theme.status.danger` red.

**Follow-up — post-IF-v2 audit (May 17, same session):**
- `1a0f5fb` — `calculateAdherenceForDate` and the inline App.jsx streak loop now iterate per-supplement instead of per-CORE_SLOT. IF v2 users were seeing 0% adherence rings and inflated 30-day streaks because IF slot IDs aren't in CORE_SLOTS. Also fixes the pre-existing miss where anytime supps weren't gating the streak.
- `716b51d` — IFMigrationScreen now exposes an Evening picker (Off / Fixed time / Before sleep). Pre-selects "Before sleep" with default 22:00 + 1hr offset when the user has any legacy `after_dinner` supps — those supps were getting orphaned post-migration because they'd remap to "evening" slot while `evening_mode` stayed null.
- `f5af642` — Onboarding fasting block gains the same Evening picker (cascade modes already had it).
- `2c07e5e` — Cleanup: removed unreachable `START_LABELS.fasting` / `START_SUBTITLES.fasting` in Hero, removed the unreachable `rx + fasting → "Anchor"` branch in `getSlotLabelForMode` / `getModeSlotLabel`, fixed stale loop comment in `recompute_notifications`, and `seedConfigForMode` now defaults `eating_window_start` to "12:00" (DEFAULT_CONFIG value) instead of null when switching INTO fasting, so the resulting schedule is immediately notifiable.

**Critical fix — schedule "not saving" was actually a read bug (May 17):**
- `cf618b6` — `dbGetSchedule` did `SELECT *` from `user_schedule` with no `user_id` filter. RLS wasn't enforced at the DB level, so PostgREST returned rows for every user; the app's `[0]` picked some other user's stale 'none' row instead of the current user's saved schedule. Every save fired correctly — the read was looking at the wrong row.
- Same shape fixed in three other queries: `dbGetAdherenceCounts(userId, ...)`, `dbGetSupplementHistory(userId, t)`, `dbGetReceivedProtocols(patientId, t)`. dbAddSupplementHistory also got user_id in the body (was relying on NULL-from-JWT injection, which caused NULL-keyed duplicate rows).
- `dbSaveSchedule` now does DELETE-then-INSERT scoped to user_id so duplicate rows can't leak.
- `2730252` — Anchor card click now auto-picks Medication and fires the save immediately. Was deferring to sub-mode click, which meant force-closing the PWA before the sub-mode pick lost the selection. User reproduced the bug in production; this was the user-facing symptom of the deeper RLS issue.

**Audit + 3-round cleanup pass (May 17, same session):**
Full frontend/backend audit (acting as HoD/FED + backend reviewer) produced a punch-list of ~15 items split into Round A (safety/source-of-truth), Round B (touch/rollback/polish), Round C (dead-code/observability). All shipped.

- `e8eab9f` Round A — `makeSegBtnStyle(theme)` exported from design-system, three local copies removed across ScheduleTab / Onboarding / IFMigrationScreen. Raw `gap: "6px"` → `spacing.xs2` across SlotCard / ProtocolDetailScreen / ManageProtocolScreen (6 sites). Sidebar `gap: 2` → `spacing.xxxs`. Plus **Supabase Dashboard work**: RLS enabled on all 9 tables (user_schedule, daily_logs, user_supplement_history, supplements, protocols, user_profiles, protocol_sends, push_subscriptions, notifications_queue), 22 policies live; UNIQUE constraints added on user_schedule(user_id), daily_logs(user_id, log_date), user_supplement_history(user_id, name).
- `5e1514b` Round B — SlotCard checkbox tap-area: `padding: 10, margin: -10` → `(touch.min - 24) / 2` (intent-expressing formula). WeekStrip selected-day shadow → new `shadows.elevated` token. ProtocolDetailScreen inline name-edit input baseline / border tokenized. TabBar buttons gain `minHeight: touch.min`. ProtocolDetailScreen Stopped-tab rows use `touch.row` (52pt, multi-line name+dose per Cat 13). ProtocolLibrary IntentOption is now a real `<button>` (was a div with onClick). Backend: `activateReceived` rolls back the partial protocol on partial-supp-insert failure; `recompute_notifications` auto-stop changed from `lte("ends_at", today)` to `lt(...)` so today's last-day notifications fire; `dbUpdateProtocol` PATCH adds defensive `user_id=eq.` filter alongside RLS.
- `ab249c3` Round C — Deleted non-Achromatic themes (Light, Dark, Terminal Amber/Cyan/Phosphor/Magenta) and SLOTS_LIGHT/DARK consts from design-system.js. Removed dead top-level `colors` and `gradients` exports. design-system.js dropped from 688 → 259 lines; **production bundle from 383.57 KB → 373.03 KB (−10.5 KB)**. PatientsPanel raw fontFamily → `typography.fontHeading`. lib/theme.jsx 'system' branch (was referencing undefined `getSystemTheme()`) removed. Backend: `refreshSession` memoized via in-flight promise so parallel 401s share one /token call. IF window_closing dedupe threshold widened 60s → 5min. `recomputeNotifications` returns boolean; `recomputeWithToast` helper in App surfaces failures as toasts on user-action call sites. `dbGetAdherenceCounts` gained `daysBack=365` parameter to cap scan size.

**Empty states + visual identity pass (May 17, earlier in the day):**
- `565eaea` — Replaced 💊 emoji empty-state visual with `◯` glyph (matches existing slot iconography `◎`/`●`/`◑`). Auth screen pill emoji replaced with "Origin" wordmark. Empty-state copy unified ("Nothing X yet" for secondary list empties, "No X yet. [CTA]" for actionable empties).
- `a64a267` — Deleted orphan spike files (SettingsModal.jsx, ManageSupplementsSheet.jsx) and May-6 scratch notes. Added `.claude/` to .gitignore.

**Mobile chrome unification (May 17, evening pass):**

*Mobile home header refactor (commit `c7cbf3f`):*
Settings moved off the sidebar nav into the top-right `AccountAvatar` (the avatar now accepts an `onClick` prop and a `size="touch"` variant for the 44pt mobile target). The body CTA row (Add + Library buttons) was removed; both actions migrated up into the header. AccountAvatar acts as the Settings entry point on both mobile and desktop.

*Protocol Detail header cleanup + overflow menu (commit `730a3e4`):*
The body action stack on the protocol detail screen (Send to patient + lifecycle CTA + delete CTA) was collapsed into a `⋯` overflow menu in the sticky header. Menu items are status-aware (Pause/Archive/Activate/Delete) and clinician-aware (`Send to patient` only when `isClinician=true`). Mobile call site explicitly passes `isClinician={false}` so the action is hidden on the phone surface. Header now reads `[<] Protocol name [⋯] [+]`.

*Modal slide animation fix (same commit `730a3e4`):*
Modals were popping into final position instead of sliding up from the bottom. Root cause: `transform: open ? translateY(0) : translateY(100%)` evaluated on the same render where `mounted` flipped true, so the browser never saw the `translateY(100%)` starting state. Split into two states — `mounted` (controls DOM presence, stays true through the 300ms exit) and `shown` (controls visible position). After mounting, a double `requestAnimationFrame` flips `shown` to true so the CSS transition has a starting frame to animate from. Affects every modal in the app (New item, Edit item, all overflow + confirm modals).

*Slide-in screen icon parity + header order + Active row dose/notes (uncommitted, this turn):*
Three small follow-ups after the chrome refactor.
1. Slide-in screen headers (`SettingsScreen`, `ProtocolLibrary`, `ProtocolDetailScreen`) were using raw `<button>` chrome with no border — visually drifted from the home header chevrons + `+`/Library icons which use `Button variant="icon"` (44pt, 1px subtle border). Unified all of them to `Button variant="icon"` so every header chrome icon across the app now reads the same. Includes the new `⋯` overflow trigger.
2. Home header icon order swapped from `[+] [Library]` → `[Library] [+]` so the most-used action (Add) sits closest to the right edge for thumb reach.
3. Protocol Detail Active tab rows previously showed only `name + category icon + Pause/Play`. Updated to mirror the home `SlotCard` supplement row: `name + category icon + Paused badge` on line one, `dose · notes` on line two. Row min-height bumped from `touch.min` (44pt) to `touch.row` (52pt) per Cat 13.

**Clinician desktop audit + Phases 0–2 (May 17, evening — uncommitted):**

*Audit:*
Mobbin-informed UX/UI audit of the desktop clinician dashboard. Reference scans: Linear (sidebar density, kbd patterns), Deel/Fresha (provider patient lists with stat headers), Sentry/Writer (sparkline trend columns, observability KPI cards), Fitbit (in-range stats by category), Runna/Fitplan (structured-program patterns), Bear (calm typography). Produced a 4-part deliverable: (1) audit of current desktop regions, (2) discovery scan organized by pattern, (3) ranked prioritized recommendations, (4) anti-patterns to avoid (streak guilt, color-coded categorization, chat-shape provider comms, etc.). Single largest leverage finding: the PatientsPanel component (rich row: avatar + name + N protocols + adherence % + status pill) was unused in the live layout; the actual rendered patient list in the sidebar was name-only. That row pattern was the foundation for Phase 1.

*Phase 0 — primitives:*
- New `Sparkline.jsx` — single-color SVG trend line for dense list rows. Default 60×12, accepts a 0–100 values array, optional endpoint dot + baseline hairline, breaks line across null values. Registered in design-system page with 8 variants.
- New `StatusDot.jsx` — colored 4–6px dot keyed by status token (`success` / `warning` / `danger` / null). Designed to pair with `text.primary` label so color carries severity without dominating the surface. Registered in design-system page.

*Phase 1 — sidebar revival:*
- Patient enrichment lifted from PatientsPanel (orphan component) into App.jsx. New `patientStats` state map keyed by patient id. After patients resolve, fetches protocols + supps + schedule + 30d logs per patient in parallel and computes per-patient `activeCount` + `adherence7` + `adherence30` + 30-element `sparkline` array using `calculateAdherenceForDate`. Imports added: `calculateAdherenceForDate` to App.jsx.
- Sidebar rewritten: brand wordmark removed (hoisted to top bar — see Phase 2.1), "Patients" collapsible toggle removed (flat list), patient rows redesigned left-aligned: avatar + name → `● 7d% · N protocols` → 30-day sparkline (80×10) stacked vertically. Search input added at top with in-place filter. "N need review" caption (warning color) appears when ≥1 patient is below 80%. Archived patients render as a static section (label + rows) when present. My Origin moved to a footer below a divider.

*Phase 2 — patient detail polish:*
- New `PatientIdentityBlock` inline in App.jsx — avatar + name (heading) + meta line (`joined Mar 12 · 3 protocols · logged today`). Replaces the bare-name header when a patient is selected. Meta builds from `selectedPatient.created_at`, `patientStats[id]?.activeCount`, and the most-recent log_date in `patientTrendLogs`. Patient actions overflow `⋯` stays trailing.
- `PatientAnalyticsPanel` moved out of the right aside into the main column under `PatientDetailPanel`. Right aside stays focused on the patient's protocols. Removes the architectural awkwardness of the diagnostic surface (by-supplement / by-time-of-day / activity / notes) being stacked under a nav-shaped component (ProtocolLibrary).
- `InsightsPanel` lost its bottom "Configure schedule / Manage protocol" buttons + the `onConfigureSchedule` / `onManageProtocol` props. The matching `openManageSchedule` / `openManageProtocol` helpers were dead-coded out of App.jsx (only used by those buttons). Settings is reachable via the avatar; Manage Protocol via the right-column ProtocolLibrary.
- `TodayPanelHeader` gained a "VIEW ONLY" chip in `isReadOnly` mode (replaces the day-label CTA slot when the clinician is viewing a patient). Plus `whiteSpace: nowrap` + `textOverflow: ellipsis` on the day label so the header reads cleanly even in narrower columns.
- Considered 60/40 Today/Insights ratio in patient view per audit recommendation; reverted to 50/50 after real-screen evaluation — at typical desktop widths the 40% TodayPanel column crowded the header and truncated supplement names. Analytics weight comes from PatientAnalyticsPanel stacked below.
- Skipped applying StatusDot to legacy `PatientsPanel.jsx` rows (Phase 2f in the plan). That component isn't mounted in the live layout and will be rewritten in Phase 3 (Patient Roster as default landing). Updating dead code now is throwaway work.

*Phase 2.1 — top bar restructure (Sofia's design call mid-session):*
- New full-width top bar in App.jsx desktop layout (above the three panels): brand wordmark + greeting + clinician avatar. Sofia then refined: drop the greeting from chrome entirely and surface "Hello, Sofia" only inside the personal cockpit content as a heading. Result: top bar is just `Origin` (left) + clinician avatar (right). When viewing a patient, the in-context PatientIdentityBlock owns the main-column header; "Hello, Sofia" doesn't render. Personal warmth lives in personal mode; clinical chrome stays restrained.
- Outer desktop container changed from horizontal flex → vertical flex (header above panel row).
- Patients dropdown toggle removed from the sidebar per Sofia's call ("no chevron, flat list"), patient rows fully left-aligned.

*Files changed:*
- `src/App.jsx` — top bar, `PatientIdentityBlock` component, patient enrichment effect, analytics panel moved, greeting heading inside personal home, prop cleanup.
- `src/components/Sidebar.jsx` — rewrite (brand removed, no dropdown, rich rows, search, count, my origin footer).
- `src/components/InsightsPanel.jsx` — dropped Button import + two quick-action buttons + two props.
- `src/components/PatientDetailPanel.jsx` — comment for 50/50 decision.
- `src/components/TodayPanelHeader.jsx` — View only chip in read-only, nowrap on day label.
- `src/components/Sparkline.jsx` — NEW.
- `src/components/StatusDot.jsx` — NEW.
- `src/components/design-system-page/registry.js` — Sparkline + StatusDot variants.

*Commit:* `c94792d` — pushed to main on May 18.

### Session of May 18

**Working-tree cleanup — three bundled commits + push.**
The working tree had a backlog of pending clinician work that hadn't been committed yet. Sorted into three logical commits and pushed all of them.

*Commit `961d2d6` — clinician backend.*
- `supabase/clinician-link-migration.sql` (NEW) — adds `shares_adherence_with_clinician` opt-in toggle on `user_profiles`. Adds patient↔clinician RLS so a clinician can read a patient's supplements, protocols, daily_logs, and schedule only when (1) `user_profiles.clinician_user_id = auth.uid()` AND (2) `shares_adherence_with_clinician = true`. Patient-side writes remain owner-only.
- `supabase/clinician-notes-migration.sql` (NEW) — new `clinician_patient_notes` table (one row per (clinician, patient) pair, holding `notes` text + nullable `archived_at`). RLS restricts read+write to the owning clinician. Unique index on `(clinician_id, patient_id)` so PostgREST upserts work via `on_conflict`.
- `supabase/demo-seed.sql` — stamps the four demo patients with `shares_adherence_with_clinician = true` so the clinician demo surface shows full data without each demo patient flipping the toggle.
- `src/lib/api.js` — `dbGetClinicianNote(clinicianId, patientId, t)`, `dbUpsertClinicianNote(row, t)`, `dbGetClinicianNotes(clinicianId, t)`.
- `src/lib/adherence.js` — gained `calculateProtocolAdherence` (per-protocol avg over a window that starts at the protocol's start_date, capped at `daysWindow` days), `calculateSupplementAdherence` (per-supp avg + expected/taken counts), `calculateSlotAdherence` (per-slot aggregated across all supps in that slot), `getUpcomingEndings` (supps with `ends_at` in the next N days for the Insights panel), `buildActivityLog` (recent pause/stop/resume/add/archive events). Also: `countExpectedChecks` + `calculateAdherenceForDate` now accept an optional `activeSlotIds` Set to filter the denominator — fixes the IF v2 case where stale legacy slot ids in a supp's `slots` array inflated expected counts.

*Commit `738956c` — clinician surfaces.*
- `src/components/PatientAnalyticsPanel.jsx` (NEW) — three stacked cards inside the patient detail surface: By supplement (30-day adherence, worst-first, colored pct), By time of day (mode-aware slot set, worst-first), Recent activity (last 10 events from `buildActivityLog`). Plus a private notes textarea (save-on-blur, re-syncs on patient change).
- `src/components/ProtocolLibrary.jsx` — adherence-per-row when an `adherenceMap` prop is provided (clinician patient view). Send-to-patient affordances when a patient is selected. `ProtocolRow` respects an optional disabled state for read-only contexts.
- `src/components/ProtocolDetailScreen.jsx` — send-to-patient flow in the header overflow menu (clinician-only, hidden on mobile and patient-view drill-ins). Patient picker modal lists the clinician's active patients.
- `src/components/SettingsScreen.jsx` — `desktop` prop swaps the container shape from a fixed slide-from-right takeover (mobile) to a flow-positioned panel that fills its host (the right aside in App.jsx). Back-button uses shared `Button variant="icon"` chrome for parity with other slide-ins.
- `src/components/Modal.jsx` — `useIsDesktop` hook. On desktop (≥1024), the modal renders as a centered card (480px max, 80dvh max) with scale-in animation instead of the mobile bottom-sheet slide. Backdrop blur disabled on desktop. Drag-to-dismiss handlers are mobile-only.
- `src/components/WeekStrip.jsx` — `activeSlotIds` prop plumbed through WeekStrip → DayCell → `calculateAdherenceForDate`. Without this, IF v2 patients' ring math inflates expected counts because their supps carry both legacy and v2 slot ids from migration.
- `index.html` — hides native scrollbars globally (Firefox + WebKit). Content still scrolls; the visible track is suppressed so multiple scrollable panels rendering side-by-side on desktop don't draw a forest of scrollbars.

*Commit `2ce9af7` — chore: gitignore `supabase/.temp/` and untrack the `cli-latest` tool artifact that was getting bumped on every CLI command.*

All three commits pushed to `origin/main` (range `730a3e4..2ce9af7`).

---

### Session of May 18 — Mobile patient UX/UI audit shipped end-to-end

**Context.** Full mobile patient experience audit performed against best-in-class daily-ritual apps (Streaks, Habitify, Apple Reminders, Apple Health Meds, Things 3, MyFitnessPal, Epsy, GoodRx, Hims, etc., via Mobbin discovery). 5-part audit produced 12 recommendations + 5 design decisions (D1–D5). All ranked by leverage; locked decisions before implementation. Sessions run sequentially in one branch (`worktree-session-2-autocomplete-expand`, off main).

**Locked design decisions (binding):**
- **D1** — Cascade math with no anchor set: slot times read `--:--`; notifications dormant; user can still log without anchor. Logging fully decoupled from anchor.
- **D2** — Hero copy ladder voice: anchor-aware, contextual ("Started at 05:50" / "Not started yet" / "Done for today").
- **D3** — Take-all on slot icon: ship it with a first-run InlineTip hint.
- **D4** — Day-1 teaching tip: yes, schedule-mode-specific copy, dismissible via InlineTip primitive.
- **D5** — Log-at schema: per-supplement timestamp persistence in `daily_logs.checked` jsonb. New shape `{ checked: true, at: "HH:MM" }` coexists with legacy `true` — backwards-compat read in `isChecked`; no DB migration needed.

**Pass — Session 1 (week strip + sign-out confirm + eyebrow cleanup).**
- Mobile branch in App.jsx replaced single-day chevron date row with `<WeekStrip compact>`. `dbGetDailyLogsRange` fetch + `weekLogs` sync effects' `isDesktop` gates removed so mobile fetches the rolling 7-day window.
- `WeekStrip.jsx` got a `compact` prop. `DayCell` now accepts `compact`, switches between 56px (desktop) and 28px (mobile) ring sizes, tighter cell padding, smaller TODAY badge styling. Compact horizontal cell padding is `xxs` (4) so the ring fits comfortably at 320px viewport (iPhone SE 1st gen). TODAY badge sits in a reserved-height top slot to keep all cells the same height.
- `AdherenceRing` gained `showText` prop (default true preserves desktop) — passed `showText={!compact}` on mobile so the ring renders as a clean arc (no `%` text inside the 28px ring).
- "MY PROTOCOL" eyebrow + `dayLabel` + `goDay` chevron handlers removed; `ChevronLeft/ChevronRight` imports cleaned from App.jsx (now used only inside WeekStrip).
- `SettingsScreen.jsx` sign-out wired through a confirmation `Modal`: "Sign out of Origin? · You'll need to sign in again to access your protocol. Your data stays safe." Cancel + Sign out buttons.

**Pass — Session 2 (recents on autocomplete + remove forced auto-expand).**
- `SupplementNameAutocomplete.jsx` now tracks a `focused` state. When the field is focused-and-empty AND `history.length > 0`, renders top-4 recents below the input as Button `variant="selector"` chips. Empty-state chips dismiss when user types ≥1 char; existing 3+ char matching dropdown unchanged.
- `SlotCard.jsx` initial expanded state changed from `useState(!allDone)` + `useEffect` forced re-sync to `useState(status === 'now' || status === 'missed')`. Only actionable slots auto-expand on mount; user toggles freely after — no forced re-expansion when a check flips.

**Pass — Audit-discovered bug fixes (4).**
- **Bug 1** — `isSupplementActiveOn` returned `true` for all indefinite supps regardless of date. Result: any new supp appeared on every past day as unchecked. Fix: added `created_at` floor filter at the top of `isSupplementActiveOn` — applies to all treatment modes. New supps only render on days ≥ their creation date.
- **Bug 2** — `ProtocolDetailScreen.jsx` header used `flex justify-content: space-between` with a `flex: 1` title between back chevron (1 button) and right group (1–2 buttons). Title was centered to the *available flex space*, not the screen. Fix: converted to CSS grid `gridTemplateColumns: minmax(60px, 1fr) minmax(0, auto) minmax(60px, 1fr)`. Outer columns equal-flex; title in auto-sized center column stays screen-centered regardless of right-side button count. Added `overflow: hidden; text-overflow: ellipsis` for long names.
- **Bug 3** — "late" badge on past-day read-only slots used warning ochre that didn't dim uniformly with the parent `opacity: 0.6` wrapper. Fix in `SlotCard.jsx`: when `isReadOnly`, switch the badge from `variant="missed"` (warning) to `variant="neutral"` (achromatic). In edit mode (and on today), warning ochre returns.
- **Bug 4 / Audit polish** — `WeekStrip` compact cell padding (vertical `xs`/horizontal `xxs`) and 28px ring sized to fit cleanly at 320px viewport with breathing room.

**Pass — Session 3 (past-day Edit-in-header + Day-1 tip + InlineTip primitive).**
- New `src/components/InlineTip.jsx` primitive: dismissible inline tip with left accent border, uppercase label, body, top-right X. Dismissal persisted in `localStorage` under `origin.tip.<id>`. Reusable: powers both the Day-1 tip and the take-all first-run hint.
- App.jsx mobile header right-side actions now conditional on past/today. Past: Edit/Done icon (Pencil → "Done" with accent treatment). Today/future: [+] icon. Library icon stays in both cases.
- 0.6 opacity dim on past-day content wrapper REMOVED. Replaced by an eyebrow inside the Hero card showing "Viewing [date] · read-only" (suffix `text.muted`) or "Viewing [date] · editing" (suffix accent white).
- `Hero.jsx` `pastDayEditing`/`setPastDayEditing` props removed (Edit lives in App header now).
- `isDay1` derived from `profile.created_at === today`. New `DAY1_TIP` constant in App.jsx keyed by schedule mode (medication / wakeup / fasting / fixed — no tip for "none"). Tip renders below the empty-state CTA when `!isPast && isDay1 && DAY1_TIP[scheduleMode]`. Schedule-mode-aware copy explaining how anchors / windows / fixed times work.

**Pass — Session 4 (anchor-aware Hero copy ladder + Start-day decoupling + size consistency).**
- `Hero.jsx` fully rewritten around a single `getHeroState({...})` helper that returns `{ eyebrow, status, submeta, statusKind, statusIsDone, showSetAnchor, editAnchorOn, anchorPrefix, anchorTime }`. Six prior nested-ternary mode branches collapsed into one state object consumed by a single render template.
- **D1 implementation** — gating "Start my day" CTA removed. Replaced by an inline `+ Set anchor` pill (calls existing `startDay()` action). Logging fully decoupled from anchor: slot times read `--:--` in anchor mode without `pillTime`; checkbox + toggleCheck + log-at all work without the anchor being set.
- **D2 implementation** — anchor-aware copy ladder:
  - Today, anchor mode, no anchor: `Viewing Today, [date]` / `Not started yet` / "Set your meds time…" + `+ Set anchor` pill
  - Today, anchor mode, anchor set, partial: `Viewing Today, [date]` / `Started at 05:50` + inline `edit` / `X of Y done`
  - Today, anchor mode, all done: `Viewing Today, [date]` / `Done for today` (green) / `Started at 05:50` + edit
  - Today, fixed: `Viewing Today, [date]` / next slot time (big) / `Next · [slot label]`
  - Today, fasting: `Viewing Today, [date]` / eating window time (big) / `Eating window opens`
  - Today, none: `Viewing Today, [date]` / day name / completion
  - Past: `Viewing [date] · read-only` / completion (green if done) / anchor info
  - Future: `Viewing [date]` / day name
- **Hero size consistency** — Card has `display: flex, flexDirection: column, justifyContent: center, minHeight: 132`. Content centers vertically within the card; shorter states (e.g. fasting with just a time) read as the same shape as busier states (anchor + completion + edit).
- **Success-green unified** — green now always lives on the status row (primary celebration position). Submeta is always neutral grey.
- **Eyebrow consistency** — past + today both render eyebrow inside the Hero card via the same slot (`{ text, suffix?, suffixTone? }` shape). Identical visual line on every state.
- **Anchor edit affordance** — anchor info (`Started at 05:50`) is now a `{ prefix, time }` structure. In-line edit replaces only the time portion with a slim Input + Save button; the `Started at` prefix stays in place. `statusTextStyle` is extracted as a single style object used by both the display div and the edit prefix span so typography is identical between states — eliminates the previous "Started at jumps" issue. Single parent flex with `alignItems: "center"` everywhere — no baseline/center alignment switching.
- **Input clock icon hidden globally** — `input[type="time"]::-webkit-calendar-picker-indicator { display: none }` rule added in `index.html`. Applies to all time/date inputs (Hero, schedule editor, EditForm cycle dates, etc.).
- `Input` primitive now sets `colorScheme: dark` so any native UI that does render (e.g. accessible time picker fallbacks) uses dark-theme styling.
- Hero `minHeight: 96` on the inner flex container reserved for the ring + status; `STATUS_ROW_MIN_HEIGHT: 44` reserves the status row height so the slim time input doesn't reflow the card.

**Pass — Session 5 (log-at pill + LogAtSheet + per-supp timestamp schema).**
- New `src/components/LogAtSheet.jsx` — `Modal`-based bottom sheet (mobile) / centered modal (desktop) for logging a missed supplement at a specific time. Shows the supplement name in the title, the original slot due time + slot label as reference text, a time input defaulted to current time, and a primary `Log at HH:MM` button with live label updates.
- App.jsx schema-compat reads:
  - `checkValue(sid, suppId)` raw read
  - `isChecked(sid, suppId)` truthy for both `true` (legacy) and `{ checked: true, at: "HH:MM" }` (new)
  - `checkedAtTime(sid, suppId)` returns the `at` string when present, else null
  - `toggleCheck` writes `true` for normal toggle, deletes the key on uncheck, preserves prior `at` on re-check
  - `logCheckAt(sid, suppId, atTime)` writes the new structured shape
- `SlotCard.jsx` "log at…" pill renders on rows where status is `missed`, supp isn't checked, not read-only, not future. Warning-ochre border + Clock icon. Tapping calls `openLogAt(slot.id, supp, slot.label)` which sets `logAtTarget` and opens the `LogAtSheet`. Supp rows that were checked via log-at display "at HH:MM" with a small Clock icon next to the dose line.
- `App.jsx` `submitLogAt(time)` calls `logCheckAt(target.sid, target.suppId, time)`.
- **Schema:** `daily_logs.checked` jsonb column now stores either `true` (legacy / normal-toggle) or `{ checked: true, at: "HH:MM" }` (log-at). Adherence math (`countExpectedChecks` in `src/lib/adherence.js`) uses truthy checks which work for both shapes — no migration required.

**Pass — Session 6 (take-all on slot icon + first-run hint + Onboarding Step 2 live preview).**
- App.jsx `takeAllInSlot(sid, supps)` — bulk-complete all incomplete supps in a slot. Preserves prior `at` timestamps. Skips already-checked supps. No-op on read-only days.
- `SlotCard.jsx` header split into TWO side-by-side `<button>` elements: slot icon button (left, take-all) + expand button (rest of header). Both have proper aria-labels. Icon button is `disabled` (visually + non-clickable) when read-only, future, or already all-done. Nested-button HTML invalidity avoided.
- First-run hint: `InlineTip id="take-all-hint"` rendered at the top of the slot list when `hasMultiSuppSlot && !isReadOnly && !isPast && !isFuture`. Copy: "Tip · Tap the icon at the left of a slot to log every item in it at once." Dismissed via the X — never returns once dismissed.
- `Onboarding.jsx` Step 2 live preview — new `buildPreviewRows(mode, cfg)` helper computes a row list `{ icon, label, value }` based on selected schedule mode:
  - Anchor (medication / wakeup): rows show offsets from anchor (e.g. `+0:30`, `+1:00`, `+5:00`) with `Pre-Breakfast`/`Breakfast`/etc. labels
  - Fasting: rows show absolute times from `computeIFSlotTimes(cfg)` — fasted, meal_1, optional pre_meal_2/meal_2/pre_meal_3/meal_3, evening (Fixed / Before sleep)
  - Fixed: rows from `FIXED_SLOTS` with their `fixed_times` values
- Preview card sits below the configuration inputs, above the footer. Updates live as the user adjusts inputs. No preview for "none" mode (no schedule to preview).
- **InlineTip primitive reused for both Day-1 tip (Session 3) and take-all hint (Session 6)** — single dismissal mechanism, single storage key pattern (`origin.tip.<id>`).

**Production bundle.** 384.16 KB (102.43 KB gzipped) — up from May 17's 373 KB. +~11 KB for all of: WeekStrip compact mode + Hero state helper + InlineTip + LogAtSheet + take-all logic + Onboarding live preview. No regressions in build or tests.

**Branch:** `worktree-session-2-autocomplete-expand` (uncommitted as of session end — pending PR).

---

## Codebase Health

**App.jsx is ~2040 lines** (May 18 measurement, post-clinician-merge + mobile audit). Still pure orchestration — state, effects, handlers, home screen layout container. Every major rendering concern is in its own focused file. Growth from prior ~1340 came from clinician roster wiring (`activeNavItem`, `selectedPatientId`, patient data fetching/enrichment), send-to-patient flow, mobile audit (`logAtTarget` state, `logCheckAt`, `takeAllInSlot`, `isDay1`, anchor edit state), and desktop right-aside coordination.

**design-system.js is 191 lines** (was 688 before the May 17 cleanup). Only the Achromatic theme ships; the dead Light/Dark/Terminal-* themes were removed, along with the old top-level `colors`/`gradients` exports that no component imported. Production bundle 373 KB / 102 KB gzipped.

**Module structure:**
- `src/lib/api.js` — Supabase data layer + auth (43 exported functions, see API Helpers reference below)
- `src/lib/time.js` — time/date utilities
- `src/lib/notifications.js` — scheduleNotifications, SLOTS, IF_SLOTS (IF v2)
- `src/lib/adherence.js` — adherence calculations (per-date + week + streak)
- `src/lib/navigation.jsx` — NavigationProvider, screenStack, pushScreen/popScreen/resetStack
- `src/config.js` — DEFAULT_CONFIG, FIXED_SLOTS, ANCHOR_NOTES, MODES, deriveOffsets, IF_SLOT_IDS, CORE_SLOTS, computeIFSlotTimes (IF v2)
- `src/design-system.js` — single source of truth for tokens. Exports: `spacing`, `radius`, `typography`, `touch`, `layout`, `shadows`, `zIndex`, `effects`, `breakpoints`, `themes` (Achromatic only), and the reusable `makeSegBtnStyle(theme)` curry that emits `(on) => style` for segmented buttons. The dead Light/Dark/Terminal themes were deleted May 17.
- `src/data/supplements-database.js` — autocomplete static list (~300 entries)
- `src/components/`:
  - Primitives: Button, Card, Input, Label, Badge, Modal, Toast, Loader, InlineLoader, TabBar, InlineTip, Popover, SidePanel, Sparkline, StatusDot
  - Auth & onboarding: Auth, PromptName, Onboarding, NotificationPrompt, IFMigrationScreen
  - Home (mobile): Hero, SlotCard, WeekStrip (compact-mode on mobile, full-size on desktop — both call sites share the same component)
  - Home (desktop): Sidebar, WeekStrip, AdherenceRing, TodayPanel (+ TodayPanelHeader sub-component), SlotRow, SupplementRow, InsightsPanel; DayCell is a named export from WeekStrip.jsx (no standalone file)
  - Modals & screens: EditForm, ScheduleTab, SettingsScreen, ProtocolLibrary, ProtocolDetailScreen, LogAtSheet
  - Clinician surfaces (desktop): PatientRoster (default landing for clinicians), PatientDetailPanel, PatientAnalyticsPanel
  - Shared: HelperText, SupplementNameAutocomplete, DevThemePicker, ToastContext
  - Design system page (dev + portfolio): `design-system-page/DesignSystemPage.jsx`, `design-system-page/registry.js`

**API Helpers Reference (`src/lib/api.js`, 43 functions):**

*Auth:*
- `refreshSession()` — refresh JWT via stored refresh token
- `supa(method, path, body, token)` — base fetch wrapper, auto-retries on 401
- `getSession()` — validate stored JWT or attempt refresh
- `signUp(email, password)`, `signInPassword(email, password)`, `signOut()`
- `updateEmail(newEmail, token)`, `updatePassword(newPassword, token)`

*Supplements:*
- `dbGetSupps(userId, t)` — GET all supplements for user, ordered by created_at
- `dbAddSupp(s, t)`, `dbUpdateSupp(s, t)`, `dbDeleteSupp(id, t)`
- `dbGetAdherenceCounts(userId, suppIds, token, daysBack=365)` — count check marks per supplement over the last N days (default 365)

*Protocols:*
- `dbGetProtocols(userId, t)` — GET all protocols ordered by created_at asc
- `dbAddProtocol(p, t)`, `dbUpdateProtocol(p, t)`, `dbDeleteProtocol(id, t)`
- `dbPauseProtocol(protocolId, t)` — set status='paused' + bulk-reset all member supps via `dbResetProtocolSupps` (internal helper, not exported)
- `dbArchiveProtocol(protocolId, t)` — set status='archived' + bulk-reset all member supps
- `dbActivateProtocol(protocolId, t)` — set status='active'

*Daily logs:*
- `dbGetLog(userId, date, t)` — GET single daily_log by date
- `dbUpsertLog(log, t)` — POST daily_log with on_conflict upsert
- `dbGetDailyLogsRange(userId, start, end, t)` — GET logs in date range (used for week strip)

*Schedule:*
- `dbGetSchedule(userId, t)` — filter by user_id, order by updated_at desc, return latest
- `dbSaveSchedule(data, t)` — DELETE-then-INSERT scoped to user_id (workaround for missing unique constraint, kept as belt-and-suspenders even now that constraint exists)
- `dbUpdateScheduleField(field, value, userId, token)`

*Profile:*
- `dbGetProfile(userId, t)`, `dbCreateProfile(data, t)`, `dbUpdateProfile(userId, data, t)`
- `getThemePreference(userId, token)` ⚠️ stale: validates only light/dark/system
- `setThemePreference(pref, userId, token)`

*Supplement history (autocomplete):*
- `dbGetSupplementHistory(userId, t)`, `dbAddSupplementHistory(userId, name, t)`

*Clinician (May 18 backend):*
- `dbGetMyPatients(clinicianId, t)` — GET all user_profiles where `clinician_user_id` matches
- `dbGetPatientLog(patientId, date, t)`, `dbGetPatientLogs(patientId, start, end, t)` — per-patient adherence reads (RLS-gated via patient consent)
- `dbSendProtocol(send, t)` — POST protocol_sends row (clinician → patient)
- `dbGetReceivedProtocols(patientId, t)` — patient inbox of pending protocol sends
- `dbUpdateProtocolSend(id, data, t)` — patient accepts/dismisses a sent protocol
- `dbGetClinicianNote(clinicianId, patientId, t)` — fetch single note
- `dbUpsertClinicianNote(row, t)` — write/update note on patient
- `dbGetClinicianNotes(clinicianId, t)` — fetch all notes by this clinician

*Notifications:*
- `recomputeNotifications(token)` — POST to edge function with timezone

**Design system: clean.** Achromatic locked as production. All non-Achromatic themes accessible only via dev theme switcher. CSS variable font system handles typography per theme. Radius system clarified (`radius.md` for UI shapes, `radius.full` for genuinely circular).

**Onboarding and ScheduleTab share cascade logic.** Both use the same `applyCascade()` function (defined locally in each file — not a shared import, intentional — same logic, separate contexts). MEAL_ROWS constant removed from Onboarding. Both write `first_meal_offset_hours`, `meal_interval_hours`, `evening_mode` to `offsets` JSONB. `migrateConfig` in ScheduleTab exists only for legacy users who saved before the cascade system; new users never hit it.

**Accessibility state (as of May 12):**
- Touch targets: all interactive elements ≥ 44pt mobile / 32pt desktop. SlotCard expand and checkbox converted to semantic `<button>`. Aria attributes: `aria-expanded` on expand header, `aria-label` + `aria-pressed` on checkboxes.
- `prefers-reduced-motion`: global kill rule in index.html. Four exceptions re-enabled via CSS classes (`.toast-item`, `.supp-checkbox`, `.supp-row`, `.sidebar-nav-item`, `.day-cell`). Loader in its own `<style>` block.
- `:focus-visible`: white 1px outline, 2px offset, global in index.html.
- Modal keyboard: Escape closes, Tab focus trap, auto-focus on open.
- Remaining gaps: `aria-live` regions for toast/loading states, keyboard skip links.

**Known cleanup candidates (low priority):**
- Hero component has 19 props — works, but smell. Future pass could group related state into objects.
- `handleEditFormTogglePause` is dead code (no UI calls it from the Edit form anymore — Pause/Delete moved to Manage)
- Dev theme switcher widget shows 7 themes (Light, Dark, 5 Terminal variants) — could be tucked away further

---

## Known Stale / Legacy Items (Updated May 20 cleanup pass)

Real debt that exists in the codebase and DB. Not blocking, but worth tracking so future sessions don't get confused or duplicate effort.

**Database stale defaults (still present):**
- `user_schedule.schedule_type` DB default is `'medication_anchored'` — but app writes `medication` / `wakeup` / `fasting` / `fixed` / `none`. Stale DB default never gets used since app always provides a value.
- `user_profiles.theme_preference` DB default is `'system'` — but production is now Achromatic-only. Stale.

**Legacy schema columns still present (DB migration needed):**
- `supplements.timePreference` (text, default `'Anytime'`) — original pre-slot system. Stripped from `dbUpdateSupp` May 18; column can be dropped via `ALTER TABLE supplements DROP COLUMN "timePreference";` when convenient.
- `supplements.paused` (boolean) — superseded by `status` column. Currently both exist. Could be dropped via `ALTER TABLE supplements DROP COLUMN paused;`.

**Config legacy (code change needed):**
- `config.js FIXED_SLOTS` includes `injectable` and `topical` keys with their own time inputs in Onboarding Fixed Times configuration (renders extra time-picker rows users don't need). Removing requires verification that no existing schedules rely on these keys; deferred to a UI-test session.

**Cleared in May 20 cleanup pass (`b7dd146`):**
- ✅ `api.js:getThemePreference()` now validates `achromatic` (was returning null for the only valid production theme — silently broke DB sync). Mirrors `VALID_PREFS` in `lib/theme.jsx`.
- ✅ 8 `supabase/.temp/*` files untracked from git (already in `.gitignore` since `2ce9af7` but tracked from before). Files stay on disk for local Supabase CLI use.
- ✅ Reviewed handoff entry "`DEFAULT_CONFIG.offsets` includes legacy `fasted` key — pre-IF-mode rename" — actually still actively used by IF v2 (`computeIFSlotTimes` references it at config.js line 98). Entry was wrong; removed.

None of the remaining items are blocking. All are real debt.

---

## Pending Queue for Next Session

### Immediate

**0ab. July 5 deploy/test follow-ups (server push + build).** (1) **Run** `supabase/expo-push-tokens-migration.sql` on prod. (2) **Deploy** `process_notifications_queue` — auto-deploys on push to `main` (Supabase GitHub integration), so it goes live when `terminal-elevated` merges; or deploy manually to test sooner. (3) **New EAS build** (server-push token registration + `react-native-webview`/`expo-file-system` are native — need a build) + **test on a real device**: notifications actually fire (and skip done items / un-anchored days), and the PDF preview → share → filename all work on-device. (4) VAPID/Expo: the Expo Push API needs no key/secret from us (Expo manages APNs), so no new env vars. (5) EAS build cap = 15/mo (free); this cycle spent ~1 (build 14). — **Also from June 30:** demo account for App Review (`appreview@abismo.design`) + TestFlight "Sign-In required" creds; build 14 is in TestFlight processing.

**0aa. June 29–30 polish follow-ups.** (1) **Merge `terminal-elevated` → main** after an end-to-end pass (main is untouched; all the icon/splash/onboarding/schedule-versioning/modal work is on the branch). (2) **Password field decision** — onboarding/signup triggers iOS Automatic Strong Password (cover view blocks typing on the Simulator). Open: keep it + disable AutoFill in the sim for testing (current), OR a code change to drop the strong-password takeover on the signup field. (3) **Onboarding wizard** — `'none'` skip + step 2 for `fasting`/`fixed` modes still want an on-device eyeball (Sofia confirmed the overall flow looks good; ScheduleTab building block verified). (4) Cut a fresh **TestFlight build** when ready — the simulator build already has the new icon/splash baked in.

**0z. iOS build 11 follow-ups (June 26) — Sofia to verify on-device.** See the top "Last updated June 26" entry for full context. (1) Test **account deletion** with a throwaway account on build 11 (Edge Function is live in prod; nothing calls it until build 11 ships). (2) Eyeball **Dynamic Type at 1.4×** (Today / Onboarding / Edit modal) + **Reduce Motion** on. (3) Submit **build 11** (not 10) for external Beta App Review — remove build 10 from the slot first. Minor/optional: align Info.plist deployment target (12.0 vs 15.1, cosmetic); add an in-app-deletion mention to `privacy.html`; the compact numerics (WeekStrip / AdherenceRing / Badge) intentionally don't scale — revisit only if the rendered check says they should.

**0. Peer-to-peer protocol sharing — DONE + VERIFIED (May 20 evening).**
Full pipeline tested end-to-end: send by email, three-intent receive (Stack/Replace/Save) + Decline, Library badge counts and clears, activate-from-archive picker, send from active or archived, push notification delivery confirmed via Bego. CORS preflight bug discovered and fixed mid-test (the new edge function wasn't allowing the `apikey` header — see Last Updated entry at top for the full debug trail).

**0a. Mobile-only verification pass (~1h).**
After the May 20 afternoon mobile-only pivot, verify the personal-mobile flows still work cleanly on real devices and in the desktop phone-frame. Specifically: (1) sign-in + Auth screen renders inside the phone-frame, (2) onboarding step-through, (3) Hero / WeekStrip / SlotCards / LogAtSheet all render correctly on iPhone widths (320 / 375 / 390), (4) modal bottom sheets anchor inside the phone-frame on desktop (not stretched across viewport), (5) Settings + ProtocolLibrary still reachable + functional. Flag any layout breakage from removing the desktop branch as the source of truth.

**0b. Portfolio link update at vonhauske.design/origin-app.**
Update the portfolio entry to reflect the May 20 mobile-only pivot, the new peer-to-peer share feature, the `/design-system` URL, and any copy changes needed.

**Parked items (moved out of queue) — see "Parked: Clinician Dashboard → separate product" section at the top of this doc:**
- ~~Protocol Templates surface~~ (WIP preserved on `wip/clinician-product` branch, commit `f1423ca`)
- ~~Patient Roster~~ (DONE May 18, commit `483eec0`, now dead code in App.jsx desktop branch)
- ~~Phase 4 power user features (⌘K palette, WeekStrip zoom)~~ — clinician-product scope
- ~~Phase 5 clinical narration (anomaly callouts, MetricLabel)~~ — clinician-product scope

### Highest priority

**1. Apple HIG remaining gaps (foundational pass shipped May 12, color contrast shipped May 15, empty states shipped May 17, Apple-bar typography audit shipped May 25–26).**
The foundational pass shipped touch targets, reduced-motion, focus states, and Modal keyboard. Color contrast (text.muted → text.secondary) shipped May 15. Empty states tokenized + decorative-emoji replaced with `◯` glyph May 17 (commit `565eaea`). Apple-bar screen audit + Tier 3 typography sweep + Phase A/B/C shipped May 25–26 (see Last Updated entry above for full scope). Remaining:
- **`aria-live` regions:** Toast announcements and loading state changes not announced to screen readers.
- **Keyboard skip links:** no skip-to-content link for keyboard-only desktop navigation.
- **Input primitive `error` prop:** ProtocolDetailScreen's send-to-user email input needs error-border and surface-aware background to migrate to Input primitive (deferred from Phase A Session 4).
Estimated: 1 session for aria-live + skip links. Input error prop is a separate mini-session.

**1a. DB perimeter — DONE May 17 (Supabase Dashboard work, no git commit).**
RLS enabled on all 9 tables in public schema (user_schedule, daily_logs, user_supplement_history, supplements, protocols, user_profiles, protocol_sends, push_subscriptions, notifications_queue). 22 policies live — original owner-only + clinician_reads_patient_* policies preserved; my proposed duplicates dropped during cleanup. UNIQUE constraints added on `user_schedule(user_id)`, `daily_logs(user_id, log_date)`, `user_supp_history_user_name_unique` on `user_supplement_history(user_id, name)`. The DELETE-then-INSERT in dbSaveSchedule is now belt-and-suspenders; the constraint enforces uniqueness at the DB.

### Medium priority

**2. Protocol Library — Phase 1-3 SHIPPED (May 16).** See Features Shipped. Phase 2 (export/import via link) and Phase 3 (adherence sharing) are next clinician roadmap milestones — unstarted.

**3. Web Push notifications — SHIPPED** (moved from pending — confirmed via DB diagnostic May 11)
Service Worker, VAPID subscription flow, `recompute_notifications` + `process_notifications_queue` edge functions all live. `push_subscriptions` table exists, 2 users have `notifications_enabled = true`, 68 notifications currently queued. Commits: `1983728` (sub flow Pass 2), `a0ff155` (edge function + frontend), `4a25934` (process queue). Remaining work: verify notification delivery reliability for real users (OVH and Bego), any UX gaps discovered from real use.

**4. Configurable meal count — IF side addressed (May 17).**
IF v2 makes meal_count a first-class user-facing setting (2 or 3 meals, with the slot picker filtering accordingly). Cascade-mode meal count (Medication / Wakeup) is still hard-coded to 3 — separate decision if/when that becomes friction.

### Mobile audit (May 18) — DONE + MERGED
**Full audit shipped end-to-end across 6 sessions on `worktree-session-2-autocomplete-expand`, merged to main in commit `1c6eaec`.** See "Session of May 18" in Today's Major Work for the detailed implementation log. Items shipped:

| Rec | What | Where to see it |
|---|---|---|
| 1 | Week strip on mobile (compact mode) | Mobile home above Hero |
| 2 | Decouple Start-day from logging (D1) | Hero "+ Set anchor" pill in no-anchor state |
| 3 | Log-at pill + time picker sheet (D5) | Missed slot rows → `LogAtSheet` |
| 4 | Recents on empty autocomplete | EditForm Name field, focused + empty |
| 5 | Remove forced auto-expand on SlotCard | Slot cards on home |
| 6 | Past-day Edit in header (replaces opacity dim) | Mobile header right-side on past days |
| 7 | Take-all on slot icon (D3) | Slot icon left of header on mobile |
| 8 | Sign-out confirmation modal | Settings → Sign out |
| 9 | Onboarding Step 2 live preview | New-user onboarding step 2 |
| 10 | Hero composition cleanup | Single `getHeroState` helper + render template |
| 11 | Anchor-aware Hero copy ladder (D2) | All Hero states |
| Polish | Day-1 inline tip (D4) + InlineTip primitive | Home empty state for new users |
| Polish | "MY PROTOCOL" eyebrow + chevron date row gone | Mobile header |

### Next session — Lifecycle consolidation + soft delete (locked May 18, ~4–6h, bundled)

Three workstreams that sit in the same conceptual neighborhood and touch overlapping files (`App.jsx`, `ProtocolLibrary.jsx`, `EditForm.jsx`, manage flows). Bundle into one session.

**Workstream 1 — Supplement lifecycle: drop Stop entirely (keep Pause only).**
Current shipped state has both `paused` (legacy boolean) and `status` (`active`/`paused`/`stopped`). Sofia's call: the active vs not-active distinction is the only thing that earns its keep — `stopped` is just `paused` with extra ceremony. Plan:
- Remove all "Stop" CTAs from EditForm + manage screens.
- Remove the "Stopped" tab; rename what was "Paused" tab → just **Paused** and surface all not-active supps there.
- Row in the Paused tab: supplement name + small `(paused)` tag + two icon affordances on the right — **play** (resume → status='active') and **trash** (soft-delete; see Workstream 3).
- DB migration (Supabase Dashboard): `UPDATE supplements SET status = 'paused' WHERE status = 'stopped';` Optional follow-up: enum constraint to forbid `'stopped'` going forward.
- Code: `handleEditFormTogglePause` (currently dead per Codebase Health note) can be deleted entirely. Any branch that special-cased `status === 'stopped'` collapses into `status === 'paused'`.

**Workstream 2 — Protocol lifecycle: drop Pause entirely (keep Active + Archived).**
Mirror of Workstream 1 on the protocol side. For protocols, archive is the verb that makes sense — you don't pause a protocol, you put it on the shelf. Plan:
- Remove "Pause" CTA from ProtocolLibrary row actions + ProtocolDetailScreen overflow.
- Status set becomes `active` | `archived`. The "Paused" tab/segment in ProtocolLibrary collapses into Archived.
- DB migration: `UPDATE protocols SET status = 'archived' WHERE status = 'paused';`
- `dbPauseProtocol` can be deleted; `dbArchiveProtocol` remains. Both currently bulk-reset member supps via `dbResetProtocolSupps` — keep that behavior on archive.

**Workstream 3 — Soft delete + active-on-date past adherence (fixes the 35-of-36 bug).**
The bug: Sofia deleted a supplement, and yesterday's adherence dropped from 100% → 97%. Root cause: `countExpectedChecks` uses the *current* `isActiveSupp()` filter to decide which supps were expected on a past date — so any current-state change (delete, pause, stop) retroactively rewrites the past. Fix:
- DB migration: `ALTER TABLE supplements ADD COLUMN deleted_at timestamptz;` (nullable; null = not deleted).
- Trash icon in Paused tab and any "delete" CTA writes `deleted_at = now()` instead of hard `DELETE`. `dbDeleteSupp` becomes a soft-delete (rename to `dbSoftDeleteSupp` or leave name, document behavior). A hard-delete path can stay for admin/test cleanup but is not user-reachable.
- All read queries (`dbGetSupps`) gain `&deleted_at=is.null` filter so the cockpit never sees deleted rows.
- Adherence math: introduce `isSupplementActiveOn(supp, date)` predicate that considers `created_at` (already shipped May 18 in `lib/time.js`), `deleted_at`, AND a paused-on-date check via `status_changes` (deferred — for now treat `paused` as "not expected today onward" only; past days continue to expect based on `created_at` floor + `deleted_at` ceiling). `countExpectedChecks` swaps from current-`isActiveSupp` to per-date `isSupplementActiveOn`.
- Verify: delete a supp today, yesterday's % stays at whatever it was. Pause a supp today, yesterday's % stays put (paused is forward-looking; retro paused-day tracking deferred until we add `status_changes` history).

**Order of operations within the session:**
1. Run all three migrations in Supabase Dashboard first (additive — won't break the running app).
2. Workstream 3 first (soft delete plumbing + active-on-date) because both other workstreams depend on the trash icon going through the soft path.
3. Workstream 1 (supp Stop → Pause).
4. Workstream 2 (protocol Pause → Archive).
5. Update Codebase Health + remove the "supplements.paused legacy column" / "handleEditFormTogglePause dead code" notes once cleaned up.

### Active backlog (locked from May 18 backlog review)

Sofia did a multi-select keep/discard pass across the parked queue on May 18 (post-audit-merge). Items below are confirmed in-scope and ranked roughly by readiness; items moved to "Considered + discarded" are explicitly out of scope until a new signal surfaces them.

| # | Item | Notes |
|---|------|-------|
| 1 | **Symptom logging** | Free-text journal vs structured ratings still open. Schedule a design conversation before any build. |
| 2 | **Motion / skeleton screens pass** | Initial-load skeletons (MOB-019), checkbox tick animation, hero ring fill, page transitions. Polish moment, not blocking. |
| 3 | **`aria-live` regions + skip links** | Toast/loading announcements + keyboard skip links. Builds on May 12 HIG pass. |
| 4 | **Name required on sign-up** | Currently optional; spec was required. One-line schema/UI change. |
| 5 | **Rename "Name" / `display_name` → "Full name"** | Clearer label; same column, no migration. |
| 6 | **`icon-bare` Button variant** | Encapsulate inline `border:none` overrides on icon-only buttons (e.g., overflow menus). |

### Parked but worth keeping in view

- **MOB-009 — slot card chevron discoverability** — partially addressed by the split header take-all (May 18); revisit only if real-use shows friction.
- **B3 persona finding (one-handed reach on left chevron)** — chevron date row was removed May 18 in favor of week strip. Original finding obsolete under the new pattern — re-evaluate only if a new one-handed friction signal appears.

### Considered + discarded (May 18 backlog review)

These were on the parked list but Sofia chose not to invest in them. Recorded so future sessions don't re-surface them unnecessarily.

- **Injectables-as-event-log** — log-at flow (May 18 mobile audit) now captures actual log time per supplement. Sofia judged the partial overlap good enough for now; no dedicated dose-log UX is planned.
- **Portfolio link from `/design-system`** — page is publicly accessible and portfolio-visible already; an explicit "back to portfolio" link adds clutter and isn't needed.
- **Web Push reliability re-audit** — `process_notifications_queue` dead-subscription cleanup (404/410 auto-delete) is shipped; no new reliability complaints. Revisit only if real users report missed notifications.
- **Configurable meals-per-day count** — current 2-meal default works; making it user-configurable adds onboarding surface area without a real signal asking for it.

---

## Clinician Direction (Phased Roadmap) — PARKED May 20, 2026

> **Status:** This roadmap is parked. The clinician dashboard work is moving to a separate product — see "Parked: Clinician Dashboard → separate product" at the top of this doc. The framing below ("clinician role is metadata, layered on top") was the original May plan but is **no longer the direction**. The new direction is two products that share a Supabase backend, not one app with two roles. Phases 1–3 below are kept for historical reference; they may inform the future clinician-product scope but should not be implemented in Origin's `main`.

**Original (now-historical) framing:** Origin is always a personal app. The clinician feature is **protocol-sharing + adherence-sharing**, layered on top. Same Origin app, same login — clinician role is metadata, not a separate platform.

**Why this framing:** keeps Origin outside HIPAA territory. Origin is not a "covered entity" or "business associate" — it's a personal wellness tracking tool that happens to support sharing with healthcare providers as a user-controlled feature.

**Privacy posture:**
- "Origin is a personal wellness tracking app, not a medical device."
- "Your data belongs to you. You can share it with anyone you choose."
- "Origin is not HIPAA-covered and is not intended for use as a substitute for medical advice."

### Phase 1 — Protocol Layers (Foundation)

Modular and combinable protocols, not just switchable. User has a baseline protocol (daily foundation). Additional protocols can be layered on top with stack modes:
- **Replace** — new protocol fully replaces current
- **Add on top** — new protocol stacks alongside current
- **Pause others** — new protocol runs while others temporarily pause

Time-bounded protocols (with start/end dates) make the system self-cleaning. Estimated 10-15 hours including data migration and stack-mode UI.

### Phase 2 — Protocol Export/Import via Link

Generate shareable link → "Share this protocol" button → preview screen → "Import to my Origin" button. Imported protocols include attribution ("From [Creator Name]"). Estimated 6-8 hours.

### Phase 3 — Adherence Sharing

Optional consent toggle at import time. Per-user drill-down for creators with 7-day and 30-day adherence percentage. Audit log of access events. Estimated 8-12 hours.

---

## Sofia's Working Style (Notes for the New Chat)

- **Push back honestly.** Sofia values direct critique over agreement. If a design direction is wrong, say so with reasoning.
- **No flattery.** Skip "great question" preambles. Get to the answer.
- **Bias toward action, but verify before stacking.** When something works, ship it. When it doesn't, diagnose carefully — don't keep patching.
- **Stop when tired.** Sofia ships in long sessions; help her recognize good stopping points. Stacked refactors at 2am go badly.
- **Sofia is a designer, not a developer.** She uses Claude Code in Cursor as the build mechanism. Prompts should be detailed, scoped, and include verify steps.
- **Real-use feedback beats inspection.** When in doubt, recommend "use the app for a week, come back with friction signals."
- **Watch for decision-fatigue patterns.** When Sofia answers "I agree" to multiple multi-part judgment questions in a row, flag honestly and offer a real stopping point.
- **Visual decisions benefit from real screens, not descriptions.** Ship and iterate beats designing in conversation alone.

---

## Quick Reference

**Current accent color:** `#FFFFFF` (pure white under Achromatic)
**Current surface base:** `#0D0D0D` (near-black)
**Typography:** JetBrains Mono body/data + Space Grotesk heading
**Modal pattern:** Bottom sheet on mobile (drag-to-dismiss), centered modal on desktop
**Breakpoint:** 1024px hard switch between mobile and desktop layouts
**Radius:** 0 for all UI elements (`radius.full` 9999 reserved for circular shapes)

**Critical files:**
- `src/App.jsx` (~2040 lines post-May 18 — orchestration for both mobile + desktop branches, clinician roster wiring, mobile audit state for log-at + take-all + anchor edit)
- `src/design-system.js` (Achromatic + dev variants, CSS variable font system)
- `src/config.js`:
  - `DEFAULT_CONFIG` — `{ pre_meal_window: 30, breakfast: 60, lunch: 300, dinner: 540, after_dinner: 660, window_start: 0, window_length: 480, meals_per_day: 2, fixed_times: {...} }`
  - `FIXED_SLOTS` (9): pre_breakfast, breakfast, pre_lunch, lunch, pre_dinner, dinner, after_dinner, injectable, topical (legacy keep)
  - `MODES` (5): none, medication, wakeup, fasting, fixed — used for internal lookups
  - `DISPLAY_MODES` (4): none, anchor, fasting, fixed — UI-only grouping; never stored in DB
  - `ANCHOR_SUB_MODES` (2): medication, wakeup — sub-selector within Anchor card
  - `ANCHOR_NOTES`, `getSlotLabelForMode()`, `deriveOffsets()`
- `src/data/supplements-database.js` (autocomplete static list ~300 entries)
- `src/components/` (33 files, primitives + composed)

**Supabase tables (verified May 11 via schema diagnostic):**

**`supplements`** (21 columns, RLS enabled):
- `id` (uuid, default `gen_random_uuid()`)
- `user_id` (uuid, NOT NULL)
- `name`, `dose`, `notes` (text)
- `slots` (array), `days` (array)
- `category` (text — Oral / Rx / Injectable / Topical)
- `treatment_mode` (text, default `'indefinite'` — values: indefinite / scheduled / cycled)
- `starts_at`, `ends_at` (date)
- `cycle_on_value`, `cycle_off_value` (integer)
- `cycle_on_unit`, `cycle_off_unit` (text — days / weeks / months)
- `status` (text, default `'active'` — values: active / paused / stopped)
- `stopped_at` (date)
- `created_at`, `updated_at` (timestamptz, default `now()`)
- **Legacy columns still present:**
  - `timePreference` (text, default `'Anytime'`) — no longer used in current UI
  - `paused` (boolean) — superseded by `status`

**`user_schedule`** (RLS enabled):
- `user_id`, `schedule_type` (text, DB default `'medication_anchored'` is stale — app writes `medication` / `wakeup` / `fasting` / `fixed` / `none`)
- `offsets` (jsonb, 8-key default — includes legacy `fasted` key)
- `meal_times` (jsonb, currently null for all live rows)
- `notifications_enabled` (boolean, default false)
- `created_at`, `updated_at`

**`daily_logs`:**
- `id`, `user_id`, `log_date`
- `pill_time` (time — anchor time for flexible mode, set when user taps Start Day)
- `checked` (jsonb, default `'{}'`) — keys: `${date}_${slotId}_${suppId}` or `${date}_anytime_${suppId}`.
  - **Values (post-May 18 mobile audit):**
    - `true` — legacy on-time check (pre-Session 5)
    - `{ checked: true, at: "HH:MM" }` — new shape written by `logCheckAt` when user taps the "log at…" pill on a missed slot row
    - missing key — unchecked (uncheck via `toggleCheck` removes the entry rather than writing `false`)
  - Both shapes coexist in the same column. `isChecked` in App.jsx returns truthy for either. Adherence math (`countExpectedChecks`) does a truthy test → both work. No `ALTER`/`UPDATE` migration was required.

**`user_profiles`:**
- `id` (FK to auth.users)
- `display_name` (text)
- `theme_preference` (text, DB default `'system'` is stale — production is achromatic-only)
- `created_at`, `updated_at`
- RLS per-user

**`user_supplement_history`:**
- `user_id`, `name`, `created_at`
- RLS per-user, upserted on supplement add with `on_conflict do nothing`

**`notifications_queue`:**
- `id`, `user_id`, `fire_at`, `title`, `body`
- `slot_id` (text — values: rx, pre_breakfast, breakfast, pre_lunch, lunch, pre_dinner, dinner, after_dinner, window_open, window_closing, course_end)
- `scheduled_for_date`, `fired` (boolean), `fired_at`
- `tag` — used for dedup on upsert (replaces existing unfired rows)
- `created_at`

**`push_subscriptions`:**
- `id`, `user_id`, `endpoint`, `p256dh`, `auth`, `user_agent`, `created_at`
- VAPID subscription storage. Dead subscriptions (404/410 from push service) auto-deleted by `process_notifications_queue` edge function.

**Migrations:** No `supabase/migrations/` directory exists. Schema is managed via Supabase Dashboard directly. Application-level migrations run inline via edge functions (e.g., `recompute_notifications` auto-stops supplements past their `ends_at`).

---

## Suggested First Action for the New Chat

Read this document plus `/ORIGIN-DESIGN-RULES.md`. State of the world:

- Mobile UX audit (all 12 recommendations) shipped + merged to main (`1c6eaec`).
- Clinician Phase 3 (Patient Roster as default landing) shipped + merged (`483eec0`).
- §748 modal lane closed (Popover/SidePanel primitives + 6 confirm modals sized compact).
- Backlog reviewed; 6 items locked on active queue, 4 explicitly discarded.

Two pieces of in-flight work are queued as the next sessions, in this order:

1. **Protocol Templates surface** (~4–5h) — see Pending Queue item 0. Design is locked: `is_template` column on `protocols`, sidebar entry below My Origin, list of template rows with per-row Send-to-patient + Use-for-myself. Architecture distinction (run vs share) drives the separation from ProtocolLibrary. Start with the DB migration, then the new `Templates.jsx` component, then sidebar wiring, then ProtocolLibrary filter update.

2. **Lifecycle consolidation + soft delete** (~4–6h, bundled session) — see "Next session — Lifecycle consolidation + soft delete" above. Drop Stop entirely (supplements → Active/Paused only), drop Pause entirely (protocols → Active/Archived only), add `supplements.deleted_at` + active-on-date filtering so historical adherence is never rewritten by current state changes. Order: migrations first, then soft-delete plumbing (Workstream 3), then supp lifecycle (Workstream 1), then protocol lifecycle (Workstream 2). This fixes the 35-of-36 bug Sofia reported on May 18.

If Sofia hasn't picked between them, default to Templates first — it's smaller, lighter on schema risk, and unblocks the clinician roadmap. Lifecycle work is a refactor that can wait a session without anyone noticing the drift.

Anything outside these two is on the active backlog (Symptom logging design conversation, motion/skeleton pass, aria-live + skip links, Name required, Full name rename, icon-bare Button variant) — touch only if explicitly asked.

---

*End of handoff document.*
