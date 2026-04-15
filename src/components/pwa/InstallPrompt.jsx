import React, { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

const VISIT_KEY   = 'axiom_visit_count'
const DISMISS_KEY = 'axiom_install_dismissed'

export default function InstallPrompt() {
  const [prompt,  setPrompt]  = useState(null)   // deferred install event
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Count visits
    const visits   = parseInt(localStorage.getItem(VISIT_KEY) || '0', 10) + 1
    const dismisses = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10)
    localStorage.setItem(VISIT_KEY, String(visits))

    // Don't show if dismissed twice, or already installed (standalone mode)
    if (dismisses >= 2) return
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (window.navigator.standalone) return // iOS standalone check

    // Listen for Chrome/Android install prompt
    function handleBeforeInstall(e) {
      e.preventDefault()
      setPrompt(e)
      if (visits >= 3) setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // On iOS, beforeinstallprompt never fires — show banner if 3+ visits anyway
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (isIOS && visits >= 3 && dismisses < 2) {
      setVisible(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  function handleInstall() {
    if (prompt) {
      prompt.prompt()
      prompt.userChoice.then(choice => {
        if (choice.outcome === 'accepted') setVisible(false)
        setPrompt(null)
      })
    }
    setVisible(false)
  }

  function handleDismiss() {
    const d = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10) + 1
    localStorage.setItem(DISMISS_KEY, String(d))
    setVisible(false)
  }

  if (!visible) return null

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-[420px] animate-slide-up">
      <div className="bg-axiom-surface border border-gold-500/30 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-gold-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-100">Install Axiom</p>
          {isIOS ? (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Tap <span className="text-gold-400 font-medium">Share</span> then{' '}
              <span className="text-gold-400 font-medium">Add to Home Screen</span> for the best writing experience.
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Add Axiom to your home screen for the best writing experience — works offline too.
            </p>
          )}
          <div className="flex items-center gap-2 mt-2.5">
            {!isIOS && (
              <button
                onClick={handleInstall}
                className="btn-primary text-xs px-3 py-1.5"
              >
                Install
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="btn-ghost text-xs px-3 py-1.5"
            >
              Not now
            </button>
          </div>
        </div>

        {/* Close */}
        <button onClick={handleDismiss} className="btn-icon w-6 h-6 flex-shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
