/**
 * Data Export — writer-friendly Word (.docx) exports of everything a user
 * has created, formatted to read the way it does in the app.
 *
 * Sections: Manuscript, Characters, World Bible (lore), Threads.
 * One section + one project → a single .docx download.
 * Anything more → a .zip organized by project folder.
 * (The old raw JSON backup remains available separately in Settings.)
 */
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getAllChapters } from '../hooks/useManuscript'

const FONT = 'Times New Roman'
const BODY_SIZE = 24 // half-points → 12pt

export const EXPORT_SECTIONS = [
  { id: 'manuscript', label: 'Manuscript',  desc: 'Chapters and scenes, formatted like a manuscript' },
  { id: 'characters', label: 'Characters',  desc: 'Every character profile, field by field' },
  { id: 'lore',       label: 'World Bible', desc: 'Lore entries grouped by category' },
  { id: 'threads',    label: 'Plot Threads', desc: 'Narrative threads with status and notes' },
]

// ── Small helpers ─────────────────────────────────────────────────────────────

function safeFileName(s) {
  return (s || 'Untitled').replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 60) || 'Untitled'
}

function prettyLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, c => c.toUpperCase())
}

function run(docx, text, opts = {}) {
  return new docx.TextRun({ text, font: FONT, size: BODY_SIZE, ...opts })
}

function para(docx, children, opts = {}) {
  return new docx.Paragraph({ children: Array.isArray(children) ? children : [children], ...opts })
}

function heading(docx, text, { size = 32, before = 360, after = 160, italics = false, center = false } = {}) {
  return new docx.Paragraph({
    children:  [run(docx, text, { bold: true, size, italics })],
    spacing:   { before, after },
    alignment: center ? docx.AlignmentType.CENTER : undefined,
  })
}

// ── HTML → docx paragraphs (mirrors the in-app editor formatting) ────────────

function buildRuns(docx, node, style = {}) {
  const runs = []
  node.childNodes.forEach(child => {
    if (child.nodeType === 3) { // text
      if (child.textContent) runs.push(run(docx, child.textContent, style))
    } else if (child.nodeType === 1) {
      const tag  = child.tagName.toLowerCase()
      const next = { ...style }
      if (tag === 'strong' || tag === 'b') next.bold = true
      if (tag === 'em' || tag === 'i')     next.italics = true
      if (tag === 'u')                     next.underline = {}
      if (tag === 's' || tag === 'del')    next.strike = true
      if (tag === 'mark')                  next.highlight = 'yellow'
      if (tag === 'br') { runs.push(new docx.TextRun({ break: 1 })); return }
      runs.push(...buildRuns(docx, child, next))
    }
  })
  return runs
}

export function htmlToParagraphs(docx, html) {
  if (!html || !html.trim()) return []
  const dom = new DOMParser().parseFromString(html, 'text/html')
  const out = []

  dom.body.childNodes.forEach(el => {
    if (el.nodeType !== 1) return
    const tag = el.tagName.toLowerCase()

    if (tag === 'p') {
      const runs = buildRuns(docx, el)
      out.push(new docx.Paragraph({
        children: runs.length ? runs : [run(docx, '')],
        spacing:  { after: 160, line: 320 },
      }))
    } else if (tag === 'h1') {
      out.push(heading(docx, el.textContent, { size: 32 }))
    } else if (tag === 'h2') {
      out.push(heading(docx, el.textContent, { size: 28 }))
    } else if (tag === 'h3') {
      out.push(heading(docx, el.textContent, { size: 24, italics: true }))
    } else if (tag === 'hr') {
      out.push(new docx.Paragraph({
        children:  [run(docx, '* * *')],
        alignment: docx.AlignmentType.CENTER,
        spacing:   { before: 240, after: 240 },
      }))
    } else if (tag === 'blockquote') {
      el.querySelectorAll('p').forEach(p => {
        out.push(new docx.Paragraph({
          children: buildRuns(docx, p, { italics: true }),
          indent:   { left: 720 },
          spacing:  { after: 160 },
        }))
      })
    } else if (tag === 'ul' || tag === 'ol') {
      Array.from(el.querySelectorAll('li')).forEach((li, i) => {
        out.push(new docx.Paragraph({
          children: [run(docx, tag === 'ol' ? `${i + 1}. ` : '• '), ...buildRuns(docx, li)],
          indent:   { left: 360 },
          spacing:  { after: 80 },
        }))
      })
    }
  })

  return out
}

// ── Section builders ──────────────────────────────────────────────────────────

function buildManuscriptDoc(docx, project, sceneContents) {
  const children = [
    new docx.Paragraph({ children: [], spacing: { before: 2400 } }),
    heading(docx, project.title || 'Untitled', { size: 48, center: true, after: 240 }),
    para(docx, run(docx, `Exported from Axiomwriter — ${new Date().toLocaleDateString()}`, { size: 20, color: '888888' }), {
      alignment: docx.AlignmentType.CENTER, spacing: { after: 2400 },
    }),
  ]

  const structure = project.structure
  if (!structure) return null

  function renderChapter(ch) {
    children.push(heading(docx, ch.title || 'Untitled Chapter', { size: 32, before: 720, after: 320, center: true }))
    ;(ch.scenes || []).forEach((scene, i) => {
      if (i > 0) {
        children.push(new docx.Paragraph({
          children:  [run(docx, '* * *')],
          alignment: docx.AlignmentType.CENTER,
          spacing:   { before: 240, after: 240 },
        }))
      }
      children.push(...htmlToParagraphs(docx, sceneContents[scene.id] || ''))
    })
  }

  if (structure.hasParts) {
    ;(structure.parts || []).forEach(part => {
      children.push(heading(docx, part.title || 'Part', { size: 40, before: 960, after: 480, center: true }))
      ;(part.chapters || []).forEach(renderChapter)
    })
    ;(structure.chapters || []).forEach(renderChapter)
  } else {
    ;(structure.chapters || []).forEach(renderChapter)
  }

  return new docx.Document({ sections: [{ children }] })
}

// Character/thread fields that are app bookkeeping, not writing
const SKIP_FIELDS = new Set([
  'id', 'createdAt', 'updatedAt', 'photoUrl', 'importanceHistory',
  'momentumScore', 'momentumHistory', 'sceneHistory', 'name', 'title',
  'aliases', 'role', 'importance', 'status', 'type', 'povCharacter', 'tags',
  'linkedSceneIds', 'loreEntryId', 'flexibility', 'category', 'content', 'uid', 'userId',
])

function looksLikeHtml(s) {
  return typeof s === 'string' && /<[a-z][^>]*>/i.test(s)
}

function fieldParagraphs(docx, key, value) {
  const out = []
  if (value == null) return out

  if (typeof value === 'string') {
    if (!value.trim()) return out
    out.push(heading(docx, prettyLabel(key), { size: 24, before: 240, after: 80 }))
    if (looksLikeHtml(value)) out.push(...htmlToParagraphs(docx, value))
    else out.push(para(docx, run(docx, value), { spacing: { after: 120, line: 300 } }))
  } else if (Array.isArray(value)) {
    const items = value.filter(v => typeof v === 'string' && v.trim())
    if (!items.length) return out
    out.push(heading(docx, prettyLabel(key), { size: 24, before: 240, after: 80 }))
    items.forEach(v => out.push(para(docx, [run(docx, '• '), run(docx, v)], { indent: { left: 360 }, spacing: { after: 60 } })))
  } else if (typeof value === 'object') {
    const entries = Object.entries(value).filter(([, v]) => typeof v === 'string' && v.trim())
    if (!entries.length) return out
    out.push(heading(docx, prettyLabel(key), { size: 24, before: 240, after: 80 }))
    entries.forEach(([k, v]) => out.push(para(docx, [run(docx, `${prettyLabel(k)}: `, { bold: true }), run(docx, v)], { spacing: { after: 60 } })))
  }
  return out
}

function buildCharactersDoc(docx, project, characters) {
  if (!characters?.length) return null
  const children = [
    heading(docx, `${project.title || 'Untitled'} — Characters`, { size: 40, center: true, after: 480 }),
  ]

  const order = { protagonist: 0, antagonist: 1, major: 2, supporting: 3, background: 4 }
  const sorted = [...characters].sort((a, b) => (order[a.role] ?? 5) - (order[b.role] ?? 5))

  sorted.forEach(char => {
    children.push(heading(docx, char.name || 'Unnamed', { size: 32, before: 640, after: 80 }))
    const metaBits = [
      char.role ? prettyLabel(char.role) : null,
      char.aliases?.length ? `also known as ${char.aliases.join(', ')}` : null,
    ].filter(Boolean)
    if (metaBits.length) {
      children.push(para(docx, run(docx, metaBits.join(' · '), { italics: true, size: 22, color: '666666' }), { spacing: { after: 200 } }))
    }
    Object.entries(char).forEach(([key, value]) => {
      if (SKIP_FIELDS.has(key)) return
      children.push(...fieldParagraphs(docx, key, value))
    })
  })

  return new docx.Document({ sections: [{ children }] })
}

function buildLoreDoc(docx, project, loreEntries) {
  if (!loreEntries?.length) return null
  const children = [
    heading(docx, `${project.title || 'Untitled'} — World Bible`, { size: 40, center: true, after: 480 }),
  ]

  const byCategory = {}
  loreEntries.forEach(e => {
    const cat = e.category || 'General'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(e)
  })

  Object.entries(byCategory).sort(([a], [b]) => a.localeCompare(b)).forEach(([cat, entries]) => {
    children.push(heading(docx, cat, { size: 34, before: 720, after: 240 }))
    entries.sort((a, b) => (a.title || '').localeCompare(b.title || '')).forEach(entry => {
      children.push(heading(docx, entry.title || 'Untitled entry', { size: 27, before: 360, after: 80 }))
      if (entry.flexibility === 'locked') {
        children.push(para(docx, run(docx, 'Locked canon', { italics: true, size: 20, color: '996611' }), { spacing: { after: 80 } }))
      }
      children.push(...htmlToParagraphs(docx, entry.content || ''))
    })
  })

  return new docx.Document({ sections: [{ children }] })
}

function buildThreadsDoc(docx, project, threads) {
  if (!threads?.length) return null
  const children = [
    heading(docx, `${project.title || 'Untitled'} — Plot Threads`, { size: 40, center: true, after: 480 }),
  ]

  threads.forEach(thread => {
    children.push(heading(docx, thread.title || 'Untitled thread', { size: 28, before: 480, after: 80 }))
    const metaBits = [thread.type ? prettyLabel(thread.type) : null, thread.status ? prettyLabel(thread.status) : null].filter(Boolean)
    if (metaBits.length) {
      children.push(para(docx, run(docx, metaBits.join(' · '), { italics: true, size: 22, color: '666666' }), { spacing: { after: 160 } }))
    }
    Object.entries(thread).forEach(([key, value]) => {
      if (SKIP_FIELDS.has(key)) return
      children.push(...fieldParagraphs(docx, key, value))
    })
  })

  return new docx.Document({ sections: [{ children }] })
}

// ── Main export ───────────────────────────────────────────────────────────────

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Exports the user's work as formatted Word documents.
 * @param {string} userId
 * @param {string[]} sections - subset of EXPORT_SECTIONS ids
 * @param {(msg: string) => void} onProgress
 */
export async function exportUserDocx(userId, sections, onProgress = () => {}) {
  const docx = await import('docx')

  onProgress('Loading your projects…')
  const projectsSnap = await getDocs(query(collection(db, 'projects'), where('userId', '==', userId)))
  const files = [] // { folder, name, blob }

  for (const p of projectsSnap.docs) {
    const project = { id: p.id, ...p.data() }
    const title   = safeFileName(project.title)

    if (sections.includes('manuscript') && project.structure) {
      onProgress(`Formatting manuscript — ${project.title}…`)
      const scenesSnap = await getDocs(collection(db, 'projects', p.id, 'scenes'))
      const contents = Object.fromEntries(scenesSnap.docs.map(d => [d.id, d.data().content || '']))
      const hasProse = getAllChapters(project.structure).some(ch => (ch.scenes || []).length > 0)
      if (hasProse) {
        const docObj = buildManuscriptDoc(docx, project, contents)
        if (docObj) files.push({ folder: title, name: `${title} — Manuscript.docx`, blob: await docx.Packer.toBlob(docObj) })
      }
    }

    if (sections.includes('characters')) {
      onProgress(`Formatting characters — ${project.title}…`)
      const snap = await getDocs(collection(db, 'projects', p.id, 'characters'))
      const docObj = buildCharactersDoc(docx, project, snap.docs.map(d => ({ id: d.id, ...d.data() })))
      if (docObj) files.push({ folder: title, name: `${title} — Characters.docx`, blob: await docx.Packer.toBlob(docObj) })
    }

    if (sections.includes('lore')) {
      onProgress(`Formatting world bible — ${project.title}…`)
      const snap = await getDocs(collection(db, 'projects', p.id, 'lore'))
      const docObj = buildLoreDoc(docx, project, snap.docs.map(d => ({ id: d.id, ...d.data() })))
      if (docObj) files.push({ folder: title, name: `${title} — World Bible.docx`, blob: await docx.Packer.toBlob(docObj) })
    }

    if (sections.includes('threads')) {
      onProgress(`Formatting threads — ${project.title}…`)
      const snap = await getDocs(collection(db, 'projects', p.id, 'threads'))
      const docObj = buildThreadsDoc(docx, project, snap.docs.map(d => ({ id: d.id, ...d.data() })))
      if (docObj) files.push({ folder: title, name: `${title} — Plot Threads.docx`, blob: await docx.Packer.toBlob(docObj) })
    }
  }

  if (files.length === 0) {
    throw new Error('Nothing to export in the selected sections yet.')
  }

  const dateStamp = new Date().toISOString().split('T')[0]

  if (files.length === 1) {
    triggerDownload(files[0].blob, files[0].name)
    return { fileCount: 1 }
  }

  onProgress('Packaging ZIP…')
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const multiProject = new Set(files.map(f => f.folder)).size > 1
  files.forEach(f => {
    if (multiProject) zip.folder(f.folder).file(f.name, f.blob)
    else zip.file(f.name, f.blob)
  })
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  triggerDownload(zipBlob, `Axiomwriter Export ${dateStamp}.zip`)
  return { fileCount: files.length }
}
