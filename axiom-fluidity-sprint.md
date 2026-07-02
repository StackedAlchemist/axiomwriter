# AXIOM FLUIDITY SPRINT
## UX Audit + Fix Specification
**Project:** Axiomwriter (axiomwriter.com) | Stacked Alchemist LLC
**Source:** Mobile audit, 14 screenshots, June 2026
**Usage:** Drop this file into the repo and work through it with Claude Code, top to bottom. Each item has acceptance criteria so completion is verifiable.

---

## ROOT CAUSE

Axiom currently renders desktop layouts on mobile. Fixed-width panels, persistent sidebars, and wide toolbars do not reflow on small screens. This single root cause produces most observed defects: clipped text, overlapping panels, a one-word-per-line editor column, and modals that cover navigation. Fix the responsive architecture first. Most "fluidity" complaints disappear with it.

---

## P0: MOBILE LAYOUT OVERHAUL

### P0.1 Single-panel rule on mobile
On viewports under 768px, only ONE panel is visible at a time.
- Manuscript/scene list becomes a slide-over drawer (left), dismissed on scene select or backdrop tap
- Editor takes 100% width when active
- Side panels (Characters, Threads, Structure, Map, Cover) open as full-screen views or bottom sheets, never side-by-side with the editor

**Observed defect:** Editor screenshots show the manuscript sidebar consuming most of the viewport while the editor column renders roughly 8 characters wide ("The / crawlsp / ce / smelled / like"). Unusable for actual writing.

**Acceptance:** On a 360px-wide viewport, the editor text column is at least 90% of screen width with readable line lengths (45 to 75 characters per line). No horizontal scroll anywhere.

### P0.2 Project toolbar overflow
The project tab bar (Timeline, Saved, Characters, Threads, Structure, Map, Cover) overflows off-screen with no affordance.
- Make it horizontally scrollable with a visible fade/chevron hint, or collapse overflow items into a "More" menu
- Active tab must always be visible

**Acceptance:** All tabs reachable on 360px viewport; current tab never hidden.

### P0.3 Viewport and safe-area hygiene
- Audit every page for horizontal overflow (Timeline empty state currently clips text off BOTH edges mid-word)
- Add proper viewport meta and max-width constraints; replace fixed pixel widths with fluid units
- Respect safe areas top and bottom

**Acceptance:** Zero clipped text at 360px, 390px, and 412px widths. The marketing ticker on the login page ("lcome home... Build worl") no longer truncates words.

### P0.4 Touch targets
Scene rows currently expose tiny edit/delete icons. All interactive elements minimum 44x44px tap area. Destructive actions (delete scene) require a confirm step.

---

## P1: WRITING ENVIRONMENT IMMERSION

Goal stated by owner: when you pick an environment, you should FEEL like you are in it. The environment should push the writing.

### P1.1 Environment modal fixes
- Convert the environment picker to a full-screen sheet (mobile) with translucent, blurred backdrop (backdrop-filter: blur + rgba overlay) instead of an opaque panel that covers the app navbar
- Sheet has its own header with title and a close button always visible and reachable
- Remove the duplicated active-environment description block (currently shown twice: once in the Active card, once in the list selection)

**Acceptance:** Opening the picker never hides the means of closing it; backdrop shows the editor dimmed beneath; one source of truth for active environment display.

### P1.2 Full-editor theming per environment
On mobile there are no "edges" so edge imagery does nothing. Instead:
- Environment backdrop renders behind the editor at low opacity (suggest 12 to 20%) with a dark gradient scrim to preserve text contrast
- Editor surface becomes semi-translucent over it
- Accent color tokens (buttons, active states, cursor, highlights) shift per environment: Iron Sanctum reds, The Infinite violets, Ember Forge oranges, Whispering Grove greens, Quiet Desk neutral
- Implement as CSS custom properties swapped on environment change with a 300 to 500ms crossfade

**Acceptance:** Switching environments visibly transforms the writing screen on mobile while body text contrast stays at or above WCAG AA (4.5:1).

### P1.3 Focus mode
A one-tap toggle in the editor: hides all chrome except text, word count, and a single exit affordance. Environment backdrop remains. This is the "full immersion" state.

### P1.4 (Later, flag-gated) Ambient audio per environment
Optional looped ambience (forge crackle, rain, space hum) with volume control and OFF by default. Ship behind a feature flag; do not block the sprint on it.

---

## P1: MANUSCRIPT IMPORT PIPELINE (THE MOAT FEATURE)

Current behavior: pasting a full manuscript creates one undifferentiated scene. World Bible and Characters stay empty. This is the highest-churn moment for users migrating from Dabble, Scrivener, NovelCrafter, or Word.

Target behavior, end to end:

### P1.5 Structure detection on paste/upload
When pasted text exceeds a threshold (suggest 5,000 words) or a file is uploaded (.docx, .txt, .md):
1. Detect chapter boundaries (regex pass first: "Chapter X", "CHAPTER", numbered headings, "Part X"; fall back to AI segmentation if no markers found)
2. Detect scene breaks within chapters (blank-line clusters, ***, ---, # separators)
3. Present an import preview: "Found 14 chapters, 52 scenes" with an editable tree before committing
4. User confirms, structure is created

**Acceptance:** Pasting a standard manuscript with chapter headings produces a correctly nested chapter/scene tree, not one blob. Word counts per scene populate.

### P1.6 Entity extraction into World Bible and Characters
After structure is confirmed, run an AI extraction pass (Claude API, batched by chapter, structured JSON output) identifying:
- Characters (name, aliases, first appearance, rough role guess)
- Locations
- Factions/organizations, named tech or magic terms

Then show a review screen, NOT silent auto-creation:
- "We found 12 characters" with checkbox list
- Per character: role dropdown (Main / Side / Background), merge control for duplicates/aliases ("Tom" + "Thomas"), delete
- Background characters get a name-only stub entry
- Main/Side characters get an optional "Generate dossier" action: AI drafts appearance, voice, relationships, and arc notes FROM THE MANUSCRIPT TEXT, clearly labeled as AI-drafted and fully editable
- Same pattern for locations and lore terms feeding the World Bible, integrated with the existing Lore Gaps feature

**Acceptance:** A user can paste a novel and within one guided flow end up with populated Characters and a seeded World Bible, with full control over what gets created. Nothing is created without user confirmation.

### P1.7 Honest scope note
Run extraction chapter-by-chapter to stay inside context limits and control API cost. Estimate cost per import at current Claude pricing before launch; consider making deep extraction a paid-tier feature with a free preview (detect and list entities free, generate dossiers on paid).

---

## P2: TRUST AND POLISH

### P2.1 Coming Soon cleanup
Currently visible: Plot Board SOON, Timeline SOON, Notes SOON, AI Studio SOON in nav, plus a dashboard Quick Action card for AI Studio (Coming Soon). For a subscription product this reads as unfinished.
- Remove unbuilt features from primary nav, OR collapse into a single "Roadmap" entry
- Never feature a nonexistent capability as a dashboard Quick Action
- Exception: keep ONE teaser maximum if it has a date attached

### P2.2 Empty-state and zero-state copy
- Dashboard Streak and This Week currently render a bare dash. Replace with real zero states: "0 days. Write today to start a streak." and "0 words this week"
- Timeline empty state is good copy but currently renders clipped and vertically misplaced; recenter within the safe viewport
- Replicate the Lore Bible empty-state pattern (icon, one-liner, primary CTA, suggested chips) across Timeline, Characters, and any other empty view. It is the best screen in the audit; make it the template.

### P2.3 Scene interaction bugs
- Scene 5 row: tapping appears to do nothing for the user. Inspect the row's tap handler; the inline rename/delete affordance appears to capture the tap instead of navigating. Separate "select scene" (row tap) from "row actions" (explicit kebab/long-press menu) on mobile
- Untitled Scene with no word count suggests a null-content scene from the bulk paste; ensure scenes always initialize content and display 0 rather than blank
- Scene word counts: verify totals recalculate after paste-import (header currently shows "ds total" clipped, value unverifiable on mobile)

### P2.4 Editor toolbar on mobile
Formatting toolbar (undo, italic, underline, H1, H2, lists, alignment, Compose) currently wraps and clips. Collapse into a compact scrollable toolbar pinned above the keyboard, with Compose (AI) as a distinct primary action.

### P2.5 Floating chat button overlap
The floating assistant bubble overlaps content and the "B" avatar badge collides with it on several screens. Pin to a consistent corner, respect safe areas, and auto-hide while the keyboard is open or while typing in the editor.

---

## SCREENSHOT-TO-ISSUE INDEX

- Login page: clean, ship as-is except ticker word truncation (P0.3)
- Dashboard (mobile): solid; fix zero states (P2.2), AI Studio card (P2.1)
- Nav drawer: solid; SOON cleanup (P2.1)
- Environment picker: navbar covered, duplicate active card, opaque panel (P1.1)
- Environment list: selection state good, keep the red ring pattern
- Editor + manuscript panel: single-panel violation, narrow text column, toolbar clipping, scene tap bug (P0.1, P2.3, P2.4)
- Timeline empty state: horizontal clipping both edges, vertical centering (P0.3, P2.2)
- Project tab bar: overflow without affordance (P0.2)
- Lore Bible empty state: best-in-app pattern, replicate (P2.2)
- Projects list: good; back-chevron target size (P0.4)

---

## SPRINT ORDER

1. P0.1 through P0.4 (responsive overhaul) -- everything else inherits this
2. P1.1 + P1.2 (environment immersion) -- the emotional core of the product
3. P2.3 (scene bugs) -- broken-feeling interactions kill trust fastest
4. P1.5 + P1.6 (import pipeline) -- the moat; biggest feature, do it after the foundation is stable
5. P2.1, P2.2, P2.4, P2.5 (polish pass)

## DEFINITION OF DONE
Walk the entire app on a real phone at 360px: zero horizontal scroll, zero clipped text, every tap does something visible, a pasted novel becomes a structured project with populated Characters and World Bible through the guided flow, and switching environments visibly changes the feel of the writing screen.
