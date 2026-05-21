import React, { useState } from 'react'
import { X, Feather, Loader2, Sparkles, PenLine, Lock } from 'lucide-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'
import { useSubscription } from '../../hooks/useSubscription'
import PricingModal from '../subscription/PricingModal'
import { v4 as uuidv4 } from 'uuid'

const GENRES = ['Fantasy', 'Sci-Fi', 'Romance', 'Thriller', 'Mystery', 'Horror', 'Literary Fiction', 'Young Adult', 'Historical Fiction', 'Other']

const INITIAL_STRUCTURE = () => {
  const sceneId   = `sc_${uuidv4().slice(0, 8)}`
  const chapterId = `ch_${uuidv4().slice(0, 8)}`
  return {
    hasParts: false,
    chapters: [{
      id: chapterId,
      title: 'Chapter One',
      scenes: [{
        id: sceneId,
        title: 'Scene 1',
        wordCount: 0,
        status: 'planned',
        povCharacter: '',
        tags: [],
      }],
    }],
  }
}

export default function CreateProjectModal({ onClose, onCreated }) {
  const { currentUser } = useAuth()
  const { canAccess } = useSubscription()
  const [showPricing, setShowPricing] = useState(false)

  const [form, setForm] = useState({
    title:        '',
    seriesName:   '',
    genre:        '',
    synopsis:     '',
    assistedMode: false,
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }

    setLoading(true)
    try {
      const ref = await addDoc(collection(db, 'projects'), {
        userId:       currentUser.uid,
        title:        form.title.trim(),
        seriesName:   form.seriesName.trim(),
        genre:        form.genre,
        synopsis:     form.synopsis.trim(),
        assistedMode: form.assistedMode,
        coverImageUrl: null,
        wordCount:    0,
        status:       'drafting',
        structure:    INITIAL_STRUCTURE(),
        createdAt:    serverTimestamp(),
        updatedAt:    serverTimestamp(),
      })
      onCreated(ref.id)
    } catch (err) {
      setError('Failed to create project. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-axiom-surface border border-axiom-border rounded-2xl shadow-card w-full max-w-lg animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-axiom-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
              <Feather className="w-4 h-4 text-gold-400" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-slate-100">New Project</h2>
              <p className="text-xs text-slate-500">Start your next manuscript</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-2.5 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="input-label">Title *</label>
            <input
              name="title"
              type="text"
              required
              value={form.title}
              onChange={handleChange}
              placeholder="My Book Title"
              className="input-base"
              autoFocus
            />
          </div>

          <div>
            <label className="input-label">Series Name <span className="normal-case text-slate-600">(optional)</span></label>
            <input
              name="seriesName"
              type="text"
              value={form.seriesName}
              onChange={handleChange}
              placeholder="Series Title"
              className="input-base"
            />
          </div>

          <div>
            <label className="input-label">Genre</label>
            <select name="genre" value={form.genre} onChange={handleChange} className="input-base">
              <option value="">Select a genre</option>
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label className="input-label">Synopsis <span className="normal-case text-slate-600">(optional)</span></label>
            <textarea
              name="synopsis"
              value={form.synopsis}
              onChange={handleChange}
              placeholder="A brief summary of your story…"
              rows={3}
              className="input-base resize-none"
            />
          </div>

          {/* Writing mode */}
          <div>
            <label className="input-label">Writing Mode</label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, assistedMode: false }))}
                className={`p-3 rounded-xl border text-left transition-all ${
                  !form.assistedMode
                    ? 'border-gold-500/40 bg-gold-500/10'
                    : 'border-axiom-border bg-axiom-surface2 hover:border-axiom-border-light'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <PenLine className={`w-3.5 h-3.5 ${!form.assistedMode ? 'text-gold-400' : 'text-slate-500'}`} />
                  <span className={`text-xs font-semibold ${!form.assistedMode ? 'text-gold-400' : 'text-slate-300'}`}>Solo</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-snug">Pure writing — no AI</p>
              </button>
              <button
                type="button"
                onClick={() => canAccess('composer_mode')
                  ? setForm(p => ({ ...p, assistedMode: true }))
                  : setShowPricing(true)}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  form.assistedMode && canAccess('composer_mode')
                    ? 'border-gold-500/40 bg-gold-500/10'
                    : 'border-axiom-border bg-axiom-surface2 hover:border-axiom-border-light'
                }`}
              >
                {!canAccess('composer_mode') && (
                  <Lock className="w-3 h-3 text-slate-600 absolute top-2 right-2" />
                )}
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Sparkles className={`w-3.5 h-3.5 ${form.assistedMode && canAccess('composer_mode') ? 'text-gold-400' : 'text-slate-500'}`} />
                  <span className={`text-xs font-semibold ${form.assistedMode && canAccess('composer_mode') ? 'text-gold-400' : 'text-slate-300'}`}>AI-Assisted</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-snug">
                  {canAccess('composer_mode') ? 'Composer + suggestions on' : 'Composer plan required'}
                </p>
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>

    {showPricing && (
      <PricingModal
        onClose={() => setShowPricing(false)}
        highlightFeature="AI-Assisted Mode"
      />
    )}
    </>
  )
}
