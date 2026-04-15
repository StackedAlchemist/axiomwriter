import React, { useState } from 'react'
import {
  X, MapPin, BookOpen, Film, Map, ChevronDown, ChevronRight,
  Plus, Trash2, Edit3, Check, ExternalLink,
} from 'lucide-react'

const PIN_TYPES = [
  { value: 'city',       label: 'City' },
  { value: 'town',       label: 'Town' },
  { value: 'landmark',   label: 'Landmark' },
  { value: 'dungeon',    label: 'Dungeon / Ruin' },
  { value: 'wilderness', label: 'Wilderness' },
  { value: 'sea',        label: 'Sea / Ocean' },
  { value: 'mountain',   label: 'Mountain' },
]

export default function LocationSidePanel({
  pin,
  loreEntries,
  structure,         // manuscript structure for scene lookup
  onClose,
  onUpdate,
  onDelete,
  onCreateChildMap,
  onOpenLoreEntry,
  onNavigateToScene,
}) {
  const [editingName, setEditingName] = useState(false)
  const [nameVal,     setNameVal]     = useState(pin?.name || '')
  const [notesVal,    setNotesVal]    = useState(pin?.notes || '')
  const [addingScene, setAddingScene] = useState(false)
  const [activeTab,   setActiveTab]   = useState('info') // info | scenes | lore

  if (!pin) return null

  // Find linked lore entry
  const linkedLore = pin.loreEntryId
    ? loreEntries.find(e => e.id === pin.loreEntryId)
    : null

  // Find scenes pinned to this location
  const pinnedScenes = pin.scenePins || []

  // Collect all scenes from structure for picking
  function getAllScenes(structure) {
    if (!structure) return []
    const scenes = []
    const walkChapter = (ch) => {
      ;(ch.scenes || []).forEach(s => scenes.push({ ...s, chapterTitle: ch.title }))
    }
    if (structure.hasParts) {
      ;(structure.parts || []).forEach(p => (p.chapters || []).forEach(walkChapter))
    } else {
      ;(structure.chapters || []).forEach(walkChapter)
    }
    return scenes
  }

  const allScenes = getAllScenes(structure)

  function commitName() {
    setEditingName(false)
    if (nameVal.trim() !== pin.name) onUpdate({ name: nameVal.trim() })
  }

  function handleTypeChange(type) {
    onUpdate({ type })
  }

  function handleLinkLore(entryId) {
    onUpdate({ loreEntryId: entryId || null })
  }

  function addScenePin(sceneId, chapterId) {
    if (pinnedScenes.find(sp => sp.sceneId === sceneId)) return
    onUpdate({ scenePins: [...pinnedScenes, { sceneId, chapterId }] })
    setAddingScene(false)
  }

  function removeScenePin(sceneId) {
    onUpdate({ scenePins: pinnedScenes.filter(sp => sp.sceneId !== sceneId) })
  }

  function saveNotes() {
    onUpdate({ notes: notesVal })
  }

  function strip(html) { return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() }

  return (
    <div className="w-[280px] flex-shrink-0 border-l border-axiom-border bg-axiom-surface flex flex-col overflow-hidden animate-slide-in">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-axiom-border flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-gold-400 flex-shrink-0" />
          {editingName ? (
            <input
              autoFocus
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              onBlur={commitName}
              onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false) }}
              className="flex-1 bg-transparent text-sm font-semibold text-slate-100 outline-none border-b border-gold-500/40"
            />
          ) : (
            <button
              onClick={() => { setEditingName(true); setNameVal(pin.name || '') }}
              className="flex-1 text-left text-sm font-semibold text-slate-100 truncate hover:text-gold-300 transition-colors"
            >
              {pin.name || 'Unnamed Location'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onDelete()}
            className="p-1.5 text-slate-700 hover:text-red-400 transition-colors"
            title="Delete pin"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-axiom-border flex-shrink-0">
        {[['info', 'Info'], ['scenes', `Scenes${pinnedScenes.length ? ` (${pinnedScenes.length})` : ''}`], ['lore', 'Lore']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-2 text-[10px] font-medium uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === id
                ? 'border-gold-400 text-gold-400'
                : 'border-transparent text-slate-600 hover:text-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Info tab ─────────────────────────────────────────────────────── */}
        {activeTab === 'info' && (
          <div className="p-4 space-y-4">

            {/* Type */}
            <div>
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Location Type</p>
              <div className="grid grid-cols-2 gap-1">
                {PIN_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => handleTypeChange(t.value)}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-medium border text-left transition-all ${
                      pin.type === t.value
                        ? 'border-gold-500/40 bg-gold-500/10 text-gold-400'
                        : 'border-axiom-border text-slate-500 hover:text-slate-300 hover:border-axiom-border-light'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Notes</p>
              <textarea
                value={notesVal}
                onChange={e => setNotesVal(e.target.value)}
                onBlur={saveNotes}
                rows={3}
                placeholder="Add notes about this location…"
                className="input-base text-xs w-full resize-none leading-relaxed"
              />
            </div>

            {/* Child map */}
            {pin.hasChildMap && pin.childMapId ? (
              <button
                onClick={() => onCreateChildMap && onCreateChildMap(pin, 'open')}
                className="w-full btn-ghost text-xs flex items-center gap-1.5 justify-center text-gold-400"
              >
                <Map className="w-3.5 h-3.5" />
                Open Regional Map
              </button>
            ) : (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Drill Down</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onCreateChildMap?.(pin, 'region')}
                    className="flex-1 btn-secondary text-[10px] py-1.5"
                  >
                    + Regional Map
                  </button>
                  <button
                    onClick={() => onCreateChildMap?.(pin, 'city')}
                    className="flex-1 btn-secondary text-[10px] py-1.5"
                  >
                    + City Map
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Scenes tab ───────────────────────────────────────────────────── */}
        {activeTab === 'scenes' && (
          <div className="p-4 space-y-3">
            {pinnedScenes.length === 0 && !addingScene && (
              <p className="text-xs text-slate-600 text-center py-4">No scenes pinned to this location yet.</p>
            )}

            {pinnedScenes.map(sp => {
              const scene = allScenes.find(s => s.id === sp.sceneId)
              return (
                <div key={sp.sceneId} className="flex items-start gap-2 p-2.5 rounded-xl bg-axiom-surface2 border border-axiom-border group">
                  <Film className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-300 truncate">{scene?.title || 'Untitled Scene'}</p>
                    {scene?.chapterTitle && (
                      <p className="text-[10px] text-slate-700">{scene.chapterTitle}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onNavigateToScene && (
                      <button
                        onClick={() => onNavigateToScene(sp.sceneId)}
                        className="p-1 text-slate-600 hover:text-gold-400 transition-colors"
                        title="Open scene"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => removeScenePin(sp.sceneId)}
                      className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}

            {addingScene ? (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Select scene</p>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {allScenes
                    .filter(s => !pinnedScenes.find(sp => sp.sceneId === s.id))
                    .map(s => (
                      <button
                        key={s.id}
                        onClick={() => addScenePin(s.id, null)}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:bg-axiom-surface2 border border-transparent hover:border-axiom-border transition-all"
                      >
                        <span className="font-medium">{s.title || 'Untitled'}</span>
                        {s.chapterTitle && <span className="text-slate-600 ml-1.5">— {s.chapterTitle}</span>}
                      </button>
                    ))}
                  {allScenes.filter(s => !pinnedScenes.find(sp => sp.sceneId === s.id)).length === 0 && (
                    <p className="text-xs text-slate-700 text-center py-2">All scenes already pinned</p>
                  )}
                </div>
                <button onClick={() => setAddingScene(false)} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Cancel</button>
              </div>
            ) : (
              <button
                onClick={() => setAddingScene(true)}
                className="w-full btn-ghost text-xs flex items-center gap-1.5 justify-center"
              >
                <Plus className="w-3.5 h-3.5" />
                Pin a Scene Here
              </button>
            )}
          </div>
        )}

        {/* ── Lore tab ─────────────────────────────────────────────────────── */}
        {activeTab === 'lore' && (
          <div className="p-4 space-y-4">

            {/* Linked entry */}
            {linkedLore ? (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Linked Entry</p>
                <div className="p-3 rounded-xl bg-axiom-surface2 border border-gold-500/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 mb-0.5">{linkedLore.title}</p>
                      {linkedLore.category && (
                        <p className="text-[10px] text-slate-600 uppercase tracking-wider">{linkedLore.category}</p>
                      )}
                      {linkedLore.content && (
                        <p className="text-xs text-slate-500 leading-relaxed mt-1.5 line-clamp-3">
                          {strip(linkedLore.content)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-2.5">
                    {onOpenLoreEntry && (
                      <button
                        onClick={() => onOpenLoreEntry(linkedLore.id)}
                        className="flex-1 btn-secondary text-[10px] py-1.5 flex items-center justify-center gap-1"
                      >
                        <BookOpen className="w-3 h-3" />
                        Open in Lore Bible
                      </button>
                    )}
                    <button
                      onClick={() => handleLinkLore(null)}
                      className="px-2 py-1.5 text-[10px] text-slate-600 hover:text-red-400 transition-colors border border-axiom-border rounded-lg"
                      title="Unlink"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Link to Lore Bible</p>
                <p className="text-xs text-slate-600 leading-relaxed">Connect this pin to a Lore Bible entry for quick reference.</p>
              </div>
            )}

            {/* Entry picker */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                {linkedLore ? 'Change linked entry' : 'Select entry'}
              </p>
              <div className="max-h-52 overflow-y-auto space-y-1">
                {loreEntries.map(entry => (
                  <button
                    key={entry.id}
                    onClick={() => handleLinkLore(entry.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs border transition-all ${
                      pin.loreEntryId === entry.id
                        ? 'border-gold-500/30 bg-gold-500/10 text-gold-300'
                        : 'text-slate-400 hover:bg-axiom-surface2 border-transparent hover:border-axiom-border'
                    }`}
                  >
                    <span className="font-medium">{entry.title}</span>
                    {entry.category && <span className="text-slate-700 ml-1.5">· {entry.category}</span>}
                  </button>
                ))}
                {loreEntries.length === 0 && (
                  <p className="text-xs text-slate-700 text-center py-3">No lore entries yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
