import { useState, useEffect, useCallback } from 'react'
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, serverTimestamp, query, orderBy,
  arrayUnion, arrayRemove,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { sanitizeForFirestore } from '../utils/sanitizeForFirestore'

export const THREAD_STATUSES = ['active', 'resolved', 'dropped']

export function useThreads(projectId) {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) { setThreads([]); setLoading(false); return }
    const q = query(
      collection(db, 'projects', projectId, 'threads'),
      orderBy('createdAt', 'asc'),
    )
    const unsub = onSnapshot(q, snap => {
      setThreads(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, err => {
      console.warn('[useThreads]', err.message)
      setLoading(false)
    })
    return unsub
  }, [projectId])

  const createThread = useCallback(async (data) => {
    const ref = await addDoc(collection(db, 'projects', projectId, 'threads'), sanitizeForFirestore({
      projectId,
      title:                    data.title || 'Untitled Thread',
      description:              data.description || '',
      type:                     data.type || 'mystery',
      introducedInScene:        data.introducedInScene || null,
      introducedInChapter:      data.introducedInChapter || null,
      lastReferencedInScene:    data.introducedInScene || null,
      lastReferencedInChapter:  data.introducedInChapter || null,
      status:                   'active',
      resolutionNotes:          '',
      scenesAppearingIn:        data.introducedInScene ? [data.introducedInScene] : [],
      linkedScenes:             data.introducedInScene ? [data.introducedInScene] : [],
      linkedCharacters:         data.linkedCharacters || [],
      linkedLore:               data.linkedLore || [],
      dormancyCount:            0,
      createdAt:                serverTimestamp(),
      updatedAt:                serverTimestamp(),
    }))
    return ref.id
  }, [projectId])

  const updateThread = useCallback(async (threadId, updates) => {
    await updateDoc(doc(db, 'projects', projectId, 'threads', threadId), sanitizeForFirestore({
      ...updates,
      updatedAt: serverTimestamp(),
    }))
  }, [projectId])

  const deleteThread = useCallback(async (threadId) => {
    await deleteDoc(doc(db, 'projects', projectId, 'threads', threadId))
  }, [projectId])

  // Bidirectional linking helpers
  const linkScene = useCallback(async (threadId, sceneId) => {
    await updateDoc(doc(db, 'projects', projectId, 'threads', threadId), {
      linkedScenes: arrayUnion(sceneId),
      updatedAt: serverTimestamp(),
    })
  }, [projectId])

  const unlinkScene = useCallback(async (threadId, sceneId) => {
    await updateDoc(doc(db, 'projects', projectId, 'threads', threadId), {
      linkedScenes: arrayRemove(sceneId),
      updatedAt: serverTimestamp(),
    })
  }, [projectId])

  const linkCharacter = useCallback(async (threadId, characterId) => {
    await updateDoc(doc(db, 'projects', projectId, 'threads', threadId), {
      linkedCharacters: arrayUnion(characterId),
      updatedAt: serverTimestamp(),
    })
  }, [projectId])

  const unlinkCharacter = useCallback(async (threadId, characterId) => {
    await updateDoc(doc(db, 'projects', projectId, 'threads', threadId), {
      linkedCharacters: arrayRemove(characterId),
      updatedAt: serverTimestamp(),
    })
  }, [projectId])

  const linkLore = useCallback(async (threadId, loreId) => {
    await updateDoc(doc(db, 'projects', projectId, 'threads', threadId), {
      linkedLore: arrayUnion(loreId),
      updatedAt: serverTimestamp(),
    })
  }, [projectId])

  const unlinkLore = useCallback(async (threadId, loreId) => {
    await updateDoc(doc(db, 'projects', projectId, 'threads', threadId), {
      linkedLore: arrayRemove(loreId),
      updatedAt: serverTimestamp(),
    })
  }, [projectId])

  return {
    threads, loading,
    createThread, updateThread, deleteThread,
    linkScene, unlinkScene,
    linkCharacter, unlinkCharacter,
    linkLore, unlinkLore,
  }
}
