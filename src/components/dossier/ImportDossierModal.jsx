/**
 * ImportDossierModal
 *
 * 3-step modal:
 *   Step 1 — Choose dossier type + drop / pick HTML file
 *   Step 2 — Preview parsed structure, edit title
 *   Step 3 — Saving / success
 */

import React, { useState, useRef, useCallback } from 'react'
import {
  X, Upload, FileText, User, Users, MapPin, Zap,
  ChevronRight, CheckCircle, Loader2, Eye, List,
  AlertTriangle,
} from 'lucide-react'
import { parseDossierHtml, DOSSIER_TYPES } from '../../parsers/dossierParser'

const TYPE_ICONS = { user: User, users: Users, 'map-pin': MapPin, zap: Zap }

// ── Step indicators ───────────────────────────────────────────────────────────
function StepBar({ step }) {
  const steps = ['Choose type', 'Preview', 'Import']
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => {
        const idx   = i + 1
        const done  = step > idx
        const active = step === idx
        return (
          <React.Fragment key={label}>
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{
                  background: done
                    ? 'rgba(201,168,76,1)'
                    : active
                      ? 'rgba(201,168,76,0.2)'
                      : 'rgba(255,255,255,0.05)',
                  border: done || active
                    ? '1px solid rgba(201,168,76,0.6)'
                    : '1px solid rgba(255,255,255,0.08)',
                  color: done ? '#060812' : active ? 'rgba(201,168,76,1)' : 'rgba(255,255,255,0.3)',
                }}
              >
                {done ? '✓' : idx}
              </div>
              <span
                className="text-[11px] font-medium whitespace-nowrap"
                style={{ color: active ? 'rgba(201,168,76,0.9)' : 'rgba(255,255,255,0.3)' }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 mx-2"
                style={{ height: 1, minWidth: 16, background: 'rgba(255,255,255,0.07)' }}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ── Step 1 — Type selector + file drop ───────────────────────────────────────
function StepChoose({ selectedType, onTypeSelect, onFilePicked, error }) {
  const inputRef   = useRef(null)
  const [dragging, setDragging] = useState(false)

  function readFile(file) {
    if (!file) return
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      alert('Please select an HTML file (.html or .htm)')
      return
    }
    const reader = new FileReader()
    reader.onload = e => onFilePicked(e.target.result, file.name)
    reader.readAsText(file)
  }

  const onDrop = useCallback(e => {
    e.preventDefault()
    setDragging(false)
    readFile(e.dataTransfer.files[0])
  }, []) // eslint-disable-line

  return (
    <div className="space-y-5">
      {/* Type grid */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Dossier type
        </p>
        <div className="grid grid-cols-2 gap-2">
          {DOSSIER_TYPES.map(t => {
            const Icon = TYPE_ICONS[t.icon] ?? FileText
            const active = selectedType === t.type
            return (
              <button
                key={t.type}
                disabled={t.soon}
                onClick={() => onTypeSelect(t.type)}
                className="relative text-left p-3 rounded-xl transition-all duration-150"
                style={{
                  background: active
                    ? 'rgba(201,168,76,0.1)'
                    : t.soon
                      ? 'rgba(255,255,255,0.02)'
                      : 'rgba(255,255,255,0.04)',
                  border: active
                    ? '1px solid rgba(201,168,76,0.4)'
                    : '1px solid rgba(255,255,255,0.07)',
                  opacity: t.soon ? 0.45 : 1,
                  cursor: t.soon ? 'not-allowed' : 'pointer',
                }}
              >
                {t.soon && (
                  <span
                    className="absolute top-2 right-2 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(201,168,76,0.1)', color: 'rgba(201,168,76,0.6)', border: '1px solid rgba(201,168,76,0.15)' }}
                  >
                    Soon
                  </span>
                )}
                <Icon className="w-4 h-4 mb-1.5" style={{ color: active ? 'rgba(201,168,76,1)' : 'rgba(255,255,255,0.4)' }} />
                <p className="text-xs font-semibold text-slate-200">{t.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{t.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Drop zone */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
          HTML dossier file
        </p>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center py-8 gap-2"
          style={{
            borderColor: dragging ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.1)',
            background: dragging ? 'rgba(201,168,76,0.04)' : 'rgba(255,255,255,0.02)',
          }}
        >
          <Upload className="w-7 h-7" style={{ color: dragging ? 'rgba(201,168,76,0.8)' : 'rgba(255,255,255,0.2)' }} />
          <p className="text-sm font-medium text-slate-300">Drop your HTML dossier here</p>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>or click to browse — .html / .htm</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".html,.htm"
          className="hidden"
          onChange={e => readFile(e.target.files[0])}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}

// ── Step 2 — Preview parsed data ──────────────────────────────────────────────
function StepPreview({ parsed, title, onTitleChange }) {
  const [previewMode, setPreviewMode] = useState('structured') // 'structured' | 'artifact'

  const hasIdentity     = Object.values(parsed.identity ?? {}).some(Boolean)
  const hasMeta         = Object.keys(parsed.statusMeta ?? {}).length > 0
  const hasSections     = (parsed.sections ?? []).length > 0
  const hasStats        = (parsed.statBlocks ?? []).length > 0
  const hasEquipment    = (parsed.equipment ?? []).length > 0
  const hasRelationships = (parsed.relationships ?? []).length > 0

  return (
    <div className="space-y-4">
      {/* Title edit */}
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-widest block mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Dossier title
        </label>
        <input
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-100"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
      </div>

      {/* Preview toggle */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {[['structured', List, 'Structured'], ['artifact', Eye, 'Artifact']].map(([mode, Icon, label]) => (
          <button
            key={mode}
            onClick={() => setPreviewMode(mode)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all"
            style={{
              background: previewMode === mode ? 'rgba(201,168,76,0.15)' : 'transparent',
              color: previewMode === mode ? 'rgba(201,168,76,0.9)' : 'rgba(255,255,255,0.4)',
              border: previewMode === mode ? '1px solid rgba(201,168,76,0.25)' : '1px solid transparent',
            }}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Structured preview */}
      {previewMode === 'structured' && (
        <div className="rounded-xl overflow-hidden text-xs space-y-0" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <ParsedSection icon="🪪" label="Identity" count={Object.values(parsed.identity ?? {}).filter(Boolean).length}>
            {hasIdentity ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {Object.entries(parsed.identity).map(([k, v]) => v ? (
                  <div key={k}>
                    <span className="text-[10px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>{k}: </span>
                    <span className="text-slate-300">{v}</span>
                  </div>
                ) : null)}
              </div>
            ) : <NoData />}
          </ParsedSection>

          <ParsedSection icon="📋" label="Status Metadata" count={Object.keys(parsed.statusMeta ?? {}).length}>
            {hasMeta ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {Object.entries(parsed.statusMeta).slice(0, 8).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-[10px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>{k}: </span>
                    <span className="text-slate-300">{v}</span>
                  </div>
                ))}
              </div>
            ) : <NoData />}
          </ParsedSection>

          <ParsedSection icon="📝" label="Narrative Sections" count={parsed.sections?.length ?? 0}>
            {hasSections ? (
              <div className="space-y-1">
                {parsed.sections.map(s => (
                  <div key={s.id} className="flex items-baseline gap-2">
                    <span className="text-gold-400 font-medium">{s.heading}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>— {s.body.slice(0, 60)}{s.body.length > 60 ? '…' : ''}</span>
                  </div>
                ))}
              </div>
            ) : <NoData />}
          </ParsedSection>

          <ParsedSection icon="📊" label="Stat Blocks" count={parsed.statBlocks?.reduce((a, b) => a + b.stats.length, 0) ?? 0}>
            {hasStats ? (
              <div className="space-y-2">
                {parsed.statBlocks.map((block, i) => (
                  <div key={i}>
                    {block.groupTitle && <p className="text-gold-400 font-medium mb-1">{block.groupTitle}</p>}
                    <div className="grid grid-cols-3 gap-1">
                      {block.stats.slice(0, 6).map((s, j) => (
                        <div key={j} className="text-[10px]">
                          <span style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}: </span>
                          <span className="text-slate-300">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : <NoData />}
          </ParsedSection>

          <ParsedSection icon="⚔️" label="Equipment & Cyberware" count={parsed.equipment?.reduce((a, b) => a + b.items.length, 0) ?? 0}>
            {hasEquipment ? (
              <div className="space-y-1">
                {parsed.equipment.map((cat, i) => (
                  <div key={i}>
                    <span className="text-gold-400 font-medium">{cat.category}: </span>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{cat.items.slice(0, 3).map(it => it.name).join(', ')}{cat.items.length > 3 ? ` +${cat.items.length - 3} more` : ''}</span>
                  </div>
                ))}
              </div>
            ) : <NoData />}
          </ParsedSection>

          <ParsedSection icon="🤝" label="Relationships" count={parsed.relationships?.length ?? 0} last>
            {hasRelationships ? (
              <div className="space-y-1">
                {parsed.relationships.slice(0, 4).map((r, i) => (
                  <div key={i}>
                    <span className="text-slate-300">{r.name}</span>
                    {r.role && <span style={{ color: 'rgba(255,255,255,0.35)' }}> — {r.role}</span>}
                  </div>
                ))}
                {parsed.relationships.length > 4 && (
                  <p style={{ color: 'rgba(255,255,255,0.3)' }}>+{parsed.relationships.length - 4} more</p>
                )}
              </div>
            ) : <NoData />}
          </ParsedSection>
        </div>
      )}

      {/* Artifact preview */}
      {previewMode === 'artifact' && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', height: 300 }}>
          <iframe
            srcDoc={parsed.rawHtml}
            title="Dossier artifact preview"
            className="w-full h-full"
            sandbox="allow-same-origin"
          />
        </div>
      )}
    </div>
  )
}

function ParsedSection({ icon, label, count, children, last }) {
  return (
    <div
      className="px-3 py-2.5"
      style={{ borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span>{icon}</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
        </div>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded"
          style={{
            background: count > 0 ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.04)',
            color: count > 0 ? 'rgba(201,168,76,0.8)' : 'rgba(255,255,255,0.2)',
          }}
        >
          {count} found
        </span>
      </div>
      {children}
    </div>
  )
}

function NoData() {
  return <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Not detected — can be edited after import</p>
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function ImportDossierModal({ onClose, onImported }) {
  const [step,         setStep]         = useState(1)
  const [selectedType, setSelectedType] = useState('character_dossier')
  const [parsed,       setParsed]       = useState(null)
  const [title,        setTitle]        = useState('')
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')

  function handleFilePicked(htmlString, fileName) {
    try {
      const result = parseDossierHtml(htmlString, fileName)
      setParsed(result)
      setTitle(result.title || fileName.replace(/\.[^.]+$/, ''))
      setStep(2)
    } catch (err) {
      setError(`Parse error: ${err.message}`)
    }
  }

  async function handleImport() {
    if (!parsed) return
    setSaving(true)
    setStep(3)
    try {
      await onImported({ ...parsed, type: selectedType, title })
    } catch (err) {
      setError(err.message)
      setStep(2)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[3px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl overflow-hidden animate-slide-up"
        style={{
          background: 'rgba(8,10,22,0.97)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Import Dossier / Lore File</h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              HTML document → Axiom structured record
            </p>
          </div>
          <button onClick={onClose} className="btn-icon w-7 h-7">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step bar */}
        <div
          className="px-5 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <StepBar step={step} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <StepChoose
              selectedType={selectedType}
              onTypeSelect={setSelectedType}
              onFilePicked={handleFilePicked}
              error={error}
            />
          )}
          {step === 2 && parsed && (
            <StepPreview
              parsed={parsed}
              title={title}
              onTitleChange={setTitle}
            />
          )}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              {saving ? (
                <>
                  <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
                  <p className="text-sm text-slate-300">Saving dossier…</p>
                </>
              ) : (
                <>
                  <CheckCircle className="w-8 h-8 text-teal-400" />
                  <p className="text-sm font-semibold text-slate-200">Dossier imported</p>
                  <button onClick={onClose} className="btn-primary text-sm mt-2">Open dossier</button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {step !== 3 && (
          <div
            className="flex items-center justify-between px-5 py-3 flex-shrink-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <button
              onClick={step === 1 ? onClose : () => setStep(s => s - 1)}
              className="btn-ghost text-sm"
            >
              {step === 1 ? 'Cancel' : '← Back'}
            </button>

            {step === 2 && (
              <button
                onClick={handleImport}
                disabled={!title.trim()}
                className="btn-primary text-sm"
              >
                Import dossier
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
