import React, { useState } from 'react'
import { X, Mic, AlertTriangle, Sparkles, Loader2 } from 'lucide-react'
import Anthropic from '@anthropic-ai/sdk'

function Section({ title, description, icon: Icon, accent = 'gold', children }) {
  const colors = accent === 'teal'
    ? 'text-teal-400 bg-teal-500/10 border-teal-500/20'
    : 'text-gold-400 bg-gold-500/10 border-gold-500/20'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-axiom-border">
        {Icon && (
          <div className={`w-6 h-6 rounded flex items-center justify-center border ${colors}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{title}</h3>
          {description && <p className="text-xs text-slate-700 mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
      {hint && <p className="text-xs text-slate-600 mb-1.5 leading-relaxed italic">{hint}</p>}
      {children}
    </div>
  )
}

function PhraseInput({ value = [], onChange, placeholder, accentClass = 'bg-teal-500/10 border-teal-500/20 text-teal-400' }) {
  const [input, setInput] = useState('')

  function addPhrase(e) {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault()
      if (!value.includes(input.trim())) onChange([...value, input.trim()])
      setInput('')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map(phrase => (
          <span key={phrase} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${accentClass}`}>
            <span className="italic">"{phrase}"</span>
            <button type="button" onClick={() => onChange(value.filter(p => p !== phrase))} className="opacity-60 hover:opacity-100 hover:text-red-400 transition-colors">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={addPhrase}
        placeholder={placeholder}
        className="input-base text-sm py-2"
      />
    </div>
  )
}

const VOCAB_LEVELS   = ['Simple', 'Conversational', 'Educated', 'Elevated', 'Archaic / Stylized']
const SENTENCE_PREFS = ['Very short. Clipped.', 'Short and punchy.', 'Balanced mix.', 'Long and flowing.', 'Run-on, stream-of-consciousness.']

// ── Voice Preview ─────────────────────────────────────────────────────────────
function VoicePreview({ character, voice }) {
  const [sampleLine, setSampleLine] = useState('')
  const [result,     setResult]     = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  async function handleRewrite() {
    if (!sampleLine.trim()) return
    setLoading(true)
    setResult('')
    setError('')
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
      if (!apiKey) {
        setError('VITE_ANTHROPIC_API_KEY not set in environment.')
        setLoading(false)
        return
      }

      const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

      // Build voice profile context
      const voiceContext = [
        voice.speechPatterns   && `Speech patterns: ${voice.speechPatterns}`,
        voice.vocabularyLevel  && `Vocabulary level: ${voice.vocabularyLevel}`,
        voice.sentenceLengthPref && `Sentence preference: ${voice.sentenceLengthPref}`,
        voice.humorStyle       && `Humor style: ${voice.humorStyle}`,
        voice.commonPhrases?.length  && `Common phrases: ${voice.commonPhrases.map(p => `"${p}"`).join(', ')}`,
        voice.neverSayPhrases?.length && `Never says: ${voice.neverSayPhrases.map(p => `"${p}"`).join(', ')}`,
        voice.tellsLying       && `When lying: ${voice.tellsLying}`,
        voice.tellsStressed    && `When stressed: ${voice.tellsStressed}`,
      ].filter(Boolean).join('\n')

      const prompt = `You are rewriting dialogue in the distinct voice of a fictional character named ${character.name || 'this character'}.

Character voice profile:
${voiceContext || 'No voice profile defined yet — rewrite with a generic but distinctive voice.'}

Character backstory/motivation context:
${character.backstory ? character.backstory.slice(0, 300) : 'Unknown'}

Rewrite the following line of dialogue or narration in this character's authentic voice. Preserve the core meaning but make it sound unmistakably like them. Output ONLY the rewritten line — no explanations, no quotation marks around the whole thing, no preamble.

Original line:
${sampleLine}`

      const message = await client.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages:   [{ role: 'user', content: prompt }],
      })

      setResult(message.content[0]?.text ?? '')
    } catch (err) {
      setError(err.message ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-axiom-border">
        <div className="w-6 h-6 rounded flex items-center justify-center border text-purple-400 bg-purple-500/10 border-purple-500/20">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Voice Preview</h3>
          <p className="text-xs text-slate-700 mt-0.5">Paste any line — AI rewrites it in this character's voice.</p>
        </div>
      </div>

      <Field label="Sample line">
        <textarea
          value={sampleLine}
          onChange={e => setSampleLine(e.target.value)}
          placeholder='"I think we should leave now," she said calmly.'
          rows={3}
          className="input-base resize-none text-sm leading-relaxed"
        />
      </Field>

      <button
        onClick={handleRewrite}
        disabled={!sampleLine.trim() || loading}
        className="btn-primary text-sm py-2 px-4"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Rewriting…</>
          : <><Sparkles className="w-4 h-4" /> Rewrite in Character Voice</>
        }
      </button>

      {error && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 space-y-2">
          <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-widest">Rewritten in character voice</p>
          <p className="text-slate-200 text-sm leading-relaxed italic">"{result}"</p>
          <button
            onClick={() => { setSampleLine(result); setResult('') }}
            className="text-xs text-purple-400/60 hover:text-purple-400 transition-colors"
          >
            Use this as new sample →
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function VoiceDNA({ character, onSave }) {
  const voice = character.voiceDna ?? {}

  const [local, setLocal] = useState({
    speechPatterns:     voice.speechPatterns     ?? '',
    vocabularyLevel:    voice.vocabularyLevel     ?? '',
    sentenceLengthPref: voice.sentenceLengthPref  ?? '',
    humorStyle:         voice.humorStyle          ?? '',
    tellsLying:         voice.tellsLying          ?? '',
    tellsStressed:      voice.tellsStressed       ?? '',
    whenWantsSomething: voice.whenWantsSomething  ?? '',
    whenThreatened:     voice.whenThreatened      ?? '',
  })

  function handleChange(field, val) { setLocal(p => ({ ...p, [field]: val })) }
  function handleBlur(field) {
    if (local[field] !== voice[field]) {
      onSave({ voiceDna: { ...voice, ...local, [field]: local[field] } })
    }
  }

  function handleVoiceSelect(field, val) {
    setLocal(p => ({ ...p, [field]: val }))
    onSave({ voiceDna: { ...voice, ...local, [field]: val } })
  }

  function handlePhraseChange(field, val) {
    onSave({ voiceDna: { ...voice, [field]: val } })
  }

  const ta = (field, rows = 3, placeholder = '') => (
    <textarea
      value={local[field]}
      rows={rows}
      placeholder={placeholder}
      onChange={e => handleChange(field, e.target.value)}
      onBlur={() => handleBlur(field)}
      className="input-base resize-none text-sm leading-relaxed"
    />
  )

  return (
    <div className="space-y-8 animate-slide-up">

      {/* ── Speech Style ── */}
      <Section title="Speech Style" description="How they construct language and sound to others." icon={Mic} accent="gold">
        <Field label="Speech Patterns" hint="Do they ramble? Use filler words? Speak in questions? Trail off? Interrupt?">
          {ta('speechPatterns', 4, 'Describe how they talk — cadence, quirks, habits…')}
        </Field>

        <Field label="Vocabulary Level">
          <div className="flex flex-wrap gap-1.5">
            {VOCAB_LEVELS.map(v => (
              <button
                key={v}
                type="button"
                onClick={() => handleVoiceSelect('vocabularyLevel', v)}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition-all ${
                  local.vocabularyLevel === v
                    ? 'bg-gold-500/15 text-gold-400 border-gold-500/30'
                    : 'text-slate-600 border-axiom-border hover:border-axiom-border-light hover:text-slate-400'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Sentence Length Preference">
          <div className="space-y-1.5">
            {SENTENCE_PREFS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => handleVoiceSelect('sentenceLengthPref', s)}
                className={`w-full text-left px-3 py-2 rounded text-xs border transition-all italic ${
                  local.sentenceLengthPref === s
                    ? 'bg-gold-500/10 text-gold-400 border-gold-500/30'
                    : 'text-slate-600 border-axiom-border hover:border-axiom-border-light hover:text-slate-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* ── Signature Phrases ── */}
      <Section title="Signature Phrases" description="The words that are uniquely theirs." icon={Mic} accent="teal">
        <Field label="Phrases they commonly use" hint="Their verbal fingerprint — sayings, expressions, repeated words.">
          <PhraseInput
            value={voice.commonPhrases ?? []}
            onChange={val => handlePhraseChange('commonPhrases', val)}
            placeholder="Type a phrase and press Enter to add"
            accentClass="bg-teal-500/10 border-teal-500/20 text-teal-400"
          />
        </Field>

        <Field label="Phrases they would NEVER say" hint="Words or expressions completely foreign to their voice.">
          <PhraseInput
            value={voice.neverSayPhrases ?? []}
            onChange={val => handlePhraseChange('neverSayPhrases', val)}
            placeholder='"Whatever you think is best" — press Enter to add'
            accentClass="bg-red-500/10 border-red-500/20 text-red-400"
          />
        </Field>

        <Field label="Humor Style" hint="Are they sarcastic, self-deprecating, dry, absurdist, physical? Do they even have a sense of humor?">
          {ta('humorStyle', 3, 'How do they make people laugh (or try to)?')}
        </Field>
      </Section>

      {/* ── Emotional Tells ── */}
      <Section title="Emotional Tells" description="The cracks in their composure — what slips through." icon={AlertTriangle} accent="gold">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tells when lying" hint="What gives them away?">
            {ta('tellsLying', 4, 'They laugh too quickly. They over-explain…')}
          </Field>
          <Field label="Tells when stressed" hint="How does pressure manifest?">
            {ta('tellsStressed', 4, 'They clean compulsively. Their accent thickens…')}
          </Field>
        </div>
      </Section>

      {/* ── Behavioral Tactics ── */}
      <Section title="Behavioral Tactics" description="How they get what they want and survive what they fear." icon={AlertTriangle} accent="teal">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="When they want something" hint="Charm, manipulation, force, patience, indirection?">
            {ta('whenWantsSomething', 4, 'How do they pursue a goal or work another person?')}
          </Field>
          <Field label="When they feel threatened" hint="Fight, flee, freeze, appease, deflect?">
            {ta('whenThreatened', 4, "What's their instinctive response to danger?")}
          </Field>
        </div>
      </Section>

      {/* ── Voice Preview ── */}
      <VoicePreview character={character} voice={{ ...voice, ...local }} />
    </div>
  )
}
