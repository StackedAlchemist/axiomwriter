import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { LayoutTemplate, ChevronDown, Lock } from 'lucide-react'

export const LAYOUTS = [
  {
    id: 'linear',
    name: 'Linear',
    description: 'The classic writing view — your chapter & scene list beside the editor.',
    thumb: (
      <svg viewBox="0 0 44 30" className="w-11 h-[30px]">
        <rect x="0"  y="0" width="13" height="30" rx="2" fill="currentColor" opacity="0.35"/>
        <rect x="15" y="0" width="29" height="30" rx="2" fill="currentColor" opacity="0.18"/>
        <rect x="18" y="5"  width="20" height="2" rx="1" fill="currentColor" opacity="0.55"/>
        <rect x="18" y="9"  width="14" height="2" rx="1" fill="currentColor" opacity="0.4"/>
        <rect x="18" y="13" width="18" height="2" rx="1" fill="currentColor" opacity="0.4"/>
        <rect x="18" y="17" width="12" height="2" rx="1" fill="currentColor" opacity="0.3"/>
      </svg>
    ),
  },
  {
    id: 'grid',
    name: 'Scene Grid',
    description: 'A table of every scene — see which characters appear where at a glance.',
    thumb: (
      <svg viewBox="0 0 44 30" className="w-11 h-[30px]">
        <rect x="0"  y="0" width="44" height="7" rx="1" fill="currentColor" opacity="0.3"/>
        <rect x="0"  y="9" width="44" height="5" rx="1" fill="currentColor" opacity="0.18"/>
        <rect x="0"  y="16" width="44" height="5" rx="1" fill="currentColor" opacity="0.18"/>
        <rect x="0"  y="23" width="44" height="5" rx="1" fill="currentColor" opacity="0.18"/>
        <rect x="11" y="9"  width="7" height="5" rx="1" fill="currentColor" opacity="0.55"/>
        <rect x="23" y="16" width="7" height="5" rx="1" fill="currentColor" opacity="0.55"/>
        <rect x="34" y="9"  width="7" height="5" rx="1" fill="currentColor" opacity="0.4"/>
        <rect x="11" y="23" width="7" height="5" rx="1" fill="currentColor" opacity="0.3"/>
      </svg>
    ),
  },
  {
    id: 'threads',
    name: 'Threads',
    description: 'Follow each plot thread across chapters and spot the ones you dropped.',
    thumb: (
      <svg viewBox="0 0 44 30" className="w-11 h-[30px]">
        <rect x="0"  y="0" width="9" height="30" rx="1" fill="currentColor" opacity="0.3"/>
        <rect x="11" y="0"  width="10" height="9"  rx="1" fill="currentColor" opacity="0.45"/>
        <rect x="11" y="11" width="10" height="9"  rx="1" fill="currentColor" opacity="0.25"/>
        <rect x="23" y="0"  width="10" height="9"  rx="1" fill="currentColor" opacity="0.25"/>
        <rect x="23" y="11" width="10" height="9"  rx="1" fill="currentColor" opacity="0.45"/>
        <rect x="35" y="0"  width="9"  height="9"  rx="1" fill="currentColor" opacity="0.2"/>
        <rect x="35" y="11" width="9"  height="9"  rx="1" fill="currentColor" opacity="0.4"/>
      </svg>
    ),
  },
  {
    id: 'corkboard',
    name: 'Corkboard',
    description: 'Every scene as an index card — rearrange and see your story\'s shape.',
    thumb: (
      <svg viewBox="0 0 44 30" className="w-11 h-[30px]">
        <rect x="0"  y="0"  width="13" height="12" rx="2" fill="currentColor" opacity="0.45"/>
        <rect x="16" y="0"  width="13" height="12" rx="2" fill="currentColor" opacity="0.3"/>
        <rect x="32" y="0"  width="12" height="12" rx="2" fill="currentColor" opacity="0.4"/>
        <rect x="0"  y="16" width="13" height="12" rx="2" fill="currentColor" opacity="0.3"/>
        <rect x="16" y="16" width="13" height="12" rx="2" fill="currentColor" opacity="0.45"/>
        <rect x="32" y="16" width="12" height="12" rx="2" fill="currentColor" opacity="0.2"/>
      </svg>
    ),
  },
  {
    id: 'timeline',
    name: 'Timeline',
    description: 'Where each character is over the course of the story — catch timeline gaps.',
    thumb: (
      <svg viewBox="0 0 44 30" className="w-11 h-[30px]">
        <rect x="0"  y="0"  width="44" height="5" rx="1" fill="currentColor" opacity="0.3"/>
        <rect x="0"  y="7"  width="9"  height="5" rx="1" fill="currentColor" opacity="0.55"/>
        <rect x="11" y="7"  width="5"  height="5" rx="1" fill="currentColor" opacity="0.3"/>
        <rect x="18" y="7"  width="13" height="5" rx="1" fill="currentColor" opacity="0.5"/>
        <rect x="0"  y="15" width="6"  height="5" rx="1" fill="currentColor" opacity="0.3"/>
        <rect x="8"  y="15" width="15" height="5" rx="1" fill="currentColor" opacity="0.55"/>
        <rect x="25" y="15" width="7"  height="5" rx="1" fill="currentColor" opacity="0.3"/>
        <rect x="0"  y="23" width="19" height="5" rx="1" fill="currentColor" opacity="0.45"/>
        <rect x="21" y="23" width="9"  height="5" rx="1" fill="currentColor" opacity="0.3"/>
      </svg>
    ),
  },
]

export default function LayoutSelector({ activeLayout, onSelect, locked = false }) {
  const [open, setOpen] = useState(false)
  const [pos,  setPos]  = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)

  const current = LAYOUTS.find(l => l.id === activeLayout) ?? LAYOUTS[0]

  const openDropdown = useCallback(() => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left })
    }
    setOpen(true)
  }, [])

  useEffect(() => {
    function onClickOut(e) {
      if (!e.target.closest('[data-layout-dropdown]') && !btnRef.current?.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClickOut)
    return () => document.removeEventListener('mousedown', onClickOut)
  }, [open])

  const dropdown = open && createPortal(
    <div
      data-layout-dropdown
      className="fixed z-[9999] bg-axiom-surface border border-axiom-border rounded-xl shadow-card p-2 w-[320px] animate-fade-in"
      style={{ top: pos.top, left: pos.left }}
    >
      <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-2 pb-2">View Layout</p>
      <div className="flex flex-col gap-1">
        {LAYOUTS.map(layout => (
          <button
            key={layout.id}
            onClick={() => { onSelect(layout.id); setOpen(false) }}
            className={`
              flex items-center gap-3 p-2 rounded-lg transition-all text-left
              ${activeLayout === layout.id
                ? 'bg-gold-500/15 border border-gold-500/30 text-gold-400'
                : 'hover:bg-axiom-surface2 border border-transparent text-slate-500 hover:text-slate-300'
              }
            `}
          >
            <div className="flex-shrink-0">{layout.thumb}</div>
            <div className="min-w-0">
              <span className="flex items-center gap-1.5 text-xs font-semibold leading-tight">
                {layout.name}
                {locked && layout.id !== 'linear' && (
                  <Lock className="w-2.5 h-2.5 text-gold-500/70" title="Writer plan and above" />
                )}
              </span>
              <span className={`block text-[10px] leading-snug mt-0.5 ${activeLayout === layout.id ? 'text-gold-400/70' : 'text-slate-600'}`}>
                {layout.description}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>,
    document.body
  )

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => open ? setOpen(false) : openDropdown()}
        className={`btn-ghost text-xs flex items-center gap-1.5 ${open ? 'text-gold-400' : ''}`}
        title="Change layout"
      >
        <LayoutTemplate className="w-3.5 h-3.5" />
        {current.name}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {dropdown}
    </>
  )
}
