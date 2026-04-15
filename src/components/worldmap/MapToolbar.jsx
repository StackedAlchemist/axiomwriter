import React, { useState } from 'react'
import {
  MousePointer2, PenLine, Waves, Route, Mountain, Trees, Sun, Leaf,
  MapPin, Pentagon, Type, Eraser, ChevronRight, ChevronLeft, Palette,
  Minus, Plus,
} from 'lucide-react'
import { TOOL_TYPES, STAMP_TYPES } from '../../hooks/useWorldMap'

const TOOLS = [
  { id: TOOL_TYPES.SELECT,   icon: MousePointer2, label: 'Select / Pan',   group: 'nav' },
  { id: 'divider1',          icon: null,          label: '',                group: 'divider' },
  { id: TOOL_TYPES.PEN,      icon: PenLine,       label: 'Coastline / Pen', group: 'draw' },
  { id: TOOL_TYPES.RIVER,    icon: Waves,         label: 'River',           group: 'draw' },
  { id: TOOL_TYPES.ROAD,     icon: Route,         label: 'Road / Path',     group: 'draw' },
  { id: 'divider2',          icon: null,          label: '',                group: 'divider' },
  { id: TOOL_TYPES.MOUNTAIN, icon: Mountain,      label: 'Mountains',       group: 'stamp' },
  { id: TOOL_TYPES.FOREST,   icon: Trees,         label: 'Forest',          group: 'stamp' },
  { id: TOOL_TYPES.DESERT,   icon: Sun,           label: 'Desert',          group: 'stamp' },
  { id: TOOL_TYPES.PLAINS,   icon: Leaf,          label: 'Plains',          group: 'stamp' },
  { id: 'divider3',          icon: null,          label: '',                group: 'divider' },
  { id: TOOL_TYPES.PIN,      icon: MapPin,        label: 'Location Pin',    group: 'place' },
  { id: TOOL_TYPES.FACTION,  icon: Pentagon,      label: 'Faction Border',  group: 'place' },
  { id: TOOL_TYPES.LABEL,    icon: Type,          label: 'Text Label',      group: 'place' },
  { id: 'divider4',          icon: null,          label: '',                group: 'divider' },
  { id: TOOL_TYPES.ERASER,   icon: Eraser,        label: 'Eraser',          group: 'util' },
]

const FACTION_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f59e0b', '#10b981', '#6366f1', '#14b8a6',
]

export default function MapToolbar({ activeTool, onToolChange, activeColor, onColorChange, strokeWidth, onStrokeWidthChange }) {
  const [collapsed, setCollapsed] = useState(false)
  const [showColors, setShowColors] = useState(false)

  return (
    <div className={`
      flex-shrink-0 bg-axiom-surface border-r border-axiom-border
      flex flex-col items-center transition-all duration-200
      ${collapsed ? 'w-10' : 'w-[52px]'}
    `}>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(p => !p)}
        className="w-full h-8 flex items-center justify-center text-slate-600 hover:text-slate-300 border-b border-axiom-border transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Tools */}
      <div className="flex-1 overflow-y-auto py-1 w-full flex flex-col items-center gap-0.5">
        {TOOLS.map((tool, i) => {
          if (tool.group === 'divider') {
            return <div key={i} className="w-7 h-px bg-axiom-border my-1" />
          }
          const Icon    = tool.icon
          const active  = activeTool === tool.id
          const isStamp = STAMP_TYPES.includes(tool.id)

          return (
            <button
              key={tool.id}
              title={tool.label}
              onClick={() => onToolChange(tool.id)}
              className={`
                group relative flex items-center justify-center rounded-lg transition-all
                ${collapsed ? 'w-7 h-7' : 'w-9 h-9'}
                ${active
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-axiom-surface2 border border-transparent'}
              `}
            >
              <Icon className="w-4 h-4" />
              {/* Tooltip */}
              {!collapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-axiom-surface border border-axiom-border rounded text-[10px] text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {tool.label}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Color / stroke width */}
      {!collapsed && (
        <div className="w-full p-1.5 border-t border-axiom-border flex flex-col gap-1.5">

          {/* Active color swatch */}
          <div className="relative">
            <button
              onClick={() => setShowColors(p => !p)}
              title="Stroke / Fill color"
              className="w-8 h-8 rounded-lg border-2 border-axiom-border hover:border-gold-500/40 transition-colors mx-auto block"
              style={{ backgroundColor: activeColor || '#5a3a1a' }}
            />

            {showColors && (
              <div className="absolute bottom-full left-0 mb-1 p-2 bg-axiom-surface border border-axiom-border rounded-xl shadow-card grid grid-cols-4 gap-1 z-50 w-[120px]">
                {FACTION_COLORS.map(col => (
                  <button
                    key={col}
                    onClick={() => { onColorChange(col); setShowColors(false) }}
                    className={`w-6 h-6 rounded-md border-2 transition-all hover:scale-110 ${activeColor === col ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Stroke width */}
          <div className="flex flex-col items-center gap-0.5">
            <button onClick={() => onStrokeWidthChange(Math.max(0.5, (strokeWidth || 1.5) - 0.5))} className="text-slate-600 hover:text-slate-300 transition-colors">
              <Minus className="w-2.5 h-2.5" />
            </button>
            <span className="text-[9px] text-slate-600">{strokeWidth || 1.5}px</span>
            <button onClick={() => onStrokeWidthChange(Math.min(8, (strokeWidth || 1.5) + 0.5))} className="text-slate-600 hover:text-slate-300 transition-colors">
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
