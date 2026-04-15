/**
 * DossierViewer
 *
 * Full-panel viewer for a parsed dossier document.
 * Two tabs:
 *   Structured — clean Axiom-styled layout of all parsed fields
 *   Artifact   — sandboxed iframe showing the original HTML
 */

import React, { useState, useMemo } from 'react'
import {
  List, Eye, User, Globe, Sword, Cpu, Heart,
  Users, ChevronDown, ChevronRight, FileText,
} from 'lucide-react'

// ── Small reusable pieces ─────────────────────────────────────────────────────

function TabBar({ active, onChange }) {
  return (
    <div
      className="flex gap-1 p-1 rounded-lg flex-shrink-0"
      style={{ background: 'rgba(255,255,255,0.04)', width: 'fit-content' }}
    >
      {[['structured', List, 'Structured'], ['artifact', Eye, 'Original Artifact']].map(([id, Icon, label]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
          style={{
            background: active === id ? 'rgba(201,168,76,0.15)' : 'transparent',
            color:      active === id ? 'rgba(201,168,76,0.9)'  : 'rgba(255,255,255,0.4)',
            border:     active === id ? '1px solid rgba(201,168,76,0.25)' : '1px solid transparent',
          }}
        >
          <Icon className="w-3 h-3" />
          {label}
        </button>
      ))}
    </div>
  )
}

function SectionCard({ icon: Icon, title, accentRgb = '201,168,76', children }) {
  const [open, setOpen] = useState(true)
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
    >
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-2.5 px-4 py-3 transition-colors text-left"
        style={{ borderBottom: open ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: `rgba(${accentRgb},0.12)`, border: `1px solid rgba(${accentRgb},0.2)` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: `rgba(${accentRgb},1)` }} />
        </div>
        <span className="text-xs font-semibold flex-1" style={{ color: 'rgba(255,255,255,0.75)' }}>{title}</span>
        {open
          ? <ChevronDown className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
          : <ChevronRight className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
        }
      </button>
      {open && <div className="px-4 py-3">{children}</div>}
    </div>
  )
}

function KVGrid({ data, cols = 2 }) {
  const entries = Object.entries(data).filter(([, v]) => v)
  if (entries.length === 0) return <EmptyField />
  return (
    <div className={`grid gap-x-6 gap-y-2`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {entries.map(([k, v]) => (
        <div key={k}>
          <p className="text-[9px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{k}</p>
          <p className="text-xs text-slate-300 leading-snug">{v}</p>
        </div>
      ))}
    </div>
  )
}

function StatRow({ stats }) {
  return (
    <div className="flex flex-wrap gap-2">
      {stats.map((s, i) => (
        <div
          key={i}
          className="px-2.5 py-1.5 rounded-lg text-center min-w-[56px]"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-base font-bold text-gold-400 leading-none">{s.value}</p>
          <p className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</p>
        </div>
      ))}
    </div>
  )
}

function NarrativeSection({ section }) {
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-widest mb-1.5"
        style={{ color: 'rgba(201,168,76,0.7)' }}
      >
        {section.heading}
      </p>
      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)', whiteSpace: 'pre-wrap' }}>
        {section.body}
      </p>
    </div>
  )
}

function EquipmentList({ categories }) {
  return (
    <div className="space-y-3">
      {categories.map((cat, i) => (
        <div key={i}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(201,168,76,0.7)' }}>
            {cat.category}
          </p>
          <div className="space-y-1">
            {cat.items.map((item, j) => (
              <div key={j} className="flex items-start gap-2">
                <span className="text-gold-400/40 mt-0.5">▸</span>
                <div>
                  <span className="text-xs font-medium text-slate-300">{item.name}</span>
                  {item.notes && (
                    <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,0.35)' }}>— {item.notes}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function RelationshipList({ relationships }) {
  return (
    <div className="space-y-2">
      {relationships.map((r, i) => (
        <div
          key={i}
          className="flex items-start gap-3 px-3 py-2 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
            style={{ background: 'rgba(45,212,191,0.1)', color: 'rgba(45,212,191,0.8)', border: '1px solid rgba(45,212,191,0.2)' }}
          >
            {r.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300">{r.name}</p>
            {r.role  && <p className="text-[10px]" style={{ color: 'rgba(45,212,191,0.7)' }}>{r.role}</p>}
            {r.notes && <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{r.notes}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyField() {
  return <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.2)' }}>Not parsed — edit after import</p>
}

// ── Structured view ───────────────────────────────────────────────────────────

function StructuredView({ dossier }) {
  const hasIdentity      = Object.values(dossier.identity ?? {}).some(Boolean)
  const hasMeta          = Object.keys(dossier.statusMeta ?? {}).length > 0
  const hasSections      = (dossier.sections ?? []).length > 0
  const hasStats         = (dossier.statBlocks ?? []).length > 0
  const hasEquipment     = (dossier.equipment ?? []).length > 0
  const hasRelationships = (dossier.relationships ?? []).length > 0

  return (
    <div className="space-y-3 pb-6">
      {/* Identity hero */}
      <div
        className="rounded-2xl px-5 py-4"
        style={{
          background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(255,255,255,0.02) 100%)',
          border: '1px solid rgba(201,168,76,0.15)',
        }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(201,168,76,0.6)' }}>
          Identity
        </p>
        {dossier.identity?.callsign && (
          <h1 className="font-serif text-2xl font-bold text-gold-400 leading-none mb-1">
            {dossier.identity.callsign}
          </h1>
        )}
        {dossier.identity?.name && (
          <p className="text-sm font-medium text-slate-300">{dossier.identity.name}</p>
        )}
        {dossier.identity?.alias && (
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>aka {dossier.identity.alias}</p>
        )}
        {dossier.identity?.tagline && (
          <p className="text-xs italic mt-2 border-l-2 pl-3 border-gold-500/30" style={{ color: 'rgba(255,255,255,0.5)' }}>
            "{dossier.identity.tagline}"
          </p>
        )}
        {!hasIdentity && <EmptyField />}
      </div>

      {/* Status metadata */}
      {hasMeta && (
        <SectionCard icon={FileText} title="Status Metadata" accentRgb="45,212,191">
          <KVGrid data={dossier.statusMeta} />
        </SectionCard>
      )}

      {/* Narrative sections */}
      {hasSections && (
        <SectionCard icon={User} title="Narrative" accentRgb="201,168,76">
          <div className="space-y-2">
            {dossier.sections.map(s => (
              <NarrativeSection key={s.id} section={s} />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Stat blocks */}
      {hasStats && (
        <SectionCard icon={Globe} title="Stats & Ratings" accentRgb="249,115,22">
          <div className="space-y-4">
            {dossier.statBlocks.map((block, i) => (
              <div key={i}>
                {block.groupTitle && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(249,115,22,0.7)' }}>
                    {block.groupTitle}
                  </p>
                )}
                <StatRow stats={block.stats} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Equipment / cyberware */}
      {hasEquipment && (
        <SectionCard icon={Sword} title="Equipment & Cyberware" accentRgb="158,125,212">
          <EquipmentList categories={dossier.equipment} />
        </SectionCard>
      )}

      {/* Relationships */}
      {hasRelationships && (
        <SectionCard icon={Users} title="Known Associates" accentRgb="45,212,191">
          <RelationshipList relationships={dossier.relationships} />
        </SectionCard>
      )}
    </div>
  )
}

// ── Artifact view ─────────────────────────────────────────────────────────────

function ArtifactView({ rawHtml }) {
  if (!rawHtml) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
        No original artifact stored.
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-2">
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-shrink-0"
        style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}
      >
        <Eye className="w-3 h-3 text-gold-500" />
        <span className="text-[10px] text-gold-400/70 font-medium">
          Original artifact — rendered in sandboxed frame
        </span>
      </div>
      <div className="flex-1 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <iframe
          srcDoc={rawHtml}
          title="Original dossier artifact"
          className="w-full h-full"
          sandbox="allow-same-origin"
          style={{ minHeight: 500 }}
        />
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function DossierViewer({ dossier }) {
  const [tab, setTab] = useState('structured')

  if (!dossier) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
        <div className="text-center">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Select a dossier</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Viewer header */}
      <div
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-100 truncate">{dossier.title}</h2>
          {dossier.rawHtmlFileName && (
            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {dossier.rawHtmlFileName}
            </p>
          )}
        </div>
        <TabBar active={tab} onChange={setTab} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === 'structured' && <StructuredView dossier={dossier} />}
        {tab === 'artifact'   && <ArtifactView rawHtml={dossier.rawHtml} />}
      </div>
    </div>
  )
}
