/**
 * ThemeBackground
 *
 * Renders two fixed edge panels (left 15vw, right 15vw) that display the
 * current writing environment theme image.
 *
 * Layout contract:
 *   [ LEFT PANEL 15vw ] [ transparent gap 70vw ] [ RIGHT PANEL 15vw ]
 *
 * The panels use position:fixed so they sit below all app content at z-index:1.
 * pointer-events:none means they never intercept clicks or keyboard events.
 *
 * Each panel layers:
 *   1. The theme image (background-image, covers the panel area)
 *   2. A per-theme tint overlay div (for color warmth / atmosphere)
 *   3. An animated overlay div (handles the theme animation effect)
 *   4. An inner-edge gradient that fades the image toward the center,
 *      blending seamlessly with the editor background
 */

import React from 'react'
import { useWritingTheme } from '../../contexts/WritingThemeContext'

export default function ThemeBackground() {
  const { currentTheme } = useWritingTheme()

  // No-op when no theme is chosen
  if (!currentTheme || !currentTheme.image) return null

  return (
    <>
      {/* LEFT PANEL ──────────────────────────────────────────────────────── */}
      <ThemePanel
        side="left"
        theme={currentTheme}
      />

      {/* RIGHT PANEL ─────────────────────────────────────────────────────── */}
      <ThemePanel
        side="right"
        theme={currentTheme}
      />
    </>
  )
}

function ThemePanel({ side, theme }) {
  const isLeft = side === 'left'

  // The gradient fades the image INTO the center (toward bg color)
  // Left panel fades right-ward, right panel fades left-ward
  const fadeGradient = isLeft
    ? `linear-gradient(to right, rgba(0,0,0,0.1) 0%, ${theme.fadeColor} 100%)`
    : `linear-gradient(to left, rgba(0,0,0,0.1) 0%, ${theme.fadeColor} 100%)`

  // Position the image so each panel shows the correct side of the panoramic image
  const bgPosition = isLeft ? 'left center' : 'right center'

  return (
    <div
      aria-hidden="true"
      style={{
        position:       'fixed',
        top:            0,
        bottom:         0,
        [isLeft ? 'left' : 'right']: 0,
        width:          '15vw',
        zIndex:         1,
        pointerEvents:  'none',
        overflow:       'hidden',
        // The theme image
        backgroundImage:    `url(${theme.image})`,
        backgroundPosition: bgPosition,
        backgroundSize:     'cover',
        backgroundRepeat:   'no-repeat',
      }}
    >
      {/* Atmospheric tint overlay — gives each theme its color warmth */}
      <div
        style={{
          position:   'absolute',
          inset:      0,
          background: theme.overlayColor,
        }}
      />

      {/* Animation overlay — theme-specific subtle motion effect */}
      {theme.animation && (
        <div
          className={`theme-anim-${theme.animation}`}
          style={{
            position:   'absolute',
            inset:      0,
            background: theme.overlayColor,
          }}
        />
      )}

      {/* Edge gradient — fades image toward center for readability */}
      <div
        style={{
          position:   'absolute',
          inset:      0,
          background: fadeGradient,
        }}
      />
    </div>
  )
}
