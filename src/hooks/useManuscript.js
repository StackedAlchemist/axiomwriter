import { useState, useEffect, useCallback } from 'react'
import {
  doc, getDoc, updateDoc, setDoc, deleteDoc,
  onSnapshot, serverTimestamp, increment,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { v4 as uuidv4 } from 'uuid'
import { sanitizeForFirestore } from '../utils/sanitizeForFirestore'

const genId = (prefix) => `${prefix}_${uuidv4().slice(0, 8)}`

// ── Helpers ──────────────────────────────────────────────────────────────────

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
  return { ...structure, chapters: structure.chapters.map(fn) }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useManuscript(projectId) {
  const [project,            setProject]            = useState(null)
  const [structure,          setStructure]          = useState(null)
  const [loading,            setLoading]            = useState(true)
  const [error,              setError]              = useState(null)
  const [activeSceneId,      setActiveSceneId]      = useState(null)
  const [activeSceneContent, setActiveSceneContent] = useState(null)
  const [sceneLoading,       setSceneLoading]       = useState(false)

  // Subscribe to project document
  useEffect(() => {
    if (!projectId) return
    const ref = doc(db, 'projects', projectId)
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        const data = snap.data()
        setProject({ id: snap.id, ...data })
        setStructure(data.structure || { hasParts: false, chapters: [] })
      } else {
        setError('Project not found.')
      }
      setLoading(false)
    }, err => {
      setError(err.message)
      setLoading(false)
    })
    return unsub
  }, [projectId])

  // Save the full structure back to Firestore
  const updateStructure = useCallback(async (newStructure) => {
    await updateDoc(doc(db, 'projects', projectId), sanitizeForFirestore({
      structure: newStructure,
      updatedAt: serverTimestamp(),
    }))
  }, [projectId])

  // Load a scene's content on demand
  const loadScene = useCallback(async (sceneId) => {
    if (!sceneId) { setActiveSceneId(null); setActiveSceneContent(null); return }
    setActiveSceneId(sceneId)
    setSceneLoading(true)
    try {
      const snap = await getDoc(doc(db, 'projects', projectId, 'scenes', sceneId))
      setActiveSceneContent(snap.exists() ? snap.data() : { content: '', notes: '' })
    } catch (err) {
      // Offline or permission error — open an empty editor so the user can still write
      console.warn('[loadScene]', err.message)
      setActiveSceneContent({ content: '', notes: '' })
    } finally {
      setSceneLoading(false)
    }
  }, [projectId])

  // Save scene content + update word count in structure
  const saveSceneContent = useCallback(async (sceneId, content, wordCount) => {
    // Persist content
    await setDoc(doc(db, 'projects', projectId, 'scenes', sceneId), {
      content,
      updatedAt: serverTimestamp(),
    }, { merge: true })

    // Update word count metadata in structure (non-blocking, fire & forget)
    if (structure) {
      // Track words written today (positive delta only)
      const oldWordCount = findSceneMeta(structure, sceneId)?.scene?.wordCount ?? 0
      const delta = wordCount - oldWordCount
      if (delta > 0) {
        const today = (() => {
          const d = new Date()
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        })()
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

      // Also roll up total word count on project
      const totalWords = getAllChapters(newStructure)
        .flatMap(ch => ch.scenes)
        .reduce((sum, s) => sum + (s.wordCount || 0), 0)

      await updateDoc(doc(db, 'projects', projectId), sanitizeForFirestore({
        structure: newStructure,
        wordCount: totalWords,
        updatedAt: serverTimestamp(),
      }))
    }
  }, [projectId, structure])

  // ── Structure mutation helpers ────────────────────────────────────────────

  const addPart = useCallback(async () => {
    const newPart = { id: genId('pt'), title: 'Untitled Part', chapters: [] }
    const newStructure = {
      ...structure,
      hasParts: true,
      parts: [...(structure.parts || []), newPart],
    }
    await updateStructure(newStructure)
    return newPart
  }, [structure, updateStructure])

  const addChapter = useCallback(async (partId = null) => {
    const ch = { id: genId('ch'), title: 'Untitled Chapter', scenes: [] }
    let newStructure
    if (structure.hasParts && partId) {
      newStructure = { ...structure, parts: structure.parts.map(p => p.id === partId ? { ...p, chapters: [...p.chapters, ch] } : p) }
    } else {
      newStructure = { ...structure, chapters: [...(structure.chapters || []), ch] }
    }
    await updateStructure(newStructure)
    return ch
  }, [structure, updateStructure])

  const addScene = useCallback(async (chapterId, partId = null) => {
    const scene = { id: genId('sc'), title: 'Untitled Scene', wordCount: 0, status: 'planned', povCharacter: '', tags: [] }
    const newStructure = mapChapters(structure, ch =>
      ch.id === chapterId ? { ...ch, scenes: [...ch.scenes, scene] } : ch
    )
    await updateStructure(newStructure)
    return scene
  }, [structure, updateStructure])

  const updateSceneMeta = useCallback(async (sceneId, updates) => {
    const newStructure = mapChapters(structure, ch => ({
      ...ch,
      scenes: ch.scenes.map(s => s.id === sceneId ? { ...s, ...updates } : s),
    }))
    await updateStructure(newStructure)
  }, [structure, updateStructure])

  const renameChapter = useCallback(async (chapterId, title) => {
    const newStructure = mapChapters(structure, ch => ch.id === chapterId ? { ...ch, title } : ch)
    await updateStructure(newStructure)
  }, [structure, updateStructure])

  const renamePart = useCallback(async (partId, title) => {
    if (!structure.hasParts) return
    const newStructure = { ...structure, parts: structure.parts.map(p => p.id === partId ? { ...p, title } : p) }
    await updateStructure(newStructure)
  }, [structure, updateStructure])

  const deleteScene = useCallback(async (sceneId, chapterId) => {
    const newStructure = mapChapters(structure, ch =>
      ch.id === chapterId ? { ...ch, scenes: ch.scenes.filter(s => s.id !== sceneId) } : ch
    )
    await updateStructure(newStructure)
    await deleteDoc(doc(db, 'projects', projectId, 'scenes', sceneId)).catch(() => {})
    if (activeSceneId === sceneId) { setActiveSceneId(null); setActiveSceneContent(null) }
  }, [structure, updateStructure, projectId, activeSceneId])

  const deleteChapter = useCallback(async (chapterId, partId = null) => {
    let newStructure
    if (structure.hasParts && partId) {
      newStructure = {
        ...structure,
        parts: structure.parts.map(p => p.id === partId
          ? { ...p, chapters: p.chapters.filter(ch => ch.id !== chapterId) }
          : p
        ),
      }
    } else {
      newStructure = { ...structure, chapters: structure.chapters.filter(ch => ch.id !== chapterId) }
    }
    await updateStructure(newStructure)
  }, [structure, updateStructure])

  const reorderScenes = useCallback(async (chapterId, newScenes) => {
    const newStructure = mapChapters(structure, ch => ch.id === chapterId ? { ...ch, scenes: newScenes } : ch)
    await updateStructure(newStructure)
  }, [structure, updateStructure])

  const reorderChapters = useCallback(async (newChapters, partId = null) => {
    let newStructure
    if (structure.hasParts && partId) {
      newStructure = { ...structure, parts: structure.parts.map(p => p.id === partId ? { ...p, chapters: newChapters } : p) }
    } else {
      newStructure = { ...structure, chapters: newChapters }
    }
    await updateStructure(newStructure)
  }, [structure, updateStructure])

  // Bulk import from docx parser
  // mode: 'replace' (default) overwrites structure; 'append' merges chapters into existing structure
  const importStructure = useCallback(async (newStructure, sceneContents, mode = 'replace') => {
    // Write all scene content docs in parallel
    await Promise.all(
      Object.entries(sceneContents).map(([sceneId, content]) =>
        setDoc(doc(db, 'projects', projectId, 'scenes', sceneId), {
          content,
          updatedAt: serverTimestamp(),
        }, { merge: true })
      )
    )

    let mergedStructure = newStructure
    if (mode === 'append' && structure) {
      // Append imported chapters into the existing structure (flatten to chapter level)
      const newChapters = getAllChapters(newStructure)
      if (structure.hasParts) {
        // Append to last part, or add as standalone chapters under a new part
        const parts = [...(structure.parts || [])]
        if (parts.length > 0) {
          const lastPart = { ...parts[parts.length - 1], chapters: [...(parts[parts.length - 1].chapters || []), ...newChapters] }
          parts[parts.length - 1] = lastPart
          mergedStructure = { ...structure, parts }
        } else {
          mergedStructure = { ...structure, parts: [{ id: genId('pt'), title: 'Imported', chapters: newChapters }] }
        }
      } else {
        mergedStructure = { ...structure, chapters: [...(structure.chapters || []), ...newChapters] }
      }
    }

    const importedWords = getAllChapters(newStructure)
      .flatMap(ch => ch.scenes)
      .reduce((sum, s) => sum + (s.wordCount || 0), 0)
    const existingWords = mode === 'append' ? (project?.wordCount || 0) : 0

    await updateDoc(doc(db, 'projects', projectId), sanitizeForFirestore({
      structure: mergedStructure,
      wordCount: existingWords + importedWords,
      updatedAt: serverTimestamp(),
    }))
  }, [projectId, structure, project])

  return {
    project, structure, loading, error,
    activeSceneId, activeSceneContent, sceneLoading,
    loadScene, saveSceneContent,
    addPart, addChapter, addScene,
    updateSceneMeta, renameChapter, renamePart,
    deleteScene, deleteChapter,
    reorderScenes, reorderChapters,
    importStructure,
  }
}
