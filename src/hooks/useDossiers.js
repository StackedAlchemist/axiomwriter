/**
 * useDossiers
 *
 * Firestore CRUD hook for the `projects/{projectId}/dossiers` subcollection.
 * Mirrors the pattern used by useLore.js.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { db } from '../firebase/config'

export function useDossiers(projectId) {
  const [dossiers, setDossiers] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!projectId) return
    const q = query(
      collection(db, 'projects', projectId, 'dossiers'),
      orderBy('createdAt', 'desc'),
    )
    const unsub = onSnapshot(q, snap => {
      setDossiers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, err => {
      console.warn('[useDossiers]', err.message)
      setLoading(false)
    })
    return unsub
  }, [projectId])

  const createDossier = useCallback(async (data) => {
    // rawHtml can be large — warn if over 800 KB
    const raw = data.rawHtml ?? ''
    if (raw.length > 800_000) {
      console.warn('[useDossiers] rawHtml exceeds 800 KB — Firestore document may be rejected.')
    }

    const ref = await addDoc(collection(db, 'projects', projectId, 'dossiers'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }, [projectId])

  const updateDossier = useCallback(async (dossierId, updates) => {
    await updateDoc(doc(db, 'projects', projectId, 'dossiers', dossierId), {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  }, [projectId])

  const deleteDossier = useCallback(async (dossierId) => {
    await deleteDoc(doc(db, 'projects', projectId, 'dossiers', dossierId))
  }, [projectId])

  return { dossiers, loading, createDossier, updateDossier, deleteDossier }
}
