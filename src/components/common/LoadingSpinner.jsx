import React from 'react'
import { Feather } from 'lucide-react'

export default function LoadingSpinner({ fullscreen = false, size = 'md', message = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className={`${sizes[size]} rounded-full border-2 border-axiom-border-light border-t-gold-500 animate-spin`} />
        {size === 'lg' && (
          <Feather className="absolute inset-0 m-auto w-3.5 h-3.5 text-gold-500 animate-pulse-soft" />
        )}
      </div>
      {message && <p className="text-slate-500 text-sm">{message}</p>}
    </div>
  )

  if (fullscreen) {
    return (
      <div className="min-h-screen bg-axiom-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="relative w-12 h-12">
            <div className="w-12 h-12 rounded-full border-2 border-axiom-border-light border-t-gold-500 animate-spin" />
            <Feather className="absolute inset-0 m-auto w-5 h-5 text-gold-500" />
          </div>
          <p className="text-slate-600 text-sm tracking-wide">Loading Axiom…</p>
        </div>
      </div>
    )
  }

  return spinner
}
