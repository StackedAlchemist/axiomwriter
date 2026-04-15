import React, { useState, useRef, useEffect } from 'react'
import { BookOpen, Clock, MoreHorizontal, Archive, Trash2, ExternalLink, AlertTriangle, RotateCcw } from 'lucide-react'

const GENRE_COLORS = {
  'Fantasy':           'from-indigo-900/60 to-purple-900/60',
  'Sci-Fi':            'from-cyan-900/60 to-blue-900/60',
  'Romance':           'from-pink-900/60 to-rose-900/60',
  'Thriller':          'from-slate-900/60 to-red-900/40',
  'Mystery':           'from-gray-900/60 to-slate-800/60',
  'Horror':            'from-red-950/80 to-gray-900/60',
  'Literary Fiction':  'from-amber-900/40 to-stone-900/60',
  'Young Adult':       'from-violet-900/60 to-fuchsia-900/40',
  'Historical Fiction':'from-yellow-900/40 to-amber-900/60',
  'Other':             'from-axiom-surface2 to-axiom-surface',
}

function formatWords(n) {
  if (!n) return '0 words'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k words`
  return `${n} words`
}

function timeAgo(ts) {
  if (!ts?.toDate) return ''
  const diff = Date.now() - ts.toDate().getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function daysUntilDeletion(trashedAt) {
  if (!trashedAt?.toDate) return 30
  const days = Math.floor((Date.now() - trashedAt.toDate().getTime()) / 86400000)
  return Math.max(0, 30 - days)
}

export default function ProjectCard({ project, onClick, onArchive, onRestore, onTrash, onDeleteForever }) {
  const gradient = GENRE_COLORS[project.genre] ?? GENRE_COLORS['Other']
  const status = project.status ?? 'active'

  const [menuOpen,    setMenuOpen]    = useState(false)
  const [confirming,  setConfirming]  = useState(null) // 'trash' | 'deleteForever' | null
  const [deleteInput, setDeleteInput] = useState('')
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
        setConfirming(null)
        setDeleteInput('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  function handleMenuToggle(e) {
    e.stopPropagation()
    setMenuOpen(p => !p)
    setConfirming(null)
    setDeleteInput('')
  }

  function closeMenu() {
    setMenuOpen(false)
    setConfirming(null)
    setDeleteInput('')
  }

  const daysLeft = status === 'trashed' ? daysUntilDeletion(project.trashedAt) : null

  return (
    <div
      onClick={status !== 'trashed' ? onClick : undefined}
      className={`card group hover:border-axiom-border-light hover:shadow-glow-gold transition-all duration-300 overflow-hidden flex flex-col relative ${status !== 'trashed' ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {/* Cover area */}
      <div className={`h-32 bg-gradient-to-br ${gradient} relative overflow-hidden flex-shrink-0`}>
        <div className="absolute inset-0 bg-noise opacity-40" />

        {project.coverImageUrl && (
          <img src={project.coverImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        )}

        {/* Status badges */}
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <span className="badge-gold text-[10px]">{project.genre}</span>
          {status === 'archived' && (
            <span className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/50 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">
              <Archive className="w-2.5 h-2.5" />
              Archived
            </span>
          )}
          {status === 'trashed' && (
            <span className="flex items-center gap-1 bg-red-900/80 border border-red-700/50 text-red-300 text-[10px] px-2 py-0.5 rounded-full">
              <Trash2 className="w-2.5 h-2.5" />
              {daysLeft === 0 ? 'Deleting soon' : `${daysLeft}d left`}
            </span>
          )}
        </div>

        {/* 3-dot menu */}
        <div ref={menuRef} className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={handleMenuToggle}
            className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg bg-axiom-bg/70 border border-axiom-border text-slate-400 hover:text-slate-100 transition-all duration-150"
            title="Project options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-9 w-52 bg-axiom-surface border border-axiom-border rounded-xl shadow-card animate-fade-in z-20 overflow-hidden">

              {/* ── Default menu ── */}
              {!confirming && (
                <>
                  {/* Active project */}
                  {status === 'active' && (
                    <>
                      <button
                        onClick={() => { closeMenu(); onClick?.() }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-300 hover:bg-axiom-surface2 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        Open project
                      </button>
                      {onArchive && (
                        <button
                          onClick={e => { e.stopPropagation(); closeMenu(); onArchive(project.id) }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-300 hover:bg-axiom-surface2 hover:text-white transition-colors"
                        >
                          <Archive className="w-3.5 h-3.5 text-slate-500" />
                          Archive
                        </button>
                      )}
                    </>
                  )}

                  {/* Archived project */}
                  {status === 'archived' && (
                    <>
                      <button
                        onClick={() => { closeMenu(); onClick?.() }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-300 hover:bg-axiom-surface2 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        Open project
                      </button>
                      {onRestore && (
                        <button
                          onClick={e => { e.stopPropagation(); closeMenu(); onRestore(project.id) }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-300 hover:bg-axiom-surface2 hover:text-white transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                          Restore to active
                        </button>
                      )}
                      {onTrash && (
                        <button
                          onClick={e => { e.stopPropagation(); setConfirming('trash') }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-red-400 hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Move to Trash
                        </button>
                      )}
                    </>
                  )}

                  {/* Trashed project */}
                  {status === 'trashed' && (
                    <>
                      {onRestore && (
                        <button
                          onClick={e => { e.stopPropagation(); closeMenu(); onRestore(project.id) }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-300 hover:bg-axiom-surface2 hover:text-white transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                          Restore to active
                        </button>
                      )}
                      {onDeleteForever && (
                        <button
                          onClick={e => { e.stopPropagation(); setConfirming('deleteForever') }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-red-400 hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete forever
                        </button>
                      )}
                    </>
                  )}
                </>
              )}

              {/* ── Trash confirm ── */}
              {confirming === 'trash' && (
                <div className="p-3 space-y-2">
                  <div className="flex items-start gap-2 text-xs text-slate-400">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400 mt-0.5" />
                    <span>Move <strong className="text-slate-200">"{project.title}"</strong> to Trash? It will be permanently deleted after 30 days.</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); setConfirming(null) }}
                      className="flex-1 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-axiom-surface2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); closeMenu(); onTrash(project.id) }}
                      className="flex-1 px-2 py-1.5 text-xs text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors font-medium"
                    >
                      Move to Trash
                    </button>
                  </div>
                </div>
              )}

              {/* ── Delete forever confirm ── */}
              {confirming === 'deleteForever' && (
                <div className="p-3 space-y-2.5">
                  <div className="flex items-start gap-2 text-xs text-red-400">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>This <strong>cannot be undone</strong>. All scenes and data will be lost forever.</span>
                  </div>
                  <input
                    autoFocus
                    value={deleteInput}
                    onChange={e => setDeleteInput(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    placeholder='Type DELETE to confirm'
                    className="w-full bg-axiom-bg border border-red-500/30 rounded-lg px-2.5 py-1.5 text-xs text-red-300 placeholder-red-900 outline-none focus:border-red-500/60"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); setConfirming(null); setDeleteInput('') }}
                      className="flex-1 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-axiom-surface2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={deleteInput !== 'DELETE'}
                      onClick={e => { e.stopPropagation(); closeMenu(); onDeleteForever(project.id) }}
                      className="flex-1 px-2 py-1.5 text-xs text-white bg-red-700 hover:bg-red-600 rounded-lg transition-colors font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Delete forever
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className={`p-4 flex flex-col flex-1 ${status !== 'active' ? 'opacity-60' : ''}`}>
        <div className="flex-1">
          <h3 className="font-serif text-base font-semibold text-slate-100 group-hover:text-white transition-colors line-clamp-2 mb-0.5">
            {project.title}
          </h3>
          {project.seriesName && (
            <p className="text-xs text-gold-500/70 mb-1">{project.seriesName}</p>
          )}
          {project.synopsis && (
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mt-1">
              {project.synopsis}
            </p>
          )}
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-axiom-border">
          <span className="flex items-center gap-1.5 text-xs text-slate-600">
            <BookOpen className="w-3 h-3" />
            {formatWords(project.wordCount)}
          </span>
          {project.updatedAt && (
            <span className="flex items-center gap-1 text-xs text-slate-700">
              <Clock className="w-3 h-3" />
              {timeAgo(project.updatedAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
