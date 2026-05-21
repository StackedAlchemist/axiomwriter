/**
 * useSeries — Firestore hooks for Series data model
 *
 * series/{seriesId}: {
 *   uid, name, description, genre,
 *   books: [{ projectId, bookNumber, title }],
 *   createdAt, updatedAt
 * }
 *
 * series/{seriesId}/lore/{entryId}: same structure as project lore
 */

import { useState, useEffect } from 'react'
import {
  collection, query, where, onSnapshot,
  doc, addDoc, updateDoc, deleteDoc,
  serverTimestamp, orderBy,
} from 'firebase/firestore'
import { db } from '../firebase/config'

// ── List all series for a user ─────────────────────────────────────────────

export function useSeries(userId) {
  const [series,  setSeries]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    const q = query(
      collection(db, 'series'),
      where('uid', '==', userId),
      orderBy('createdAt', 'desc'),
    )
    const unsub = onSnapshot(q, snap => {
      setSeries(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [userId])

  async function createSeries({ name, description, genre }) {
    const ref = await addDoc(collection(db, 'series'), {
      uid:         userId,
      name:        name.trim(),
      description: description?.trim() || '',
      genre:       genre || '',
      books:       [],
      createdAt:   serverTimestamp(),
      updatedAt:   serverTimestamp(),
    })
    return ref.id
  }

  async function deleteSeries(seriesId) {
    await deleteDoc(doc(db, 'series', seriesId))
  }

  return { series, loading, createSeries, deleteSeries }
}

// ── Single series with full operations ────────────────────────────────────

export function useSeriesDetail(seriesId) {
  const [series,  setSeries]  = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!seriesId) { setLoading(false); return }
    const unsub = onSnapshot(doc(db, 'series', seriesId), snap => {
      setSeries(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [seriesId])

  async function updateSeries(updates) {
    await updateDoc(doc(db, 'series', seriesId), {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  }

  async function addBook(projectId, bookNumber, title) {
    if (!series) return
    const current = series.books || []
    if (current.some(b => b.projectId === projectId)) return
    await updateDoc(doc(db, 'series', seriesId), {
      books:     [...current, { projectId, bookNumber: Number(bookNumber), title }],
      updatedAt: serverTimestamp(),
    })
  }

  async function removeBook(projectId) {
    if (!series) return
    await updateDoc(doc(db, 'series', seriesId), {
      books:     (series.books || []).filter(b => b.projectId !== projectId),
      updatedAt: serverTimestamp(),
    })
  }

  async function reorderBooks(newBooks) {
    await updateDoc(doc(db, 'series', seriesId), {
      books:     newBooks,
      updatedAt: serverTimestamp(),
    })
  }

  return { series, loading, updateSeries, addBook, removeBook, reorderBooks }
}

// ── Series lore (sub-collection: series/{seriesId}/lore) ──────────────────

export function useSeriesLore(seriesId) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!seriesId) { setLoading(false); return }
    const q = query(
      collection(db, 'series', seriesId, 'lore'),
      orderBy('createdAt', 'asc'),
    )
    const unsub = onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [seriesId])

  async function createEntry(data) {
    await addDoc(collection(db, 'series', seriesId, 'lore'), {
      title:       data.title?.trim() || 'Untitled',
      category:    data.category    || 'World',
      content:     data.content     || '',
      flexibility: data.flexibility || 'locked',
      tags:        data.tags        || [],
      createdAt:   serverTimestamp(),
      updatedAt:   serverTimestamp(),
    })
  }

  async function updateEntry(entryId, data) {
    await updateDoc(doc(db, 'series', seriesId, 'lore', entryId), {
      ...data,
      updatedAt: serverTimestamp(),
    })
  }

  async function deleteEntry(entryId) {
    await deleteDoc(doc(db, 'series', seriesId, 'lore', entryId))
  }

  return { entries, loading, createEntry, updateEntry, deleteEntry }
}
