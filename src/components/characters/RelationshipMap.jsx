import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, X, GitBranch } from 'lucide-react'
import {
  forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide,
} from 'd3'
import { useCharacters, RELATIONSHIP_TYPES, AVATAR_COLORS } from '../../hooks/useCharacters'

// ── Constants ─────────────────────────────────────────────────────────────────
const WIDTH  = 600
const HEIGHT = 400
const CENTER_RADIUS  = 32
const NODE_RADIUS    = 24

function relTypeColor(type) {
  return RELATIONSHIP_TYPES.find(r => r.value === type)?.color ?? 'text-slate-400'
}
function relTypeLabel(type) {
  return RELATIONSHIP_TYPES.find(r => r.value === type)?.label ?? type
}

// ── Force graph (headless d3 + React SVG) ────────────────────────────────────
function ForceGraph({ character, allCharacters, onNodeClick }) {
  const simRef      = useRef(null)
  const [nodes, setNodes] = useState([])
  const [links, setLinks] = useState([])

  const relationships = character.relationshipMap ?? []

  useEffect(() => {
    // Build node list: center character + related characters
    const relIds = new Set(relationships.map(r => r.characterId))
    const relChars = allCharacters.filter(c => relIds.has(c.id) && c.id !== character.id)

    const nodeData = [
      { id: character.id, isCenter: true, name: character.name || '?', role: character.role, x: WIDTH / 2, y: HEIGHT / 2 },
      ...relChars.map((c, i) => ({
        id: c.id, isCenter: false, name: c.name || '?', role: c.role,
        x: WIDTH / 2 + Math.cos((i / relChars.length) * 2 * Math.PI) * 160,
        y: HEIGHT / 2 + Math.sin((i / relChars.length) * 2 * Math.PI) * 130,
      })),
    ]

    const linkData = relationships
      .filter(r => relIds.has(r.characterId))
      .map(r => ({
        source:       character.id,
        target:       r.characterId,
        type:         r.relationshipType,
        description:  r.description,
      }))

    // Stop previous simulation
    if (simRef.current) simRef.current.stop()

    const sim = forceSimulation(nodeData)
      .force('link',    forceLink(linkData).id(d => d.id).distance(160).strength(0.5))
      .force('charge',  forceManyBody().strength(-300))
      .force('center',  forceCenter(WIDTH / 2, HEIGHT / 2))
      .force('collide', forceCollide(NODE_RADIUS + 12))
      .on('tick', () => {
        // Clamp nodes to SVG bounds
        nodeData.forEach(n => {
          n.x = Math.max(NODE_RADIUS + 10, Math.min(WIDTH  - NODE_RADIUS - 10, n.x))
          n.y = Math.max(NODE_RADIUS + 10, Math.min(HEIGHT - NODE_RADIUS - 10, n.y))
        })
        setNodes([...nodeData])
        setLinks([...linkData])
      })

    simRef.current = sim
    return () => sim.stop()
  }, [character.id, character.name, character.role, relationships, allCharacters])

  if (relationships.length === 0) return null

  function roleColor(role) {
    const c = AVATAR_COLORS[role] ?? AVATAR_COLORS.supporting
    // Extract hex from tailwind class pattern for SVG use
    const map = {
      protagonist: '#d4b865',
      antagonist:  '#f87171',
      major:       '#9e7dd4',
      supporting:  '#2dd4bf',
      background:  '#94a3b8',
    }
    return map[role] ?? '#2dd4bf'
  }

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full rounded-xl border border-axiom-border bg-axiom-surface2"
      style={{ maxHeight: '420px' }}
    >
      {/* Links */}
      {links.map((link, i) => {
        const src = nodes.find(n => n.id === (link.source?.id ?? link.source))
        const tgt = nodes.find(n => n.id === (link.target?.id ?? link.target))
        if (!src || !tgt) return null
        return (
          <g key={i}>
            <line
              x1={src.x} y1={src.y}
              x2={tgt.x} y2={tgt.y}
              stroke="rgba(201,168,76,0.2)"
              strokeWidth={2}
            />
            {/* Relationship type label on link midpoint */}
            <text
              x={(src.x + tgt.x) / 2}
              y={(src.y + tgt.y) / 2 - 6}
              textAnchor="middle"
              fill="rgba(201,168,76,0.6)"
              fontSize="10"
              fontFamily="inherit"
            >
              {relTypeLabel(link.type)}
            </text>
          </g>
        )
      })}

      {/* Nodes */}
      {nodes.map(node => {
        const r     = node.isCenter ? CENTER_RADIUS : NODE_RADIUS
        const color = roleColor(node.role)
        const initials = (node.name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        return (
          <g
            key={node.id}
            transform={`translate(${node.x ?? WIDTH/2},${node.y ?? HEIGHT/2})`}
            onClick={() => !node.isCenter && onNodeClick(node.id)}
            className={node.isCenter ? '' : 'cursor-pointer'}
            style={{ userSelect: 'none' }}
          >
            <circle
              r={r}
              fill={`${color}20`}
              stroke={color}
              strokeWidth={node.isCenter ? 2.5 : 1.5}
            />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fill={color}
              fontSize={node.isCenter ? '13' : '11'}
              fontWeight="bold"
              fontFamily="'Cormorant Garamond', serif"
            >
              {initials}
            </text>
            {/* Name label below node */}
            <text
              y={r + 14}
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="10"
              fontFamily="inherit"
            >
              {node.name.length > 12 ? node.name.slice(0, 11) + '…' : node.name}
            </text>
            {node.isCenter && (
              <text
                y={r + 26}
                textAnchor="middle"
                fill="rgba(201,168,76,0.5)"
                fontSize="9"
                fontFamily="inherit"
              >
                (you)
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── Add relationship form ─────────────────────────────────────────────────────
function AddRelationshipForm({ character, allCharacters, onSave, onClose }) {
  const [form, setForm] = useState({
    characterId:      '',
    relationshipType: 'friend',
    description:      '',
  })

  const existingIds = new Set((character.relationshipMap ?? []).map(r => r.characterId))
  const available   = allCharacters.filter(c => c.id !== character.id && !existingIds.has(c.id))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.characterId) return
    const updated = [...(character.relationshipMap ?? []), { ...form }]
    await onSave({ relationshipMap: updated })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3 border-teal-500/20 bg-teal-500/5 animate-slide-up">
      <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Add Relationship</p>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Character</label>
        {available.length === 0 ? (
          <p className="text-xs text-slate-600 italic">No other characters available. Add more characters first.</p>
        ) : (
          <select
            value={form.characterId}
            onChange={e => setForm(p => ({ ...p, characterId: e.target.value }))}
            className="input-base text-sm"
          >
            <option value="">Select a character…</option>
            {available.map(c => (
              <option key={c.id} value={c.id}>{c.name || 'Unnamed'}</option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Relationship Type</label>
        <div className="flex flex-wrap gap-1.5">
          {RELATIONSHIP_TYPES.map(rt => (
            <button
              key={rt.value}
              type="button"
              onClick={() => setForm(p => ({ ...p, relationshipType: rt.value }))}
              className={`px-2.5 py-1 rounded text-xs border transition-all ${
                form.relationshipType === rt.value
                  ? 'bg-gold-500/15 text-gold-400 border-gold-500/30'
                  : 'text-slate-600 border-axiom-border hover:border-axiom-border-light'
              }`}
            >
              {rt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          placeholder="Describe the nature of this relationship…"
          rows={2}
          className="input-base text-sm resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="btn-ghost text-xs">Cancel</button>
        <button type="submit" disabled={!form.characterId} className="btn-primary text-xs py-1.5 px-4">
          Add Relationship
        </button>
      </div>
    </form>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RelationshipMap({ character, onSave, projectId }) {
  const navigate = useNavigate()
  const { characters } = useCharacters(projectId)
  const [showAdd, setShowAdd] = useState(false)

  const relationships = character.relationshipMap ?? []

  function handleNodeClick(charId) {
    navigate(`/projects/${projectId}/characters/${charId}`)
  }

  async function removeRelationship(idx) {
    const updated = relationships.filter((_, i) => i !== idx)
    await onSave({ relationshipMap: updated })
  }

  return (
    <div className="space-y-5 animate-slide-up">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Relationship Map</h3>
          <p className="text-xs text-slate-700 mt-0.5">
            {relationships.length > 0
              ? 'Click any character node to navigate to their sheet.'
              : 'Map how this character connects to everyone else.'}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(p => !p)}
          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Relationship
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <AddRelationshipForm
          character={character}
          allCharacters={characters}
          onSave={onSave}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* Force graph */}
      {relationships.length > 0 ? (
        <ForceGraph
          character={character}
          allCharacters={characters}
          onNodeClick={handleNodeClick}
        />
      ) : (
        !showAdd && (
          <div className="card p-10 flex flex-col items-center text-center">
            <GitBranch className="w-8 h-8 text-slate-700 mb-3" />
            <p className="text-slate-500 text-sm font-medium mb-1">No relationships mapped yet</p>
            <p className="text-slate-700 text-xs max-w-sm">
              Add relationships to see a visual map of how {character.name || 'this character'} connects to the rest of the cast.
            </p>
          </div>
        )
      )}

      {/* Relationship list */}
      {relationships.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">All Relationships</h4>
          {relationships.map((rel, idx) => {
            const relChar = characters.find(c => c.id === rel.characterId)
            const rtColor = relTypeColor(rel.relationshipType)
            return (
              <div key={idx} className="card px-4 py-3 flex items-center gap-3 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleNodeClick(rel.characterId)}
                      className="font-medium text-sm text-slate-200 hover:text-white transition-colors"
                    >
                      {relChar?.name ?? 'Unknown Character'}
                    </button>
                    <span className={`text-xs font-medium ${rtColor}`}>
                      {relTypeLabel(rel.relationshipType)}
                    </span>
                  </div>
                  {rel.description && (
                    <p className="text-xs text-slate-600 mt-0.5 truncate">{rel.description}</p>
                  )}
                </div>
                <button
                  onClick={() => removeRelationship(idx)}
                  className="p-1 text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
