/**
 * characterService — CRUD for characters.
 *
 * Characters live at: projects/{projectId}/characters/{characterId}
 */

import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc,
  onSnapshot, serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { normalizeCharacter } from '../schemas/index'

const col = (projectId) => collection(db, 'projects', projectId, 'characters')
const ref = (projectId, characterId) => doc(db, 'projects', projectId, 'characters', characterId)

// ── Create ────────────────────────────────────────────────────────────────────

export async function createCharacter(projectId, data = {}) {
  const now = new Date().toISOString()
  const docRef = await addDoc(col(projectId), {
    projectId,
    name:       data.name       || '',
    aliases:    data.aliases    || [],
    role:       data.role       || 'supporting',
    importance: data.importance ?? 1,
    importanceHistory: [{ importance: data.importance ?? 1, date: now, note: 'Created' }],
    physicalDescription: data.physicalDescription || {
      age: '', height: '', build: '', hairColor: '', eyeColor: '',
      distinctiveFeatures: '', style: '',
    },
    // Legacy flat fields
    age: data.age || '', appearance: data.appearance || '',
    style: data.style || '', distinguishingFeatures: data.distinguishingFeatures || '',
    backstory: '', motivations: '', fears: '',
    internalConflict: '', externalConflict: '', arcSummary: '',
    customFields: [],
    voiceDna: {
      speechPatterns: '', vocabularyLevel: '', sentenceLengthPref: '',
      commonPhrases: [], neverSayPhrases: [], humorStyle: '',
      tellsLying: '', tellsStressed: '', whenWantsSomething: '', whenThreatened: '',
    },
    relationshipMap: [],
    sceneHistory: [],
    momentumScore: 0,
    photoUrl: null,
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getCharacter(projectId, characterId) {
  const snap = await getDoc(ref(projectId, characterId))
  return normalizeCharacter(snap)
}

// ── Real-time subscriptions ───────────────────────────────────────────────────

export function subscribeToCharacters(projectId, onChange, onError) {
  const q = query(col(projectId), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    snap => onChange(snap.docs.map(d => normalizeCharacter(d))),
    err  => onError?.(err),
  )
}

export function subscribeToCharacter(projectId, characterId, onChange, onError) {
  return onSnapshot(
    ref(projectId, characterId),
    snap => onChange(normalizeCharacter(snap)),
    err  => onError?.(err),
  )
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateCharacter(projectId, characterId, updates) {
  await updateDoc(ref(projectId, characterId), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function updateCharacterImportance(projectId, characterId, newImportance, currentHistory = [], note = '') {
  const historyEntry = { importance: newImportance, date: new Date().toISOString(), note }
  await updateDoc(ref(projectId, characterId), {
    importance: newImportance,
    importanceHistory: [...(currentHistory ?? []), historyEntry],
    updatedAt: serverTimestamp(),
  })
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteCharacter(projectId, characterId) {
  await deleteDoc(ref(projectId, characterId))
}
