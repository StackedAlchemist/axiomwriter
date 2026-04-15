import React, { useState } from 'react'
import { X, CheckCircle2, Archive, GitBranch, ExternalLink, User, BookOpen, Plus, Unlink, Trash2 } from 'lucide-react'
import { getAllChapters } from '../../hooks/useManuscript'
import { THREAD_TYPES } from './AddThreadModal'

function dormancyColor(count) {
  if (count >= 7) return 'text-red-400'
  if (count >= 4) return 'text-gold-400'
  return 'text-teal-400'
}

export default function ThreadDetailPanel({
  thread, structure, onClose, onUpdate, onDelete, onNavigateToScene,
  characters, loreEntries,
  onLinkCharacter, onUnlinkCharacter,
  onLinkLore, onUnlinkLore,
}) {
  const [editingNotes,    setEditingNotes]    = useState(false)
  const [notes,           setNotes]           = useState(thread.resolutionNotes || '')
  const [saving,          setSaving]          = useState(false)
  const [showCharPicker,  setShowCharPicker]  = useState(false)
  const [showLorePicker,  setShowLorePicker]  = useState(false)

  const chapters   = getAllChapters(structure || { hasParts: false, chapters: [] })
  const sceneMap   = {}
  const chapterMap = {}
  chapters.forEach(ch => {
    chapterMap[ch.id] = ch.title || 'Untitled'
    ;(ch.scenes || []).forEach(s => {
      sceneMap[s.id] = { title: s.title || 'Untitled Scene', chapterTitle: ch.title, chapterId: ch.id }
    })
  })

  const typeInfo   = THREAD_TYPES.find(t => t.value === thread.type)
  const introScene = sceneMap[thread.introducedInScene]
  const lastScene  = sceneMap[thread.lastReferencedInScene]

  async function handleResolve() {
    setSaving(true)
    await onUpdate(thread.id, { status: 'resolved', resolutionNotes: notes || thread.resolutionNotes }).catch(() => {})
    setSaving(false)
    setEditingNotes(false)
  }

  async function handleDrop() {
    await onUpdate(thread.id, { status: 'dropped' }).catch(() => {})
  }

  async function handleReopen() {
    await onUpdate(thread.id, { status: 'active', dormancyCount: 0 }).catch(() => {})
  }

  async function saveNotes() {
    setSaving(true)
    await onUpdate(thread.id, { resolutionNotes: notes }).catch(() => {})
    setSaving(false)
    setEditingNotes(false)
  }

  // Scene timeline — all scenes that mention this thread, in document order
  const allScenes = chapters.flatMap(ch => (ch.scenes || []).map(s => ({ ...s, chapterId: ch.id, chapterTitle: ch.title })))
  const timelineScenes = allScenes.filter(s => (thread.scenesAppearingIn || []).includes(s.id))

  // Linked data
  const linkedCharIds = thread.linkedCharacters || []
  const linkedLoreIds = thread.linkedLore || []

  const linkedChars = (characters || []).filter(c => linkedCharIds.includes(c.id))
  const linkedLoreItems = (loreEntries || []).filter(l => linkedLoreIds.includes(l.id))

  const unlinkdChars = (characters || []).filter(c => !linkedCharIds.includes(c.id))
  const unlinkdLore  = (loreEntries || []).filter(l => !linkedLoreIds.includes(l.id))

  return (
    <div className="w-[300px] flex-shrink-0 border-l border-axiom-border bg-axiom-surface flex flex-col overflow-hidden animate-slide-in">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-axiom-border flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {typeInfo && (
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
          )}
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Thread</span>
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* Title + description */}
        <div>
          <h3 className="font-serif text-base font-semibold text-slate-100 leading-snug mb-1.5">
            {thread.title}
          </h3>
          {thread.description && (
            <p className="text-xs text-slate-400 leading-relaxed">{thread.description}</p>
          )}
        </div>

        {/* Status + dormancy */}
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${
            thread.status === 'active'   ? 'text-teal-400 bg-teal-500/10 border-teal-500/20' :
            thread.status === 'resolved' ? 'text-gold-400 bg-gold-500/10 border-gold-500/20' :
            'text-slate-500 bg-slate-500/10 border-slate-500/20'
          }`}>
            {thread.status}
          </span>
          {thread.status === 'active' && (
            <span className={`text-xs font-medium ${dormancyColor(thread.dormancyCount || 0)}`}>
              {(thread.dormancyCount || 0) === 0
                ? 'Recently active'
                : `${thread.dormancyCount} scene${thread.dormancyCount !== 1 ? 's' : ''} since last mention`}
            </span>
          )}
        </div>

        {/* Where introduced / last seen */}
        <div className="space-y-2 text-xs">
          {introScene && (
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Introduced in</span>
              <button
                onClick={() => onNavigateToScene?.(thread.introducedInScene)}
                className="text-slate-400 hover:text-gold-400 transition-colors flex items-center gap-1"
                title="Open this scene"
              >
                {introScene.title}
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
          {lastScene && lastScene !== introScene && (
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Last seen in</span>
              <button
                onClick={() => onNavigateToScene?.(thread.lastReferencedInScene)}
                className="text-slate-400 hover:text-gold-400 transition-colors flex items-center gap-1"
                title="Open this scene"
              >
                {lastScene.title}
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
        </div>

        {/* Scene timeline */}
        {timelineScenes.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
              Scenes — {timelineScenes.length} appearance{timelineScenes.length !== 1 ? 's' : ''}
            </p>
            <div className="relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-axiom-border" />
              <div className="space-y-2">
                {timelineScenes.map((scene) => (
                  <div key={scene.id} className="flex items-start gap-3 pl-4 relative">
                    <div className="absolute left-[3px] top-1.5 w-2.5 h-2.5 rounded-full bg-axiom-surface2 border-2 border-teal-500/50 flex-shrink-0" />
                    <button
                      onClick={() => onNavigateToScene?.(scene.id)}
                      className="flex-1 text-left group"
                    >
                      <p className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors truncate">
                        {scene.title || 'Untitled Scene'}
                      </p>
                      <p className="text-[10px] text-slate-700">{scene.chapterTitle}</p>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Linked Characters */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3 h-3" /> Linked Characters
            </p>
            {onLinkCharacter && unlinkdChars.length > 0 && (
              <button
                onClick={() => setShowCharPicker(p => !p)}
                className="text-[10px] text-slate-600 hover:text-gold-400 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Link
              </button>
            )}
          </div>

          {showCharPicker && (
            <div className="bg-axiom-bg border border-axiom-border rounded-lg overflow-hidden">
              {unlinkdChars.map(c => (
                <button
                  key={c.id}
                  onClick={() => { onLinkCharacter(thread.id, c.id); setShowCharPicker(false) }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-axiom-surface hover:text-slate-200 transition-colors border-b border-axiom-border/50 last:border-0"
                >
                  {c.name}
                  <span className="ml-1.5 text-[10px] text-slate-600 capitalize">{c.role}</span>
                </button>
              ))}
            </div>
          )}

          {linkedChars.length > 0 ? (
            <div className="space-y-1">
              {linkedChars.map(c => (
                <div key={c.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-axiom-bg border border-axiom-border/50">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <User className="w-3 h-3 text-purple-400 flex-shrink-0" />
                    <span className="text-xs text-slate-300 truncate">{c.name}</span>
                    <span className="text-[10px] text-slate-600 capitalize flex-shrink-0">{c.role}</span>
                  </div>
                  {onUnlinkCharacter && (
                    <button
                      onClick={() => onUnlinkCharacter(thread.id, c.id)}
                      className="text-slate-700 hover:text-red-400 transition-colors flex-shrink-0 ml-1"
                      title="Unlink"
                    >
                      <Unlink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-slate-700 italic">No characters linked</p>
          )}
        </div>

        {/* Linked Lore */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" /> Linked Lore
            </p>
            {onLinkLore && unlinkdLore.length > 0 && (
              <button
                onClick={() => setShowLorePicker(p => !p)}
                className="text-[10px] text-slate-600 hover:text-gold-400 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Link
              </button>
            )}
          </div>

          {showLorePicker && (
            <div className="bg-axiom-bg border border-axiom-border rounded-lg overflow-hidden max-h-40 overflow-y-auto">
              {unlinkdLore.map(l => (
                <button
                  key={l.id}
                  onClick={() => { onLinkLore(thread.id, l.id); setShowLorePicker(false) }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-axiom-surface hover:text-slate-200 transition-colors border-b border-axiom-border/50 last:border-0"
                >
                  {l.title}
                  {l.category && <span className="ml-1.5 text-[10px] text-slate-600">{l.category}</span>}
                </button>
              ))}
            </div>
          )}

          {linkedLoreItems.length > 0 ? (
            <div className="space-y-1">
              {linkedLoreItems.map(l => (
                <div key={l.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-axiom-bg border border-axiom-border/50">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <BookOpen className="w-3 h-3 text-teal-400 flex-shrink-0" />
                    <span className="text-xs text-slate-300 truncate">{l.title}</span>
                    {l.category && <span className="text-[10px] text-slate-600 flex-shrink-0">{l.category}</span>}
                  </div>
                  {onUnlinkLore && (
                    <button
                      onClick={() => onUnlinkLore(thread.id, l.id)}
                      className="text-slate-700 hover:text-red-400 transition-colors flex-shrink-0 ml-1"
                      title="Unlink"
                    >
                      <Unlink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-slate-700 italic">No lore linked</p>
          )}
        </div>

        {/* Resolution notes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Resolution Notes</p>
            {!editingNotes && (
              <button
                onClick={() => setEditingNotes(true)}
                className="text-[10px] text-slate-600 hover:text-gold-400 transition-colors"
              >
                {notes ? 'Edit' : 'Add note'}
              </button>
            )}
          </div>
          {editingNotes ? (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="How was this thread resolved? Which scene?"
                rows={4}
                className="input-base text-xs resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={() => setEditingNotes(false)} className="btn-ghost text-xs flex-1">Cancel</button>
                <button onClick={saveNotes} disabled={saving} className="btn-secondary text-xs flex-1">Save</button>
              </div>
            </div>
          ) : notes ? (
            <p className="text-xs text-slate-500 leading-relaxed italic">{notes}</p>
          ) : (
            <p className="text-xs text-slate-700 italic">No notes yet</p>
          )}
        </div>
      </div>

      {/* Action footer */}
      <div className="p-3 border-t border-axiom-border flex-shrink-0 space-y-2">
        {thread.status === 'active' && (
          <>
            <button
              onClick={handleResolve}
              className="w-full btn-secondary text-xs justify-center"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              Mark Resolved
            </button>
            <button onClick={handleDrop} className="w-full btn-ghost text-xs justify-center text-slate-500">
              <Archive className="w-3.5 h-3.5" />
              Mark as Dropped
            </button>
          </>
        )}
        {(thread.status === 'resolved' || thread.status === 'dropped') && (
          <button onClick={handleReopen} className="w-full btn-ghost text-xs justify-center text-gold-400">
            <GitBranch className="w-3.5 h-3.5" />
            Reopen Thread
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => {
              if (window.confirm(`Delete "${thread.title}"? This cannot be undone.`)) {
                onDelete(thread.id)
                onClose()
              }
            }}
            className="w-full btn-ghost text-xs justify-center text-red-500/60 hover:text-red-400 hover:bg-red-900/10 mt-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Thread
          </button>
        )}
      </div>
    </div>
  )
}
