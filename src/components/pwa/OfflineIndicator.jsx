import React, { useState, useEffect, useRef } from 'react'
import { WifiOff, Wifi, Check, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function OfflineIndicator() {
  const { firestoreAvailable } = useAuth()
  const [online,      setOnline]      = useState(navigator.onLine)
  const [justSynced,  setJustSynced]  = useState(false)
  const syncTimer = useRef(null)

  useEffect(() => {
    function handleOnline() {
      setOnline(true)
      // Show "Synced" confirmation briefly after reconnecting
      setJustSynced(true)
      clearTimeout(syncTimer.current)
      syncTimer.current = setTimeout(() => setJustSynced(false), 3500)

      // Register background sync if available
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready
          .then(reg => reg.sync.register('axiom-sync'))
          .catch(() => {})
      }
    }

    function handleOffline() {
      setOnline(false)
      setJustSynced(false)
    }

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for sync-restored message from service worker
    function handleSWMessage(event) {
      if (event.data?.type === 'SYNC_RESTORED') {
        setJustSynced(true)
        clearTimeout(syncTimer.current)
        syncTimer.current = setTimeout(() => setJustSynced(false), 3500)
      }
    }
    navigator.serviceWorker?.addEventListener('message', handleSWMessage)

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage)
      clearTimeout(syncTimer.current)
    }
  }, [])

  // Firestore unreachable (after 3 retries)
  if (online && firestoreAvailable === false) {
    return (
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-axiom-surface/90 border border-red-500/30 rounded-full backdrop-blur-sm shadow-lg">
          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-medium text-red-300">Data sync unavailable — try refreshing</span>
        </div>
      </div>
    )
  }

  // Online and no sync message = nothing to show
  if (online && !justSynced) return null

  if (justSynced) {
    return (
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-900/80 border border-teal-500/30 rounded-full backdrop-blur-sm shadow-lg">
          <Check className="w-3.5 h-3.5 text-teal-400" />
          <span className="text-xs font-medium text-teal-300">Synced</span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-axiom-surface/90 border border-axiom-border rounded-full backdrop-blur-sm shadow-lg">
        <WifiOff className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-medium text-amber-300">Offline — changes will sync when connected</span>
      </div>
    </div>
  )
}
