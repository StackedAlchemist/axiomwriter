import React, { useState, useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import { ROLE_OPTIONS } from '../../hooks/useCharacters'

// ── Reusable primitives ───────────────────────────────────────────────────────

export function Section({ title, description, children }) {
  return (
    <div className="space-y-4">
      <div className="pb-2 border-b border-axiom-border">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{title}</h3>
        {description && <p className="text-xs text-slate-700 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
      {hint && <p className="text-xs text-slate-600 mb-1.5 leading-relaxed">{hint}</p>}
      {children}
    </div>
  )
}

export function TagInput({ value = [], onChange, placeholder }) {
  const [input, setInput] = useState('')

  function addTag(e) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      const tag = input.trim().replace(/,$/, '')
      if (!value.includes(tag)) onChange([...value, tag])
      setInput('')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map(tag => (
          <span key={tag} className="flex items-center gap-1 bg-axiom-surface2 border border-axiom-border text-slate-400 text-xs px-2 py-0.5 rounded-full">
            {tag}
            <button type="button" onClick={() => onChange(value.filter(t => t !== tag))} className="hover:text-red-400 transition-colors">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={addTag}
        placeholder={placeholder ?? 'Type and press Enter…'}
        className="input-base text-sm py-2"
      />
    </div>
  )
}

// ── CoreSheet ─────────────────────────────────────────────────────────────────
export default function CoreSheet({ character, onSave }) {
  // Merge physicalDescription (new) with legacy flat fields for backward compat
  const phys = character.physicalDescription ?? {}

  const [local, setLocal] = useState({
    name:             character.name             ?? '',
    role:             character.role             ?? 'supporting',
    // Physical (structured)
    age:              phys.age              ?? character.age              ?? '',
    height:           phys.height           ?? '',
    build:            phys.build            ?? '',
    hairColor:        phys.hairColor        ?? '',
    eyeColor:         phys.eyeColor         ?? '',
    distinctiveFeatures: phys.distinctiveFeatures ?? character.distinguishingFeatures ?? '',
    style:            phys.style            ?? character.style            ?? '',
    // Psychology
    backstory:        character.backstory        ?? '',
    motivations:      character.motivations      ?? '',
    fears:            character.fears            ?? '',
    internalConflict: character.internalConflict ?? '',
    externalConflict: character.externalConflict ?? '',
    arcSummary:       character.arcSummary       ?? '',
  })

  const handleChange = (field, val) => setLocal(p => ({ ...p, [field]: val }))

  // Physical fields save into physicalDescription object
  const PHYS_FIELDS = new Set(['age','height','build','hairColor','eyeColor','distinctiveFeatures','style'])
  const handleBlur  = useCallback((field) => {
    if (PHYS_FIELDS.has(field)) {
      const updatedPhys = {
        ...(character.physicalDescription ?? {}),
        [field]: local[field],
      }
      if (local[field] !== (character.physicalDescription?.[field] ?? '')) {
        onSave({ physicalDescription: updatedPhys })
      }
    } else {
      if (local[field] !== character[field]) onSave({ [field]: local[field] })
    }
  }, [local, character, onSave])

  const handleAliasChange = (aliases) => onSave({ aliases })
  const handleRoleChange  = (role) => { setLocal(p => ({ ...p, role })); onSave({ role }) }

  // Custom fields
  const [customFields, setCustomFields] = useState(character.customFields ?? [])
  const addCustomField    = () => {
    const updated = [...customFields, { label: 'Custom Field', value: '' }]
    setCustomFields(updated); onSave({ customFields: updated })
  }
  const updateCustomField = (idx, key, val) => {
    setCustomFields(prev => prev.map((f, i) => i === idx ? { ...f, [key]: val } : f))
  }
  const blurCustomField   = () => onSave({ customFields })
  const removeCustomField = (idx) => {
    const updated = customFields.filter((_, i) => i !== idx)
    setCustomFields(updated); onSave({ customFields: updated })
  }

  const ta = (field, rows = 4, placeholder = '') => (
    <textarea
      value={local[field]}
      rows={rows}
      placeholder={placeholder}
      onChange={e => handleChange(field, e.target.value)}
      onBlur={() => handleBlur(field)}
      className="input-base resize-none text-sm leading-relaxed"
    />
  )

  const inp = (field, placeholder = '') => (
    <input
      type="text"
      value={local[field]}
      placeholder={placeholder}
      onChange={e => handleChange(field, e.target.value)}
      onBlur={() => handleBlur(field)}
      className="input-base text-sm"
    />
  )

  return (
    <div className="space-y-8 animate-slide-up">

      {/* ── Identity ── */}
      <Section title="Identity">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name">
            {inp('name', 'Character name')}
          </Field>
          <Field label="Age">
            {inp('age', 'e.g. 34, Early 40s, Unknown')}
          </Field>
        </div>

        <Field label="Aliases / Nicknames">
          <TagInput value={character.aliases ?? []} onChange={handleAliasChange} placeholder="Add alias and press Enter…" />
        </Field>

        <Field label="Role">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {ROLE_OPTIONS.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => handleRoleChange(r.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                  local.role === r.value
                    ? `${r.bg} ${r.color}`
                    : 'bg-transparent text-slate-600 border-axiom-border hover:border-axiom-border-light hover:text-slate-400'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* ── Physical Description ── */}
      <Section title="Physical Description" description="How they look and present themselves to the world.">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Height">
            {inp('height', 'e.g. 5\'11", Tall')}
          </Field>
          <Field label="Build">
            {inp('build', 'e.g. Lean, Athletic')}
          </Field>
          <Field label="Hair Color">
            {inp('hairColor', 'e.g. Dark brown')}
          </Field>
          <Field label="Eye Color">
            {inp('eyeColor', 'e.g. Pale grey')}
          </Field>
        </div>

        <Field label="Style / Wardrobe" hint="How they dress, their aesthetic, what their clothing says about them.">
          {ta('style', 3, 'How they dress, their aesthetic…')}
        </Field>
        <Field label="Distinctive Features" hint="Scars, tattoos, mannerisms, posture, voice quality.">
          {ta('distinctiveFeatures', 3, 'Scars, tattoos, mannerisms, posture…')}
        </Field>
      </Section>

      {/* ── Psychology ── */}
      <Section title="Psychology" description="The inner life that drives everything they do.">
        <Field label="Backstory" hint="The formative experiences that made them who they are.">
          {ta('backstory', 5, 'Where did they come from? What shaped them?')}
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Motivations" hint="What do they want — on the surface and deep down?">
            {ta('motivations', 4, 'Their driving wants, needs, and goals…')}
          </Field>
          <Field label="Fears" hint="What threatens them — physically, emotionally, existentially?">
            {ta('fears', 4, 'Their deepest fears and what they avoid…')}
          </Field>
        </div>
      </Section>

      {/* ── Conflict & Arc ── */}
      <Section title="Conflict & Arc" description="The struggles that create story.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Internal Conflict" hint="The war they're fighting inside themselves.">
            {ta('internalConflict', 4, 'What belief, wound, or contradiction tears at them?')}
          </Field>
          <Field label="External Conflict" hint="The war they're fighting with the world.">
            {ta('externalConflict', 4, 'Who or what opposes them in the physical story?')}
          </Field>
        </div>
        <Field label="Arc Summary" hint="Where do they start and where do they end up?">
          {ta('arcSummary', 4, 'The transformation (or tragic lack thereof)…')}
        </Field>
      </Section>

      {/* ── Custom Fields ── */}
      <Section title="Custom Fields" description="Define any additional fields specific to this character or story.">
        <div className="space-y-3">
          {customFields.map((field, idx) => (
            <div key={idx} className="flex gap-2 items-start group">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={field.label}
                  onChange={e => updateCustomField(idx, 'label', e.target.value)}
                  onBlur={blurCustomField}
                  placeholder="Field name"
                  className="input-base text-sm py-2 col-span-1"
                />
                <textarea
                  value={field.value}
                  onChange={e => updateCustomField(idx, 'value', e.target.value)}
                  onBlur={blurCustomField}
                  placeholder="Value…"
                  rows={2}
                  className="input-base text-sm py-2 col-span-2 resize-none"
                />
              </div>
              <button
                type="button"
                onClick={() => removeCustomField(idx)}
                className="p-1.5 mt-1 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addCustomField}
            className="flex items-center gap-2 text-xs text-slate-600 hover:text-teal-400 transition-colors py-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add custom field
          </button>
        </div>
      </Section>
    </div>
  )
}
