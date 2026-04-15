import { useState, useEffect, useCallback } from 'react'
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { sanitizeForFirestore } from '../utils/sanitizeForFirestore'

export const FLEXIBILITY_OPTIONS = [
  {
    value: 'locked',
    label: 'Locked',
    desc: 'AI cannot contradict or change this',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/30',
    icon: 'lock',
  },
  {
    value: 'flexible',
    label: 'Flexible',
    desc: 'AI can expand on this',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/30',
    icon: 'unlock',
  },
]

export const DEFAULT_LORE_ENTRY = {
  title: '',
  category: '',
  content: '',
  tags: [],
  relatedCharacters: [],
  relatedLocations: [],
  flexibility: 'flexible',
}

// ── List hook (for LoreBible page) ───────────────────────────────────────────
export function useLore(projectId) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    const q = query(
      collection(db, 'projects', projectId, 'lore'),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, err => {
      console.warn('[useLore]', err.message)
      setLoading(false)
    })
    return unsub
  }, [projectId])

  const createEntry = useCallback(async (data) => {
    const ref = await addDoc(collection(db, 'projects', projectId, 'lore'), sanitizeForFirestore({
      ...DEFAULT_LORE_ENTRY,
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }))
    return ref.id
  }, [projectId])

  const deleteEntry = useCallback(async (entryId) => {
    await deleteDoc(doc(db, 'projects', projectId, 'lore', entryId))
  }, [projectId])

  return { entries, loading, createEntry, deleteEntry }
}

// ── Single-entry hook (for LoreEntryPanel) ───────────────────────────────────
export function useLoreEntry(projectId, entryId) {
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId || !entryId) {
      setEntry(null)
      setLoading(false)
      return
    }
    const ref = doc(db, 'projects', projectId, 'lore', entryId)
    const unsub = onSnapshot(ref, snap => {
      setEntry(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      setLoading(false)
    }, err => {
      console.warn('[useLoreEntry]', err.message)
      setLoading(false)
    })
    return unsub
  }, [projectId, entryId])

  const update = useCallback(async (updates) => {
    if (!entryId) return
    await updateDoc(doc(db, 'projects', projectId, 'lore', entryId), sanitizeForFirestore({
      ...updates,
      updatedAt: serverTimestamp(),
    }))
  }, [projectId, entryId])

  return { entry, loading, update }
}

// ── Build lore context string for AI (Composer Mode) ─────────────────────────
export function buildLoreContext(entries) {
  if (!entries || !entries.length) return ''

  const lockedByCategory = {}
  const flexibleEntries = []

  entries.forEach(entry => {
    const cat = (entry.category || 'General').trim()
    const text = entry.content
      ? entry.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      : ''
    if (entry.flexibility === 'locked') {
      if (!lockedByCategory[cat]) lockedByCategory[cat] = []
      lockedByCategory[cat].push({ title: entry.title, text })
    } else {
      flexibleEntries.push({ title: entry.title, category: cat, text })
    }
  })

  const lines = []

  Object.entries(lockedByCategory)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([cat, items]) => {
      lines.push(`[LOCKED ${cat.toUpperCase()}]`)
      items.forEach(item => lines.push(`- ${item.title}: ${item.text}`))
      lines.push('')
    })

  if (flexibleEntries.length > 0) {
    lines.push('[ESTABLISHED LORE - FLEXIBLE]')
    flexibleEntries.forEach(item => {
      const summary = item.text.length > 200 ? item.text.slice(0, 200) + '…' : item.text
      lines.push(`- ${item.title} (${item.category}): ${summary}`)
    })
  }

  return lines.join('\n').trim()
}

// Backward-compat alias
export function buildLockedLoreContext(entries) {
  return buildLoreContext(entries)
}
