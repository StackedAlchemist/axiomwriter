/**
 * projectService — CRUD for the top-level project document.
 *
 * The manuscript structure (parts / chapters / scenes meta) is embedded
 * in the project doc as `structure`. Scene content lives in the
 * `projects/{id}/scenes/{id}` subcollection (see manuscriptService).
 */

import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  onSnapshot, serverTimestamp, query, where, orderBy, writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { normalizeProject } from '../schemas/index'

// ── Create ────────────────────────────────────────────────────────────────────

export async function createProject(uid, data = {}) {
  const ref = await addDoc(collection(db, 'projects'), {
    userId: uid,
    title:           data.title          || 'Untitled Project',
    description:     data.description    || '',
    genre:           data.genre          || '',
    targetWordCount: data.targetWordCount || 80000,
    wordCount:       0,
    coverUrl:        data.coverUrl       || null,
    status:          'draft',
    structure:       data.structure      || { hasParts: false, chapters: [] },
    assistedMode:    data.assistedMode   ?? false,
    seriesId:        data.seriesId       || null,
    seriesOrder:     data.seriesOrder    || null,
    createdAt:       serverTimestamp(),
    updatedAt:       serverTimestamp(),
  })
  return ref.id
}

// ── Read (one-shot) ───────────────────────────────────────────────────────────

export async function getProject(projectId) {
  const snap = await getDoc(doc(db, 'projects', projectId))
  return normalizeProject(snap)
}

// ── Real-time subscription ────────────────────────────────────────────────────

export function subscribeToProject(projectId, onChange, onError) {
  return onSnapshot(
    doc(db, 'projects', projectId),
    snap => onChange(normalizeProject(snap)),
    err  => onError?.(err),
  )
}

export function subscribeToUserProjects(uid, onChange, onError) {
  const q = query(
    collection(db, 'projects'),
    where('userId', '==', uid),
    orderBy('updatedAt', 'desc'),
  )
  return onSnapshot(
    q,
    snap => onChange(snap.docs.map(d => normalizeProject(d))),
    err  => onError?.(err),
  )
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateProject(projectId, updates) {
  await updateDoc(doc(db, 'projects', projectId), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

// ── Delete (project + all subcollections) ────────────────────────────────────

const SUBCOLLECTIONS = ['scenes', 'characters', 'threads', 'lore', 'maps', 'writingDays', 'devEdit', 'devEditScans']

export async function deleteProject(projectId) {
  const batch = writeBatch(db)

  // Delete all known subcollection docs
  for (const sub of SUBCOLLECTIONS) {
    const snap = await getDocs(collection(db, 'projects', projectId, sub)).catch(() => ({ docs: [] }))
    snap.docs.forEach(d => batch.delete(d.ref))
  }

  batch.delete(doc(db, 'projects', projectId))
  await batch.commit()
}

// ── Convenience ───────────────────────────────────────────────────────────────

export async function getUserProjects(uid) {
  const q = query(
    collection(db, 'projects'),
    where('userId', '==', uid),
    orderBy('updatedAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => normalizeProject(d))
}
