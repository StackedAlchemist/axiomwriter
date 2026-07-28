# Axiomwriter

AI-powered writing intelligence platform for fiction authors — novels, series, characters, world-building, and manuscripts in one place. The bible informs the writing; the writing updates the bible; they stay in sync.

**Live:** [axiomwriter.com](https://axiomwriter.com) · Built by [Stacked Alchemist LLC](https://stackedalchemist.dev)

## Stack

- **Frontend:** Vite + React, Tailwind CSS, PWA
- **Backend:** Firebase — Auth, Firestore (named database `axiom-web`), Storage, Cloud Functions
- **Payments:** Stripe (Checkout + Billing Portal + webhook) via Cloud Functions
- **AI:** Claude (Anthropic) — all calls routed server-side through the `callAI` Cloud Function; no API key ever ships to the client

## Feature map

| Area | What it does |
|---|---|
| Manuscript | Chapter/scene editor (TipTap) with five view layouts: Linear, Scene Grid, Threads, Corkboard, Timeline |
| Writing environments | Full-viewport immersive themes with per-environment accents + focus mode |
| Characters | Profiles, role tagging, Voice DNA, relationship map, AI entity extraction from manuscript |
| Lore Bible | World-building database with AI contradiction checks and lore gap detection |
| World Map | Interactive map builder — terrain painting, 22-stamp vector library, pins linked to lore, drill-down child maps |
| Threads | Narrative thread tracking across chapters |
| Structural Health | Algorithmic manuscript analysis (pacing, POV, show-vs-tell, dialogue balance…) |
| Import/Export | DOCX import with chapter/scene detection; export presets for KDP, IngramSpark, Draft2Digital, ePub-ready DOCX |
| Cover Studio | Cover design and AI image generation |
| Subscriptions | Free / Writer / Composer / Architect tiers, gated via `useSubscription` |

## Development

```bash
npm install
npm run dev
```

Requires a `.env` with the `VITE_FIREBASE_*` keys (see `src/firebase/config.js` for the full list). **Never commit `.env`.**

`VITE_DEMO_MODE=true` bypasses auth for review builds — must be `false` in production.

## Critical conventions

- **Firestore uses the named database `axiom-web`** — every Firestore init must be `initializeFirestore(app, {...}, 'axiom-web')` or `getFirestore(app, 'axiom-web')`. `getFirestore(app)` with no name connects to an empty default DB and is always a bug.
- Firestore payloads go through `sanitizeForFirestore` + `assertFirestoreSafeSize` (no `undefined`, no nested arrays, ~1 MB doc limit).
- Large images (map backgrounds, painted terrain, character photos) go to Firebase Storage, not Firestore. `useWorldMap` falls back to downscaled inline copies if Storage is unreachable.
- AI calls: use `callAnthropic` from `src/utils/buildAnthropicRequest.js` — never call the Anthropic API directly from the client.

## Deploy

```bash
vite build && firebase deploy            # everything
firebase deploy --only hosting           # frontend only
firebase deploy --only functions         # Cloud Functions only
firebase deploy --only storage           # Storage rules
```

Firebase project: `axiom-writer` (console) · Hosting serves `dist/`.

## Project docs

- `CLAUDE.md` — session conventions, current status, and priorities for AI-assisted development
