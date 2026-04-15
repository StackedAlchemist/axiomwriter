import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Library, Plus, BookOpen, Users, Layers, GitBranch,
  BarChart2, Scroll, Loader2, Sparkles, ShieldCheck, Trash2,
  Edit2, MoreHorizontal, AlertTriangle, CheckCircle, Info,
  ChevronRight, X, Check, ExternalLink,
} from 'lucide-react'
import {
  collection, getDocs, doc, getDoc, query, orderBy,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useSeriesDetail, useSeriesLore } from '../hooks/useSeries'
import { getAllChapters } from '../hooks/useManuscript'
import { checkContinuity } from '../lib/seriesEngine'
import LoadingSpinner from '../components/common/LoadingSpinner'
import CreateSeriesModal from '../components/series/CreateSeriesModal'
import AddBookModal from '../components/series/AddBookModal'

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'architecture', label: 'Architecture', icon: Layers     },
  { id: 'timeline',     label: 'Timeline',     icon: GitBranch  },
  { id: 'overview',     label: 'Overview',     icon: BarChart2  },
  { id: 'lore',         label: 'Series Lore',  icon: Scroll     },
]

const ROLE_COLORS = {
  protagonist: '#c9a84c',   // gold
  antagonist:  '#ef4444',   // red
  major:       '#a78bfa',   // purple
  supporting:  '#2dd4bf',   // teal
  background:  '#64748b',   // slate
}

const BOOK_PALETTE = [
  '#c9a84c', '#2dd4bf', '#a78bfa', '#f97316', '#38bdf8', '#fb7185',
]

const LORE_CATEGORIES = ['World', 'History', 'Magic', 'Technology', 'Geography', 'Culture', 'Politics', 'Other']

// ── Helpers ───────────────────────────────────────────────────────────────────

function charAppearsInChapter(character, chapter) {
  const sceneSet = new Set((chapter.scenes || []).map(s => s.id))
  return (character.sceneHistory || []).some(sid => sceneSet.has(sid))
}

function buildAllChars(sortedBooks, bookData) {
  const charMap = new Map() // normalised name -> { name, role, importance, bookIds }
  sortedBooks.forEach(book => {
    ;(bookData[book.projectId]?.characters || []).forEach(c => {
      const key = c.name.trim().toLowerCase()
      if (!charMap.has(key)) {
        charMap.set(key, { name: c.name, role: c.role, importance: c.importance ?? 0, bookIds: new Set() })
      }
      const entry = charMap.get(key)
      entry.bookIds.add(book.projectId)
      if ((c.importance ?? 0) > entry.importance) {
        entry.importance = c.importance ?? 0
        entry.role       = c.role
        entry.name       = c.name
      }
    })
  })
  return Array.from(charMap.values())
    .sort((a, b) => b.importance - a.importance || a.name.localeCompare(b.name))
}

function fmtWords(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

// ── Architecture tab ──────────────────────────────────────────────────────────

function ArchitectureTab({ sortedBooks, bookData, navigate }) {
  const allChars  = buildAllChars(sortedBooks, bookData)
  const majChars  = allChars.filter(c => ['protagonist', 'antagonist', 'major'].includes(c.role))

  if (!sortedBooks.length) {
    return <EmptyBooks />
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Sticky left: character name column header */}
      <div className="flex min-w-max">

        {/* Name header cell */}
        <div className="w-44 flex-shrink-0 sticky left-0 z-20 bg-axiom-surface border-b border-r border-axiom-border px-3 py-2">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Character</p>
        </div>

        {/* Book columns header */}
        {sortedBooks.map((book, bi) => {
          const data     = bookData[book.projectId]
          const chapters = getAllChapters(data?.structure)
          const total    = data?.project?.wordCount || 0
          const color    = BOOK_PALETTE[bi % BOOK_PALETTE.length]

          return (
            <div
              key={book.projectId}
              className="flex-1 min-w-[220px] border-b border-r border-axiom-border px-3 py-2 bg-axiom-surface"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
                    Book {book.bookNumber}
                  </p>
                  <p className="text-xs font-medium text-slate-200 truncate max-w-[180px]">{book.title}</p>
                  <p className="text-[9px] text-slate-600">{fmtWords(total)} words · {chapters.length} chapters</p>
                </div>
                <Link
                  to={`/projects/${book.projectId}`}
                  className="btn-icon w-6 h-6 flex-shrink-0"
                  title="Open project"
                >
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Chapter timeline bar */}
              <div className="flex gap-0.5 h-2.5 mt-2">
                {chapters.length > 0 ? chapters.map(ch => {
                  const chWords = (ch.scenes || []).reduce((s, sc) => s + (sc.wordCount || 0), 0)
                  const flex    = Math.max(0.5, total > 0 ? (chWords / total) * chapters.length : 1)
                  return (
                    <div
                      key={ch.id}
                      title={`${ch.title} — ${chWords.toLocaleString()} words`}
                      style={{ flex, background: color, opacity: 0.5 }}
                      className="rounded-sm hover:opacity-80 cursor-pointer transition-opacity"
                      onClick={() => navigate(`/projects/${book.projectId}`)}
                    />
                  )
                }) : (
                  <div className="flex-1 rounded-sm bg-axiom-border" />
                )}
              </div>

              {/* Chapter count labels */}
              {chapters.length > 0 && (
                <div className="flex justify-between mt-0.5">
                  <span className="text-[8px] text-slate-700">Ch 1</span>
                  <span className="text-[8px] text-slate-700">Ch {chapters.length}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Character presence rows */}
      {majChars.length === 0 ? (
        <div className="flex min-w-max">
          <div className="w-44 flex-shrink-0 sticky left-0 z-10 bg-axiom-surface2 border-r border-axiom-border" />
          <div className="flex-1 p-6 text-center">
            <p className="text-slate-600 text-xs">Add characters to your projects to see their presence across the series.</p>
          </div>
        </div>
      ) : (
        majChars.map(char => (
          <div key={char.name} className="flex min-w-max hover:bg-white/[0.01] transition-colors">
            {/* Character name */}
            <div className="w-44 flex-shrink-0 sticky left-0 z-10 bg-axiom-surface2 border-b border-r border-axiom-border px-3 py-2 flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: ROLE_COLORS[char.role] || ROLE_COLORS.supporting }}
              />
              <div className="overflow-hidden">
                <p className="text-xs text-slate-300 truncate font-medium">{char.name}</p>
                <p className="text-[9px] text-slate-700 capitalize">{char.role}</p>
              </div>
            </div>

            {/* Presence cells per book */}
            {sortedBooks.map((book, bi) => {
              const data     = bookData[book.projectId]
              const chapters = getAllChapters(data?.structure)
              const bookChar = (data?.characters || []).find(
                c => c.name.trim().toLowerCase() === char.name.trim().toLowerCase()
              )
              const color = BOOK_PALETTE[bi % BOOK_PALETTE.length]

              return (
                <div
                  key={book.projectId}
                  className="flex-1 min-w-[220px] border-b border-r border-axiom-border px-3 py-2 flex gap-0.5 items-center"
                >
                  {chapters.length === 0 ? (
                    <div className="text-[9px] text-slate-700">No chapters</div>
                  ) : chapters.map(ch => {
                    const appears = bookChar ? charAppearsInChapter(bookChar, ch) : false
                    return (
                      <div
                        key={ch.id}
                        title={`${char.name} — ${ch.title}: ${appears ? '✓ Appears' : '✗ Absent'}`}
                        style={{
                          flex: 1,
                          height: 20,
                          background: appears ? color : 'rgba(255,255,255,0.03)',
                          borderRadius: 3,
                          opacity: appears ? 0.75 : 1,
                          cursor: appears ? 'pointer' : 'default',
                        }}
                        className="transition-opacity hover:opacity-100"
                        onClick={() => appears && navigate(`/projects/${book.projectId}`)}
                      />
                    )
                  })}
                  {!bookChar && (
                    <span className="text-[9px] text-slate-700 ml-1 italic">not in this book</span>
                  )}
                </div>
              )
            })}
          </div>
        ))
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-axiom-border bg-axiom-surface sticky bottom-0 min-w-max">
        <p className="text-[10px] text-slate-700 uppercase tracking-wider font-semibold">Role colours:</p>
        {Object.entries(ROLE_COLORS).map(([role, color]) => (
          <div key={role} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
            <span className="text-[10px] text-slate-600 capitalize">{role}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Timeline tab ──────────────────────────────────────────────────────────────

function TimelineTab({ sortedBooks, bookData, navigate }) {
  const [charFilter, setCharFilter] = useState('')

  if (!sortedBooks.length) return <EmptyBooks />

  // Build flat event list
  const events = []
  sortedBooks.forEach((book, bi) => {
    const data     = bookData[book.projectId]
    const chapters = getAllChapters(data?.structure)
    chapters.forEach((ch, ci) => {
      const chWords = (ch.scenes || []).reduce((s, sc) => s + (sc.wordCount || 0), 0)
      events.push({ book, bi, chapter: ch, chapterIdx: ci, wordCount: chWords, data })
    })
  })

  // Apply character filter
  const filtered = charFilter
    ? events.filter(ev => {
        const chars = ev.data?.characters || []
        const c = chars.find(c => c.name.toLowerCase().includes(charFilter.toLowerCase()))
        return c ? charAppearsInChapter(c, ev.chapter) : false
      })
    : events

  const allChars = buildAllChars(sortedBooks, bookData)
    .filter(c => ['protagonist', 'antagonist', 'major'].includes(c.role))

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Character filter */}
      <div className="px-4 py-2.5 border-b border-axiom-border flex items-center gap-2 flex-shrink-0 bg-axiom-surface">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider flex-shrink-0">Filter by character:</p>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setCharFilter('')}
            className={`px-2 py-0.5 rounded-full text-[10px] border transition-all ${!charFilter ? 'border-gold-500/40 bg-gold-500/10 text-gold-400' : 'border-axiom-border text-slate-600 hover:text-slate-400'}`}
          >
            All
          </button>
          {allChars.slice(0, 12).map(c => (
            <button
              key={c.name}
              onClick={() => setCharFilter(charFilter === c.name ? '' : c.name)}
              className={`px-2 py-0.5 rounded-full text-[10px] border transition-all ${charFilter === c.name ? 'border-gold-500/40 bg-gold-500/10 text-gold-400' : 'border-axiom-border text-slate-600 hover:text-slate-400'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline scroll area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="relative flex gap-2 pb-4" style={{ minWidth: filtered.length * 130 + 40 }}>

          {/* Timeline spine */}
          <div className="absolute left-0 right-0 top-[26px] h-px bg-axiom-border z-0" />

          {/* Book boundary markers */}
          {sortedBooks.map((book, bi) => {
            const startIdx = filtered.findIndex(ev => ev.book.projectId === book.projectId)
            if (startIdx === -1) return null
            return (
              <div
                key={book.projectId}
                className="absolute top-0 flex flex-col items-start"
                style={{ left: startIdx * 132 }}
              >
                <div
                  className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1"
                  style={{ background: `${BOOK_PALETTE[bi % BOOK_PALETTE.length]}20`, color: BOOK_PALETTE[bi % BOOK_PALETTE.length] }}
                >
                  Book {book.bookNumber}
                </div>
              </div>
            )
          })}

          {/* Chapter blocks */}
          {filtered.map((ev, i) => {
            const color = BOOK_PALETTE[ev.bi % BOOK_PALETTE.length]
            return (
              <div
                key={`${ev.book.projectId}-${ev.chapter.id}`}
                className="flex flex-col items-center gap-2 cursor-pointer group relative z-10"
                style={{ width: 120, flexShrink: 0 }}
                onClick={() => navigate(`/projects/${ev.book.projectId}`)}
              >
                {/* Timeline node */}
                <div
                  className="w-3.5 h-3.5 rounded-full border-2 mt-[19px] transition-transform group-hover:scale-125"
                  style={{ borderColor: color, background: `${color}40` }}
                />

                {/* Chapter card */}
                <div className="card p-2.5 text-center w-full group-hover:border-axiom-border-light transition-all">
                  <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color }}>
                    B{ev.book.bookNumber} Ch{ev.chapterIdx + 1}
                  </p>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">{ev.chapter.title}</p>
                  {ev.wordCount > 0 && (
                    <p className="text-[9px] text-slate-700 mt-1">{ev.wordCount.toLocaleString()}w</p>
                  )}
                  {ev.chapter.scenes?.length > 0 && (
                    <p className="text-[9px] text-slate-700">{ev.chapter.scenes.length} scene{ev.chapter.scenes.length !== 1 ? 's' : ''}</p>
                  )}
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 w-full">
              <p className="text-slate-600 text-sm">No events match the selected character filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ series, sortedBooks, bookData, loreEntries, navigate }) {
  const [checking,   setChecking]   = useState(false)
  const [continuity, setContinuity] = useState(null)

  const allChars = buildAllChars(sortedBooks, bookData)

  // Aggregate stats
  const totalWords = sortedBooks.reduce((sum, b) => sum + (bookData[b.projectId]?.project?.wordCount || 0), 0)
  const totalChaps = sortedBooks.reduce((sum, b) => {
    return sum + getAllChapters(bookData[b.projectId]?.structure).length
  }, 0)

  // Active (unresolved) threads across all books
  const activeThreads = []
  sortedBooks.forEach(book => {
    ;(bookData[book.projectId]?.threads || [])
      .filter(t => t.status === 'active')
      .forEach(t => activeThreads.push({ ...t, bookTitle: book.title, bookNumber: book.bookNumber, projectId: book.projectId }))
  })

  // Per-book breakdown
  const bookStats = sortedBooks.map(book => {
    const data     = bookData[book.projectId]
    const chapters = getAllChapters(data?.structure)
    const words    = data?.project?.wordCount || 0
    const chars    = (data?.characters || []).length
    const threads  = (data?.threads || []).filter(t => t.status === 'active').length
    return { book, chapters: chapters.length, words, chars, activeThreads: threads }
  })

  async function runContinuityCheck() {
    setChecking(true)
    try {
      const result = await checkContinuity({ series, sortedBooks, bookData })
      setContinuity(result)
    } catch {
      setContinuity({ issues: [], summary: 'Check failed.' })
    }
    setChecking(false)
  }

  const ISSUE_COLORS = { error: 'text-red-400 border-red-500/20 bg-red-900/10', warning: 'text-gold-400 border-gold-500/20 bg-gold-500/5' }
  const ISSUE_ICONS  = { error: AlertTriangle, warning: Info }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Words',    value: totalWords.toLocaleString(), sub: 'Across all books',       icon: BookOpen  },
          { label: 'Books',          value: sortedBooks.length,          sub: 'In this series',          icon: Library   },
          { label: 'Characters',     value: allChars.length,             sub: 'Unique across series',    icon: Users     },
          { label: 'Chapters',       value: totalChaps,                  sub: 'Total chapters written',  icon: Layers    },
        ].map(stat => (
          <div key={stat.label} className="card p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-axiom-surface2 border border-axiom-border flex items-center justify-center flex-shrink-0">
              <stat.icon className="w-4 h-4 text-gold-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-100">{stat.value}</p>
              <p className="text-xs font-medium text-slate-400">{stat.label}</p>
              <p className="text-[10px] text-slate-600">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Per-book breakdown */}
      <div>
        <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-3">Book Breakdown</h3>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-axiom-border">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Title</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Words</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Chapters</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Characters</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Open Threads</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {bookStats.map(({ book, chapters, words, chars, activeThreads: at }, bi) => (
                <tr key={book.projectId} className="border-b border-axiom-border/50 hover:bg-white/[0.01] transition-colors">
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-bold"
                      style={{ color: BOOK_PALETTE[bi % BOOK_PALETTE.length] }}
                    >
                      {book.bookNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{book.title}</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-400">{words.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-400">{chapters}</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-400">{chars}</td>
                  <td className="px-4 py-3 text-right">
                    {at > 0
                      ? <span className="text-xs text-gold-400 font-medium">{at}</span>
                      : <span className="text-[10px] text-slate-700">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => navigate(`/projects/${book.projectId}`)}
                      className="btn-ghost text-[10px] px-2 py-1"
                    >
                      Open <ChevronRight className="w-3 h-3 inline ml-0.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unresolved threads */}
      {activeThreads.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
            <GitBranch className="w-3.5 h-3.5 text-gold-400" />
            Unresolved Threads ({activeThreads.length})
          </h3>
          <div className="space-y-2">
            {activeThreads.map(t => (
              <div
                key={`${t.projectId}-${t.id}`}
                className="card p-3 flex items-center justify-between gap-3 border-gold-500/10"
              >
                <div>
                  <p className="text-sm text-slate-300 font-medium">{t.title}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Book {t.bookNumber} — {t.bookTitle}
                    {t.introducedInChapter && ` · opened in chapter ${t.introducedInChapter}`}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/projects/${t.projectId}/threads`)}
                  className="btn-ghost text-xs flex-shrink-0"
                >
                  View <ExternalLink className="w-3 h-3 inline ml-1" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Series lore preview */}
      {loreEntries.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Scroll className="w-3.5 h-3.5 text-purple-400" />
            Series Lore ({loreEntries.length} entries)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {loreEntries.slice(0, 6).map(e => (
              <div key={e.id} className="card p-3">
                <p className="text-xs font-semibold text-slate-300">{e.title}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{e.category}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Continuity check */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            Continuity Check
          </h3>
          <button
            onClick={runContinuityCheck}
            disabled={checking || sortedBooks.length < 2}
            className="btn-ghost text-xs flex items-center gap-1.5"
          >
            {checking
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Analysing…</>
              : <><Sparkles className="w-3.5 h-3.5" />Run Check</>}
          </button>
        </div>

        {sortedBooks.length < 2 && (
          <div className="card p-4 text-center">
            <p className="text-slate-600 text-xs">Add at least two books to run a continuity check.</p>
          </div>
        )}

        {continuity && (
          <div className="space-y-3">
            {/* Summary */}
            <div className="card p-3 flex items-start gap-2 border-teal-500/15">
              <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-relaxed">{continuity.summary}</p>
            </div>

            {/* Issues */}
            {continuity.issues?.length === 0 && (
              <div className="card p-3 text-center">
                <CheckCircle className="w-5 h-5 text-teal-400 mx-auto mb-1" />
                <p className="text-xs text-teal-400 font-medium">No continuity issues detected.</p>
              </div>
            )}
            {continuity.issues?.map((issue, i) => {
              const cls  = ISSUE_COLORS[issue.severity] || ISSUE_COLORS.warning
              const Icon = ISSUE_ICONS[issue.severity]  || Info
              return (
                <div key={i} className={`card p-3 border flex items-start gap-2 ${cls}`}>
                  <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 capitalize">{issue.type} · Book {issue.bookA} → Book {issue.bookB}</p>
                    <p className="text-xs leading-relaxed">{issue.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Lore tab ──────────────────────────────────────────────────────────────────

function LoreTab({ entries, createEntry, updateEntry, deleteEntry }) {
  const [showCreate, setShowCreate]   = useState(false)
  const [editing,    setEditing]      = useState(null)  // entry id
  const [form,       setForm]         = useState({ title: '', category: 'World', content: '', flexibility: 'locked' })
  const [saving,     setSaving]       = useState(false)
  const [catFilter,  setCatFilter]    = useState('All')

  const cats     = ['All', ...new Set(entries.map(e => e.category || 'Other'))]
  const filtered = catFilter === 'All' ? entries : entries.filter(e => e.category === catFilter)

  function openCreate() {
    setForm({ title: '', category: 'World', content: '', flexibility: 'locked' })
    setEditing(null)
    setShowCreate(true)
  }

  function openEdit(entry) {
    setForm({ title: entry.title, category: entry.category || 'World', content: entry.content || '', flexibility: entry.flexibility || 'locked' })
    setEditing(entry.id)
    setShowCreate(true)
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await updateEntry(editing, form)
      } else {
        await createEntry(form)
      }
      setShowCreate(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this lore entry?')) return
    await deleteEntry(id)
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-axiom-border bg-axiom-surface flex-shrink-0">
        <div className="flex gap-1.5">
          {cats.map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${catFilter === c ? 'border-gold-500/40 bg-gold-500/10 text-gold-400' : 'border-axiom-border text-slate-600 hover:text-slate-400'}`}
            >
              {c}
            </button>
          ))}
        </div>
        <button onClick={openCreate} className="btn-primary text-xs">
          <Plus className="w-3.5 h-3.5" />New Entry
        </button>
      </div>

      {/* Entry list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filtered.length === 0 && (
          <div className="card p-10 text-center">
            <Scroll className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium mb-1">No series lore yet</p>
            <p className="text-slate-600 text-xs mb-4">Series lore is shared across all books and included in Claude's context.</p>
            <button onClick={openCreate} className="btn-primary text-xs">
              <Plus className="w-3.5 h-3.5" />Add First Entry
            </button>
          </div>
        )}
        {filtered.map(entry => (
          <div key={entry.id} className="card p-4 group hover:border-axiom-border-light transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-slate-200">{entry.title}</p>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${entry.flexibility === 'locked' ? 'text-red-400 border-red-500/20 bg-red-900/10' : 'text-teal-400 border-teal-500/20 bg-teal-500/5'}`}>
                    {entry.flexibility === 'locked' ? 'Locked' : 'Flexible'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 mb-2">{entry.category}</p>
                {entry.content && (
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {entry.content.replace(/<[^>]+>/g, ' ')}
                  </p>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={() => openEdit(entry)} className="btn-icon w-7 h-7">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(entry.id)} className="btn-icon w-7 h-7 hover:text-red-400 hover:bg-red-900/10">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/edit inline panel */}
      {showCreate && (
        <div className="border-t border-axiom-border bg-axiom-surface flex-shrink-0 p-4 space-y-3 shadow-2xl" style={{ maxHeight: 320 }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400">{editing ? 'Edit Entry' : 'New Series Lore Entry'}</p>
            <button onClick={() => setShowCreate(false)} className="btn-icon w-6 h-6">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Entry title…"
              className="input-base text-xs"
              autoFocus
            />
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="input-base text-xs"
            >
              {LORE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <textarea
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Describe this lore entry. Locked entries cannot be contradicted by AI."
            rows={3}
            className="input-base text-xs w-full resize-none"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, flexibility: f.flexibility === 'locked' ? 'flexible' : 'locked' }))}
                className={`relative w-9 h-5 rounded-full border transition-all ${form.flexibility === 'locked' ? 'border-red-500/50 bg-red-500/20' : 'border-teal-500/50 bg-teal-500/20'}`}
              >
                <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full transition-all ${form.flexibility === 'locked' ? 'left-[20px] bg-red-400' : 'left-[2px] bg-teal-400'}`} />
              </button>
              <span className="text-[10px] text-slate-500">{form.flexibility === 'locked' ? 'Locked (AI cannot contradict)' : 'Flexible (AI can expand)'}</span>
            </label>
            <div className="flex gap-2">
              <button onClick={() => setShowCreate(false)} className="btn-ghost text-xs">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title.trim()} className="btn-primary text-xs">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyBooks() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <Library className="w-12 h-12 text-slate-700 mx-auto mb-4" />
        <p className="text-slate-400 text-sm font-medium mb-1">No books in this series yet</p>
        <p className="text-slate-600 text-xs">Add your existing projects to the series using the "Add Book" button above.</p>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SeriesView() {
  const { seriesId } = useParams()
  const navigate     = useNavigate()

  const { series, loading: seriesLoading, updateSeries, addBook, removeBook } = useSeriesDetail(seriesId)
  const { entries: loreEntries, createEntry, updateEntry, deleteEntry }       = useSeriesLore(seriesId)

  const [activeTab,    setActiveTab]    = useState('architecture')
  const [showAddBook,  setShowAddBook]  = useState(false)
  const [showEdit,     setShowEdit]     = useState(false)
  const [bookData,     setBookData]     = useState({})   // { projectId -> { project, characters, structure, threads, lore } }
  const [booksLoading, setBooksLoading] = useState(false)

  // Sort books by number
  const sortedBooks = [...(series?.books || [])].sort((a, b) => a.bookNumber - b.bookNumber)

  // Load data for all books when series loads
  const loadAllBooks = useCallback(async (books) => {
    if (!books?.length) return
    setBooksLoading(true)
    const results = {}
    await Promise.all(books.map(async book => {
      try {
        const [projSnap, charSnaps, threadSnaps, loreSnaps] = await Promise.all([
          getDoc(doc(db, 'projects', book.projectId)),
          getDocs(collection(db, 'projects', book.projectId, 'characters')),
          getDocs(collection(db, 'projects', book.projectId, 'threads')),
          getDocs(query(collection(db, 'projects', book.projectId, 'lore'), orderBy('createdAt', 'asc'))),
        ])
        results[book.projectId] = {
          project:    projSnap.exists() ? { id: projSnap.id, ...projSnap.data() } : null,
          characters: charSnaps.docs.map(d => ({ id: d.id, ...d.data() })),
          structure:  projSnap.exists() ? (projSnap.data().structure || { hasParts: false, chapters: [] }) : { hasParts: false, chapters: [] },
          threads:    threadSnaps.docs.map(d => ({ id: d.id, ...d.data() })),
          lore:       loreSnaps.docs.map(d => ({ id: d.id, ...d.data() })),
        }
      } catch {
        results[book.projectId] = { project: null, characters: [], structure: { hasParts: false, chapters: [] }, threads: [], lore: [] }
      }
    }))
    setBookData(results)
    setBooksLoading(false)
  }, [])

  useEffect(() => {
    if (series?.books?.length) loadAllBooks(series.books)
  }, [series?.books?.map(b => b.projectId).join(',')]) // eslint-disable-line

  if (seriesLoading) return <LoadingSpinner fullscreen />
  if (!series) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-axiom-bg">
        <p className="text-slate-400">Series not found.</p>
        <button onClick={() => navigate('/projects')} className="btn-ghost mt-3 text-xs">← Back to Projects</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-axiom-bg">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between h-13 px-4 bg-axiom-surface border-b border-axiom-border flex-shrink-0" style={{ height: 52 }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/projects')} className="btn-icon">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Library className="w-4 h-4 text-gold-400" />
            <span className="font-serif font-semibold text-slate-100 text-sm">{series.name}</span>
            <span className="badge border border-axiom-border text-slate-600 text-[9px]">{series.genre}</span>
            <span className="text-[10px] text-slate-700">{sortedBooks.length} book{sortedBooks.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {booksLoading && <Loader2 className="w-3.5 h-3.5 text-slate-600 animate-spin" />}
          <button
            onClick={() => setShowAddBook(true)}
            className="btn-ghost text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />Add Book
          </button>
          <button
            onClick={() => setShowEdit(true)}
            className="btn-ghost text-xs flex items-center gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />Edit Series
          </button>
        </div>
      </header>

      {/* ── Tab bar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 px-4 bg-axiom-surface border-b border-axiom-border flex-shrink-0" style={{ height: 40 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 h-full text-xs font-medium border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-gold-500/60 text-gold-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'architecture' && (
          <ArchitectureTab sortedBooks={sortedBooks} bookData={bookData} navigate={navigate} />
        )}
        {activeTab === 'timeline' && (
          <TimelineTab sortedBooks={sortedBooks} bookData={bookData} navigate={navigate} />
        )}
        {activeTab === 'overview' && (
          <OverviewTab
            series={series}
            sortedBooks={sortedBooks}
            bookData={bookData}
            loreEntries={loreEntries}
            navigate={navigate}
          />
        )}
        {activeTab === 'lore' && (
          <LoreTab
            entries={loreEntries}
            createEntry={createEntry}
            updateEntry={updateEntry}
            deleteEntry={deleteEntry}
          />
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {showAddBook && (
        <AddBookModal
          seriesId={seriesId}
          existingBookIds={sortedBooks.map(b => b.projectId)}
          onAdd={addBook}
          onClose={() => setShowAddBook(false)}
        />
      )}

      {showEdit && (
        <CreateSeriesModal
          initial={series}
          onClose={() => setShowEdit(false)}
          onCreated={async (data) => {
            await updateSeries(data)
            setShowEdit(false)
          }}
        />
      )}
    </div>
  )
}
