import { useState, useEffect, useCallback } from 'react'
import {
  doc, updateDoc, setDoc, collection, getDocs, increment, onSnapshot,
} from 'firebase/firestore'
import { db } from '../firebase/config'

function getLocalDateStr(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function useWritingGoals(projectId) {
  const [dailyGoal,  setDailyGoalState] = useState(500)
  const [todayWords, setTodayWords]     = useState(0)
  const [streak,     setStreak]         = useState(0)

  const today = getLocalDateStr()

  // Live-read dailyGoal from project document
  useEffect(() => {
    if (!projectId) return
    const unsub = onSnapshot(doc(db, 'projects', projectId), snap => {
      if (snap.exists()) setDailyGoalState(snap.data().dailyGoal ?? 500)
    })
    return unsub
  }, [projectId])

  // Live-read today's word count
  useEffect(() => {
    if (!projectId) return
    const unsub = onSnapshot(
      doc(db, 'projects', projectId, 'writingDays', today),
      snap => setTodayWords(snap.exists() ? (snap.data().wordsWritten ?? 0) : 0)
    )
    return unsub
  }, [projectId, today])

  // Compute streak whenever todayWords changes (catches new writing days)
  useEffect(() => {
    if (!projectId) return
    async function computeStreak() {
      try {
        const snap = await getDocs(collection(db, 'projects', projectId, 'writingDays'))
        const dateSet = new Set(snap.docs.map(d => d.id))

        let count = 0
        const d = new Date()
        for (let i = 0; i < 365; i++) {
          const key = getLocalDateStr(-i)
          // If today has no entry yet, don't break the streak — start checking from yesterday
          if (i === 0 && !dateSet.has(key)) {
            continue
          }
          if (!dateSet.has(key)) break
          count++
        }
        setStreak(count)
      } catch {
        // Ignore permission/network errors
      }
    }
    computeStreak()
  }, [projectId, todayWords])

  const setDailyGoal = useCallback(async (goal) => {
    if (!projectId || !goal || goal <= 0) return
    await updateDoc(doc(db, 'projects', projectId), { dailyGoal: goal })
  }, [projectId])

  // Called by useManuscript after saving a scene — adds positive word deltas to today's count
  const recordWordsDelta = useCallback(async (delta) => {
    if (!projectId || !delta || delta <= 0) return
    await setDoc(
      doc(db, 'projects', projectId, 'writingDays', today),
      { wordsWritten: increment(delta), date: today },
      { merge: true }
    )
  }, [projectId, today])

  return { dailyGoal, todayWords, streak, setDailyGoal, recordWordsDelta }
}
