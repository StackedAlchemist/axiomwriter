import React, { useEffect, useRef, useCallback, useState } from 'react'
import RefinementMenu from '../composer/RefinementMenu'
import { refineText } from '../../lib/claudeApi'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Typography from '@tiptap/extension-typography'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import { Loader2, BookOpen, X } from 'lucide-react'
import { useAutoSave } from '../../hooks/useAutoSave'
import EditorToolbar from './EditorToolbar'
import { createLoreGapExtension, loreGapPluginKey } from '../../extensions/loreGapExtension'
import SceneMetaPanel from './SceneMetaPanel'

function countWords(text) {
  const t = (text || '').trim()
  return t ? t.split(/\s+/).length : 0
}

const TABS = [
  { id: 'write',   label: 'Write'   },
  { id: 'details', label: 'Details' },
  { id: 'notes',   label: 'Notes'   },
]

const SceneEditor = React.forwardRef(function SceneEditor({
  sceneId, sceneMeta, initialContent, sceneLoading,
  focusMode, onFocusExit,
  onSave, onSaveStatusChange, onUpdateMeta,
  loreTerms = [], onCreateLoreEntry,
  onToggleComposer, composerActive, onActivity, characters,
  threads, onLinkThread, onUnlinkThread,
  onLargePaste,
  activeTab: activeTabProp, onTabChange,
}, ref) {
  const scrollRef    = useRef(null)
  const contentRef   = useRef(initialContent ?? '')
  const wordCountRef = useRef(0)
  const [typewriter, setTypewriter] = useState(false)
  const [localWords, setLocalWords] = useState(0)
  const [gapPopover, setGapPopover] = useState(null)
  const [refinementMenu, setRefinementMenu] = useState(null)
  const [internalTab, setInternalTab] = useState('write')
  const [notesVal,   setNotesVal]   = useState(sceneMeta?.notes ?? '')
  const [splitDismissed, setSplitDismissed] = useState(false)

  // Tab state: controlled by the parent when provided, so the chosen tab
  // (e.g. Details) survives scene-to-scene navigation during a working pass.
  const activeTab    = activeTabProp ?? internalTab
  const setActiveTab = onTabChange ?? setInternalTab

  // Sync notes when scene changes (tab deliberately persists across scenes)
  useEffect(() => {
    setNotesVal(sceneMeta?.notes ?? '')
  }, [sceneId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync notes if sceneMeta updates externally
  useEffect(() => {
    setNotesVal(sceneMeta?.notes ?? '')
  }, [sceneMeta?.notes])

  // Expose insertContent to parent via ref
  React.useImperativeHandle(ref, () => ({
    insertContent: (text) => {
      if (!editor) return
      editor.chain().focus().insertContent(text).run()
    },
  }))

  const loreTermsRef  = useRef(new Set())
  const onGapClickRef = useRef(null)

  onGapClickRef.current = (term, pos) => setGapPopover({ term, ...pos })

  // Large-paste interception: a whole-manuscript paste should go through the
  // structured import flow, not become one giant scene. Ref keeps the editor
  // config stable while the callback stays fresh.
  const onLargePasteRef = useRef(null)
  onLargePasteRef.current = onLargePaste
  const LARGE_PASTE_WORDS = 5000

  // ── TipTap editor setup ────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, code: false }),
      Placeholder.configure({ placeholder: 'Begin your scene…' }),
      CharacterCount,
      Typography,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      createLoreGapExtension(loreTermsRef, onGapClickRef),
    ],
    content: initialContent || '',
    editorProps: {
      handlePaste(view, event) {
        const text = event.clipboardData?.getData('text/plain') || ''
        if (onLargePasteRef.current && countWords(text) >= LARGE_PASTE_WORDS) {
          event.preventDefault()
          onLargePasteRef.current(text)
          return true
        }
        return false // normal paste
      },
    },
    onUpdate({ editor }) {
      const html  = editor.getHTML()
      const words = countWords(editor.getText())
      contentRef.current   = html
      wordCountRef.current = words
      setLocalWords(words)
      markUnsaved()
      onActivity?.()

      if (typewriter) scrollToTypewriter(editor)
    },
    onSelectionUpdate({ editor }) {
      if (typewriter) scrollToTypewriter(editor)
      const { from, to } = editor.state.selection
      if (from === to) { setRefinementMenu(null); return }
      const selectedText = editor.state.doc.textBetween(from, to, ' ').trim()
      if (selectedText.length < 10) { setRefinementMenu(null); return }
      const coords = editor.view.coordsAtPos(from)
      setRefinementMenu({ x: coords.left, y: coords.top - 44, selectedText, from, to })
    },
  })

  // Seed the word count when the scene loads (onUpdate only fires on edits),
  // so the split-manuscript banner can appear on open, not just after typing.
  useEffect(() => {
    if (editor) setLocalWords(countWords(editor.getText()))
  }, [editor]) // eslint-disable-line react-hooks/exhaustive-deps

  const loreUpdateTimer = useRef(null)
  useEffect(() => {
    loreTermsRef.current = new Set((loreTerms || []).map(t => t.toLowerCase()))
    clearTimeout(loreUpdateTimer.current)
    loreUpdateTimer.current = setTimeout(() => {
      if (editor?.view) {
        try {
          editor.view.dispatch(
            editor.state.tr.setMeta(loreGapPluginKey, { force: true })
          )
        } catch {
          // editor may not be ready yet
        }
      }
    }, 500)
    return () => clearTimeout(loreUpdateTimer.current)
  }, [loreTerms, editor]) // eslint-disable-line

  useEffect(() => {
    if (!editor || sceneLoading) return
    const incoming = initialContent ?? ''
    if (incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, false)
      contentRef.current = incoming
    }
  }, [sceneLoading, initialContent]) // eslint-disable-line

  function scrollToTypewriter(editor) {
    const el = scrollRef.current
    if (!el) return
    const { view } = editor
    const { from } = view.state.selection
    const coords = view.coordsAtPos(from)
    const target = coords.top + el.scrollTop - el.clientHeight * 0.48
    el.scrollTo({ top: target, behavior: 'smooth' })
  }

  // ── Auto-save ──────────────────────────────────────────────────────────────
  const saveFn = useCallback(async () => {
    await onSave(sceneId, contentRef.current, wordCountRef.current)
    if (wordCountRef.current !== sceneMeta?.wordCount) {
      onUpdateMeta(sceneId, { wordCount: wordCountRef.current }).catch(() => {})
    }
  }, [sceneId, onSave, onUpdateMeta, sceneMeta?.wordCount])

  const { saveStatus, markUnsaved, saveNow } = useAutoSave(saveFn, 30_000)

  useEffect(() => { onSaveStatusChange(saveStatus) }, [saveStatus, onSaveStatusChange])

  // ── Focus mode keyboard shortcut ───────────────────────────────────────────
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && focusMode) onFocusExit() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focusMode, onFocusExit])

  // ── Scene title editing ────────────────────────────────────────────────────
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleVal,     setTitleVal]     = useState(sceneMeta?.title ?? '')

  useEffect(() => { setTitleVal(sceneMeta?.title ?? '') }, [sceneMeta?.title])

  function commitTitle() {
    setEditingTitle(false)
    if (titleVal.trim() && titleVal !== sceneMeta?.title) {
      onUpdateMeta(sceneId, { title: titleVal.trim() })
    }
  }

  function commitNotes() {
    if (notesVal !== (sceneMeta?.notes ?? '')) {
      onUpdateMeta(sceneId, { notes: notesVal })
    }
  }

  if (sceneLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-axiom-bg relative scene-editor-wrap">

      {/* Lore gap popover */}
      {gapPopover && (
        <div
          className="fixed z-50 bg-axiom-surface border border-gold-500/30 rounded-lg p-3 shadow-card text-sm animate-fade-in"
          style={{
            left: Math.min(gapPopover.x - 120, window.innerWidth - 280),
            top:  Math.max(gapPopover.y - 90, 8),
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <p className="text-slate-300 text-xs">
              No lore entry for{' '}
              <span className="text-gold-400 font-semibold">"{gapPopover.term}"</span>
            </p>
            <button onClick={() => setGapPopover(null)} className="text-slate-600 hover:text-slate-400 flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { onCreateLoreEntry?.(gapPopover.term); setGapPopover(null) }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-gold-500 hover:bg-gold-400 text-axiom-bg text-xs font-semibold rounded-md transition-colors"
            >
              <BookOpen className="w-3 h-3" />
              Add to Lore Bible
            </button>
            <button
              onClick={() => setGapPopover(null)}
              className="px-2 py-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Focus mode — minimal always-visible pill: word count + single exit.
          Replaces the hover-reveal status bar so focus mode is usable on touch. */}
      {focusMode && (
        <div
          className="fixed right-3 z-[120] flex items-center gap-3 px-3 py-1.5 rounded-full bg-axiom-surface/85 backdrop-blur-md border border-axiom-border shadow-card"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
          <span className="text-[11px] text-slate-400">
            <span className="text-slate-200 font-medium">{localWords.toLocaleString()}</span> words
          </span>
          <button
            onClick={onFocusExit}
            className="tap-target flex items-center gap-1 text-[11px] text-slate-400 hover:text-gold-400 transition-colors"
            title="Exit focus mode (Esc)"
          >
            <X className="w-3.5 h-3.5" /> Exit
          </button>
        </div>
      )}

      {/* Toolbar — only in Write tab; hidden in focus mode */}
      {activeTab === 'write' && (
        <div className={focusMode ? 'focus-mode-dim' : ''}>
          <EditorToolbar
            editor={editor}
            onToggleComposer={onToggleComposer}
            composerActive={composerActive}
          />
        </div>
      )}

      {/* Tab bar */}
      <div className={`flex items-center gap-1 px-6 border-b border-axiom-border bg-axiom-surface flex-shrink-0 ${focusMode ? 'focus-mode-dim' : ''}`}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px
              ${activeTab === tab.id
                ? 'text-gold-400 border-gold-400'
                : 'text-slate-600 border-transparent hover:text-slate-300'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Write tab — scene title + TipTap editor (always mounted, hidden when inactive) */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{ display: activeTab === 'write' ? undefined : 'none' }}
      >
        {/* Whole-manuscript recovery: a scene this big is almost certainly a
            full paste that skipped the import flow. Offer to split it. */}
        {!focusMode && !splitDismissed && localWords >= 8000 && onLargePaste && (
          <div className="mx-4 sm:mx-6 lg:mx-10 mt-4 w-auto flex items-center gap-3 px-4 py-3 rounded-xl bg-gold-500/10 border border-gold-500/30 flex-shrink-0">
            <BookOpen className="w-4 h-4 text-gold-400 flex-shrink-0" />
            <p className="flex-1 text-xs text-slate-300 leading-relaxed">
              This scene holds <span className="font-semibold text-gold-400">{localWords.toLocaleString()} words</span> — that looks like a whole manuscript.
              Want Axiom to detect the chapters and scenes and split it up?
            </p>
            <button
              onClick={() => onLargePaste(editor?.getText() || '')}
              className="btn-primary text-xs whitespace-nowrap flex-shrink-0"
            >
              Detect chapters
            </button>
            <button
              onClick={() => setSplitDismissed(true)}
              className="p-1 text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {/* Scene title — full available width */}
        <div className="writing-canvas px-5 sm:px-8 lg:px-12 xl:px-16 pt-8 pb-2 w-full">
          {editingTitle ? (
            <input
              autoFocus
              value={titleVal}
              onChange={e => setTitleVal(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={e => {
                if (e.key === 'Enter') commitTitle()
                if (e.key === 'Escape') { setTitleVal(sceneMeta?.title ?? ''); setEditingTitle(false) }
              }}
              className="w-full bg-transparent font-serif text-2xl font-semibold text-slate-100 outline-none border-b border-gold-500/40 pb-1"
            />
          ) : (
            <h2
              className="font-serif text-2xl font-semibold text-slate-200 cursor-text hover:text-slate-100 transition-colors select-none"
              onDoubleClick={() => setEditingTitle(true)}
              title="Double-click to rename"
            >
              {sceneMeta?.title || 'Untitled Scene'}
            </h2>
          )}
        </div>

        {/* Editor scroll area — border-to-border of the writing pane */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className={`writing-canvas w-full px-5 sm:px-8 lg:px-12 xl:px-16 pb-16 tiptap-prose ${typewriter ? 'typewriter-mode' : ''}`}>
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* AI Refinement menu */}
        {refinementMenu && (
          <RefinementMenu
            x={refinementMenu.x}
            y={refinementMenu.y}
            selectedText={refinementMenu.selectedText}
            characters={characters || []}
            onRefined={(refined) => {
              editor.chain()
                .focus()
                .setTextSelection({ from: refinementMenu.from, to: refinementMenu.to })
                .insertContent(refined)
                .run()
              setRefinementMenu(null)
            }}
            onClose={() => setRefinementMenu(null)}
          />
        )}
      </div>

      {/* Details tab */}
      {activeTab === 'details' && (
        <div className="flex-1 overflow-hidden">
          <SceneMetaPanel
            scene={sceneMeta}
            onUpdate={(updates) => onUpdateMeta(sceneId, updates)}
            threads={threads}
            onLinkThread={onLinkThread}
            onUnlinkThread={onUnlinkThread}
            characters={characters || []}
            showNotes={false}
          />
        </div>
      )}

      {/* Notes tab */}
      {activeTab === 'notes' && (
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 lg:px-12 xl:px-16">
          <div className="writing-canvas w-full">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">Scene Notes</p>
            <textarea
              value={notesVal}
              onChange={e => setNotesVal(e.target.value)}
              onBlur={commitNotes}
              placeholder="Private notes for this scene — ideas, reminders, continuity checks…"
              className="input-base text-sm resize-none leading-relaxed w-full min-h-[300px]"
            />
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className={`
        flex items-center justify-between px-6 py-2
        border-t border-axiom-border bg-axiom-surface/60 backdrop-blur-sm
        flex-shrink-0 transition-opacity duration-300
        ${focusMode ? 'focus-mode-dim' : ''}
      `}>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-600">
            <span className="text-slate-400 font-medium">{localWords.toLocaleString()}</span> words
          </span>
          {sceneMeta?.status && (
            <span className="text-xs text-slate-700 capitalize">{sceneMeta.status}</span>
          )}
          {sceneMeta?.povCharacter && (
            <span className="text-xs text-slate-700">POV: {sceneMeta.povCharacter}</span>
          )}
          {sceneMeta?.location && (
            <span className="text-xs text-slate-700 truncate max-w-[120px]">📍 {sceneMeta.location}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onCreateLoreEntry && loreTerms.length >= 0 && (
            <button
              onClick={() => onCreateLoreEntry?.('')}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-gold-400 transition-colors"
              title="Open Lore Bible"
            >
              <BookOpen className="w-3 h-3" />
              Lore
            </button>
          )}
          {activeTab === 'write' && (
            <button
              onClick={() => setTypewriter(p => !p)}
              className={`text-xs px-2 py-1 rounded transition-colors ${typewriter ? 'text-gold-400 bg-gold-500/10' : 'text-slate-600 hover:text-slate-400'}`}
              title="Typewriter scrolling"
            >
              ↕ Typewriter
            </button>
          )}
          <button
            onClick={saveNow}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            {saveStatus === 'saving'  && <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Saving…</span>}
            {saveStatus === 'unsaved' && 'Save now'}
            {saveStatus === 'saved'   && '● Saved'}
            {saveStatus === 'error'   && '⚠ Error'}
          </button>
        </div>
      </div>
    </div>
  )
})

export default SceneEditor
