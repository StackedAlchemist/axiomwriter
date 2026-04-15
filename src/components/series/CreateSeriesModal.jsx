import React, { useState } from 'react'
import { X, Library, Loader2 } from 'lucide-react'

const GENRES = ['Fantasy', 'Sci-Fi', 'Romance', 'Thriller', 'Mystery', 'Horror', 'Literary', 'YA', 'Historical', 'Other']

export default function CreateSeriesModal({ onClose, onCreated, initial }) {
  const [name,        setName]        = useState(initial?.name        || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [genre,       setGenre]       = useState(initial?.genre       || 'Fantasy')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Series name is required.'); return }
    setSaving(true)
    try {
      await onCreated({ name, description, genre })
      onClose()
    } catch (err) {
      setError('Failed to save series. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-axiom-surface border border-axiom-border rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-axiom-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
              <Library className="w-4 h-4 text-gold-400" />
            </div>
            <h2 className="font-serif text-lg font-semibold text-slate-100">
              {initial ? 'Edit Series' : 'Create New Series'}
            </h2>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {error && (
            <p className="text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">
              Series Name <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. The Stormcaller Chronicles"
              className="input-base w-full"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">
              Genre
            </label>
            <select
              value={genre}
              onChange={e => setGenre(e.target.value)}
              className="input-base w-full"
            >
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">
              Description <span className="text-slate-700">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A brief description of the series arc or premise…"
              rows={3}
              className="input-base w-full resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving || !name.trim()} className="btn-primary flex-1">
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                : initial ? 'Save Changes' : 'Create Series'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
