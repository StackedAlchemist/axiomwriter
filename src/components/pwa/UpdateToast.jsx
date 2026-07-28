import React, { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

/**
 * Shows a "new version available" toast when the active service worker
 * changes underneath an already-open tab (sw.js calls skipWaiting() +
 * clients.claim() on every deploy, so the new worker takes over silently —
 * without this, the tab keeps running the old JS bundle until the user
 * happens to reload on their own).
 */
export default function UpdateToast() {
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let hadController = !!navigator.serviceWorker.controller

    function handleControllerChange() {
      if (hadController) setAvailable(true)
      hadController = true
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
    return () => navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
  }, [])

  if (!available) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2.5 px-4 py-2.5 bg-axiom-surface/95 border border-gold-500/30 rounded-full backdrop-blur-sm shadow-lg hover:border-gold-500/50 transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5 text-gold-400" />
        <span className="text-xs font-medium text-slate-200">New version available — tap to refresh</span>
      </button>
    </div>
  )
}
