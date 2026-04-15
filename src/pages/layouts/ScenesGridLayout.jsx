/**
 * Layout 2 — SCENE GRID
 * Characters across the top, scenes down the left.
 * A cell is highlighted when that character is the POV for that scene.
 */
import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllChapters } from '../../hooks/useManuscript'
import { AVATAR_COLORS, ROLE_OPTIONS } from '../../hooks/useCharacters'

const STATUS_COLORS = {
  planned:  'border-l-slate-600',
  drafted:  'border-l-teal-500',
  revised:  'border-l-gold-500',
  locked:   'border-l-purple-500',
}

export default function ScenesGridLayout({ structure, characters, onOpenScene, projectId }) {
  const navigate = useNavigate()
  const chapters = useMemo(() => getAllChapters(structure), [structure])

  // Filter to meaningful characters (non-background, or any if few)
  const displayChars = useMemo(() => {
    if (!characters?.length) return []
    const sorted = [...characters].sort((a, b) => {
      const order = { protagonist: 0, antagonist: 1, major: 2, supporting: 3, background: 4 }
      return (order[a.role] ?? 5) - (order[b.role] ?? 5)
    })
    return sorted.slice(0, 10)
  }, [characters])

  if (!structure) return null

  const allScenes = chapters.flatMap(ch =>
    (ch.scenes || []).map(s => ({ ...s, chapterTitle: ch.title, chapterId: ch.id }))
  )

  if (allScenes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
        <p className="text-slate-400 text-sm font-medium">No scenes yet</p>
        <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
          Add scenes to your manuscript to use this view. Switch to Linear view to start writing.
        </p>
        <button
          onClick={() => navigate(`/projects/${projectId}`, { state: { switchLayout: 'linear' } })}
          className="px-4 py-2 text-xs rounded-lg bg-axiom-surface border border-axiom-border text-slate-400 hover:border-axiom-border-light hover:text-slate-200 transition-all"
        >
          Open Manuscript Editor
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto bg-axiom-bg">
      <div className="min-w-max">
        {/* Header row — characters */}
        <div className="flex sticky top-0 z-10 bg-axiom-bg border-b border-axiom-border">
          {/* Scene label column */}
          <div className="w-[220px] flex-shrink-0 px-4 py-3 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
            Scene
          </div>

          {/* Character columns */}
          {displayChars.map(char => {
            const ac = AVATAR_COLORS[char.role] ?? AVATAR_COLORS.supporting
            const initials = (char.name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
            const roleLabel = ROLE_OPTIONS.find(r => r.value === char.role)?.label ?? ''
            return (
              <div
                key={char.id}
                className="w-[80px] flex-shrink-0 flex flex-col items-center justify-end pb-2 pt-2 gap-1"
                title={`${char.name} — ${roleLabel}`}
              >
                <div className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 overflow-hidden ${ac.bg} ${ac.border}`}>
                  {char.photoUrl
                    ? <img src={char.photoUrl} alt={char.name} className="w-full h-full object-cover rounded-full" />
                    : <span className={`text-[9px] font-bold font-serif ${ac.text}`}>{initials}</span>
                  }
                </div>
                <span className="text-[9px] text-slate-500 truncate w-[70px] text-center">{char.name}</span>
              </div>
            )
          })}

          {displayChars.length === 0 && (
            <div className="px-4 py-3 text-xs text-slate-700 italic">
              No characters yet — add them in the Characters page
            </div>
          )}
        </div>

        {/* Scene rows, grouped by chapter */}
        {chapters.map(chapter => (
          <div key={chapter.id}>
            {/* Chapter header */}
            <div className="flex items-center gap-2 px-4 py-1.5 bg-axiom-surface/50 border-b border-axiom-border sticky top-[52px] z-[5]">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {chapter.title || 'Untitled Chapter'}
              </span>
              <span className="text-[10px] text-slate-700">
                {chapter.scenes?.length ?? 0} scene{chapter.scenes?.length !== 1 ? 's' : ''}
              </span>
            </div>

            {(chapter.scenes || []).map(scene => {
              const povName = (scene.povCharacter || '').toLowerCase().trim()
              return (
                <div
                  key={scene.id}
                  className={`flex items-center border-b border-axiom-border/50 hover:bg-axiom-surface/30 group border-l-2 ${STATUS_COLORS[scene.status] ?? STATUS_COLORS.planned}`}
                >
                  {/* Scene info */}
                  <button
                    onClick={() => onOpenScene(scene.id)}
                    className="w-[220px] flex-shrink-0 px-4 py-2.5 text-left"
                  >
                    <p className="text-xs font-medium text-slate-300 group-hover:text-slate-100 truncate">
                      {scene.title || 'Untitled Scene'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {scene.wordCount > 0 && (
                        <span className="text-[10px] text-slate-600">
                          {scene.wordCount >= 1000
                            ? `${(scene.wordCount / 1000).toFixed(1)}k`
                            : scene.wordCount} words
                        </span>
                      )}
                      <span className="text-[10px] text-slate-700 capitalize">{scene.status}</span>
                    </div>
                  </button>

                  {/* Character cells */}
                  {displayChars.map(char => {
                    const charName = (char.name || '').toLowerCase().trim()
                    const isPov = povName && charName && povName === charName
                    return (
                      <div
                        key={char.id}
                        className="w-[80px] flex-shrink-0 flex items-center justify-center py-2.5"
                      >
                        {isPov && (
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${AVATAR_COLORS[char.role]?.bg ?? 'bg-gold-500/20'} ${AVATAR_COLORS[char.role]?.border ?? 'border-gold-500/30'}`}
                            title={`${char.name} — POV`}
                          >
                            <span className="text-[8px] font-bold text-gold-400">POV</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-axiom-border text-[10px] text-slate-600">
        <span className="font-semibold text-slate-500">Status:</span>
        {Object.entries(STATUS_COLORS).map(([status, cls]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm border-l-2 ${cls} bg-axiom-surface2`} />
            <span className="capitalize">{status}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
