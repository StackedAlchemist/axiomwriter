import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2, ChevronRight, ChevronDown, BookOpen, PlusCircle, Trash2, ClipboardPaste } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { detectStructureFromText } from '../../lib/structureDetect'

const genId = (prefix) => `${prefix}_${uuidv4().slice(0, 8)}`

function countWords(text) {
  const t = (text || '').trim()
  return t ? t.split(/\s+/).length : 0
}

/**
 * Parses mammoth HTML output into a manuscript structure + scene content map.
 * Detection strategy:
 *   - h1 present + h2 present  → h1=parts, h2=chapters, h3=scene-break
 *   - h1 present, no h2        → h1=chapters, h2/h3=scene-break
 *   - h2 present, no h1        → h2=chapters, h3=scene-break
 *   - Only h3                  → h3=chapters
 *   - No headings              → single chapter / single scene
 *   - <hr> or *** paragraphs   → scene break within chapter
 */
function parseDocxHtml(html) {
  const dom = new DOMParser().parseFromString(html, 'text/html')
  const body = dom.body

  const has = tag => body.querySelector(tag) !== null

  let chapterTag, sceneBreakTag
  if (has('h1') && has('h2'))      { chapterTag = 'h2'; sceneBreakTag = 'h3' }
  else if (has('h1'))              { chapterTag = 'h1'; sceneBreakTag = 'h2' }
  else if (has('h2'))              { chapterTag = 'h2'; sceneBreakTag = 'h3' }
  else if (has('h3'))              { chapterTag = 'h3'; sceneBreakTag = null }
  else                             { chapterTag = null; sceneBreakTag = null }

  const hasParts = has('h1') && has('h2')
  const partTag  = hasParts ? 'h1' : null

  const structure     = { hasParts, parts: [], chapters: [] }
  const sceneContents = {}

  let currentPart    = null
  let currentChapter = null
  let currentContent = []
  let sceneNum       = 1

  function isSceneBreak(el) {
    if (!el.tagName) return false
    if (el.tagName.toLowerCase() === 'hr') return true
    if (el.tagName.toLowerCase() === 'p') {
      const t = el.textContent.trim()
      return t === '***' || t === '* * *' || t === '---' || t === '#' || t === '§'
    }
    return false
  }

  function flushScene(titleOverride = null) {
    if (!currentChapter) return
    const contentHtml = currentContent.join('')
    if (!contentHtml.trim() && currentChapter.scenes.length > 0) return

    const sceneId   = genId('sc')
    const wordCount = countWords(new DOMParser().parseFromString(contentHtml, 'text/html').body.textContent || '')

    currentChapter.scenes.push({
      id: sceneId, title: titleOverride || `Scene ${sceneNum}`,
      wordCount, status: 'drafted', povCharacter: '', tags: [],
    })
    sceneContents[sceneId] = contentHtml
    currentContent = []
    sceneNum++
  }

  const elements = Array.from(body.children)

  if (!chapterTag) {
    const ch = { id: genId('ch'), title: 'Chapter One', scenes: [] }
    structure.chapters.push(ch)
    currentChapter = ch
    currentContent = elements.map(el => el.outerHTML)
    flushScene('Scene 1')
    return { structure, sceneContents }
  }

  for (const el of elements) {
    const tag = el.tagName?.toLowerCase()
    if (partTag && tag === partTag) {
      flushScene()
      currentPart = { id: genId('pt'), title: el.textContent.trim() || `Part ${structure.parts.length + 1}`, chapters: [] }
      structure.parts.push(currentPart)
      currentChapter = null
      sceneNum = 1
    } else if (tag === chapterTag) {
      flushScene()
      currentChapter = { id: genId('ch'), title: el.textContent.trim() || `Chapter ${structure.chapters.length + 1}`, scenes: [] }
      sceneNum = 1
      if (currentPart) currentPart.chapters.push(currentChapter)
      else structure.chapters.push(currentChapter)
    } else if (sceneBreakTag && tag === sceneBreakTag) {
      flushScene(el.textContent.trim() || null)
    } else if (isSceneBreak(el)) {
      flushScene()
    } else {
      if (!currentChapter) {
        currentChapter = { id: genId('ch'), title: 'Prelude', scenes: [] }
        if (currentPart) currentPart.chapters.push(currentChapter)
        else structure.chapters.push(currentChapter)
      }
      currentContent.push(el.outerHTML)
    }
  }

  flushScene()

  const cleanChapters = chs => chs.filter(ch => ch.scenes.length > 0)
  if (hasParts) {
    structure.parts = structure.parts
      .map(p => ({ ...p, chapters: cleanChapters(p.chapters) }))
      .filter(p => p.chapters.length > 0)
  } else {
    structure.chapters = cleanChapters(structure.chapters)
  }

  return { structure, sceneContents }
}

// ── Editable structure tree ────────────────────────────────────────────────────
function EditableTitle({ value, onChange }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)

  function commit() {
    setEditing(false)
    if (val.trim() && val !== value) onChange(val.trim())
    else setVal(value)
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setVal(value); setEditing(false) } }}
        className="bg-axiom-bg border border-gold-500/40 rounded px-2 py-0.5 text-xs text-slate-200 outline-none w-full max-w-[220px]"
      />
    )
  }
  return (
    <span
      className="text-xs text-slate-300 hover:text-gold-400 cursor-text transition-colors"
      title="Click to rename"
      onClick={() => setEditing(true)}
    >
      {value}
    </span>
  )
}

function ChapterNode({ chapter, onRenameChapter, onRenameScene, onDeleteChapter, canDelete }) {
  const [expanded, setExpanded] = useState(true)
  return (
    <div className="ml-2 group/chapter">
      <div className="flex items-center gap-1.5 py-1">
        <button onClick={() => setExpanded(p => !p)} className="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0">
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        <BookOpen className="w-3 h-3 text-teal-500 flex-shrink-0" />
        <EditableTitle value={chapter.title} onChange={title => onRenameChapter(chapter.id, title)} />
        <span className="text-[10px] text-slate-700 ml-1">{chapter.scenes.length} scene{chapter.scenes.length !== 1 ? 's' : ''}</span>
        {canDelete && (
          <button
            onClick={() => onDeleteChapter(chapter.id)}
            title="Don't import this chapter"
            className="ml-auto mr-1 p-0.5 rounded text-slate-700 opacity-0 group-hover/chapter:opacity-100 hover:text-red-400 transition-all flex-shrink-0"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
      {expanded && (
        <div className="ml-6 space-y-0.5">
          {chapter.scenes.map(scene => (
            <div key={scene.id} className="flex items-center gap-1.5 py-0.5">
              <div className="w-1 h-1 rounded-full bg-slate-700 flex-shrink-0" />
              <EditableTitle value={scene.title} onChange={title => onRenameScene(chapter.id, scene.id, title)} />
              {scene.wordCount > 0 && (
                <span className="text-[10px] text-slate-700">{scene.wordCount.toLocaleString()}w</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────────────────────────
// Accepts either a picked/dropped file (.docx, .txt, .md) or `initialText`
// (a large paste intercepted by the editor) — both land in the same preview.
export default function ImportDocxModal({ projectId, projectTitle, onClose, onImported, initialText }) {
  const fileRef = useRef(null)

  const [file,        setFile]        = useState(null)
  const [step,        setStep]        = useState(initialText ? 'parsing' : 'pick') // pick | parsing | preview | importing | done | error
  const [error,       setError]       = useState('')
  const [dragOver,    setDragOver]    = useState(false)
  const [importMode,  setImportMode]  = useState('replace') // 'replace' | 'append'
  const [fromPaste,   setFromPaste]   = useState(Boolean(initialText))

  // Editable parsed data
  const [structure,     setStructure]     = useState(null)
  const [sceneContents, setSceneContents] = useState(null)

  // Pasted-manuscript mode: detect structure immediately, skip the file step
  useEffect(() => {
    if (!initialText) return
    try {
      const parsed = detectStructureFromText(initialText)
      setStructure(parsed.structure)
      setSceneContents(parsed.sceneContents)
      setStep('preview')
    } catch (err) {
      console.error(err)
      setError('Could not detect structure in the pasted text.')
      setStep('error')
    }
  }, [initialText])

  // Derived counts from current structure
  const allChapters = structure
    ? (structure.hasParts ? structure.parts.flatMap(p => p.chapters) : structure.chapters)
    : []
  const sceneCount  = allChapters.reduce((s, ch) => s + ch.scenes.length, 0)
  const totalWords  = sceneContents
    ? Object.values(sceneContents).reduce((sum, html) => {
        return sum + countWords(new DOMParser().parseFromString(html, 'text/html').body.textContent || '')
      }, 0)
    : 0

  const processFile = useCallback(async (f) => {
    const name = f?.name?.toLowerCase() || ''
    const isDocx = name.endsWith('.docx')
    const isText = name.endsWith('.txt') || name.endsWith('.md')
    if (!f || (!isDocx && !isText)) {
      setError('Please select a .docx, .txt, or .md file.')
      return
    }
    setFile(f)
    setFromPaste(false)
    setStep('parsing')
    setError('')
    try {
      let parsed
      if (isDocx) {
        const mammoth = (await import('mammoth')).default
        const arrayBuffer = await f.arrayBuffer()
        const result = await mammoth.convertToHtml({ arrayBuffer })
        parsed = parseDocxHtml(result.value)
      } else {
        const text = await f.text()
        parsed = detectStructureFromText(text)
      }
      setStructure(parsed.structure)
      setSceneContents(parsed.sceneContents)
      setStep('preview')
    } catch (err) {
      console.error(err)
      setError(isDocx
        ? 'Failed to parse .docx file. Make sure it is a valid Word document.'
        : 'Failed to read the text file.')
      setStep('error')
    }
  }, [])

  function handleFileChange(e) { processFile(e.target.files[0]) }
  function handleDrop(e) {
    e.preventDefault(); setDragOver(false)
    processFile(e.dataTransfer.files[0])
  }

  // Rename helpers (mutate structure state immutably)
  function renameChapter(chapterId, title) {
    setStructure(prev => {
      if (!prev) return prev
      const update = chs => chs.map(ch => ch.id === chapterId ? { ...ch, title } : ch)
      if (prev.hasParts) {
        return { ...prev, parts: prev.parts.map(p => ({ ...p, chapters: update(p.chapters) })) }
      }
      return { ...prev, chapters: update(prev.chapters) }
    })
  }

  function deleteChapter(chapterId) {
    setStructure(prev => {
      if (!prev) return prev
      const drop = chs => chs.filter(ch => ch.id !== chapterId)
      if (prev.hasParts) {
        return {
          ...prev,
          parts: prev.parts.map(p => ({ ...p, chapters: drop(p.chapters) })).filter(p => p.chapters.length > 0),
          chapters: drop(prev.chapters),
        }
      }
      return { ...prev, chapters: drop(prev.chapters) }
    })
  }

  function renameScene(chapterId, sceneId, title) {
    setStructure(prev => {
      if (!prev) return prev
      const updateScenes = chs => chs.map(ch =>
        ch.id === chapterId
          ? { ...ch, scenes: ch.scenes.map(sc => sc.id === sceneId ? { ...sc, title } : sc) }
          : ch
      )
      if (prev.hasParts) {
        return { ...prev, parts: prev.parts.map(p => ({ ...p, chapters: updateScenes(p.chapters) })) }
      }
      return { ...prev, chapters: updateScenes(prev.chapters) }
    })
  }

  async function handleImport() {
    if (!structure || !sceneContents) return
    setStep('importing')
    try {
      await onImported(structure, sceneContents, importMode)
      setStep('done')
    } catch (err) {
      console.error(err)
      setError('Import failed. Please try again.')
      setStep('error')
    }
  }

  function reset() {
    setFile(null)
    setFromPaste(false)
    setStep('pick')
    setError('')
    setStructure(null)
    setSceneContents(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-axiom-surface border border-axiom-border rounded-2xl shadow-card w-full max-w-lg max-h-[90vh] flex flex-col animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-axiom-border flex-shrink-0">
          <div>
            <h2 className="font-serif text-lg font-semibold text-slate-100">
              {fromPaste ? 'Import pasted manuscript' : 'Import manuscript'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {projectTitle ? `Into: ${projectTitle}` : 'Auto-detects chapters, scenes, and structure'}
            </p>
          </div>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>

        {/* Progress indicator */}
        {(step === 'preview' || step === 'importing' || step === 'done') && (
          <div className="flex items-center gap-0 px-6 pt-4 flex-shrink-0">
            {[
              { label: 'Upload',  done: true },
              { label: 'Preview', done: step === 'importing' || step === 'done' },
              { label: 'Import',  done: step === 'done' },
            ].map(({ label, done }, i) => (
              <React.Fragment key={label}>
                <div className={`flex items-center gap-1.5 text-[10px] font-medium ${
                  (step === 'preview' && i === 1) || (step === 'importing' && i === 2)
                    ? 'text-gold-400' : done ? 'text-teal-400' : 'text-slate-600'
                }`}>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                    done ? 'border-teal-500 bg-teal-500/20' : 'border-axiom-border'
                  }`}>
                    {done && <CheckCircle className="w-2.5 h-2.5 text-teal-400" />}
                  </div>
                  {label}
                </div>
                {i < 2 && <div className="flex-1 h-px bg-axiom-border mx-2" />}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-5 min-h-0">

          {/* ── Pick / Error ── */}
          {(step === 'pick' || step === 'error') && (
            <>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200
                  ${dragOver
                    ? 'border-gold-500/60 bg-gold-500/5'
                    : 'border-axiom-border hover:border-axiom-border-light hover:bg-axiom-surface2'
                  }
                `}
              >
                <Upload className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-300 font-medium mb-1">Drop your .docx, .txt, or .md file here</p>
                <p className="text-xs text-slate-600">or click to browse — you can also paste a whole manuscript straight into any scene</p>
                <input ref={fileRef} type="file" accept=".docx,.txt,.md" className="hidden" onChange={handleFileChange} />
              </div>

              {error && (
                <div className="flex gap-2 items-start bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="card p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">How structure is detected</p>
                {[
                  ['Heading 1 + Heading 2',      'Parts → Chapters → Scenes'],
                  ['Heading styles (.docx)',      'Chapters → Scenes'],
                  ['"Chapter One", "Prologue"…',  'Chapters (paste / .txt / .md)'],
                  ['***, ---, or <hr>',           'Scene breaks within chapters'],
                  ['No headings',                 'Single chapter, single scene'],
                ].map(([cue, result]) => (
                  <div key={cue} className="flex items-center gap-2 text-xs">
                    <code className="bg-axiom-surface2 border border-axiom-border px-1.5 py-0.5 rounded text-teal-400 font-mono text-[11px]">{cue}</code>
                    <ChevronRight className="w-3 h-3 text-slate-700 flex-shrink-0" />
                    <span className="text-slate-500">{result}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Parsing ── */}
          {step === 'parsing' && (
            <div className="flex flex-col items-center py-10 gap-4">
              <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
              <p className="text-slate-400 text-sm">Parsing your document…</p>
            </div>
          )}

          {/* ── Preview ── */}
          {step === 'preview' && structure && (
            <>
              {/* File summary */}
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                  {fromPaste
                    ? <ClipboardPaste className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    : <FileText className="w-4 h-4 text-teal-400 flex-shrink-0" />}
                  <p className="text-sm font-medium text-slate-200 truncate">{fromPaste ? 'Pasted manuscript' : file?.name}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: structure.hasParts ? 'Parts' : 'Chapters', value: structure.hasParts ? structure.parts.length : allChapters.length },
                    { label: structure.hasParts ? 'Chapters' : 'Scenes',  value: structure.hasParts ? allChapters.length : sceneCount },
                    { label: structure.hasParts ? 'Scenes' : 'Est. Words', value: structure.hasParts ? sceneCount : (totalWords >= 1000 ? `${(totalWords/1000).toFixed(1)}k` : totalWords) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-axiom-surface2 rounded-lg p-2">
                      <p className="text-lg font-semibold text-slate-100 tabular-nums">{value}</p>
                      <p className="text-xs text-slate-600">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Editable structure tree */}
              <div>
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Structure preview — click any title to rename
                </p>
                <div className="card p-3 max-h-52 overflow-y-auto space-y-0.5">
                  {structure.hasParts ? (
                    structure.parts.map(part => (
                      <div key={part.id} className="mb-2">
                        <div className="flex items-center gap-1.5 py-1">
                          <PlusCircle className="w-3 h-3 text-gold-500 flex-shrink-0" />
                          <span className="text-xs font-semibold text-gold-400">{part.title}</span>
                        </div>
                        {part.chapters.map(ch => (
                          <ChapterNode
                            key={ch.id} chapter={ch}
                            onRenameChapter={renameChapter}
                            onRenameScene={renameScene}
                            onDeleteChapter={deleteChapter}
                            canDelete={allChapters.length > 1}
                          />
                        ))}
                      </div>
                    ))
                  ) : (
                    allChapters.map(ch => (
                      <ChapterNode
                        key={ch.id} chapter={ch}
                        onRenameChapter={renameChapter}
                        onRenameScene={renameScene}
                        onDeleteChapter={deleteChapter}
                        canDelete={allChapters.length > 1}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Import mode */}
              <div>
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Import mode</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setImportMode('append')}
                    className={`p-3 rounded-xl border text-left transition-all ${importMode === 'append' ? 'border-teal-500/40 bg-teal-500/10' : 'border-axiom-border hover:border-axiom-border-light'}`}
                  >
                    <p className={`text-xs font-semibold mb-0.5 ${importMode === 'append' ? 'text-teal-400' : 'text-slate-300'}`}>Append</p>
                    <p className="text-[10px] text-slate-600 leading-relaxed">Add scenes to your existing manuscript without removing anything</p>
                  </button>
                  <button
                    onClick={() => setImportMode('replace')}
                    className={`p-3 rounded-xl border text-left transition-all ${importMode === 'replace' ? 'border-red-500/40 bg-red-500/10' : 'border-axiom-border hover:border-axiom-border-light'}`}
                  >
                    <p className={`text-xs font-semibold mb-0.5 ${importMode === 'replace' ? 'text-red-400' : 'text-slate-300'}`}>Replace</p>
                    <p className="text-[10px] text-slate-600 leading-relaxed">Overwrite current manuscript structure with this document</p>
                  </button>
                </div>
                {importMode === 'replace' && (
                  <p className="text-[10px] text-amber-400 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Existing scenes will be permanently overwritten.
                  </p>
                )}
              </div>
            </>
          )}

          {/* ── Importing ── */}
          {step === 'importing' && (
            <div className="flex flex-col items-center py-10 gap-4">
              <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
              <p className="text-slate-400 text-sm">Importing {sceneCount} scenes…</p>
            </div>
          )}

          {/* ── Done ── */}
          {step === 'done' && (
            <div className="flex flex-col items-center py-10 gap-4">
              <CheckCircle className="w-10 h-10 text-teal-400" />
              <div className="text-center">
                <p className="text-slate-200 font-medium mb-1">Import complete!</p>
                <p className="text-slate-500 text-sm">{allChapters.length} chapters · {sceneCount} scenes imported</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3 flex-shrink-0 border-t border-axiom-border pt-4">
          {step === 'done' ? (
            <button onClick={onClose} className="btn-primary flex-1">Open manuscript</button>
          ) : step === 'preview' ? (
            <>
              <button onClick={reset} className="btn-secondary flex-1">Choose different file</button>
              <button onClick={handleImport} className={`flex-1 ${importMode === 'replace' ? 'btn-primary' : 'btn-primary'}`}>
                {importMode === 'append' ? 'Append to manuscript' : 'Replace manuscript'}
              </button>
            </>
          ) : (
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          )}
        </div>
      </div>
    </div>
  )
}
