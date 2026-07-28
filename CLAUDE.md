# CLAUDE.md — Axiomwriter

**Project:** Axiomwriter (axiomwriter.com) — AI-powered writing platform for fiction authors
**Owner:** Billy Williams — Stacked Alchemist LLC (Mesa, AZ)
**Stack:** Vite + React, Firebase (Auth / Firestore / Storage / Functions / Hosting), TipTap, Tailwind, PWA, Stripe
**Status:** LAUNCH-READY as of 2026-07-11. Billing verified end-to-end with a real card. Public marketing site (landing, pricing, about, FAQ, help) shipped and SEO-indexed. Firestore billing-field security hole closed 2026-07-28.

---

## CRITICAL CONVENTIONS (never violate)

1. **Firestore uses the named database `axiom-web`** — `initializeFirestore(app, {...}, 'axiom-web')`. A bare `getFirestore(app)` connects to an empty default DB and is always a bug. (The Firebase *project* is `axiom-writer`; only the DB is named `axiom-web`.)
2. **AI calls go through the `callAI` Cloud Function** (`src/utils/buildAnthropicRequest.js` → `callAnthropic`). Never call Anthropic from the client. Server enforces per-tier limits.
3. **Firestore payloads** go through `sanitizeForFirestore` + `assertFirestoreSafeSize`. Large images (map backgrounds, terrain, photos) go to Firebase Storage (`useWorldMap` has a downscale-inline fallback).
4. **`users/{uid}.subscription` and `.stripeCustomerId` are admin-only fields.** `firestore.rules` blocks any client write that touches them (`allow update` diffs `affectedKeys()` against a billing-field blocklist) — Cloud Functions write them via the Admin SDK, which bypasses rules. This matters more than it looks: `callAI` and `generateImage` trust `subscription.tier`/`subscription.status` straight off this doc to authorize paid API spend, so a client-writable subscription field would let a user self-grant a paid tier and spend against the Anthropic/Stability accounts for free. If you ever add a new billing-adjacent field, add it to the blocklist in the same breath.
5. Never commit `.env`. `VITE_DEMO_MODE` must be `false` in production (it currently is).
6. Grep before editing. Real code only — no stubs or placeholder TODOs. If it works, ship it, iterate after.
7. **After every deploy the PWA needs a refresh** to pick up new code — if a change "isn't there," refresh first.
8. **Write files as UTF-8.** CLAUDE.md has twice been silently re-saved as UTF-16 (no BOM) by a PowerShell redirect/`Out-File`, which renders as garbled space-separated characters to every tool that reads it as UTF-8 (grep, GitHub, git diff, a fresh session). If you're editing this file from PowerShell instead of the Edit/Write tools, use `-Encoding utf8` explicitly and verify with `file CLAUDE.md` before trusting it.

## DEPLOY

```bash
vite build && firebase deploy --only hosting     # frontend
firebase deploy --only functions                 # Cloud Functions
firebase deploy --only firestore                 # rules
firebase deploy --only storage                   # storage rules
```

Commit each shipped feature. Billy tests on his phone at axiomwriter.com after deploys.

## BILLING (live and verified)

- Stripe LIVE mode. Tiers: Free / Writer $9.99 / Composer $19.99 / Architect $39.99.
- 7-day free trial on first subscription only (`stripeSubscriptionId` persists after cancel → no trial farming).
- `'trialing'` status = full tier access everywhere `'active'` is.
- AI quota resets on the **billing anniversary** (`subscription.currentPeriodStart`), calendar-month fallback. Limits: 0 / 100 / 1,000 / 2,000. Enforced server-side in `callAI`.
- Founder emails (billylw75@, stackedalchemist@) bypass limits.
- Legal pages live at /terms and /privacy (Arizona law, Maricopa County).

### Hard-won infra lessons
- If a NEW Cloud Function returns "could not connect" from the browser: its Cloud Run service is missing `allUsers` → `roles/run.invoker` (blocks CORS preflight). Fix via run.googleapis.com setIamPolicy.
- Checkout redirects via `session.url` (server returns it) — `stripe.redirectToCheckout()` is removed from stripe-js.
- Newer Stripe API payloads moved `current_period_*` to the subscription item level; the webhook handles both + `trial_end`/`trial_start` fallbacks and returns 500 on handler errors so Stripe retries.

## TIER GATES (all enforced)

- **Free:** editor, 1 project, character list, DOCX import, Word export, Linear layout.
- **Writer:** unlimited projects, all layouts, Lore Bible, Thread Detector, Series, Voice DNA, 100 assists.
- **Composer:** Composer Mode, Momentum, World Map, Cover Studio, Publishing Export, 1,000 assists.
- **Architect:** reader sharing + beta reader feedback, 2,000 assists. (Real-time collab = "coming soon" on the card, NOT built.)

## FEATURE MAP (what exists and works)

- **Manuscript:** Linear + chapter writing view (continuous editing, Ctrl+Enter splits scenes at cursor), Scene Grid, Threads, Corkboard, Timeline layouts; focus mode; writing environments.
- **Import:** DOCX/txt/md upload AND 5k+ word paste → chapter/scene detection with preview tree (`src/lib/structureDetect.js` — strips Word running-header artifacts). 8k+ word scenes get a "split into chapters" recovery banner.
- **Characters:** profiles, entity extraction v3 (full-name pairing "Kael Rhyse" + aliases), momentum.
- **World Map:** terrain painting, 22-stamp vector library, stamp transforms, undo/redo, sweep eraser, PNG export.
- **Publishing:** real EPUB 3 (jszip), print PDF, txt, md, KDP/IngramSpark/D2D/Standard DOCX; clickable readiness checks.
- **Sharing:** Invite a Reader (toolbar) → share links, email invites (mailto), beta reader feedback (readers comment without accounts → author inbox in ShareModal; rules in firestore.rules `projectShares/*/feedback`).
- **Export:** Settings → Data & Export — sectioned Word docs (manuscript/characters/world bible/threads), ZIP per project; JSON as raw backup.
- **AI:** refine selection, lore contradiction/gaps, thread detection, structural health (findings drill-down), Voice DNA, Composer drafts, cover generation (Stability).
- **Marketing/public site:** landing page (`/`), `/pricing`, `/about`, `/faq`, `/help`, `/terms`, `/privacy` — shared `MarketingLayout` (nav/footer/glass style). Per-route SEO via `usePageMeta` hook (title, description, canonical, og/twitter sync). Sitemap submitted and confirmed in Google Search Console.

## NEXT UP (priority order)

1. **Real-time collaboration** (Yjs + TipTap + presence) — the remaining Architect promise; plan as its own sprint.
2. **Map aesthetics upgrade** — Wonderdraft hand-inked style: ink lineart stamp set, stamp scatter/cluster brush, curved TextPath labels, compass rose, richer parchment (Billy's request).
3. **Automated test coverage** — `npm run test:rules` covers the Firestore billing-field lockdown and the `aiSuggestions` quota-delete lockdown (`test/firestore.rules.test.js`, via `@firebase/rules-unit-testing` + the Firestore emulator). Still missing: a smoke test for signup → write → upgrade → AI → export.
4. Small: clean voice_dna gate, ScenesGridLayout's dead `switchLayout` nav state, weight deep-AI features as multiple assists (cost guard), true in-app email invites (needs a provider), ambient audio per writing environment (flag-gated, deferred by design — not a bug).

**Done 2026-07-28:** PWA update-available toast (`UpdateToast.jsx` — listens for `serviceworker.controllerchange` after a prior controller existed, since `sw.js` already calls `skipWaiting()`/`clients.claim()` on every deploy). Map "AI background" generation no longer gates on a client-side `VITE_STABILITY_API_KEY` check (that env var is never set on the client by design — the gate was silently forcing every map generation to procedural even for paying Composer/Architect tiers; `generateStabilityBackground()` already calls the server-routed `generateImage` function and fails gracefully, so the client-side pre-check was pure regression, not a safeguard).

## WRITING CONTEXT

Billy writes **The Forgotten Soldier** (Seraph Chronicles) and **The Last Star Engine** (Operator's Ascension) in Axiom — military sci-fi. He is the primary user; build for him. 5+ active series planned.
