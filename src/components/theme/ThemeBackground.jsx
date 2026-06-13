/**
 * ThemeBackground
 *
 * Renders ONE fixed full-viewport backdrop for the active writing environment.
 * The environment is atmosphere *behind* the whole app — it never consumes
 * layout space. The editor, sidebar, and header sit on top as semi-translucent
 * frosted surfaces (see the `data-writing-env` rules in index.css), so the
 * environment glows through the margins and faintly behind the prose.
 *
 * Sits at z-index:0 (above the opaque body/html background, below the app content
 * which ProjectDetail lifts into a z-index:1 wrapper). Layer stack (bottom → top):
 *   1. Environment image / gradient, dimmed so it reads as mood not noise
 *   2. Per-theme color tint (overlayColor) for warmth
 *   3. Animated tint overlay (theme-specific subtle motion)
 *   4. Dark scrim — preserves body-text contrast at WCAG AA over any image
 */

import React from 'react'
import { useWritingTheme } from '../../contexts/WritingThemeContext'

export default function ThemeBackground() {
  const { currentTheme: t } = useWritingTheme()

  if (!t || (!t.image && !t.cssBackground)) return null

  // Image scenes are busy — dim hard. CSS gradients are designed to bleed, keep more.
  const envLayer = t.image
    ? {
        backgroundImage:    `url(${t.image})`,
        backgroundSize:     'cover',
        backgroundPosition: 'center center',
        backgroundRepeat:   'no-repeat',
        opacity:            0.5,
      }
    : { background: t.cssBackground, opacity: 0.72 }

  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
    >
      {/* 1 — Environment image / gradient, dimmed */}
      <div style={{ position: 'absolute', inset: 0, ...envLayer }} />

      {/* 2 — Per-theme color tint */}
      <div style={{ position: 'absolute', inset: 0, background: t.overlayColor }} />

      {/* 3 — Animated tint (flicker / drift / pulse, per theme) */}
      {t.animation && (
        <div
          className={`theme-anim-${t.animation}`}
          style={{ position: 'absolute', inset: 0, background: t.overlayColor }}
        />
      )}

      {/* 4 — Dark scrim for text contrast (slightly heavier toward the bottom
              where the status bar and most prose sit) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(4,4,14,0.42) 0%, rgba(4,4,14,0.48) 60%, rgba(4,4,14,0.55) 100%)',
        }}
      />
    </div>
  )
}
