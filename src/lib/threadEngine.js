/**
 * Forgotten Thread Detector — analysis engine
 *
 * After each scene save:
 *  1. Keyword-match all active threads against the new scene content
 *  2. Update dormancyCount (reset on mention, increment on silence)
 *  3. Detect NEW potential threads via Claude (async, non-blocking)
 *  4. Update project.forgottenThreadDigest for the Dashboard
 */
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getAllChapters } from '../hooks/useManuscript'
import { detectNewThreads as claudeDetectThreads } from './claudeApi'

// ── Keyword matching ──────────────────────────────────────────────────────────

function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Returns true if any keyword from the thread title/description appears
 * in the scene text (word-boundary match, case-insensitive).
 */
function threadMentionedIn(thread, sceneText) {
  const text = sceneText.toLowerCase()
  // Split title into keywords (2+ chars, not stop words)
  const STOP = new Set(['the','a','an','in','on','at','by','of','or','and','but','to','for','was','is'])
  const keywords = (thread.title || '')
    .toLowerCase()
    .split(/\W+/)
    .filter(w => w.length >= 3 && !STOP.has(w))

  if (!keywords.length) return false
  return keywords.some(kw => text.includes(kw))
}

// ── Core analysis ─────────────────────────────────────────────────────────────

/**
 * Run thread analysis for a single scene that was just saved.
 * @param {string} projectId
 * @param {string} sceneId       — the scene that was just saved
 * @param {string} sceneHtml     — raw HTML content of the saved scene
 * @param {object} structure     — project manuscript structure
 * @param {Array}  threads       — current thread list from useThreads
 * @param {Function} updateThread — from useThreads
 * @returns { suggestedThreads: Array } — Claude-detected new threads
 */
export async function runThreadAnalysis({
  projectId,
  sceneId,
  sceneHtml,
  structure,
  threads,
  updateThread,
}) {
  if (!projectId || !sceneId || !threads) return { suggestedThreads: [] }

  const sceneText    = stripHtml(sceneHtml)
  const activeThreads = threads.filter(t => t.status === 'active')

  // ── Find chapter for this scene ─────────────────────────────────────────
  const chapters  = getAllChapters(structure || { hasParts: false, chapters: [] })
  let chapterId   = null
  for (const ch of chapters) {
    if ((ch.scenes || []).some(s => s.id === sceneId)) { chapterId = ch.id; break }
  }

  // ── Update mention tracking for all active threads ───────────────────────
  const dormantThreads = [] // threads not mentioned and dormancyCount >= 7
  const updates        = []

  for (const thread of activeThreads) {
    const mentioned = threadMentionedIn(thread, sceneText)

    if (mentioned) {
      const alreadyIn = (thread.scenesAppearingIn || []).includes(sceneId)
      updates.push(updateThread(thread.id, {
        lastReferencedInScene:   sceneId,
        lastReferencedInChapter: chapterId,
        dormancyCount:           0,
        scenesAppearingIn: alreadyIn
          ? thread.scenesAppearingIn
          : [...(thread.scenesAppearingIn || []), sceneId],
      }).catch(() => {}))
    } else {
      const newCount = (thread.dormancyCount || 0) + 1
      updates.push(updateThread(thread.id, { dormancyCount: newCount }).catch(() => {}))
      if (newCount >= 7) dormantThreads.push({ ...thread, dormancyCount: newCount })
    }
  }

  await Promise.all(updates)

  // ── Update project digest (for Dashboard) ───────────────────────────────
  const allForgotten = activeThreads
    .map(t => {
      const updated = updates.length // already fired — use local state
      const count = t.dormancyCount || 0
      return count >= 7 ? t : null
    })
    .filter(Boolean)

  const digest = {
    count: allForgotten.length,
    threads: allForgotten.slice(0, 5).map(t => ({
      id:           t.id,
      title:        t.title,
      dormancyCount: t.dormancyCount,
    })),
    updatedAt: new Date().toISOString(),
  }

  updateDoc(doc(db, 'projects', projectId), {
    forgottenThreadDigest: digest,
    updatedAt: serverTimestamp(),
  }).catch(() => {})

  // ── Detect new threads via Claude (non-blocking) ─────────────────────────
  let suggestedThreads = []
  if (sceneText.length > 100) {
    const existingTitles = threads.map(t => t.title)
    suggestedThreads = await claudeDetectThreads(sceneHtml, existingTitles)
      .catch(() => [])
  }

  return { suggestedThreads, dormantAlerts: dormantThreads }
}
