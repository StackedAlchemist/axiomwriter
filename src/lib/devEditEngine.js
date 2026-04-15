/**
 * Developmental Editing Engine
 * Runs structural checks (algorithmic) on manuscript data.
 * Claude-powered checks live in claudeApi.js → analyzeStructuralIssues().
 */
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getAllChapters } from '../hooks/useManuscript'

// ── Check type registry ───────────────────────────────────────────────────────

export const CHECK_TYPES = {
  PACING:              'pacing',
  POV_CONSISTENCY:     'pov_consistency',
  WORLD_TERMS:         'world_terms',
  FLASHBACK:           'flashback',
  CHARACTER_GROUNDING: 'character_grounding',
  SHOW_VS_TELL:        'show_vs_tell',
  DIALOGUE_BALANCE:    'dialogue_balance',
}

export const ALL_CHECK_TYPES = Object.values(CHECK_TYPES)

export const CHECK_LABELS = {
  pacing:              'Pacing',
  pov_consistency:     'POV Consistency',
  world_terms:         'World Term Density',
  flashback:           'Flashback Placement',
  character_grounding: 'Character Grounding',
  show_vs_tell:        'Show vs. Tell',
  dialogue_balance:    'Dialogue Balance',
}

export const CHECK_DESCRIPTIONS = {
  pacing:
    'Detects monotone pacing — consecutive action-heavy or slow scenes, and chapters that are outliers in length.',
  pov_consistency:
    'Flags POV shifts within a single scene that don\'t have a section break, and characters knowing things they couldn\'t know.',
  world_terms:
    'Counts unique invented or world-specific proper nouns introduced per chapter against reader-comfort guidelines.',
  flashback:
    'Identifies flashbacks that interrupt scenes at moments of high tension without an adequate transition.',
  character_grounding:
    'Checks whether new POV characters are physically grounded in their first scene within the first 300 words.',
  show_vs_tell:
    'Flags paragraphs with high density of "telling" verbs: felt, thought, knew, realized, noticed.',
  dialogue_balance:
    'Detects long scenes with no dialogue and dialogue-heavy scenes with no action beats (talking heads).',
}

// ── Sensitivity thresholds ────────────────────────────────────────────────────

const SENSITIVITY = {
  strict:   { consecutiveScenes: 2, worldTerms: 3, tellingVerbs: 2, outlierRatio: 0.40, monoWords: 600  },
  balanced: { consecutiveScenes: 3, worldTerms: 5, tellingVerbs: 4, outlierRatio: 0.60, monoWords: 800  },
  light:    { consecutiveScenes: 4, worldTerms: 8, tellingVerbs: 6, outlierRatio: 0.80, monoWords: 1000 },
}

// ── Text utilities ────────────────────────────────────────────────────────────

function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function wc(text) {
  return text.split(/\s+/).filter(Boolean).length
}

function hasDialogue(html) {
  return /[""][^""]{15,}[""]|"[^"]{15,}"/.test(html)
}

function dialogueRatio(html) {
  const text    = stripHtml(html)
  const matches = (text.match(/"[^"]{10,}"/g) || []).join('')
  return matches.length / Math.max(text.length, 1)
}

const TELLING_VERBS = [
  'felt', 'thought', 'knew', 'realized', 'noticed',
  'wondered', 'decided', 'understood', 'believed', 'seemed', 'remembered',
]

function countTellingVerbs(text) {
  return TELLING_VERBS.reduce((sum, v) => {
    const m = text.match(new RegExp(`\\b${v}\\b`, 'gi'))
    return sum + (m ? m.length : 0)
  }, 0)
}

// ── Algorithmic checks ────────────────────────────────────────────────────────

function runAlgorithmicChecks(chapters, sceneContents, t, disabledChecks) {
  const findings = []
  const allScenes = chapters.flatMap(ch =>
    (ch.scenes || []).map(s => ({ ...s, chapterId: ch.id, chapterTitle: ch.title }))
  )
  const written = allScenes.filter(s => wc(stripHtml(sceneContents[s.id] || '')) > 50)

  // ── PACING ────────────────────────────────────────────────────────────────
  if (!disabledChecks.includes('pacing')) {
    let actionRun = 0, slowRun = 0

    for (let i = 0; i < written.length; i++) {
      const s    = written[i]
      const html = sceneContents[s.id] || ''
      const text = stripHtml(html)
      const words   = wc(text)
      const dRatio  = dialogueRatio(html)

      const isAction = words > 350 && dRatio < 0.15
      const isSlow   = words < 200 || dRatio > 0.6

      if (isAction)     { actionRun++; slowRun = 0 }
      else if (isSlow)  { slowRun++; actionRun = 0 }
      else              { actionRun = 0; slowRun = 0 }

      if (actionRun === t.consecutiveScenes) {
        findings.push({
          type: 'pacing', severity: 'warning',
          sceneId: s.id, chapterId: s.chapterId,
          message:    `${actionRun} consecutive action-heavy scenes without emotional breathing room`,
          suggestion: 'Consider adding a quieter moment — a reflection, conversation, or emotional beat — before the next push forward.',
        })
        actionRun = 0
      }
      if (slowRun === t.consecutiveScenes) {
        findings.push({
          type: 'pacing', severity: 'warning',
          sceneId: s.id, chapterId: s.chapterId,
          message:    `${slowRun} consecutive low-momentum scenes without a plot development`,
          suggestion: 'Consider introducing a revelation, escalating a conflict, or having a character make a decisive choice to restore forward momentum.',
        })
        slowRun = 0
      }
    }

    // Chapter length outliers
    const chWC = chapters.map(ch => {
      const total = (ch.scenes || []).reduce(
        (sum, s) => sum + wc(stripHtml(sceneContents[s.id] || '')), 0
      )
      return { id: ch.id, title: ch.title || 'Untitled Chapter', words: total }
    }).filter(c => c.words > 0)

    if (chWC.length >= 3) {
      const avg = chWC.reduce((s, c) => s + c.words, 0) / chWC.length
      chWC.forEach(c => {
        if (Math.abs(c.words - avg) / avg > t.outlierRatio) {
          const longer = c.words > avg
          findings.push({
            type: 'pacing', severity: 'info',
            chapterId: c.id,
            message: `"${c.title}" is ${longer ? 'significantly longer' : 'significantly shorter'} than average (${c.words.toLocaleString()} vs avg ${Math.round(avg).toLocaleString()} words)`,
            suggestion: longer
              ? 'Long chapters can exhaust reader attention. Consider whether any scenes could stand alone or be moved to their own chapter.'
              : 'Short chapters can feel rushed. Check whether the chapter\'s central conflict or emotional arc fully develops before it closes.',
          })
        }
      })
    }
  }

  // ── SHOW VS TELL ──────────────────────────────────────────────────────────
  if (!disabledChecks.includes('show_vs_tell')) {
    written.forEach(scene => {
      const text  = stripHtml(sceneContents[scene.id] || '')
      const paras = text.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(p => p.length > 60)

      for (const para of paras) {
        const count = countTellingVerbs(para)
        if (count >= t.tellingVerbs) {
          findings.push({
            type: 'show_vs_tell', severity: 'info',
            sceneId: scene.id, chapterId: scene.chapterId,
            message:    `A passage in "${scene.title || 'Untitled Scene'}" uses ${count} telling verbs`,
            suggestion: `This passage leans on telling verbs (felt, thought, knew, etc.). Consider showing these emotions through action, dialogue, or physical sensation.`,
            detail:     para.substring(0, 200) + (para.length > 200 ? '…' : ''),
          })
          break // one finding per scene
        }
      }
    })
  }

  // ── DIALOGUE BALANCE ──────────────────────────────────────────────────────
  if (!disabledChecks.includes('dialogue_balance')) {
    written.forEach(scene => {
      const html  = sceneContents[scene.id] || ''
      const words = wc(stripHtml(html))

      if (words > t.monoWords && !hasDialogue(html)) {
        findings.push({
          type: 'dialogue_balance', severity: 'info',
          sceneId: scene.id, chapterId: scene.chapterId,
          message:    `"${scene.title || 'Untitled Scene'}" is ${words} words with no dialogue`,
          suggestion: 'Long scenes without dialogue can feel monolithic. A conversation between characters could reveal personality while advancing the plot.',
        })
      } else if (hasDialogue(html) && dialogueRatio(html) > 0.65 && words > 300) {
        findings.push({
          type: 'dialogue_balance', severity: 'info',
          sceneId: scene.id, chapterId: scene.chapterId,
          message:    `"${scene.title || 'Untitled Scene'}" may have talking-head dialogue`,
          suggestion: 'The scene appears mostly dialogue with few action beats. Grounding speakers in physical space — gestures, movements, reactions — creates a more immersive scene.',
        })
      }
    })
  }

  return findings
}

// ── Main scan function ────────────────────────────────────────────────────────

export async function runDevEditScan({ projectId, structure, settings = {}, analyzeWithClaude }) {
  const {
    sensitivity    = 'balanced',
    disabledChecks = [],
    minWords       = 5000,
  } = settings

  const t = SENSITIVITY[sensitivity] || SENSITIVITY.balanced

  // Fetch all scene content
  const snap = await getDocs(collection(db, 'projects', projectId, 'scenes'))
  const sceneContents = {}
  snap.forEach(d => { sceneContents[d.id] = d.data().content || '' })

  const chapters    = getAllChapters(structure || { hasParts: false, chapters: [] })
  const totalWords  = Object.values(sceneContents).reduce(
    (sum, html) => sum + wc(stripHtml(html)), 0
  )

  if (totalWords < minWords) {
    return {
      findings: [], healthScore: 100, totalWords, skipped: true,
      skipReason: `Manuscript is ${totalWords.toLocaleString()} words — minimum for checks is ${minWords.toLocaleString()} words.`,
    }
  }

  // Algorithmic checks
  const findings = runAlgorithmicChecks(chapters, sceneContents, t, disabledChecks)

  // Claude-powered checks
  const claudeTypes = ['pov_consistency', 'world_terms', 'flashback', 'character_grounding']
    .filter(ct => !disabledChecks.includes(ct))

  if (analyzeWithClaude && claudeTypes.length > 0) {
    try {
      const cf = await analyzeWithClaude(chapters, sceneContents, claudeTypes, sensitivity)
      if (Array.isArray(cf)) findings.push(...cf)
    } catch { /* non-blocking */ }
  }

  // Cap at 2 findings per check type
  const capByType = {}
  const deduped   = findings.filter(f => {
    capByType[f.type] = (capByType[f.type] || 0) + 1
    return capByType[f.type] <= 2
  })

  const healthScore = Math.max(0, 100 - new Set(deduped.map(f => f.type)).size * 12)

  return { findings: deduped, healthScore, totalWords }
}
