import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import MarketingLayout, { MarketingHero, glass } from '../components/layout/MarketingLayout'
import usePageMeta from '../hooks/usePageMeta'

const CATEGORIES = [
  {
    id: 'ownership',
    title: 'Your work & ownership',
    items: [
      {
        q: 'Do I own my writing?',
        a: 'Completely. Your manuscript, characters, lore, and exports are yours. You can export Word, EPUB, PDF, plain text, or a full JSON backup at any time. Leaving Axiom never locks your stories in.',
      },
      {
        q: 'Is my manuscript used to train AI?',
        a: 'No. AI assists run through Anthropic’s Claude API under terms that do not use your content to train foundation models. Your world stays your world — we build tools around your bible, not a model on your draft.',
      },
      {
        q: 'Where is my data stored?',
        a: 'Projects sync securely via Firebase (Google Cloud). You control your account; you can export or delete content. See our Privacy Policy for the full picture.',
      },
    ],
  },
  {
    id: 'import',
    title: 'Importing & migrating',
    items: [
      {
        q: 'Can I import a book I’ve already written?',
        a: 'Yes. Paste the whole manuscript or upload DOCX, TXT, or Markdown. Axiom detects chapters and scenes, strips Word junk, and shows an editable preview before anything is saved — so you’re not stuck with one giant blob scene.',
      },
      {
        q: 'I’m coming from Scrivener / Dabble / Google Docs. Will this work?',
        a: 'Export or copy your manuscript as DOCX or plain text, then import. Axiom rebuilds chapter/scene structure and can extract characters and lore seeds from what you already wrote. You don’t need to rebuild the book by hand.',
      },
      {
        q: 'What about series and multiple books?',
        a: 'Axiom supports series architecture and continuity tracking on paid plans — so book two doesn’t quietly contradict book one. Start a project per book and link them when you’re ready.',
      },
    ],
  },
  {
    id: 'ai',
    title: 'AI & Composer',
    items: [
      {
        q: 'Will AI write my book for me?',
        a: 'No — and that’s intentional. Composer Mode is co-writing: you set intent, you get two drafts grounded in your Voice DNA and locked lore, and you choose what stays. Axiom never auto-inserts prose without your say-so.',
      },
      {
        q: 'What makes Axiom’s AI different from ChatGPT?',
        a: 'Context. Composer and refinements pull from your characters, lore bible, and scene — not a blank chat window. Locked lore acts as hard constraints so magic systems and geography stay consistent.',
      },
      {
        q: 'Do I need my own API key?',
        a: 'AI assists are included with plan quotas (varies by Free / Writer / Composer / Architect). Setup details live in Settings after you sign in. You never lose the ability to write offline of AI — the editor works without it.',
      },
    ],
  },
  {
    id: 'product',
    title: 'Using the den',
    items: [
      {
        q: 'What is the Lore Bible?',
        a: 'Your world-building database — places, magic, factions, history, rules — kept in sync with the manuscript. Flexibility can be Locked (AI must not contradict) or Flexible (AI may expand). Gaps flag terms your prose invents that don’t have entries yet.',
      },
      {
        q: 'What are plot threads?',
        a: 'Named narrative forces: mysteries, promises, conflicts, character arcs. Axiom tracks which scenes they touch and warns you when something’s gone dormant so you don’t drop a line you planted three chapters ago.',
      },
      {
        q: 'Can I write offline?',
        a: 'Axiom is a web app (installable as a PWA). A connection is required to sync and use cloud AI. Offline resilience continues to improve — always export backups before long trips without internet.',
      },
      {
        q: 'Is there a desktop app?',
        a: 'Axiom runs in the browser on Mac, Windows, Linux, and Chromebooks, and can be installed to your home screen via PWA for a more app-like feel. One project, every device you’re signed into.',
      },
    ],
  },
  {
    id: 'billing',
    title: 'Plans & billing',
    items: [
      {
        q: 'Is there really a free plan?',
        a: 'Yes. Free includes one project, the manuscript editor, characters, import, and Word export — enough to feel the den. Paid plans unlock unlimited projects, lore, threads, Composer, maps, and publishing export.',
      },
      {
        q: 'How does the free trial work?',
        a: 'Paid plans start with a 7-day free trial so you can try Writer, Composer, or Architect risk-free. Cancel before the trial ends if it’s not the right fit — your writing stays exportable either way.',
      },
      {
        q: 'What happens if I cancel?',
        a: 'You keep access through the paid period, then return to Free. Projects and data remain. Export is always available. We don’t hold manuscripts hostage.',
      },
      {
        q: 'Which plan should I pick?',
        a: 'Free to try. Writer for novels with lore and structure. Composer when you want AI co-writing, maps, covers, and publish formats. Architect when beta readers enter the room. See the Pricing page for a full matrix.',
      },
    ],
  },
]

export default function FAQ() {
  const [query, setQuery] = useState('')
  const [openKey, setOpenKey] = useState('ownership-0')

  usePageMeta({
    title: 'FAQ',
    description: 'Frequently asked questions about Axiomwriter — ownership, AI training, manuscript import, Composer Mode, pricing, and the writer’s den.',
    path: '/faq',
  })

  const q = query.trim().toLowerCase()
  const filtered = CATEGORIES.map(cat => ({
    ...cat,
    items: cat.items.filter(
      item => !q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q),
    ),
  })).filter(cat => cat.items.length > 0)

  return (
    <MarketingLayout>
      <MarketingHero
        eyebrow="FAQ"
        title="Questions authors actually ask"
        subtitle="Ownership, AI, import, the den, and billing — answered straight. Still stuck? Open Help or write us. You’re not alone at the desk."
      />

      <div className="max-w-3xl mx-auto px-5 pb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search questions…"
            className="input-base pl-11"
            style={{ background: 'rgba(10,16,28,0.7)', borderColor: 'rgba(255,255,255,0.1)' }}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 pb-16 space-y-10">
        {filtered.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-8">
            No matches. Try another word, or visit the{' '}
            <Link to="/help" className="text-gold-400 hover:text-gold-300">Help guide</Link>.
          </p>
        )}

        {filtered.map(cat => (
          <section key={cat.id}>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-500/75 mb-3 px-1">
              {cat.title}
            </h2>
            <div className="space-y-3">
              {cat.items.map((item, i) => {
                const key = `${cat.id}-${i}`
                const open = openKey === key
                return (
                  <div key={key} style={glass} className="overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenKey(open ? null : key)}
                      className="w-full text-left px-5 py-4 flex items-start justify-between gap-4"
                    >
                      <span className="font-medium text-slate-100 text-sm sm:text-base">{item.q}</span>
                      <span className={`text-gold-500/80 text-xl leading-none transition-transform flex-shrink-0 ${open ? 'rotate-45' : ''}`}>
                        +
                      </span>
                    </button>
                    {open && (
                      <div className="px-5 pb-5 pt-0">
                        <p className="text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4">
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      <section className="max-w-3xl mx-auto px-5 pb-24 text-center">
        <div style={glass} className="p-8 sm:p-10">
          <h2 className="font-serif text-2xl font-semibold text-slate-50">
            Ready to come home to the page?
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Start free — or walk through the Help guide first. No pressure. The den keeps the light on.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5">
              Start free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/help" className="btn-secondary text-sm px-6 py-2.5" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
              Read the guide
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
