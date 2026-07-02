import { useRef, useState, useEffect, useCallback } from 'react'

/**
 * Terrain paint engine for the map builder.
 *
 * Maintains an offscreen canvas in world coordinates (map width × height)
 * that terrain brushes paint onto. The canvas element itself is handed to a
 * Konva Image node for rendering, so paints are visible immediately via
 * batchDraw without React re-renders.
 *
 * Undo/redo is per-stroke: a PNG snapshot is captured at stroke start and
 * pushed when the stroke commits. Snapshots are compressed data URLs, capped
 * to keep memory bounded.
 */

const MAX_UNDO = 12

export function useTerrainPainter(map) {
  const canvasRef  = useRef(null)
  const ctxRef     = useRef(null)
  const lastPoint  = useRef(null)
  const preStroke  = useRef(null)
  const undoStack  = useRef([])
  const redoStack  = useRef([])
  const loadedMap  = useRef(null)   // map.id the canvas was initialized for
  const loadingRef = useRef(false)  // true while terrain image is decoding
  const [version, setVersion] = useState(0) // bumps so UI (undo buttons) refreshes

  const mapId = map?.id
  const mapW  = map?.width  || 1600
  const mapH  = map?.height || 900
  const terrainSrc = map?.terrainUrl || map?.terrainData || null

  // ── (Re)initialize canvas when the active map changes ──────────────────────
  useEffect(() => {
    if (!mapId) return
    if (loadedMap.current === mapId && canvasRef.current) return // already loaded — don't clobber local paints

    const canvas  = document.createElement('canvas')
    canvas.width  = mapW
    canvas.height = mapH
    canvasRef.current = canvas
    ctxRef.current    = canvas.getContext('2d')
    undoStack.current = []
    redoStack.current = []
    lastPoint.current = null
    loadedMap.current = mapId

    if (terrainSrc) {
      loadingRef.current = true
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        // Canvas may have been swapped if the user changed maps mid-load
        if (loadedMap.current !== mapId) return
        ctxRef.current.drawImage(img, 0, 0, mapW, mapH)
        loadingRef.current = false
        setVersion(v => v + 1)
      }
      img.onerror = () => { loadingRef.current = false }
      img.src = terrainSrc
    }

    setVersion(v => v + 1)
  }, [mapId, mapW, mapH]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Brush stamp: soft-edged radial dab ──────────────────────────────────────
  const dab = useCallback((x, y, color, size, erase) => {
    const ctx = ctxRef.current
    if (!ctx) return
    ctx.save()
    ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over'
    const grad = ctx.createRadialGradient(x, y, 0, x, y, size)
    const core = erase ? 'rgba(0,0,0,1)' : color
    grad.addColorStop(0,    core)
    grad.addColorStop(0.6,  core)
    grad.addColorStop(1,    erase ? 'rgba(0,0,0,0)' : hexToTransparent(color))
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }, [])

  // ── Stroke lifecycle ─────────────────────────────────────────────────────────
  const strokeStart = useCallback(() => {
    if (!canvasRef.current || loadingRef.current) return
    preStroke.current = canvasRef.current.toDataURL('image/png')
    lastPoint.current = null
  }, [])

  const paint = useCallback((x, y, brush, size) => {
    if (!ctxRef.current || loadingRef.current || !brush) return
    const erase = brush.id === 'erase'
    const color = brush.color || '#000000'

    const last = lastPoint.current
    if (last) {
      // Interpolate dabs between last point and this one for a continuous stroke
      const dist    = Math.hypot(x - last.x, y - last.y)
      const spacing = Math.max(size / 3, 2)
      const steps   = Math.floor(dist / spacing)
      for (let i = 1; i <= steps; i++) {
        const t = i / (steps + 1)
        dab(last.x + (x - last.x) * t, last.y + (y - last.y) * t, color, size, erase)
      }
    }
    dab(x, y, color, size, erase)
    lastPoint.current = { x, y }
  }, [dab])

  /** Commits the stroke. Returns the terrain PNG data URL to persist, or null. */
  const strokeEnd = useCallback(() => {
    if (!canvasRef.current || !lastPoint.current) return null
    lastPoint.current = null
    if (preStroke.current != null) {
      undoStack.current.push(preStroke.current)
      if (undoStack.current.length > MAX_UNDO) undoStack.current.shift()
      redoStack.current = []
      preStroke.current = null
    }
    setVersion(v => v + 1)
    return canvasRef.current.toDataURL('image/png')
  }, [])

  // ── Undo / redo ──────────────────────────────────────────────────────────────
  const restoreSnapshot = useCallback((dataUrl) => {
    const ctx = ctxRef.current
    if (!ctx) return
    const img = new window.Image()
    img.onload = () => {
      ctx.save()
      ctx.globalCompositeOperation = 'source-over'
      ctx.clearRect(0, 0, mapW, mapH)
      ctx.drawImage(img, 0, 0, mapW, mapH)
      ctx.restore()
      setVersion(v => v + 1)
    }
    img.src = dataUrl
  }, [mapW, mapH])

  /** Undoes the last stroke. Returns the data URL to persist, or null. */
  const undo = useCallback(() => {
    if (!undoStack.current.length || !canvasRef.current) return null
    redoStack.current.push(canvasRef.current.toDataURL('image/png'))
    const snapshot = undoStack.current.pop()
    restoreSnapshot(snapshot)
    return snapshot
  }, [restoreSnapshot])

  /** Redoes the last undone stroke. Returns the data URL to persist, or null. */
  const redo = useCallback(() => {
    if (!redoStack.current.length || !canvasRef.current) return null
    undoStack.current.push(canvasRef.current.toDataURL('image/png'))
    const snapshot = redoStack.current.pop()
    restoreSnapshot(snapshot)
    return snapshot
  }, [restoreSnapshot])

  /** Wipes all painted terrain. Returns null (persist terrain fields as null). */
  const clear = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx || !canvasRef.current) return
    undoStack.current.push(canvasRef.current.toDataURL('image/png'))
    if (undoStack.current.length > MAX_UNDO) undoStack.current.shift()
    redoStack.current = []
    ctx.clearRect(0, 0, mapW, mapH)
    setVersion(v => v + 1)
  }, [mapW, mapH])

  const canUndo = undoStack.current.length > 0
  const canRedo = redoStack.current.length > 0

  return {
    canvas: canvasRef.current,
    version,       // changes when the canvas content is externally replaced (load/undo/redo)
    strokeStart, paint, strokeEnd,
    undo, redo, clear,
    canUndo, canRedo,
  }
}

// Converts "#rrggbb" to fully transparent rgba for gradient edges
function hexToTransparent(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},0)`
}
