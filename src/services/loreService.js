/**
 * loreService — CRUD for lore entries (Lore Bible).
 *
 * Entries live at: projects/{projectId}/lore/{entryId}
 */

import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc,
  onSnapshot, serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { normalizeLoreEntry } from '../schemas/index'

const col = (projectId) => collection(db, 'projects', projectId, 'lore')
const ref = (projectId, entryId) => doc(db, 'projects', projectId, 'lore', entryId)

// ── Create ────────────────────────────────────────────────────────────────────

export async function createLoreEntry(projectId, data = {}) {
  const docRef = await addDoc(col(projectId), {
    projectId,
    title:              data.title             || '',
    category:           data.category          || '',
    content:            data.content           || '',
    tags:               data.tags              || [],
    relatedCharacters:  data.relatedCharacters || [],
    relatedLocations:   data.relatedLocations  || [],
    flexibility:        data.flexibility       || 'flexible',
    hasGap:             false,
    gapDescription:     '',
    // Thread backlink — populated when a thread is linked to this entry
    linkedThreadIds:    data.linkedThreadIds   || [],
    createdAt:          serverTimestamp(),
    updatedAt:          serverTimestamp(),
  })
  return docRef.id
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getLoreEntry(projectId, entryId) {
  const snap = await getDoc(ref(projectId, entryId))
  return normalizeLoreEntry(snap)
}

// ── Real-time subscriptions ───────────────────────────────────────────────────

export function subscribeToLore(projectId, onChange, onError) {
  const q = query(col(projectId), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    snap => onChange(snap.docs.map(d => normalizeLoreEntry(d))),
    err  => onError?.(err),
  )
}

export function subscribeToLoreEntry(projectId, entryId, onChange, onError) {
  return onSnapshot(
    ref(projectId, entryId),
    snap => onChange(normalizeLoreEntry(snap)),
    err  => onError?.(err),
  )
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateLoreEntry(projectId, entryId, updates) {
  await updateDoc(ref(projectId, entryId), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteLoreEntry(projectId, entryId) {
  await deleteDoc(ref(projectId, entryId))
}
