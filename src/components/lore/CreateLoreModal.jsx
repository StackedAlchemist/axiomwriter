import React, { useState, useEffect, useRef } from 'react'
import { X, Lock, Unlock } from 'lucide-react'
import { FLEXIBILITY_OPTIONS } from '../../hooks/useLore'

export default function CreateLoreModal({ onClose, onCreate, existingCategories = [], prefillTitle = '' }) {
  const [title,       setTitle]       = useState(prefillTitle)
  const [category,    setCategory]    = useState('')
  const [flexibility, setFlexibility] = useState('flexible')
  const [saving,      setSaving]      = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    titleRef.current?.focus()
    if (prefillTitle) titleRef.current?.select()
  }, [prefillTitle])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await onCreate({ title: title.trim(), category: category.trim(), flexibility })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-axiom-border">
          <h2 className="font-serif text-lg font-semibold text-slate-100">New Lore Entry</h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Title */}
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. The Choir, House Valdris, The Weave…"
              className="input-base"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <input
              type="text"
              list="lore-categories"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="e.g. Locations, Factions, History…"
              className="input-base"
            />
            <datalist id="lore-categories">
              {existingCategories.map(c => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          {/* Flexibility */}
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">
              AI Flexibility
            </label>
            <div className="flex gap-2">
              {FLEXIBILITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFlexibility(opt.value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                    flexibility === opt.value
                      ? `${opt.bg} ${opt.color}`
                      : 'border-axiom-border text-slate-500 hover:border-axiom-border-light hover:text-slate-300'
                  }`}
                >
                  {opt.value === 'locked'
                    ? <Lock className="w-3.5 h-3.5" />
                    : <Unlock className="w-3.5 h-3.5" />
                  }
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-1.5">
              {FLEXIBILITY_OPTIONS.find(o => o.value === flexibility)?.desc}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || saving}
              className="btn-primary"
            >
              {saving ? 'Creating…' : 'Create Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
