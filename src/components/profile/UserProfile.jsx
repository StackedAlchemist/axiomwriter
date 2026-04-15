import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { User, Check, AlertCircle, Feather, Loader2 } from 'lucide-react'

const GENRES = [
  'Fantasy', 'Science Fiction', 'Horror', 'Romance', 'Literary Fiction',
  'Mystery', 'Thriller', 'Historical Fiction', 'Adventure', 'Dystopian',
  'Magical Realism', 'Non-fiction',
]

const TONE_OPTIONS = [
  { value: 'narrative',  label: 'Narrative',  desc: 'Flowing, story-driven prose' },
  { value: 'lyrical',    label: 'Lyrical',    desc: 'Poetic, rhythmic language' },
  { value: 'terse',      label: 'Terse',      desc: 'Punchy, economical sentences' },
  { value: 'cinematic',  label: 'Cinematic',  desc: 'Visual, scene-forward writing' },
]

const STYLE_OPTIONS = [
  { value: 'descriptive', label: 'Descriptive', desc: 'Rich sensory detail' },
  { value: 'minimalist',  label: 'Minimalist',  desc: 'Less is more approach' },
  { value: 'atmospheric', label: 'Atmospheric', desc: 'Mood and world first' },
  { value: 'character',   label: 'Character-led', desc: 'Inner life centered' },
]

const AUDIENCE_OPTIONS = [
  { value: 'general',  label: 'General Adult' },
  { value: 'ya',       label: 'Young Adult'   },
  { value: 'literary', label: 'Literary'      },
  { value: 'genre',    label: 'Genre readers' },
]

const POV_OPTIONS = [
  { value: 'first',          label: 'First person'         },
  { value: 'third-limited',  label: 'Third limited'        },
  { value: 'third-omni',     label: 'Third omniscient'     },
  { value: 'second',         label: 'Second person'        },
]

export default function UserProfile() {
  const { currentUser, userProfile, updateUserProfile } = useAuth()

  const [form, setForm]       = useState({
    displayName: '',
    writingPreferences: {
      genres:   [],
      tone:     'narrative',
      style:    'descriptive',
      audience: 'general',
      pov:      'third-limited',
    },
  })
  const [status, setStatus]   = useState('idle') // 'idle' | 'saving' | 'saved' | 'error'
  const [errorMsg, setError]  = useState('')

  // Populate form from profile
  useEffect(() => {
    if (userProfile) {
      setForm({
        displayName:        userProfile.displayName || '',
        writingPreferences: {
          genres:   userProfile.writingPreferences?.genres   || [],
          tone:     userProfile.writingPreferences?.tone     || 'narrative',
          style:    userProfile.writingPreferences?.style    || 'descriptive',
          audience: userProfile.writingPreferences?.audience || 'general',
          pov:      userProfile.writingPreferences?.pov      || 'third-limited',
        },
      })
    }
  }, [userProfile])

  function toggleGenre(genre) {
    setForm(prev => {
      const current = prev.writingPreferences.genres
      const updated = current.includes(genre)
        ? current.filter(g => g !== genre)
        : current.length < 5
          ? [...current, genre]
          : current
      return { ...prev, writingPreferences: { ...prev.writingPreferences, genres: updated } }
    })
  }

  function setPreference(key, value) {
    setForm(prev => ({
      ...prev,
      writingPreferences: { ...prev.writingPreferences, [key]: value },
    }))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.displayName.trim()) return setError('Display name is required.')
    setError('')
    setStatus('saving')
    try {
      await updateUserProfile({
        displayName:        form.displayName.trim(),
        writingPreferences: form.writingPreferences,
      })
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setError('Failed to save profile. Please try again.')
      setStatus('error')
    }
  }

  const initials = form.displayName
    ? form.displayName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div className="animate-slide-up max-w-2xl">
      <form onSubmit={handleSave} className="space-y-6">

        {/* Avatar + name */}
        <div className="card p-6">
          <h2 className="font-serif text-lg font-semibold text-slate-100 mb-4">Writer Identity</h2>

          <div className="flex items-center gap-5 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500/30 to-teal-500/30 border border-gold-500/20 flex items-center justify-center">
              <span className="text-xl font-semibold text-gold-400">{initials}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">{form.displayName || 'Your Name'}</p>
              <p className="text-xs text-slate-500">{currentUser?.email}</p>
              <span className="badge-gold mt-1.5">
                <Feather className="w-3 h-3 mr-1" />
                Writer
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Display name</label>
            <input
              type="text"
              value={form.displayName}
              onChange={e => { setForm(p => ({ ...p, displayName: e.target.value })); if (errorMsg) setError('') }}
              placeholder="Your pen name or real name"
              className="input-base"
            />
          </div>
        </div>

        {/* Writing preferences */}
        <div className="card p-6 space-y-6">
          <h2 className="font-serif text-lg font-semibold text-slate-100">Writing Preferences</h2>
          <p className="text-xs text-slate-500 -mt-4">
            These preferences help Claude understand your voice and style when assisting your writing.
          </p>

          {/* Genres */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Genres <span className="text-slate-600">(select up to 5)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(genre => {
                const selected = form.writingPreferences.genres.includes(genre)
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150
                      ${selected
                        ? 'bg-gold-500/15 border-gold-500/40 text-gold-400'
                        : 'bg-axiom-surface2 border-axiom-border text-slate-500 hover:border-axiom-border-light hover:text-slate-400'
                      }`}
                  >
                    {selected && <Check className="inline w-3 h-3 mr-1" />}
                    {genre}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Writing Tone</label>
            <div className="grid grid-cols-2 gap-2">
              {TONE_OPTIONS.map(({ value, label, desc }) => (
                <PrefCard
                  key={value}
                  active={form.writingPreferences.tone === value}
                  onClick={() => setPreference('tone', value)}
                  label={label}
                  desc={desc}
                />
              ))}
            </div>
          </div>

          {/* Style */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Prose Style</label>
            <div className="grid grid-cols-2 gap-2">
              {STYLE_OPTIONS.map(({ value, label, desc }) => (
                <PrefCard
                  key={value}
                  active={form.writingPreferences.style === value}
                  onClick={() => setPreference('style', value)}
                  label={label}
                  desc={desc}
                />
              ))}
            </div>
          </div>

          {/* Audience & POV */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Target Audience</label>
              <select
                value={form.writingPreferences.audience}
                onChange={e => setPreference('audience', e.target.value)}
                className="input-base"
              >
                {AUDIENCE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Default POV</label>
              <select
                value={form.writingPreferences.pov}
                onChange={e => setPreference('pov', e.target.value)}
                className="input-base"
              >
                {POV_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Save footer */}
        <div className="flex items-center justify-between gap-4 pb-6">
          <div>
            {status === 'saved' && (
              <span className="flex items-center gap-2 text-teal-400 text-sm animate-fade-in">
                <Check className="w-4 h-4" />
                Profile saved
              </span>
            )}
            {(status === 'error' || errorMsg) && (
              <span className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errorMsg || 'Save failed'}
              </span>
            )}
          </div>
          <button type="submit" disabled={status === 'saving'} className="btn-primary">
            {status === 'saving' ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </span>
            ) : (
              <>
                <User className="w-4 h-4" />
                Save Profile
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  )
}

function PrefCard({ active, onClick, label, desc }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-3 rounded-lg border transition-all duration-150
        ${active
          ? 'bg-gold-500/10 border-gold-500/40 text-gold-400'
          : 'bg-axiom-surface2 border-axiom-border text-slate-500 hover:border-axiom-border-light'
        }`}
    >
      <div className="flex items-center gap-2 mb-0.5">
        {active && <Check className="w-3 h-3 flex-shrink-0" />}
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="text-[11px] opacity-70 leading-relaxed">{desc}</p>
    </button>
  )
}
