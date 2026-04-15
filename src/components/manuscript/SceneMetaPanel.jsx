import React, { useState, useEffect } from 'react'
import { Tag, X, GitBranch, Plus, ChevronDown, ChevronUp, MapPin, Users, Target, Swords, CheckCircle2 } from 'lucide-react'

const STATUSES = ['planned', 'drafted', 'revised', 'locked']

const STATUS_STYLES = {
  planned: 'bg-slate-700/50 text-slate-400 border-slate-600',
  drafted: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  revised: 'bg-gold-500/15 text-gold-400 border-gold-500/30',
  locked:  'bg-purple-500/15 text-purple-400 border-purple-500/30',
}

const THREAD_TYPE_COLORS = {
  mystery:   'text-gold-400',
  promise:   'text-teal-400',
  conflict:  'text-red-400',
  character: 'text-purple-400',
}

const SCENE_PURPOSES = [
  { value: '',             label: 'None' },
  { value: 'setup',        label: 'Setup' },
  { value: 'action',       label: 'Action' },
  { value: 'confrontation',label: 'Confrontation' },
  { value: 'revelation',   label: 'Revelation' },
  { value: 'resolution',   label: 'Resolution' },
  { value: 'transition',   label: 'Transition' },
]

export default function SceneMetaPanel({
  scene, onUpdate, threads, onLinkThread, onUnlinkThread,
  characters = [],
  showNotes = true,
}) {
  const [pov,          setPov]          = useState(scene?.povCharacter ?? '')
  const [summary,      setSummary]      = useState(scene?.summary ?? '')
  const [location,     setLocation]     = useState(scene?.location ?? '')
  const [conflict,     setConflict]     = useState(scene?.conflict ?? '')
  const [outcome,      setOutcome]      = useState(scene?.outcome ?? '')
  const [notes,        setNotes]        = useState(scene?.notes ?? '')
  const [tagInput,     setTagInput]     = useState('')
  const [showThreads,  setShowThreads]  = useState(false)

  // Sync when scene changes
  useEffect(() => {
    setPov(scene?.povCharacter ?? '')
    setSummary(scene?.summary ?? '')
    setLocation(scene?.location ?? '')
    setConflict(scene?.conflict ?? '')
    setOutcome(scene?.outcome ?? '')
    setNotes(scene?.notes ?? '')
  }, [scene?.id])

  function commit(field, value, original) {
    if (value !== original) onUpdate({ [field]: value })
  }

  function addTag(e) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const tag = tagInput.trim().replace(/,$/, '')
      if (!scene.tags?.includes(tag)) {
        onUpdate({ tags: [...(scene.tags || []), tag] })
      }
      setTagInput('')
    }
  }

  function removeTag(tag) {
    onUpdate({ tags: scene.tags.filter(t => t !== tag) })
  }

  function toggleCharacter(name) {
    const current = scene.characters || []
    const updated = current.includes(name)
      ? current.filter(n => n !== name)
      : [...current, name]
    onUpdate({ characters: updated })
  }

  if (!scene) return null

  const linkedThreadIds  = scene.linkedThreadIds || []
  const linkedThreads    = (threads || []).filter(t => linkedThreadIds.includes(t.id))
  const availableThreads = (threads || []).filter(t => !linkedThreadIds.includes(t.id) && t.status === 'active')
  const sceneCharacters  = scene.characters || []

  return (
    <div className="h-full overflow-y-auto bg-axiom-surface p-4 space-y-5">
      <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Scene Details</p>

      {/* Status */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-2">Status</label>
        <div className="grid grid-cols-2 gap-1.5">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => onUpdate({ status: s })}
              className={`
                px-2 py-1.5 rounded text-xs font-medium border capitalize transition-all
                ${scene.status === s ? STATUS_STYLES[s] : 'bg-transparent text-slate-600 border-axiom-border hover:border-axiom-border-light'}
              `}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Word count */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Word Count</label>
        <p className="text-lg font-semibold text-slate-300 tabular-nums">
          {(scene.wordCount ?? 0).toLocaleString()}
        </p>
      </div>

      {/* Summary */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">Summary</label>
        <textarea
          value={summary}
          onChange={e => setSummary(e.target.value)}
          onBlur={() => commit('summary', summary, scene?.summary ?? '')}
          placeholder="What happens in this scene…"
          rows={3}
          className="input-base text-xs resize-none leading-relaxed"
        />
      </div>

      {/* POV Character */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">POV Character</label>
        <input
          type="text"
          value={pov}
          onChange={e => setPov(e.target.value)}
          onBlur={() => commit('povCharacter', pov, scene?.povCharacter ?? '')}
          onKeyDown={e => { if (e.key === 'Enter') commit('povCharacter', pov, scene?.povCharacter ?? '') }}
          placeholder="Character name…"
          className="input-base text-xs py-2"
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
          <MapPin className="w-3 h-3" />
          Location
        </label>
        <input
          type="text"
          value={location}
          onChange={e => setLocation(e.target.value)}
          onBlur={() => commit('location', location, scene?.location ?? '')}
          onKeyDown={e => { if (e.key === 'Enter') commit('location', location, scene?.location ?? '') }}
          placeholder="Where does this take place…"
          className="input-base text-xs py-2"
        />
      </div>

      {/* Characters Involved */}
      {characters.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Users className="w-3 h-3" />
            Characters Involved
          </label>
          <div className="flex flex-wrap gap-1.5">
            {characters.map(char => {
              const active = sceneCharacters.includes(char.name)
              return (
                <button
                  key={char.id}
                  onClick={() => toggleCharacter(char.name)}
                  className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                    active
                      ? 'bg-teal-500/15 border-teal-500/30 text-teal-400'
                      : 'bg-axiom-surface2 border-axiom-border text-slate-600 hover:border-axiom-border-light hover:text-slate-400'
                  }`}
                >
                  {char.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Scene Purpose */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
          <Target className="w-3 h-3" />
          Scene Purpose
        </label>
        <select
          value={scene.scenePurpose ?? ''}
          onChange={e => onUpdate({ scenePurpose: e.target.value })}
          className="input-base text-xs py-2 bg-axiom-surface2"
        >
          {SCENE_PURPOSES.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Conflict */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
          <Swords className="w-3 h-3" />
          Conflict
        </label>
        <input
          type="text"
          value={conflict}
          onChange={e => setConflict(e.target.value)}
          onBlur={() => commit('conflict', conflict, scene?.conflict ?? '')}
          onKeyDown={e => { if (e.key === 'Enter') commit('conflict', conflict, scene?.conflict ?? '') }}
          placeholder="Core tension or obstacle…"
          className="input-base text-xs py-2"
        />
      </div>

      {/* Outcome */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3" />
          Outcome
        </label>
        <input
          type="text"
          value={outcome}
          onChange={e => setOutcome(e.target.value)}
          onBlur={() => commit('outcome', outcome, scene?.outcome ?? '')}
          onKeyDown={e => { if (e.key === 'Enter') commit('outcome', outcome, scene?.outcome ?? '') }}
          placeholder="How does the scene resolve…"
          className="input-base text-xs py-2"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">Tags</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(scene.tags || []).map(tag => (
            <span key={tag} className="flex items-center gap-1 bg-axiom-surface2 border border-axiom-border text-slate-400 text-xs px-2 py-0.5 rounded-full">
              <Tag className="w-2.5 h-2.5" />
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors ml-0.5">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder="Add tag, press Enter…"
          className="input-base text-xs py-2"
        />
      </div>

      {/* Attach to Thread */}
      {(threads !== undefined) && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <GitBranch className="w-3 h-3" />
              Threads
            </label>
            <button
              onClick={() => setShowThreads(p => !p)}
              className="text-[10px] text-slate-600 hover:text-gold-400 transition-colors flex items-center gap-0.5"
            >
              {showThreads ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showThreads ? 'Hide' : (availableThreads.length > 0 ? 'Attach' : 'View')}
            </button>
          </div>

          {/* Currently linked threads */}
          {linkedThreads.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {linkedThreads.map(t => (
                <span
                  key={t.id}
                  className="flex items-center gap-1 bg-axiom-surface2 border border-axiom-border text-xs px-2 py-0.5 rounded-full"
                >
                  <GitBranch className={`w-2.5 h-2.5 flex-shrink-0 ${THREAD_TYPE_COLORS[t.type] || 'text-teal-400'}`} />
                  <span className="text-slate-400 truncate max-w-[100px]">{t.title}</span>
                  {onUnlinkThread && (
                    <button
                      onClick={() => onUnlinkThread(t.id)}
                      className="hover:text-red-400 transition-colors ml-0.5 flex-shrink-0"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Thread picker */}
          {showThreads && (
            <div className="space-y-1">
              {availableThreads.length > 0 ? (
                availableThreads.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { onLinkThread?.(t.id); setShowThreads(false) }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-axiom-bg border border-axiom-border text-left hover:border-axiom-border-light hover:bg-axiom-surface transition-all group"
                  >
                    <GitBranch className={`w-3 h-3 flex-shrink-0 ${THREAD_TYPE_COLORS[t.type] || 'text-teal-400'}`} />
                    <span className="text-xs text-slate-400 group-hover:text-slate-200 truncate flex-1">{t.title}</span>
                    <Plus className="w-3 h-3 text-slate-700 group-hover:text-gold-400 flex-shrink-0 transition-colors" />
                  </button>
                ))
              ) : (
                <p className="text-[10px] text-slate-700 italic text-center py-2">
                  {(threads || []).length === 0
                    ? 'No threads yet — create one in Plot Threads'
                    : 'All threads already attached'}
                </p>
              )}
            </div>
          )}

          {linkedThreads.length === 0 && !showThreads && (
            <p className="text-[10px] text-slate-700 italic">No threads attached</p>
          )}
        </div>
      )}

      {/* Notes */}
      {showNotes && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Scene Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={() => commit('notes', notes, scene?.notes ?? '')}
            placeholder="Private notes for this scene…"
            rows={5}
            className="input-base text-xs resize-none leading-relaxed"
          />
        </div>
      )}
    </div>
  )
}
