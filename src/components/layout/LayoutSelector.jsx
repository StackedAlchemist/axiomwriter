import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { LayoutTemplate, ChevronDown } from 'lucide-react'

export const LAYOUTS = [
  {
    id: 'linear',
    name: 'Linear',
    description: 'Sidebar + editor',
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
    description: 'Characters × scenes',
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
    description: 'Plot threads × chapters',
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
    description: 'Scene cards overview',
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
    description: 'Characters × time',
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

export default function LayoutSelector({ activeLayout, onSelect }) {
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
      <div className="grid grid-cols-5 gap-1">
        {LAYOUTS.map(layout => (
          <button
            key={layout.id}
            onClick={() => { onSelect(layout.id); setOpen(false) }}
            className={`
              flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all
              ${activeLayout === layout.id
                ? 'bg-gold-500/15 border border-gold-500/30 text-gold-400'
                : 'hover:bg-axiom-surface2 border border-transparent text-slate-500 hover:text-slate-300'
              }
            `}
            title={layout.description}
          >
            {layout.thumb}
            <span className="text-[9px] font-medium leading-none whitespace-nowrap">{layout.name}</span>
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
