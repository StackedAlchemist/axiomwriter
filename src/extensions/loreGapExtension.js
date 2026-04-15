import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export const loreGapPluginKey = new PluginKey('loreGap')

// Common English words that begin with a capital — not lore candidates
const STOP_WORDS = new Set([
  'The', 'A', 'An', 'In', 'Of', 'For', 'To', 'And', 'But', 'Or', 'Nor',
  'So', 'Yet', 'Both', 'Either', 'Neither', 'Not', 'By', 'As', 'At', 'On',
  'Up', 'If', 'It', 'Its', 'He', 'She', 'They', 'We', 'You', 'Me', 'Him',
  'Her', 'Us', 'Them', 'My', 'His', 'Our', 'Your', 'Their', 'This', 'That',
  'These', 'Those', 'Then', 'When', 'Where', 'Who', 'Which', 'What', 'How',
  'Why', 'No', 'Yes', 'There', 'Here', 'With', 'From', 'Into', 'Than',
  'After', 'Before', 'Upon', 'Over', 'Under', 'About', 'Through', 'During',
  'Without', 'Within', 'Against', 'Between', 'Among', 'While', 'Although',
  'Because', 'Since', 'Unless', 'Until', 'Once', 'Still', 'Even', 'Just',
  'Also', 'Now', 'Only', 'Very', 'Too', 'More', 'Most', 'Some', 'Such',
  'Many', 'Much', 'Few', 'All', 'Each', 'Every', 'Any', 'One', 'Two',
  'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
  'North', 'South', 'East', 'West',
  'Mr', 'Mrs', 'Ms', 'Dr', 'Sir', 'Lady', 'Lord',
  'But', 'So', 'Though', 'However', 'Therefore', 'Thus', 'Hence',
  'I', 'Oh', 'Ah', 'No', 'Yes', 'Well', 'Now',
])

function buildDecorations(doc, loreSet) {
  const decos = []

  doc.descendants((node, pos, parent, index) => {
    if (!node.isText) return true

    const text = node.text
    // Is this the first text node in a block? (likely sentence start)
    const isFirstInBlock = parent?.isBlock && index === 0

    // Match multi-word capitalized phrases, then single words
    const regex = /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\b/g
    let m
    while ((m = regex.exec(text)) !== null) {
      const term = m[1]
      const idx = m.index

      // Skip single stop words
      const words = term.split(' ')
      if (words.length === 1 && STOP_WORDS.has(term)) continue

      // Skip if this looks like a sentence start
      if (isFirstInBlock && idx === 0) continue
      const prevTwo = idx >= 2 ? text.slice(idx - 2, idx) : ''
      const prevOne = idx >= 1 ? text[idx - 1] : ''
      if (/[.!?]\s$/.test(prevTwo) || /^[.!?]$/.test(prevOne)) continue

      // Skip if already in lore bible (check full phrase and each word)
      if (loreSet.has(term.toLowerCase())) continue
      if (words.length > 1 && words.every(w => loreSet.has(w.toLowerCase()))) continue

      const from = pos + idx
      const to = from + term.length
      decos.push(
        Decoration.inline(from, to, {
          class: 'lore-gap',
          'data-lore-term': term,
        })
      )
    }
  })

  return DecorationSet.create(doc, decos)
}

/**
 * Creates a TipTap extension for lore gap detection.
 *
 * @param {React.MutableRefObject<Set<string>>} loreTermsRef  - ref holding lowercase lore titles
 * @param {React.MutableRefObject<Function>}    onGapClickRef - ref holding gap click handler
 */
export function createLoreGapExtension(loreTermsRef, onGapClickRef) {
  return Extension.create({
    name: 'loreGap',

    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: loreGapPluginKey,

          state: {
            init(_, { doc }) {
              return buildDecorations(doc, loreTermsRef.current || new Set())
            },
            apply(tr, old) {
              // Recompute if doc changed OR if we forced an update (e.g. lore terms changed)
              if (!tr.docChanged && !tr.getMeta(loreGapPluginKey)) return old
              return buildDecorations(tr.doc, loreTermsRef.current || new Set())
            },
          },

          props: {
            decorations(state) {
              return loreGapPluginKey.getState(state)
            },

            handleClick(view, _pos, event) {
              const el = event.target?.closest?.('[data-lore-term]')
              if (el && onGapClickRef?.current) {
                const term = el.getAttribute('data-lore-term')
                if (term) {
                  const rect = el.getBoundingClientRect()
                  onGapClickRef.current(term, {
                    x: rect.left + rect.width / 2,
                    y: rect.top,
                  })
                  return true
                }
              }
              return false
            },
          },
        }),
      ]
    },
  })
}
