import { callAnthropic, extractText, DEFAULT_FAST_MODEL, DEFAULT_QUALITY_MODEL } from '../utils/buildAnthropicRequest'

/**
 * Checks whether a new lore entry contradicts existing entries using Claude.
 * Returns null if the API key is missing or the call fails.
 * Returns { hasContradiction: false } or { hasContradiction: true, conflicts: [...] }
 */
export async function checkLoreContradiction(newEntry, existingEntries) {
  if (!import.meta.env.VITE_ANTHROPIC_API_KEY || !existingEntries.length) return null

  const existingText = existingEntries
    .filter(e => e.id !== newEntry.id)
    .slice(0, 30)
    .map(e => {
      const text = (e.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 300)
      return `[${e.flexibility === 'locked' ? 'LOCKED' : 'flexible'} - ${e.category || 'General'}] ${e.title}: ${text}`
    })
    .join('\n')

  if (!existingText.trim()) return null

  const newText = (newEntry.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 500)
  if (!newText.trim()) return null

  try {
    const data = await callAnthropic({
      model:      DEFAULT_FAST_MODEL,
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `You are checking a fiction lore bible for contradictions. Review the new entry against existing entries.

EXISTING LORE:
${existingText}

NEW ENTRY:
[${newEntry.flexibility === 'locked' ? 'LOCKED' : 'flexible'} - ${newEntry.category || 'General'}] ${newEntry.title}: ${newText}

Do any facts in the new entry directly contradict existing entries? Only flag genuine factual contradictions, not style differences or omissions.

Respond ONLY with valid JSON (no markdown code blocks):
If contradictions found: {"hasContradiction": true, "conflicts": [{"existing": "brief quote from existing lore", "new": "brief quote from new entry", "explanation": "one sentence describing the conflict"}]}
If no contradictions: {"hasContradiction": false}`,
      }],
    })
    return JSON.parse(extractText(data))
  } catch {
    return null
  }
}

/**
 * Generates two distinct scene drafts (DRAFT A and DRAFT B) from the writer's intent.
 * Returns { draftA, draftB } or null on failure.
 */
export async function generateSceneDrafts({ intent, lockedLore, flexibleLore, voiceDNA, previousScene, styleNotes }) {
  if (!import.meta.env.VITE_ANTHROPIC_API_KEY) throw new Error('Anthropic API key is missing. Add VITE_ANTHROPIC_API_KEY to your .env file.')
  if (!intent?.whatMustHappen) return null

  const systemParts = [
    'You are a creative writing assistant for Axiom. Generate scene drafts from the writer\'s intent.',
  ]
  if (lockedLore)    systemParts.push(`WORLD RULES (DO NOT CONTRADICT):\n${lockedLore}`)
  if (flexibleLore)  systemParts.push(`ESTABLISHED LORE:\n${flexibleLore}`)
  if (voiceDNA)      systemParts.push(`CHARACTER VOICE DNA:\n${voiceDNA}`)
  if (previousScene) systemParts.push(`PREVIOUS SCENE CONTEXT:\n${previousScene}`)
  if (styleNotes)    systemParts.push(`PROSE STYLE:\n${styleNotes}`)

  const userContent = `SCENE INTENT:
What must happen: ${intent.whatMustHappen}
POV character: ${intent.povCharacter || 'Not specified'}
Emotional tone: ${intent.emotionalTone || 'Not specified'}
Reader should feel: ${intent.readerFeeling || 'Not specified'}
Scene role: ${intent.sceneRole || 'Not specified'}
Characters present: ${intent.characters || 'Not specified'}
Location: ${intent.location || 'Not specified'}
Specific beats/dialogue: ${intent.dialogueBeats || 'None'}

Generate exactly 2 drafts, each 400-800 words. Start each with "DRAFT A:" or "DRAFT B:" on its own line. Make them genuinely different in structure, opening, and approach — not minor variations.`

  try {
    const data = await callAnthropic({
      model:      DEFAULT_QUALITY_MODEL,
      max_tokens: 4096,
      system:     systemParts.join('\n\n'),
      messages:   [{ role: 'user', content: userContent }],
    })
    const raw = extractText(data)

    const aMatch = raw.match(/DRAFT A:([\s\S]*?)(?=DRAFT B:|$)/i)
    const bMatch = raw.match(/DRAFT B:([\s\S]*)/i)
    return {
      draftA: aMatch?.[1]?.trim() ?? raw,
      draftB: bMatch?.[1]?.trim() ?? '',
    }
  } catch (err) {
    console.error('[generateSceneDrafts]', err)
    throw err
  }
}

/**
 * Scans a scene for potential new plot threads (mysteries, promises, conflicts, etc.).
 * Returns an array of { title, description, type } objects, or [] on failure.
 */
export async function detectNewThreads(sceneHtml, existingThreadTitles = []) {
  if (!import.meta.env.VITE_ANTHROPIC_API_KEY) return []

  const text = (sceneHtml || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 2000)

  if (text.trim().length < 80) return []

  const existingList = existingThreadTitles.slice(0, 20).join(', ')

  try {
    const data = await callAnthropic({
      model:      DEFAULT_FAST_MODEL,
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `You are a story analyst. Scan this scene excerpt for NEW unresolved narrative elements that could become forgotten plot threads.

SCENE:
${text}

EXISTING TRACKED THREADS (skip these):
${existingList || 'None'}

Look for:
- Unanswered mysteries or questions raised
- Foreshadowing or promises to the reader
- New significant characters introduced
- Unresolved conflicts or tensions

Return ONLY a JSON array (no markdown, no extra text). Max 3 items. If nothing new, return [].
Format: [{"title":"short title","description":"one sentence","type":"mystery|promise|character|conflict"}]`,
      }],
    })
    const raw   = extractText(data)
    const match = raw.match(/\[[\s\S]*\]/)
    if (!match) return []
    const parsed = JSON.parse(match[0])
    return Array.isArray(parsed) ? parsed.slice(0, 3) : []
  } catch {
    return []
  }
}

/**
 * Generates a natural-language momentum spike suggestion for a character.
 * Returns a short message string, or null on failure.
 */
export async function generateMomentumSuggestion(character, score, previousScore, appearsInCount) {
  if (!import.meta.env.VITE_ANTHROPIC_API_KEY || !character?.name) return null

  const diff = score - previousScore
  try {
    const data = await callAnthropic({
      model:      DEFAULT_FAST_MODEL,
      max_tokens: 120,
      messages: [{
        role: 'user',
        content: `You are a writing assistant for a fiction app. A character named "${character.name}" has shown a momentum spike: their score rose from ${previousScore} to ${score} (a +${diff} point jump). They appear in ${appearsInCount} scenes. They are currently labeled as a "${character.role || 'supporting'}" character.

Write ONE short, warm suggestion (max 20 words) for the writer that they might be growing into a larger role. Be specific about the character's name. No quotes, no period at end.`,
      }],
    })
    return extractText(data).replace(/[."']+$/, '')
  } catch {
    return null
  }
}

/**
 * Analyzes manuscript chapters for structural issues using Claude.
 * Returns array of findings: [{ type, severity, sceneId, chapterId, message, suggestion }]
 */
export async function analyzeStructuralIssues(chapters, sceneContents, checkTypes, sensitivity) {
  if (!import.meta.env.VITE_ANTHROPIC_API_KEY || !checkTypes.length) return []

  function strip(html) { return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() }
  function words(text) { return text.split(/\s+/).filter(Boolean).length }

  const worldTermsLimit = sensitivity === 'strict' ? 3 : sensitivity === 'light' ? 8 : 5

  const checkDescMap = {
    pov_consistency:     'Head-hopping (POV shift within a scene without section break). POV character knowing things they couldn\'t know.',
    world_terms:         `More than ${worldTermsLimit} unique invented/world-specific proper nouns introduced per chapter.`,
    flashback:           'Flashback interrupting a scene at high tension without adequate transition.',
    character_grounding: 'New POV character not physically described or situated within first 300 words.',
  }

  const checksText = checkTypes.map(ct => `- ${ct}: ${checkDescMap[ct] || ct}`).join('\n')

  // Compact chapter data (limit to 8 chapters, 500 chars per scene)
  const chapData = chapters.slice(0, 8).map(ch => ({
    id:    ch.id,
    title: ch.title || 'Untitled',
    scenes: (ch.scenes || []).slice(0, 8).map(s => {
      const text = strip(sceneContents[s.id] || '')
      return {
        id:       s.id,
        title:    s.title || 'Untitled',
        pov:      s.povCharacter || null,
        words:    words(text),
        first300: text.substring(0, 300),
        excerpt:  text.substring(0, 500),
      }
    }),
  }))

  try {
    const data = await callAnthropic({
      model:      DEFAULT_FAST_MODEL,
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `You are a developmental editor. Analyze this manuscript data for structural issues ONLY.

CHECK FOR:
${checksText}

SENSITIVITY: ${sensitivity}

MANUSCRIPT DATA:
${JSON.stringify(chapData, null, 1)}

Return ONLY valid JSON — no markdown, no explanation.
Max 2 findings per check type. Be constructive, never harsh. NEVER comment on grammar or prose style.
If nothing found return: {"findings":[]}

Format:
{"findings":[{"type":"check_type_key","severity":"warning|info","sceneId":"id_or_null","chapterId":"id","message":"brief specific observation","suggestion":"constructive 1-2 sentence suggestion"}]}`,
      }],
    })
    const raw   = extractText(data)
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return []
    const parsed = JSON.parse(match[0])
    return Array.isArray(parsed.findings) ? parsed.findings : []
  } catch {
    return []
  }
}

/**
 * Refines a selected passage per the given instruction.
 * Returns the refined text string, or null on failure.
 */
export async function refineText({ selectedText, instruction, characterName, voiceDNA }) {
  if (!import.meta.env.VITE_ANTHROPIC_API_KEY || !selectedText?.trim()) return null

  const system = voiceDNA
    ? `You are a creative writing assistant. Refine prose per instruction.\n\nVOICE DNA for ${characterName}:\n${voiceDNA}\n\nReturn ONLY the refined text — no labels, no explanation.`
    : 'You are a creative writing assistant. Refine prose per instruction. Return ONLY the refined text — no labels, no explanation.'

  try {
    const data = await callAnthropic({
      model:      DEFAULT_FAST_MODEL,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: `INSTRUCTION: ${instruction}\n\nORIGINAL:\n${selectedText}` }],
    })
    return extractText(data)
  } catch (err) {
    console.error('[refineText]', err)
    return null
  }
}
