/**
 * generate-icons.mjs — Run once with: node scripts/generate-icons.mjs
 *
 * Creates all PWA icon PNGs from scratch using pure Node.js (no dependencies).
 * Icon design: dark navy (#080818) background, gold (#C9A84C) "A" letterform.
 */

import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'

// ── CRC32 for PNG chunk integrity ─────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = (c >>> 8) ^ CRC_TABLE[(c ^ b) & 0xff]
  return (c ^ 0xffffffff) >>> 0
}

function u32(n) {
  return Buffer.from([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff])
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  return Buffer.concat([u32(data.length), t, data, u32(crc32(Buffer.concat([t, data])))])
}

// ── Distance from point P to line segment A-B ─────────────────────────────────
function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(px - ax, py - ay)
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

// ── Check if pixel (x, y) is part of the "A" letterform ──────────────────────
function isInA(x, y, size) {
  const sw   = Math.max(1.5, size * 0.068)  // stroke width
  const s    = size

  // Apex and base points of the "A"
  const tx = s * 0.5,  ty = s * 0.18  // top apex
  const blx = s * 0.18, bly = s * 0.83  // bottom-left
  const brx = s * 0.82, bry = s * 0.83  // bottom-right

  // Left and right legs
  if (distToSeg(x, y, tx, ty, blx, bly) < sw) return true
  if (distToSeg(x, y, tx, ty, brx, bry) < sw) return true

  // Crossbar at ~55% down each leg
  const t_c    = 0.52
  const cxl    = tx + t_c * (blx - tx)   // crossbar left x
  const cxr    = tx + t_c * (brx - tx)   // crossbar right x
  const cy_bar = ty + t_c * (bly - ty)   // crossbar y

  if (distToSeg(x, y, cxl, cy_bar, cxr, cy_bar) < sw) return true
  return false
}

// ── Build PNG for a given size ────────────────────────────────────────────────
function makePNG(size) {
  const BG = [8,   8,  24]   // #080818
  const FG = [201, 168, 76]  // #C9A84C gold

  // One scanline = filter byte (0) + RGB per pixel
  const raw = Buffer.alloc(size * (1 + size * 3))
  let off = 0

  for (let y = 0; y < size; y++) {
    raw[off++] = 0 // filter: None
    for (let x = 0; x < size; x++) {
      const color = isInA(x, y, size) ? FG : BG
      raw[off++] = color[0]
      raw[off++] = color[1]
      raw[off++] = color[2]
    }
  }

  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = chunk('IHDR', Buffer.concat([u32(size), u32(size), Buffer.from([8, 2, 0, 0, 0])]))
  const idat = chunk('IDAT', deflateSync(raw))
  const iend = chunk('IEND', Buffer.alloc(0))

  return Buffer.concat([sig, ihdr, idat, iend])
}

// ── Generate all icon sizes ───────────────────────────────────────────────────
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

mkdirSync('public/icons', { recursive: true })

for (const s of SIZES) {
  writeFileSync(`public/icons/icon-${s}.png`, makePNG(s))
  console.log(`✓  public/icons/icon-${s}.png`)
}

console.log(`\nAll ${SIZES.length} icons generated in public/icons/`)
console.log('Replace these with professionally designed icons before production launch.')
