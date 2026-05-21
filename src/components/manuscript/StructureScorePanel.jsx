import React from 'react'
import { X, Loader2 } from 'lucide-react'
import { CHECK_LABELS, CHECK_DESCRIPTIONS } from '../../lib/devEditEngine'

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
  onClose,
  style,
}) {
  const cfg = scoreConfig(healthScore)
  const lastLabel = timeAgo(lastScanAt)

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

      {/* What's checked — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">
          What's analyzed
        </p>
        <div className="space-y-3">
          {Object.entries(CHECK_LABELS).map(([key, label]) => (
            <div key={key} className="flex gap-2.5">
              <div className="w-0.5 flex-shrink-0 rounded-full bg-axiom-border mt-1" />
              <div>
                <p className="text-xs text-slate-300 font-medium leading-tight">{label}</p>
                <p className="text-[10px] text-slate-600 leading-relaxed mt-0.5">{CHECK_DESCRIPTIONS[key]}</p>
              </div>
            </div>
          ))}
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
