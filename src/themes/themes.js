// ── Axiom Writing Environment Themes ─────────────────────────────────────────
//
// Each theme is a named creative environment with its own atmosphere,
// accent palette, animation, and AI mode hint (for future use).
//
// Image themes: import PNG from src/images/. cssBackground: null.
// CSS themes:   image: null, cssBackground: a CSS `background` value (gradients).
//
// Images live in src/images/ and are imported as Vite asset URLs so they
// get content-hashed and tree-shaken correctly in production builds.

import ironSanctumImg     from '../images/chains-dungeon-theme.png'
import theInfiniteImg     from '../images/cosmic-void-theme.png'
import velvetNightImg     from '../images/dark-romance-theme.png'
import theHighKeepImg     from '../images/fantasy-castle-theme.png'
import theQuietDeskImg    from '../images/minimal-premium-theme.png'
import theEmberForgeImg   from '../images/volcanic-darkforge-theme.png'
import whisperingGroveImg from '../images/relax-theme.png'

// ─────────────────────────────────────────────────────────────────────────────

export const THEMES = [
  {
    id:           'none',
    name:         'Default',
    description:  'Clean Axiom dark environment — no imagery.',
    image:        null,
    cssBackground: null,
    accent:       '#c9a84c',
    accentRgb:    '201,168,76',
    fadeColor:    '#080818',
    overlayColor: 'rgba(0,0,0,0)',
    animation:    null,
    aiMode:       'default',
    cursorGlow:   'rgba(201,168,76,0.6)',
  },
  {
    id:           'iron-sanctum',
    name:         'Iron Sanctum',
    description:  'Dark, intense, dominant. Write like your words are forged in iron.',
    image:        ironSanctumImg,
    cssBackground: null,
    accent:       '#c0392b',
    accentRgb:    '192,57,43',
    fadeColor:    '#080005',
    overlayColor: 'rgba(80,10,10,0.25)',
    animation:    'theme-flicker',
    aiMode:       'dark',
    cursorGlow:   'rgba(192,57,43,0.7)',
  },
  {
    id:           'the-infinite',
    name:         'The Infinite',
    description:  'Philosophical, expansive, sci-fi. Think beyond the edges of what is known.',
    image:        theInfiniteImg,
    cssBackground: null,
    accent:       '#7b68ee',
    accentRgb:    '123,104,238',
    fadeColor:    '#00000f',
    overlayColor: 'rgba(20,10,60,0.20)',
    animation:    'theme-drift',
    aiMode:       'philosophy',
    cursorGlow:   'rgba(123,104,238,0.7)',
  },
  {
    id:           'velvet-night',
    name:         'Velvet Night',
    description:  'Intimate, emotional, dark romance. The candlelight never goes out.',
    image:        velvetNightImg,
    cssBackground: null,
    accent:       '#c9956c',
    accentRgb:    '201,149,108',
    fadeColor:    '#0a0502',
    overlayColor: 'rgba(80,30,10,0.18)',
    animation:    'theme-soft-glow',
    aiMode:       'romance',
    cursorGlow:   'rgba(201,149,108,0.7)',
  },
  {
    id:           'the-high-keep',
    name:         'The High Keep',
    description:  'Epic fantasy, lore, worldbuilding. The mountains have witnessed empires fall.',
    image:        theHighKeepImg,
    cssBackground: null,
    accent:       '#c9a84c',
    accentRgb:    '201,168,76',
    fadeColor:    '#04080f',
    overlayColor: 'rgba(20,15,0,0.20)',
    animation:    'theme-candle',
    aiMode:       'fantasy',
    cursorGlow:   'rgba(201,168,76,0.7)',
  },
  {
    id:           'the-quiet-desk',
    name:         'The Quiet Desk',
    description:  'Focus, minimal, disciplined. Nothing between you and the work.',
    image:        theQuietDeskImg,
    cssBackground: null,
    accent:       '#9aaba8',
    accentRgb:    '154,171,168',
    fadeColor:    '#060a0a',
    overlayColor: 'rgba(0,0,0,0.15)',
    animation:    null,
    aiMode:       'focus',
    cursorGlow:   'rgba(154,171,168,0.6)',
  },
  {
    id:           'the-ember-forge',
    name:         'The Ember Forge',
    description:  'Action, intensity, raw power. Write scenes that ignite the page.',
    image:        theEmberForgeImg,
    cssBackground: null,
    accent:       '#e84317',
    accentRgb:    '232,67,23',
    fadeColor:    '#0a0200',
    overlayColor: 'rgba(100,20,0,0.22)',
    animation:    'theme-pulse',
    aiMode:       'action',
    cursorGlow:   'rgba(232,67,23,0.7)',
  },
  {
    id:           'whispering-grove',
    name:         'Whispering Grove',
    description:  'Calm, reflective, peaceful. Let your thoughts settle like leaves in still water.',
    image:        whisperingGroveImg,
    cssBackground: null,
    accent:       '#6b8f5e',
    accentRgb:    '107,143,94',
    fadeColor:    '#020a04',
    overlayColor: 'rgba(5,20,5,0.18)',
    animation:    'theme-float',
    aiMode:       'calm',
    cursorGlow:   'rgba(107,143,94,0.7)',
  },

  // ── CSS-only themes (no images) ─────────────────────────────────────────────

  {
    id:           'the-abyss',
    name:         'The Abyss',
    description:  'Cosmic void. Deep space energy — layered nebulae bleeding in from both sides.',
    image:        null,
    cssBackground: [
      'radial-gradient(ellipse 85% 150% at 10% 35%, rgba(100,30,210,0.92) 0%, rgba(40,10,110,0.65) 40%, transparent 65%)',
      'radial-gradient(ellipse 85% 150% at 10% 75%, rgba(20,50,190,0.85) 0%, rgba(10,20,110,0.55) 40%, transparent 65%)',
      'linear-gradient(175deg, rgba(5,3,20,1) 0%, rgba(4,2,15,1) 100%)',
    ].join(', '),
    accent:       '#8b72f0',
    accentRgb:    '139,114,240',
    fadeColor:    '#04020f',
    overlayColor: 'rgba(30,15,80,0.12)',
    animation:    'theme-drift',
    aiMode:       'philosophy',
    cursorGlow:   'rgba(139,114,240,0.7)',
  },
  {
    id:           'neon-noir',
    name:         'Neon Noir',
    description:  'Cyberpunk. Hot magenta bleeds into cold cyan — write your future dystopia.',
    image:        null,
    cssBackground: [
      'radial-gradient(ellipse 70% 110% at 5% 30%, rgba(240,0,140,0.75) 0%, rgba(130,0,80,0.45) 45%, transparent 62%)',
      'radial-gradient(ellipse 70% 110% at 5% 78%, rgba(0,200,255,0.65) 0%, rgba(0,100,180,0.40) 45%, transparent 62%)',
      'linear-gradient(to right, rgba(8,0,18,1) 0%, rgba(5,0,12,1) 100%)',
    ].join(', '),
    accent:       '#ff00a0',
    accentRgb:    '255,0,160',
    fadeColor:    '#080010',
    overlayColor: 'rgba(100,0,60,0.10)',
    animation:    'theme-flicker',
    aiMode:       'dark',
    cursorGlow:   'rgba(255,0,160,0.8)',
  },
  {
    id:           'ember-hall',
    name:         'Ember Hall',
    description:  'Volcanic warmth. A great hall lit by eternal fire — for action and high stakes.',
    image:        null,
    cssBackground: [
      'radial-gradient(ellipse 90% 160% at 8% 60%, rgba(220,60,0,0.92) 0%, rgba(140,25,0,0.60) 40%, transparent 65%)',
      'radial-gradient(ellipse 75% 110% at 8% 15%, rgba(200,110,0,0.72) 0%, rgba(130,55,0,0.45) 38%, transparent 60%)',
      'linear-gradient(to right, rgba(12,3,1,1) 0%, rgba(10,2,0,1) 100%)',
    ].join(', '),
    accent:       '#ff6b35',
    accentRgb:    '255,107,53',
    fadeColor:    '#0f0300',
    overlayColor: 'rgba(150,40,0,0.10)',
    animation:    'theme-pulse',
    aiMode:       'action',
    cursorGlow:   'rgba(255,107,53,0.8)',
  },

  // ── Light themes ────────────────────────────────────────────────────────────

  {
    id:           'morning-pages',
    name:         'Morning Pages',
    description:  'Warm cream and soft amber — like writing by a window at dawn.',
    image:        null,
    cssBackground: [
      'radial-gradient(ellipse 130% 200% at 50% 50%, rgba(255,251,238,1) 0%, rgba(250,238,212,1) 35%, rgba(240,222,185,1) 65%, rgba(225,204,162,1) 100%)',
    ].join(', '),
    accent:       '#c4853a',
    accentRgb:    '196,133,58',
    fadeColor:    'rgba(8,8,24,0)',
    overlayColor: 'rgba(200,140,60,0.06)',
    animation:    null,
    aiMode:       'calm',
    cursorGlow:   'rgba(196,133,58,0.7)',
  },
  {
    id:           'daylight-studio',
    name:         'Daylight Studio',
    description:  'Crisp and bright. Cool blue-white light for clear thinking and clean prose.',
    image:        null,
    cssBackground: [
      'radial-gradient(ellipse 130% 200% at 50% 50%, rgba(248,252,255,1) 0%, rgba(228,242,255,1) 35%, rgba(205,228,255,1) 65%, rgba(182,212,252,1) 100%)',
    ].join(', '),
    accent:       '#4a9eda',
    accentRgb:    '74,158,218',
    fadeColor:    'rgba(8,8,24,0)',
    overlayColor: 'rgba(100,160,220,0.06)',
    animation:    null,
    aiMode:       'focus',
    cursorGlow:   'rgba(74,158,218,0.7)',
  },
  {
    id:           'aged-parchment',
    name:         'Aged Parchment',
    description:  'Warm sepia and antique gold — the feel of a handwritten manuscript.',
    image:        null,
    cssBackground: [
      'radial-gradient(ellipse 130% 200% at 50% 50%, rgba(250,240,215,1) 0%, rgba(238,222,185,1) 35%, rgba(222,202,158,1) 65%, rgba(205,182,132,1) 100%)',
    ].join(', '),
    accent:       '#9c7b3a',
    accentRgb:    '156,123,58',
    fadeColor:    'rgba(8,8,24,0)',
    overlayColor: 'rgba(160,120,40,0.06)',
    animation:    null,
    aiMode:       'fantasy',
    cursorGlow:   'rgba(156,123,58,0.7)',
  },
]

// Fast O(1) lookup by id
export const THEME_MAP = Object.fromEntries(THEMES.map(t => [t.id, t]))

export const DEFAULT_THEME = THEMES[0]
