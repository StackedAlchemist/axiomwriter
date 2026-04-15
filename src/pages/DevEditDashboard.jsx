import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Activity, Eye, Globe, RotateCcw, UserCheck, AlignLeft, MessageSquare,
  Play, Download, AlertTriangle, Info, CheckCircle2, Loader2,
} from 'lucide-react'
import { useManuscript } from '../hooks/useManuscript'
import { useDevEdit } from '../hooks/useDevEdit'
import { CHECK_LABELS, CHECK_DESCRIPTIONS, ALL_CHECK_TYPES } from '../lib/devEditEngine'
import LoadingSpinner from '../components/common/LoadingSpinner'

// ── Icon map ──────────────────────────────────────────────────────────────────
const CHECK_ICONS = {
  pacing:              Activity,
  pov_consistency:     Eye,
  world_terms:         Globe,
  flashback:           RotateCcw,
  character_grounding: UserCheck,
  show_vs_tell:        AlignLeft,
  dialogue_balance:    MessageSquare,
}

// ── Health ring SVG ───────────────────────────────────────────────────────────
function HealthRing({ score }) {
  const r             = 44
  const circumference = 2 * Math.PI * r
  const offset        = circumference - (score / 100) * circumference
  const color         = score >= 85 ? '#2dd4bf' : score >= 60 ? '#f59e0b' : '#ef4444'
  const label         = score >= 85 ? 'Strong' : score >= 60 ? 'Fair' : 'Needs work'

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 100 100" className="w-28 h-28">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8"
          stroke="currentColor" className="text-axiom-surface2" />
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.7s ease' }}
        />
        <text x="50" y="44" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="serif">
          {score}
        </text>
        <text x="50" y="58" textAnchor="middle" fill="#64748b" fontSize="9">
          / 100
        </text>
      </svg>
      <span style={{ color }} className="text-xs font-semibold">{label}</span>
    </div>
  )
}

// ── Export helper ─────────────────────────────────────────────────────────────
function exportReport(project, scanHistory, settings) {
  const latest = scanHistory[0]
  const title  = project?.title || 'Manuscript'
  const html   = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Structural Report — ${title}</title>
<style>
  body { font-family: Georgia, serif; max-width: 700px; margin: 48px auto; color: #1a202c; line-height: 1.7; }
  h1   { font-size: 26px; margin-bottom: 4px; }
  .sub { color: #718096; font-size: 13px; margin-bottom: 32px; }
  .score-block { display: flex; align-items: baseline; gap: 8px; margin: 16px 0; }
  .score { font-size: 52px; font-weight: bold; color: ${(latest?.healthScore ?? 100) >= 85 ? '#276749' : (latest?.healthScore ?? 100) >= 60 ? '#975a16' : '#c53030'}; }
  h2   { font-size: 15px; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 36px; text-transform: uppercase; letter-spacing: 0.08em; color: #4a5568; }
  .finding { border-left: 3px solid #cbd5e0; padding: 10px 16px; margin: 14px 0; background: #f7fafc; }
  .finding.warning { border-color: #fc8181; }
  .finding.info    { border-color: #f6ad55; }
  .badge { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.06em; color: #718096; margin-bottom: 4px; }
  .msg  { font-size: 15px; font-weight: 500; margin: 4px 0; }
  .sug  { font-size: 13px; color: #4a5568; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>
<h1>${title}</h1>
<p class="sub">Structural Report · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · Sensitivity: ${settings.sensitivity}</p>
${latest ? `
<div class="score-block">
  <span class="score">${latest.healthScore ?? 100}</span>
  <span style="color:#718096;font-size:16px;">/100 Structural Health Score</span>
</div>
<p style="color:#718096;font-size:13px;">${(latest.findings || []).length} issue${(latest.findings || []).length !== 1 ? 's' : ''} found · ${(latest.totalWords || 0).toLocaleString()} words scanned</p>
` : '<p>No scans completed yet.</p>'}
${(latest?.findings || []).length > 0
  ? `<h2>Findings</h2>${(latest.findings || []).map(f => `
<div class="finding ${f.severity}">
  <div class="badge">${CHECK_LABELS[f.type] || f.type}</div>
  <div class="msg">${f.message}</div>
  <div class="sug">${f.suggestion}</div>
</div>`).join('')}`
  : latest ? '<p style="color:#276749;font-weight:500;">✓ No structural issues detected in the latest scan.</p>' : ''}
${settings.disabledChecks?.length ? `<h2>Disabled Checks</h2><ul>${settings.disabledChecks.map(ct => `<li>${CHECK_LABELS[ct] || ct}</li>`).join('')}</ul>` : ''}
${scanHistory.length > 1 ? `<h2>Scan History</h2><ul>${scanHistory.map(s => `<li>${s.scannedAt?.toDate?.()?.toLocaleDateString?.() || s.scannedAt?.toLocaleDateString?.() || 'Unknown'} — Score: ${s.healthScore ?? 100}/100 (${(s.findings || []).length} findings)</li>`).join('')}</ul>` : ''}
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `structural-report-${title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.html`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Dashboard page ─────────────────────────────────────────────────────────────
export default function DevEditDashboard() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const ms = useManuscript(projectId)

  const {
    scanHistory, healthScore, isScanning, lastScanAt,
    settings, updateSettings, runManualScan, enableCheckType, neverCheckType,
  } = useDevEdit(projectId)

  const [activeTab, setActiveTab] = useState('overview')

  if (ms.loading) return <LoadingSpinner fullscreen />

  const latest   = scanHistory[0] ?? null
  const SENS     = [
    { value: 'strict',   label: 'Strict',   desc: 'Flags subtle issues' },
    { value: 'balanced', label: 'Balanced', desc: 'Recommended' },
    { value: 'light',    label: 'Light',    desc: 'Only clear problems' },
  ]
  const MIN_WORDS = [2000, 5000, 10000, 20000]

  return (
    <div className="min-h-screen bg-axiom-bg flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between h-12 px-4 bg-axiom-surface border-b border-axiom-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/projects/${projectId}`)} className="btn-icon">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-serif font-semibold text-slate-100 text-sm">Structural Editor</span>
          {healthScore != null && (
            <span className={`text-xs font-semibold ${healthScore >= 85 ? 'text-teal-400' : healthScore >= 60 ? 'text-gold-400' : 'text-red-400'}`}>
              {healthScore}/100
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportReport(ms.project, scanHistory, settings)}
            disabled={scanHistory.length === 0}
            className="btn-ghost text-xs flex items-center gap-1.5 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Export Report
          </button>
          <button
            onClick={() => runManualScan(ms.structure)}
            disabled={isScanning}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            {isScanning
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Scanning…</>
              : <><Play className="w-3.5 h-3.5" />Run Scan</>}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-axiom-border bg-axiom-surface px-4 flex-shrink-0">
        {[['overview', 'Overview'], ['history', 'Scan History'], ['settings', 'Settings']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-gold-400 text-gold-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-6">

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="max-w-2xl mx-auto space-y-8">

            {/* Health card */}
            <div className="card p-6 flex items-center gap-8">
              <HealthRing score={healthScore ?? 100} />
              <div className="flex-1 min-w-0">
                <h2 className="font-serif text-lg font-semibold text-slate-100 mb-1">
                  {healthScore == null
                    ? 'No scan yet'
                    : healthScore >= 85 ? 'Strong structure'
                    : healthScore >= 60 ? 'Some issues to review'
                    : 'Structure needs attention'}
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed mb-2">
                  {healthScore == null
                    ? 'Run your first structural scan to see this manuscript\'s health score.'
                    : `${(latest?.findings || []).length} issue${(latest?.findings || []).length !== 1 ? 's' : ''} found across ${(latest?.totalWords || 0).toLocaleString()} words.`}
                </p>
                {lastScanAt && (
                  <p className="text-[11px] text-slate-600">
                    Last scanned {lastScanAt.toLocaleDateString()} at {lastScanAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>

            {/* Latest findings */}
            {(latest?.findings || []).length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Latest Findings</h3>
                {(latest.findings || []).map((f, i) => {
                  const Icon = CHECK_ICONS[f.type] || Activity
                  return (
                    <div key={i} className={`card p-4 border-l-2 ${f.severity === 'warning' ? 'border-red-500/50' : 'border-gold-500/30'}`}>
                      <div className="flex items-start gap-3">
                        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${f.severity === 'warning' ? 'text-red-400' : 'text-gold-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                            {CHECK_LABELS[f.type] || f.type}
                          </p>
                          <p className="text-sm text-slate-200 leading-snug mb-1.5">{f.message}</p>
                          <p className="text-xs text-slate-500 leading-relaxed">{f.suggestion}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {(latest?.findings || []).length === 0 && healthScore != null && (
              <div className="card p-8 flex flex-col items-center text-center">
                <CheckCircle2 className="w-10 h-10 text-teal-400 mb-3" />
                <p className="font-serif text-lg text-slate-200 mb-1">No structural issues found</p>
                <p className="text-sm text-slate-500 max-w-xs">Your manuscript structure looks solid. Keep writing!</p>
              </div>
            )}

            {/* Disabled checks */}
            {(settings.disabledChecks || []).length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Disabled Checks</h3>
                <div className="card divide-y divide-axiom-border">
                  {(settings.disabledChecks || []).map(ct => (
                    <div key={ct} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-slate-500">{CHECK_LABELS[ct] || ct}</span>
                      <button
                        onClick={() => enableCheckType(ct)}
                        className="text-xs text-gold-400 hover:text-gold-300 transition-colors"
                      >
                        Re-enable
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Scan History ──────────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="max-w-2xl mx-auto space-y-4">
            {scanHistory.length === 0 ? (
              <div className="card p-8 flex flex-col items-center text-center">
                <Activity className="w-10 h-10 text-slate-600 mb-3" />
                <p className="text-slate-400 font-medium">No scan history yet</p>
                <p className="text-xs text-slate-600 mt-1">Scans run automatically every 3 scenes saved, or manually above.</p>
              </div>
            ) : (
              scanHistory.map(scan => {
                const date = scan.scannedAt?.toDate?.()?.toLocaleDateString?.()
                          ?? scan.scannedAt?.toLocaleDateString?.()
                          ?? 'Unknown date'
                const score = scan.healthScore ?? 100
                return (
                  <div key={scan.id} className="card p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-slate-200">{date}</p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {(scan.totalWords || 0).toLocaleString()} words · {scan.sensitivity || 'balanced'}
                        </p>
                      </div>
                      <span className={`text-2xl font-bold font-serif ${score >= 85 ? 'text-teal-400' : score >= 60 ? 'text-gold-400' : 'text-red-400'}`}>
                        {score}<span className="text-xs text-slate-600 font-normal">/100</span>
                      </span>
                    </div>
                    {(scan.findings || []).length > 0 ? (
                      <div className="space-y-1.5">
                        {(scan.findings || []).map((f, j) => (
                          <div key={j} className="flex items-start gap-2 text-xs text-slate-500">
                            {f.severity === 'warning'
                              ? <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                              : <Info className="w-3 h-3 text-gold-400 flex-shrink-0 mt-0.5" />}
                            <span className="truncate">{f.message}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-teal-400">No issues found</p>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── Settings ──────────────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="max-w-lg mx-auto space-y-8">

            {/* Sensitivity */}
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-300 mb-0.5">Sensitivity</p>
                <p className="text-xs text-slate-600">Controls how readily issues are flagged.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {SENS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateSettings({ ...settings, sensitivity: opt.value })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      settings.sensitivity === opt.value
                        ? 'border-gold-500/40 bg-gold-500/10'
                        : 'border-axiom-border bg-axiom-surface2 hover:border-axiom-border-light'
                    }`}
                  >
                    <p className={`text-xs font-semibold mb-0.5 ${settings.sensitivity === opt.value ? 'text-gold-400' : 'text-slate-300'}`}>
                      {opt.label}
                    </p>
                    <p className="text-[10px] text-slate-600">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Minimum word count */}
            <div className="space-y-2">
              <div>
                <p className="text-sm font-semibold text-slate-300 mb-0.5">Minimum Word Count</p>
                <p className="text-xs text-slate-600">Checks won't run until the manuscript reaches this length.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {MIN_WORDS.map(val => (
                  <button
                    key={val}
                    onClick={() => updateSettings({ ...settings, minWords: val })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      settings.minWords === val
                        ? 'border-gold-500/40 bg-gold-500/10 text-gold-400'
                        : 'border-axiom-border text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {val.toLocaleString()} words
                  </button>
                ))}
              </div>
            </div>

            {/* Check toggles */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-300">Check Types</p>
              <div className="card divide-y divide-axiom-border">
                {ALL_CHECK_TYPES.map(ct => {
                  const Icon     = CHECK_ICONS[ct] || Activity
                  const disabled = (settings.disabledChecks || []).includes(ct)
                  return (
                    <div key={ct} className="flex items-start gap-3 px-4 py-3.5">
                      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${disabled ? 'text-slate-700' : 'text-slate-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${disabled ? 'text-slate-600' : 'text-slate-300'}`}>
                          {CHECK_LABELS[ct]}
                        </p>
                        <p className="text-[10px] text-slate-700 leading-relaxed mt-0.5">{CHECK_DESCRIPTIONS[ct]}</p>
                      </div>
                      {/* Toggle */}
                      <button
                        onClick={() => disabled ? enableCheckType(ct) : neverCheckType(ct)}
                        className={`flex-shrink-0 relative w-9 h-5 rounded-full border transition-all ${
                          disabled
                            ? 'border-slate-700 bg-axiom-surface2'
                            : 'border-teal-500/50 bg-teal-500/20'
                        }`}
                        title={disabled ? 'Enable' : 'Disable'}
                      >
                        <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full transition-all ${
                          disabled ? 'left-[2px] bg-slate-600' : 'left-[20px] bg-teal-400'
                        }`} />
                      </button>
                    </div>
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
