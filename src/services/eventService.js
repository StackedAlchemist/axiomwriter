/**
 * eventService — CRUD for story timeline events.
 *
 * Events are a new top-level-within-project concept: key story moments that
 * can be linked to scenes, characters, locations, and threads.
 *
 * Events live at: projects/{projectId}/events/{eventId}
 */

import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc,
  onSnapshot, serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { normalizeEvent } from '../schemas/index'

const col = (projectId) => collection(db, 'projects', projectId, 'events')
const ref = (projectId, eventId) => doc(db, 'projects', projectId, 'events', eventId)

// ── Create ────────────────────────────────────────────────────────────────────

export async function createEvent(projectId, data = {}) {
  const docRef = await addDoc(col(projectId), {
    projectId,
    title:            data.title            || '',
    description:      data.description      || '',
    type:             data.type             || 'plot',  // 'plot' | 'character' | 'world' | 'backstory'
    storyDate:        data.storyDate        || '',
    order:            data.order            ?? 0,
    linkedScenes:     data.linkedScenes     || [],
    linkedCharacters: data.linkedCharacters || [],
    linkedLocations:  data.linkedLocations  || [],
    linkedThreads:    data.linkedThreads    || [],
    createdAt:        serverTimestamp(),
    updatedAt:        serverTimestamp(),
  })
  return docRef.id
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getEvent(projectId, eventId) {
  const snap = await getDoc(ref(projectId, eventId))
  return normalizeEvent(snap)
}

// ── Real-time subscriptions ───────────────────────────────────────────────────

export function subscribeToEvents(projectId, onChange, onError) {
  const q = query(col(projectId), orderBy('order', 'asc'))
  return onSnapshot(
    q,
    snap => onChange(snap.docs.map(d => normalizeEvent(d))),
    err  => onError?.(err),
  )
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateEvent(projectId, eventId, updates) {
  await updateDoc(ref(projectId, eventId), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteEvent(projectId, eventId) {
  await deleteDoc(ref(projectId, eventId))
}
