/**
 * Layout 3 — THREADS FIRST
 * Plot threads (scene tags) as rows, chapters as columns.
 * Shows which scenes belong to each thread.
 */
import React, { useMemo } from 'react'
import { getAllChapters } from '../../hooks/useManuscript'

const STATUS_DOT = {
  planned:  'bg-slate-600',
  drafted:  'bg-teal-500',
  revised:  'bg-gold-500',
  locked:   'bg-purple-500',
}

const THREAD_COLORS = [
  'text-gold-400 bg-gold-500/10 border-gold-500/20',
  'text-teal-400 bg-teal-500/10 border-teal-500/20',
  'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'text-red-400 bg-red-500/10 border-red-500/20',
  'text-slate-300 bg-slate-500/10 border-slate-500/20',
]

export default function ThreadsLayout({ structure, onOpenScene }) {
  const chapters = useMemo(() => getAllChapters(structure), [structure])

  // Collect all unique tags across all scenes
  const threads = useMemo(() => {
    const tagSet = new Set()
    chapters.forEach(ch => {
      (ch.scenes || []).forEach(s => {
        (s.tags || []).forEach(tag => {
          if (tag?.trim()) tagSet.add(tag.trim())
        })
      })
    })
    return Array.from(tagSet).sort()
  }, [chapters])

  if (!structure) return null

  const allScenes = chapters.flatMap(ch =>
    (ch.scenes || []).map(s => ({ ...s, chapterId: ch.id }))
  )

  if (threads.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
        <div className="w-12 h-12 rounded-xl bg-axiom-surface border border-axiom-border flex items-center justify-center">
          <span className="text-xl">🧵</span>
        </div>
        <div>
          <p className="font-serif text-lg text-slate-300 mb-2">Threads track the forces shaping your story</p>
          <p className="text-sm text-slate-600 max-w-xs leading-relaxed">
            Create one now, or link them as you write. Tag your scenes to see them appear here — each unique tag becomes a thread row.
          </p>
        </div>
      </div>
    )
  }

  // For cells: map[threadName][chapterId] = scene[]
  const matrix = useMemo(() => {
    const m = {}
    threads.forEach(t => { m[t] = {} })
    chapters.forEach(ch => {
      (ch.scenes || []).forEach(s => {
        (s.tags || []).forEach(tag => {
          if (!tag?.trim()) return
          const t = tag.trim()
          if (!m[t]) m[t] = {}
          if (!m[t][ch.id]) m[t][ch.id] = []
          m[t][ch.id].push(s)
        })
      })
    })
    return m
  }, [threads, chapters])

  return (
    <div className="flex-1 overflow-auto bg-axiom-bg">
      <div className="min-w-max">

        {/* Header row — chapters */}
        <div className="flex sticky top-0 z-10 bg-axiom-bg border-b border-axiom-border">
          <div className="w-[160px] flex-shrink-0 px-4 py-3 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
            Thread
          </div>
          {chapters.map(ch => (
            <div
              key={ch.id}
              className="w-[140px] flex-shrink-0 px-3 py-3 text-xs font-medium text-slate-500 truncate border-l border-axiom-border/40"
              title={ch.title}
            >
              {ch.title || 'Untitled Chapter'}
              <span className="block text-[10px] text-slate-700 font-normal">
                {(ch.scenes || []).length} scenes
              </span>
            </div>
          ))}
        </div>

        {/* Thread rows */}
        {threads.map((thread, tIdx) => {
          const colorClass = THREAD_COLORS[tIdx % THREAD_COLORS.length]
          const totalScenes = Object.values(matrix[thread] || {}).flat().length
          return (
            <div key={thread} className="flex border-b border-axiom-border/50 hover:bg-axiom-surface/20">
              {/* Thread label */}
              <div className="w-[160px] flex-shrink-0 px-4 py-3 flex flex-col justify-center">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border self-start ${colorClass}`}>
                  {thread}
                </span>
                <span className="text-[10px] text-slate-700 mt-1">{totalScenes} scene{totalScenes !== 1 ? 's' : ''}</span>
              </div>

              {/* Chapter cells */}
              {chapters.map(ch => {
                const scenes = matrix[thread][ch.id] || []
                return (
                  <div
                    key={ch.id}
                    className="w-[140px] flex-shrink-0 px-2 py-2 flex flex-col gap-1 border-l border-axiom-border/40 min-h-[52px]"
                  >
                    {scenes.map(scene => (
                      <button
                        key={scene.id}
                        onClick={() => onOpenScene(scene.id)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-axiom-surface hover:bg-axiom-surface2 border border-axiom-border text-left group transition-all"
                        title={`${scene.title} — click to open`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[scene.status] ?? STATUS_DOT.planned}`} />
                        <span className="text-[10px] text-slate-400 group-hover:text-slate-200 truncate">
                          {scene.title || 'Untitled'}
                        </span>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* Unthreaded scenes row */}
        {(() => {
          const unthreaded = chapters.flatMap(ch =>
            (ch.scenes || [])
              .filter(s => !s.tags || s.tags.length === 0)
              .map(s => ({ ...s, chapterTitle: ch.title, chapterId: ch.id }))
          )
          if (!unthreaded.length) return null
          return (
            <div className="flex border-b border-axiom-border/50 opacity-60 hover:opacity-100">
              <div className="w-[160px] flex-shrink-0 px-4 py-3 flex flex-col justify-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border self-start text-slate-500 bg-axiom-surface border-axiom-border">
                  Untagged
                </span>
                <span className="text-[10px] text-slate-700 mt-1">{unthreaded.length} scene{unthreaded.length !== 1 ? 's' : ''}</span>
              </div>
              {chapters.map(ch => {
                const scenes = unthreaded.filter(s => s.chapterId === ch.id)
                return (
                  <div key={ch.id} className="w-[140px] flex-shrink-0 px-2 py-2 flex flex-col gap-1 border-l border-axiom-border/40 min-h-[52px]">
                    {scenes.map(scene => (
                      <button
                        key={scene.id}
                        onClick={() => onOpenScene(scene.id)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-axiom-surface hover:bg-axiom-surface2 border border-axiom-border text-left group transition-all"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[scene.status] ?? STATUS_DOT.planned}`} />
                        <span className="text-[10px] text-slate-400 group-hover:text-slate-200 truncate">
                          {scene.title || 'Untitled'}
                        </span>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-axiom-border text-[10px] text-slate-600">
        <span className="font-semibold text-slate-500">Status:</span>
        {Object.entries(STATUS_DOT).map(([status, cls]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${cls}`} />
            <span className="capitalize">{status}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
