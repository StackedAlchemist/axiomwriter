import React, { useState } from 'react'
import { X, GitBranch } from 'lucide-react'
import { getAllChapters } from '../../hooks/useManuscript'

const THREAD_TYPES = [
  { value: 'mystery',  label: 'Mystery',   desc: 'Unanswered question', color: 'text-gold-400 bg-gold-500/10 border-gold-500/20' },
  { value: 'promise',  label: 'Promise',   desc: 'Foreshadowing / setup', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  { value: 'conflict', label: 'Conflict',  desc: 'Unresolved tension', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { value: 'character',label: 'Character', desc: 'Significant new figure', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
]

export { THREAD_TYPES }

export default function AddThreadModal({ onClose, onCreate, structure, prefill }) {
  const [title,       setTitle]       = useState(prefill?.title || '')
  const [description, setDescription] = useState(prefill?.description || '')
  const [type,        setType]        = useState(prefill?.type || 'mystery')
  const [sceneId,     setSceneId]     = useState('')
  const [saving,      setSaving]      = useState(false)

  const chapters = getAllChapters(structure || { hasParts: false, chapters: [] })
  const allScenes = chapters.flatMap(ch =>
    (ch.scenes || []).map(s => ({ ...s, chapterTitle: ch.title, chapterId: ch.id }))
  )

  // Find chapter for selected scene
  const selectedScene = allScenes.find(s => s.id === sceneId)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await onCreate({
        title:               title.trim(),
        description:         description.trim(),
        type,
        introducedInScene:   sceneId || null,
        introducedInChapter: selectedScene?.chapterId || null,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-axiom-surface border border-axiom-border rounded-2xl shadow-card w-full max-w-lg animate-slide-up">

        <div className="flex items-center justify-between p-6 border-b border-axiom-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-slate-100">
                {prefill ? 'Add Suggested Thread' : 'New Plot Thread'}
              </h2>
              <p className="text-xs text-slate-500">Track an unresolved element in your story</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Thread Type</label>
            <div className="grid grid-cols-2 gap-2">
              {THREAD_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`flex flex-col px-3 py-2.5 rounded-lg border text-left transition-all ${
                    type === t.value ? t.color : 'border-axiom-border text-slate-500 hover:border-axiom-border-light hover:text-slate-300'
                  }`}
                >
                  <span className="text-xs font-semibold">{t.label}</span>
                  <span className="text-[10px] opacity-70 mt-0.5">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Who sent the letter?"
              className="input-base"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What was set up? What needs to be paid off?"
              rows={3}
              className="input-base resize-none"
            />
          </div>

          {/* Introduced in scene */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Introduced In Scene <span className="text-slate-600 font-normal normal-case">(optional)</span>
            </label>
            <select
              value={sceneId}
              onChange={e => setSceneId(e.target.value)}
              className="input-base"
            >
              <option value="">— Select a scene —</option>
              {chapters.map(ch => (
                <optgroup key={ch.id} label={ch.title || 'Untitled Chapter'}>
                  {(ch.scenes || []).map(s => (
                    <option key={s.id} value={s.id}>{s.title || 'Untitled Scene'}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={!title.trim() || saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : 'Add Thread'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
