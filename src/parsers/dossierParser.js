/**
 * dossierParser.js
 *
 * Parses an HTML dossier file into Axiom's structured DossierSchema.
 * Designed for character dossiers but the pipeline is type-agnostic so
 * faction / world / location / relic parsers can extend or replace
 * individual extraction steps later.
 *
 * Usage:
 *   import { parseDossierHtml } from '../parsers/dossierParser'
 *   const schema = parseDossierHtml(htmlString, 'Ghost_Dossier.html')
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

function text(el) {
  return el?.textContent?.trim() ?? ''
}

function slug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

/**
 * Given a parent element, return an array of { heading, body } sections
 * by splitting children at every heading tag (h1-h4).
 */
function splitAtHeadings(root) {
  const sections = []
  let current = null

  for (const node of root.children) {
    const tag = node.tagName?.toLowerCase()
    if (/^h[1-4]$/.test(tag)) {
      if (current) sections.push(current)
      current = { heading: text(node), body: '' }
    } else if (current) {
      current.body += node.textContent + '\n'
    }
  }
  if (current) sections.push(current)

  return sections.map(s => ({
    ...s,
    body: s.body.replace(/\s+\n/g, '\n').trim(),
  }))
}

/**
 * Extract all key→value pairs from a table (first col = key, second col = value)
 * or a definition list (dt → dd).
 */
function tableToKV(el) {
  const kv = {}
  if (!el) return kv
  const tag = el.tagName?.toLowerCase()

  if (tag === 'table') {
    for (const row of el.querySelectorAll('tr')) {
      const cells = row.querySelectorAll('td, th')
      if (cells.length >= 2) {
        const k = text(cells[0])
        const v = text(cells[1])
        if (k) kv[k] = v
      }
    }
  } else if (tag === 'dl') {
    let lastKey = null
    for (const child of el.children) {
      if (child.tagName?.toLowerCase() === 'dt') lastKey = text(child)
      if (child.tagName?.toLowerCase() === 'dd' && lastKey) {
        kv[lastKey] = text(child)
        lastKey = null
      }
    }
  }

  return kv
}

/**
 * Heuristic: does this text look like it belongs to an identity header?
 * Matches patterns like "CALLSIGN: Ghost" or "[Ghost]" or just a standalone
 * short bold/h1 line.
 */
function looksLikeCallsign(str) {
  return /callsign|moniker|handle|tag|alias/i.test(str)
}

function looksLikeStatTable(el) {
  if (!el) return false
  const rows = el.querySelectorAll('tr')
  if (rows.length < 2) return false
  // Stat tables typically have 2-4 columns of short values
  const firstRowCells = rows[0].querySelectorAll('td, th')
  if (firstRowCells.length < 2 || firstRowCells.length > 6) return false
  const allShort = [...rows].every(r =>
    [...r.querySelectorAll('td')].every(c => text(c).length < 60)
  )
  return allShort
}

function looksLikeEquipmentSection(heading) {
  return /weapon|gear|kit|equipment|cyber|aug|implant|mod|load.?out/i.test(heading)
}

function looksLikeRelationshipSection(heading) {
  return /associate|contact|ally|known|personnel|relation|crew|team|network/i.test(heading)
}

function looksLikeNarrativeSection(heading) {
  return /origin|background|history|narrative|bio|profile|personality|psych|combat|wound|injury|notes?/i.test(heading)
}

// ── Extractors ───────────────────────────────────────────────────────────────

/**
 * Identity: callsign, name, alias, tagline.
 * Tries multiple heuristic approaches.
 */
function extractIdentity(doc) {
  const identity = {
    callsign: '',
    name: '',
    alias: '',
    tagline: '',
  }

  // Strategy 1: look for explicit label patterns anywhere in the doc
  const allText = doc.body?.querySelectorAll('*') ?? []
  for (const el of allText) {
    const t = text(el)
    const children = el.children.length

    // Skip containers
    if (children > 3) continue

    const lower = t.toLowerCase()
    if (!identity.callsign && /^callsign[:\s]+/i.test(t)) {
      identity.callsign = t.replace(/^callsign[:\s]+/i, '').trim()
    }
    if (!identity.name && /^(full )?name[:\s]+/i.test(t)) {
      identity.name = t.replace(/^(full )?name[:\s]+/i, '').trim()
    }
    if (!identity.alias && /^alias[:\s]+/i.test(t)) {
      identity.alias = t.replace(/^alias[:\s]+/i, '').trim()
    }
    if (!identity.tagline && /^(tagline|motto|quote)[:\s]+/i.test(t)) {
      identity.tagline = t.replace(/^(tagline|motto|quote)[:\s]+/i, '').trim()
    }
  }

  // Strategy 2: first h1 = callsign or name, second h1/h2 = subtitle
  const h1s = [...doc.querySelectorAll('h1')]
  if (h1s.length > 0 && !identity.callsign && !identity.name) {
    const first = text(h1s[0])
    if (looksLikeCallsign(h1s[0].className + ' ' + first)) {
      identity.callsign = first
    } else {
      identity.name = identity.name || first
    }
  }
  if (h1s.length > 1 && !identity.name) {
    identity.name = text(h1s[1])
  }

  // Strategy 3: look for a header/banner element
  const header = doc.querySelector('header, .header, #header, .banner, .dossier-header, .identity')
  if (header) {
    const headerH = header.querySelectorAll('h1, h2, h3')
    if (headerH.length > 0 && !identity.callsign && !identity.name) {
      identity.callsign = text(headerH[0])
    }
    if (headerH.length > 1 && !identity.name) {
      identity.name = text(headerH[1])
    }
    // Look for a short italic/em/span as tagline
    const tagEl = header.querySelector('em, i, .tagline, .subtitle, blockquote')
    if (tagEl && !identity.tagline) {
      identity.tagline = text(tagEl)
    }
  }

  // Fallback: title tag
  if (!identity.name && !identity.callsign) {
    const title = doc.querySelector('title')
    if (title) identity.name = text(title)
  }

  return identity
}

/**
 * Status metadata: threat level, faction, status, etc.
 * Looks for the first table or dl near the top of the document.
 */
function extractStatusMeta(doc) {
  // Look for an explicit status/meta section
  const candidates = [
    doc.querySelector('.status, .metadata, .meta, .status-bar, .info-bar, #status, #metadata'),
    doc.querySelector('table'),
    doc.querySelector('dl'),
  ]

  for (const el of candidates) {
    if (!el) continue
    const kv = tableToKV(el)
    if (Object.keys(kv).length > 0) return kv
  }

  // Fallback: scrape key: value patterns from paragraphs in the first 20% of the doc
  const meta = {}
  const paras = [...(doc.querySelectorAll('p') ?? [])].slice(0, 10)
  for (const p of paras) {
    const t = text(p)
    const match = t.match(/^([A-Z][A-Za-z ]{1,30})[:\s]+(.+)$/)
    if (match) meta[match[1].trim()] = match[2].trim()
  }

  return meta
}

/**
 * Narrative sections: origin, combat profile, personality, etc.
 * Returns sections with heading + body text.
 * Excludes sections that look like equipment or relationship tables.
 */
function extractSections(doc) {
  const results = []
  const headings = [...doc.querySelectorAll('h2, h3')]

  for (const h of headings) {
    const heading = text(h)
    if (!heading) continue
    if (looksLikeEquipmentSection(heading)) continue
    if (looksLikeRelationshipSection(heading)) continue

    // Gather sibling content until next heading
    let body = ''
    let sibling = h.nextElementSibling
    let depth = 0
    while (sibling && depth < 20) {
      const tag = sibling.tagName?.toLowerCase()
      if (/^h[1-4]$/.test(tag)) break
      if (!looksLikeStatTable(sibling)) {
        body += text(sibling) + '\n'
      }
      sibling = sibling.nextElementSibling
      depth++
    }

    body = body.replace(/\s+\n/g, '\n').trim()
    if (body.length > 10) {
      results.push({ id: slug(heading), heading, body })
    }
  }

  return results
}

/**
 * Stat blocks: combat stats, attributes, ratings.
 * Looks for tables with short numeric/label values.
 */
function extractStatBlocks(doc) {
  const blocks = []
  const tables = [...doc.querySelectorAll('table')]

  for (const table of tables) {
    if (!looksLikeStatTable(table)) continue

    // Attempt to find a preceding heading as the group title
    let groupTitle = ''
    let prev = table.previousElementSibling
    let depth = 0
    while (prev && depth < 5) {
      if (/^h[1-4]$/.test(prev.tagName?.toLowerCase())) {
        groupTitle = text(prev)
        break
      }
      prev = prev.previousElementSibling
      depth++
    }

    const stats = []
    const rows = [...table.querySelectorAll('tr')]

    // Check if first row is a header
    const headerRow = table.querySelector('thead tr, tr:first-child')
    const headers = [...(headerRow?.querySelectorAll('th, td') ?? [])].map(text)

    for (const row of rows) {
      const cells = [...row.querySelectorAll('td')]
      if (cells.length === 0) continue

      if (cells.length === 2) {
        // Simple label → value
        stats.push({ label: text(cells[0]), value: text(cells[1]) })
      } else if (cells.length > 2 && headers.length > 0) {
        // Multi-column stat row — pair header → cell
        cells.forEach((cell, i) => {
          if (headers[i]) stats.push({ label: headers[i], value: text(cell) })
        })
      }
    }

    if (stats.length > 0) {
      blocks.push({ groupTitle: groupTitle || 'Stats', stats })
    }
  }

  return blocks
}

/**
 * Equipment and cyberware sections.
 * Returns [{ category, items: [{ name, notes }] }]
 */
function extractEquipment(doc) {
  const equipment = []
  const headings = [...doc.querySelectorAll('h2, h3')]

  for (const h of headings) {
    const heading = text(h)
    if (!looksLikeEquipmentSection(heading)) continue

    const items = []
    let sibling = h.nextElementSibling
    let depth = 0

    while (sibling && depth < 15) {
      const tag = sibling.tagName?.toLowerCase()
      if (/^h[1-4]$/.test(tag)) break

      if (tag === 'ul' || tag === 'ol') {
        for (const li of sibling.querySelectorAll('li')) {
          const t = text(li)
          // Try to split "Name — notes" or "Name: notes"
          const match = t.match(/^([^:—–\-]{2,40})[:\s—–\-]+(.*)$/)
          if (match) {
            items.push({ name: match[1].trim(), notes: match[2].trim() })
          } else {
            items.push({ name: t, notes: '' })
          }
        }
      } else if (tag === 'table') {
        for (const row of sibling.querySelectorAll('tr')) {
          const cells = [...row.querySelectorAll('td')]
          if (cells.length >= 1) {
            items.push({
              name: text(cells[0]),
              notes: cells.length > 1 ? text(cells[1]) : '',
            })
          }
        }
      } else if (tag === 'p') {
        const t = text(sibling)
        if (t.length > 2) items.push({ name: t, notes: '' })
      }

      sibling = sibling.nextElementSibling
      depth++
    }

    if (items.length > 0) {
      equipment.push({ category: heading, items })
    }
  }

  return equipment
}

/**
 * Relationships: known associates, contacts, allies.
 * Returns [{ name, role, notes }]
 */
function extractRelationships(doc) {
  const relationships = []
  const headings = [...doc.querySelectorAll('h2, h3')]

  for (const h of headings) {
    const heading = text(h)
    if (!looksLikeRelationshipSection(heading)) continue

    let sibling = h.nextElementSibling
    let depth = 0

    while (sibling && depth < 15) {
      const tag = sibling.tagName?.toLowerCase()
      if (/^h[1-4]$/.test(tag)) break

      if (tag === 'ul' || tag === 'ol') {
        for (const li of sibling.querySelectorAll('li')) {
          const t = text(li)
          const match = t.match(/^([^:—–\-]{2,40})[:\s—–\-]+(.*)$/)
          if (match) {
            relationships.push({ name: match[1].trim(), role: '', notes: match[2].trim() })
          } else {
            relationships.push({ name: t, role: '', notes: '' })
          }
        }
      } else if (tag === 'table') {
        for (const row of sibling.querySelectorAll('tr')) {
          const cells = [...row.querySelectorAll('td')]
          if (cells.length >= 2) {
            relationships.push({
              name: text(cells[0]),
              role: text(cells[1]),
              notes: cells.length > 2 ? text(cells[2]) : '',
            })
          }
        }
      }

      sibling = sibling.nextElementSibling
      depth++
    }
  }

  return relationships
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * @param {string} htmlString  Raw HTML file content
 * @param {string} fileName    Original filename (e.g. "ghost_dossier.html")
 * @returns {DossierSchema}
 */
export function parseDossierHtml(htmlString, fileName = 'dossier.html') {
  const parser  = new DOMParser()
  const doc     = parser.parseFromString(htmlString, 'text/html')

  const identity      = extractIdentity(doc)
  const statusMeta    = extractStatusMeta(doc)
  const sections      = extractSections(doc)
  const statBlocks    = extractStatBlocks(doc)
  const equipment     = extractEquipment(doc)
  const relationships = extractRelationships(doc)

  // Derive display title from identity
  const title =
    identity.callsign ||
    identity.name ||
    identity.alias ||
    fileName.replace(/\.[^.]+$/, '')

  return {
    type: 'character_dossier',
    title,
    identity,
    statusMeta,
    sections,
    statBlocks,
    equipment,
    relationships,
    rawHtml: htmlString,
    rawHtmlFileName: fileName,
  }
}

/**
 * Supported import types — extend as new parsers are added.
 * Each entry: { type, label, description, accept, parse }
 */
export const DOSSIER_TYPES = [
  {
    type: 'character_dossier',
    label: 'Character Dossier',
    description: 'Identity, stats, gear, relationships',
    icon: 'user',
  },
]
