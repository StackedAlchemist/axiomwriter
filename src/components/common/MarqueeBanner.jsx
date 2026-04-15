import React from 'react'

/**
 * MarqueeBanner — fixed bottom strip with seamless infinite horizontal scroll.
 *
 * Technique: the inner track is exactly 2× the content width.
 * We animate translateX from 0 → -50%, which moves exactly one
 * full copy off-screen. At that point the animation resets to 0
 * and the loop is visually identical — no jump.
 *
 * Hover pauses the animation via CSS `animation-play-state`.
 */

// Gold diamond separator between phrases
const SEP = <span className="mx-5 text-gold-500/60 select-none" aria-hidden="true">✦</span>

const PHRASES = [
  'Welcome home',
  'Your story is waiting',
  'Build worlds with intention',
  'Turn ideas into chapters',
  'Write with clarity, not chaos',
  'Become the writer you were meant to be',
  'Return to the page',
  'Create something remarkable',
]

function TrackContent() {
  return (
    <>
      {PHRASES.map((phrase, i) => (
        <span key={i} className="inline-flex items-center">
          <span className="text-slate-300/80 tracking-wide">{phrase}</span>
          {SEP}
        </span>
      ))}
    </>
  )
}

export default function MarqueeBanner() {
  return (
    /* Fixed to bottom of viewport, above everything */
    <div
      className="fixed bottom-0 left-0 right-0 z-50 overflow-hidden"
      style={{
        /* Semi-transparent dark navy with glass blur */
        background: 'rgba(8, 14, 26, 0.72)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        /* Subtle muted-gold top border */
        borderTop: '1px solid rgba(201, 168, 76, 0.2)',
      }}
      /* Respect reduced-motion preference */
      aria-hidden="true"
    >
      {/*
        The track holds the content duplicated exactly twice.
        Animation shifts it left by 50% (= one full copy), then loops.
        `will-change: transform` hints the browser to GPU-composite this layer.
      */}
      <div
        className="flex whitespace-nowrap animate-marquee py-2.5 text-sm font-sans"
        style={{
          /* Pause on hover for a premium, intentional feel */
          animationPlayState: 'running',
          willChange: 'transform',
        }}
        onMouseEnter={e => { e.currentTarget.style.animationPlayState = 'paused' }}
        onMouseLeave={e => { e.currentTarget.style.animationPlayState = 'running' }}
      >
        {/* Copy 1 */}
        <span className="inline-flex items-center flex-shrink-0">
          <TrackContent />
        </span>
        {/* Copy 2 — identical, provides seamless loop */}
        <span className="inline-flex items-center flex-shrink-0" aria-hidden="true">
          <TrackContent />
        </span>
      </div>
    </div>
  )
}
