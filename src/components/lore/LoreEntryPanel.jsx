import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Lock, Unlock, Trash2, Tag, X, Plus, User, MapPin, ExternalLink,
} from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import { useLoreEntry, FLEXIBILITY_OPTIONS } from '../../hooks/useLore'
import { useAutoSave } from '../../hooks/useAutoSave'
import { checkLoreContradiction } from '../../lib/claudeApi'
import ContradictionModal from './ContradictionModal'

export default function LoreEntryPanel({ projectId, entryId, onDelete, characters = [], allEntries = [] }) {
  const navigate = useNavigate()
  const { entry, loading, update } = useLoreEntry(projectId, entryId)

  const [title,       setTitle]       = useState('')
  const [category,    setCategory]    = useState('')
  const [flexibility, setFlexibility] = useState('flexible')
  const [tags,        setTags]        = useState([])
  const [tagInput,    setTagInput]    = useState('')
  const [relChars,    setRelChars]    = useState([])
  const [relLocs,     setRelLocs]     = useState([])
  const [saveStatus,  setSaveStatus]  = useState('saved')
  const [confirmDel,  setConfirmDel]  = useState(false)
  const [charSearch,  setCharSearch]  = useState('')
  const [locSearch,   setLocSearch]   = useState('')
  const [showCharPicker, setShowCharPicker] = useState(false)
  const [showLocPicker,  setShowLocPicker]  = useState(false)
  const [contradiction,   setContradiction]   = useState(null) // { conflicts, entryTitle }
  const [checkingContra,  setCheckingContra]  = useState(false)

  const contentRef = useRef('')

  // Sync local state when entry loads / changes
  useEffect(() => {
    if (!entry) return
    setTitle(entry.title || '')
    setCategory(entry.category || '')
    setFlexibility(entry.flexibility || 'flexible')
    setTags(entry.tags || [])
    setRelChars(entry.relatedCharacters || [])
    setRelLocs(entry.relatedLocations || [])
    contentRef.current = entry.content || ''
  }, [entry?.id]) // intentionally only re-sync on id change, not every field update

  // ── Auto-save for rich text content ───────────────────────────────────────
  const saveFn = useCallback(async () => {
    await update({ content: contentRef.current })

    // After save, check for contradictions in the background (non-blocking)
    if (!checkingContra && allEntries.length > 1 && contentRef.current.length > 100) {
      setCheckingContra(true)
      const currentEntry = { ...entry, content: contentRef.current }
      checkLoreContradiction(currentEntry, allEntries)
        .then(result => {
          if (result?.hasContradiction && result.conflicts?.length > 0) {
            setContradiction({ conflicts: result.conflicts, entryTitle: entry?.title || 'Untitled' })
          }
        })
        .catch(() => {})
        .finally(() => setCheckingContra(false))
    }
  }, [update, entry, allEntries, checkingContra])

  const { markUnsaved: markContentUnsaved } = useAutoSave(saveFn, 30_000)

  // ── TipTap editor ──────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, code: false }),
      Placeholder.configure({ placeholder: 'Describe this lore entry…' }),
      Typography,
    ],
    content: entry?.content || '',
    onUpdate({ editor }) {
      contentRef.current = editor.getHTML()
      markContentUnsaved()
      setSaveStatus('unsaved')
    },
  })

  // Update editor content when entry changes (navigating between entries)
  useEffect(() => {
    if (!editor || !entry) return
    const incoming = entry.content || ''
    if (incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, false)
      contentRef.current = incoming
    }
  }, [entry?.id]) // eslint-disable-line

  // ── Field save helpers ─────────────────────────────────────────────────────
  async function saveField(field, value) {
    setSaveStatus('saving')
    try {
      await update({ [field]: value })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('saved'), 1500)
    } catch {
      setSaveStatus('error')
    }
  }

  function handleTitleBlur() {
    if (title !== entry?.title) saveField('title', title)
  }

  function handleCategoryBlur() {
    if (category !== entry?.category) saveField('category', category)
  }

  async function toggleFlexibility() {
    const next = flexibility === 'locked' ? 'flexible' : 'locked'
    setFlexibility(next)
    await saveField('flexibility', next)
  }

  // ── Tags ───────────────────────────────────────────────────────────────────
  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (!t || tags.includes(t)) { setTagInput(''); return }
    const next = [...tags, t]
    setTags(next)
    saveField('tags', next)
    setTagInput('')
  }

  function removeTag(tag) {
    const next = tags.filter(t => t !== tag)
    setTags(next)
    saveField('tags', next)
  }

  // ── Related Characters ─────────────────────────────────────────────────────
  function addCharacter(charId) {
    if (relChars.includes(charId)) return
    const next = [...relChars, charId]
    setRelChars(next)
    saveField('relatedCharacters', next)
  }

  function removeCharacter(charId) {
    const next = relChars.filter(id => id !== charId)
    setRelChars(next)
    saveField('relatedCharacters', next)
  }

  // ── Related Locations (other lore entries) ─────────────────────────────────
  function addLocation(locId) {
    if (relLocs.includes(locId)) { return }
    const next = [...relLocs, locId]
    setRelLocs(next)
    saveField('relatedLocations', next)
  }

  function removeLocation(locId) {
    const next = relLocs.filter(id => id !== locId)
    setRelLocs(next)
    saveField('relatedLocations', next)
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete() {
    await onDelete(entryId)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
        Loading…
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
        Entry not found.
      </div>
    )
  }

  const flexOpt = FLEXIBILITY_OPTIONS.find(o => o.value === flexibility)

  const filteredChars = characters.filter(c =>
    !relChars.includes(c.id) &&
    (!charSearch || c.name?.toLowerCase().includes(charSearch.toLowerCase()))
  )

  const otherEntries = allEntries.filter(e =>
    e.id !== entryId &&
    !relLocs.includes(e.id) &&
    (!locSearch || e.title?.toLowerCase().includes(locSearch.toLowerCase()))
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* Entry header */}
      <div className="flex-shrink-0 border-b border-axiom-border px-6 py-4 bg-axiom-surface">
        <div className="flex items-start gap-3">

          {/* Title */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="Entry title"
              className="w-full bg-transparent text-xl font-serif font-semibold text-slate-100 placeholder-slate-600 focus:outline-none border-b border-transparent focus:border-gold-500/50 pb-0.5 transition-colors"
            />
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              onBlur={handleCategoryBlur}
              placeholder="Category (e.g. Factions, Locations…)"
              className="mt-1 w-full bg-transparent text-xs text-slate-500 placeholder-slate-700 focus:outline-none focus:text-slate-400 transition-colors"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Save status */}
            {saveStatus === 'saving' && <span className="text-[10px] text-slate-600">Saving…</span>}
            {saveStatus === 'error'  && <span className="text-[10px] text-red-500">Error</span>}

            {/* Flexibility toggle */}
            <button
              onClick={toggleFlexibility}
              title={flexOpt?.desc}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${flexOpt?.bg} ${flexOpt?.color}`}
            >
              {flexibility === 'locked'
                ? <Lock className="w-3 h-3" />
                : <Unlock className="w-3 h-3" />
              }
              {flexOpt?.label}
            </button>

            {/* Delete */}
            {confirmDel ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-red-400">Delete?</span>
                <button onClick={handleDelete} className="text-[10px] px-2 py-0.5 bg-red-500/20 border border-red-500/40 text-red-400 rounded hover:bg-red-500/30 transition-colors">
                  Yes
                </button>
                <button onClick={() => setConfirmDel(false)} className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDel(true)}
                className="btn-icon text-slate-600 hover:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Flexibility warning banner for locked entries */}
        {flexibility === 'locked' && (
          <div className="mt-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-red-500/8 border border-red-500/20 text-xs text-red-400/80">
            <Lock className="w-3 h-3 flex-shrink-0" />
            AI will not contradict or alter this entry when generating content.
          </div>
        )}
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5 max-w-3xl">

          {/* Rich text content */}
          <div className="lore-prose mb-6">
            <EditorContent editor={editor} />
          </div>

          <div className="space-y-5 border-t border-axiom-border pt-5">

            {/* Tags */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Tag className="w-3 h-3 text-slate-600" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tags</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-axiom-surface2 border border-axiom-border text-xs text-slate-400">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="text-slate-600 hover:text-slate-300 transition-colors">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  placeholder="Add tag…"
                  className="flex-1 bg-axiom-bg border border-axiom-border rounded-md px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-gold-500 transition-colors"
                />
                <button onClick={addTag} className="btn-ghost py-1 px-2 text-xs">
                  Add
                </button>
              </div>
            </div>

            {/* Related Characters */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3 text-slate-600" />
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Related Characters</span>
                </div>
                <button
                  onClick={() => { setShowCharPicker(p => !p); setCharSearch('') }}
                  className="text-xs text-slate-600 hover:text-teal-400 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Link
                </button>
              </div>

              {/* Linked characters */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {relChars.map(charId => {
                  const char = characters.find(c => c.id === charId)
                  if (!char) return null
                  return (
                    <div key={charId} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs text-teal-400">
                      <span>{char.name}</span>
                      <button
                        onClick={() => navigate(`/projects/${projectId}/characters/${charId}`)}
                        className="hover:text-teal-300 transition-colors"
                        title="Open character sheet"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                      <button onClick={() => removeCharacter(charId)} className="hover:text-red-400 transition-colors">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )
                })}
                {relChars.length === 0 && (
                  <span className="text-xs text-slate-700 italic">No characters linked</span>
                )}
              </div>

              {/* Character picker */}
              {showCharPicker && (
                <div className="border border-axiom-border rounded-lg bg-axiom-bg overflow-hidden">
                  <input
                    type="text"
                    value={charSearch}
                    onChange={e => setCharSearch(e.target.value)}
                    placeholder="Search characters…"
                    className="w-full px-3 py-2 text-xs text-slate-300 bg-transparent border-b border-axiom-border focus:outline-none placeholder-slate-600"
                    autoFocus
                  />
                  <div className="max-h-36 overflow-y-auto">
                    {filteredChars.length === 0 && (
                      <p className="px-3 py-2 text-xs text-slate-600 italic">No characters found</p>
                    )}
                    {filteredChars.map(char => (
                      <button
                        key={char.id}
                        onClick={() => { addCharacter(char.id); setShowCharPicker(false) }}
                        className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-axiom-surface2 transition-colors"
                      >
                        {char.name}
                        {char.role && <span className="ml-2 text-slate-600">({char.role})</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Related Locations / Lore Entries */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-slate-600" />
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Related Entries</span>
                </div>
                <button
                  onClick={() => { setShowLocPicker(p => !p); setLocSearch('') }}
                  className="text-xs text-slate-600 hover:text-gold-400 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Link
                </button>
              </div>

              {/* Linked entries */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {relLocs.map(locId => {
                  const loc = allEntries.find(e => e.id === locId)
                  if (!loc) return null
                  return (
                    <div key={locId} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gold-500/10 border border-gold-500/20 text-xs text-gold-400">
                      <span>{loc.title}</span>
                      {loc.category && <span className="text-gold-600 text-[10px]">({loc.category})</span>}
                      <button onClick={() => removeLocation(locId)} className="hover:text-red-400 transition-colors">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )
                })}
                {relLocs.length === 0 && (
                  <span className="text-xs text-slate-700 italic">No entries linked</span>
                )}
              </div>

              {/* Lore entry picker */}
              {showLocPicker && (
                <div className="border border-axiom-border rounded-lg bg-axiom-bg overflow-hidden">
                  <input
                    type="text"
                    value={locSearch}
                    onChange={e => setLocSearch(e.target.value)}
                    placeholder="Search lore entries…"
                    className="w-full px-3 py-2 text-xs text-slate-300 bg-transparent border-b border-axiom-border focus:outline-none placeholder-slate-600"
                    autoFocus
                  />
                  <div className="max-h-36 overflow-y-auto">
                    {otherEntries.length === 0 && (
                      <p className="px-3 py-2 text-xs text-slate-600 italic">No entries found</p>
                    )}
                    {otherEntries.map(e => (
                      <button
                        key={e.id}
                        onClick={() => { addLocation(e.id); setShowLocPicker(false) }}
                        className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-axiom-surface2 transition-colors"
                      >
                        {e.title}
                        {e.category && <span className="ml-2 text-slate-600">({e.category})</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
      {/* Contradiction modal */}
      {contradiction && (
        <ContradictionModal
          entryTitle={contradiction.entryTitle}
          conflicts={contradiction.conflicts}
          onIgnore={() => setContradiction(null)}
          onResolve={() => setContradiction(null)}
        />
      )}
    </div>
  )
}
