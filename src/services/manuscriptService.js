/**
 * manuscriptService — scene content + structure mutations.
 *
 * Manuscript structure (the nested parts/chapters/scenes hierarchy) lives as a
 * JSON blob embedded in the project document. Scene content (rich text) lives
 * in the `projects/{id}/scenes/{id}` subcollection.
 *
 * This service provides pure async functions that mirror the methods in
 * useManuscript.js so they can be called from outside React components.
 */

import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, increment,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { v4 as uuidv4 } from 'uuid'

const genId = prefix => `${prefix}_${uuidv4().slice(0, 8)}`

// ── Structure helpers (pure) ──────────────────────────────────────────────────

export function getAllChapters(structure) {
  if (!structure) return []
  if (structure.hasParts) {
    return (structure.parts || []).flatMap(p => p.chapters || [])
  }
  return structure.chapters || []
}

export function findSceneMeta(structure, sceneId) {
  const chapters = getAllChapters(structure)
  for (const ch of chapters) {
    const scene = (ch.scenes || []).find(s => s.id === sceneId)
    if (scene) return { scene, chapterId: ch.id }
  }
  return null
}

function mapChapters(structure, fn) {
  if (structure.hasParts) {
    return { ...structure, parts: structure.parts.map(p => ({ ...p, chapters: p.chapters.map(fn) })) }
  }
  return { ...structure, chapters: (structure.chapters || []).map(fn) }
}

// ── Structure persistence ────────────────────────────────────────────────────

export async function saveStructure(projectId, newStructure) {
  await updateDoc(doc(db, 'projects', projectId), {
    structure: newStructure,
    updatedAt: serverTimestamp(),
  })
}

// ── Scene content ─────────────────────────────────────────────────────────────

export async function loadSceneContent(projectId, sceneId) {
  const snap = await getDoc(doc(db, 'projects', projectId, 'scenes', sceneId))
  return snap.exists() ? snap.data() : { content: '', notes: '' }
}

export async function saveSceneContent(projectId, sceneId, content, wordCount, structure) {
  await setDoc(
    doc(db, 'projects', projectId, 'scenes', sceneId),
    { content, updatedAt: serverTimestamp() },
    { merge: true }
  )

  if (!structure) return

  const oldWordCount = findSceneMeta(structure, sceneId)?.scene?.wordCount ?? 0
  const delta = wordCount - oldWordCount

  if (delta > 0) {
    const today = new Date().toISOString().slice(0, 10)
    setDoc(
      doc(db, 'projects', projectId, 'writingDays', today),
      { wordsWritten: increment(delta), date: today },
      { merge: true }
    ).catch(() => {})
  }

  const newStructure = mapChapters(structure, ch => ({
    ...ch,
    scenes: ch.scenes.map(s => s.id === sceneId ? { ...s, wordCount } : s),
  }))

  const totalWords = getAllChapters(newStructure)
    .flatMap(ch => ch.scenes)
    .reduce((sum, s) => sum + (s.wordCount || 0), 0)

  await updateDoc(doc(db, 'projects', projectId), {
    structure: newStructure,
    wordCount:  totalWords,
    updatedAt:  serverTimestamp(),
  })
}

// ── Structure mutations ───────────────────────────────────────────────────────

export function addPart(structure) {
  const newPart = { id: genId('pt'), title: 'Untitled Part', chapters: [] }
  return {
    newStructure: {
      ...structure,
      hasParts: true,
      parts: [...(structure.parts || []), newPart],
    },
    newPart,
  }
}

export function addChapter(structure, partId = null) {
  const ch = { id: genId('ch'), title: 'Untitled Chapter', scenes: [] }
  let newStructure
  if (structure.hasParts && partId) {
    newStructure = { ...structure, parts: structure.parts.map(p => p.id === partId ? { ...p, chapters: [...p.chapters, ch] } : p) }
  } else {
    newStructure = { ...structure, chapters: [...(structure.chapters || []), ch] }
  }
  return { newStructure, newChapter: ch }
}

export function addScene(structure, chapterId) {
  const scene = {
    id: genId('sc'), title: 'Untitled Scene',
    wordCount: 0, status: 'planned',
    povCharacter: '', tags: [],
    linkedThreadIds: [], linkedCharIds: [],
  }
  const newStructure = mapChapters(structure, ch =>
    ch.id === chapterId ? { ...ch, scenes: [...ch.scenes, scene] } : ch
  )
  return { newStructure, newScene: scene }
}

export function updateSceneMeta(structure, sceneId, updates) {
  return mapChapters(structure, ch => ({
    ...ch,
    scenes: ch.scenes.map(s => s.id === sceneId ? { ...s, ...updates } : s),
  }))
}

export function renameChapter(structure, chapterId, title) {
  return mapChapters(structure, ch => ch.id === chapterId ? { ...ch, title } : ch)
}

export function renamePart(structure, partId, title) {
  if (!structure.hasParts) return structure
  return { ...structure, parts: structure.parts.map(p => p.id === partId ? { ...p, title } : p) }
}

export function deleteSceneFromStructure(structure, sceneId, chapterId) {
  return mapChapters(structure, ch =>
    ch.id === chapterId ? { ...ch, scenes: ch.scenes.filter(s => s.id !== sceneId) } : ch
  )
}

export function deleteChapterFromStructure(structure, chapterId, partId = null) {
  if (structure.hasParts && partId) {
    return {
      ...structure,
      parts: structure.parts.map(p =>
        p.id === partId ? { ...p, chapters: p.chapters.filter(ch => ch.id !== chapterId) } : p
      ),
    }
  }
  return { ...structure, chapters: structure.chapters.filter(ch => ch.id !== chapterId) }
}

export async function deleteSceneDoc(projectId, sceneId) {
  await deleteDoc(doc(db, 'projects', projectId, 'scenes', sceneId)).catch(() => {})
}

export function reorderScenes(structure, chapterId, newScenes) {
  return mapChapters(structure, ch => ch.id === chapterId ? { ...ch, scenes: newScenes } : ch)
}

export function reorderChapters(structure, newChapters, partId = null) {
  if (structure.hasParts && partId) {
    return { ...structure, parts: structure.parts.map(p => p.id === partId ? { ...p, chapters: newChapters } : p) }
  }
  return { ...structure, chapters: newChapters }
}
