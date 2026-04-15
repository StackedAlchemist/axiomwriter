# Axiomwriter — STATUS.md
**Brand:** Stacked Alchemist LLC  
**Completion:** 75%  
**Priority:** 🔥 SHIP IT — subscription UI scaffolded, needs payment wired  
**Last Assessed:** April 14, 2026

---

## What's Built

Axiomwriter is a full AI writing intelligence platform. Built in Vite + React with Firebase Auth/Firestore, Tailwind CSS, and PWA support. The feature set is substantial:

### Pages (src/pages/)
- `Dashboard.jsx` — greeting, project stats, thread digests, writing streak, weekly word count, quick actions
- `Projects.jsx` / `ProjectDetail.jsx` — project CRUD
- `Characters.jsx` / `CharacterDetail.jsx` — character profiles
- `LoreBible.jsx` — world-building lore database
- `WorldMap.jsx` — world map feature
- `CoverStudio.jsx` — cover design/generation
- `SeriesView.jsx` — series management
- `ThreadDashboard.jsx` — narrative thread tracking
- `PublishingExport.jsx` — export to publishing formats
- `Settings.jsx` — user settings
- `DevEditDashboard.jsx` — dev/edit mode for reviewing generated content

### Components (src/components/)
- `auth/` — login/signup flows
- `characters/` — character management UI
- `composer/` — writing editor/composer
- `dossier/` — character/entity dossiers
- `layout/` — app layout, navigation
- `lore/` — lore entry components
- `manuscript/` — manuscript view
- `onboarding/` — first-run onboarding
- `profile/` — user profile
- `projects/` — project cards, lists
- `series/` — series components
- `subscription/` — **PricingModal.jsx, UpgradePrompt.jsx, UsageMeter.jsx** (scaffolded)
- `theme/` — theme system
- `threads/` — thread components
- `worldmap/` — world map UI
- `pwa/` — PWA helpers

### Infrastructure
- Firebase Auth + Firestore connected
- Vite build system
- Tailwind CSS
- PWA (manifest.json, sw.js)
- Firebase Hosting config

---

## What's Missing (the 25%)

### 1. Stripe Payment Integration — BLOCKING
The subscription UI components exist (`PricingModal.jsx`, `UpgradePrompt.jsx`, `UsageMeter.jsx`) but no actual payment processor is wired. These are UI scaffolds only — they show pricing UI but don't process real payments.

**To fix:**
- Set up Stripe + Firebase Functions (same pattern as Arcane Ledger)
- Wire `PricingModal.jsx` to actual Stripe Checkout session creation
- Add subscription status to Firebase user doc
- Gate features behind subscription check

### 2. Publishing Export — Verify Completeness
`PublishingExport.jsx` exists but needs verification that it actually exports to useful formats (EPUB, DOCX, PDF, etc.). This is a major selling point — if it's a UI shell, it needs to be built.

### 3. AI Integration — Verify
The app is called an "AI writing intelligence platform." Check whether any AI (Claude API) is actually integrated for:
- Character/plot suggestions
- Lore consistency checking
- Writing assistance in the Composer
- If not built: add Claude API calls via Firebase Functions

### 4. Firebase Functions
Check `functions/` folder for what's deployed vs. what's still local-only. May need `firebase deploy --only functions`.

### 5. Extensions System
`src/extensions/` folder exists — unclear what's in it. Investigate before launch.

---

## Why It's at 75%

The full page structure and component library are built. Firebase is connected. The subscription UI components are scaffolded. What's missing is: actual payment processing, confirming the AI features are wired (not just UI), and verifying the export system works. All of these are wiring tasks, not rebuild tasks.

---

## Subscription Model Recommendation

**$10–20/month.** Writers pay for tools. The comparable is Scrivener ($50 one-time) or Notion ($16/mo). Differentiator is the AI + arcane-tech aesthetic. Consider:
- Free: 1 project, basic character/lore tracking
- Pro ($12/mo): unlimited projects, AI assistance, WorldMap, CoverStudio, publishing export

---

## Recommended Next Session for Claude

> "Read this STATUS.md. Axiomwriter is a Vite + React AI writing platform at 75% completion. Firebase project is connected. The subscription UI components (PricingModal.jsx, UpgradePrompt.jsx, UsageMeter.jsx) exist in src/components/subscription/ but are not wired to Stripe. Task: (1) Check if any AI calls (Claude API) exist in the codebase — grep for 'claude' or 'anthropic' or API fetch calls. (2) Audit PublishingExport.jsx — is it functional or a shell? (3) Wire Stripe into PricingModal.jsx via a Firebase Function that creates a Checkout session."

---

## File Structure Reference

```
Axiomwriter/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── pages/           # All main page components
│   ├── components/      # Feature component library
│   │   └── subscription/ # PricingModal, UpgradePrompt, UsageMeter
│   ├── contexts/        # Auth, app state
│   ├── firebase/        # Firebase config
│   ├── hooks/
│   ├── lib/
│   ├── parsers/
│   ├── schemas/
│   ├── services/
│   ├── themes/
│   └── utils/
├── functions/           # Firebase Cloud Functions
├── public/              # PWA assets, manifest, sw.js
├── firebase.json
└── vite.config.js
```
