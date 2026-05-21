import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { BookOpen, Moon, Sun, ChevronLeft, ChevronRight, Menu, Feather, AlignJustify } from 'lucide-react'
import { loadShareForReader } from '../hooks/useProjectShare'

const THEMES = {
  light: {
    bg:      '#faf8f3',
    surface: '#f3efe6',
    border:  '#e0dbd0',
    text:    '#2c2822',
    muted:   '#8a8070',
    link:    '#c9a84c',
  },
  dark: {
    bg:      '#15131a',
    surface: '#1e1c26',
    border:  '#2a2835',
    text:    '#e6e0d4',
    muted:   '#6a6570',
    link:    '#c9a84c',
  },
  sepia: {
    bg:      '#f5ead7',
    surface: '#ede0c8',
    border:  '#d4c5a8',
    text:    '#3a2e1e',
    muted:   '#8a7660',
    link:    '#a0703a',
  },
}

export default function ReaderView() {
  const { shareId } = useParams()

  const [share,         setShare]         = useState(null)
  const [status,        setStatus]        = useState('loading') // loading | ok | inactive | notfound | error
  const [theme,         setTheme]         = useState('light')
  const [activeChapter, setActiveChapter] = useState(0)
  const [sidebarOpen,   setSidebarOpen]   = useState(false)
  const [fontSize,      setFontSize]      = useState(18)

  const contentRef = useRef(null)

  const c = THEMES[theme]

  useEffect(() => {
    loadShareForReader(shareId)
      .then(data => {
        if (!data)         { setStatus('notfound'); return }
        if (!data.active)  { setStatus('inactive'); return }
        setShare(data)
        setStatus('ok')
      })
      .catch(() => setStatus('error'))
  }, [shareId])

  // Scroll to top on chapter change
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeChapter])

  if (status === 'loading') {
    return (
      <div style={{ backgroundColor: THEMES.light.bg, minHeight: '100vh' }}
        className="flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (status !== 'ok') {
    const msg = {
      inactive: { heading: 'This link has been deactivated', body: 'The author has turned off access to this manuscript.' },
      notfound: { heading: 'Manuscript not found',           body: 'This link may be invalid or no longer active.' },
      error:    { heading: 'Something went wrong',           body: 'Unable to load the manuscript. Try again later.' },
    }[status]

    return (
      <div style={{ backgroundColor: THEMES.light.bg, color: THEMES.light.text, fontFamily: 'Georgia, serif', minHeight: '100vh' }}
        className="flex flex-col items-center justify-center p-8 gap-6 text-center">
        <BookOpen className="w-12 h-12" style={{ color: THEMES.light.muted }} />
        <div>
          <h1 className="text-xl font-bold mb-2">{msg.heading}</h1>
          <p className="text-sm" style={{ color: THEMES.light.muted }}>{msg.body}</p>
        </div>
        <a href="https://axiomwriter.com"
          className="text-xs flex items-center gap-1.5 transition-opacity hover:opacity-70"
          style={{ color: THEMES.light.muted }}>
          <Feather className="w-3.5 h-3.5" /> Axiomwriter
        </a>
      </div>
    )
  }

  const chapters       = share.chapters || []
  const currentChapter = chapters[activeChapter]
  const totalChapters  = chapters.length

  function cycleTheme() {
    const order = ['light', 'sepia', 'dark']
    setTheme(t => order[(order.indexOf(t) + 1) % order.length])
  }

  return (
    <>
      {/* Inject reader prose styles once */}
      <style>{`
        .reader-prose p            { margin-bottom: 1.35em; }
        .reader-prose h1,
        .reader-prose h2,
        .reader-prose h3           { font-weight: 700; margin-top: 1.6em; margin-bottom: 0.5em; }
        .reader-prose h1           { font-size: 1.5em; }
        .reader-prose h2           { font-size: 1.25em; }
        .reader-prose h3           { font-size: 1.1em; }
        .reader-prose blockquote   { border-left: 3px solid currentColor; padding-left: 1em; margin-left: 0; opacity: 0.75; font-style: italic; }
        .reader-prose ul           { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
        .reader-prose ol           { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; }
        .reader-prose li           { margin-bottom: 0.25em; }
        .reader-prose hr           { margin: 2em 0; border: none; border-top: 1px solid currentColor; opacity: 0.2; }
        .reader-prose strong       { font-weight: 700; }
        .reader-prose em           { font-style: italic; }
        .reader-sidebar-btn:hover  { opacity: 0.8; }
      `}</style>

      <div style={{ backgroundColor: c.bg, color: c.text, fontFamily: 'Georgia, serif', minHeight: '100vh' }}>

        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <header
          className="sticky top-0 z-20 flex items-center px-4 h-12 gap-3"
          style={{ backgroundColor: c.surface, borderBottom: `1px solid ${c.border}` }}
        >
          {/* Mobile menu toggle */}
          {totalChapters > 1 && (
            <button
              onClick={() => setSidebarOpen(p => !p)}
              className="md:hidden p-1.5 rounded transition-opacity hover:opacity-70"
              style={{ color: c.muted }}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Title */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate leading-tight">{share.projectTitle}</p>
            {share.authorName && (
              <p className="text-[11px] leading-none mt-0.5" style={{ color: c.muted }}>
                by {share.authorName}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setFontSize(s => Math.max(14, s - 1))}
              className="w-8 h-8 flex items-center justify-center rounded transition-opacity hover:opacity-70 text-sm font-bold"
              style={{ color: c.muted, fontFamily: 'Georgia, serif' }}
              title="Decrease font size"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize(s => Math.min(26, s + 1))}
              className="w-8 h-8 flex items-center justify-center rounded transition-opacity hover:opacity-70 text-base font-bold"
              style={{ color: c.muted, fontFamily: 'Georgia, serif' }}
              title="Increase font size"
            >
              A+
            </button>
            <button
              onClick={cycleTheme}
              className="w-8 h-8 flex items-center justify-center rounded transition-opacity hover:opacity-70"
              style={{ color: c.muted }}
              title={`Switch theme (${theme})`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <div className="flex h-[calc(100vh-3rem)]">

          {/* ── Chapter sidebar ───────────────────────────────────────────── */}
          {totalChapters > 1 && (
            <>
              <aside
                className={`
                  fixed inset-y-12 left-0 z-10 w-60 overflow-y-auto flex-shrink-0
                  transition-transform duration-200
                  md:sticky md:top-12 md:translate-x-0 md:h-full
                  ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
                style={{ backgroundColor: c.surface, borderRight: `1px solid ${c.border}` }}
              >
                <div className="p-4">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-widest mb-3"
                    style={{ color: c.muted, letterSpacing: '0.12em' }}
                  >
                    Contents
                  </p>
                  <nav className="space-y-0.5">
                    {chapters.map((ch, i) => (
                      <button
                        key={ch.id}
                        onClick={() => { setActiveChapter(i); setSidebarOpen(false) }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all"
                        style={{
                          backgroundColor: activeChapter === i ? c.border : 'transparent',
                          color:           activeChapter === i ? c.text   : c.muted,
                        }}
                      >
                        {ch.chapterTitle}
                      </button>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* Mobile backdrop */}
              {sidebarOpen && (
                <div
                  className="fixed inset-0 z-[9] md:hidden"
                  style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                  onClick={() => setSidebarOpen(false)}
                />
              )}
            </>
          )}

          {/* ── Main reading area ─────────────────────────────────────────── */}
          <main
            ref={contentRef}
            className="flex-1 min-w-0 overflow-y-auto px-5 md:px-8 py-10 md:py-16"
          >
            <article className="mx-auto" style={{ maxWidth: '680px' }}>

              {currentChapter ? (
                <>
                  {/* Chapter heading */}
                  <h1
                    className="mb-10 font-bold"
                    style={{ fontSize: `${fontSize + 6}px`, lineHeight: '1.3', color: c.text }}
                  >
                    {currentChapter.chapterTitle}
                  </h1>

                  {/* Scenes */}
                  <div className="space-y-10">
                    {(currentChapter.scenes || []).map((scene, si) => (
                      <div key={scene.id || si}>
                        {scene.title && si > 0 && (
                          <p
                            className="text-[11px] uppercase tracking-widest mb-5 font-semibold"
                            style={{ color: c.muted }}
                          >
                            {scene.title}
                          </p>
                        )}
                        {scene.content ? (
                          <div
                            className="reader-prose"
                            style={{ fontSize: `${fontSize}px`, lineHeight: '1.9', color: c.text }}
                            dangerouslySetInnerHTML={{ __html: scene.content }}
                          />
                        ) : (
                          <p style={{ color: c.muted, fontSize: '14px', fontStyle: 'italic' }}>
                            [Scene is empty]
                          </p>
                        )}

                        {/* Scene break */}
                        {si < (currentChapter.scenes || []).length - 1 && (
                          <div
                            className="flex items-center justify-center my-10 gap-3"
                            style={{ color: c.muted }}
                          >
                            <span style={{ fontSize: '18px' }}>§</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Chapter navigation */}
                  <div
                    className="flex items-center justify-between mt-16 pt-6"
                    style={{ borderTop: `1px solid ${c.border}` }}
                  >
                    <button
                      onClick={() => setActiveChapter(p => Math.max(0, p - 1))}
                      disabled={activeChapter === 0}
                      className="flex items-center gap-1.5 text-sm transition-opacity disabled:opacity-25"
                      style={{ color: c.muted }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>

                    <span className="text-xs" style={{ color: c.muted }}>
                      {activeChapter + 1} of {totalChapters}
                    </span>

                    <button
                      onClick={() => setActiveChapter(p => Math.min(totalChapters - 1, p + 1))}
                      disabled={activeChapter === totalChapters - 1}
                      className="flex items-center gap-1.5 text-sm transition-opacity disabled:opacity-25"
                      style={{ color: c.muted }}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <p style={{ color: c.muted, fontStyle: 'italic' }}>
                  No content available in this share.
                </p>
              )}

              {/* Footer */}
              <footer
                className="mt-20 pt-6 text-center"
                style={{ borderTop: `1px solid ${c.border}` }}
              >
                <a
                  href="https://axiomwriter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs transition-opacity hover:opacity-60"
                  style={{ color: c.muted }}
                >
                  <Feather className="w-3.5 h-3.5" />
                  Written with Axiomwriter
                </a>
              </footer>
            </article>
          </main>
        </div>
      </div>
    </>
  )
}
