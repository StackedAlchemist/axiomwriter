import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Download, CheckCircle2, AlertTriangle, XCircle,
  Loader2, BookOpen, Settings2, ChevronRight, Image, FileText,
  Smartphone, BookMarked, Zap,
} from 'lucide-react'
import { useManuscript } from '../hooks/useManuscript'
import { PLATFORMS, runReadinessCheck, exportManuscript } from '../lib/publishingEngine'
import LoadingSpinner from '../components/common/LoadingSpinner'

// ── Status icon ───────────────────────────────────────────────────────────────
function StatusIcon({ status, size = 'sm' }) {
  const cls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  if (status === 'pass') return <CheckCircle2 className={`${cls} text-teal-400 flex-shrink-0`} />
  if (status === 'warn') return <AlertTriangle className={`${cls} text-gold-400 flex-shrink-0`} />
  return <XCircle className={`${cls} text-red-400 flex-shrink-0`} />
}

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const r   = 44
  const circ = 2 * Math.PI * r
  const off  = circ - (score / 100) * circ
  const col  = score >= 85 ? '#2dd4bf' : score >= 60 ? '#f59e0b' : '#ef4444'
  const lbl  = score >= 85 ? 'Ready' : score >= 60 ? 'Almost' : 'Needs work'

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg viewBox="0 0 100 100" className="w-24 h-24">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" stroke="currentColor" className="text-axiom-surface2" />
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" stroke={col}
          strokeDasharray={circ} strokeDashoffset={off}
          strokeLinecap="round" transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.7s ease' }}
        />
        <text x="50" y="44" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="serif">{score}</text>
        <text x="50" y="57" textAnchor="middle" fill="#64748b" fontSize="9">/100</text>
      </svg>
      <span style={{ color: col }} className="text-xs font-semibold">{lbl}</span>
    </div>
  )
}

// ── Platform card ─────────────────────────────────────────────────────────────
const PLATFORM_ICONS = {
  kdp:      BookOpen,
  ingram:   BookMarked,
  d2d:      Smartphone,
  standard: FileText,
  epub:     FileText,
}

function PlatformCard({ platform, selected, onClick }) {
  const Icon = PLATFORM_ICONS[platform.id] || FileText
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl border text-left transition-all ${
        selected
          ? 'border-gold-500/40 bg-gold-500/10'
          : 'border-axiom-border bg-axiom-surface2 hover:border-axiom-border-light'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? 'bg-gold-500/20' : 'bg-axiom-surface'}`}>
          <Icon className={`w-4 h-4 ${selected ? 'text-gold-400' : 'text-slate-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${selected ? 'text-gold-400' : 'text-slate-300'}`}>{platform.shortLabel}</p>
          <p className="text-xs text-slate-500 leading-snug mt-0.5">{platform.desc}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {platform.formats.map(f => (
              <span key={f} className="text-[9px] px-1.5 py-0.5 rounded bg-axiom-surface border border-axiom-border text-slate-600">{f}</span>
            ))}
          </div>
        </div>
        {selected && <ChevronRight className="w-4 h-4 text-gold-400 flex-shrink-0 mt-1" />}
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PublishingExport() {
  const { projectId } = useParams()
  const navigate      = useNavigate()

  const ms = useManuscript(projectId)

  const [selectedPlatform, setSelectedPlatform] = useState('kdp')
  const [authorName,       setAuthorName]       = useState('')
  const [readiness,        setReadiness]        = useState(null)
  const [exporting,        setExporting]        = useState(false)
  const [exportDone,       setExportDone]       = useState(false)
  const [exportError,      setExportError]      = useState(null)
  const [activeTab,        setActiveTab]        = useState('export') // export | check | specs

  // Run readiness check when project loads
  useEffect(() => {
    if (!ms.project || !ms.structure) return
    const result = runReadinessCheck({
      project:       ms.project,
      structure:     ms.structure,
      coverImageUrl: ms.project?.coverImageUrl,
    })
    setReadiness(result)
  }, [ms.project, ms.structure])

  // Auto-fill author name
  useEffect(() => {
    if (!authorName && ms.project?.authorName) setAuthorName(ms.project.authorName)
  }, [ms.project]) // eslint-disable-line

  async function handleExport() {
    setExporting(true)
    setExportError(null)
    setExportDone(false)
    try {
      await exportManuscript({
        project:    ms.project,
        structure:  ms.structure,
        projectId,
        platformId: selectedPlatform,
        authorName: authorName || ms.project?.authorName || '[AUTHOR NAME]',
      })
      setExportDone(true)
    } catch (err) {
      console.error('[export]', err)
      setExportError(err?.message || 'Export failed. Please try again.')
    }
    setExporting(false)
  }

  if (ms.loading) return <LoadingSpinner fullscreen />

  const platform    = PLATFORMS.find(p => p.id === selectedPlatform) || PLATFORMS[0]
  const passCount   = readiness?.checks.filter(c => c.status === 'pass').length || 0
  const failCount   = readiness?.checks.filter(c => c.status === 'fail').length || 0
  const warnCount   = readiness?.checks.filter(c => c.status === 'warn').length || 0

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-axiom-bg">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between h-12 px-4 bg-axiom-surface border-b border-axiom-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/projects/${projectId}`)} className="btn-icon">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-serif font-semibold text-slate-100 text-sm">Export for Publishing</span>
          <span className="text-xs text-slate-600 truncate max-w-[200px]">{ms.project?.title}</span>
        </div>
        {readiness && (
          <div className="flex items-center gap-3">
            {failCount > 0 && <span className="text-xs text-red-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />{failCount} issue{failCount > 1 ? 's' : ''}</span>}
            {warnCount > 0 && <span className="text-xs text-gold-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />{warnCount} warning{warnCount > 1 ? 's' : ''}</span>}
            {failCount === 0 && warnCount === 0 && <span className="text-xs text-teal-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Ready to export</span>}
          </div>
        )}
      </header>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-axiom-border bg-axiom-surface px-4 flex-shrink-0">
        {[['export', 'Export'], ['check', 'Readiness Check'], ['specs', 'Platform Specs']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === id ? 'border-gold-400 text-gold-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-6">

        {/* ── Export tab ──────────────────────────────────────────────────── */}
        {activeTab === 'export' && (
          <div className="max-w-2xl mx-auto space-y-6">

            {/* Readiness summary */}
            {readiness && (
              <div className="card p-5 flex items-center gap-6">
                <ScoreRing score={readiness.score} />
                <div className="flex-1">
                  <h2 className="font-serif text-base font-semibold text-slate-100 mb-1">
                    {readiness.score >= 85 ? 'Ready to publish' : readiness.score >= 60 ? 'Almost ready' : 'Needs attention'}
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {passCount} checks passed · {warnCount} warnings · {failCount} issues
                  </p>
                  <button
                    onClick={() => setActiveTab('check')}
                    className="text-[10px] text-gold-400 hover:text-gold-300 mt-1 flex items-center gap-1 transition-colors"
                  >
                    View full checklist <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Author name */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Author Name</label>
              <input
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                placeholder="Your name as it appears on the title page"
                className="input-base text-sm w-full"
              />
            </div>

            {/* Platform selector */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">Export Format</label>
              <div className="space-y-2">
                {PLATFORMS.map(p => (
                  <PlatformCard
                    key={p.id}
                    platform={p}
                    selected={selectedPlatform === p.id}
                    onClick={() => setSelectedPlatform(p.id)}
                  />
                ))}
              </div>
            </div>

            {/* Format details */}
            <div className="card p-4 space-y-2">
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Format Details</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-600">Font: </span><span className="text-slate-300">{platform.font}</span></div>
                <div><span className="text-slate-600">Size: </span><span className="text-slate-300">{platform.size / 2}pt</span></div>
                <div>
                  <span className="text-slate-600">Spacing: </span>
                  <span className="text-slate-300">
                    {platform.lineSpacing === 480 ? 'Double' : platform.lineSpacing === 360 ? '1.5×' : 'Single'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Margins: </span>
                  <span className="text-slate-300">{(platform.margins.top / 1440).toFixed(2)}" all</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-600 leading-relaxed mt-1">{platform.notes}</p>
            </div>

            {/* What's included */}
            <div className="card p-4 space-y-2">
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Included in Export</p>
              <div className="space-y-1.5">
                {[
                  'Title page with title, series, and author name',
                  'Copyright page (current year)',
                  'Dedication placeholder',
                  'All chapters with headings and scene breaks (⁕ ⁕ ⁕)',
                  '"About the Author" placeholder',
                  '"Also by" placeholder',
                  'Acknowledgments placeholder',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                    <CheckCircle2 className="w-3 h-3 text-teal-400 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Error */}
            {exportError && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">{exportError}</p>
              </div>
            )}

            {/* Export button */}
            {exportDone ? (
              <div className="flex flex-col items-center py-4 gap-2">
                <CheckCircle2 className="w-8 h-8 text-teal-400" />
                <p className="text-sm text-slate-200 font-medium">Download started!</p>
                <p className="text-xs text-slate-500">Check your downloads folder.</p>
                <button onClick={() => setExportDone(false)} className="btn-ghost text-xs mt-2">Export another format</button>
              </div>
            ) : (
              <button
                onClick={handleExport}
                disabled={exporting || failCount > 0}
                className={`w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 ${failCount > 0 ? 'cursor-not-allowed' : ''}`}
              >
                {exporting
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Exporting…</>
                  : <><Download className="w-4 h-4" />Export for {platform.shortLabel}</>}
              </button>
            )}
            {failCount > 0 && !exporting && (
              <p className="text-[10px] text-red-400 text-center">Fix {failCount} critical issue{failCount > 1 ? 's' : ''} before exporting.</p>
            )}
          </div>
        )}

        {/* ── Readiness check tab ──────────────────────────────────────────── */}
        {activeTab === 'check' && (
          <div className="max-w-xl mx-auto space-y-4">

            {readiness ? (
              <>
                {/* Score */}
                <div className="card p-6 flex justify-center">
                  <ScoreRing score={readiness.score} />
                </div>

                {/* Checklist */}
                <div className="card divide-y divide-axiom-border">
                  {readiness.checks.map(check => (
                    <div key={check.id} className="flex items-start gap-3 px-4 py-3.5">
                      <StatusIcon status={check.status} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${check.status === 'pass' ? 'text-slate-300' : check.status === 'warn' ? 'text-gold-300' : 'text-red-300'}`}>
                          {check.label}
                        </p>
                        {check.note && (
                          <p className="text-[10px] text-slate-600 leading-relaxed mt-0.5">{check.note}</p>
                        )}
                      </div>
                      {check.status === 'warn' && check.id === 'cover' && (
                        <button
                          onClick={() => navigate(`/projects/${projectId}/cover`)}
                          className="text-[10px] text-gold-400 hover:text-gold-300 transition-colors flex-shrink-0"
                        >
                          Open Cover Studio
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
              </div>
            )}
          </div>
        )}

        {/* ── Platform specs tab ──────────────────────────────────────────── */}
        {activeTab === 'specs' && (
          <div className="max-w-xl mx-auto space-y-4">
            {PLATFORMS.map(p => (
              <div key={p.id} className="card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  {React.createElement(PLATFORM_ICONS[p.id] || FileText, { className: 'w-4 h-4 text-gold-400' })}
                  <h3 className="font-serif font-semibold text-slate-100 text-sm">{p.label}</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-600">Font: </span><span className="text-slate-300">{p.font}</span></div>
                  <div><span className="text-slate-600">Point size: </span><span className="text-slate-300">{p.size / 2}pt</span></div>
                  <div>
                    <span className="text-slate-600">Line spacing: </span>
                    <span className="text-slate-300">
                      {p.lineSpacing === 480 ? 'Double (standard manuscript)' : p.lineSpacing === 360 ? '1.5× (trade print)' : 'Single (ebook)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600">Margins: </span>
                    <span className="text-slate-300">
                      T:{(p.margins.top/1440).toFixed(2)}" B:{(p.margins.bottom/1440).toFixed(2)}" I:{(p.margins.left/1440).toFixed(2)}" O:{(p.margins.right/1440).toFixed(2)}"
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {p.trimSizes.map(t => (
                    <span key={t} className="text-[9px] px-2 py-0.5 rounded-full bg-axiom-surface2 border border-axiom-border text-slate-500">{t}</span>
                  ))}
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed border-t border-axiom-border pt-2">{p.notes}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
