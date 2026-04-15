/**
 * Character Momentum Engine
 *
 * Analyses manuscript content to compute a real narrative momentum score
 * for each character, based on:
 *   recentFrequency (0-100)  × 0.4
 *   dialogueDensity (0-100)  × 0.3
 *   referenceCount  (0-100)  × 0.2
 *   plotImpact      (0-100)  × 0.1
 *
 * Updates character.momentumScore and appends to character.momentumHistory.
 * Returns detected spikes for background/supporting characters.
 */

import { getDocs, collection, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getAllChapters } from '../hooks/useManuscript'

// ── Tag keywords that mark high-impact scenes ────────────────────────────────
const IMPACT_TAGS = [
  'climax', 'inciting incident', 'turning point', 'revelation',
  'confrontation', 'battle', 'crisis', 'resolution', 'inciting',
]

// ── HTML utilities ────────────────────────────────────────────────────────────

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Count quoted dialogue strings (at least 5 chars inside quotes). */
function countDialogueLines(html) {
  const text = stripHtml(html)
  const matches = text.match(/[""][^""]{5,}[""]/g) ?? text.match(/"[^"]{5,}"/g) ?? []
  return matches.length
}

/** Count word-boundary occurrences of a name (using first name for robustness). */
function countMentions(text, charName) {
  if (!charName || !text) return 0
  const firstName = charName.trim().split(/\s+/)[0]
  if (firstName.length < 3) return 0
  try {
    const escaped = firstName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`\\b${escaped}\\b`, 'gi')
    return (text.match(re) ?? []).length
  } catch {
    return 0
  }
}

/** Returns true if the character appears in a scene (as POV or named in text). */
function charAppearsIn(meta, charNameLower, sceneText) {
  if ((meta.povCharacter || '').toLowerCase() === charNameLower) return true
  const firstName = charNameLower.split(' ')[0]
  if (firstName.length < 3) return false
  return sceneText.toLowerCase().includes(firstName)
}

// ── Core analysis ─────────────────────────────────────────────────────────────

/**
 * Runs the full momentum analysis for all characters in a project.
 * @returns { spikes: Array, results: Array }
 */
export async function runMomentumAnalysis(projectId, structure, characters) {
  if (!projectId || !structure || !characters?.length) return { spikes: [], results: [] }

  const chapters = getAllChapters(structure)
  if (!chapters.length) return { spikes: [], results: [] }

  // ── Build scene metadata index from structure ────────────────────────────
  const sceneMeta = {}
  chapters.forEach((ch, chIdx) => {
    (ch.scenes || []).forEach(scene => {
      sceneMeta[scene.id] = {
        chapterIdx: chIdx,
        tags: (scene.tags || []).map(t => t.toLowerCase()),
        status: scene.status || 'planned',
        povCharacter: (scene.povCharacter || '').trim(),
      }
    })
  })

  // ── Fetch all scene content in a single Firestore read ───────────────────
  const rawHtmlMap  = {}  // sceneId → original HTML
  const strippedMap = {}  // sceneId → plain text
  try {
    const snap = await getDocs(collection(db, 'projects', projectId, 'scenes'))
    snap.forEach(d => {
      const html = d.data().content || ''
      rawHtmlMap[d.id]  = html
      strippedMap[d.id] = stripHtml(html)
    })
  } catch (err) {
    console.warn('[momentumEngine] Could not load scene contents:', err.message)
    return { spikes: [], results: [] }
  }

  const totalChapters = chapters.length
  const last5Start    = Math.max(0, totalChapters - 5)

  // ── Calculate per-character scores ──────────────────────────────────────
  const results = []

  for (const char of characters) {
    const charName = (char.name || '').trim()
    if (!charName) continue

    const charNameLower = charName.toLowerCase()
    const appearsIn  = new Set()
    const povSceneIds = new Set()

    // Classify scenes
    Object.entries(sceneMeta).forEach(([sceneId, meta]) => {
      const text = strippedMap[sceneId] || ''
      if (meta.povCharacter.toLowerCase() === charNameLower) {
        appearsIn.add(sceneId)
        povSceneIds.add(sceneId)
      } else if (charAppearsIn(meta, charNameLower, text)) {
        appearsIn.add(sceneId)
      }
    })

    // 1. Recent frequency — appearance rate in last 5 chapters (0-100)
    const last5Ids = Object.keys(sceneMeta).filter(id => sceneMeta[id].chapterIdx >= last5Start)
    const recentCount  = last5Ids.filter(id => appearsIn.has(id)).length
    const recentFrequency = last5Ids.length > 0
      ? Math.round((recentCount / last5Ids.length) * 100)
      : 0

    // 2. Dialogue density — avg quoted lines per POV scene (0-100)
    let totalDialogue = 0
    povSceneIds.forEach(id => { totalDialogue += countDialogueLines(rawHtmlMap[id] || '') })
    const avgDialogue     = povSceneIds.size > 0 ? totalDialogue / povSceneIds.size : 0
    const dialogueDensity = Math.min(100, Math.round(avgDialogue * 5))

    // 3. Reference count — name mentions in non-POV scenes (0-100)
    let totalRefs = 0
    Object.keys(sceneMeta).forEach(id => {
      if (povSceneIds.has(id)) return
      totalRefs += countMentions(strippedMap[id] || '', charName)
    })
    const referenceCount = Math.min(100, Math.round(totalRefs * 2))

    // 4. Plot impact — appears in high-impact tagged scenes (0-100)
    let impactCount = 0
    appearsIn.forEach(id => {
      const meta = sceneMeta[id]
      if (meta?.tags.some(t => IMPACT_TAGS.some(it => t.includes(it)))) impactCount++
    })
    const plotImpact = Math.min(100, impactCount * 25)

    // Final weighted score
    const score = Math.round(
      recentFrequency * 0.4 +
      dialogueDensity * 0.3 +
      referenceCount  * 0.2 +
      plotImpact      * 0.1
    )

    results.push({
      characterId:   char.id,
      character:     char,
      score,
      components:    { recentFrequency, dialogueDensity, referenceCount, plotImpact },
      previousScore: char.momentumScore ?? 0,
      appearsInCount: appearsIn.size,
    })
  }

  // ── Persist scores + detect spikes ──────────────────────────────────────
  const spikes = []
  const now    = new Date().toISOString()

  await Promise.all(results.map(async ({ characterId, score, components, previousScore, character }) => {
    const entry = { score, date: now, chapterCount: totalChapters, components }
    const existing = character.momentumHistory || []

    // Deduplicate: don't append if score unchanged since last entry
    const last = existing[existing.length - 1]
    if (last && last.score === score) return

    const newHistory = [...existing, entry].slice(-50)

    try {
      await updateDoc(doc(db, 'projects', projectId, 'characters', characterId), {
        momentumScore:   score,
        momentumHistory: newHistory,
      })
    } catch (err) {
      console.warn('[momentumEngine] Update failed for', characterId, err.message)
    }

    // Spike: score jumped ≥20 points AND character is background (0) or supporting (1)
    const scoreDiff = score - previousScore
    if (scoreDiff >= 20 && (character.importance ?? 1) <= 1) {
      spikes.push({ characterId, character, score, previousScore, scoreDiff })
    }
  }))

  return { spikes, results }
}

// ── Trend helper (exported for UI components) ────────────────────────────────

/**
 * Returns 'rising' | 'falling' | 'stable' based on last 2 momentum history entries.
 */
export function getMomentumTrend(character) {
  const history = character.momentumHistory || []
  if (history.length < 2) return 'stable'
  const prev = history[history.length - 2].score
  const curr = history[history.length - 1].score
  if (curr - prev >= 5)  return 'rising'
  if (prev - curr >= 5)  return 'falling'
  return 'stable'
}
