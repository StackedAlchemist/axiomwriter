import { useEffect, useRef, useState } from 'react'

const PAUSE_THRESHOLD_MS = 90_000  // 90 seconds

/**
 * Tracks typing activity. Returns:
 *   markActivity() — call on every editor keystroke
 *   isPaused       — true when no activity for 90 seconds
 */
export function usePauseDetection() {
  const lastActivityRef = useRef(Date.now())
  const [isPaused, setIsPaused] = useState(false)

  const markActivity = () => {
    lastActivityRef.current = Date.now()
    setIsPaused(false)
  }

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current
      setIsPaused(elapsed >= PAUSE_THRESHOLD_MS)
    }, 10_000) // check every 10s

    return () => clearInterval(id)
  }, [])

  return { markActivity, isPaused }
}
