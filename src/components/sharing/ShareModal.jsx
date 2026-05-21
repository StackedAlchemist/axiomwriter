import React, { useState } from 'react'
import { X, Share2, Link, Copy, Check, Eye, EyeOff, Loader2, BookOpen, ExternalLink } from 'lucide-react'
import { useProjectShares } from '../../hooks/useProjectShare'
import { useAuth } from '../../contexts/AuthContext'

function getAllChapters(structure) {
  if (!structure) return []
  if (structure.hasParts) return (structure.parts || []).flatMap(p => p.chapters || [])
  return structure.chapters || []
}

function shareUrl(shareId) {
  return `${window.location.origin}/read/${shareId}`
}

export default function ShareModal({ project, structure, onClose }) {
  const { currentUser } = useAuth()
  const { shares, loading, createShare, toggleShare } = useProjectShares(project?.id, currentUser?.uid)

  const [creating,          setCreating]          = useState(false)
  const [scope,             setScope]             = useState('full')
  const [selectedChapters,  setSelectedChapters]  = useState([])
  const [saving,            setSaving]            = useState(false)
  const [newShareId,        setNewShareId]        = useState(null)
  const [copiedId,          setCopiedId]          = useState(null)

  const chapters = getAllChapters(structure)

  function toggleChapter(chId) {
    setSelectedChapters(prev =>
      prev.includes(chId) ? prev.filter(id => id !== chId) : [...prev, chId]
    )
  }

  async function handleCreate() {
    if (scope === 'chapters' && selectedChapters.length === 0) return
    setSaving(true)
    try {
      const id = await createShare({
        projectTitle:       project.title,
        authorName:         currentUser.displayName || 'Author',
        coverImageUrl:      project.coverImageUrl || null,
        scope,
        selectedChapterIds: scope === 'full' ? [] : selectedChapters,
        structure,
      })
      setNewShareId(id)
      setCreating(false)
    } catch (err) {
      console.error('[ShareModal] createShare failed', err)
    } finally {
      setSaving(false)
    }
  }

  async function copy(id) {
    await navigator.clipboard.writeText(shareUrl(id))
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-axiom-surface border border-axiom-border rounded-2xl shadow-card w-full max-w-lg animate-slide-up max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-axiom-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <Share2 className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div>
              <h2 className="font-serif text-base font-semibold text-slate-100">Share for Reading</h2>
              <p className="text-[11px] text-slate-500">Invite readers to your manuscript</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Newly created share → show link */}
          {newShareId && (
            <div className="rounded-xl bg-teal-500/10 border border-teal-500/30 p-4 space-y-3">
              <p className="text-sm font-semibold text-teal-300 flex items-center gap-2">
                <Check className="w-4 h-4" /> Share link ready
              </p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={shareUrl(newShareId)}
                  className="input-base text-xs flex-1 font-mono"
                />
                <button
                  onClick={() => copy(newShareId)}
                  className="btn-secondary text-xs flex items-center gap-1.5 flex-shrink-0"
                >
                  {copiedId === newShareId
                    ? <><Check className="w-3.5 h-3.5" />Copied!</>
                    : <><Copy className="w-3.5 h-3.5" />Copy</>}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Anyone with this link can read your manuscript. Deactivate it below at any time.
              </p>
            </div>
          )}

          {/* Existing shares list */}
          {!loading && shares.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Your Share Links</p>
              {shares.map(share => (
                <div
                  key={share.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-opacity ${
                    share.active
                      ? 'border-axiom-border bg-axiom-surface2'
                      : 'border-axiom-border/40 bg-axiom-surface2/50 opacity-50'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 truncate font-mono">{shareUrl(share.id)}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {share.scope === 'full'
                        ? `Full manuscript · ${share.chapterCount} chapter${share.chapterCount !== 1 ? 's' : ''}`
                        : `${share.chapterCount} chapter${share.chapterCount !== 1 ? 's' : ''} selected`}
                      {' · '}
                      <span className={share.active ? 'text-teal-500' : 'text-slate-600'}>
                        {share.active ? 'Active' : 'Deactivated'}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {share.active && (
                      <>
                        <button
                          onClick={() => copy(share.id)}
                          className="btn-icon"
                          title="Copy link"
                        >
                          {copiedId === share.id
                            ? <Check className="w-3.5 h-3.5 text-teal-400" />
                            : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <a
                          href={shareUrl(share.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-icon"
                          title="Open reader"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </>
                    )}
                    <button
                      onClick={() => toggleShare(share.id, !share.active)}
                      className="btn-icon"
                      title={share.active ? 'Deactivate link' : 'Reactivate link'}
                    >
                      {share.active
                        ? <EyeOff className="w-3.5 h-3.5" />
                        : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create new share */}
          {creating ? (
            <div className="space-y-4 p-4 rounded-xl border border-axiom-border bg-axiom-surface2">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">New Share Link</p>

              {/* Scope selector */}
              <div>
                <p className="text-xs text-slate-400 mb-2">What to share</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScope('full')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      scope === 'full'
                        ? 'border-teal-500/40 bg-teal-500/10'
                        : 'border-axiom-border bg-axiom-bg hover:border-axiom-border-light'
                    }`}
                  >
                    <p className={`text-xs font-semibold mb-0.5 ${scope === 'full' ? 'text-teal-400' : 'text-slate-300'}`}>
                      Full Manuscript
                    </p>
                    <p className="text-[10px] text-slate-600 leading-snug">
                      All {chapters.length} chapter{chapters.length !== 1 ? 's' : ''}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope('chapters')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      scope === 'chapters'
                        ? 'border-teal-500/40 bg-teal-500/10'
                        : 'border-axiom-border bg-axiom-bg hover:border-axiom-border-light'
                    }`}
                  >
                    <p className={`text-xs font-semibold mb-0.5 ${scope === 'chapters' ? 'text-teal-400' : 'text-slate-300'}`}>
                      Select Chapters
                    </p>
                    <p className="text-[10px] text-slate-600 leading-snug">
                      Pick specific chapters
                    </p>
                  </button>
                </div>
              </div>

              {/* Chapter picker */}
              {scope === 'chapters' && (
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {chapters.map((ch, i) => (
                    <label
                      key={ch.id}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-axiom-bg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedChapters.includes(ch.id)}
                        onChange={() => toggleChapter(ch.id)}
                        className="w-3.5 h-3.5 rounded border-axiom-border bg-axiom-bg accent-teal-500"
                      />
                      <span className="text-xs text-slate-300 flex-1">{ch.title || `Chapter ${i + 1}`}</span>
                      <span className="text-[10px] text-slate-600">
                        {(ch.scenes || []).length} scene{(ch.scenes || []).length !== 1 ? 's' : ''}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {saving && (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Fetching scene content — this may take a moment…
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setCreating(false); setSelectedChapters([]) }}
                  className="btn-secondary flex-1 text-xs"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving || (scope === 'chapters' && selectedChapters.length === 0)}
                  className="btn-primary flex-1 text-xs flex items-center justify-center gap-1.5"
                >
                  {saving
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Building…</>
                    : <><Link className="w-3.5 h-3.5" />Generate Link</>}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full p-3 rounded-xl border border-dashed border-axiom-border hover:border-teal-500/40 hover:bg-teal-500/5 transition-all flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-teal-400"
            >
              <Share2 className="w-3.5 h-3.5" />
              Create new share link
            </button>
          )}

          <p className="text-[10px] text-slate-700 text-center leading-relaxed">
            Readers receive a read-only view of your content. Links capture a snapshot — to update what a reader sees, create a new link.
          </p>
        </div>
      </div>
    </div>
  )
}
