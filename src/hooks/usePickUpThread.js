import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore'
import { db } from '../firebase/config'

function getAllChapters(structure) {
  if (!structure) return []
  if (structure.hasParts) return (structure.parts || []).flatMap(p => p.chapters || [])
  return structure.chapters || []
}

/**
 * Fetches up to 4 real "pick up a thread" cards for a given project:
 *   WRITING  — most recently updated scene
 *   WORLD    — most recently updated lore entry
 *   CHARACTER — first character with an incomplete profile
 *   PLOT     — most recent active (unresolved) story thread
 *
 * Returns { threads, loading }.
 * threads is [] while loading or if the project has no content yet.
 */
export function usePickUpThread(projectId, structure) {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!projectId) { setThreads([]); setLoading(false); return }

    let cancelled = false
    setLoading(true)

    async function fetchAll() {
      const result = []

      // ── WRITING: most recently saved scene ──────────────────────────────
      try {
        const snap = await getDocs(query(
          collection(db, 'projects', projectId, 'scenes'),
          orderBy('updatedAt', 'desc'),
          limit(1),
        ))
        if (!snap.empty) {
          const sceneId = snap.docs[0].id
          let sceneTitle = 'your last scene'
          const chapters = getAllChapters(structure)
          for (const ch of chapters) {
            const found = (ch.scenes || []).find(s => s.id === sceneId)
            if (found?.title) { sceneTitle = found.title; break }
          }
          result.push({
            type:       'writing',
            category:   'Writing',
            title:      sceneTitle,
            context:    'You stopped here',
            cta:        'Resume writing',
            href:       `/projects/${projectId}`,
            state:      { openSceneId: sceneId },
            accentRgb:  '201,168,76',
          })
        }
      } catch { /* non-blocking */ }

      // ── WORLD: most recently updated lore entry ─────────────────────────
      try {
        const snap = await getDocs(query(
          collection(db, 'projects', projectId, 'lore'),
          orderBy('updatedAt', 'desc'),
          limit(1),
        ))
        if (!snap.empty) {
          const entry = snap.docs[0].data()
          result.push({
            type:      'world',
            category:  'World',
            title:     entry.title || 'Lore entry',
            context:   entry.category || 'World-building',
            cta:       'Expand entry',
            href:      `/projects/${projectId}/lore`,
            accentRgb: '45,212,191',
          })
        }
      } catch { /* non-blocking */ }

      // ── CHARACTER: first character with an incomplete profile ───────────
      try {
        const snap = await getDocs(query(
          collection(db, 'projects', projectId, 'characters'),
          orderBy('updatedAt', 'desc'),
          limit(10),
        ))
        const incomplete = snap.docs.find(d => {
          const c = d.data()
          const vdna = c.voiceDna || {}
          const hasVoice = vdna.speechPatterns || vdna.vocabularyLevel || vdna.commonPhrases?.length
          return !c.backstory || !c.motivations || !c.fears || !hasVoice
        })
        if (incomplete) {
          result.push({
            type:      'character',
            category:  'Character',
            title:     incomplete.data().name || 'Character',
            context:   'Profile incomplete',
            cta:       'Complete profile',
            href:      `/projects/${projectId}/characters/${incomplete.id}`,
            accentRgb: '158,125,212',
          })
        }
      } catch { /* non-blocking */ }

      // ── PLOT: most recent active (unresolved) story thread ──────────────
      try {
        const snap = await getDocs(query(
          collection(db, 'projects', projectId, 'threads'),
          where('status', '==', 'active'),
          orderBy('updatedAt', 'desc'),
          limit(1),
        ))
        if (!snap.empty) {
          const t = snap.docs[0].data()
          result.push({
            type:      'plot',
            category:  'Plot',
            title:     t.title || 'Open thread',
            context:   'Unresolved',
            cta:       'Continue plotting',
            href:      `/projects/${projectId}/threads`,
            accentRgb: '249,115,22',
          })
        }
      } catch { /* non-blocking */ }

      if (!cancelled) {
        setThreads(result.slice(0, 4))
        setLoading(false)
      }
    }

    fetchAll()
    return () => { cancelled = true }
  }, [projectId]) // structure excluded — changes don't warrant a re-fetch

  return { threads, loading }
}
