import React, { useState } from 'react'
import { Wand2, Loader2 } from 'lucide-react'
import { refineText } from '../../lib/claudeApi'

const REFINEMENTS = [
  { label: 'Make more tense',       instruction: 'Increase the tension and urgency in this passage.' },
  { label: 'Soften the dialogue',   instruction: 'Make the dialogue softer and less confrontational.' },
  { label: 'Expand this',           instruction: 'Expand this passage with more detail and depth.' },
  { label: 'Condense this',         instruction: 'Condense this passage to its essential beats.' },
]

export default function RefinementMenu({
  x, y,
  selectedText,
  characters,
  onRefined,
  onClose,
}) {
  const [loading,  setLoading]  = useState(false)
  const [expanded, setExpanded] = useState(false)

  async function handleRefine(instruction, characterName, voiceDNA) {
    setLoading(true)
    const result = await refineText({ selectedText, instruction, characterName, voiceDNA })
    setLoading(false)
    if (result) onRefined(result)
    onClose()
  }

  function buildVoiceDNA(char) {
    if (!char?.voiceDna) return null
    const v = char.voiceDna
    return [
      v.speechPatterns && `Speech: ${v.speechPatterns}`,
      v.commonPhrases?.length && `Phrases: ${v.commonPhrases.join(', ')}`,
      v.neverSayPhrases?.length && `Never: ${v.neverSayPhrases.join(', ')}`,
    ].filter(Boolean).join('; ')
  }

  const menuStyle = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 260),
    top: Math.max(y - 8, 8),
    zIndex: 60,
  }

  return (
    <div style={menuStyle} className="bg-axiom-surface border border-axiom-border rounded-lg shadow-card py-1 w-52 animate-fade-in">
      {loading ? (
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500">
          <Loader2 className="w-3 h-3 animate-spin" /> Refining…
        </div>
      ) : (
        <>
          <div className="px-3 py-1.5 flex items-center gap-1.5 border-b border-axiom-border">
            <Wand2 className="w-3 h-3 text-gold-400" />
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">AI Refine</span>
          </div>

          {REFINEMENTS.map(r => (
            <button
              key={r.label}
              onClick={() => handleRefine(r.instruction)}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-axiom-surface2 hover:text-slate-100 transition-colors"
            >
              {r.label}
            </button>
          ))}

          {/* Rewrite in character voice */}
          {characters.length > 0 && (
            <>
              <div className="border-t border-axiom-border my-1" />
              <button
                onClick={() => setExpanded(p => !p)}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-400 hover:bg-axiom-surface2 transition-colors flex items-center justify-between"
              >
                <span>Rewrite in voice of…</span>
                <span className="text-slate-600">{expanded ? '▲' : '▼'}</span>
              </button>
              {expanded && characters.slice(0, 8).map(c => (
                <button
                  key={c.id}
                  onClick={() => handleRefine(`Rewrite this in ${c.name}'s distinctive voice and speech patterns.`, c.name, buildVoiceDNA(c))}
                  className="w-full text-left px-5 py-1 text-xs text-slate-400 hover:bg-axiom-surface2 hover:text-teal-400 transition-colors"
                >
                  {c.name}
                </button>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}
