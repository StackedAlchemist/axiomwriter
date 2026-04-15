import { useState, useEffect, useCallback } from 'react'
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { sanitizeForFirestore } from '../utils/sanitizeForFirestore'

export const IMPORTANCE_LEVELS = [
  { value: 0, label: 'Background', color: 'text-slate-500',  bg: 'bg-slate-500/10 border-slate-500/20' },
  { value: 1, label: 'Supporting', color: 'text-teal-400',   bg: 'bg-teal-500/10 border-teal-500/20'  },
  { value: 2, label: 'Major',      color: 'text-gold-400',   bg: 'bg-gold-500/10 border-gold-500/20'  },
  { value: 3, label: 'POV',        color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
]

export const ROLE_OPTIONS = [
  { value: 'protagonist', label: 'Protagonist', color: 'text-gold-400',   bg: 'bg-gold-500/10 border-gold-500/30'   },
  { value: 'antagonist',  label: 'Antagonist',  color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30'     },
  { value: 'major',       label: 'Major',       color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  { value: 'supporting',  label: 'Supporting',  color: 'text-teal-400',   bg: 'bg-teal-500/10 border-teal-500/30'   },
  { value: 'background',  label: 'Background',  color: 'text-slate-400',  bg: 'bg-slate-500/10 border-slate-500/30' },
]

export const RELATIONSHIP_TYPES = [
  { value: 'friend',   label: 'Friend',   color: 'text-teal-400'   },
  { value: 'enemy',    label: 'Enemy',    color: 'text-red-400'    },
  { value: 'lover',    label: 'Lover',    color: 'text-pink-400'   },
  { value: 'family',   label: 'Family',   color: 'text-purple-400' },
  { value: 'rival',    label: 'Rival',    color: 'text-orange-400' },
  { value: 'mentor',   label: 'Mentor',   color: 'text-gold-400'   },
  { value: 'ally',     label: 'Ally',     color: 'text-blue-400'   },
  { value: 'neutral',  label: 'Neutral',  color: 'text-slate-400'  },
]

export const AVATAR_COLORS = {
  protagonist: { bg: 'bg-gold-500/20',   text: 'text-gold-400',   border: 'border-gold-500/30'   },
  antagonist:  { bg: 'bg-red-500/20',    text: 'text-red-400',    border: 'border-red-500/30'    },
  major:       { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  supporting:  { bg: 'bg-teal-500/20',   text: 'text-teal-400',   border: 'border-teal-500/30'   },
  background:  { bg: 'bg-slate-500/20',  text: 'text-slate-400',  border: 'border-slate-500/30'  },
}

export const DEFAULT_CHARACTER = {
  name: '',
  aliases: [],
  role: 'supporting',
  importance: 1,
  // Physical description (structured)
  physicalDescription: {
    age:                 '',
    height:              '',
    build:               '',
    hairColor:           '',
    eyeColor:            '',
    distinctiveFeatures: '',
    style:               '',
  },
  // Legacy flat fields (kept for backward compat)
  age:                    '',
  appearance:             '',
  style:                  '',
  distinguishingFeatures: '',
  // Psychology
  backstory:        '',
  motivations:      '',
  fears:            '',
  internalConflict: '',
  externalConflict: '',
  arcSummary:       '',
  // Custom fields
  customFields: [],
  // Voice DNA
  voiceDna: {
    speechPatterns:      '',
    vocabularyLevel:     '',
    sentenceLengthPref:  '',
    commonPhrases:       [],
    neverSayPhrases:     [],
    humorStyle:          '',
    tellsLying:          '',
    tellsStressed:       '',
    whenWantsSomething:  '',
    whenThreatened:      '',
  },
  // Relationships
  relationshipMap: [],  // [{ characterId, relationshipType, description }]
  // Scene history
  sceneHistory: [],
  // Momentum
  momentumScore:     0,
  importanceHistory: [],  // [{ importance, date, note }]
  // Photo
  photoUrl: null,
}

// ── Momentum calculation ──────────────────────────────────────────────────────
export function calculateMomentumScore(character) {
  if (!character) return 0
  const importanceWeight = (character.importance ?? 1) * 25
  const appearanceWeight = Math.min((character.sceneHistory?.length ?? 0) * 8, 50)
  const relationshipWeight = Math.min((character.relationshipMap?.length ?? 0) * 5, 25)
  return Math.min(importanceWeight + appearanceWeight + relationshipWeight, 100)
}

// ── List hook (for Characters page) ──────────────────────────────────────────
export function useCharacters(projectId) {
  const [characters, setCharacters] = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    if (!projectId) return
    const q = query(
      collection(db, 'projects', projectId, 'characters'),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, snap => {
      setCharacters(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, err => {
      console.warn('[useCharacters]', err.message)
      setLoading(false)
    })
    return unsub
  }, [projectId])

  const createCharacter = useCallback(async (data) => {
    const now = new Date().toISOString()
    const ref = await addDoc(collection(db, 'projects', projectId, 'characters'), sanitizeForFirestore({
      ...DEFAULT_CHARACTER,
      ...data,
      importanceHistory: [{ importance: data.importance ?? 1, date: now, note: 'Created' }],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }))
    return ref.id
  }, [projectId])

  const deleteCharacter = useCallback(async (characterId) => {
    await deleteDoc(doc(db, 'projects', projectId, 'characters', characterId))
  }, [projectId])

  return { characters, loading, createCharacter, deleteCharacter }
}

// ── Single-character hook (for CharacterDetail page) ─────────────────────────
export function useCharacter(projectId, characterId) {
  const [character, setCharacter] = useState(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!projectId || !characterId) return
    const ref = doc(db, 'projects', projectId, 'characters', characterId)
    const unsub = onSnapshot(ref, snap => {
      setCharacter(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      setLoading(false)
    }, err => {
      console.warn('[useCharacter]', err.message)
      setLoading(false)
    })
    return unsub
  }, [projectId, characterId])

  const update = useCallback(async (updates) => {
    await updateDoc(doc(db, 'projects', projectId, 'characters', characterId), sanitizeForFirestore({
      ...updates,
      updatedAt: serverTimestamp(),
    }))
  }, [projectId, characterId])

  // Special handler for importance changes — appends to importanceHistory
  const updateImportance = useCallback(async (newImportance, currentHistory = [], note = '') => {
    const historyEntry = { importance: newImportance, date: new Date().toISOString(), note }
    await updateDoc(doc(db, 'projects', projectId, 'characters', characterId), sanitizeForFirestore({
      importance: newImportance,
      importanceHistory: [...(currentHistory ?? []), historyEntry],
      updatedAt: serverTimestamp(),
    }))
  }, [projectId, characterId])

  return { character, loading, update, updateImportance }
}
