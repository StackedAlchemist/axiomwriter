import React, { useState } from 'react'
import { X, User, Loader2 } from 'lucide-react'
import { ROLE_OPTIONS, IMPORTANCE_LEVELS } from '../../hooks/useCharacters'

export default function CreateCharacterModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name:       '',
    role:       'supporting',
    importance: 1,
    age:        '',
    appearance: '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Character name is required.'); return }
    setLoading(true)
    try {
      await onCreate({
        name:       form.name.trim(),
        role:       form.role,
        importance: Number(form.importance),
        age:        form.age.trim(),
        appearance: form.appearance.trim(),
      })
    } catch (err) {
      setError('Failed to create character.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-axiom-surface border border-axiom-border rounded-2xl shadow-card w-full max-w-md animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-axiom-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <User className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-slate-100">New Character</h2>
              <p className="text-xs text-slate-500">Add them to your cast</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-2.5 text-red-400 text-sm">{error}</div>
          )}

          <div>
            <label className="input-label">Name *</label>
            <input name="name" type="text" required autoFocus value={form.name} onChange={handleChange} placeholder="Character name" className="input-base" />
          </div>

          <div>
            <label className="input-label">Age</label>
            <input name="age" type="text" value={form.age} onChange={handleChange} placeholder="e.g. 34, Early 40s, Unknown" className="input-base" />
          </div>

          <div>
            <label className="input-label">Role</label>
            <div className="grid grid-cols-2 gap-1.5">
              {ROLE_OPTIONS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, role: r.value }))}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    form.role === r.value
                      ? `${r.bg} ${r.color}`
                      : 'bg-transparent text-slate-600 border-axiom-border hover:border-axiom-border-light'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">Importance</label>
            <div className="grid grid-cols-4 gap-1">
              {IMPORTANCE_LEVELS.map(level => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, importance: level.value }))}
                  className={`px-2 py-1.5 rounded text-xs font-medium border transition-all ${
                    form.importance === level.value
                      ? `${level.bg} ${level.color}`
                      : 'text-slate-600 border-axiom-border hover:border-axiom-border-light'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">Appearance <span className="normal-case text-slate-600">(optional)</span></label>
            <textarea
              name="appearance"
              value={form.appearance}
              onChange={handleChange}
              placeholder="Brief physical description…"
              rows={2}
              className="input-base resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create Character'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
