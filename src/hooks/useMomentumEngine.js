/**
 * React hook that wraps the momentum engine.
 * - Exposes `triggerAnalysis(structure, characters)`
 * - Debounces calls: runs at most once every 2 minutes
 * - Stores latest spikes and results in state
 * - On spike detection, fetches Claude suggestions (non-blocking)
 */
import { useRef, useState, useCallback } from 'react'
import { runMomentumAnalysis } from '../lib/momentumEngine'
import { generateMomentumSuggestion } from '../lib/claudeApi'

const DEBOUNCE_MS = 2 * 60 * 1000 // 2 minutes

export function useMomentumEngine(projectId) {
  const lastRunRef  = useRef(0)
  const runningRef  = useRef(false)
  const [isRunning, setIsRunning] = useState(false)
  const [spikeSuggestions, setSpikeSuggestions] = useState([]) // Queued for PauseDetectionBar
  const [lastResults,      setLastResults]      = useState([]) // All char scores

  const triggerAnalysis = useCallback(async (structure, characters) => {
    if (!projectId || !structure || !characters?.length) return
    if (runningRef.current) return

    const now = Date.now()
    if (now - lastRunRef.current < DEBOUNCE_MS) return

    runningRef.current = true
    lastRunRef.current = now
    setIsRunning(true)

    try {
      const { spikes, results } = await runMomentumAnalysis(projectId, structure, characters)
      setLastResults(results || [])

      if (spikes?.length) {
        // Generate Claude suggestions for up to 3 spikes (non-blocking, best-effort)
        const newSuggestions = []
        for (const spike of spikes.slice(0, 3)) {
          const text = await generateMomentumSuggestion(
            spike.character,
            spike.score,
            spike.previousScore,
            spike.appearsInCount ?? 0,
          ).catch(() => null)

          newSuggestions.push({
            characterId: spike.characterId,
            character:   spike.character,
            score:       spike.score,
            text: text
              ?? `⚡ ${spike.character.name} has been appearing frequently — they may be writing themselves into a larger role`,
          })
        }

        setSpikeSuggestions(prev => {
          // Don't re-queue already queued characters
          const existing = new Set(prev.map(s => s.characterId))
          const fresh = newSuggestions.filter(s => !existing.has(s.characterId))
          return [...prev, ...fresh]
        })
      }
    } catch (err) {
      console.warn('[useMomentumEngine]', err.message)
    } finally {
      runningRef.current = false
      setIsRunning(false)
    }
  }, [projectId])

  /** Call after a spike suggestion is handled (yes/later/never) */
  const dismissSuggestion = useCallback((characterId) => {
    setSpikeSuggestions(prev => prev.filter(s => s.characterId !== characterId))
  }, [])

  return { triggerAnalysis, isRunning, spikeSuggestions, dismissSuggestion, lastResults }
}
