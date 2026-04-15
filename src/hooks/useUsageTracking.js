import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from './useSubscription'

function monthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function useUsageTracking() {
  const { currentUser } = useAuth()
  const { tier } = useSubscription()
  const [usage, setUsage] = useState(0)
  const [loading, setLoading] = useState(true)

  const usageRef = currentUser
    ? doc(db, 'users', currentUser.uid, 'usage', monthKey())
    : null

  // Load current month usage
  useEffect(() => {
    if (!usageRef) { setLoading(false); return }
    getDoc(usageRef).then(snap => {
      setUsage(snap.exists() ? (snap.data().aiCalls ?? 0) : 0)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [currentUser]) // eslint-disable-line

  /** Call before each AI operation. Returns true if allowed, false if over limit */
  const trackAICall = useCallback(async (count = 1) => {
    if (!usageRef) return false

    const limit = tier.aiLimit
    if (limit !== Infinity && usage >= limit) return false

    try {
      await setDoc(usageRef, {
        aiCalls: increment(count),
        updatedAt: serverTimestamp(),
      }, { merge: true })
      setUsage(prev => prev + count)
      return true
    } catch {
      return true // fail open so writers aren't blocked by Firestore errors
    }
  }, [usageRef, tier.aiLimit, usage])

  const remaining = tier.aiLimit === Infinity ? Infinity : Math.max(0, tier.aiLimit - usage)
  const percentUsed = tier.aiLimit === Infinity ? 0 : Math.min(100, (usage / tier.aiLimit) * 100)

  return { usage, remaining, percentUsed, loading, trackAICall, limit: tier.aiLimit }
}
