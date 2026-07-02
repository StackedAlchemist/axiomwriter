import React, { useState } from 'react'
import { Stage, Layer, Group } from 'react-konva'
import {
  MousePointer2, PenLine, Waves, Route, Paintbrush, Stamp as StampIcon,
  MapPin, Pentagon, Type, Eraser, ChevronRight, ChevronLeft,
  Minus, Plus, Undo2, Redo2, X,
} from 'lucide-react'
import { TOOL_TYPES, STAMP_TYPES, TERRAIN_BRUSHES } from '../../hooks/useWorldMap'
import { STAMP_CATEGORIES, StampShape, stampLabel } from './stampLibrary'

const FACTION_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f59e0b', '#10b981', '#6366f1', '#14b8a6',
]

// ── Tiny Konva stage rendering a stamp's vector art as a palette preview ──────
function StampPreview({ type, mapStyle }) {
  return (
    <Stage width={44} height={44} listening={false}>
      <Layer listening={false}>
        <Group x={22} y={24} scaleX={0.8} scaleY={0.8}>
          <StampShape type={type} mapStyle={mapStyle || 'parchment'} />
        </Group>
      </Layer>
    </Stage>
  )
}

// ── Flyout shells ─────────────────────────────────────────────────────────────
function Flyout({ title, onClose, children, width = 'w-64' }) {
  return (
    <div className={`absolute left-full top-10 ml-1 z-50 bg-axiom-surface border border-axiom-border rounded-xl shadow-card ${width} animate-fade-in`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-axiom-border">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <button onClick={onClose} className="p-1 text-slate-600 hover:text-slate-300 transition-colors">
          <X className="w-3 h-3" />
        </button>
      </div>
      {children}
    </div>
  )
}

export default function MapToolbar({
  activeTool, onToolChange,
  activeColor, onColorChange,
  strokeWidth, onStrokeWidthChange,
  terrainBrush, onTerrainBrushChange,
  brushSize, onBrushSizeChange,
  onUndo, onRedo, canUndo, canRedo,
  mapStyle,
}) {
  const [collapsed,  setCollapsed]  = useState(false)
  const [showColors, setShowColors] = useState(false)
  const [flyout,     setFlyout]     = useState(null) // 'terrain' | 'stamps' | null

  const isStampTool   = STAMP_TYPES.includes(activeTool)
  const isTerrainTool = activeTool === TOOL_TYPES.TERRAIN

  function toggleFlyout(name, tool) {
    if (tool) onToolChange(tool)
    setFlyout(prev => (prev === name ? null : name))
    setShowColors(false)
  }

  function pickTool(tool) {
    onToolChange(tool)
    setFlyout(null)
    setShowColors(false)
  }

  const toolBtn = (active) => `
    group relative flex items-center justify-center rounded-lg transition-all
    ${collapsed ? 'w-7 h-7' : 'w-9 h-9'}
    ${active
      ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40'
      : 'text-slate-500 hover:text-slate-300 hover:bg-axiom-surface2 border border-transparent'}
  `

  function Tooltip({ label }) {
    if (collapsed) return null
    return (
      <span className="absolute left-full ml-2 px-2 py-1 bg-axiom-surface border border-axiom-border rounded text-[10px] text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
        {label}
      </span>
    )
  }

  return (
    <div className={`
      relative flex-shrink-0 bg-axiom-surface border-r border-axiom-border
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

      {/* Undo / Redo */}
      <div className="w-full py-1 flex flex-col items-center gap-0.5 border-b border-axiom-border">
        <button title="Undo (Ctrl+Z)" onClick={onUndo} disabled={!canUndo} className={`${toolBtn(false)} disabled:opacity-30 disabled:pointer-events-none`}>
          <Undo2 className="w-4 h-4" />
          <Tooltip label="Undo (Ctrl+Z)" />
        </button>
        <button title="Redo (Ctrl+Y)" onClick={onRedo} disabled={!canRedo} className={`${toolBtn(false)} disabled:opacity-30 disabled:pointer-events-none`}>
          <Redo2 className="w-4 h-4" />
          <Tooltip label="Redo (Ctrl+Y)" />
        </button>
      </div>

      {/* Tools */}
      <div className="flex-1 overflow-y-auto py-1 w-full flex flex-col items-center gap-0.5">

        <button title="Select / Pan" onClick={() => pickTool(TOOL_TYPES.SELECT)} className={toolBtn(activeTool === TOOL_TYPES.SELECT)}>
          <MousePointer2 className="w-4 h-4" />
          <Tooltip label="Select / Pan" />
        </button>

        <div className="w-7 h-px bg-axiom-border my-1" />

        {/* Terrain paint */}
        <button
          title="Paint Terrain"
          onClick={() => toggleFlyout('terrain', TOOL_TYPES.TERRAIN)}
          className={toolBtn(isTerrainTool)}
          style={isTerrainTool && terrainBrush?.color ? { boxShadow: `inset 0 -3px 0 ${terrainBrush.color}` } : undefined}
        >
          <Paintbrush className="w-4 h-4" />
          <Tooltip label={`Paint Terrain${terrainBrush ? ` — ${terrainBrush.label}` : ''}`} />
        </button>

        {/* Stamp library */}
        <button
          title="Stamp Library"
          onClick={() => toggleFlyout('stamps')}
          className={toolBtn(isStampTool)}
        >
          <StampIcon className="w-4 h-4" />
          <Tooltip label={isStampTool ? `Stamp — ${stampLabel(activeTool)}` : 'Stamp Library'} />
        </button>

        <div className="w-7 h-px bg-axiom-border my-1" />

        <button title="Coastline / Pen" onClick={() => pickTool(TOOL_TYPES.PEN)} className={toolBtn(activeTool === TOOL_TYPES.PEN)}>
          <PenLine className="w-4 h-4" />
          <Tooltip label="Coastline / Pen" />
        </button>
        <button title="River" onClick={() => pickTool(TOOL_TYPES.RIVER)} className={toolBtn(activeTool === TOOL_TYPES.RIVER)}>
          <Waves className="w-4 h-4" />
          <Tooltip label="River" />
        </button>
        <button title="Road / Path" onClick={() => pickTool(TOOL_TYPES.ROAD)} className={toolBtn(activeTool === TOOL_TYPES.ROAD)}>
          <Route className="w-4 h-4" />
          <Tooltip label="Road / Path" />
        </button>

        <div className="w-7 h-px bg-axiom-border my-1" />

        <button title="Location Pin" onClick={() => pickTool(TOOL_TYPES.PIN)} className={toolBtn(activeTool === TOOL_TYPES.PIN)}>
          <MapPin className="w-4 h-4" />
          <Tooltip label="Location Pin" />
        </button>
        <button title="Faction Border" onClick={() => pickTool(TOOL_TYPES.FACTION)} className={toolBtn(activeTool === TOOL_TYPES.FACTION)}>
          <Pentagon className="w-4 h-4" />
          <Tooltip label="Faction Border" />
        </button>
        <button title="Text Label" onClick={() => pickTool(TOOL_TYPES.LABEL)} className={toolBtn(activeTool === TOOL_TYPES.LABEL)}>
          <Type className="w-4 h-4" />
          <Tooltip label="Text Label" />
        </button>

        <div className="w-7 h-px bg-axiom-border my-1" />

        <button title="Eraser" onClick={() => pickTool(TOOL_TYPES.ERASER)} className={toolBtn(activeTool === TOOL_TYPES.ERASER)}>
          <Eraser className="w-4 h-4" />
          <Tooltip label="Eraser" />
        </button>
      </div>

      {/* Color / stroke width (for pen, faction, label tools) */}
      {!collapsed && (
        <div className="w-full p-1.5 border-t border-axiom-border flex flex-col gap-1.5">
          <div className="relative">
            <button
              onClick={() => { setShowColors(p => !p); setFlyout(null) }}
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

      {/* ── Terrain brush flyout ─────────────────────────────────────────── */}
      {flyout === 'terrain' && (
        <Flyout title="Terrain Brushes" onClose={() => setFlyout(null)} width="w-56">
          <div className="p-3 space-y-3">
            <div className="grid grid-cols-3 gap-1.5">
              {TERRAIN_BRUSHES.map(brush => {
                const active = terrainBrush?.id === brush.id
                return (
                  <button
                    key={brush.id}
                    onClick={() => { onTerrainBrushChange(brush); onToolChange(TOOL_TYPES.TERRAIN) }}
                    title={brush.label}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all ${
                      active ? 'border-gold-500/50 bg-gold-500/10' : 'border-axiom-border hover:border-axiom-border-light'
                    }`}
                  >
                    {brush.color ? (
                      <span className="w-9 h-6 rounded-md border border-black/20" style={{ backgroundColor: brush.color }} />
                    ) : (
                      <span className="w-9 h-6 rounded-md border border-dashed border-slate-500 flex items-center justify-center">
                        <Eraser className="w-3 h-3 text-slate-500" />
                      </span>
                    )}
                    <span className={`text-[9px] leading-tight text-center ${active ? 'text-gold-400' : 'text-slate-500'}`}>
                      {brush.label}
                    </span>
                  </button>
                )
              })}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-500">Brush size</span>
                <span className="text-[10px] text-slate-400">{brushSize}px</span>
              </div>
              <input
                type="range"
                min={10}
                max={140}
                step={5}
                value={brushSize}
                onChange={e => onBrushSizeChange(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            <p className="text-[10px] text-slate-600 leading-relaxed">
              Paint directly on the map. Terrain sits under stamps, pins, and labels.
            </p>
          </div>
        </Flyout>
      )}

      {/* ── Stamp library flyout ─────────────────────────────────────────── */}
      {flyout === 'stamps' && (
        <Flyout title="Stamp Library" onClose={() => setFlyout(null)} width="w-72">
          <div className="p-3 space-y-3 max-h-[60vh] overflow-y-auto">
            {STAMP_CATEGORIES.map(cat => (
              <div key={cat.id}>
                <p className="text-[9px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">{cat.label}</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {cat.stamps.map(stamp => {
                    const active = activeTool === stamp.id
                    return (
                      <button
                        key={stamp.id}
                        onClick={() => pickTool(stamp.id)}
                        title={stamp.label}
                        className={`flex flex-col items-center gap-0.5 p-1 rounded-lg border transition-all ${
                          active ? 'border-gold-500/50 bg-gold-500/10' : 'border-axiom-border hover:border-axiom-border-light hover:bg-axiom-surface2'
                        }`}
                      >
                        <StampPreview type={stamp.id} mapStyle={mapStyle} />
                        <span className={`text-[8px] leading-tight text-center truncate w-full ${active ? 'text-gold-400' : 'text-slate-500'}`}>
                          {stamp.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Pick a stamp, then click the map to place it. Select a placed stamp to resize, rotate, or flip it.
            </p>
          </div>
        </Flyout>
      )}
    </div>
  )
}
