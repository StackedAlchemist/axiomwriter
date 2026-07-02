import React from 'react'
import { Line, Circle, Rect, Ellipse, Path } from 'react-konva'

/**
 * Stamp Library — vector map assets for the world map builder.
 * Every stamp is drawn with Konva primitives in a local ~44px space centered
 * on the origin (baseline around y=12), so the parent Group can position,
 * scale, rotate, and flip it freely. Colors adapt to the map's visual style.
 */

// ── Style palettes ────────────────────────────────────────────────────────────
const PALETTES = {
  parchment: {
    ink: '#4a3520', rock: '#8a7660', rockDark: '#6a5a48', snow: '#f2ecd9',
    green: '#5a7a3a', greenDark: '#3f5c2a', trunk: '#7a5a38', sand: '#c9a85c',
    water: '#5b8fc9', stone: '#a09078', stoneDark: '#7c6e58', roof: '#a54b32',
    fire: '#d97a2a', tent: '#d8c9a8', sail: '#e8dfc8', serpent: '#3d6b52',
  },
  fantasy: {
    ink: '#16281a', rock: '#8a92a0', rockDark: '#5a6270', snow: '#ffffff',
    green: '#3f8a4a', greenDark: '#2a6136', trunk: '#6a4a30', sand: '#e0b860',
    water: '#3a7fd0', stone: '#b0a890', stoneDark: '#807860', roof: '#c04838',
    fire: '#ff8c2a', tent: '#e8dcc0', sail: '#f4eedd', serpent: '#3f7a68',
  },
  schematic: {
    ink: '#7ad0f0', rock: '#2f6f9f', rockDark: '#1d5580', snow: '#bfe8ff',
    green: '#2f9fb8', greenDark: '#1d7a92', trunk: '#2a6a94', sand: '#3a86b8',
    water: '#4aa8d8', stone: '#3a7fa8', stoneDark: '#26618a', roof: '#5ab8dd',
    fire: '#8ad8f8', tent: '#a8d8ee', sail: '#cfeafa', serpent: '#3a9fc8',
  },
  modern: {
    ink: '#334155', rock: '#94a3b8', rockDark: '#64748b', snow: '#f8fafc',
    green: '#4ade80', greenDark: '#22c55e', trunk: '#a16207', sand: '#fbbf24',
    water: '#3b82f6', stone: '#cbd5e1', stoneDark: '#94a3b8', roof: '#ef4444',
    fire: '#f97316', tent: '#e2e8f0', sail: '#f1f5f9', serpent: '#14b8a6',
  },
}

function pal(mapStyle) {
  return PALETTES[mapStyle] || PALETTES.parchment
}

// Common stroke props for the hand-inked outline look
function inked(c) {
  return { stroke: c.ink, strokeWidth: 1, lineJoin: 'round', lineCap: 'round' }
}

// ── Shape renderers ───────────────────────────────────────────────────────────
const SHAPES = {

  // ═══ TERRAIN ═══
  mountain: c => (
    <>
      <Line points={[-8, -6, -20, 12, 4, 12]} closed fill={c.rockDark} {...inked(c)} />
      <Line points={[2, -20, -12, 12, 18, 12]} closed fill={c.rock} {...inked(c)} />
      <Line points={[2, -20, -3, -8, 1, -6, 6, -10]} closed fill={c.snow} stroke={c.ink} strokeWidth={0.8} />
    </>
  ),

  snowpeak: c => (
    <>
      <Line points={[0, -22, -16, 12, 16, 12]} closed fill={c.rock} {...inked(c)} />
      <Line points={[0, -22, -7, -6, -3, -9, 0, -5, 4, -10, 7, -6]} closed fill={c.snow} stroke={c.ink} strokeWidth={0.8} />
    </>
  ),

  hills: c => (
    <>
      <Path data="M -20 10 Q -10 -8 0 10 Z" fill={c.green} {...inked(c)} />
      <Path data="M -4 10 Q 8 -12 20 10 Z" fill={c.greenDark} {...inked(c)} />
    </>
  ),

  volcano: c => (
    <>
      <Line points={[-6, -14, -16, 12, 16, 12, 6, -14]} closed fill={c.rockDark} {...inked(c)} />
      <Line points={[-6, -14, 0, -10, 6, -14]} closed fill={c.fire} stroke={c.ink} strokeWidth={0.8} />
      <Path data="M -2 -16 Q -6 -22 -1 -26 M 2 -16 Q 7 -21 3 -27" stroke={c.rock} strokeWidth={1.5} opacity={0.7} />
      <Line points={[0, -10, -3, 0, 1, 6]} stroke={c.fire} strokeWidth={1.5} opacity={0.8} />
    </>
  ),

  dunes: c => (
    <>
      <Path data="M -20 8 Q -8 -8 4 8 Z" fill={c.sand} {...inked(c)} />
      <Path data="M -2 10 Q 10 -4 20 10 Z" fill={c.sand} opacity={0.75} {...inked(c)} />
      <Path data="M -14 4 Q -8 -2 -2 4" stroke={c.ink} strokeWidth={0.6} opacity={0.5} />
    </>
  ),

  // ═══ VEGETATION ═══
  forest: c => (
    <>
      <Rect x={-1.5} y={2} width={3} height={9} fill={c.trunk} stroke={c.ink} strokeWidth={0.6} />
      <Circle y={-6} radius={9} fill={c.green} {...inked(c)} />
      <Circle x={-8} y={0} radius={6.5} fill={c.greenDark} {...inked(c)} />
      <Circle x={8} y={-1} radius={6.5} fill={c.green} {...inked(c)} />
    </>
  ),

  pines: c => (
    <>
      <Rect x={-9.2} y={6} width={2.4} height={5} fill={c.trunk} stroke={c.ink} strokeWidth={0.5} />
      <Line points={[-8, -12, -14, 6, -2, 6]} closed fill={c.greenDark} {...inked(c)} />
      <Rect x={5.8} y={8} width={2.4} height={4} fill={c.trunk} stroke={c.ink} strokeWidth={0.5} />
      <Line points={[7, -16, 0, 8, 14, 8]} closed fill={c.green} {...inked(c)} />
    </>
  ),

  palm: c => (
    <>
      <Path data="M 0 12 Q 3 0 1 -8" stroke={c.trunk} strokeWidth={2.5} lineCap="round" />
      <Path data="M 1 -8 Q -8 -14 -14 -8" stroke={c.green} strokeWidth={2} lineCap="round" />
      <Path data="M 1 -8 Q 10 -14 16 -8" stroke={c.green} strokeWidth={2} lineCap="round" />
      <Path data="M 1 -8 Q -4 -18 -10 -18" stroke={c.greenDark} strokeWidth={2} lineCap="round" />
      <Path data="M 1 -8 Q 6 -18 12 -17" stroke={c.greenDark} strokeWidth={2} lineCap="round" />
    </>
  ),

  swamp: c => (
    <>
      <Ellipse y={9} radiusX={16} radiusY={4} fill={c.water} opacity={0.5} stroke={c.ink} strokeWidth={0.6} />
      <Path data="M -8 9 L -8 -2 M -5 9 L -5 -6 M -2 9 L -2 -1" stroke={c.greenDark} strokeWidth={1.4} lineCap="round" />
      <Path data="M 8 8 Q 8 -4 12 -10 M 8 0 Q 12 -2 15 -1" stroke={c.trunk} strokeWidth={1.6} lineCap="round" />
      <Circle x={13} y={-11} radius={3.5} fill={c.greenDark} opacity={0.85} />
    </>
  ),

  plains: c => (
    <>
      {[-11, 0, 11].map(dx => (
        <Path
          key={dx}
          data={`M ${dx - 4} 10 Q ${dx - 3} 0 ${dx - 5} -4 M ${dx} 10 Q ${dx} -2 ${dx} -7 M ${dx + 4} 10 Q ${dx + 3} 0 ${dx + 5} -4`}
          stroke={c.green}
          strokeWidth={1.4}
          lineCap="round"
        />
      ))}
    </>
  ),

  // ═══ SETTLEMENTS ═══
  castle: c => (
    <>
      <Rect x={-14} y={-8} width={8} height={20} fill={c.stone} {...inked(c)} />
      <Rect x={6} y={-8} width={8} height={20} fill={c.stone} {...inked(c)} />
      <Rect x={-7} y={-2} width={14} height={14} fill={c.stoneDark} {...inked(c)} />
      <Line points={[-14, -8, -14, -12, -12, -12, -12, -10, -9, -10, -9, -12, -6, -12, -6, -8]} closed fill={c.stone} {...inked(c)} />
      <Line points={[6, -8, 6, -12, 8, -12, 8, -10, 11, -10, 11, -12, 14, -12, 14, -8]} closed fill={c.stone} {...inked(c)} />
      <Path data="M -3 12 L -3 6 Q 0 2 3 6 L 3 12 Z" fill={c.ink} opacity={0.85} />
      <Line points={[0, -12, 0, -20, 6, -18, 0, -16]} stroke={c.roof} strokeWidth={1.2} fill={c.roof} closed />
    </>
  ),

  tower: c => (
    <>
      <Rect x={-5} y={-14} width={10} height={26} fill={c.stone} {...inked(c)} />
      <Line points={[-7, -14, -7, -18, -4, -18, -4, -16, -1.5, -16, -1.5, -18, 1.5, -18, 1.5, -16, 4, -16, 4, -18, 7, -18, 7, -14]} closed fill={c.stoneDark} {...inked(c)} />
      <Rect x={-1.5} y={-10} width={3} height={5} fill={c.ink} opacity={0.8} cornerRadius={1.5} />
      <Path data="M -3 12 L -3 7 Q 0 4 3 7 L 3 12 Z" fill={c.ink} opacity={0.85} />
    </>
  ),

  village: c => (
    <>
      <Rect x={-16} y={0} width={13} height={10} fill={c.tent} {...inked(c)} />
      <Line points={[-17, 0, -9.5, -8, -2, 0]} closed fill={c.roof} {...inked(c)} />
      <Rect x={2} y={2} width={12} height={8} fill={c.tent} {...inked(c)} />
      <Line points={[1, 2, 8, -5, 15, 2]} closed fill={c.roof} {...inked(c)} />
      <Rect x={-12} y={4} width={3} height={6} fill={c.ink} opacity={0.7} />
      <Rect x={6.5} y={5} width={3} height={5} fill={c.ink} opacity={0.7} />
    </>
  ),

  city: c => (
    <>
      <Rect x={-18} y={-4} width={9} height={16} fill={c.stone} {...inked(c)} />
      <Line points={[-18, -4, -13.5, -12, -9, -4]} closed fill={c.roof} {...inked(c)} />
      <Rect x={-6} y={-10} width={9} height={22} fill={c.stoneDark} {...inked(c)} />
      <Line points={[-6, -10, -1.5, -18, 3, -10]} closed fill={c.roof} {...inked(c)} />
      <Rect x={7} y={-2} width={10} height={14} fill={c.stone} {...inked(c)} />
      <Line points={[7, -2, 12, -9, 17, -2]} closed fill={c.roof} {...inked(c)} />
      {[[-15, 0], [-15, 5], [-3, -6], [-3, 0], [10, 2], [13.5, 2]].map(([x, y], i) => (
        <Rect key={i} x={x} y={y} width={2.5} height={3} fill={c.ink} opacity={0.65} />
      ))}
    </>
  ),

  ruins: c => (
    <>
      <Rect x={-14} y={-8} width={4} height={20} fill={c.stone} {...inked(c)} />
      <Rect x={-15.5} y={-10} width={7} height={3} fill={c.stone} {...inked(c)} />
      <Rect x={-4} y={-2} width={4} height={14} fill={c.stone} {...inked(c)} />
      <Line points={[-4, -2, -4, -6, 0, -3, 0, -2]} closed fill={c.stone} {...inked(c)} />
      <Rect x={7} y={2} width={4} height={10} fill={c.stoneDark} {...inked(c)} />
      <Circle x={4} y={11} radius={2} fill={c.stoneDark} stroke={c.ink} strokeWidth={0.6} />
      <Circle x={13} y={12} radius={1.5} fill={c.stone} stroke={c.ink} strokeWidth={0.6} />
    </>
  ),

  camp: c => (
    <>
      <Line points={[-16, 10, -8, -8, 0, 10]} closed fill={c.tent} {...inked(c)} />
      <Line points={[-8, -8, -8, 10, -11, 10, -8, 3]} closed fill={c.ink} opacity={0.5} />
      <Path data="M 8 10 L 14 10 M 9 11 L 13 5 M 13 11 L 9 5" stroke={c.trunk} strokeWidth={1.4} lineCap="round" />
      <Path data="M 11 4 Q 8 0 11 -4 Q 14 0 11 4" fill={c.fire} stroke={c.ink} strokeWidth={0.6} closed />
    </>
  ),

  // ═══ WATER & WONDERS ═══
  port: c => (
    <>
      <Circle y={-12} radius={4} stroke={c.ink} strokeWidth={2.2} />
      <Line points={[0, -8, 0, 10]} stroke={c.ink} strokeWidth={2.2} lineCap="round" />
      <Line points={[-8, -3, 8, -3]} stroke={c.ink} strokeWidth={2.2} lineCap="round" />
      <Path data="M -10 4 Q -10 12 0 10 M 10 4 Q 10 12 0 10" stroke={c.ink} strokeWidth={2.2} lineCap="round" />
      <Path data="M -14 14 Q -10 11 -6 14 Q -2 17 2 14 Q 6 11 10 14" stroke={c.water} strokeWidth={1.4} lineCap="round" />
    </>
  ),

  ship: c => (
    <>
      <Path data="M -14 4 L 14 4 Q 10 12 0 12 Q -10 12 -14 4 Z" fill={c.trunk} {...inked(c)} />
      <Line points={[0, 4, 0, -18]} stroke={c.ink} strokeWidth={1.6} />
      <Path data="M 0 -18 Q 12 -12 0 -4 Z" fill={c.sail} {...inked(c)} />
      <Path data="M 0 -16 Q -9 -11 0 -6 Z" fill={c.sail} opacity={0.85} {...inked(c)} />
      <Line points={[0, -18, 5, -16, 0, -14]} closed fill={c.roof} stroke={c.ink} strokeWidth={0.6} />
    </>
  ),

  waves: c => (
    <>
      <Path data="M -16 -4 Q -12 -9 -8 -4 Q -6 -1 -9 -1" stroke={c.water} strokeWidth={1.8} lineCap="round" />
      <Path data="M -2 2 Q 2 -3 6 2 Q 8 5 5 5" stroke={c.water} strokeWidth={1.8} lineCap="round" />
      <Path data="M 8 -6 Q 12 -11 16 -6 Q 18 -3 15 -3" stroke={c.water} strokeWidth={1.8} lineCap="round" />
    </>
  ),

  seamonster: c => (
    <>
      <Path data="M -18 6 Q -12 -6 -6 6" stroke={c.serpent} strokeWidth={4} lineCap="round" />
      <Path data="M -2 6 Q 4 -6 10 6" stroke={c.serpent} strokeWidth={4} lineCap="round" />
      <Path data="M 12 6 Q 16 2 16 -4 Q 16 -10 21 -9" stroke={c.serpent} strokeWidth={3.5} lineCap="round" />
      <Circle x={20} y={-10} radius={3} fill={c.serpent} stroke={c.ink} strokeWidth={0.6} />
      <Circle x={21} y={-11} radius={0.8} fill={c.snow} />
      <Path data="M -16 10 Q -8 7 0 10 Q 8 13 16 10" stroke={c.water} strokeWidth={1.2} opacity={0.7} lineCap="round" />
    </>
  ),

  cave: c => (
    <>
      <Path data="M -16 12 Q -16 -10 0 -12 Q 16 -10 16 12 Z" fill={c.rock} {...inked(c)} />
      <Path data="M -7 12 Q -7 -2 0 -3 Q 7 -2 7 12 Z" fill={c.ink} opacity={0.9} />
      <Path data="M -13 -2 Q -10 -5 -8 -3 M 8 -4 Q 11 -6 13 -3" stroke={c.ink} strokeWidth={0.7} opacity={0.5} />
    </>
  ),

  bridge: c => (
    <>
      {/* Solid stone bridge with two arch openings traced out of the bottom edge */}
      <Path
        data="M -18 -5 L 18 -5 L 18 10 L 14 10 Q 14 1 8.5 1 Q 3 1 3 10 L -3 10 Q -3 1 -8.5 1 Q -14 1 -14 10 L -18 10 Z"
        fill={c.stone}
        {...inked(c)}
      />
      {/* Railing */}
      <Line points={[-18, -9, 18, -9]} stroke={c.stoneDark} strokeWidth={1.4} lineCap="round" />
      {[-15, -7.5, 0, 7.5, 15].map(x => (
        <Line key={x} points={[x, -9, x, -5]} stroke={c.stoneDark} strokeWidth={1.4} lineCap="round" />
      ))}
      {/* Water under the arches */}
      <Path data="M -11 12 Q -8.5 10 -6 12 M 6 12 Q 8.5 10 11 12" stroke={c.water} strokeWidth={1.3} opacity={0.8} lineCap="round" />
    </>
  ),

  // Legacy stamp — kept so old maps still render
  desert: c => (
    <Line points={[-14, 4, 0, -10, 14, 4, 6, 10, -6, 10]} closed fill={c.sand} opacity={0.85} {...inked(c)} />
  ),
}

// ── Library structure (drives the toolbar palette) ────────────────────────────
export const STAMP_CATEGORIES = [
  {
    id: 'terrain', label: 'Terrain',
    stamps: [
      { id: 'mountain', label: 'Mountain' },
      { id: 'snowpeak', label: 'Snowy Peak' },
      { id: 'hills',    label: 'Hills' },
      { id: 'volcano',  label: 'Volcano' },
      { id: 'dunes',    label: 'Dunes' },
      { id: 'cave',     label: 'Cave' },
    ],
  },
  {
    id: 'vegetation', label: 'Vegetation',
    stamps: [
      { id: 'forest', label: 'Forest' },
      { id: 'pines',  label: 'Pine Forest' },
      { id: 'palm',   label: 'Palms' },
      { id: 'swamp',  label: 'Swamp' },
      { id: 'plains', label: 'Grassland' },
    ],
  },
  {
    id: 'settlements', label: 'Settlements',
    stamps: [
      { id: 'city',    label: 'City' },
      { id: 'castle',  label: 'Castle' },
      { id: 'tower',   label: 'Tower' },
      { id: 'village', label: 'Village' },
      { id: 'ruins',   label: 'Ruins' },
      { id: 'camp',    label: 'Camp' },
      { id: 'bridge',  label: 'Bridge' },
    ],
  },
  {
    id: 'water', label: 'Water & Wonders',
    stamps: [
      { id: 'ship',       label: 'Ship' },
      { id: 'port',       label: 'Port' },
      { id: 'waves',      label: 'Waves' },
      { id: 'seamonster', label: 'Sea Serpent' },
    ],
  },
]

// Every placeable stamp id (includes legacy 'desert' so old maps keep working)
export const ALL_STAMP_TYPES = [
  ...STAMP_CATEGORIES.flatMap(cat => cat.stamps.map(s => s.id)),
  'desert',
]

export function stampLabel(type) {
  for (const cat of STAMP_CATEGORIES) {
    const found = cat.stamps.find(s => s.id === type)
    if (found) return found.label
  }
  return type
}

/**
 * Renders a stamp's vector art. Position/scale/rotation/flip are the parent
 * Group's responsibility — this component only draws in local space.
 */
export function StampShape({ type, mapStyle }) {
  const c = pal(mapStyle)
  const renderer = SHAPES[type] || SHAPES.mountain
  return renderer(c)
}
