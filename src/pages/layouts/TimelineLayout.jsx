/**
 * Layout 5 — TIMELINE
 * Characters as rows (Y axis), scenes in chronological order as columns (X axis).
 * Each cell shows a colored block when that character is the POV for that scene.
 * Block width is proportional to word count.
 */
import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { getAllChapters } from '../../hooks/useManuscript'
import { AVATAR_COLORS, ROLE_OPTIONS } from '../../hooks/useCharacters'

const STATUS_OPACITY = {
  planned: 0.35,
  drafted: 0.65,
  revised: 0.85,
  locked:  1.0,
}

const MIN_BLOCK_W = 28  // px minimum width per scene column
const MAX_BLOCK_W = 80  // px maximum

function lerp(min, max, t) {
  return Math.round(min + (max - min) * Math.max(0, Math.min(1, t)))
}

export default function TimelineLayout({ structure, characters, onOpenScene }) {
  const navigate  = useNavigate()
  const { projectId } = useParams()
  const [showHelp, setShowHelp] = useState(false)
  const chapters = useMemo(() => getAllChapters(structure), [structure])

  // All scenes in order, with chapter info
  const allScenes = useMemo(() =>
    chapters.flatMap(ch =>
      (ch.scenes || []).map(s => ({ ...s, chapterTitle: ch.title, chapterId: ch.id }))
    ),
    [chapters]
  )

  // Compute word count range for scaling
  const maxWords = useMemo(
    () => Math.max(100, ...allScenes.map(s => s.wordCount || 0)),
    [allScenes]
  )

  // Sort characters: protagonist first, then by role order
  const displayChars = useMemo(() => {
    if (!characters?.length) return []
    const order = { protagonist: 0, antagonist: 1, major: 2, supporting: 3, background: 4 }
    return [...characters]
      .sort((a, b) => (order[a.role] ?? 5) - (order[b.role] ?? 5))
      .slice(0, 12)
  }, [characters])

  // Chapter boundary indices for header grouping.
  // Must run before the early returns below — hooks can't be conditional.
  const chapterBoundaries = useMemo(() => {
    const bounds = []
    let idx = 0
    chapters.forEach(ch => {
      if ((ch.scenes || []).length > 0) {
        bounds.push({ chapterId: ch.id, title: ch.title, startIdx: idx, count: ch.scenes.length })
        idx += ch.scenes.length
      }
    })
    return bounds
  }, [chapters])

  if (!structure) return null

  if (allScenes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
        <div className="w-12 h-12 rounded-xl bg-axiom-surface border border-axiom-border flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <p className="font-serif text-lg text-slate-300 mb-2">Timeline is waiting for your story</p>
          <p className="text-sm text-slate-600 max-w-xs leading-relaxed">
            Each row is a character. Each column is a scene. Write your first scene to see the timeline come alive.
          </p>
        </div>
      </div>
    )
  }

  if (displayChars.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
        <div className="w-12 h-12 rounded-xl bg-axiom-surface border border-axiom-border flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <p className="font-serif text-lg text-slate-300 mb-2">Your timeline comes to life when characters move through your story</p>
          <p className="text-sm text-slate-600 max-w-xs leading-relaxed">
            Add characters and assign a POV to your scenes to start tracking who appears where.
          </p>
        </div>
        <button
          onClick={() => navigate(`/projects/${projectId}/characters`)}
          className="px-4 py-2 text-xs rounded-lg bg-axiom-surface border border-axiom-border text-slate-400 hover:border-axiom-border-light hover:text-slate-200 transition-all"
        >
          Add Characters
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto bg-axiom-bg">
      <div className="min-w-max">

        {/* Chapter header row */}
        <div className="flex sticky top-0 z-10 bg-axiom-bg border-b border-axiom-border">
          {/* Character label column */}
          <div className="w-[160px] flex-shrink-0" />

          {/* Chapter spans */}
          {chapterBoundaries.map(bound => (
            <div
              key={bound.chapterId}
              style={{ width: bound.count * MIN_BLOCK_W + (bound.count - 1) * 2 }}
              className="flex-shrink-0 px-2 py-2 border-l border-axiom-border/40 overflow-hidden"
            >
              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap truncate block">
                {bound.title || 'Untitled Chapter'}
              </span>
            </div>
          ))}
        </div>

        {/* Scene number sub-header */}
        <div className="flex sticky top-[38px] z-[9] bg-axiom-bg/95 border-b border-axiom-border/50">
          <div className="w-[160px] flex-shrink-0 px-4 py-1 text-[9px] font-semibold text-slate-700 uppercase tracking-wider">
            Character
          </div>
          {allScenes.map((scene, idx) => (
            <div
              key={scene.id}
              style={{ width: MIN_BLOCK_W }}
              className="flex-shrink-0 flex items-center justify-center py-1 border-l border-axiom-border/20"
              title={scene.title}
            >
              <span className="text-[8px] text-slate-700">{idx + 1}</span>
            </div>
          ))}
        </div>

        {/* Character rows */}
        {displayChars.map(char => {
          const ac = AVATAR_COLORS[char.role] ?? AVATAR_COLORS.supporting
          const initials = (char.name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
          const charName = (char.name || '').toLowerCase().trim()
          const roleLabel = ROLE_OPTIONS.find(r => r.value === char.role)?.label ?? ''

          return (
            <div key={char.id} className="flex items-center border-b border-axiom-border/30 hover:bg-axiom-surface/20 group">
              {/* Character info */}
              <div className="w-[160px] flex-shrink-0 flex items-center gap-2 px-4 py-2">
                <div className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 overflow-hidden ${ac.bg} ${ac.border}`}>
                  {char.photoUrl
                    ? <img src={char.photoUrl} alt={char.name} className="w-full h-full object-cover rounded-full" />
                    : <span className={`text-[9px] font-bold font-serif ${ac.text}`}>{initials}</span>
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-300 truncate">{char.name}</p>
                  <p className={`text-[9px] ${ROLE_OPTIONS.find(r => r.value === char.role)?.color ?? 'text-slate-600'}`}>
                    {roleLabel}
                  </p>
                </div>
              </div>

              {/* Scene cells */}
              {allScenes.map(scene => {
                const scenePov = (scene.povCharacter || '').toLowerCase().trim()
                const isPov = charName && scenePov && scenePov === charName
                const opacity = STATUS_OPACITY[scene.status] ?? 0.35

                return (
                  <div
                    key={scene.id}
                    style={{ width: MIN_BLOCK_W }}
                    className="flex-shrink-0 flex items-center justify-center py-1.5 border-l border-axiom-border/20"
                  >
                    {isPov ? (
                      <button
                        onClick={() => onOpenScene(scene.id)}
                        style={{ opacity }}
                        className={`
                          w-[22px] h-[22px] rounded-sm border transition-all
                          hover:opacity-100 hover:scale-110
                          ${ac.bg} ${ac.border}
                        `}
                        title={`${scene.title} — POV: ${char.name}`}
                      />
                    ) : (
                      <div className="w-[22px] h-[22px]" />
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* "No POV" row — scenes with no character assigned */}
        {(() => {
          const charNames = new Set(displayChars.map(c => (c.name || '').toLowerCase().trim()))
          const unassigned = allScenes.filter(s => {
            const pov = (s.povCharacter || '').toLowerCase().trim()
            return !pov || !charNames.has(pov)
          })
          if (!unassigned.length) return null
          return (
            <div className="flex items-center border-b border-axiom-border/30 opacity-50">
              <div className="w-[160px] flex-shrink-0 px-4 py-2">
                <p className="text-xs text-slate-600 italic">No POV</p>
              </div>
              {allScenes.map(scene => {
                const pov = (scene.povCharacter || '').toLowerCase().trim()
                const isUnassigned = !pov || !charNames.has(pov)
                return (
                  <div
                    key={scene.id}
                    style={{ width: MIN_BLOCK_W }}
                    className="flex-shrink-0 flex items-center justify-center py-1.5 border-l border-axiom-border/20"
                  >
                    {isUnassigned && (
                      <button
                        onClick={() => onOpenScene(scene.id)}
                        className="w-[22px] h-[22px] rounded-sm bg-slate-700/30 border border-slate-600/30 hover:opacity-80 transition-all"
                        title={scene.title}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>

      {/* Scene index legend */}
      <div className="px-4 py-3 border-t border-axiom-border">
        <p className="text-[10px] text-slate-600 mb-2 font-semibold uppercase tracking-wider">Scenes</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {allScenes.map((scene, idx) => (
            <button
              key={scene.id}
              onClick={() => onOpenScene(scene.id)}
              className="flex items-center gap-1.5 text-[10px] text-slate-600 hover:text-slate-300 transition-colors"
            >
              <span className="text-slate-700 font-medium">{idx + 1}.</span>
              <span className="truncate max-w-[160px]">{scene.title || 'Untitled'}</span>
              {scene.wordCount > 0 && (
                <span className="text-slate-700">
                  ({scene.wordCount >= 1000 ? `${(scene.wordCount/1000).toFixed(1)}k` : scene.wordCount})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* How Timeline Works */}
      <div className="px-4 py-3 border-t border-axiom-border">
        <button
          onClick={() => setShowHelp(h => !h)}
          className="flex items-center gap-2 text-[10px] font-semibold text-slate-600 hover:text-slate-400 uppercase tracking-wider transition-colors"
        >
          <HelpCircle className="w-3 h-3" />
          How Timeline Works
          {showHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {showHelp && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2 text-[10px] text-slate-500 leading-relaxed">
              <p><span className="text-slate-400 font-semibold">Row</span> = one character</p>
              <p><span className="text-slate-400 font-semibold">Column</span> = one scene (in order)</p>
              <p><span className="text-slate-400 font-semibold">Block</span> = that character is POV for that scene</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Draft Status (opacity)</p>
              {Object.entries(STATUS_OPACITY).map(([status, opacity]) => (
                <span key={status} className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span
                    className="w-4 h-4 rounded-sm bg-teal-500/80 border border-teal-500/50 flex-shrink-0"
                    style={{ opacity }}
                  />
                  <span className="capitalize">{status}</span>
                </span>
              ))}
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Character Colors</p>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map(r => {
                  const ac = AVATAR_COLORS[r.value] ?? AVATAR_COLORS.supporting
                  return (
                    <span key={r.value} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span className={`w-3.5 h-3.5 rounded-full border ${ac.bg} ${ac.border}`} />
                      {r.label}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
