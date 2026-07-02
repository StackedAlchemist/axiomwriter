import React, { useState } from 'react'
import { X, Loader2, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { CHECK_LABELS, CHECK_DESCRIPTIONS } from '../../lib/devEditEngine'

const SEVERITY_DOT = {
  warning: 'bg-gold-400',
  info:    'bg-sky-400',
  error:   'bg-red-400',
}

function timeAgo(date) {
  if (!date) return null
  const diff = (Date.now() - date.getTime()) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function scoreConfig(score) {
  if (score == null) return null
  if (score >= 85) return { label: 'Strong',           color: 'text-teal-400', bg: 'bg-teal-500/10',   border: 'border-teal-500/20'  }
  if (score >= 60) return { label: 'Needs Attention',  color: 'text-gold-400', bg: 'bg-gold-500/10',   border: 'border-gold-500/20'  }
  return               { label: 'Critical Issues',  color: 'text-red-400',  bg: 'bg-red-500/10',    border: 'border-red-500/20'   }
}

export default function StructureScorePanel({
  healthScore,
  isScanning,
  suggestions,
  lastScanAt,
  onRunScan,
  onOpenFinding,
  onClose,
  style,
}) {
  const cfg = scoreConfig(healthScore)
  const lastLabel = timeAgo(lastScanAt)
  const hasScan = healthScore != null
  const [expanded, setExpanded] = useState(null) // check type whose findings are open

  // Group active findings by check type
  const findingsByType = {}
  ;(suggestions || []).forEach(f => {
    if (!findingsByType[f.type]) findingsByType[f.type] = []
    findingsByType[f.type].push(f)
  })
  const issueTypeCount = Object.keys(findingsByType).length

  return (
    <div
      className="fixed z-[300] shadow-2xl flex flex-col max-h-[calc(100vh-60px)] overflow-hidden"
      style={{
        width: '320px',
        background: 'rgba(8,10,24,0.98)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        ...style,
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-axiom-border flex-shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Structural Health</h3>
          <p className="text-[10px] text-slate-600">AI manuscript analysis</p>
        </div>
        <button onClick={onClose} className="btn-icon w-6 h-6">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Score */}
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        {cfg ? (
          <div className={`flex items-center gap-4 px-3 py-3 rounded-lg ${cfg.bg} border ${cfg.border}`}>
            <div className={`text-4xl font-bold font-serif leading-none ${cfg.color}`}>
              {healthScore}
              <span className="text-sm text-slate-600 font-sans font-normal">/100</span>
            </div>
            <div>
              <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
              {lastLabel && <p className="text-[10px] text-slate-600">Scanned {lastLabel}</p>}
              {suggestions?.length > 0 && (
                <p className="text-[10px] text-slate-500">{suggestions.length} active finding{suggestions.length !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="px-3 py-3 rounded-lg bg-axiom-surface2 border border-axiom-border text-center">
            <p className="text-xs text-slate-400 mb-0.5">No scan run yet</p>
            <p className="text-[10px] text-slate-700">Run a scan to analyze your manuscript structure.</p>
          </div>
        )}

        {/* Score legend */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
            <span className="text-[10px] text-slate-600">85–100 Strong</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 flex-shrink-0" />
            <span className="text-[10px] text-slate-600">60–84 Needs Attention</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
            <span className="text-[10px] text-slate-600">&lt;60 Critical</span>
          </div>
        </div>
      </div>

      {/* Results — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-1">
          {hasScan ? 'Results by check' : "What's analyzed"}
        </p>
        {hasScan && (
          <p className="text-[10px] text-slate-600 leading-relaxed mb-3">
            Score starts at 100 and drops 12 points for each check that finds issues
            {issueTypeCount > 0 ? ` — ${issueTypeCount} check${issueTypeCount !== 1 ? 's' : ''} flagged something below.` : '.'}
            {' '}Tap a finding to see where it is and how to fix it.
          </p>
        )}
        <div className="space-y-2">
          {Object.entries(CHECK_LABELS).map(([key, label]) => {
            const found  = findingsByType[key] || []
            const isOpen = expanded === key
            return (
              <div key={key} className={`rounded-lg border ${found.length ? 'border-gold-500/20 bg-gold-500/5' : 'border-axiom-border'}`}>
                <button
                  onClick={() => setExpanded(isOpen ? null : key)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-left"
                >
                  {hasScan ? (
                    found.length ? (
                      <span className="text-[10px] font-bold text-gold-400 bg-gold-500/15 rounded-full w-[18px] h-[18px] flex-shrink-0 flex items-center justify-center">
                        {found.length}
                      </span>
                    ) : (
                      <Check className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                    )
                  ) : (
                    <div className="w-0.5 h-3.5 flex-shrink-0 rounded-full bg-axiom-border" />
                  )}
                  <span className={`text-xs font-medium leading-tight flex-1 ${found.length ? 'text-slate-200' : 'text-slate-400'}`}>
                    {label}
                  </span>
                  {hasScan && !found.length && <span className="text-[9px] text-teal-600">Clear</span>}
                  {isOpen ? <ChevronDown className="w-3 h-3 text-slate-600" /> : <ChevronRight className="w-3 h-3 text-slate-700" />}
                </button>

                {isOpen && (
                  <div className="px-2.5 pb-2.5 space-y-1.5">
                    <p className="text-[10px] text-slate-600 leading-relaxed">{CHECK_DESCRIPTIONS[key]}</p>
                    {found.map(f => (
                      <button
                        key={f.id}
                        onClick={() => onOpenFinding?.(f)}
                        className="w-full flex items-start gap-2 px-2 py-1.5 rounded-md bg-axiom-surface2/60 hover:bg-axiom-surface2 border border-transparent hover:border-gold-500/20 text-left transition-colors"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${SEVERITY_DOT[f.severity] || 'bg-slate-500'}`} />
                        <span className="text-[11px] text-slate-300 leading-snug">{f.message}</span>
                      </button>
                    ))}
                    {hasScan && !found.length && (
                      <p className="text-[10px] text-teal-600/80">No issues found by this check.</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Run scan */}
      <div className="px-4 py-3 border-t border-axiom-border flex-shrink-0">
        <button
          onClick={onRunScan}
          disabled={isScanning}
          className="w-full py-2 rounded-lg text-xs font-semibold transition-all bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 border border-gold-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isScanning
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning…</>
            : 'Run Fresh Scan'}
        </button>
        <p className="text-[10px] text-slate-700 text-center mt-2">Requires 5,000+ words in manuscript</p>
      </div>
    </div>
  )
}
