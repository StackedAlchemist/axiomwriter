import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import usePageMeta from '../hooks/usePageMeta'
import {
  Feather, BookOpen, ScrollText, Users, GitBranch, Map as MapIcon,
  BookUp, Check, Sparkles, Upload, Wand2, ArrowRight,
} from 'lucide-react'

const glass = {
  background: 'rgba(10, 16, 28, 0.65)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '1.25rem',
  boxShadow: '0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)',
}

export default function Landing() {
  const { currentUser } = useAuth()

  usePageMeta({
    title: null, // homepage keeps the full default title
    description: 'Axiomwriter is an AI-powered writing platform for fiction authors. Paste your manuscript and get chapters, scenes, characters, and a living lore bible — AI that knows your world. Free to start.',
    path: '/',
  })

  if (currentUser) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen relative text-slate-200" style={{ background: '#080818' }}>

      {/* ── Hero background (same art as login) ── */}
      <div className="absolute inset-x-0 top-0 h-[85vh] overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/writing-desk-login.png')" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(6,11,20,0.72) 0%, rgba(6,11,20,0.60) 45%, rgba(8,8,24,0.92) 85%, #080818 100%)',
          }}
        />
        <div className="absolute inset-0 bg-noise opacity-60" />
      </div>

      {/* ── Nav ── */}
      <header className="relative z-10 max-w-6xl mx-auto flex items-center justify-between px-5 py-5">
        <Link to="/" className="flex items-center gap-2.5">
          <span
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
            style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}
          >
            <Feather className="w-5 h-5 text-gold-400" />
          </span>
          <span className="font-serif text-xl font-semibold text-slate-100">Axiomwriter</span>
        </Link>
        <nav className="flex items-center gap-3" aria-label="Main">
          <a href="#features" className="hidden sm:block text-sm text-slate-300 hover:text-gold-400 transition-colors">Features</a>
          <a href="#pricing" className="hidden sm:block text-sm text-slate-300 hover:text-gold-400 transition-colors mr-2">Pricing</a>
          <Link to="/login" className="text-sm text-slate-200 hover:text-gold-400 transition-colors px-3 py-2">Sign in</Link>
          <Link to="/signup" className="btn-primary text-sm px-4 py-2">Start free</Link>
        </nav>
      </header>

      {/* ── Hero ── */}
      <main className="relative z-10">
        <section className="max-w-4xl mx-auto text-center px-5 pt-16 pb-24 sm:pt-24">
          <h1 className="font-serif text-4xl sm:text-6xl font-semibold text-slate-50 leading-tight">
            Paste your manuscript.<br />
            <span className="text-gold-400">Get a story bible.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-300/90 max-w-2xl mx-auto leading-relaxed">
            Axiomwriter turns your draft into chapters, scenes, characters, and a living lore
            bible — with AI that knows <em>your</em> world, your cast, and your voice, not just
            your grammar.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="btn-primary text-base px-7 py-3 flex items-center gap-2">
              Start writing free <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#how" className="text-sm text-slate-300 hover:text-gold-400 transition-colors">
              See how it works ↓
            </a>
          </div>
          <p className="mt-5 text-xs text-slate-500">
            Free plan forever · 7-day free trial on paid plans · Export your work anytime
          </p>
        </section>

        {/* ── How it works ── */}
        <section id="how" className="max-w-6xl mx-auto px-5 pb-20">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-center text-slate-100">
            From draft to story bible in minutes
          </h2>
          <div className="mt-10 grid sm:grid-cols-3 gap-5">
            <Step
              icon={<Upload className="w-5 h-5 text-gold-400" />}
              n="1" title="Bring your book"
              body="Paste your whole manuscript or upload DOCX, TXT, or Markdown. Axiomwriter detects chapters and scenes automatically — Word artifacts stripped, front matter separated, with an editable preview before anything is saved."
            />
            <Step
              icon={<Sparkles className="w-5 h-5 text-gold-400" />}
              n="2" title="Meet your cast"
              body="Entity extraction finds your characters — full names, aliases, and nicknames paired to one profile — and builds character sheets and a lore bible from what you already wrote."
            />
            <Step
              icon={<Wand2 className="w-5 h-5 text-gold-400" />}
              n="3" title="Write with an AI that keeps up"
              body="Refine prose in your own voice, catch lore contradictions, track plot threads across chapters, and check structural health — all grounded in your world, not generic suggestions."
            />
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="max-w-6xl mx-auto px-5 pb-20">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-center text-slate-100">
            Everything a novel needs, in one workspace
          </h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Feature icon={<BookOpen />} title="Manuscript studio"
              body="Write straight through in chapter view with instant scene splits, or switch to corkboard, timeline, and scene-grid layouts. Focus mode and writing environments when you need to disappear into the page." />
            <Feature icon={<ScrollText />} title="Living lore bible"
              body="A world-building database that stays in sync with your manuscript. AI flags contradictions and gaps between your lore and your scenes before your readers do." />
            <Feature icon={<Users />} title="Characters & Voice DNA"
              body="Character profiles with speech patterns, vocabulary, and recurring phrases — so AI assistance writes each character in their own voice, not a generic one." />
            <Feature icon={<GitBranch />} title="Plot thread tracking"
              body="Narrative threads detected and tracked across chapters — active, resolved, or seeded — so nothing you planted gets forgotten by book three." />
            <Feature icon={<MapIcon />} title="World map builder"
              body="Paint terrain, place landmarks from a stamp library, and export your world map as PNG. Your geography lives beside your manuscript." />
            <Feature icon={<BookUp />} title="Publish-ready export"
              body="Real EPUB 3, print-ready PDF, and formatted DOCX for KDP, IngramSpark, and Draft2Digital — plus beta reader links your readers can comment on without creating an account." />
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="max-w-6xl mx-auto px-5 pb-20">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-center text-slate-100">
            Simple pricing, serious tools
          </h2>
          <p className="mt-3 text-center text-slate-400 text-sm">
            Every paid plan starts with a 7-day free trial.
          </p>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
            <Plan name="Free" price="0" blurb="Start your first book"
              features={['1 project', 'Full manuscript editor', 'Character list', 'DOCX import', 'Word export']} />
            <Plan name="Writer" price="9.99" blurb="For the working novelist"
              features={['Unlimited projects', 'All writing layouts', 'Lore Bible', 'Plot Thread Detector', 'Series continuity', 'Voice DNA', '100 AI assists / month']} />
            <Plan name="Composer" price="19.99" blurb="The full creative studio" highlight
              features={['Everything in Writer', 'Composer Mode drafting', 'Momentum engine', 'World Map Builder', 'Cover Studio', 'Publishing export (EPUB, PDF, KDP)', '1,000 AI assists / month']} />
            <Plan name="Architect" price="39.99" blurb="For authors with readers"
              features={['Everything in Composer', 'Beta reader sharing', 'Reader feedback inbox', '2,000 AI assists / month', 'Real-time collaboration (coming soon)']} />
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="max-w-3xl mx-auto px-5 pb-24">
          <h2 className="font-serif text-3xl font-semibold text-center text-slate-100">
            Questions authors ask
          </h2>
          <div className="mt-8 space-y-4">
            <Faq q="Do I own my writing?"
              a="Completely. Your manuscript is yours, and you can export everything at any time — Word, EPUB, PDF, plain text, or a full JSON backup." />
            <Faq q="Is my manuscript used to train AI?"
              a="No. AI assists run through Anthropic's Claude API, which does not train on your content. Your world stays your world." />
            <Faq q="Can I import a book I've already written?"
              a="Yes — paste the whole thing or upload a DOCX, TXT, or Markdown file. Axiomwriter detects your chapter and scene structure and shows you a preview you can adjust before importing." />
            <Faq q="What happens if I cancel?"
              a="You keep access through your paid period, then move to the Free plan. Your projects and data remain, and export is always available." />
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="max-w-3xl mx-auto text-center px-5 pb-24">
          <div style={glass} className="p-10">
            <h2 className="font-serif text-3xl font-semibold text-slate-50">
              Your world deserves better than a folder of documents.
            </h2>
            <p className="mt-4 text-slate-300/90">
              Start free, import your manuscript, and watch it become a story bible.
            </p>
            <Link to="/signup" className="btn-primary inline-flex items-center gap-2 text-base px-7 py-3 mt-7">
              Create your account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Feather className="w-4 h-4 text-gold-500/70" />
            <span>© {new Date().getFullYear()} Stacked Alchemist LLC · Mesa, Arizona</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-slate-400" aria-label="Legal">
            <Link to="/terms" className="hover:text-gold-400 transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-gold-400 transition-colors">Privacy Policy</Link>
            <Link to="/login" className="hover:text-gold-400 transition-colors">Sign in</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

function Step({ icon, n, title, body }) {
  return (
    <div style={glass} className="p-6">
      <div className="flex items-center gap-3 mb-3">
        <span
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
          style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}
        >
          {icon}
        </span>
        <span className="text-xs tracking-widest text-gold-500/80 font-medium">STEP {n}</span>
      </div>
      <h3 className="font-serif text-xl font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-400 leading-relaxed">{body}</p>
    </div>
  )
}

function Feature({ icon, title, body }) {
  return (
    <div style={glass} className="p-6">
      <span
        className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 text-gold-400 [&>svg]:w-5 [&>svg]:h-5"
        style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}
      >
        {icon}
      </span>
      <h3 className="font-serif text-lg font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-400 leading-relaxed">{body}</p>
    </div>
  )
}

function Plan({ name, price, blurb, features, highlight = false }) {
  return (
    <div
      style={{
        ...glass,
        ...(highlight ? { border: '1px solid rgba(201,168,76,0.45)', boxShadow: '0 8px 40px rgba(201,168,76,0.10), 0 8px 40px rgba(0,0,0,0.55)' } : {}),
      }}
      className="p-6 flex flex-col"
    >
      {highlight && (
        <span className="self-start text-[10px] tracking-widest font-semibold text-gold-400 bg-gold-400/10 border border-gold-400/30 rounded-full px-2.5 py-1 mb-3">
          MOST POPULAR
        </span>
      )}
      <h3 className="font-serif text-xl font-semibold text-slate-100">{name}</h3>
      <p className="text-xs text-slate-500 mt-0.5">{blurb}</p>
      <p className="mt-4 mb-5">
        <span className="text-3xl font-semibold text-slate-50">${price}</span>
        <span className="text-sm text-slate-500"> / month</span>
      </p>
      <ul className="space-y-2.5 text-sm text-slate-300/90 flex-1">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2">
            <Check className="w-4 h-4 text-gold-500/80 mt-0.5 flex-shrink-0" />
            <span className={f.includes('coming soon') ? 'text-slate-500' : undefined}>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        to="/signup"
        className={`${highlight ? 'btn-primary' : 'btn-secondary'} w-full text-center mt-6 text-sm`}
        style={highlight ? undefined : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.10)' }}
      >
        {price === '0' ? 'Start free' : 'Start 7-day trial'}
      </Link>
    </div>
  )
}

function Faq({ q, a }) {
  return (
    <details style={glass} className="p-5 group">
      <summary className="cursor-pointer font-medium text-slate-100 list-none flex items-center justify-between">
        {q}
        <span className="text-gold-500/70 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
      </summary>
      <p className="mt-3 text-sm text-slate-400 leading-relaxed">{a}</p>
    </details>
  )
}
