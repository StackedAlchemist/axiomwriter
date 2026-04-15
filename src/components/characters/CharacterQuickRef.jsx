import React, { useEffect, useRef } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { AVATAR_COLORS, IMPORTANCE_LEVELS, ROLE_OPTIONS } from '../../hooks/useCharacters'

/**
 * CharacterQuickRef — mini popup showing a character's essential profile.
 * Designed for use inside the manuscript editor: non-intrusive, click-outside-to-close.
 *
 * Props:
 *   character  — character object
 *   onClose    — close handler
 *   anchorRef  — optional ref element to position near (falls back to center)
 */
export default function CharacterQuickRef({ character, onClose, anchorRef }) {
  const navigate  = useNavigate()
  const { projectId } = useParams()
  const panelRef  = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          (!anchorRef?.current || !anchorRef.current.contains(e.target))) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose, anchorRef])

  // Close on Escape
  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!character) return null

  const avatarColors = AVATAR_COLORS[character.role] ?? AVATAR_COLORS.supporting
  const initials     = (character.name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const impLevel     = IMPORTANCE_LEVELS[character.importance ?? 1]
  const roleOpt      = ROLE_OPTIONS.find(r => r.value === character.role) ?? ROLE_OPTIONS[3]
  const voice        = character.voiceDna ?? {}
  const phys         = character.physicalDescription ?? {}

  // Build a concise appearance blurb
  const appearanceParts = [
    phys.height, phys.build, phys.hairColor && `${phys.hairColor} hair`, phys.eyeColor && `${phys.eyeColor} eyes`,
  ].filter(Boolean)
  const appearanceText = appearanceParts.length > 0
    ? appearanceParts.join(', ')
    : character.appearance || ''

  const vocabLabel = voice.vocabularyLevel ? ` · ${voice.vocabularyLevel}` : ''
  const phrasePreview = voice.commonPhrases?.slice(0, 2).map(p => `"${p}"`).join(', ')

  return (
    <div
      ref={panelRef}
      className="absolute z-50 w-80 bg-axiom-surface border border-axiom-border-light rounded-2xl shadow-card animate-slide-up overflow-hidden"
      style={{ maxWidth: '90vw' }}
    >
      {/* Header */}
      <div className={`px-4 pt-4 pb-3 border-b border-axiom-border flex items-start gap-3`}>
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 overflow-hidden ${avatarColors.bg} ${avatarColors.border}`}>
          {character.photoUrl ? (
            <img src={character.photoUrl} alt={character.name} className="w-full h-full object-cover" />
          ) : (
            <span className={`text-sm font-bold font-serif ${avatarColors.text}`}>{initials}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif font-semibold text-slate-100 text-sm leading-tight truncate">
            {character.name || 'Unnamed'}
          </p>
          {character.aliases?.length > 0 && (
            <p className="text-xs text-slate-600 truncate">aka {character.aliases.join(', ')}</p>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`badge border text-[10px] ${roleOpt.bg} ${roleOpt.color}`}>{roleOpt.label}</span>
            <span className={`badge border text-[10px] ${impLevel.bg} ${impLevel.color}`}>{impLevel.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {projectId && (
            <button
              onClick={() => navigate(`/projects/${projectId}/characters/${character.id}`)}
              className="p-1.5 text-slate-600 hover:text-gold-400 transition-colors"
              title="Open full character sheet"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 text-xs">

        {/* Appearance */}
        {appearanceText && (
          <div>
            <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-0.5">Appearance</p>
            <p className="text-slate-400 leading-relaxed line-clamp-2">{appearanceText}</p>
          </div>
        )}

        {/* Voice */}
        {(voice.vocabularyLevel || phrasePreview || voice.speechPatterns) && (
          <div>
            <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-0.5">
              Voice{vocabLabel}
            </p>
            {voice.speechPatterns && (
              <p className="text-slate-400 leading-relaxed line-clamp-2 mb-1">{voice.speechPatterns}</p>
            )}
            {phrasePreview && (
              <p className="text-teal-400/80 italic">{phrasePreview}</p>
            )}
          </div>
        )}

        {/* Arc */}
        {character.arcSummary && (
          <div>
            <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-0.5">Arc</p>
            <p className="text-slate-400 leading-relaxed line-clamp-2">{character.arcSummary}</p>
          </div>
        )}

        {/* Motivations */}
        {character.motivations && (
          <div>
            <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-0.5">Wants</p>
            <p className="text-slate-400 leading-relaxed line-clamp-2">{character.motivations}</p>
          </div>
        )}

        {/* No data fallback */}
        {!appearanceText && !voice.vocabularyLevel && !character.arcSummary && !character.motivations && (
          <p className="text-slate-600 italic text-center py-2">No profile details yet.</p>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 pb-3">
        <p className="text-[10px] text-slate-700 text-center">Press Esc or click outside to close</p>
      </div>
    </div>
  )
}
