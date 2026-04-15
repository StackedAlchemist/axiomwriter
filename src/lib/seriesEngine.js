/**
 * Series Engine
 * - Cross-book continuity checking via Claude
 * - Series context builder for ComposerPanel integration
 */

import { callAnthropic, extractText, DEFAULT_FAST_MODEL } from '../utils/buildAnthropicRequest'

function strip(html = '') {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// ── Continuity check across books ────────────────────────────────────────────

/**
 * Asks Claude to identify continuity contradictions between books in a series.
 *
 * @param {object} params
 * @param {object} params.series - series document
 * @param {object[]} params.sortedBooks - books sorted by bookNumber
 * @param {object}  params.bookData  - { [projectId]: { project, characters, lore, threads } }
 * @returns {Promise<{issues: Array<{type, bookA, bookB, description}>, summary: string}>}
 */
export async function checkContinuity({ series, sortedBooks, bookData }) {
  if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
    return { issues: [], summary: 'No API key configured.' }
  }

  // Build context: character facts per book
  const bookContexts = sortedBooks.map(book => {
    const data = bookData[book.projectId]
    if (!data?.project) return null

    const chars = (data.characters || [])
      .filter(c => ['protagonist', 'antagonist', 'major'].includes(c.role))
      .map(c => {
        const phys = c.physicalDescription || {}
        return `  ${c.name} (${c.role}): age=${phys.age || '?'}, ` +
          `status=${data.threads?.some(t => t.title?.toLowerCase().includes(c.name.toLowerCase()) && t.status === 'resolved') ? 'arc resolved' : 'active'}, ` +
          `arc="${strip(c.arcSummary || '').slice(0, 120)}"`
      })
      .join('\n')

    const loreKeys = (data.lore || [])
      .filter(e => e.flexibility === 'locked')
      .map(e => `  [${e.category}] ${e.title}: ${strip(e.content).slice(0, 150)}`)
      .join('\n')

    return `BOOK ${book.bookNumber} — "${book.title}":
Characters:
${chars || '  (none)'}
Locked world facts:
${loreKeys || '  (none)'}`
  }).filter(Boolean)

  if (bookContexts.length < 2) {
    return { issues: [], summary: 'Need at least two books with data to check continuity.' }
  }

  const prompt = `You are a professional series editor. Review the following book series data and identify SPECIFIC continuity contradictions or risks.

SERIES: "${series.name}" (${series.genre})

${bookContexts.join('\n\n')}

Look for:
1. Character age/physical changes that don't make sense chronologically
2. Characters who died or completed arcs reappearing without explanation
3. World facts that contradict between books (geography, rules, history)
4. Plot threads opened in an earlier book never mentioned again
5. Character relationships that changed without apparent cause

Return valid JSON ONLY:
{
  "issues": [
    {
      "type": "character" | "world" | "plot" | "relationship",
      "severity": "error" | "warning",
      "bookA": 1,
      "bookB": 2,
      "description": "Specific description of the contradiction"
    }
  ],
  "summary": "1-2 sentence overall assessment"
}`

  try {
    const data  = await callAnthropic({
      model:      DEFAULT_FAST_MODEL,
      max_tokens: 800,
      messages:   [{ role: 'user', content: prompt }],
    })
    const raw   = extractText(data)
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return { issues: [], summary: 'Could not parse response.' }
    return JSON.parse(match[0])
  } catch (err) {
    console.error('[checkContinuity]', err)
    return { issues: [], summary: 'Continuity check error.' }
  }
}

// ── Series context builder (for ComposerPanel) ───────────────────────────────

/**
 * Builds a cross-book context string for Claude when composing in a series book.
 * Includes: series lore + all prior books' established lore + prior book arcs.
 *
 * @param {object[]} seriesLoreEntries - entries from series/{seriesId}/lore
 * @param {object[]} priorBooks - books that come before the current one (sorted)
 * @param {object}   bookData   - { [projectId]: { characters, lore } }
 * @returns {string}
 */
export function buildSeriesContext(seriesLoreEntries, priorBooks, bookData) {
  const lines = []

  // Series-level lore
  if (seriesLoreEntries?.length) {
    lines.push('=== SERIES LORE (applies to all books) ===')
    const locked   = seriesLoreEntries.filter(e => e.flexibility === 'locked')
    const flexible = seriesLoreEntries.filter(e => e.flexibility !== 'locked')
    if (locked.length) {
      lines.push('ESTABLISHED SERIES FACTS (do not contradict):')
      locked.forEach(e => lines.push(`[${e.category}] ${e.title}: ${strip(e.content).slice(0, 250)}`))
    }
    if (flexible.length) {
      lines.push('SERIES WORLD DETAILS (can expand):')
      flexible.forEach(e => lines.push(`[${e.category}] ${e.title}: ${strip(e.content).slice(0, 120)}`))
    }
  }

  // Prior books' established facts
  priorBooks.forEach(book => {
    const data = bookData?.[book.projectId]
    if (!data) return

    lines.push(`\n=== BOOK ${book.bookNumber} — "${book.title}" (ESTABLISHED) ===`)

    // Returning characters with their arcs
    const major = (data.characters || []).filter(c =>
      ['protagonist', 'antagonist', 'major'].includes(c.role)
    )
    if (major.length) {
      lines.push('RETURNING CHARACTERS:')
      major.forEach(c => {
        const phys = c.physicalDescription || {}
        lines.push(
          `${c.name} (${c.role}): ` +
          [phys.age && `age ${phys.age}`, phys.build, phys.hairColor && `${phys.hairColor} hair`].filter(Boolean).join(', ') +
          (c.arcSummary ? ` | Arc: ${strip(c.arcSummary).slice(0, 200)}` : '')
        )
      })
    }

    // Locked lore from this book
    const lockedLore = (data.lore || []).filter(e => e.flexibility === 'locked')
    if (lockedLore.length) {
      lines.push('ESTABLISHED FACTS FROM THIS BOOK:')
      lockedLore.forEach(e => lines.push(`[${e.category}] ${e.title}: ${strip(e.content).slice(0, 200)}`))
    }
  })

  return lines.join('\n')
}
