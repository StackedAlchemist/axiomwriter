/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Slate overrides — shifted brighter for dark-background readability.
        slate: {
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#d0daea',
          400: '#adbdd0',
          500: '#849ab2',
          600: '#617a94',
          700: '#4a6070',
          800: '#253040',
          900: '#121e2b',
        },
        axiom: {
          bg:            'var(--axiom-bg)',
          surface:       'var(--axiom-surface)',
          surface2:      'var(--axiom-surface2)',
          border:        'var(--axiom-border)',
          'border-light':'var(--axiom-border-light)',
          text:          'var(--axiom-text)',
          muted:         'var(--axiom-muted)',
        },
        gold: {
          300: '#e8cf8a',
          400: '#d4b865',
          500: '#c9a84c',
          600: '#a8863a',
        },
        teal: {
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#2abfbf',
          600: '#00897b',
        },
        purple: {
          400: '#9e7dd4',
          500: '#7c5cbf',
          600: '#6347a0',
        },
      },
      fontFamily: {
        sans:  ['"Josefin Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        mono:  ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(201,168,76,0.15)',
        'glow-teal': '0 0 20px rgba(0,180,160,0.15)',
        'card':      '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,248,230,0.04)',
        'den':       '0 12px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(201,168,76,0.06)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'slide-in':   'slideIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'marquee':    'marquee 40s linear infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 },                   to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn:   { from: { opacity: 0, transform: 'translateX(-12px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        pulseSoft: { '0%,100%': { opacity: 0.6 }, '50%': { opacity: 1 } },
        marquee:   { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
      },
    },
  },
  plugins: [],
}
