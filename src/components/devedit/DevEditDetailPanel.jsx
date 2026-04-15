import React from 'react'
import { X, Activity, Eye, Globe, RotateCcw, UserCheck, AlignLeft, MessageSquare } from 'lucide-react'
import { CHECK_LABELS, CHECK_DESCRIPTIONS } from '../../lib/devEditEngine'

const CHECK_ICONS = {
  pacing:              Activity,
  pov_consistency:     Eye,
  world_terms:         Globe,
  flashback:           RotateCcw,
  character_grounding: UserCheck,
  show_vs_tell:        AlignLeft,
  dialogue_balance:    MessageSquare,
}

const CHECK_EXAMPLES = {
  pacing: {
    bad:  'The battle raged. Swords clashed. Blood was spilled. The next fight began without pause.',
    good: 'After the battle, Emma sat alone, turning the dead man\'s ring over in her fingers. Tomorrow would be worse.',
  },
  pov_consistency: {
    bad:  '"Emma felt nervous. Across the room, John hoped she wouldn\'t notice him watching."',
    good: 'Stay inside one character\'s head per scene. Use a clear section break (***) to signal any POV shift.',
  },
  world_terms: {
    bad:  'The Velorath, wielding a Shimmer-blade, crossed the Keth-bridge toward the Dawnspire.',
    good: 'Introduce 2–3 new terms per chapter at most, each given organic context that explains the word as the reader encounters it.',
  },
  flashback: {
    bad:  'The sword was at his throat. He remembered — ten years ago, his father\'s hands on his shoulders…',
    good: 'Resolve the moment of tension before cutting to the flashback, or use a chapter break as a buffer.',
  },
  character_grounding: {
    bad:  'She ran through the door. Her heart pounded. This had to end today.',
    good: 'Aria pushed into the alley — rain cold on her neck, cobblestones slippery under worn boots — and pressed flat against the brickwork.',
  },
  show_vs_tell: {
    bad:  'She felt angry. She realized he had lied. She decided she would leave.',
    good: 'She set the letter on the table, pressing her palm flat against it until her hand stopped shaking.',
  },
  dialogue_balance: {
    bad:  '"Where were you?" "Working." "You always say that." "It\'s true." (no action, no setting)',
    good: 'Maya set down her fork. "Where were you?" She watched his eyes, not his mouth, when he answered.',
  },
}

export default function DevEditDetailPanel({ finding, onClose, onDismiss, onNeverCheck }) {
  if (!finding) return null

  const { type, message, suggestion, detail } = finding
  const Icon     = CHECK_ICONS[type] || Activity
  const examples = CHECK_EXAMPLES[type] || null

  return (
    <div className="w-[320px] flex-shrink-0 border-l border-axiom-border bg-axiom-surface flex flex-col overflow-hidden animate-slide-in">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-axiom-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {CHECK_LABELS[type] || type}
          </span>
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* What this check does */}
        <div className="px-3 py-2.5 rounded-lg bg-axiom-surface2 border border-axiom-border text-xs text-slate-500 leading-relaxed">
          {CHECK_DESCRIPTIONS[type]}
        </div>

        {/* The finding */}
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Observation</p>
            <p className="text-sm text-slate-200 leading-snug font-medium">{message}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Suggestion</p>
            <p className="text-xs text-slate-400 leading-relaxed">{suggestion}</p>
          </div>
          {detail && (
            <div>
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Excerpt</p>
              <p className="text-xs text-slate-500 italic leading-relaxed border-l-2 border-axiom-border pl-3">
                "{detail}"
              </p>
            </div>
          )}
        </div>

        {/* Examples */}
        {examples && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Examples</p>
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
              <p className="text-[9px] font-semibold text-red-400 uppercase tracking-wider mb-1.5">Watch for</p>
              <p className="text-xs text-slate-400 italic leading-relaxed">{examples.bad}</p>
            </div>
            <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 p-3">
              <p className="text-[9px] font-semibold text-teal-400 uppercase tracking-wider mb-1.5">Try instead</p>
              <p className="text-xs text-slate-400 italic leading-relaxed">{examples.good}</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-axiom-border flex-shrink-0 space-y-2">
        <button
          onClick={onDismiss}
          className="w-full btn-secondary text-xs justify-center"
        >
          Dismiss This Note
        </button>
        <button
          onClick={onNeverCheck}
          className="w-full btn-ghost text-xs justify-center text-slate-500"
        >
          Never check {CHECK_LABELS[type] || type}
        </button>
      </div>
    </div>
  )
}
