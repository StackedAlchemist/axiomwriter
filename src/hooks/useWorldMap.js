import { useState, useEffect, useCallback, useRef } from 'react'
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { ref as storageRef, uploadString, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase/config'
import { v4 as uuidv4 } from 'uuid'
import { sanitizeForFirestore }   from '../utils/sanitizeForFirestore'
import { assertFirestoreSafeSize } from '../utils/firestorePayloadGuard'
import { ALL_STAMP_TYPES }         from '../components/worldmap/stampLibrary'

export const MAP_TYPES = {
  WORLD:  'world',
  REGION: 'region',
  CITY:   'city',
}

export const MAP_STYLES = [
  { value: 'parchment', label: 'Ancient Parchment', desc: 'Hand-drawn fantasy cartography' },
  { value: 'fantasy',   label: 'Illustrated Fantasy', desc: 'Painterly full-color' },
  { value: 'schematic', label: 'Technical Schematic', desc: 'Blueprint / military grid' },
  { value: 'modern',    label: 'Modern Clean', desc: 'Contemporary atlas' },
]

export const TOOL_TYPES = {
  SELECT:   'select',
  TERRAIN:  'terrain',
  PEN:      'pen',
  RIVER:    'river',
  ROAD:     'road',
  MOUNTAIN: 'mountain',
  FOREST:   'forest',
  DESERT:   'desert',
  PLAINS:   'plains',
  PIN:      'pin',
  FACTION:  'faction',
  LABEL:    'label',
  ERASER:   'eraser',
}

export const STAMP_TYPES = ALL_STAMP_TYPES
export const PATH_TYPES  = ['pen', 'river', 'road']

// ── Terrain brushes (painted onto the terrain layer) ─────────────────────────
export const TERRAIN_BRUSHES = [
  { id: 'water',     label: 'Water',      color: '#5b8fc9' },
  { id: 'deepwater', label: 'Deep Water', color: '#3a6ba8' },
  { id: 'sand',      label: 'Sand',       color: '#d4b877' },
  { id: 'grass',     label: 'Grassland',  color: '#8aa85e' },
  { id: 'forest',    label: 'Forest',     color: '#5d7a42' },
  { id: 'rock',      label: 'Rock',       color: '#8d7f6d' },
  { id: 'snow',      label: 'Snow',       color: '#eee9dc' },
  { id: 'swamp',     label: 'Swamp',      color: '#6d7f5e' },
  { id: 'erase',     label: 'Erase Terrain', color: null },
]

const DEFAULT_MAP = {
  name:            'World Map',
  type:            MAP_TYPES.WORLD,
  style:           'parchment',
  backgroundUrl:   null,
  backgroundData:  null,
  terrainUrl:      null,
  terrainData:     null,
  parentMapId:     null,
  parentPinId:     null,
  width:           1600,
  height:          900,
  pins:            [],
  paths:           [],
  stamps:          [],
  factionBorders:  [],
  labels:          [],
}

// ── Background storage threshold ──────────────────────────────────────────────
// Any backgroundData larger than this (bytes) goes to Firebase Storage instead
// of Firestore. A procedural 1600×900 canvas can easily exceed 1 MB as base64.
const BG_INLINE_LIMIT = 50_000  // 50 KB — small textures/data OK inline

/**
 * Uploads an image data URL to Firebase Storage and returns the download URL.
 * Path: maps/{projectId}/{mapId}/{name}
 */
async function uploadImageToStorage(projectId, mapId, name, dataUrl) {
  const path = `maps/${projectId}/${mapId}/${name}`
  const sRef = storageRef(storage, path)
  await uploadString(sRef, dataUrl, 'data_url')
  const url = await getDownloadURL(sRef)
  return { url, path }
}

// Image fields that offload to Storage when they exceed the inline limit.
// dataField holds the raw data URL; urlField holds the Storage download URL.
// `jpeg: true` allows lossy compression on the downscale fallback (opaque
// images only — terrain needs its alpha channel, so it stays PNG).
const IMAGE_FIELDS = [
  { dataField: 'backgroundData', urlField: 'backgroundUrl', storageName: 'background', jpeg: true },
  { dataField: 'terrainData',    urlField: 'terrainUrl',    storageName: 'terrain',    jpeg: false },
]

// When Storage is unavailable, images this size or smaller are stored inline
// in the Firestore doc (well under the ~1 MB document limit).
const INLINE_FALLBACK_LIMIT = 200_000

/** Redraws a data URL at a smaller size. Returns a new data URL. */
function downscaleDataUrl(dataUrl, targetW, targetH, jpeg) {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const canvas  = document.createElement('canvas')
      canvas.width  = targetW
      canvas.height = targetH
      canvas.getContext('2d').drawImage(img, 0, 0, targetW, targetH)
      resolve(jpeg ? canvas.toDataURL('image/jpeg', 0.62) : canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * Converts a map updates object: any large image data URL (background or
 * painted terrain) is uploaded to Storage and replaced with its download URL.
 * If Storage is unavailable (not enabled on the project, offline), falls back
 * to a downscaled inline copy so the write still succeeds.
 * Returns the safe updates object ready for Firestore.
 */
async function resolveBackground(projectId, mapId, updates) {
  let safe = updates

  for (const { dataField, urlField, storageName, jpeg } of IMAGE_FIELDS) {
    const dataUrl = safe[dataField]
    if (!dataUrl) continue

    const byteEst = Math.ceil((dataUrl.length * 3) / 4) // base64 → bytes estimate
    if (byteEst <= BG_INLINE_LIMIT) continue // small enough to store inline

    try {
      const { url } = await uploadImageToStorage(projectId, mapId, storageName, dataUrl)
      safe = { ...safe, [dataField]: null, [urlField]: url }
    } catch (err) {
      console.warn(`[useWorldMap] Storage upload failed for ${storageName} (is Firebase Storage enabled on this project?). Falling back to a downscaled inline copy.`, err)
      let inlined = null
      for (const [w, h] of [[800, 450], [560, 315]]) {
        try {
          const smaller = await downscaleDataUrl(dataUrl, w, h, jpeg)
          if (Math.ceil((smaller.length * 3) / 4) <= INLINE_FALLBACK_LIMIT) { inlined = smaller; break }
        } catch { /* try next size */ }
      }
      if (inlined) {
        safe = { ...safe, [dataField]: inlined, [urlField]: null }
      } else {
        console.error(`[useWorldMap] Could not compress ${storageName} enough to inline — dropping it from this write.`)
        const { [dataField]: _omit, ...rest } = safe
        safe = rest
      }
    }
  }

  return safe
}

/**
 * Flatten [[x,y],[x,y],...] point pairs to [x,y,x,y,...] flat array.
 * Firestore does not support nested arrays; Konva accepts flat coordinate arrays directly.
 */
function flattenPoints(points) {
  if (!Array.isArray(points)) return points
  if (points.length === 0)    return points
  if (Array.isArray(points[0])) {
    // Nested pairs → flat
    return points.flatMap(([x, y]) => [x, y])
  }
  return points // already flat
}

// ─────────────────────────────────────────────────────────────────────────────

export function useWorldMap(projectId) {
  const [maps,        setMaps]        = useState([])
  const [activeMapId, setActiveMapId] = useState(null)
  const [activeMap,   setActiveMap]   = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [lastSaved,   setLastSaved]   = useState(null)
  const saveTimer = useRef(null)

  // ── Load map list ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return
    const q = query(
      collection(db, 'projects', projectId, 'maps'),
      orderBy('createdAt', 'asc'),
    )
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setMaps(list)
      setLoading(false)
      if (!activeMapId && list.length > 0) {
        const root = list.find(m => m.type === MAP_TYPES.WORLD && !m.parentMapId) ?? list[0]
        setActiveMapId(root.id)
        setActiveMap(root)
      }
    }, () => setLoading(false))
    return unsub
  }, [projectId]) // eslint-disable-line

  // ── Sync activeMap when maps list changes ──────────────────────────────────
  useEffect(() => {
    if (activeMapId) {
      const found = maps.find(m => m.id === activeMapId)
      if (found) setActiveMap(found)
    }
  }, [maps, activeMapId])

  // ── Create a new map ───────────────────────────────────────────────────────
  const createMap = useCallback(async (data = {}) => {
    const mapId = uuidv4() // generate an ID we can use for Storage path before addDoc
    let resolvedData = { ...data }

    // Handle large image data (background/terrain) before writing to Firestore
    if (resolvedData.backgroundData || resolvedData.terrainData) {
      resolvedData = await resolveBackground(projectId, mapId, resolvedData)
    }

    // Flatten nested point arrays in factionBorders (Firestore rejects nested arrays)
    if (Array.isArray(resolvedData.factionBorders)) {
      resolvedData.factionBorders = resolvedData.factionBorders.map(b => ({
        ...b,
        points: flattenPoints(b.points),
      }))
    }

    const payload = sanitizeForFirestore({
      ...DEFAULT_MAP,
      ...resolvedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    assertFirestoreSafeSize(payload, 'useWorldMap.createMap')

    const docRef = await addDoc(collection(db, 'projects', projectId, 'maps'), payload)
    return docRef.id
  }, [projectId])

  // ── Persist map changes (debounced) ────────────────────────────────────────
  const persistMap = useCallback((mapId, updates) => {
    clearTimeout(saveTimer.current)

    // Optimistic local update (include raw backgroundData for canvas rendering)
    setMaps(prev => prev.map(m => m.id === mapId ? { ...m, ...updates } : m))
    if (activeMapId === mapId) setActiveMap(prev => prev ? { ...prev, ...updates } : prev)

    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      try {
        // Handle large image data (background/terrain)
        let safeUpdates = { ...updates }
        if (safeUpdates.backgroundData || safeUpdates.terrainData) {
          safeUpdates = await resolveBackground(projectId, mapId, safeUpdates)
        }

        // Flatten nested point arrays in any factionBorders updates
        if (Array.isArray(safeUpdates.factionBorders)) {
          safeUpdates.factionBorders = safeUpdates.factionBorders.map(b => ({
            ...b,
            points: flattenPoints(b.points),
          }))
        }

        const payload = sanitizeForFirestore({
          ...safeUpdates,
          updatedAt: serverTimestamp(),
        })
        assertFirestoreSafeSize(payload, `useWorldMap.persistMap(${mapId})`)

        await updateDoc(doc(db, 'projects', projectId, 'maps', mapId), payload)
      } catch (err) {
        const isSize = err.message?.includes('BLOCKED')
        if (isSize) {
          console.error('[useWorldMap] Write blocked — payload too large. See firestorePayloadGuard for details.', err.message)
        } else {
          console.error('[useWorldMap] persist failed:', err.code || err.message, err)
        }
      }
      setSaving(false)
      setLastSaved(Date.now())
    }, 800)
  }, [projectId, activeMapId])

  // ── Switch active map ──────────────────────────────────────────────────────
  const openMap = useCallback((mapId) => {
    const found = maps.find(m => m.id === mapId)
    setActiveMapId(mapId)
    if (found) setActiveMap(found)
  }, [maps])

  // ── Pin CRUD ───────────────────────────────────────────────────────────────
  const addPin = useCallback((mapId, pin) => {
    const map = maps.find(m => m.id === mapId)
    if (!map) return
    const newPin = { id: uuidv4(), ...pin }
    persistMap(mapId, { pins: [...(map.pins || []), newPin] })
    return newPin.id
  }, [maps, persistMap])

  const updatePin = useCallback((mapId, pinId, updates) => {
    const map = maps.find(m => m.id === mapId)
    if (!map) return
    persistMap(mapId, {
      pins: (map.pins || []).map(p => p.id === pinId ? { ...p, ...updates } : p),
    })
  }, [maps, persistMap])

  const deletePin = useCallback((mapId, pinId) => {
    const map = maps.find(m => m.id === mapId)
    if (!map) return
    persistMap(mapId, { pins: (map.pins || []).filter(p => p.id !== pinId) })
  }, [maps, persistMap])

  // ── Path CRUD ──────────────────────────────────────────────────────────────
  const addPath = useCallback((mapId, path) => {
    const map = maps.find(m => m.id === mapId)
    if (!map) return
    persistMap(mapId, { paths: [...(map.paths || []), { id: uuidv4(), ...path }] })
  }, [maps, persistMap])

  const deletePath = useCallback((mapId, pathId) => {
    const map = maps.find(m => m.id === mapId)
    if (!map) return
    persistMap(mapId, { paths: (map.paths || []).filter(p => p.id !== pathId) })
  }, [maps, persistMap])

  // ── Stamp CRUD ─────────────────────────────────────────────────────────────
  const addStamp = useCallback((mapId, stamp) => {
    const map = maps.find(m => m.id === mapId)
    if (!map) return
    persistMap(mapId, { stamps: [...(map.stamps || []), { id: uuidv4(), ...stamp }] })
  }, [maps, persistMap])

  const updateStamp = useCallback((mapId, stampId, updates) => {
    const map = maps.find(m => m.id === mapId)
    if (!map) return
    persistMap(mapId, {
      stamps: (map.stamps || []).map(s => s.id === stampId ? { ...s, ...updates } : s),
    })
  }, [maps, persistMap])

  const deleteStamp = useCallback((mapId, stampId) => {
    const map = maps.find(m => m.id === mapId)
    if (!map) return
    persistMap(mapId, { stamps: (map.stamps || []).filter(s => s.id !== stampId) })
  }, [maps, persistMap])

  // ── Faction border CRUD ────────────────────────────────────────────────────
  const addFactionBorder = useCallback((mapId, border) => {
    const map = maps.find(m => m.id === mapId)
    if (!map) return
    // Flatten nested [[x,y]] point pairs → [x,y,...] flat array before persisting
    const safeBorder = { id: uuidv4(), ...border, points: flattenPoints(border.points) }
    persistMap(mapId, {
      factionBorders: [...(map.factionBorders || []), safeBorder],
    })
  }, [maps, persistMap])

  const updateFactionBorder = useCallback((mapId, borderId, updates) => {
    const map = maps.find(m => m.id === mapId)
    if (!map) return
    persistMap(mapId, {
      factionBorders: (map.factionBorders || []).map(b => {
        if (b.id !== borderId) return b
        const merged = { ...b, ...updates }
        if (updates.points) merged.points = flattenPoints(updates.points)
        return merged
      }),
    })
  }, [maps, persistMap])

  const deleteFactionBorder = useCallback((mapId, borderId) => {
    const map = maps.find(m => m.id === mapId)
    if (!map) return
    persistMap(mapId, {
      factionBorders: (map.factionBorders || []).filter(b => b.id !== borderId),
    })
  }, [maps, persistMap])

  // ── Label CRUD ─────────────────────────────────────────────────────────────
  const addLabel = useCallback((mapId, label) => {
    const map = maps.find(m => m.id === mapId)
    if (!map) return
    persistMap(mapId, { labels: [...(map.labels || []), { id: uuidv4(), ...label }] })
  }, [maps, persistMap])

  const updateLabel = useCallback((mapId, labelId, updates) => {
    const map = maps.find(m => m.id === mapId)
    if (!map) return
    persistMap(mapId, {
      labels: (map.labels || []).map(l => l.id === labelId ? { ...l, ...updates } : l),
    })
  }, [maps, persistMap])

  const deleteLabel = useCallback((mapId, labelId) => {
    const map = maps.find(m => m.id === mapId)
    if (!map) return
    persistMap(mapId, { labels: (map.labels || []).filter(l => l.id !== labelId) })
  }, [maps, persistMap])

  // ── Child map (drill-down) ─────────────────────────────────────────────────
  const createChildMap = useCallback(async (parentMapId, parentPinId, type, name) => {
    const parentMap = maps.find(m => m.id === parentMapId)
    const style = parentMap?.style ?? 'parchment'
    const childId = await createMap({ name, type, style, parentMapId, parentPinId })
    updatePin(parentMapId, parentPinId, { childMapId: childId, hasChildMap: true })
    return childId
  }, [maps, createMap, updatePin])

  // ── Delete entire map ──────────────────────────────────────────────────────
  const deleteMap = useCallback(async (mapId) => {
    await deleteDoc(doc(db, 'projects', projectId, 'maps', mapId))
    if (activeMapId === mapId) {
      const remaining = maps.filter(m => m.id !== mapId)
      if (remaining.length > 0) openMap(remaining[0].id)
    }
  }, [projectId, maps, activeMapId, openMap])

  // ── Breadcrumb trail ───────────────────────────────────────────────────────
  function getBreadcrumbs(mapId) {
    const trail = []
    let current = maps.find(m => m.id === mapId)
    while (current) {
      trail.unshift({ id: current.id, name: current.name, type: current.type })
      current = current.parentMapId ? maps.find(m => m.id === current.parentMapId) : null
    }
    return trail
  }

  return {
    maps,
    activeMapId,
    activeMap,
    loading,
    saving,
    lastSaved,
    createMap,
    openMap,
    persistMap,
    addPin,    updatePin,    deletePin,
    addPath,   deletePath,
    addStamp,  updateStamp,  deleteStamp,
    addFactionBorder, updateFactionBorder, deleteFactionBorder,
    addLabel,  updateLabel,  deleteLabel,
    createChildMap,
    deleteMap,
    getBreadcrumbs,
  }
}
