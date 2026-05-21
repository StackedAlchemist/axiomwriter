/**
 * Cover Engine
 * - Claude: build optimized image-generation prompts + back-cover synopsis
 * - Stability AI: generate cover image variations
 * - Canvas: composite wraparound spread → PNG / PDF (jsPDF, 300 dpi)
 */
import { jsPDF } from 'jspdf'
import { callAnthropic, extractText, DEFAULT_FAST_MODEL } from '../utils/buildAnthropicRequest'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { getAuth } from 'firebase/auth'

function strip(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// ── Cover styles ──────────────────────────────────────────────────────────────

export const COVER_STYLES = [
  { value: 'cinematic',    label: 'Cinematic',          desc: 'Film-quality lighting, dramatic composition' },
  { value: 'illustrated',  label: 'Illustrated',        desc: 'Painterly, detailed, book-art style' },
  { value: 'atmospheric',  label: 'Dark & Atmospheric', desc: 'Moody, shadowy, evocative' },
  { value: 'minimalist',   label: 'Minimalist',         desc: 'Clean, symbolic, typographic focus' },
  { value: 'vintage',      label: 'Vintage',            desc: 'Pulp-era, textured, retro feel' },
  { value: 'custom',       label: 'Custom',             desc: 'Describe your own aesthetic' },
]

export const COLOR_PALETTES = [
  { value: 'dark',          label: 'Dark',          colors: ['#0a0a0f', '#1a1a2e', '#16213e'] },
  { value: 'light',         label: 'Light',         colors: ['#f8f6f0', '#e8e0d4', '#d4c8b8'] },
  { value: 'warm',          label: 'Warm',          colors: ['#2d1b0e', '#8b3a1a', '#c8702a'] },
  { value: 'cool',          label: 'Cool',          colors: ['#0d1b2e', '#1e3a5f', '#2e6fa8'] },
  { value: 'monochromatic', label: 'Monochromatic', colors: ['#1a1a1a', '#4a4a4a', '#8a8a8a'] },
  { value: 'custom',        label: 'Custom',        colors: [] },
]

export const FONT_STYLES = [
  { value: 'serif',       label: 'Serif',       example: 'Georgia, Times' },
  { value: 'sans',        label: 'Sans-Serif',  example: 'Clean, Modern' },
  { value: 'script',      label: 'Script',      example: 'Elegant, Flowing' },
  { value: 'display',     label: 'Display',     example: 'Bold, Impactful' },
  { value: 'fantasy',     label: 'Fantasy',     example: 'Runic, Ornate' },
]

export const TRIM_SIZES = [
  { id: 'kdp_5x8',      label: '5" × 8" (KDP popular)',       w: 5,   h: 8,   platform: 'kdp' },
  { id: 'kdp_55x85',    label: '5.5" × 8.5" (KDP standard)', w: 5.5, h: 8.5, platform: 'kdp' },
  { id: 'kdp_6x9',      label: '6" × 9" (KDP large)',         w: 6,   h: 9,   platform: 'kdp' },
  { id: 'ingram_6x9',   label: '6" × 9" (IngramSpark)',       w: 6,   h: 9,   platform: 'ingram' },
  { id: 'ingram_55x85', label: '5.5" × 8.5" (IngramSpark)',   w: 5.5, h: 8.5, platform: 'ingram' },
]

// Spine width calculation (in inches): pages × paper thickness
export function calcSpineWidth(pageCount, paperType = 'cream50') {
  const thickness = { cream50: 0.002252, white60: 0.002143, white50: 0.002005 }
  return Math.max(0.125, pageCount * (thickness[paperType] || 0.002252))
}

// ── Step 1: Claude builds optimized prompt ────────────────────────────────────

export async function buildCoverPrompt({
  project,
  characters,
  loreEntries,
  style,
  customStyle,
  primaryVisual,
  colorPalette,
  customColors,
  autoPopulate,
}) {
  const genre = project?.genre || 'Fiction'

  // Build context from project data
  let context = `TITLE: ${project?.title || 'Untitled'}\nGENRE: ${genre}\n`

  if (autoPopulate) {
    // Add main character descriptions
    const mainChars = characters
      ?.filter(c => ['protagonist', 'major'].includes(c.role))
      .slice(0, 2)
    if (mainChars?.length) {
      context += `\nMAIN CHARACTERS:\n`
      mainChars.forEach(c => {
        const phys = c.physicalDescription
        if (phys) {
          context += `- ${c.name}: ${[phys.age, phys.height, phys.build, phys.hairColor && `${phys.hairColor} hair`, phys.eyeColor && `${phys.eyeColor} eyes`, phys.distinctiveFeatures].filter(Boolean).join(', ')}\n`
        }
      })
    }

    // Add world aesthetic from lore
    const worldEntries = loreEntries
      ?.filter(e => ['World', 'Setting', 'Geography', 'Aesthetic', 'Magic', 'Technology'].some(
        cat => (e.category || '').toLowerCase().includes(cat.toLowerCase())
      ))
      .slice(0, 5)
    if (worldEntries?.length) {
      context += `\nWORLD AESTHETIC:\n`
      worldEntries.forEach(e => {
        context += `- ${e.title}: ${strip(e.content).slice(0, 200)}\n`
      })
    }

    // Tone keywords from lore flexibility (locked = established tone)
    const toneEntries = loreEntries?.filter(e => e.flexibility === 'locked').slice(0, 3)
    if (toneEntries?.length) {
      context += `\nESTABLISHED WORLD TONE: ${toneEntries.map(e => e.title).join(', ')}\n`
    }
  }

  const styleText = style === 'custom' ? customStyle : COVER_STYLES.find(s => s.value === style)?.desc || style
  const paletteText = colorPalette === 'custom'
    ? `Custom colors: ${customColors || 'dark and moody'}`
    : COLOR_PALETTES.find(p => p.value === colorPalette)?.label || colorPalette

  try {
    const data  = await callAnthropic({
      model:      DEFAULT_FAST_MODEL,
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You are a professional book cover art director. Build an optimized text-to-image prompt for a ${genre} book cover.

${context}

STYLE: ${styleText}
PRIMARY VISUAL: ${primaryVisual || 'Choose the most compelling visual element from the world'}
COLOR PALETTE: ${paletteText}

Generate TWO optimized image prompts (Prompt A and Prompt B) for this cover.
- Each prompt should be 60-100 words
- Focus on visual composition, lighting, mood, and key elements
- Include camera angle, lighting style, color mood
- Never include text, titles, or words in the image
- Make A and B genuinely different in composition/approach

Return ONLY valid JSON:
{"promptA": "...", "promptB": "...", "styleKeywords": ["keyword1","keyword2","keyword3"]}`,
      }],
    })
    const raw   = extractText(data)
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return null
    return JSON.parse(match[0])
  } catch (err) {
    console.error('[buildCoverPrompt]', err)
    return null
  }
}

// ── Step 2: Generate image via Stability AI ───────────────────────────────────

export async function generateCoverImage(prompt, trimSize = TRIM_SIZES[0]) {
  const user = getAuth().currentUser
  if (!user) return null

  try {
    const fn = httpsCallable(getFunctions(undefined, 'us-central1'), 'generateImage')
    const result = await fn({
      userId: user.uid,
      prompt,
      width:  832,
      height: 1216,
    })
    const b64 = result.data?.base64
    return b64 ? `data:image/png;base64,${b64}` : null
  } catch (err) {
    console.error('[generateCoverImage]', err)
    return null
  }
}

// ── Synopsis (back cover blurb) via Claude ────────────────────────────────────

export async function generateSynopsis({
  project,
  characters,
  loreEntries,
  sceneExcerpts,  // first 20% of manuscript text
}) {
  const genre    = project?.genre || 'Fiction'
  const title    = project?.title || 'Untitled'
  const existing = project?.synopsis ? `AUTHOR'S OWN SYNOPSIS:\n${project.synopsis}\n\n` : ''

  const protagonist = characters?.find(c => c.role === 'protagonist')
  const charContext = protagonist
    ? `PROTAGONIST: ${protagonist.name}${protagonist.physicalDescription?.age ? `, ${protagonist.physicalDescription.age}` : ''}. ${strip(protagonist.backstory || '').slice(0, 200)}`
    : ''

  const worldContext = loreEntries
    ?.filter(e => e.flexibility === 'locked')
    .slice(0, 6)
    .map(e => `${e.title}: ${strip(e.content).slice(0, 150)}`)
    .join('\n') || ''

  const manuscriptExcerpt = (sceneExcerpts || '').slice(0, 1500)

  try {
    const data = await callAnthropic({
      model:      DEFAULT_FAST_MODEL,
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You are a professional book editor writing a back cover blurb for a ${genre} novel.

TITLE: ${title}
${existing}${charContext ? `\n${charContext}\n` : ''}
${worldContext ? `WORLD:\n${worldContext}\n` : ''}
${manuscriptExcerpt ? `MANUSCRIPT OPENING:\n${manuscriptExcerpt}\n` : ''}

Write a 150-200 word back cover synopsis following these conventions:
1. HOOK (1-2 sentences): Who is the protagonist, what is their world
2. INCITING INCIDENT (2-3 sentences): What changes everything, what is at stake
3. STAKES (1-2 sentences): What they stand to lose
4. INTRIGUE QUESTION (1 sentence ending with an implied question): Never reveal the resolution

Tone must match the genre. No spoilers. Present tense. Third person.
Return ONLY the blurb text, nothing else.`,
      }],
    })
    return extractText(data) || null
  } catch (err) {
    console.error('[generateSynopsis]', err)
    return null
  }
}

// ── Canvas: composite wraparound spread ──────────────────────────────────────

/**
 * Returns a Promise<HTMLCanvasElement> of the full cover spread at the given DPI.
 * Front cover image fills the front panel; spine and back get gradient fills.
 */
export function compositeWrapSpread({
  frontImageDataUrl,
  trimSize,
  pageCount,
  title,
  authorName,
  seriesName,
  synopsis,
  fontStyle,
  dpi = 300,
}) {
  const trim    = TRIM_SIZES.find(t => t.id === trimSize) || TRIM_SIZES[0]
  const BLEED   = 0.125
  const spinePx = calcSpineWidth(pageCount || 300) // inches

  // Canvas dimensions in pixels at DPI
  const frontW = (trim.w + BLEED) * dpi
  const frontH = (trim.h + BLEED * 2) * dpi
  const spineW = spinePx * dpi
  const backW  = frontW
  const totalW = backW + spineW + frontW
  const totalH = frontH

  const canvas = document.createElement('canvas')
  canvas.width  = Math.round(totalW)
  canvas.height = Math.round(totalH)
  const ctx = canvas.getContext('2d')

  // Back cover — dark gradient
  const backGrad = ctx.createLinearGradient(0, 0, backW, 0)
  backGrad.addColorStop(0, '#0d0d14')
  backGrad.addColorStop(1, '#1a1a28')
  ctx.fillStyle = backGrad
  ctx.fillRect(0, 0, backW, totalH)

  // Spine — dark
  ctx.fillStyle = '#0a0a10'
  ctx.fillRect(backW, 0, spineW, totalH)

  const overlayArgs = { trim, totalW, totalH, frontW, frontH, spineW, backW, title, authorName, seriesName, synopsis, fontStyle, dpi, BLEED }

  if (frontImageDataUrl) {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.onload = () => {
        ctx.drawImage(img, backW + spineW, 0, frontW, frontH)
        addTextOverlays(ctx, overlayArgs)
        resolve(canvas)
      }
      img.onerror = reject
      img.src = frontImageDataUrl
    })
  }

  // Placeholder front cover gradient
  const frontGrad = ctx.createLinearGradient(backW + spineW, 0, totalW, totalH)
  frontGrad.addColorStop(0, '#1a1428')
  frontGrad.addColorStop(0.5, '#2d1b3d')
  frontGrad.addColorStop(1, '#0d0a1a')
  ctx.fillStyle = frontGrad
  ctx.fillRect(backW + spineW, 0, frontW, frontH)
  addTextOverlays(ctx, overlayArgs)
  return Promise.resolve(canvas)
}

function addTextOverlays(ctx, { trim, totalW, totalH, frontW, frontH, spineW, backW, title, authorName, seriesName, synopsis, fontStyle, dpi, BLEED }) {
  const FONTS = {
    serif:   'Georgia, serif',
    sans:    'Arial, sans-serif',
    script:  'Palatino Linotype, serif',
    display: 'Impact, sans-serif',
    fantasy: 'Palatino Linotype, serif',
  }
  const font = FONTS[fontStyle] || FONTS.serif

  // Front cover title
  const titleSize = Math.round(trim.w * dpi * 0.08)
  ctx.font        = `bold ${titleSize}px ${font}`
  ctx.fillStyle   = 'white'
  ctx.textAlign   = 'center'
  ctx.shadowColor = 'rgba(0,0,0,0.8)'
  ctx.shadowBlur  = Math.round(titleSize * 0.2)

  const frontCenterX = backW + spineW + frontW / 2
  wrapText(ctx, title || 'UNTITLED', frontCenterX, totalH * 0.15, frontW * 0.85, titleSize * 1.2)

  // Author name
  const authorSize = Math.round(titleSize * 0.45)
  ctx.font         = `${authorSize}px ${font}`
  ctx.fillStyle    = 'rgba(255,255,255,0.85)'
  ctx.fillText(authorName || 'Author Name', frontCenterX, totalH - (BLEED * dpi) - authorSize * 1.5)

  // Series name
  if (seriesName) {
    const seriesSize = Math.round(titleSize * 0.35)
    ctx.font      = `italic ${seriesSize}px ${font}`
    ctx.fillStyle = 'rgba(255,220,150,0.8)'
    ctx.fillText(seriesName, frontCenterX, (BLEED * dpi) + seriesSize * 2)
  }

  // Spine text
  ctx.save()
  ctx.translate(backW + spineW / 2, totalH / 2)
  ctx.rotate(-Math.PI / 2)
  const spineFont = Math.round(spineW * 0.55)
  ctx.font        = `bold ${spineFont}px ${font}`
  ctx.fillStyle   = 'white'
  ctx.textAlign   = 'center'
  ctx.shadowBlur  = spineFont * 0.2
  ctx.fillText(`${title || 'Title'} · ${authorName || 'Author'}`, 0, spineFont * 0.35)
  ctx.restore()

  // Back cover synopsis
  if (synopsis) {
    const synSize  = Math.round(trim.w * dpi * 0.022)
    ctx.font       = `${synSize}px ${font}`
    ctx.fillStyle  = 'rgba(220,215,210,0.9)'
    ctx.textAlign  = 'left'
    ctx.shadowBlur = synSize * 0.3
    const margin   = backW * 0.08
    wrapText(ctx, synopsis, margin, totalH * 0.12, backW - margin * 2, synSize * 1.5)
  }

  // Back cover author name
  const backAuthorSize = Math.round(trim.w * dpi * 0.025)
  ctx.font      = `bold ${backAuthorSize}px ${font}`
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.textAlign = 'left'
  const margin  = backW * 0.08
  ctx.fillText(authorName || 'Author Name', margin, totalH - BLEED * dpi - backAuthorSize * 1.5)

  // ISBN/barcode placeholder
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth   = 1
  ctx.strokeRect(margin, totalH - BLEED * dpi - backAuthorSize * 5, backW * 0.25, backAuthorSize * 3.5)
  ctx.font      = `${backAuthorSize * 0.7}px ${font}`
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.fillText('ISBN / BARCODE', margin + backW * 0.035, totalH - BLEED * dpi - backAuthorSize * 2.5)

  // Bleed guides (crop marks)
  ctx.strokeStyle = 'rgba(255,0,0,0.3)'
  ctx.lineWidth   = 1
  const bl        = BLEED * dpi
  // Corner marks
  ;[[0, 0], [totalW, 0], [0, totalH], [totalW, totalH]].forEach(([cx, cy]) => {
    const sx = cx === 0 ? 0 : totalW - bl * 2
    const sy = cy === 0 ? 0 : totalH - bl * 2
    ctx.strokeRect(sx, sy, bl * 2, bl * 2)
  })
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = (text || '').split(' ')
  let line = ''
  let currentY = y

  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY)
      line     = word
      currentY += lineHeight
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, currentY)
}

// ── PNG export from canvas ────────────────────────────────────────────────────

export function exportCoverPNG(canvas, filename = 'cover.png') {
  const url  = canvas.toDataURL('image/png')
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
}

// ── PDF export from canvas (print-ready, correct trim dimensions) ─────────────

export function exportSpreadPDF(canvas, trimSizeId, pageCount, title) {
  const trim   = TRIM_SIZES.find(t => t.id === trimSizeId) || TRIM_SIZES[0]
  const BLEED  = 0.125
  const spineIn = calcSpineWidth(pageCount || 300)

  // Total spread dimensions in inches (with bleed)
  const totalW = (trim.w + BLEED) * 2 + spineIn
  const totalH = trim.h + BLEED * 2

  const pdf = new jsPDF({
    orientation: totalW > totalH ? 'landscape' : 'portrait',
    unit:        'in',
    format:      [totalW, totalH],
  })

  const imgData = canvas.toDataURL('image/png')
  pdf.addImage(imgData, 'PNG', 0, 0, totalW, totalH)
  pdf.save(`${title || 'cover'}_spread_print-ready.pdf`)
}
