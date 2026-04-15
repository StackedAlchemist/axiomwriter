// ── Axiom Writing Environment Themes ─────────────────────────────────────────
//
// Each theme is a named creative environment with its own atmosphere,
// accent palette, animation, and AI mode hint (for future use).
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
    id:          'none',
    name:        'Default',
    description: 'Clean Axiom dark environment — no imagery.',
    image:       null,
    // Accent used for selector card highlight
    accent:      '#c9a84c',
    // RGB triplet for CSS rgba() usage
    accentRgb:   '201,168,76',
    // Color the side panels fade TO (matches axiom-bg)
    fadeColor:   '#080818',
    // Overlay tint on the edge panels (subtle, not covering the image)
    overlayColor: 'rgba(0,0,0,0)',
    // CSS animation class applied to the overlay div inside each panel
    animation:   null,
    // Placeholder for future Claude behavior tuning
    aiMode:      'default',
    // cursor glow accent (CSS box-shadow on caret, future feature)
    cursorGlow:  'rgba(201,168,76,0.6)',
  },
  {
    id:          'iron-sanctum',
    name:        'Iron Sanctum',
    description: 'Dark, intense, dominant. Write like your words are forged in iron.',
    image:       ironSanctumImg,
    accent:      '#c0392b',
    accentRgb:   '192,57,43',
    fadeColor:   '#080005',
    overlayColor: 'rgba(80,10,10,0.25)',
    animation:   'theme-flicker',
    aiMode:      'dark',
    cursorGlow:  'rgba(192,57,43,0.7)',
  },
  {
    id:          'the-infinite',
    name:        'The Infinite',
    description: 'Philosophical, expansive, sci-fi. Think beyond the edges of what is known.',
    image:       theInfiniteImg,
    accent:      '#7b68ee',
    accentRgb:   '123,104,238',
    fadeColor:   '#00000f',
    overlayColor: 'rgba(20,10,60,0.20)',
    animation:   'theme-drift',
    aiMode:      'philosophy',
    cursorGlow:  'rgba(123,104,238,0.7)',
  },
  {
    id:          'velvet-night',
    name:        'Velvet Night',
    description: 'Intimate, emotional, dark romance. The candlelight never goes out.',
    image:       velvetNightImg,
    accent:      '#c9956c',
    accentRgb:   '201,149,108',
    fadeColor:   '#0a0502',
    overlayColor: 'rgba(80,30,10,0.18)',
    animation:   'theme-soft-glow',
    aiMode:      'romance',
    cursorGlow:  'rgba(201,149,108,0.7)',
  },
  {
    id:          'the-high-keep',
    name:        'The High Keep',
    description: 'Epic fantasy, lore, worldbuilding. The mountains have witnessed empires fall.',
    image:       theHighKeepImg,
    accent:      '#c9a84c',
    accentRgb:   '201,168,76',
    fadeColor:   '#04080f',
    overlayColor: 'rgba(20,15,0,0.20)',
    animation:   'theme-candle',
    aiMode:      'fantasy',
    cursorGlow:  'rgba(201,168,76,0.7)',
  },
  {
    id:          'the-quiet-desk',
    name:        'The Quiet Desk',
    description: 'Focus, minimal, disciplined. Nothing between you and the work.',
    image:       theQuietDeskImg,
    accent:      '#9aaba8',
    accentRgb:   '154,171,168',
    fadeColor:   '#060a0a',
    overlayColor: 'rgba(0,0,0,0.15)',
    animation:   null,
    aiMode:      'focus',
    cursorGlow:  'rgba(154,171,168,0.6)',
  },
  {
    id:          'the-ember-forge',
    name:        'The Ember Forge',
    description: 'Action, intensity, raw power. Write scenes that ignite the page.',
    image:       theEmberForgeImg,
    accent:      '#e84317',
    accentRgb:   '232,67,23',
    fadeColor:   '#0a0200',
    overlayColor: 'rgba(100,20,0,0.22)',
    animation:   'theme-pulse',
    aiMode:      'action',
    cursorGlow:  'rgba(232,67,23,0.7)',
  },
  {
    id:          'whispering-grove',
    name:        'Whispering Grove',
    description: 'Calm, reflective, peaceful. Let your thoughts settle like leaves in still water.',
    image:       whisperingGroveImg,
    accent:      '#6b8f5e',
    accentRgb:   '107,143,94',
    fadeColor:   '#020a04',
    overlayColor: 'rgba(5,20,5,0.18)',
    animation:   'theme-float',
    aiMode:      'calm',
    cursorGlow:  'rgba(107,143,94,0.7)',
  },
]

// Fast O(1) lookup by id
export const THEME_MAP = Object.fromEntries(THEMES.map(t => [t.id, t]))

export const DEFAULT_THEME = THEMES[0]
