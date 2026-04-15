import React from 'react'
import { GitBranch, Clock, CheckCircle2, Archive, MoreHorizontal } from 'lucide-react'
import { THREAD_TYPES } from './AddThreadModal'

// Dormancy colors
function dormancyStyle(count) {
  if (count >= 7) return { dot: 'bg-red-500',  text: 'text-red-400',  label: `${count} scenes ago — forgotten!`, ring: 'border-red-500/30' }
  if (count >= 4) return { dot: 'bg-gold-500', text: 'text-gold-400', label: `${count} scenes ago — going quiet`,  ring: 'border-gold-500/20' }
  return              { dot: 'bg-teal-500',  text: 'text-teal-400', label: count === 0 ? 'Active' : `${count} scene${count !== 1 ? 's' : ''} ago`, ring: 'border-axiom-border' }
}

export default function ThreadCard({ thread, onClick, onResolve, onDrop, onActivate, chapterMap }) {
  const ds        = dormancyStyle(thread.dormancyCount || 0)
  const typeInfo  = THREAD_TYPES.find(t => t.value === thread.type)
  const introChap = chapterMap?.[thread.introducedInChapter] || 'Unknown'
  const lastChap  = chapterMap?.[thread.lastReferencedInChapter] || introChap

  return (
    <div
      onClick={onClick}
      className={`card cursor-pointer hover:border-axiom-border-light transition-all duration-200 group p-4 space-y-3 border ${ds.ring}`}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {typeInfo && (
            <span className={`inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded-full border mb-1.5 ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
          )}
          <h4 className="text-sm font-medium text-slate-200 group-hover:text-white leading-snug line-clamp-2">
            {thread.title}
          </h4>
        </div>

        {/* Dormancy dot */}
        <div className="flex-shrink-0 mt-0.5">
          <div className={`w-2.5 h-2.5 rounded-full ${ds.dot} flex-shrink-0`} title={ds.label} />
        </div>
      </div>

      {thread.description && (
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{thread.description}</p>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
        <span className="text-slate-600">
          Intro: <span className="text-slate-500">{introChap}</span>
        </span>
        {lastChap !== introChap && (
          <span className="text-slate-600">
            Last: <span className="text-slate-500">{lastChap}</span>
          </span>
        )}
        <span className={`font-medium ${ds.text}`}>{ds.label}</span>
      </div>

      {thread.resolutionNotes && (
        <p className="text-[10px] text-slate-600 border-t border-axiom-border pt-2 line-clamp-1 italic">
          Resolution: {thread.resolutionNotes}
        </p>
      )}

      {/* Action row */}
      <div
        className="flex gap-1.5 pt-1 border-t border-axiom-border/50 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => e.stopPropagation()}
      >
        {thread.status === 'active' && (
          <>
            <button
              onClick={onResolve}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-teal-400 hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20 transition-all"
            >
              <CheckCircle2 className="w-3 h-3" /> Resolve
            </button>
            <button
              onClick={onDrop}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-slate-500 hover:bg-axiom-surface2 border border-transparent hover:border-axiom-border transition-all"
            >
              <Archive className="w-3 h-3" /> Drop
            </button>
          </>
        )}
        {(thread.status === 'resolved' || thread.status === 'dropped') && (
          <button
            onClick={onActivate}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-gold-400 hover:bg-gold-500/10 border border-transparent hover:border-gold-500/20 transition-all"
          >
            <GitBranch className="w-3 h-3" /> Reopen
          </button>
        )}
      </div>
    </div>
  )
}
