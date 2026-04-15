import React, { useState } from 'react'
import { X, Download, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { getAllChapters } from '../../hooks/useManuscript'

// ── HTML → docx paragraph converter ──────────────────────────────────────────

function buildTextRuns(node, style, { TextRun }) {
  const runs = []
  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      const text = child.textContent
      if (!text) continue
      runs.push(new TextRun({
        text,
        bold:      style.bold      || undefined,
        italics:   style.italics   || undefined,
        underline: style.underline ? {} : undefined,
        strike:    style.strike    || undefined,
        font:      'Times New Roman',
        size:      24,
      }))
    } else if (child.nodeType === 1) {
      const tag = child.tagName.toLowerCase()
      const next = { ...style }
      if (tag === 'strong' || tag === 'b') next.bold = true
      if (tag === 'em'     || tag === 'i') next.italics = true
      if (tag === 'u')                     next.underline = true
      if (tag === 's'      || tag === 'del' || tag === 'strike') next.strike = true
      runs.push(...buildTextRuns(child, next, { TextRun }))
    }
  }
  return runs
}

function htmlToParagraphs(html, { Paragraph, TextRun, AlignmentType }) {
  if (!html) return []
  const dom = new DOMParser().parseFromString(html, 'text/html')
  const results = []

  const DOUBLE = { line: 480, before: 0, after: 0 }
  const BODY_INDENT = { firstLine: 720 }

  function processEl(el) {
    const tag = el.tagName?.toLowerCase()
    if (!tag) return

    if (tag === 'p') {
      const runs = buildTextRuns(el, {}, { TextRun })
      if (runs.length === 0 && !el.textContent.trim()) return
      if (runs.length === 0) runs.push(new TextRun({ text: '', font: 'Times New Roman', size: 24 }))
      results.push(new Paragraph({
        children: runs,
        spacing:  DOUBLE,
        indent:   BODY_INDENT,
      }))
    } else if (tag === 'h1') {
      results.push(new Paragraph({
        children:  [new TextRun({ text: el.textContent, bold: true, size: 32, font: 'Times New Roman' })],
        alignment: AlignmentType.CENTER,
        spacing:   { line: 480, before: 480, after: 240 },
      }))
    } else if (tag === 'h2') {
      results.push(new Paragraph({
        children: [new TextRun({ text: el.textContent, bold: true, size: 28, font: 'Times New Roman' })],
        spacing:  { line: 480, before: 480, after: 240 },
      }))
    } else if (tag === 'h3') {
      results.push(new Paragraph({
        children: [new TextRun({ text: el.textContent, bold: true, italics: true, size: 24, font: 'Times New Roman' })],
        spacing:  { line: 480, before: 240, after: 120 },
      }))
    } else if (tag === 'hr') {
      results.push(new Paragraph({
        children:  [new TextRun({ text: '* * *', font: 'Times New Roman', size: 24 })],
        alignment: AlignmentType.CENTER,
        spacing:   { line: 480, before: 240, after: 240 },
      }))
    } else if (tag === 'blockquote') {
      // TipTap nests <p> inside <blockquote>
      for (const child of el.children) {
        const runs = buildTextRuns(child, { italics: true }, { TextRun })
        if (runs.length > 0) {
          results.push(new Paragraph({
            children: runs,
            indent:   { left: 720, right: 720 },
            spacing:  DOUBLE,
          }))
        }
      }
    } else if (tag === 'ul' || tag === 'ol') {
      for (const li of el.children) {
        const runs = buildTextRuns(li, {}, { TextRun })
        results.push(new Paragraph({
          children: [new TextRun({ text: '• ', font: 'Times New Roman', size: 24 }), ...runs],
          indent:   { left: 720 },
          spacing:  DOUBLE,
        }))
      }
    }
  }

  for (const el of dom.body.children) processEl(el)
  return results
}

// ── Export function ───────────────────────────────────────────────────────────

async function buildAndDownload({ project, structure, projectId, mode, selectedChapterId }) {
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import('docx')

  const allChapters = getAllChapters(structure)
  const chapters = mode === 'chapter'
    ? allChapters.filter(ch => ch.id === selectedChapterId)
    : allChapters

  // Load all scene content in parallel
  const sceneIds = chapters.flatMap(ch => ch.scenes.map(s => s.id))
  const snaps = await Promise.all(
    sceneIds.map(id => getDoc(doc(db, 'projects', projectId, 'scenes', id)))
  )
  const contentMap = {}
  sceneIds.forEach((id, i) => {
    contentMap[id] = snaps[i].exists() ? snaps[i].data().content : ''
  })

  const children = []

  // Title page
  children.push(
    new Paragraph({ children: [], spacing: { before: 2880, after: 0 } }),
    new Paragraph({
      children:  [new TextRun({ text: project.title, bold: true, size: 48, font: 'Times New Roman' })],
      alignment: AlignmentType.CENTER,
      spacing:   { before: 0, after: 240 },
    }),
    project.seriesName ? new Paragraph({
      children:  [new TextRun({ text: project.seriesName, size: 28, font: 'Times New Roman' })],
      alignment: AlignmentType.CENTER,
      spacing:   { before: 0, after: 480 },
    }) : new Paragraph({ children: [] }),
    new Paragraph({
      children:  [new TextRun({ text: `${(project.wordCount ?? 0).toLocaleString()} words`, size: 24, font: 'Times New Roman' })],
      alignment: AlignmentType.CENTER,
      spacing:   { before: 480, after: 0 },
    }),
    // Page break after title
    new Paragraph({
      children: [new TextRun({ text: '', break: 1 })],
      pageBreakBefore: true,
    })
  )

  for (const [ci, chapter] of chapters.entries()) {
    // Chapter heading
    if (ci > 0) {
      children.push(new Paragraph({ children: [], spacing: { before: 960, after: 0 } }))
    }
    children.push(
      new Paragraph({
        children:  [new TextRun({ text: chapter.title.toUpperCase(), bold: true, size: 28, font: 'Times New Roman' })],
        alignment: AlignmentType.CENTER,
        spacing:   { line: 480, before: 480, after: 480 },
      })
    )

    for (const [si, scene] of chapter.scenes.entries()) {
      const html = contentMap[scene.id] || ''
      const paras = htmlToParagraphs(html, { Paragraph, TextRun, AlignmentType })
      children.push(...paras)

      // Scene break between scenes
      if (si < chapter.scenes.length - 1) {
        children.push(
          new Paragraph({
            children:  [new TextRun({ text: '#', font: 'Times New Roman', size: 24 })],
            alignment: AlignmentType.CENTER,
            spacing:   { line: 480, before: 480, after: 480 },
          })
        )
      }
    }
  }

  const docx = new Document({
    creator:  'Axiom',
    title:    project.title,
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
        },
      },
      children,
    }],
  })

  const blob = await Packer.toBlob(docx)
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  const filename = (mode === 'chapter'
    ? `${project.title} - ${chapters[0]?.title ?? 'Chapter'}`
    : project.title
  ).replace(/[^a-z0-9 _-]/gi, '_')
  a.href     = url
  a.download = `${filename}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function ExportDocxModal({ project, structure, projectId, onClose }) {
  const allChapters = getAllChapters(structure || { hasParts: false, chapters: [] })

  const [mode,              setMode]              = useState('manuscript') // 'manuscript' | 'chapter'
  const [selectedChapterId, setSelectedChapterId] = useState(allChapters[0]?.id ?? '')
  const [step,              setStep]              = useState('options')    // 'options' | 'exporting' | 'done' | 'error'
  const [error,             setError]             = useState('')

  async function handleExport() {
    setStep('exporting')
    setError('')
    try {
      await buildAndDownload({ project, structure, projectId, mode, selectedChapterId })
      setStep('done')
    } catch (err) {
      console.error('[ExportDocx]', err)
      setError(err?.message || 'Export failed. Please try again.')
      setStep('error')
    }
  }

  const totalWords  = (project?.wordCount ?? 0).toLocaleString()
  const chapterObj  = allChapters.find(ch => ch.id === selectedChapterId)
  const chapterWords = chapterObj
    ? chapterObj.scenes.reduce((s, sc) => s + (sc.wordCount || 0), 0).toLocaleString()
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-axiom-surface border border-axiom-border rounded-2xl shadow-card w-full max-w-md animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-axiom-border">
          <div>
            <h2 className="font-serif text-lg font-semibold text-slate-100">Export to .docx</h2>
            <p className="text-xs text-slate-500 mt-0.5">Standard manuscript format · Times New Roman 12pt · Double-spaced</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-5">

          {/* Options step */}
          {step === 'options' && (
            <>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-500 mb-2">Export scope</label>

                {/* Entire manuscript */}
                <button
                  onClick={() => setMode('manuscript')}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-150 text-left ${
                    mode === 'manuscript'
                      ? 'border-gold-500/40 bg-gold-500/8'
                      : 'border-axiom-border hover:border-axiom-border-light bg-axiom-surface2'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${mode === 'manuscript' ? 'border-gold-500' : 'border-slate-600'}`}>
                    {mode === 'manuscript' && <div className="w-2 h-2 rounded-full bg-gold-500" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200">Entire manuscript</p>
                    <p className="text-xs text-slate-600 mt-0.5">{allChapters.length} chapters · ~{totalWords} words</p>
                  </div>
                  <FileText className="w-4 h-4 text-slate-600 flex-shrink-0 ml-auto" />
                </button>

                {/* Single chapter */}
                <button
                  onClick={() => setMode('chapter')}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-150 text-left ${
                    mode === 'chapter'
                      ? 'border-gold-500/40 bg-gold-500/8'
                      : 'border-axiom-border hover:border-axiom-border-light bg-axiom-surface2'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${mode === 'chapter' ? 'border-gold-500' : 'border-slate-600'}`}>
                    {mode === 'chapter' && <div className="w-2 h-2 rounded-full bg-gold-500" />}
                  </div>
                  <p className="text-sm font-medium text-slate-200">Single chapter</p>
                </button>
              </div>

              {mode === 'chapter' && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Select chapter</label>
                  <select
                    value={selectedChapterId}
                    onChange={e => setSelectedChapterId(e.target.value)}
                    className="input-base"
                  >
                    {allChapters.map(ch => (
                      <option key={ch.id} value={ch.id}>{ch.title}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-600 mt-1">
                    {chapterObj?.scenes.length ?? 0} scenes · ~{chapterWords} words
                  </p>
                </div>
              )}
            </>
          )}

          {/* Exporting */}
          {step === 'exporting' && (
            <div className="flex flex-col items-center py-10 gap-4">
              <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
              <p className="text-slate-400 text-sm">Building your manuscript…</p>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="flex flex-col items-center py-10 gap-4">
              <CheckCircle className="w-10 h-10 text-teal-400" />
              <div className="text-center">
                <p className="text-slate-200 font-medium mb-1">Download started!</p>
                <p className="text-slate-500 text-sm">Check your downloads folder</p>
              </div>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="flex gap-2 items-start bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          {step === 'done' ? (
            <>
              <button onClick={() => setStep('options')} className="btn-secondary flex-1">Export another</button>
              <button onClick={onClose} className="btn-primary flex-1">Done</button>
            </>
          ) : step === 'options' ? (
            <>
              <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleExport} className="btn-primary flex-1">
                <Download className="w-4 h-4" />
                Export
              </button>
            </>
          ) : step === 'error' ? (
            <>
              <button onClick={() => setStep('options')} className="btn-secondary flex-1">Back</button>
              <button onClick={handleExport} className="btn-primary flex-1">Retry</button>
            </>
          ) : (
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          )}
        </div>
      </div>
    </div>
  )
}
