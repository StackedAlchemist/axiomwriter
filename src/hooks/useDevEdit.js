import { useState, useRef, useCallback, useEffect } from 'react'
import {
  doc, getDoc, setDoc,
  addDoc, collection, query, orderBy, limit, getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { runDevEditScan } from '../lib/devEditEngine'
import { analyzeStructuralIssues } from '../lib/claudeApi'

const DEFAULT_SETTINGS = {
  sensitivity:    'balanced',
  minWords:       5000,
  disabledChecks: [],
}

export function useDevEdit(projectId) {
  const [settings,    setSettingsState] = useState(DEFAULT_SETTINGS)
  const [suggestions, setSuggestions]   = useState([])
  const [scanHistory, setScanHistory]   = useState([])
  const [healthScore, setHealthScore]   = useState(null)
  const [isScanning,  setIsScanning]    = useState(false)
  const [lastScanAt,  setLastScanAt]    = useState(null)

  const saveCountRef   = useRef(0)
  const settingsLoaded = useRef(false)
  const scanningRef    = useRef(false) // stable gate (avoids stale closure issues)

  // ── Load settings + history on mount ───────────────────────────────────────
  useEffect(() => {
    if (!projectId || settingsLoaded.current) return
    settingsLoaded.current = true

    getDoc(doc(db, 'projects', projectId, 'devEdit', 'settings'))
      .then(d => { if (d.exists()) setSettingsState({ ...DEFAULT_SETTINGS, ...d.data() }) })
      .catch(() => {})

    getDocs(query(
      collection(db, 'projects', projectId, 'devEditScans'),
      orderBy('scannedAt', 'desc'),
      limit(10),
    )).then(snap => {
      const history = []
      snap.forEach(d => history.push({ id: d.id, ...d.data() }))
      setScanHistory(history)
      if (history.length > 0 && history[0].healthScore != null) {
        setHealthScore(history[0].healthScore)
        setLastScanAt(history[0].scannedAt?.toDate?.() ?? null)
      }
    }).catch(() => {})
  }, [projectId])

  // ── Save settings to Firestore ──────────────────────────────────────────────
  const saveSettings = useCallback(async (newSettings) => {
    setSettingsState(newSettings)
    await setDoc(
      doc(db, 'projects', projectId, 'devEdit', 'settings'),
      newSettings,
    ).catch(() => {})
  }, [projectId])

  // ── Run a scan ──────────────────────────────────────────────────────────────
  const triggerScan = useCallback(async (structure, currentSettings) => {
    if (scanningRef.current || !projectId || !structure) return
    scanningRef.current = true
    setIsScanning(true)
    setSuggestions([])

    const cfg = currentSettings || settings

    try {
      const result = await runDevEditScan({
        projectId,
        structure,
        settings: cfg,
        analyzeWithClaude: (chapters, sceneContents, checkTypes, sens) =>
          analyzeStructuralIssues(chapters, sceneContents, checkTypes, sens),
      })

      if (result.skipped) {
        scanningRef.current = false
        setIsScanning(false)
        return { skipped: true, reason: result.skipReason }
      }

      setHealthScore(result.healthScore)

      const withIds = result.findings.map((f, i) => ({
        ...f, id: `scan_${Date.now()}_${i}`,
      }))
      setSuggestions(withIds)

      const ref = await addDoc(
        collection(db, 'projects', projectId, 'devEditScans'),
        {
          scannedAt:   serverTimestamp(),
          healthScore: result.healthScore,
          totalWords:  result.totalWords,
          findings:    result.findings,
          sensitivity: cfg.sensitivity,
        },
      ).catch(() => null)

      const entry = {
        id:          ref?.id ?? `local_${Date.now()}`,
        scannedAt:   new Date(),
        healthScore: result.healthScore,
        totalWords:  result.totalWords,
        findings:    result.findings,
        sensitivity: cfg.sensitivity,
      }
      setScanHistory(prev => [entry, ...prev.slice(0, 9)])
      setLastScanAt(new Date())
    } catch (err) {
      console.error('[useDevEdit]', err)
    }

    scanningRef.current = false
    setIsScanning(false)
  }, [projectId, settings])

  // ── Auto-trigger every 3 saves ──────────────────────────────────────────────
  const onSceneSaved = useCallback((structure) => {
    saveCountRef.current += 1
    if (saveCountRef.current % 3 === 0) {
      triggerScan(structure)
    }
  }, [triggerScan])

  // ── Dismissal helpers ───────────────────────────────────────────────────────
  const dismissSuggestion = useCallback((id) => {
    setSuggestions(prev => prev.filter(s => s.id !== id))
  }, [])

  const neverCheckType = useCallback((checkType) => {
    const next = {
      ...settings,
      disabledChecks: [...new Set([...(settings.disabledChecks || []), checkType])],
    }
    saveSettings(next)
    setSuggestions(prev => prev.filter(s => s.type !== checkType))
  }, [settings, saveSettings])

  const enableCheckType = useCallback((checkType) => {
    saveSettings({
      ...settings,
      disabledChecks: (settings.disabledChecks || []).filter(t => t !== checkType),
    })
  }, [settings, saveSettings])

  return {
    suggestions,
    scanHistory,
    healthScore,
    isScanning,
    lastScanAt,
    settings,
    updateSettings:   saveSettings,
    onSceneSaved,
    runManualScan:    triggerScan,
    dismissSuggestion,
    neverCheckType,
    enableCheckType,
  }
}
