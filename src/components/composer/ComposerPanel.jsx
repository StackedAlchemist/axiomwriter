import React, { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import {
  X, Wand2, Loader2, RotateCcw, Check, GitMerge, ChevronDown,
} from 'lucide-react'
import { db } from '../../firebase/config'
import { getAllChapters } from '../../hooks/useManuscript'
import { buildLoreContext } from '../../hooks/useLore'
import { generateSceneDrafts } from '../../lib/claudeApi'

const TONES = ['Tense', 'Hopeful', 'Melancholic', 'Joyful', 'Fearful', 'Angry', 'Romantic', 'Mysterious']
const ROLES = ['Setup', 'Inciting Incident', 'Rising Action', 'Climax', 'Falling Action', 'Resolution']

function buildVoiceDNA(characterIds, characters) {
  return characterIds
    .map(id => {
      const c = characters.find(ch => ch.id === id)
      if (!c || !c.voiceDna) return null
      const v = c.voiceDna
      return [
        `${c.name}:`,
        v.speechPatterns      ? `  Speech: ${v.speechPatterns}` : null,
        v.vocabularyLevel     ? `  Vocab: ${v.vocabularyLevel}` : null,
        v.commonPhrases?.length ? `  Says: ${v.commonPhrases.join(', ')}` : null,
        v.neverSayPhrases?.length ? `  Never says: ${v.neverSayPhrases.join(', ')}` : null,
        v.humorStyle          ? `  Humor: ${v.humorStyle}` : null,
        v.tellsLying          ? `  When lying: ${v.tellsLying}` : null,
        v.tellsStressed       ? `  When stressed: ${v.tellsStressed}` : null,
      ].filter(Boolean).join('\n')
    })
    .filter(Boolean)
    .join('\n\n')
}

function TextArea({ label, value, onChange, placeholder, required, rows = 3 }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
        {label}{required && <span className="text-gold-500 ml-0.5">*</span>}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-axiom-bg border border-axiom-border rounded-md px-3 py-2 text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:border-gold-500 resize-none transition-colors"
      />
    </div>
  )
}

function Select({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-axiom-bg border border-axiom-border rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-gold-500 transition-colors appearance-none"
      >
        <option value="">{placeholder || 'Select…'}</option>
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}

export default function ComposerPanel({
  projectId,
  activeSceneId,
  structure,
  loreEntries,
  characters,
  editorRef,
  onClose,
}) {
  // Intent form
  const [whatMustHappen,  setWhatMustHappen]  = useState('')
  const [povCharacter,    setPovCharacter]    = useState('')
  const [emotionalTone,   setEmotionalTone]   = useState('')
  const [readerFeeling,   setReaderFeeling]   = useState('')
  const [dialogueBeats,   setDialogueBeats]   = useState('')
  const [sceneRole,       setSceneRole]       = useState('')
  const [sceneChars,      setSceneChars]      = useState([])  // characterIds
  const [location,        setLocation]        = useState('')
  const [prevScene,       setPrevScene]       = useState('')

  // Generation
  const [generating, setGenerating] = useState(false)
  const [drafts,     setDrafts]     = useState(null)   // { draftA, draftB }
  const [activeTab,  setActiveTab]  = useState('A')
  const [error,      setError]      = useState('')

  // Merge view
  const [showMerge, setShowMerge] = useState(false)

  // Lore locations for autocomplete
  const locationSuggestions = loreEntries
    .filter(e => e.category?.toLowerCase().includes('location'))
    .map(e => e.title)

  // Auto-fill previous scene on mount / scene change
  useEffect(() => {
    if (!activeSceneId || !structure) return
    const chapters = getAllChapters(structure)
    let prevId = null
    outer: for (const ch of chapters) {
      for (let i = 0; i < (ch.scenes || []).length; i++) {
        if (ch.scenes[i].id === activeSceneId && i > 0) {
          prevId = ch.scenes[i - 1].id
          break outer
        }
      }
    }
    if (!prevId) { setPrevScene(''); return }
    getDoc(doc(db, 'projects', projectId, 'scenes', prevId))
      .then(snap => {
        if (snap.exists()) {
          const text = (snap.data().content || '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 600)
          setPrevScene(text)
        }
      })
      .catch(() => {})
  }, [activeSceneId, structure, projectId])

  const toggleCharacter = (charId) => {
    setSceneChars(prev =>
      prev.includes(charId) ? prev.filter(id => id !== charId) : [...prev, charId]
    )
  }

  const handleGenerate = useCallback(async () => {
    if (!whatMustHappen.trim()) { setError('Describe what must happen in this scene.'); return }
    setError('')
    setGenerating(true)
    setDrafts(null)

    try {
      // Build context
      const loreCtx = buildLoreContext(loreEntries)
      const lockedParts  = loreEntries.filter(e => e.flexibility === 'locked')
      const flexParts    = loreEntries.filter(e => e.flexibility !== 'locked')

      const lockedLore  = lockedParts.map(e => `[${e.category || 'Lore'}] ${e.title}: ${(e.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 400)}`).join('\n')
      const flexibleLore = flexParts.map(e => `[${e.category || 'Lore'}] ${e.title}: ${(e.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 200)}`).join('\n')

      const voiceDNA = buildVoiceDNA(sceneChars, characters)

      // Fetch style notes from project doc
      let styleNotes = ''
      try {
        const projSnap = await getDoc(doc(db, 'projects', projectId))
        if (projSnap.exists()) styleNotes = projSnap.data().proseStyleNotes || ''
      } catch {}

      const charNames = sceneChars
        .map(id => characters.find(c => c.id === id)?.name)
        .filter(Boolean)
        .join(', ')

      const result = await generateSceneDrafts({
        intent: {
          whatMustHappen,
          povCharacter: characters.find(c => c.id === povCharacter)?.name || povCharacter,
          emotionalTone,
          readerFeeling,
          dialogueBeats,
          sceneRole,
          characters: charNames,
          location,
        },
        lockedLore,
        flexibleLore,
        voiceDNA,
        previousScene: prevScene,
        styleNotes,
      })

      if (!result) return // shouldn't happen, but guard against empty intent
      setDrafts(result)
      setActiveTab('A')

      // Increment accepted draft counter (for style analysis trigger)
      try {
        const projSnap = await getDoc(doc(db, 'projects', projectId))
        if (projSnap.exists()) {
          const count = (projSnap.data().draftGenerationCount || 0) + 1
          await updateDoc(doc(db, 'projects', projectId), { draftGenerationCount: count })
        }
      } catch {}
    } catch (err) {
      setError(err.message || 'Generation failed.')
    } finally {
      setGenerating(false)
    }
  }, [whatMustHappen, povCharacter, emotionalTone, readerFeeling, dialogueBeats, sceneRole, sceneChars, location, prevScene, loreEntries, characters, projectId])

  const handleAccept = () => {
    const text = activeTab === 'A' ? drafts.draftA : drafts.draftB
    if (text && editorRef?.current) {
      editorRef.current.insertContent(text)
    }
  }

  const activeDraft = drafts ? (activeTab === 'A' ? drafts.draftA : drafts.draftB) : ''

  return (
    <div className="flex flex-col border-l border-axiom-border bg-axiom-surface overflow-hidden
      fixed inset-0 top-12 z-40 w-full
      md:static md:inset-auto md:top-auto md:z-auto md:w-[380px] md:flex-shrink-0">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-axiom-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-gold-400" />
          <span className="font-semibold text-sm text-slate-100">Composer Mode</span>
        </div>
        <button onClick={onClose} className="btn-icon text-slate-600 hover:text-slate-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable form + results */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">

          {/* WHAT NEEDS TO HAPPEN */}
          <TextArea
            label="What must happen in this scene"
            value={whatMustHappen}
            onChange={setWhatMustHappen}
            placeholder="The protagonist discovers the betrayal, confronts their mentor, and is left with no allies…"
            required
            rows={4}
          />

          {/* SCENE DETAILS */}
          <div className="border-t border-axiom-border pt-4">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-3">Scene Details</p>
            <div className="space-y-3">

              {/* POV Character */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  POV Character
                </label>
                <select
                  value={povCharacter}
                  onChange={e => setPovCharacter(e.target.value)}
                  className="w-full bg-axiom-bg border border-axiom-border rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-gold-500 transition-colors"
                >
                  <option value="">None specified</option>
                  {characters.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <Select label="Emotional Tone" value={emotionalTone} onChange={setEmotionalTone} options={TONES} placeholder="Not specified" />
              <TextArea label="Reader should feel by the end" value={readerFeeling} onChange={setReaderFeeling} placeholder="Dread mixed with reluctant hope…" rows={2} />
              <TextArea label="Specific dialogue or beats to include" value={dialogueBeats} onChange={setDialogueBeats} placeholder="She finally says 'I never trusted you'…" rows={2} />
              <Select label="Scene Role" value={sceneRole} onChange={setSceneRole} options={ROLES} placeholder="Not specified" />
            </div>
          </div>

          {/* CONTEXT INJECTION */}
          <div className="border-t border-axiom-border pt-4">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-3">Context Injection</p>
            <div className="space-y-3">

              {/* Characters multi-select */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Characters in this scene
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {characters.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCharacter(c.id)}
                      className={`px-2 py-1 rounded text-xs border transition-all ${
                        sceneChars.includes(c.id)
                          ? 'bg-gold-500/20 border-gold-500/40 text-gold-400'
                          : 'bg-axiom-bg border-axiom-border text-slate-500 hover:border-axiom-border-light hover:text-slate-300'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                  {characters.length === 0 && (
                    <span className="text-xs text-slate-700 italic">No characters yet</span>
                  )}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Location
                </label>
                <input
                  list="location-suggestions"
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="The Broken Spire, Chapter 3 tavern…"
                  className="w-full bg-axiom-bg border border-axiom-border rounded-md px-3 py-2 text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:border-gold-500 transition-colors"
                />
                <datalist id="location-suggestions">
                  {locationSuggestions.map(l => <option key={l} value={l} />)}
                </datalist>
              </div>

              {/* Previous scene */}
              <TextArea
                label="Previous scene summary (auto-filled, editable)"
                value={prevScene}
                onChange={setPrevScene}
                placeholder="No previous scene found…"
                rows={3}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Drafts */}
        {drafts && (
          <div className="border-t border-axiom-border">
            {/* Draft tabs */}
            <div className="flex border-b border-axiom-border">
              {['A', 'B'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                    activeTab === tab
                      ? 'text-gold-400 border-b-2 border-gold-500 -mb-px bg-gold-500/5'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  DRAFT {tab}
                </button>
              ))}
            </div>

            {/* Draft content */}
            <div className="px-4 py-3 max-h-80 overflow-y-auto">
              <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap font-serif">
                {activeDraft || <span className="italic text-slate-600">No content generated for this draft.</span>}
              </p>
            </div>

            {/* Draft actions */}
            <div className="flex gap-2 px-4 pb-4">
              <button
                onClick={handleAccept}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gold-500 hover:bg-gold-400 text-axiom-bg text-xs font-semibold rounded-md transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Accept Draft {activeTab}
              </button>
              <button
                onClick={() => setShowMerge(true)}
                className="px-3 py-2 btn-secondary text-xs flex items-center gap-1"
                title="Compare both drafts side by side"
              >
                <GitMerge className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-3 py-2 btn-secondary text-xs flex items-center gap-1"
                title="Regenerate both drafts"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {/* Bottom padding */}
        <div className="h-4" />
      </div>

      {/* Generate button — sticky at bottom */}
      {!drafts && (
        <div className="px-4 pb-4 pt-2 border-t border-axiom-border flex-shrink-0">
          <button
            onClick={handleGenerate}
            disabled={generating || !whatMustHappen.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed text-axiom-bg text-sm font-semibold rounded-md transition-colors"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
            ) : (
              <><Wand2 className="w-4 h-4" /> Generate Scene</>
            )}
          </button>
        </div>
      )}

      {/* Merge modal */}
      {showMerge && drafts && (
        <MergeModal
          draftA={drafts.draftA}
          draftB={drafts.draftB}
          onClose={() => setShowMerge(false)}
          onAccept={(text) => {
            if (editorRef?.current) editorRef.current.insertContent(text)
            setShowMerge(false)
          }}
        />
      )}
    </div>
  )
}

function MergeModal({ draftA, draftB, onClose, onAccept }) {
  const [selected, setSelected] = useState('A')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-axiom-surface border border-axiom-border rounded-xl w-full max-w-5xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-axiom-border">
          <span className="font-semibold text-slate-100">Compare Drafts</span>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 grid grid-cols-2 overflow-hidden divide-x divide-axiom-border">
          {[['A', draftA], ['B', draftB]].map(([label, text]) => (
            <div
              key={label}
              onClick={() => setSelected(label)}
              className={`flex flex-col overflow-hidden cursor-pointer transition-all ${selected === label ? 'ring-2 ring-gold-500/40 ring-inset' : ''}`}
            >
              <div className={`px-4 py-2 border-b border-axiom-border text-xs font-semibold flex items-center gap-2 ${selected === label ? 'text-gold-400 bg-gold-500/5' : 'text-slate-500'}`}>
                {selected === label && <Check className="w-3 h-3" />}
                DRAFT {label}
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-serif">{text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 p-4 border-t border-axiom-border">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={() => onAccept(selected === 'A' ? draftA : draftB)}
            className="btn-primary flex items-center gap-2"
          >
            <Check className="w-3.5 h-3.5" />
            Accept Draft {selected}
          </button>
        </div>
      </div>
    </div>
  )
}
