import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import { DOMSerializer } from '@tiptap/pm/model'
import { Pencil, Loader2, Scissors, Plus } from 'lucide-react'

/**
 * Chapter writing view — the whole chapter as one continuous document.
 * Each scene is its own live editor stacked in a single scroll; slim divider
 * bars mark scene boundaries. "Scene break" (button or Ctrl+Enter) splits the
 * scene at the cursor: everything after the cursor becomes a new scene that
 * appears in the sidebar immediately. No more scene-hopping to write a chapter.
 */

const STATUS_DOT = {
  planned:  'bg-slate-600',
  drafted:  'bg-teal-500',
  revised:  'bg-gold-500',
  locked:   'bg-purple-500',
}

// Same typography as the single-scene editor (.tiptap-prose in index.css),
// minus the full-page scroll padding.
const PROSE_CLASSES = 'tiptap-prose tiptap-inline'

function countWords(text) {
  const t = (text || '').trim()
  return t ? t.split(/\s+/).filter(Boolean).length : 0
}

function htmlWordCount(html) {
  return countWords((html || '').replace(/<[^>]+>/g, ' '))
}

// Serializes a ProseMirror node's content back to HTML
function nodeToHtml(node, schema) {
  const div = document.createElement('div')
  div.appendChild(DOMSerializer.fromSchema(schema).serializeFragment(node.content))
  return div.innerHTML
}

// ── One scene = one editor ─────────────────────────────────────────────────────
function SceneBlock({
  scene, index, initialContent, autoFocus,
  onSave, onSplit, onEditScene, onSaveStatusChange,
}) {
  const [words, setWords] = useState(() => htmlWordCount(initialContent))
  const saveTimer = useRef(null)
  const dirtyRef  = useRef(false)
  const latest    = useRef({})

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, code: false }),
      Placeholder.configure({ placeholder: index === 0 ? 'Begin the chapter…' : 'Continue writing…' }),
      Typography,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: initialContent || '',
    editorProps: {
      handleKeyDown(view, event) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          event.preventDefault()
          latest.current.split?.()
          return true
        }
        return false
      },
    },
    onUpdate({ editor }) {
      const w = countWords(editor.getText())
      setWords(w)
      dirtyRef.current = true
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => latest.current.flush?.(), 900)
    },
  })

  const flush = useCallback(async () => {
    if (!editor || editor.isDestroyed || !dirtyRef.current) return
    dirtyRef.current = false
    clearTimeout(saveTimer.current)
    try {
      onSaveStatusChange?.('saving')
      await onSave(scene.id, editor.getHTML(), countWords(editor.getText()))
      onSaveStatusChange?.('saved')
    } catch (err) {
      console.error('[ChapterView] save failed:', err)
      dirtyRef.current = true
      onSaveStatusChange?.('error')
    }
  }, [editor, scene.id, onSave, onSaveStatusChange])

  latest.current = {
    flush,
    split: () => editor && !editor.isDestroyed && onSplit(scene, editor, flush),
  }

  // Flush pending edits when this block unmounts (chapter switch, etc.)
  useEffect(() => () => { latest.current.flush?.() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Focus the newly created scene after a split
  useEffect(() => {
    if (autoFocus && editor) {
      const t = setTimeout(() => editor.commands.focus('start'), 60)
      return () => clearTimeout(t)
    }
  }, [autoFocus, editor])

  return (
    <div className="mb-4">
      {/* Scene divider */}
      <div className="flex items-center gap-3 mb-2 group sticky top-0 bg-axiom-bg/95 backdrop-blur-sm py-1.5 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[scene.status] ?? STATUS_DOT.planned}`} />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
            Scene {index + 1}
          </span>
          {scene.title && scene.title !== `Scene ${index + 1}` && scene.title !== 'Untitled Scene' && (
            <span className="text-xs text-slate-600 truncate">— {scene.title}</span>
          )}
        </div>
        <div className="flex-1 h-px bg-axiom-border" />
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] text-slate-700 whitespace-nowrap">
            {words > 0 ? `${words.toLocaleString()} words` : 'empty'}
          </span>
          <button
            onClick={() => latest.current.split?.()}
            title="Split into a new scene at the cursor (Ctrl+Enter)"
            className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-slate-500 hover:text-teal-400 border border-axiom-border hover:border-teal-500/30 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <Scissors className="w-2.5 h-2.5" />
            Scene break
          </button>
          <button
            onClick={() => onEditScene(scene.id)}
            title="Open this scene alone (Details, Notes, Composer)"
            className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-slate-500 hover:text-gold-400 border border-axiom-border hover:border-gold-500/30 rounded transition-colors"
          >
            <Pencil className="w-2.5 h-2.5" />
            Edit scene
          </button>
        </div>
      </div>

      {/* Live editor */}
      <div className={PROSE_CLASSES} onBlur={() => latest.current.flush?.()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

// ── Chapter view ───────────────────────────────────────────────────────────────
export default function ChapterView({
  chapter, sceneContents, loading,
  onEditScene, onSaveScene, onInsertSceneAfter, onSaveStatusChange,
}) {
  // Contents for scenes created in this session (splits/additions) — the
  // parent's fetched map doesn't know about them yet.
  const [localContents, setLocalContents] = useState({})
  const [focusSceneId,  setFocusSceneId]  = useState(null)
  const [splitting,     setSplitting]     = useState(false)

  // Reset session-local state when switching chapters
  useEffect(() => {
    setLocalContents({})
    setFocusSceneId(null)
  }, [chapter?.id])

  const handleSplit = useCallback(async (scene, editor, flushScene) => {
    if (splitting || !chapter) return
    setSplitting(true)
    try {
      const { state } = editor
      const pos    = state.selection.to
      const before = state.doc.cut(0, pos)
      const after  = state.doc.cut(pos)
      const beforeHtml = nodeToHtml(before, state.schema)
      const afterHtml  = nodeToHtml(after, state.schema)
      const beforeWords = countWords(before.textBetween(0, before.content.size, ' '))
      const afterWords  = countWords(after.textBetween(0, after.content.size, ' '))

      // Current scene keeps everything before the cursor
      editor.commands.setContent(beforeHtml)
      await onSaveScene(scene.id, beforeHtml, beforeWords)

      // Everything after the cursor becomes the new scene
      const newScene = await onInsertSceneAfter(chapter.id, scene.id, {
        content: afterHtml,
        wordCount: afterWords,
      })
      setLocalContents(prev => ({ ...prev, [newScene.id]: { content: afterHtml } }))
      setFocusSceneId(newScene.id)
    } catch (err) {
      console.error('[ChapterView] split failed:', err)
    } finally {
      setSplitting(false)
    }
  }, [chapter, splitting, onSaveScene, onInsertSceneAfter])

  const handleAddSceneAtEnd = useCallback(async () => {
    if (!chapter) return
    const last = chapter.scenes?.[chapter.scenes.length - 1]
    const newScene = await onInsertSceneAfter(chapter.id, last?.id ?? null, {})
    setLocalContents(prev => ({ ...prev, [newScene.id]: { content: '' } }))
    setFocusSceneId(newScene.id)
  }, [chapter, onInsertSceneAfter])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
      </div>
    )
  }

  if (!chapter) return null

  const scenes = chapter.scenes || []
  const totalWords = scenes.reduce((s, sc) => s + (sc.wordCount || 0), 0)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[740px] mx-auto px-4 sm:px-8 py-10">

        {/* Chapter header */}
        <h1 className="font-serif text-3xl text-slate-200 mb-2">{chapter.title}</h1>
        <p className="text-xs text-slate-600 mb-8">
          {scenes.length} scene{scenes.length !== 1 ? 's' : ''} · {totalWords.toLocaleString()} words
          <span className="text-slate-700"> · write straight through — Ctrl+Enter starts a new scene at the cursor</span>
        </p>

        {scenes.length === 0 && (
          <div className="text-slate-600 text-sm italic mb-6">No scenes yet — add one below and start writing.</div>
        )}

        {scenes.map((scene, i) => {
          const content = localContents[scene.id]?.content ?? sceneContents[scene.id]?.content ?? ''
          return (
            <SceneBlock
              key={scene.id}
              scene={scene}
              index={i}
              initialContent={content}
              autoFocus={focusSceneId === scene.id}
              onSave={onSaveScene}
              onSplit={handleSplit}
              onEditScene={onEditScene}
              onSaveStatusChange={onSaveStatusChange}
            />
          )
        })}

        {/* Add a scene at the end of the chapter */}
        <button
          onClick={handleAddSceneAtEnd}
          className="mt-2 mb-16 flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 hover:text-teal-400 border border-dashed border-axiom-border hover:border-teal-500/30 rounded-lg transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add scene
        </button>
      </div>
    </div>
  )
}
