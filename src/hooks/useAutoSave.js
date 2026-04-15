import { useRef, useCallback, useEffect, useState } from 'react'

/**
 * useAutoSave — triggers saveFn on an interval when content is dirty.
 * Also saves on component unmount.
 *
 * @param {Function} saveFn   Async function that persists the data.
 * @param {number}   interval Milliseconds between auto-save checks (default 30s).
 */
export function useAutoSave(saveFn, interval = 30_000) {
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved' | 'saving' | 'unsaved' | 'error'
  const isDirty   = useRef(false)
  const saveFnRef = useRef(saveFn)

  // Keep ref current so the interval always calls the latest version
  useEffect(() => { saveFnRef.current = saveFn }, [saveFn])

  const markUnsaved = useCallback(() => {
    isDirty.current = true
    setSaveStatus('unsaved')
  }, [])

  const doSave = useCallback(async () => {
    if (!isDirty.current) return
    setSaveStatus('saving')
    try {
      await saveFnRef.current()
      isDirty.current = false
      setSaveStatus('saved')
    } catch (err) {
      console.error('[AutoSave] error:', err)
      setSaveStatus('error')
    }
  }, [])

  // Interval-based saves
  useEffect(() => {
    const id = setInterval(doSave, interval)
    return () => clearInterval(id)
  }, [doSave, interval])

  // Save on unmount
  useEffect(() => {
    return () => {
      if (isDirty.current) {
        saveFnRef.current().catch(console.error)
      }
    }
  }, [])

  return { saveStatus, markUnsaved, saveNow: doSave }
}
