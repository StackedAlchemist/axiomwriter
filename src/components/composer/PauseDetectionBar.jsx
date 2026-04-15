import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * Non-blocking notification bar shown at bottom of screen after 90s inactivity.
 * Only shown when there are suggestions to surface.
 */
export default function PauseDetectionBar({ isPaused, suggestions, onDismiss }) {
  const [visible, setVisible] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)

  useEffect(() => {
    if (isPaused && suggestions.length > 0) {
      setVisible(true)
      setCurrentIdx(0)
    } else {
      setVisible(false)
    }
  }, [isPaused, suggestions.length])

  if (!visible || suggestions.length === 0) return null

  const suggestion = suggestions[currentIdx]

  function handleAction(action) {
    suggestion.onAction?.(action)
    if (currentIdx + 1 < suggestions.length) {
      setCurrentIdx(i => i + 1)
    } else {
      setVisible(false)
      onDismiss?.()
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center pb-2 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 bg-axiom-surface/95 backdrop-blur border border-axiom-border rounded-full shadow-lg text-sm animate-slide-up">
        <span className="text-slate-400 text-xs">{suggestion.text}</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleAction('yes')}
            className="px-2.5 py-1 bg-gold-500/20 border border-gold-500/30 text-gold-400 text-xs rounded-full hover:bg-gold-500/30 transition-colors"
          >
            {suggestion.yesLabel || 'Yes'}
          </button>
          <button
            onClick={() => handleAction('later')}
            className="px-2.5 py-1 text-slate-600 hover:text-slate-400 text-xs transition-colors"
          >
            {suggestion.laterLabel || 'Later'}
          </button>
          <button
            onClick={() => handleAction('never')}
            className="px-2.5 py-1 text-slate-700 hover:text-slate-500 text-xs transition-colors"
          >
            {suggestion.neverLabel || 'Never'}
          </button>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-slate-700 hover:text-slate-500 transition-colors ml-1"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
