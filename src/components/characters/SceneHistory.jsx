import React, { useState, useEffect } from 'react'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { getAllChapters } from '../../hooks/useManuscript'
import { Plus, X, BookOpen, ChevronDown } from 'lucide-react'

function getAllScenesFlat(structure) {
  if (!structure) return []
  const chapters = getAllChapters(structure)
  return chapters.flatMap(ch =>
    (ch.scenes || []).map(sc => ({
      id:           sc.id,
      title:        sc.title || 'Untitled Scene',
      chapterTitle: ch.title || 'Untitled Chapter',
      label:        `${ch.title} — ${sc.title || 'Untitled Scene'}`,
    }))
  )
}

const EMOTIONAL_STATES = [
  'Hopeful', 'Fearful', 'Angry', 'Grieving', 'Determined', 'Conflicted',
  'Joyful', 'Desperate', 'Resigned', 'Suspicious', 'Loving', 'Betrayed',
  'Ashamed', 'Proud', 'Confused', 'Numb', 'Other',
]

export default function SceneHistory({ character, onSave, projectId }) {
  const [availableScenes, setAvailableScenes] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [newEntry, setNewEntry] = useState({ sceneId: '', emotionalState: '', whatChanged: '' })
  const [saving, setSaving] = useState(false)

  const history = character.sceneHistory ?? []

  // Load project structure to get scene list
  useEffect(() => {
    if (!projectId) return
    getDoc(doc(db, 'projects', projectId)).then(snap => {
      if (snap.exists()) {
        setAvailableScenes(getAllScenesFlat(snap.data().structure))
      }
    }).catch(console.warn)
  }, [projectId])

  // Scenes already linked
  const linkedIds = new Set(history.map(e => e.sceneId))
  const unlinked  = availableScenes.filter(s => !linkedIds.has(s.id))

  function getSceneLabel(sceneId) {
    return availableScenes.find(s => s.id === sceneId)?.label ?? sceneId
  }

  async function handleAdd() {
    if (!newEntry.sceneId) return
    setSaving(true)
    const updated = [...history, { ...newEntry, addedAt: new Date().toISOString() }]
    await onSave({ sceneHistory: updated })
    setNewEntry({ sceneId: '', emotionalState: '', whatChanged: '' })
    setShowAdd(false)
    setSaving(false)
  }

  async function handleUpdate(idx, field, val) {
    const updated = history.map((e, i) => i === idx ? { ...e, [field]: val } : e)
    await onSave({ sceneHistory: updated })
  }

  async function handleRemove(idx) {
    const updated = history.filter((_, i) => i !== idx)
    await onSave({ sceneHistory: updated })
  }

  return (
    <div className="space-y-5 animate-slide-up">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Scene Appearances</h3>
          <p className="text-xs text-slate-700 mt-0.5">Track this character's emotional journey through the manuscript.</p>
        </div>
        <button
          onClick={() => setShowAdd(p => !p)}
          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Appearance
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card p-4 space-y-3 border-teal-500/20 bg-teal-500/5 animate-slide-up">
          <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider">New Scene Appearance</p>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Scene</label>
            {unlinked.length > 0 ? (
              <select
                value={newEntry.sceneId}
                onChange={e => setNewEntry(p => ({ ...p, sceneId: e.target.value }))}
                className="input-base text-sm"
              >
                <option value="">Select a scene…</option>
                {unlinked.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-slate-600 italic">
                {availableScenes.length === 0
                  ? 'No scenes found. Add scenes to your manuscript first.'
                  : 'All scenes are already linked to this character.'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Emotional State</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {EMOTIONAL_STATES.map(state => (
                <button
                  key={state}
                  type="button"
                  onClick={() => setNewEntry(p => ({ ...p, emotionalState: state }))}
                  className={`px-2.5 py-1 rounded text-xs border transition-all ${
                    newEntry.emotionalState === state
                      ? 'bg-gold-500/15 text-gold-400 border-gold-500/30'
                      : 'text-slate-600 border-axiom-border hover:border-axiom-border-light'
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>
            {newEntry.emotionalState === 'Other' && (
              <input
                type="text"
                placeholder="Describe emotional state…"
                value={newEntry.emotionalStateCustom ?? ''}
                onChange={e => setNewEntry(p => ({ ...p, emotionalStateCustom: e.target.value }))}
                className="input-base text-sm mt-1"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">What changed for them?</label>
            <textarea
              value={newEntry.whatChanged}
              onChange={e => setNewEntry(p => ({ ...p, whatChanged: e.target.value }))}
              placeholder="What did they learn, lose, decide, or discover in this scene?"
              rows={3}
              className="input-base text-sm resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="btn-ghost text-xs">Cancel</button>
            <button
              onClick={handleAdd}
              disabled={!newEntry.sceneId || saving}
              className="btn-primary text-xs py-1.5 px-4"
            >
              {saving ? 'Saving…' : 'Add to history'}
            </button>
          </div>
        </div>
      )}

      {/* History entries */}
      {history.length > 0 ? (
        <div className="space-y-3">
          {history.map((entry, idx) => (
            <SceneEntry
              key={idx}
              idx={idx}
              entry={entry}
              sceneLabel={getSceneLabel(entry.sceneId)}
              onUpdate={handleUpdate}
              onRemove={handleRemove}
            />
          ))}
        </div>
      ) : (
        !showAdd && (
          <div className="card p-10 flex flex-col items-center text-center">
            <BookOpen className="w-8 h-8 text-slate-700 mb-3" />
            <p className="text-slate-500 text-sm font-medium mb-1">No scene appearances yet</p>
            <p className="text-slate-700 text-xs max-w-sm">
              Track where this character appears, their emotional state, and what changes for them in each scene.
            </p>
          </div>
        )
      )}
    </div>
  )
}

function SceneEntry({ idx, entry, sceneLabel, onUpdate, onRemove }) {
  const [expanded, setExpanded] = useState(false)
  const [whatChanged, setWhatChanged] = useState(entry.whatChanged ?? '')

  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-axiom-surface2 transition-colors"
        onClick={() => setExpanded(p => !p)}
      >
        <BookOpen className="w-4 h-4 text-slate-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate">{sceneLabel}</p>
          {entry.emotionalState && (
            <span className="text-xs text-gold-400/80">
              {entry.emotionalState === 'Other' && entry.emotionalStateCustom
                ? entry.emotionalStateCustom
                : entry.emotionalState}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onRemove(idx) }}
            className="p-1 text-slate-700 hover:text-red-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-axiom-border space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Emotional State</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOTIONAL_STATES.map(state => (
                <button
                  key={state}
                  type="button"
                  onClick={() => onUpdate(idx, 'emotionalState', state)}
                  className={`px-2.5 py-1 rounded text-xs border transition-all ${
                    entry.emotionalState === state
                      ? 'bg-gold-500/15 text-gold-400 border-gold-500/30'
                      : 'text-slate-600 border-axiom-border hover:border-axiom-border-light'
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">What changed for them?</label>
            <textarea
              value={whatChanged}
              onChange={e => setWhatChanged(e.target.value)}
              onBlur={() => { if (whatChanged !== entry.whatChanged) onUpdate(idx, 'whatChanged', whatChanged) }}
              rows={3}
              placeholder="What did they learn, lose, decide, or discover?"
              className="input-base text-sm resize-none"
            />
          </div>
        </div>
      )}
    </div>
  )
}
