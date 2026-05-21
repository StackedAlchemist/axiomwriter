import React, { useState } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'
import { Feather, BookOpen, Zap, Users, Rocket, Check, Compass } from 'lucide-react'

const STEPS = [
  {
    id: 'welcome',
    icon: Feather,
    title: 'Come on in.',
    subtitle: 'I have a task for you.',
    body: "Axiom is a writer-first creative system. The AI is optional — always. You're in control of everything here. Start with the guided path to get your bearings, or explore freely and find your own way.",
    cta: 'Start Guided Path',
    showSkip: true,
  },
  {
    id: 'projects',
    icon: BookOpen,
    title: 'Projects & Series',
    subtitle: 'Everything in one place',
    body: 'Each book lives in its own Project. Projects hold your manuscript, characters, lore, plot threads, world map, and cover. Group books into a Series to track continuity across your entire saga.',
    cta: 'Got it',
  },
  {
    id: 'ai',
    icon: Zap,
    title: 'AI is optional here.',
    subtitle: 'Your creative partner — when you want one',
    body: 'Composer Mode co-writes scenes with you. Thread Detector finds forgotten plot threads. Momentum Engine generates character prompts. Every AI tool is user-triggered. Nothing happens unless you ask for it.',
    cta: 'Understood',
  },
  {
    id: 'genre',
    icon: Users,
    title: 'What do you write?',
    subtitle: 'Help us shape your experience',
    isForm: true,
  },
  {
    id: 'ready',
    icon: Rocket,
    title: "You've unlocked something new.",
    subtitle: 'Your workspace is ready',
    body: "Create a new project from the Projects page, or explore the dashboard to see what's possible. You can return to this guide at any time from Settings.",
    cta: 'Go to Dashboard',
  },
]

const GENRES = [
  'Fantasy', 'Science Fiction', 'Romance', 'Mystery / Thriller',
  'Horror', 'Literary Fiction', 'Historical Fiction', 'Young Adult',
  'Non-fiction', 'Other',
]

const EXPERIENCE = [
  'Just starting out',
  'Written 1–3 books',
  'Published author',
  'Professional / Full-time',
]

export default function OnboardingFlow({ onComplete }) {
  const { currentUser } = useAuth()
  const [step,       setStep]       = useState(0)
  const [genres,     setGenres]     = useState([])
  const [experience, setExperience] = useState('')
  const [saving,     setSaving]     = useState(false)

  function toggleGenre(g) {
    setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  async function advance() {
    const currentStep = STEPS[step]
    if (currentStep.id === 'ready') {
      await finish()
      return
    }
    setStep(s => s + 1)
  }

  async function skipToFreeExplore() {
    setSaving(true)
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        onboardingComplete:   true,
        onboardingSkipped:    true,
        onboardingGenres:     [],
        onboardingExperience: '',
        onboardingAt:         serverTimestamp(),
      }, { merge: true })
    } catch { /* non-critical */ }
    onComplete()
  }

  async function finish() {
    setSaving(true)
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        onboardingComplete:   true,
        onboardingSkipped:    false,
        onboardingGenres:     genres,
        onboardingExperience: experience,
        onboardingAt:         serverTimestamp(),
      }, { merge: true })
    } catch { /* non-critical */ }
    onComplete()
  }

  const current  = STEPS[step]
  const Icon     = current.icon
  const progress = (step / (STEPS.length - 1)) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-axiom-bg/95 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4">
        {/* Progress bar */}
        <div className="h-0.5 bg-axiom-border rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold-500 to-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="bg-axiom-surface border border-axiom-border rounded-2xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="w-14 h-14 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-6">
            <Icon className="w-6 h-6 text-gold-400" />
          </div>

          <h2 className="font-serif text-2xl text-slate-100 mb-1">{current.title}</h2>
          <p className="text-sm text-slate-500 mb-6">{current.subtitle}</p>

          {current.isForm ? (
            <div className="space-y-5">
              {/* Genre picker */}
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                  Genre(s) you write <span className="normal-case text-slate-600">(select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(g => (
                    <button
                      key={g}
                      onClick={() => toggleGenre(g)}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                        ${genres.includes(g)
                          ? 'bg-gold-500/20 border-gold-500/50 text-gold-300'
                          : 'bg-axiom-surface2 border-axiom-border text-slate-500 hover:text-slate-300'}
                      `}
                    >
                      {genres.includes(g) && <Check className="w-3 h-3 inline mr-1" />}
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience picker */}
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                  Your experience level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPERIENCE.map(e => (
                    <button
                      key={e}
                      onClick={() => setExperience(e)}
                      className={`
                        px-3 py-2 rounded-lg text-xs font-medium border transition-all text-left
                        ${experience === e
                          ? 'bg-teal-500/20 border-teal-500/50 text-teal-300'
                          : 'bg-axiom-surface2 border-axiom-border text-slate-500 hover:text-slate-300'}
                      `}
                    >
                      {experience === e && <Check className="w-3 h-3 inline mr-1" />}
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 leading-relaxed">{current.body}</p>
          )}

          <div className="flex items-center justify-between mt-8">
            {/* Step dots */}
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === step ? 'w-4 h-1.5 bg-gold-400' : 'w-1.5 h-1.5 bg-axiom-border'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              {/* Skip / explore freely — only on welcome step */}
              {current.showSkip && (
                <button
                  onClick={skipToFreeExplore}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-slate-500 hover:text-slate-300 text-sm transition-colors disabled:opacity-50"
                >
                  <Compass className="w-3.5 h-3.5" />
                  Let me explore freely
                </button>
              )}
              <button
                onClick={advance}
                disabled={saving}
                className="px-6 py-2.5 rounded-lg bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 border border-gold-500/30 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : (current.cta || 'Next')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
