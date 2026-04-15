/**
 * locationService — CRUD for map locations / pins.
 *
 * Locations live at: projects/{projectId}/maps/{mapId}
 * The individual pins are stored as an array field on the map doc (existing).
 * This service provides a thin wrapper + normalizer layer.
 *
 * For future: if pins grow large, they could be moved to a subcollection.
 */

import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc,
  onSnapshot, serverTimestamp, query, orderBy,
  arrayUnion, arrayRemove,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { normalizeLocation } from '../schemas/index'

// Maps collection
const mapsCol  = (projectId) => collection(db, 'projects', projectId, 'maps')
const mapRef   = (projectId, mapId) => doc(db, 'projects', projectId, 'maps', mapId)

// ── Map CRUD ──────────────────────────────────────────────────────────────────

export async function createMap(projectId, data = {}) {
  const docRef = await addDoc(mapsCol(projectId), {
    projectId,
    name:        data.name        || 'World Map',
    description: data.description || '',
    imageUrl:    data.imageUrl    || null,
    pins:        data.pins        || [],
    paths:       data.paths       || [],
    regions:     data.regions     || [],
    zoom:        data.zoom        || 1,
    panX:        data.panX        || 0,
    panY:        data.panY        || 0,
    createdAt:   serverTimestamp(),
    updatedAt:   serverTimestamp(),
  })
  return docRef.id
}

export async function getMap(projectId, mapId) {
  const snap = await getDoc(mapRef(projectId, mapId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export function subscribeToMaps(projectId, onChange, onError) {
  const q = query(mapsCol(projectId), orderBy('createdAt', 'asc'))
  return onSnapshot(
    q,
    snap => onChange(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err  => onError?.(err),
  )
}

export async function updateMap(projectId, mapId, updates) {
  await updateDoc(mapRef(projectId, mapId), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteMap(projectId, mapId) {
  await deleteDoc(mapRef(projectId, mapId))
}

// ── Pin helpers (inline in map doc's `pins` array) ───────────────────────────

export async function addPin(projectId, mapId, pin) {
  await updateDoc(mapRef(projectId, mapId), {
    pins: arrayUnion(pin),
    updatedAt: serverTimestamp(),
  })
}

export async function removePin(projectId, mapId, pin) {
  await updateDoc(mapRef(projectId, mapId), {
    pins: arrayRemove(pin),
    updatedAt: serverTimestamp(),
  })
}

// ── Normalized location view (for cross-feature use) ─────────────────────────

/**
 * Flatten all pins from all maps into normalised Location objects.
 * Useful when you need to pick a location from any map.
 */
export async function getProjectLocations(projectId) {
  const { getDocs } = await import('firebase/firestore')
  const snap = await getDocs(mapsCol(projectId))
  const locations = []
  snap.docs.forEach(d => {
    const map = d.data()
    ;(map.pins || []).forEach(pin => {
      locations.push(normalizeLocation({
        ...pin,
        mapId:     d.id,
        projectId,
      }))
    })
  })
  return locations
}
