/**
 * aiSuggestionsService — store and retrieve AI-generated suggestions.
 *
 * AI suggestions live at: aiSuggestions/{suggestionId}  (top-level collection)
 *
 * Each suggestion records the prompt context, the model response, and whether
 * the user accepted / rejected it. This data is used for:
 *  - Composer Mode history panel
 *  - Per-user AI usage analytics
 *  - Model quality feedback loop
 */

import {
  collection, doc, addDoc, updateDoc, getDocs, deleteDoc,
  query, where, orderBy, limit, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { normalizeAiSuggestion } from '../schemas/index'

const COL = 'aiSuggestions'

// ── Create ────────────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string} opts.uid
 * @param {string} opts.projectId
 * @param {string} [opts.sceneId]
 * @param {string} opts.context     - the prose context sent to the model
 * @param {string} opts.prompt      - the user's instruction / action
 * @param {string} opts.response    - the model's response text
 * @param {string} opts.model       - model ID
 * @param {number} [opts.tokens]    - token count
 */
export async function recordSuggestion({ uid, projectId, sceneId, context, prompt, response, model, tokens = 0 }) {
  const docRef = await addDoc(collection(db, COL), {
    uid,
    projectId,
    sceneId:   sceneId  || null,
    context:   context  || '',
    prompt:    prompt   || '',
    response:  response || '',
    model:     model    || '',
    tokens,
    accepted:  null,    // null = pending, true = accepted, false = rejected
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

// ── Accept / Reject ───────────────────────────────────────────────────────────

export async function acceptSuggestion(suggestionId) {
  await updateDoc(doc(db, COL, suggestionId), { accepted: true })
}

export async function rejectSuggestion(suggestionId) {
  await updateDoc(doc(db, COL, suggestionId), { accepted: false })
}

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Get the most recent suggestions for a scene (for history panel).
 */
export async function getSceneSuggestions(projectId, sceneId, count = 20) {
  const q = query(
    collection(db, COL),
    where('projectId', '==', projectId),
    where('sceneId',   '==', sceneId),
    orderBy('createdAt', 'desc'),
    limit(count),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => normalizeAiSuggestion(d))
}

/**
 * Get all suggestions for a user (for usage analytics).
 */
export async function getUserSuggestions(uid, count = 100) {
  const q = query(
    collection(db, COL),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(count),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => normalizeAiSuggestion(d))
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteSuggestion(suggestionId) {
  await deleteDoc(doc(db, COL, suggestionId))
}

// ── Usage summary ─────────────────────────────────────────────────────────────

/**
 * Count tokens used by a user in the current calendar month.
 */
export async function getMonthlyTokenCount(uid) {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { Timestamp } = await import('firebase/firestore')

  const q = query(
    collection(db, COL),
    where('uid',       '==', uid),
    where('createdAt', '>=', Timestamp.fromDate(startOfMonth)),
  )
  const snap = await getDocs(q)
  return snap.docs.reduce((sum, d) => sum + (d.data().tokens || 0), 0)
}
