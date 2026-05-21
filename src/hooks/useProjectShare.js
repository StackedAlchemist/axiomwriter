import { useState, useEffect } from 'react'
import {
  collection, doc, addDoc, updateDoc, getDocs,
  onSnapshot, query, where, orderBy, serverTimestamp, getDoc,
} from 'firebase/firestore'
import { db } from '../firebase/config'

function getAllChapters(structure) {
  if (!structure) return []
  if (structure.hasParts) return (structure.parts || []).flatMap(p => p.chapters || [])
  return structure.chapters || []
}

// ── Author-side: list and manage shares for a project ─────────────────────────

export function useProjectShares(projectId, userId) {
  const [shares,  setShares]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId || !userId) { setLoading(false); return }
    const q = query(
      collection(db, 'projectShares'),
      where('projectId', '==', projectId),
      where('authorId',  '==', userId),
      orderBy('createdAt', 'desc'),
    )
    const unsub = onSnapshot(q, snap => {
      setShares(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [projectId, userId])

  async function createShare({ projectTitle, authorName, coverImageUrl, scope, selectedChapterIds, structure }) {
    const chapters = getAllChapters(structure)
    const inScope  = scope === 'full'
      ? chapters
      : chapters.filter(ch => selectedChapterIds.includes(ch.id))

    const shareRef = await addDoc(collection(db, 'projectShares'), {
      authorId:           userId,
      projectId,
      projectTitle,
      authorName:         authorName || 'Anonymous',
      coverImageUrl:      coverImageUrl || null,
      scope,
      selectedChapterIds: selectedChapterIds || [],
      chapterCount:       inScope.length,
      active:             true,
      createdAt:          serverTimestamp(),
    })

    // Snapshot scene content into share subcollection
    const chapsColl = collection(db, 'projectShares', shareRef.id, 'chapters')
    for (let i = 0; i < inScope.length; i++) {
      const ch = inScope[i]
      const sceneSnapshots = []
      for (const s of (ch.scenes || [])) {
        let content = ''
        try {
          const snap = await getDoc(doc(db, 'projects', projectId, 'scenes', s.id))
          if (snap.exists()) content = snap.data().content || ''
        } catch { /* scene has no content yet */ }
        sceneSnapshots.push({ id: s.id, title: s.title || '', content })
      }
      await addDoc(chapsColl, {
        chapterTitle: ch.title || `Chapter ${i + 1}`,
        order:        i,
        scenes:       sceneSnapshots,
      })
    }

    return shareRef.id
  }

  async function toggleShare(shareId, active) {
    await updateDoc(doc(db, 'projectShares', shareId), { active })
  }

  return { shares, loading, createShare, toggleShare }
}

// ── Reader-side: load share + chapter content (no auth required) ───────────────

export async function loadShareForReader(shareId) {
  const snap = await getDoc(doc(db, 'projectShares', shareId))
  if (!snap.exists()) return null
  const share = { id: snap.id, ...snap.data() }

  const chapSnaps = await getDocs(
    query(
      collection(db, 'projectShares', shareId, 'chapters'),
      orderBy('order', 'asc'),
    )
  )
  share.chapters = chapSnaps.docs.map(d => ({ id: d.id, ...d.data() }))
  return share
}
