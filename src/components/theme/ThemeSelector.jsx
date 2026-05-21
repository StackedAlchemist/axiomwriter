/**
 * ThemeSelector
 *
 * A slide-in drawer panel from the right side of the screen.
 * Lists all available writing environment themes as preview cards.
 * Clicking a card applies the theme immediately (persisted to localStorage).
 *
 * Usage:
 *   <ThemeSelector open={showThemeSelector} onClose={() => setShowThemeSelector(false)} />
 */

import React, { useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'
import { useWritingTheme } from '../../contexts/WritingThemeContext'
import ThemePreviewCard from './ThemePreviewCard'

export default function ThemeSelector({ open, onClose }) {
  const { currentTheme, setTheme, availableThemes } = useWritingTheme()

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop — starts below the 48px header so it stays accessible */}
      {open && (
        <div
          className="fixed top-12 inset-x-0 bottom-0 z-[200] bg-black/40 backdrop-blur-[2px] animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel — also starts below the header */}
      <div
        className="fixed top-12 right-0 bottom-0 z-[201] flex flex-col"
        style={{
          width:            '320px',
          background:       'rgba(6,8,18,0.97)',
          backdropFilter:   'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderLeft:       '1px solid rgba(255,255,255,0.07)',
          transform:        open ? 'translateX(0)' : 'translateX(100%)',
          transition:       'transform 0.28s cubic-bezier(0.22,1,0.36,1)',
          boxShadow:        '-8px 0 40px rgba(0,0,0,0.6)',
        }}
        // Prevent backdrop click from firing when clicking inside the drawer
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between flex-shrink-0 px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: `rgba(${currentTheme.accentRgb},0.15)`,
                border:     `1px solid rgba(${currentTheme.accentRgb},0.3)`,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: `rgba(${currentTheme.accentRgb},1)` }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Writing Environment</h2>
              <p className="text-[10px] text-slate-600">Choose your atmosphere</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon w-7 h-7"
            aria-label="Close theme selector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active theme callout */}
        {currentTheme.id !== 'none' && (
          <div
            className="mx-4 mt-4 flex-shrink-0 px-3 py-2.5 rounded-lg"
            style={{
              background: `rgba(${currentTheme.accentRgb},0.08)`,
              border:     `1px solid rgba(${currentTheme.accentRgb},0.2)`,
            }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5"
              style={{ color: `rgba(${currentTheme.accentRgb},0.8)` }}
            >
              Active environment
            </p>
            <p className="text-xs text-slate-300 font-medium">{currentTheme.name}</p>
            <p className="text-[10px] text-slate-600 mt-0.5 italic">{currentTheme.description}</p>
          </div>
        )}

        {/* Theme grid — scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">
            All environments
          </p>
          {availableThemes.map(theme => (
            <ThemePreviewCard
              key={theme.id}
              theme={theme}
              isActive={theme.id === currentTheme.id}
              onClick={() => {
                setTheme(theme.id)
                // Keep drawer open so user can compare — they close manually
              }}
            />
          ))}
        </div>

        {/* Footer hint */}
        <div
          className="px-5 py-3 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="text-[10px] text-slate-700 leading-relaxed">
            Themes appear on the left and right edges of the editor, keeping your writing area clean and focused.
          </p>
        </div>
      </div>
    </>
  )
}
