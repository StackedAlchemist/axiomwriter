/**
 * Plain-text manuscript structure detection.
 *
 * Takes raw pasted/uploaded text and produces the same
 * { structure, sceneContents } shape ImportDocxModal builds from .docx files:
 *   structure     = { hasParts, parts: [...], chapters: [{ id, title, scenes: [...] }] }
 *   sceneContents = { [sceneId]: '<p>…</p>' }
 *
 * Detection handles the mess real manuscripts actually contain:
 *   - "Chapter One - Title", "Chapter 2: Title", "CHAPTER III", Prologue/Epilogue
 *   - Part/Book divisions
 *   - Running-header artifacts (the same "Chapter 1" line repeated through the
 *     document by a Word page header) — stripped, never split on
 *   - Page-number-only lines — stripped when worded headings exist
 *   - Front matter before the first chapter (title page, contact info) —
 *     kept as its own "Front Matter" chapter the user can delete in preview
 *   - Scene breaks: ***, * * *, ---, #, §, ~~~, or runs of 3+ blank lines
 */
import { v4 as uuidv4 } from 'uuid'

const genId = prefix => `${prefix}_${uuidv4().slice(0, 8)}`

export function countWords(text) {
  const t = (text || '').trim()
  return t ? t.split(/\s+/).length : 0
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Spelled-out numbers through the nineties: "one", "twenty", "twenty-one", "forty two"
const SPELLED_NUM =
  '(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:[-\\s](?:one|two|three|four|five|six|seven|eight|nine))?'

const CHAPTER_RE = new RegExp(
  `^(?:chapter|ch\\.?)\\s+(?:\\d{1,3}|[ivxlc]{1,7}|${SPELLED_NUM})\\b\\s*(?:[:.\\-–—]\\s*(.*))?$`,
  'i'
)
const STANDALONE_RE = /^(prologue|epilogue|interlude|prelude|foreword|afterword)\b\s*(?:[:.\-–—]\s*(.*))?$/i
const PART_RE = new RegExp(
  `^(?:part|book)\\s+(?:\\d{1,2}|[ivxlc]{1,7}|${SPELLED_NUM})\\b\\s*(?:[:.\\-–—]\\s*(.*))?$`,
  'i'
)
const SCENE_MARK_RE = /^(?:\*{3,}|\*\s\*\s\*|-{3,}|#{1,3}|§+|~{3,})$/
const NUM_ONLY_RE   = /^\d{1,4}$/

const MAX_HEADING_LEN = 80

function classifyLine(raw) {
  const line = raw.trim()
  if (!line) return { type: 'blank' }
  if (SCENE_MARK_RE.test(line)) return { type: 'scenebreak' }
  if (line.length <= MAX_HEADING_LEN) {
    if (PART_RE.test(line))       return { type: 'part',    text: line }
    if (CHAPTER_RE.test(line))    return { type: 'chapter', text: line }
    if (STANDALONE_RE.test(line)) return { type: 'chapter', text: line }
  }
  if (NUM_ONLY_RE.test(line)) return { type: 'numonly', text: line }
  return { type: 'content', text: line }
}

/**
 * Detects manuscript structure from plain text.
 * Returns { structure, sceneContents } or a single-chapter fallback when no
 * headings are found.
 */
export function detectStructureFromText(text) {
  const lines = (text || '').replace(/\r\n?/g, '\n').split('\n')
  let classified = lines.map(classifyLine)

  // ── Pass 1: strip running-header artifacts ─────────────────────────────────
  // The exact same heading text appearing 3+ times is a page header bleeding
  // into the paste (e.g. "Chapter 1" on every page), never real structure.
  const headingCounts = {}
  for (const c of classified) {
    if (c.type === 'chapter' || c.type === 'part') {
      const key = c.text.toLowerCase()
      headingCounts[key] = (headingCounts[key] || 0) + 1
    }
  }
  classified = classified.map(c => {
    if ((c.type === 'chapter' || c.type === 'part') && headingCounts[c.text.toLowerCase()] >= 3) {
      return { type: 'artifact' }
    }
    return c
  })

  const chapterHeadings = classified.filter(c => c.type === 'chapter')
  const hasWordedHeadings = chapterHeadings.length > 0

  // ── Pass 2: resolve number-only lines ──────────────────────────────────────
  // With worded headings present they're page numbers — drop them. Without
  // any worded headings, 2+ of them are minimalist chapter markers ("1","2").
  const numOnlyCount = classified.filter(c => c.type === 'numonly').length
  classified = classified.map(c => {
    if (c.type !== 'numonly') return c
    if (hasWordedHeadings) return { type: 'artifact' }
    if (numOnlyCount >= 2) return { type: 'chapter', text: `Chapter ${c.text}` }
    return { type: 'content', text: c.text }
  })

  // ── Pass 3: merge "Chapter One" + following title line ─────────────────────
  // A bare heading followed by a short, unpunctuated line then a blank is a
  // two-line heading ("Chapter One" / "The Humming Stone").
  for (let i = 0; i < classified.length; i++) {
    const c = classified[i]
    if (c.type !== 'chapter' && c.type !== 'part') continue
    const hasTitle = /[:.\-–—]\s*\S/.test(c.text)
    if (hasTitle) continue
    let j = i + 1
    if (classified[j]?.type !== 'content') continue
    const next = classified[j].text
    const after = classified[j + 1]
    if (next.length <= 50 && !/[.!?,;]$/.test(next) && (!after || after.type === 'blank')) {
      classified[i] = { ...c, text: `${c.text} — ${next}` }
      classified[j] = { type: 'artifact' }
    }
  }

  // ── Build structure ─────────────────────────────────────────────────────────
  const hasParts = classified.some(c => c.type === 'part')
  const structure     = { hasParts, parts: [], chapters: [] }
  const sceneContents = {}

  let currentPart    = null
  let currentChapter = null
  let paragraphs     = []
  let sceneNum       = 1
  let blankRun       = 0
  let sawChapter     = false

  function pushChapter(title) {
    const ch = { id: genId('ch'), title, scenes: [] }
    if (currentPart) currentPart.chapters.push(ch)
    else structure.chapters.push(ch)
    currentChapter = ch
    sceneNum = 1
    return ch
  }

  function flushScene() {
    if (!currentChapter || paragraphs.length === 0) return
    const contentHtml = paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('')
    const sceneId = genId('sc')
    currentChapter.scenes.push({
      id: sceneId,
      title: `Scene ${sceneNum}`,
      wordCount: countWords(paragraphs.join(' ')),
      status: 'drafted',
      povCharacter: '',
      tags: [],
    })
    sceneContents[sceneId] = contentHtml
    paragraphs = []
    sceneNum++
  }

  for (const c of classified) {
    if (c.type === 'artifact') continue

    if (c.type === 'blank') {
      blankRun++
      // 3+ consecutive blank lines mid-chapter reads as a soft scene break
      if (blankRun === 3 && sawChapter && paragraphs.length > 0) flushScene()
      continue
    }
    blankRun = 0

    if (c.type === 'part') {
      flushScene()
      currentPart = { id: genId('pt'), title: c.text, chapters: [] }
      structure.parts.push(currentPart)
      currentChapter = null
      continue
    }

    if (c.type === 'chapter') {
      flushScene()
      // Anything before the first chapter heading is front matter
      if (!sawChapter && !currentChapter && paragraphs.length > 0) {
        // paragraphs still pending with no chapter — handled below via temp chapter
      }
      sawChapter = true
      pushChapter(c.text)
      continue
    }

    if (c.type === 'scenebreak') {
      flushScene()
      continue
    }

    // content
    if (!currentChapter) {
      pushChapter(sawChapter ? 'Untitled Chapter' : 'Front Matter')
      if (!sawChapter) currentChapter.isFrontMatter = true
    }
    paragraphs.push(c.text)
  }
  flushScene()

  // Drop empty chapters, and a front-matter chapter that's basically nothing
  const clean = chs => chs.filter(ch => {
    if (ch.scenes.length === 0) return false
    if (ch.isFrontMatter) {
      const words = ch.scenes.reduce((s, sc) => s + sc.wordCount, 0)
      if (words < 5) return false
    }
    return true
  })
  if (hasParts) {
    structure.parts = structure.parts
      .map(p => ({ ...p, chapters: clean(p.chapters) }))
      .filter(p => p.chapters.length > 0)
    // Chapters that appeared before any part heading
    structure.chapters = clean(structure.chapters)
  } else {
    structure.chapters = clean(structure.chapters)
  }

  // If the ONLY chapter is front matter, there were no real headings — it's
  // just a document. Rename it so the import reads sensibly.
  if (!hasParts && structure.chapters.length === 1 && structure.chapters[0].isFrontMatter) {
    structure.chapters[0].title = 'Chapter One'
    delete structure.chapters[0].isFrontMatter
  }

  // No structure found at all → single chapter / single scene fallback
  const chapterCount = hasParts
    ? structure.parts.reduce((s, p) => s + p.chapters.length, 0) + structure.chapters.length
    : structure.chapters.length
  if (chapterCount === 0) {
    const ch = { id: genId('ch'), title: 'Chapter One', scenes: [] }
    const sceneId = genId('sc')
    const paras = (text || '').replace(/\r\n?/g, '\n').split('\n').map(l => l.trim()).filter(Boolean)
    ch.scenes.push({
      id: sceneId, title: 'Scene 1',
      wordCount: countWords(text), status: 'drafted', povCharacter: '', tags: [],
    })
    sceneContents[sceneId] = paras.map(p => `<p>${escapeHtml(p)}</p>`).join('')
    return { structure: { hasParts: false, parts: [], chapters: [ch] }, sceneContents }
  }

  return { structure, sceneContents }
}
