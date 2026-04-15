/**
 * Layout 4 — CORKBOARD
 * Scene cards in a flowing grid, grouped by chapter.
 * Cards are color-coded by status. Click to open in Linear view.
 */
import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAllChapters } from '../../hooks/useManuscript'
import { FileText, Tag } from 'lucide-react'

const STATUS_STYLES = {
  planned:  { border: 'border-slate-600/50',   badge: 'bg-slate-700/60 text-slate-400',   label: 'Planned'  },
  drafted:  { border: 'border-teal-500/50',    badge: 'bg-teal-500/15 text-teal-400',     label: 'Drafted'  },
  revised:  { border: 'border-gold-500/50',    badge: 'bg-gold-500/15 text-gold-400',     label: 'Revised'  },
  locked:   { border: 'border-purple-500/50',  badge: 'bg-purple-500/15 text-purple-400', label: 'Locked'   },
}

function SceneCard({ scene, chapterTitle, onOpen }) {
  const ss = STATUS_STYLES[scene.status] ?? STATUS_STYLES.planned
  const words = scene.wordCount || 0

  return (
    <button
      onClick={() => onOpen(scene.id)}
      className={`
        relative flex flex-col gap-2 p-3 rounded-xl bg-axiom-surface border ${ss.border}
        hover:border-gold-500/40 hover:bg-axiom-surface2
        text-left transition-all duration-150 shadow-card group
        w-full
      `}
      title={`Open: ${scene.title}`}
    >
      {/* Status badge */}
      <span className={`self-start text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${ss.badge}`}>
        {ss.label}
      </span>

      {/* Scene title */}
      <p className="text-sm font-medium text-slate-200 group-hover:text-white leading-snug line-clamp-2">
        {scene.title || 'Untitled Scene'}
      </p>

      {/* POV character */}
      {scene.povCharacter && (
        <p className="text-xs text-slate-500 truncate">
          POV: <span className="text-slate-400">{scene.povCharacter}</span>
        </p>
      )}

      {/* Tags */}
      {scene.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {scene.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-axiom-bg border border-axiom-border text-slate-600">
              {tag}
            </span>
          ))}
          {scene.tags.length > 3 && (
            <span className="text-[9px] text-slate-700">+{scene.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-axiom-border/50">
        <span className="text-[10px] text-slate-700 flex items-center gap-1">
          <FileText className="w-2.5 h-2.5" />
          {words >= 1000 ? `${(words / 1000).toFixed(1)}k` : words || '—'} words
        </span>
      </div>
    </button>
  )
}

export default function CorkboardLayout({ structure, onOpenScene }) {
  const navigate  = useNavigate()
  const { projectId } = useParams()
  const chapters = useMemo(() => getAllChapters(structure), [structure])
  const [filter, setFilter] = useState('all') // 'all' | status value

  if (!structure) return null

  const allScenes = chapters.flatMap(ch =>
    (ch.scenes || []).map(s => ({ ...s, chapterTitle: ch.title }))
  )

  if (allScenes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
        <p className="text-slate-400 text-sm font-medium">No scenes yet</p>
        <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
          Your corkboard populates as you write. Add scenes in the manuscript editor to see them here.
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
    <div className="flex-1 flex flex-col overflow-hidden bg-axiom-bg">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-axiom-border flex-shrink-0">
        <span className="text-xs text-slate-600">Filter:</span>
        {['all', 'planned', 'drafted', 'revised', 'locked'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-2.5 py-1 rounded-full transition-all ${
              filter === f
                ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30'
                : 'text-slate-500 hover:text-slate-300 border border-transparent hover:border-axiom-border'
            }`}
          >
            {f === 'all' ? 'All' : STATUS_STYLES[f]?.label ?? f}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-700">
          {allScenes.filter(s => filter === 'all' || s.status === filter).length} scenes
        </span>
      </div>

      {/* Cards scrollable area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {chapters.map(chapter => {
          const scenes = (chapter.scenes || []).filter(
            s => filter === 'all' || s.status === filter
          )
          if (!scenes.length) return null
          return (
            <div key={chapter.id}>
              {/* Chapter header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-axiom-border" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  {chapter.title || 'Untitled Chapter'}
                </span>
                <span className="text-[10px] text-slate-700">{scenes.length}</span>
                <div className="h-px flex-1 bg-axiom-border" />
              </div>

              {/* Card grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {scenes.map(scene => (
                  <SceneCard
                    key={scene.id}
                    scene={scene}
                    chapterTitle={chapter.title}
                    onOpen={onOpenScene}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
