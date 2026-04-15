import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Sparkles, Map, Plus, Download, Upload, Layers,
  ChevronRight, Globe, Building2, MapPinned, Loader2, Settings2,
  Trash2, Check, X, ZoomIn, ZoomOut, RotateCcw, Image, Eraser, Construction,
} from 'lucide-react'
import { useWorldMap, MAP_TYPES, MAP_STYLES, TOOL_TYPES } from '../hooks/useWorldMap'
import { useLore } from '../hooks/useLore'
import { useManuscript } from '../hooks/useManuscript'
import { generateProceduralBackground } from '../lib/mapAnalysis'
import MapCanvas       from '../components/worldmap/MapCanvas'
import MapToolbar      from '../components/worldmap/MapToolbar'
import GenerateFromLoreModal  from '../components/worldmap/GenerateFromLoreModal'
import LocationSidePanel      from '../components/worldmap/LocationSidePanel'
import LoadingSpinner          from '../components/common/LoadingSpinner'

// ── Export size presets ───────────────────────────────────────────────────────
const EXPORT_PRESETS = [
  { id: 'ebook',     label: 'Ebook Front Matter',    w: 2560, h: 1440 },
  { id: 'print',     label: 'Print Front Matter',    w: 3300, h: 2550 },
  { id: 'social',    label: 'Social Media',          w: 1200, h: 630  },
  { id: 'wallpaper', label: 'Desktop Wallpaper',     w: 1920, h: 1080 },
  { id: 'current',   label: 'Current Canvas Size',   w: null, h: null },
]

// ── Map type icons ────────────────────────────────────────────────────────────
const MAP_TYPE_ICONS = {
  [MAP_TYPES.WORLD]:  Globe,
  [MAP_TYPES.REGION]: MapPinned,
  [MAP_TYPES.CITY]:   Building2,
}

// ── Context menu ──────────────────────────────────────────────────────────────
function ContextMenu({ x, y, pin, onAddChildMap, onPinScene, onOpenLore, onDelete, onClose }) {
  useEffect(() => {
    function close() { onClose() }
    window.addEventListener('click', close, { once: true })
    return () => window.removeEventListener('click', close)
  }, [onClose])

  return (
    <div
      className="fixed z-50 bg-axiom-surface border border-axiom-border rounded-xl shadow-card py-1 min-w-[180px] text-sm"
      style={{ left: Math.min(x, window.innerWidth - 200), top: Math.min(y, window.innerHeight - 200) }}
      onClick={e => e.stopPropagation()}
    >
      <div className="px-3 py-1.5 border-b border-axiom-border mb-1">
        <p className="text-xs font-semibold text-slate-300 truncate">{pin?.name || 'Location'}</p>
      </div>
      {pin && !pin.hasChildMap && (
        <>
          <button onClick={() => { onAddChildMap(pin, 'region'); onClose() }} className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-axiom-surface2 hover:text-slate-200 transition-colors flex items-center gap-2">
            <MapPinned className="w-3.5 h-3.5" />Create Regional Map
          </button>
          <button onClick={() => { onAddChildMap(pin, 'city'); onClose() }} className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-axiom-surface2 hover:text-slate-200 transition-colors flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5" />Create City Map
          </button>
        </>
      )}
      {pin?.hasChildMap && (
        <button onClick={() => { onAddChildMap(pin, 'open'); onClose() }} className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-axiom-surface2 hover:text-slate-200 transition-colors flex items-center gap-2">
          <Map className="w-3.5 h-3.5" />Open Child Map
        </button>
      )}
      <button onClick={() => { onPinScene(pin); onClose() }} className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-axiom-surface2 hover:text-slate-200 transition-colors flex items-center gap-2">
        <Plus className="w-3.5 h-3.5" />Pin a Scene Here
      </button>
      {pin?.loreEntryId && (
        <button onClick={() => { onOpenLore(pin); onClose() }} className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-axiom-surface2 hover:text-slate-200 transition-colors flex items-center gap-2">
          <Layers className="w-3.5 h-3.5" />Open Lore Entry
        </button>
      )}
      <div className="border-t border-axiom-border mt-1 pt-1">
        <button onClick={() => { onDelete(pin.id); onClose() }} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
          <Trash2 className="w-3.5 h-3.5" />Delete Pin
        </button>
      </div>
    </div>
  )
}

// ── Export modal ──────────────────────────────────────────────────────────────
function ExportModal({ stageRef, mapName, onClose }) {
  const [preset,    setPreset]    = useState('current')
  const [exporting, setExporting] = useState(false)

  async function doExport() {
    if (!stageRef?.current) return
    setExporting(true)
    try {
      const stage   = stageRef.current
      const chosen  = EXPORT_PRESETS.find(p => p.id === preset)
      const w = chosen?.w || stage.width()
      const h = chosen?.h || stage.height()
      const uri = stage.toDataURL({
        pixelRatio: chosen?.w ? chosen.w / stage.width() : 2,
        mimeType: 'image/png',
      })
      const a    = document.createElement('a')
      a.href     = uri
      a.download = `${(mapName || 'world-map').toLowerCase().replace(/\s+/g, '-')}.png`
      a.click()
    } catch (err) {
      console.error('[export]', err)
    }
    setExporting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-axiom-surface border border-axiom-border rounded-2xl shadow-card w-full max-w-sm animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-axiom-border">
          <span className="font-serif font-semibold text-slate-100 text-sm">Export Map</span>
          <button onClick={onClose} className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors"><X className="w-3.5 h-3.5" /></button>
        </div>
        <div className="p-5 space-y-3">
          {EXPORT_PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`w-full p-3 rounded-xl border text-left transition-all ${preset === p.id ? 'border-gold-500/40 bg-gold-500/10' : 'border-axiom-border bg-axiom-surface2 hover:border-axiom-border-light'}`}
            >
              <p className={`text-xs font-semibold ${preset === p.id ? 'text-gold-400' : 'text-slate-300'}`}>{p.label}</p>
              {p.w && <p className="text-[10px] text-slate-600 mt-0.5">{p.w} × {p.h}px</p>}
            </button>
          ))}
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-xs">Cancel</button>
          <button onClick={doExport} disabled={exporting} className="btn-primary text-xs flex items-center gap-1.5">
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export PNG
          </button>
        </div>
      </div>
    </div>
  )
}

// ── New map modal ──────────────────────────────────────────────────────────────
function NewMapModal({ onClose, onCreate }) {
  const [name,  setName]  = useState('My World')
  const [style, setStyle] = useState('parchment')
  const [type,  setType]  = useState(MAP_TYPES.WORLD)

  function handleCreate() {
    const bg = generateProceduralBackground(style, 1600, 900)
    onCreate({ name, style, type, backgroundData: bg })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-axiom-surface border border-axiom-border rounded-2xl shadow-card w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-axiom-border">
          <span className="font-serif font-semibold text-slate-100 text-sm">New Map</span>
          <button onClick={onClose} className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors"><X className="w-3.5 h-3.5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input-base text-sm w-full" placeholder="World Map" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Type</label>
            <div className="flex gap-2">
              {[MAP_TYPES.WORLD, MAP_TYPES.REGION, MAP_TYPES.CITY].map(t => (
                <button key={t} onClick={() => setType(t)} className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all ${type === t ? 'border-gold-500/40 bg-gold-500/10 text-gold-400' : 'border-axiom-border text-slate-500 hover:text-slate-300'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Visual Style</label>
            <div className="grid grid-cols-2 gap-2">
              {MAP_STYLES.map(s => (
                <button key={s.value} onClick={() => setStyle(s.value)} className={`p-3 rounded-xl border text-left transition-all relative ${style === s.value ? 'border-gold-500/40 bg-gold-500/10' : 'border-axiom-border bg-axiom-surface2 hover:border-axiom-border-light'}`}>
                  {style === s.value && <Check className="w-3 h-3 text-gold-400 absolute top-2 right-2" />}
                  <p className={`text-xs font-semibold mb-0.5 ${style === s.value ? 'text-gold-400' : 'text-slate-300'}`}>{s.label}</p>
                  <p className="text-[10px] text-slate-600">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-xs">Cancel</button>
          <button onClick={handleCreate} className="btn-primary text-xs flex items-center gap-1.5">
            <Map className="w-3.5 h-3.5" />Create Map
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function WorldMap() {
  const { projectId } = useParams()
  const navigate      = useNavigate()
  const stageRef      = useRef(null)

  const wm = useWorldMap(projectId)
  const { entries: loreEntries } = useLore(projectId)
  const ms = useManuscript(projectId)

  const [savedFlash,   setSavedFlash]   = useState(false)

  // Flash "Saved ✓" for 2s whenever lastSaved changes
  useEffect(() => {
    if (!wm.lastSaved) return
    setSavedFlash(true)
    const t = setTimeout(() => setSavedFlash(false), 2000)
    return () => clearTimeout(t)
  }, [wm.lastSaved])

  const [activeTool,   setActiveTool]   = useState(TOOL_TYPES.SELECT)
  const [activeColor,  setActiveColor]  = useState('#5a3a1a')
  const [strokeWidth,  setStrokeWidth]  = useState(1.5)
  const [selectedId,   setSelectedId]   = useState(null)
  const [selectedPin,  setSelectedPin]  = useState(null)

  const [showGenerate,  setShowGenerate]  = useState(false)
  const [showNewMap,    setShowNewMap]    = useState(false)
  const [showExport,    setShowExport]    = useState(false)
  const [showLayers,    setShowLayers]    = useState(false)
  const [contextMenu,   setContextMenu]   = useState(null) // { x, y, pin }
  const [importing,     setImporting]     = useState(false)
  const fileInputRef    = useRef(null)

  // Open selected pin in side panel
  const handlePinClick = useCallback((pin) => {
    setSelectedPin(pin)
  }, [])

  const handlePinContextMenu = useCallback((pin, evt) => {
    setContextMenu({ x: evt.clientX, y: evt.clientY, pin })
  }, [])

  // ── Map creation ─────────────────────────────────────────────────────────
  async function handleGenerateCreate(mapData) {
    const id = await wm.createMap(mapData)
    wm.openMap(id)
    setShowGenerate(false)
  }

  async function handleNewMapCreate(mapData) {
    const id = await wm.createMap(mapData)
    wm.openMap(id)
    setShowNewMap(false)
  }

  // ── Child map navigation ─────────────────────────────────────────────────
  async function handleCreateChildMap(pin, typeOrAction) {
    if (!wm.activeMapId) return
    if (typeOrAction === 'open' && pin.childMapId) {
      wm.openMap(pin.childMapId)
      return
    }
    const type = typeOrAction === 'region' ? MAP_TYPES.REGION : MAP_TYPES.CITY
    const id   = await wm.createChildMap(wm.activeMapId, pin.id, type, `${pin.name} — ${type === MAP_TYPES.REGION ? 'Regional Map' : 'City Map'}`)
    wm.openMap(id)
    setSelectedPin(null)
  }

  // ── Artist import ────────────────────────────────────────────────────────
  function handleFileImport(e) {
    const file = e.target.files?.[0]
    if (!file || !wm.activeMapId) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      wm.persistMap(wm.activeMapId, { backgroundData: evt.target.result, backgroundUrl: null })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ── Export to Lore Bible ─────────────────────────────────────────────────
  // Handled via the Export modal (PNG download); full Lore Bible embedding
  // would write a lore entry with the data URL — wired through useLore.createEntry.

  // ── Open lore entry in new tab / navigate ────────────────────────────────
  function handleOpenLoreEntry(entryId) {
    navigate(`/projects/${projectId}/lore?entry=${entryId}`)
  }

  // ── Navigate to scene ────────────────────────────────────────────────────
  function handleNavigateToScene(sceneId) {
    navigate(`/projects/${projectId}`, { state: { openSceneId: sceneId } })
  }

  const map = wm.activeMap
  const breadcrumbs = map ? wm.getBreadcrumbs(map.id) : []

  // ── Empty state ──────────────────────────────────────────────────────────
  if (wm.loading) return <LoadingSpinner fullscreen />

  if (wm.maps.length === 0) {
    return (
      <div className="min-h-screen bg-axiom-bg flex flex-col">
        <header className="flex items-center gap-3 h-12 px-4 bg-axiom-surface border-b border-axiom-border flex-shrink-0">
          <button onClick={() => navigate(`/projects/${projectId}`)} className="btn-icon">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-serif font-semibold text-slate-100 text-sm">World Map</span>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Globe className="w-16 h-16 text-slate-700 mb-6" />
          <h2 className="font-serif text-2xl font-semibold text-slate-200 mb-2">Build Your World</h2>
          <p className="text-slate-500 text-sm max-w-sm mb-8 leading-relaxed">
            Create a map from your Lore Bible, or start with a blank canvas.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowGenerate(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate from Lore Bible
            </button>
            <button
              onClick={() => setShowNewMap(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Map className="w-4 h-4" />
              Start from Scratch
            </button>
          </div>
        </div>
        {showGenerate && (
          <GenerateFromLoreModal
            loreEntries={loreEntries}
            onClose={() => setShowGenerate(false)}
            onCreate={handleGenerateCreate}
          />
        )}
        {showNewMap && (
          <NewMapModal
            onClose={() => setShowNewMap(false)}
            onCreate={handleNewMapCreate}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-axiom-bg">

      {/* ── Early Access Banner ───────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-gold-500/8 border-b border-gold-500/20 text-[11px] text-gold-400/80 flex-shrink-0">
        <Construction className="w-3 h-3 flex-shrink-0" />
        <span>Map Editor — Early Access. A full asset library, terrain painting, and advanced tools are coming in a future update.</span>
      </div>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between h-12 px-4 bg-axiom-surface border-b border-axiom-border flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => navigate(`/projects/${projectId}`)} className="btn-icon flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 min-w-0">
            {breadcrumbs.map((crumb, i) => {
              const Icon = MAP_TYPE_ICONS[crumb.type] || Globe
              return (
                <React.Fragment key={crumb.id}>
                  {i > 0 && <ChevronRight className="w-3 h-3 text-slate-700 flex-shrink-0" />}
                  <button
                    onClick={() => wm.openMap(crumb.id)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors ${
                      crumb.id === wm.activeMapId
                        ? 'text-slate-200 font-semibold bg-axiom-surface2'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Icon className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate max-w-[120px]">{crumb.name}</span>
                  </button>
                </React.Fragment>
              )
            })}
          </div>

          {wm.saving ? (
            <span className="text-[10px] text-slate-600 ml-2 flex items-center gap-1 flex-shrink-0">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />Saving…
            </span>
          ) : savedFlash ? (
            <span className="text-[10px] text-teal-500 ml-2 flex items-center gap-1 flex-shrink-0">
              <Check className="w-2.5 h-2.5" />Saved
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Generate / New map */}
          <button
            onClick={() => setShowGenerate(true)}
            className="btn-ghost text-xs flex items-center gap-1.5"
            title="Generate from Lore Bible"
          >
            <Sparkles className="w-3.5 h-3.5" />Generate
          </button>
          <button
            onClick={() => setShowNewMap(true)}
            className="btn-ghost text-xs flex items-center gap-1.5"
            title="New map"
          >
            <Plus className="w-3.5 h-3.5" />New Map
          </button>

          <div className="w-px h-4 bg-axiom-border" />

          {/* Artist import */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-ghost text-xs flex items-center gap-1.5"
            title="Import custom map artwork"
          >
            <Image className="w-3.5 h-3.5" />Import Art
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            className="hidden"
            onChange={handleFileImport}
          />

          {/* Layer switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLayers(p => !p)}
              className={`btn-ghost text-xs flex items-center gap-1.5 ${showLayers ? 'text-gold-400' : ''}`}
              title="Map layers"
            >
              <Layers className="w-3.5 h-3.5" />Layers
            </button>
            {showLayers && (
              <div className="absolute right-0 top-full mt-1 bg-axiom-surface border border-axiom-border rounded-xl shadow-card w-56 z-50 py-1">
                <div className="px-3 py-2 border-b border-axiom-border">
                  <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Maps</p>
                </div>
                {wm.maps.map(m => {
                  const Icon = MAP_TYPE_ICONS[m.type] || Globe
                  return (
                    <button
                      key={m.id}
                      onClick={() => { wm.openMap(m.id); setShowLayers(false) }}
                      className={`w-full text-left px-3 py-2.5 text-xs flex items-center gap-2 transition-colors ${
                        m.id === wm.activeMapId
                          ? 'text-gold-400 bg-gold-500/10'
                          : 'text-slate-400 hover:bg-axiom-surface2 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="flex-1 truncate">{m.name}</span>
                      <span className="text-[9px] text-slate-700 capitalize">{m.type}</span>
                    </button>
                  )
                })}
                <div className="border-t border-axiom-border mt-1 pt-1">
                  <button
                    onClick={() => { setShowNewMap(true); setShowLayers(false) }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:text-slate-400 flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />Add new map layer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Clear annotations */}
          {map && (
            <button
              onClick={() => {
                if (window.confirm('Clear all drawn paths, stamps, borders, and labels? Location pins are kept.')) {
                  wm.persistMap(wm.activeMapId, { paths: [], stamps: [], factionBorders: [], labels: [] })
                }
              }}
              className="btn-ghost text-xs flex items-center gap-1.5 text-slate-500 hover:text-red-400"
              title="Clear all annotations (keeps pins)"
            >
              <Eraser className="w-3.5 h-3.5" />Clear
            </button>
          )}

          {/* Export */}
          <button
            onClick={() => setShowExport(true)}
            className="btn-ghost text-xs flex items-center gap-1.5"
            title="Export map"
          >
            <Download className="w-3.5 h-3.5" />Export
          </button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Drawing toolbar */}
        <MapToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          activeColor={activeColor}
          onColorChange={setActiveColor}
          strokeWidth={strokeWidth}
          onStrokeWidthChange={setStrokeWidth}
        />

        {/* Canvas area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">

          {/* Eraser hint */}
          {activeTool === TOOL_TYPES.ERASER && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 bg-axiom-surface/90 border border-axiom-border rounded-full text-xs text-slate-400 pointer-events-none">
              <Eraser className="w-3 h-3 inline-block mr-1.5 -mt-px" />
              Click any path, stamp, border, or label to erase it
            </div>
          )}

        {/* Canvas */}
        {map ? (
          <MapCanvas
            map={map}
            activeTool={activeTool}
            activeColor={activeColor}
            strokeWidth={strokeWidth}
            stageRef={stageRef}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onPinClick={handlePinClick}
            onPinContextMenu={handlePinContextMenu}
            onAddPin={pin => wm.addPin(wm.activeMapId, pin)}
            onUpdatePin={(pinId, updates) => {
              wm.updatePin(wm.activeMapId, pinId, updates)
              if (selectedPin?.id === pinId) setSelectedPin(p => ({ ...p, ...updates }))
            }}
            onDeletePin={pinId => {
              wm.deletePin(wm.activeMapId, pinId)
              if (selectedPin?.id === pinId) setSelectedPin(null)
            }}
            onAddPath={path  => wm.addPath(wm.activeMapId, path)}
            onDeletePath={id  => wm.deletePath(wm.activeMapId, id)}
            onAddStamp={stamp => wm.addStamp(wm.activeMapId, stamp)}
            onDeleteStamp={id => wm.deleteStamp(wm.activeMapId, id)}
            onAddFactionBorder={b    => wm.addFactionBorder(wm.activeMapId, b)}
            onUpdateFactionBorder={(id, u) => wm.updateFactionBorder(wm.activeMapId, id, u)}
            onDeleteFactionBorder={id    => wm.deleteFactionBorder(wm.activeMapId, id)}
            onAddLabel={label   => wm.addLabel(wm.activeMapId, label)}
            onUpdateLabel={(id, u) => wm.updateLabel(wm.activeMapId, id, u)}
            onDeleteLabel={id   => wm.deleteLabel(wm.activeMapId, id)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
            No map selected
          </div>
        )}
        </div>{/* end canvas area */}

        {/* Location side panel */}
        {selectedPin && (
          <LocationSidePanel
            pin={selectedPin}
            loreEntries={loreEntries}
            structure={ms.structure}
            onClose={() => setSelectedPin(null)}
            onUpdate={updates => {
              wm.updatePin(wm.activeMapId, selectedPin.id, updates)
              setSelectedPin(p => ({ ...p, ...updates }))
            }}
            onDelete={() => {
              wm.deletePin(wm.activeMapId, selectedPin.id)
              setSelectedPin(null)
            }}
            onCreateChildMap={handleCreateChildMap}
            onOpenLoreEntry={handleOpenLoreEntry}
            onNavigateToScene={handleNavigateToScene}
          />
        )}
      </div>

      {/* ── Context menu ──────────────────────────────────────────────────── */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          pin={contextMenu.pin}
          onAddChildMap={handleCreateChildMap}
          onPinScene={pin => { setSelectedPin(pin); setContextMenu(null) }}
          onOpenLore={pin => handleOpenLoreEntry(pin.loreEntryId)}
          onDelete={id => {
            wm.deletePin(wm.activeMapId, id)
            if (selectedPin?.id === id) setSelectedPin(null)
          }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {showGenerate && (
        <GenerateFromLoreModal
          loreEntries={loreEntries}
          onClose={() => setShowGenerate(false)}
          onCreate={handleGenerateCreate}
        />
      )}

      {showNewMap && (
        <NewMapModal
          onClose={() => setShowNewMap(false)}
          onCreate={handleNewMapCreate}
        />
      )}

      {showExport && (
        <ExportModal
          stageRef={stageRef}
          mapName={map?.name || 'world-map'}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}
