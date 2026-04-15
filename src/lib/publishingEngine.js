/**
 * Publishing Engine
 * Platform-specific manuscript formatting for:
 * - KDP (Kindle Direct Publishing)
 * - IngramSpark
 * - Draft2Digital
 * - Standard .docx
 * - ePub (docx-based, compatible for conversion)
 *
 * Also: publishing readiness checklist
 */

import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getAllChapters } from '../hooks/useManuscript'

// ── Platform specs ────────────────────────────────────────────────────────────

export const PLATFORMS = [
  {
    id:          'kdp',
    label:       'KDP — Kindle Direct Publishing',
    shortLabel:  'KDP',
    desc:        'Amazon Kindle Direct Publishing — print and ebook',
    formats:     ['Print (.docx)', 'Ebook (.docx)'],
    font:        'Georgia',
    size:        22,           // half-points (11pt)
    lineSpacing: 360,          // 1.5 for print, 276 for ebook
    margins:     { top: 1008, bottom: 1008, left: 1008, right: 1008 }, // 0.7" = 1008 twips
    notes:       'KDP print requires 0.25" bleed if full-bleed images are used. Ebook margins are handled by the reader.',
    trimSizes:   ['5" × 8"', '5.5" × 8.5"', '6" × 9"'],
  },
  {
    id:          'ingram',
    label:       'IngramSpark',
    shortLabel:  'IngramSpark',
    desc:        'IngramSpark — wide distribution, bookstores',
    formats:     ['Print (.docx)'],
    font:        'Georgia',
    size:        22,
    lineSpacing: 360,
    margins:     { top: 1008, bottom: 1008, left: 1152, right: 864 }, // 0.8" inside, 0.6" outside
    notes:       'IngramSpark requires minimum 0.5" margins and 0.125" bleed on cover. Text must not be within 0.25" of trim.',
    trimSizes:   ['5.5" × 8.5"', '6" × 9"', '5" × 8"'],
  },
  {
    id:          'd2d',
    label:       'Draft2Digital',
    shortLabel:  'D2D',
    desc:        'Wide ebook distribution (Apple, Kobo, B&N, etc.)',
    formats:     ['Ebook (.docx)'],
    font:        'Georgia',
    size:        22,
    lineSpacing: 276,          // single-ish for ebook
    margins:     { top: 720, bottom: 720, left: 720, right: 720 },
    notes:       'D2D accepts .docx and auto-converts. Use H1 for chapter headings. Scene breaks as "* * *".',
    trimSizes:   ['Ebook (reflowable)'],
  },
  {
    id:          'standard',
    label:       'Standard Manuscript',
    shortLabel:  'Standard',
    desc:        'Traditional manuscript format for agents and publishers',
    formats:     ['.docx'],
    font:        'Times New Roman',
    size:        24,           // 12pt
    lineSpacing: 480,          // double-spaced
    margins:     { top: 1440, bottom: 1440, left: 1440, right: 1440 }, // 1"
    notes:       'Standard manuscript format: Times New Roman 12pt, double-spaced, 1" margins, header with title/author/page.',
    trimSizes:   ['8.5" × 11"'],
  },
  {
    id:          'epub',
    label:       'ePub-Compatible',
    shortLabel:  'ePub',
    desc:        'Clean .docx formatted for ePub conversion (Calibre, Sigil)',
    formats:     ['.docx (ePub-ready)'],
    font:        'Georgia',
    size:        22,
    lineSpacing: 240,
    margins:     { top: 720, bottom: 720, left: 720, right: 720 },
    notes:       'Generated .docx is structured for easy ePub conversion via Calibre or Sigil. Heading styles map to chapter markers.',
    trimSizes:   ['Ebook (reflowable)'],
  },
]

// ── Genre word count guidelines ───────────────────────────────────────────────

const GENRE_WORD_COUNTS = {
  'Fantasy':         { min: 80000,  max: 120000, label: 'Epic Fantasy' },
  'Science Fiction': { min: 70000,  max: 110000, label: 'Sci-Fi' },
  'Romance':         { min: 50000,  max: 90000,  label: 'Romance' },
  'Mystery':         { min: 60000,  max: 90000,  label: 'Mystery' },
  'Thriller':        { min: 70000,  max: 100000, label: 'Thriller' },
  'Horror':          { min: 50000,  max: 80000,  label: 'Horror' },
  'Literary':        { min: 70000,  max: 110000, label: 'Literary Fiction' },
  'Historical':      { min: 80000,  max: 120000, label: 'Historical Fiction' },
  'Young Adult':     { min: 50000,  max: 80000,  label: 'YA' },
  'Middle Grade':    { min: 20000,  max: 55000,  label: 'Middle Grade' },
}

// ── Readiness check ───────────────────────────────────────────────────────────

export function runReadinessCheck({ project, structure, coverImageUrl }) {
  const chapters  = getAllChapters(structure || { hasParts: false, chapters: [] })
  const allScenes = chapters.flatMap(ch => ch.scenes || [])
  const wordCount = project?.wordCount || 0
  const genre     = project?.genre || ''

  const checks = []

  // Title page check (project has a title)
  checks.push({
    id:      'title',
    label:   'Manuscript has a title',
    status:  project?.title?.trim() ? 'pass' : 'fail',
    note:    project?.title?.trim() ? null : 'Add a title to your project in settings.',
  })

  // All chapters titled
  const untitledChapters = chapters.filter(ch => !ch.title?.trim() || ch.title === 'Untitled Chapter')
  checks.push({
    id:      'chapter_titles',
    label:   'All chapters titled',
    status:  untitledChapters.length === 0 ? 'pass' : 'warn',
    note:    untitledChapters.length > 0 ? `${untitledChapters.length} chapter${untitledChapters.length > 1 ? 's' : ''} still use the default title.` : null,
  })

  // No "planned" scenes
  const plannedScenes = allScenes.filter(s => s.status === 'planned')
  checks.push({
    id:      'planned_scenes',
    label:   'No scenes in "Planned" status',
    status:  plannedScenes.length === 0 ? 'pass' : 'warn',
    note:    plannedScenes.length > 0 ? `${plannedScenes.length} scene${plannedScenes.length > 1 ? 's are' : ' is'} still marked as "Planned".` : null,
  })

  // Word count appropriate for genre
  const genreGuide = GENRE_WORD_COUNTS[genre]
  let wcStatus = 'pass', wcNote = null
  if (genreGuide) {
    if (wordCount < genreGuide.min * 0.7) {
      wcStatus = 'fail'
      wcNote   = `${wordCount.toLocaleString()} words is significantly below the ${genreGuide.label} range (${genreGuide.min.toLocaleString()}–${genreGuide.max.toLocaleString()} words).`
    } else if (wordCount < genreGuide.min) {
      wcStatus = 'warn'
      wcNote   = `${wordCount.toLocaleString()} words is below typical ${genreGuide.label} length (${genreGuide.min.toLocaleString()}–${genreGuide.max.toLocaleString()} words).`
    } else if (wordCount > genreGuide.max * 1.3) {
      wcStatus = 'warn'
      wcNote   = `${wordCount.toLocaleString()} words is significantly above typical ${genreGuide.label} length. Consider trimming.`
    }
  }
  checks.push({
    id:     'word_count',
    label:  `Word count (${wordCount.toLocaleString()} words)`,
    status: wcStatus,
    note:   wcNote,
  })

  // Cover uploaded or generated
  checks.push({
    id:     'cover',
    label:  'Cover image',
    status: coverImageUrl ? 'pass' : 'warn',
    note:   coverImageUrl ? null : 'No cover uploaded or generated. Use the Cover Studio to create one.',
  })

  // Minimum content check
  checks.push({
    id:     'content',
    label:  'Manuscript has content',
    status: wordCount >= 1000 ? 'pass' : 'fail',
    note:   wordCount < 1000 ? 'Manuscript needs at least 1,000 words before export.' : null,
  })

  // Synopsis
  checks.push({
    id:     'synopsis',
    label:  'Synopsis / back cover blurb',
    status: project?.synopsis?.trim() ? 'pass' : 'warn',
    note:   project?.synopsis?.trim() ? null : 'No synopsis found. Add one in Cover Studio or project settings.',
  })

  const passCount = checks.filter(c => c.status === 'pass').length
  const score     = Math.round((passCount / checks.length) * 100)

  return { checks, score, ready: checks.every(c => c.status !== 'fail') }
}

// ── HTML → docx paragraph converter (shared) ─────────────────────────────────

function buildTextRuns(node, style, { TextRun }, platformFont, platformSize) {
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
        font:      platformFont,
        size:      platformSize,
      }))
    } else if (child.nodeType === 1) {
      const tag  = child.tagName.toLowerCase()
      const next = { ...style }
      if (tag === 'strong' || tag === 'b') next.bold = true
      if (tag === 'em'     || tag === 'i') next.italics = true
      if (tag === 'u')                     next.underline = true
      if (tag === 's' || tag === 'del')    next.strike = true
      runs.push(...buildTextRuns(child, next, { TextRun }, platformFont, platformSize))
    }
  }
  return runs
}

function htmlToParagraphs(html, { Paragraph, TextRun, AlignmentType }, platform) {
  if (!html) return []
  const dom     = new DOMParser().parseFromString(html, 'text/html')
  const results = []
  const font    = platform.font
  const size    = platform.size
  const spacing = { line: platform.lineSpacing, before: 0, after: 0 }
  const indent  = platform.id === 'standard' ? { firstLine: 720 } : { firstLine: 360 }

  function processEl(el) {
    const tag = el.tagName?.toLowerCase()
    if (!tag) return

    if (tag === 'p') {
      const runs = buildTextRuns(el, {}, { TextRun }, font, size)
      if (runs.length === 0 && !el.textContent.trim()) return
      if (runs.length === 0) runs.push(new TextRun({ text: '', font, size }))
      results.push(new Paragraph({ children: runs, spacing, indent }))

    } else if (tag === 'h1') {
      results.push(new Paragraph({
        children:  [new TextRun({ text: el.textContent, bold: true, size: size + 8, font })],
        alignment: AlignmentType.CENTER,
        spacing:   { line: platform.lineSpacing, before: 480, after: 240 },
      }))
    } else if (tag === 'h2') {
      results.push(new Paragraph({
        children: [new TextRun({ text: el.textContent, bold: true, size: size + 4, font })],
        spacing:  { line: platform.lineSpacing, before: 480, after: 240 },
      }))
    } else if (tag === 'h3') {
      results.push(new Paragraph({
        children: [new TextRun({ text: el.textContent, bold: true, italics: true, size, font })],
        spacing:  { line: platform.lineSpacing, before: 240, after: 120 },
      }))
    } else if (tag === 'hr') {
      results.push(new Paragraph({
        children:  [new TextRun({ text: '* * *', font, size })],
        alignment: AlignmentType.CENTER,
        spacing:   { line: platform.lineSpacing, before: 240, after: 240 },
      }))
    } else if (tag === 'blockquote') {
      for (const child of el.children) {
        const runs = buildTextRuns(child, { italics: true }, { TextRun }, font, size)
        if (runs.length > 0) {
          results.push(new Paragraph({
            children: runs,
            indent:   { left: 720, right: 720 },
            spacing,
          }))
        }
      }
    } else if (tag === 'ul' || tag === 'ol') {
      for (const li of el.children) {
        const runs = buildTextRuns(li, {}, { TextRun }, font, size)
        results.push(new Paragraph({
          children: [new TextRun({ text: '• ', font, size }), ...runs],
          indent:   { left: 720 },
          spacing,
        }))
      }
    }
  }

  for (const el of dom.body.children) processEl(el)
  return results
}

// ── Front matter builders ─────────────────────────────────────────────────────

function buildFrontMatter(project, platform, { Paragraph, TextRun, AlignmentType, PageBreak }) {
  const font = platform.font
  const sz   = platform.size
  const year = new Date().getFullYear()
  const pages = []

  // Title page
  pages.push(
    new Paragraph({ children: [], spacing: { before: 2880, after: 0 } }),
    new Paragraph({
      children:  [new TextRun({ text: project.title || 'Untitled', bold: true, size: sz + 24, font })],
      alignment: AlignmentType.CENTER,
    }),
    project.seriesName ? new Paragraph({
      children:  [new TextRun({ text: project.seriesName, size: sz + 8, font })],
      alignment: AlignmentType.CENTER,
      spacing:   { before: 240, after: 0 },
    }) : null,
    new Paragraph({
      children:  [new TextRun({ text: project.authorName || '[AUTHOR NAME]', size: sz + 4, font })],
      alignment: AlignmentType.CENTER,
      spacing:   { before: 720, after: 0 },
    }),
    new Paragraph({ children: [new TextRun({ text: '', break: 1 })], pageBreakBefore: true }),

    // Copyright page
    new Paragraph({
      children:  [new TextRun({ text: `Copyright © ${year} ${project.authorName || '[AUTHOR NAME]'}`, font, size: sz - 2 })],
      alignment: AlignmentType.CENTER,
      spacing:   { before: 2880, after: 240 },
    }),
    new Paragraph({
      children:  [new TextRun({ text: 'All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of the publisher.', font, size: sz - 2 })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children:  [new TextRun({ text: 'This is a work of fiction. Names, characters, places, and incidents are either the product of the author\'s imagination or used fictitiously.', font, size: sz - 2 })],
      alignment: AlignmentType.CENTER,
      spacing:   { before: 240, after: 0 },
    }),
    new Paragraph({ children: [new TextRun({ text: '', break: 1 })], pageBreakBefore: true }),

    // Dedication placeholder
    new Paragraph({ children: [], spacing: { before: 2880, after: 0 } }),
    new Paragraph({
      children:  [new TextRun({ text: '[DEDICATION]', italics: true, font, size: sz + 2 })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ children: [new TextRun({ text: '', break: 1 })], pageBreakBefore: true }),
  ).filter(Boolean)

  return pages
}

function buildBackMatter(project, platform, { Paragraph, TextRun, AlignmentType }) {
  const font = platform.font
  const sz   = platform.size

  return [
    new Paragraph({ children: [new TextRun({ text: '', break: 1 })], pageBreakBefore: true }),
    new Paragraph({
      children:  [new TextRun({ text: 'About the Author', bold: true, size: sz + 8, font })],
      alignment: AlignmentType.CENTER,
      spacing:   { before: 0, after: 480 },
    }),
    new Paragraph({
      children:  [new TextRun({ text: '[YOUR BIO HERE]', italics: true, font, size: sz })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ children: [new TextRun({ text: '', break: 1 })], pageBreakBefore: true }),
    new Paragraph({
      children:  [new TextRun({ text: 'Also by ' + (project.authorName || '[AUTHOR NAME]'), bold: true, size: sz + 4, font })],
      alignment: AlignmentType.CENTER,
      spacing:   { before: 0, after: 480 },
    }),
    new Paragraph({
      children:  [new TextRun({ text: '[OTHER BOOKS BY AUTHOR]', italics: true, font, size: sz })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ children: [new TextRun({ text: '', break: 1 })], pageBreakBefore: true }),
    new Paragraph({
      children:  [new TextRun({ text: 'Acknowledgments', bold: true, size: sz + 4, font })],
      alignment: AlignmentType.CENTER,
      spacing:   { before: 0, after: 480 },
    }),
    new Paragraph({
      children:  [new TextRun({ text: '[ACKNOWLEDGMENTS]', italics: true, font, size: sz })],
      alignment: AlignmentType.CENTER,
    }),
  ]
}

// ── Main export function ──────────────────────────────────────────────────────

export async function exportManuscript({ project, structure, projectId, platformId, authorName }) {
  const platform = PLATFORMS.find(p => p.id === platformId) || PLATFORMS[0]
  const proj     = { ...project, authorName: authorName || project?.authorName || '[AUTHOR NAME]' }

  const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import('docx')

  const chapters = getAllChapters(structure || { hasParts: false, chapters: [] })

  // Load all scene content
  const sceneIds = chapters.flatMap(ch => ch.scenes.map(s => s.id))
  const snaps    = await Promise.all(sceneIds.map(id => getDoc(doc(db, 'projects', projectId, 'scenes', id))))
  const contentMap = {}
  sceneIds.forEach((id, i) => { contentMap[id] = snaps[i].exists() ? snaps[i].data().content : '' })

  const children = [
    ...buildFrontMatter(proj, platform, { Paragraph, TextRun, AlignmentType }),
  ]

  // Chapter content
  for (const [ci, chapter] of chapters.entries()) {
    if (ci > 0) children.push(new Paragraph({ children: [], spacing: { before: 960, after: 0 } }))

    // Chapter heading
    children.push(new Paragraph({
      children:  [new TextRun({ text: chapter.title?.toUpperCase() || 'CHAPTER', bold: true, size: platform.size + 6, font: platform.font })],
      alignment: AlignmentType.CENTER,
      spacing:   { line: platform.lineSpacing, before: 480, after: 480 },
    }))

    for (const [si, scene] of chapter.scenes.entries()) {
      const html  = contentMap[scene.id] || ''
      const paras = htmlToParagraphs(html, { Paragraph, TextRun, AlignmentType }, platform)
      children.push(...paras)

      if (si < chapter.scenes.length - 1) {
        children.push(new Paragraph({
          children:  [new TextRun({ text: '* * *', font: platform.font, size: platform.size })],
          alignment: AlignmentType.CENTER,
          spacing:   { line: platform.lineSpacing, before: 480, after: 480 },
        }))
      }
    }
  }

  // Back matter
  children.push(...buildBackMatter(proj, platform, { Paragraph, TextRun, AlignmentType }))

  const docx = new Document({
    creator:  'Axiom',
    title:    proj.title || 'Untitled',
    sections: [{
      properties: {
        page: { margin: platform.margins },
      },
      children: children.filter(Boolean),
    }],
  })

  const blob     = await Packer.toBlob(docx)
  const url      = URL.createObjectURL(blob)
  const a        = document.createElement('a')
  const filename = `${(proj.title || 'manuscript').replace(/[^a-z0-9 _-]/gi, '_')}_${platform.shortLabel}`
  a.href         = url
  a.download     = `${filename}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
