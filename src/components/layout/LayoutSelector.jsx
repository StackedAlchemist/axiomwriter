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
      className="nav-menu-panel animate-fade-in"
      style={{ top: pos.top, left: pos.left, width: 320 }}
    >
      <div className="nav-menu-panel-inner">
        <p className="nav-menu-section">Write · View Layout</p>
        <div className="flex flex-col gap-0.5">
          {LAYOUTS.map(layout => (
            <button
              key={layout.id}
              onClick={() => { onSelect(layout.id); setOpen(false) }}
              className={`nav-menu-item ${activeLayout === layout.id ? 'is-active' : ''}`}
            >
              <div className="flex-shrink-0 opacity-80" style={{ color: 'currentColor' }}>{layout.thumb}</div>
              <div className="min-w-0 flex-1 text-left">
                <span className="nav-menu-item-label flex items-center gap-1.5">
                  {layout.name}
                  {locked && layout.id !== 'linear' && (
                    <Lock className="w-2.5 h-2.5 text-gold-500/70" title="Writer plan and above" />
                  )}
                </span>
                <span className="nav-menu-item-desc">{layout.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => open ? setOpen(false) : openDropdown()}
        className={`nav-menu-trigger ${open ? 'is-active' : ''}`}
        title="Write — change manuscript layout"
      >
        <LayoutTemplate className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />
        <span className="truncate">{current.name}</span>
        <ChevronDown className={`w-3 h-3 flex-shrink-0 opacity-50 transition-transform duration-200 ${open ? 'rotate-180 opacity-90' : ''}`} />
      </button>
      {dropdown}
    </>
  )
}
