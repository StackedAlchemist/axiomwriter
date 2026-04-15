/**
 * threadService — CRUD for story threads.
 *
 * Threads live at: projects/{projectId}/threads/{threadId}
 *
 * Bidirectional linking (thread ↔ scene, thread ↔ character, thread ↔ lore)
 * is handled by relationshipService which uses batch writes. These helpers
 * here handle the thread side only (single-document updates) for cases where
 * the other entity isn't accessible.
 */

import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc,
  onSnapshot, serverTimestamp, query, orderBy,
  arrayUnion, arrayRemove,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { normalizeThread } from '../schemas/index'

const col = (projectId) => collection(db, 'projects', projectId, 'threads')
const ref = (projectId, threadId) => doc(db, 'projects', projectId, 'threads', threadId)

// ── Create ────────────────────────────────────────────────────────────────────

export async function createThread(projectId, data = {}) {
  const docRef = await addDoc(col(projectId), {
    projectId,
    title:                   data.title                || 'Untitled Thread',
    description:             data.description          || '',
    type:                    data.type                 || 'mystery',
    status:                  'active',
    resolutionNotes:         '',
    introducedInScene:       data.introducedInScene    || null,
    introducedInChapter:     data.introducedInChapter  || null,
    lastReferencedInScene:   data.introducedInScene    || null,
    lastReferencedInChapter: data.introducedInChapter  || null,
    scenesAppearingIn:       data.introducedInScene    ? [data.introducedInScene] : [],
    linkedScenes:            data.introducedInScene    ? [data.introducedInScene] : [],
    linkedCharacters:        data.linkedCharacters     || [],
    linkedLore:              data.linkedLore           || [],
    dormancyCount:           0,
    createdAt:               serverTimestamp(),
    updatedAt:               serverTimestamp(),
  })
  return docRef.id
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getThread(projectId, threadId) {
  const snap = await getDoc(ref(projectId, threadId))
  return normalizeThread(snap)
}

// ── Real-time subscriptions ───────────────────────────────────────────────────

export function subscribeToThreads(projectId, onChange, onError) {
  const q = query(col(projectId), orderBy('createdAt', 'asc'))
  return onSnapshot(
    q,
    snap => onChange(snap.docs.map(d => normalizeThread(d))),
    err  => onError?.(err),
  )
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateThread(projectId, threadId, updates) {
  await updateDoc(ref(projectId, threadId), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteThread(projectId, threadId) {
  await deleteDoc(ref(projectId, threadId))
}

// ── Single-side array helpers (use relationshipService for bidirectional) ─────

export async function addLinkedScene(projectId, threadId, sceneId) {
  await updateDoc(ref(projectId, threadId), {
    linkedScenes: arrayUnion(sceneId),
    updatedAt: serverTimestamp(),
  })
}

export async function removeLinkedScene(projectId, threadId, sceneId) {
  await updateDoc(ref(projectId, threadId), {
    linkedScenes: arrayRemove(sceneId),
    updatedAt: serverTimestamp(),
  })
}

export async function addLinkedCharacter(projectId, threadId, characterId) {
  await updateDoc(ref(projectId, threadId), {
    linkedCharacters: arrayUnion(characterId),
    updatedAt: serverTimestamp(),
  })
}

export async function removeLinkedCharacter(projectId, threadId, characterId) {
  await updateDoc(ref(projectId, threadId), {
    linkedCharacters: arrayRemove(characterId),
    updatedAt: serverTimestamp(),
  })
}

export async function addLinkedLore(projectId, threadId, loreId) {
  await updateDoc(ref(projectId, threadId), {
    linkedLore: arrayUnion(loreId),
    updatedAt: serverTimestamp(),
  })
}

export async function removeLinkedLore(projectId, threadId, loreId) {
  await updateDoc(ref(projectId, threadId), {
    linkedLore: arrayRemove(loreId),
    updatedAt: serverTimestamp(),
  })
}
