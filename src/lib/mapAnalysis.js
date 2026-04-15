/**
 * Map Analysis Engine
 * - Claude: analyze lore for geographic relationships and suggest pin placements
 * - Procedural: generate stylized canvas backgrounds (no external API required)
 * - Optional: Stability AI for AI-generated backgrounds (requires key in settings)
 */

import { callAnthropic, extractText, DEFAULT_FAST_MODEL } from '../utils/buildAnthropicRequest'

// ── Claude: Analyze lore for map layout ──────────────────────────────────────

/**
 * Analyzes lore entries to extract geographic structure and suggest map layout.
 * Returns { locations, naturalBarriers, factionTerritories, mapDescription }
 */
export async function analyzeLoreForMap(loreEntries, mapWidth = 1600, mapHeight = 900) {
  if (!import.meta.env.VITE_ANTHROPIC_API_KEY || !loreEntries.length) return null

  function strip(html) { return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() }

  const locationEntries = loreEntries.filter(e =>
    ['Location', 'Place', 'Geography', 'Setting', 'Region', 'City', 'Town'].some(
      cat => (e.category || '').toLowerCase().includes(cat.toLowerCase())
    )
  )
  const factionEntries = loreEntries.filter(e =>
    ['Faction', 'Organization', 'Kingdom', 'Nation', 'Empire', 'Group'].some(
      cat => (e.category || '').toLowerCase().includes(cat.toLowerCase())
    )
  )
  const otherEntries = loreEntries
    .filter(e => !locationEntries.includes(e) && !factionEntries.includes(e))
    .slice(0, 10)

  const loreText = [
    locationEntries.length ? `LOCATIONS:\n${locationEntries.map(e => `- ${e.title}: ${strip(e.content).slice(0, 300)}`).join('\n')}` : '',
    factionEntries.length ? `FACTIONS:\n${factionEntries.map(e => `- ${e.title}: ${strip(e.content).slice(0, 200)}`).join('\n')}` : '',
    otherEntries.length   ? `OTHER LORE:\n${otherEntries.map(e => `- ${e.title}: ${strip(e.content).slice(0, 150)}`).join('\n')}` : '',
  ].filter(Boolean).join('\n\n')

  try {
    const data = await callAnthropic({
      model:      DEFAULT_FAST_MODEL,
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `You are a fantasy cartographer. Analyze this world's lore and generate a map layout.

LORE:
${loreText}

Map canvas is ${mapWidth}x${mapHeight} pixels. Coordinate (0,0) is top-left.

Generate a logical geographic layout. Return ONLY valid JSON:
{
  "mapDescription": "2-3 sentence description of the world's geography for image generation",
  "locations": [
    { "name": "location name", "x": 0-${mapWidth}, "y": 0-${mapHeight}, "type": "city|town|landmark|dungeon|wilderness|sea|mountain", "loreEntryId": "id or null", "notes": "brief context" }
  ],
  "naturalBarriers": [
    { "type": "mountain_range|ocean|river|forest|desert", "description": "brief description of placement" }
  ],
  "factionTerritories": [
    { "name": "faction name", "color": "#hex color", "loreEntryId": "id or null", "centerX": number, "centerY": number, "notes": "brief territory description" }
  ]
}

Rules:
- Spread locations logically across the canvas
- Place cities near coasts or rivers where lore supports it
- Mountain ranges as natural barriers between territories
- Each faction gets a distinct hex color
- Max 15 locations, 4 faction territories`,
      }],
    })
    const raw   = extractText(data)
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return null
    return JSON.parse(match[0])
  } catch (err) {
    console.error('[mapAnalysis]', err)
    return null
  }
}

// ── Procedural background generation ─────────────────────────────────────────

/**
 * Generates a stylized map background using HTML5 Canvas.
 * Returns a data URL string.
 */
export function generateProceduralBackground(style, width = 1600, height = 900) {
  const canvas = document.createElement('canvas')
  canvas.width  = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  switch (style) {
    case 'parchment':  drawParchment(ctx, width, height);  break
    case 'fantasy':    drawFantasy(ctx, width, height);    break
    case 'schematic':  drawSchematic(ctx, width, height);  break
    case 'modern':     drawModern(ctx, width, height);     break
    default:           drawParchment(ctx, width, height)
  }

  return canvas.toDataURL('image/png')
}

// ── Parchment style ───────────────────────────────────────────────────────────
function drawParchment(ctx, w, h) {
  // Base parchment color
  ctx.fillStyle = '#e8d5a3'
  ctx.fillRect(0, 0, w, h)

  // Aged texture via noise-like layers
  for (let i = 0; i < 8000; i++) {
    const x    = Math.random() * w
    const y    = Math.random() * h
    const size = Math.random() * 3 + 0.5
    const alpha = Math.random() * 0.06
    ctx.fillStyle = Math.random() > 0.5
      ? `rgba(120, 90, 40, ${alpha})`
      : `rgba(200, 170, 100, ${alpha})`
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }

  // Edge darkening (aged paper effect)
  const edge = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.85)
  edge.addColorStop(0, 'rgba(0,0,0,0)')
  edge.addColorStop(1, 'rgba(80, 50, 20, 0.35)')
  ctx.fillStyle = edge
  ctx.fillRect(0, 0, w, h)

  // Faint grid lines (cartographic feel)
  ctx.strokeStyle = 'rgba(140, 110, 60, 0.15)'
  ctx.lineWidth   = 0.5
  const step = 80
  for (let x = 0; x < w; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }

  // Decorative border
  ctx.strokeStyle = 'rgba(110, 80, 40, 0.5)'
  ctx.lineWidth   = 3
  ctx.strokeRect(16, 16, w - 32, h - 32)
  ctx.lineWidth = 1
  ctx.strokeRect(22, 22, w - 44, h - 44)

  // Organic land shape (sea areas)
  ctx.fillStyle = 'rgba(100, 150, 180, 0.18)'
  ctx.beginPath()
  ctx.moveTo(0, h * 0.7)
  ctx.bezierCurveTo(w * 0.2, h * 0.6, w * 0.35, h * 0.85, w * 0.5, h * 0.75)
  ctx.bezierCurveTo(w * 0.65, h * 0.65, w * 0.8, h * 0.9, w, h * 0.8)
  ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath()
  ctx.fill()
}

// ── Fantasy style ─────────────────────────────────────────────────────────────
function drawFantasy(ctx, w, h) {
  // Sky/sea gradient
  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0,   '#1a3a2a')
  grad.addColorStop(0.4, '#2d5a3d')
  grad.addColorStop(0.7, '#3d7a55')
  grad.addColorStop(1,   '#1a2a4a')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Land masses
  const landGrad = ctx.createRadialGradient(w * 0.45, h * 0.45, 0, w * 0.45, h * 0.45, w * 0.5)
  landGrad.addColorStop(0,   '#5a7a3a')
  landGrad.addColorStop(0.6, '#4a6a2a')
  landGrad.addColorStop(1,   'rgba(0,0,0,0)')
  ctx.fillStyle = landGrad
  ctx.beginPath()
  ctx.ellipse(w * 0.45, h * 0.45, w * 0.38, h * 0.38, 0.3, 0, Math.PI * 2)
  ctx.fill()

  // Secondary land mass
  const land2 = ctx.createRadialGradient(w * 0.75, h * 0.3, 0, w * 0.75, h * 0.3, w * 0.2)
  land2.addColorStop(0,   '#4a6a2a')
  land2.addColorStop(1,   'rgba(0,0,0,0)')
  ctx.fillStyle = land2
  ctx.beginPath()
  ctx.ellipse(w * 0.75, h * 0.3, w * 0.16, h * 0.18, -0.2, 0, Math.PI * 2)
  ctx.fill()

  // Atmospheric glow
  const atmos = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.3, w * 0.7)
  atmos.addColorStop(0,   'rgba(255, 200, 100, 0.06)')
  atmos.addColorStop(1,   'rgba(0, 0, 0, 0)')
  ctx.fillStyle = atmos
  ctx.fillRect(0, 0, w, h)

  // Sea shimmer
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * w; const y = Math.random() * h
    ctx.fillStyle = `rgba(100, 160, 200, ${Math.random() * 0.04})`
    ctx.fillRect(x, y, Math.random() * 30 + 5, 1)
  }

  // Decorative corner flourishes
  drawCornerFlourishFantasy(ctx, 20, 20, 1)
  drawCornerFlourishFantasy(ctx, w - 20, 20, 2)
  drawCornerFlourishFantasy(ctx, 20, h - 20, 3)
  drawCornerFlourishFantasy(ctx, w - 20, h - 20, 4)
}

function drawCornerFlourishFantasy(ctx, x, y, corner) {
  ctx.save()
  ctx.translate(x, y)
  if (corner === 2) ctx.scale(-1, 1)
  if (corner === 3) ctx.scale(1, -1)
  if (corner === 4) ctx.scale(-1, -1)
  ctx.strokeStyle = 'rgba(200, 170, 80, 0.4)'
  ctx.lineWidth   = 1.5
  ctx.beginPath()
  ctx.moveTo(0, 40); ctx.lineTo(0, 0); ctx.lineTo(40, 0)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(0, 0, 8, 0, Math.PI / 2)
  ctx.stroke()
  ctx.restore()
}

// ── Schematic style ───────────────────────────────────────────────────────────
function drawSchematic(ctx, w, h) {
  ctx.fillStyle = '#0a1628'
  ctx.fillRect(0, 0, w, h)

  // Grid
  ctx.strokeStyle = 'rgba(40, 80, 140, 0.5)'
  ctx.lineWidth = 0.5
  const step = 40
  for (let x = 0; x < w; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }

  // Major grid
  ctx.strokeStyle = 'rgba(60, 120, 200, 0.3)'
  ctx.lineWidth   = 1
  for (let x = 0; x < w; x += step * 5) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (let y = 0; y < h; y += step * 5) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }

  // Scan line effect
  for (let y = 0; y < h; y += 2) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
    ctx.fillRect(0, y, w, 1)
  }

  // Border
  ctx.strokeStyle = 'rgba(60, 140, 220, 0.7)'
  ctx.lineWidth   = 2
  ctx.strokeRect(10, 10, w - 20, h - 20)

  // Corner brackets
  const bSize = 20
  ctx.lineWidth = 2
  ;[[10, 10], [w - 10, 10], [10, h - 10], [w - 10, h - 10]].forEach(([cx, cy], i) => {
    ctx.save()
    ctx.translate(cx, cy)
    if (i === 1) ctx.scale(-1, 1)
    if (i === 2) ctx.scale(1, -1)
    if (i === 3) ctx.scale(-1, -1)
    ctx.beginPath()
    ctx.moveTo(bSize, 0); ctx.lineTo(0, 0); ctx.lineTo(0, bSize)
    ctx.stroke()
    ctx.restore()
  })

  // Classification watermark
  ctx.font      = '11px monospace'
  ctx.fillStyle = 'rgba(60, 140, 220, 0.25)'
  ctx.textAlign = 'center'
  ctx.fillText('CLASSIFIED — WORLD TACTICAL OVERVIEW', w / 2, h - 18)
}

// ── Modern style ──────────────────────────────────────────────────────────────
function drawModern(ctx, w, h) {
  ctx.fillStyle = '#f0f4f8'
  ctx.fillRect(0, 0, w, h)

  // Sea area
  const seaGrad = ctx.createLinearGradient(0, h * 0.55, 0, h)
  seaGrad.addColorStop(0, '#c8dff0')
  seaGrad.addColorStop(1, '#a0c4e8')
  ctx.fillStyle = seaGrad
  ctx.beginPath()
  ctx.moveTo(0, h * 0.6)
  ctx.bezierCurveTo(w * 0.3, h * 0.55, w * 0.6, h * 0.65, w, h * 0.58)
  ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath()
  ctx.fill()

  // Land
  const landGrad = ctx.createLinearGradient(0, 0, 0, h * 0.65)
  landGrad.addColorStop(0, '#e8f0e0')
  landGrad.addColorStop(1, '#d4e8c8')
  ctx.fillStyle = landGrad
  ctx.beginPath()
  ctx.moveTo(0, 0); ctx.lineTo(w, 0)
  ctx.lineTo(w, h * 0.58)
  ctx.bezierCurveTo(w * 0.6, h * 0.65, w * 0.3, h * 0.55, 0, h * 0.6)
  ctx.closePath()
  ctx.fill()

  // Thin grid
  ctx.strokeStyle = 'rgba(150, 170, 190, 0.25)'
  ctx.lineWidth   = 0.5
  const step = 80
  for (let x = 0; x < w; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }

  // Clean border
  ctx.strokeStyle = 'rgba(100, 130, 160, 0.5)'
  ctx.lineWidth   = 1.5
  ctx.strokeRect(8, 8, w - 16, h - 16)
}

// ── Stability AI integration (optional) ──────────────────────────────────────

/**
 * Generates a map background using Stability AI (requires VITE_STABILITY_API_KEY).
 * Returns a data URL or null.
 */
export async function generateStabilityBackground(mapDescription, style, width = 1024, height = 576) {
  const key = import.meta.env.VITE_STABILITY_API_KEY
  if (!key) return null

  const stylePrompts = {
    parchment: 'antique parchment map, aged paper, hand-drawn cartography, sepia tones, fantasy map style, ink illustrations, detailed topography',
    fantasy:   'fantasy world map, painterly illustration, vibrant colors, epic fantasy art, detailed terrain, forests mountains oceans',
    schematic: 'military tactical map, blueprint style, dark background, cyan lines, grid overlay, technical diagram, classified document',
    modern:    'contemporary atlas map, clean minimalist design, pastel colors, modern cartography, geographic survey style',
  }

  const prompt = `${stylePrompts[style] || stylePrompts.parchment}, ${mapDescription}, bird\'s eye view, top-down perspective, no text, no labels`

  try {
    const formData = new FormData()
    formData.append('prompt', prompt)
    formData.append('output_format', 'png')
    formData.append('width',  String(width))
    formData.append('height', String(height))
    formData.append('cfg_scale', '7')
    formData.append('samples',   '1')

    const res = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body:    formData,
    })
    if (!res.ok) return null
    const data = await res.json()
    const b64  = data.artifacts?.[0]?.base64
    return b64 ? `data:image/png;base64,${b64}` : null
  } catch {
    return null
  }
}
