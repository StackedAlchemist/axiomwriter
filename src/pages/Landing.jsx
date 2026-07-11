import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import usePageMeta from '../hooks/usePageMeta'
import { MarketingNav, MarketingFooter, glass } from '../components/layout/MarketingLayout'
import {
  BookOpen, ScrollText, Users, GitBranch, Map as MapIcon,
  BookUp, Check, Sparkles, Upload, Wand2, ArrowRight, PenLine, Zap,
  Layers, Globe, Heart, Shield, Download,
} from 'lucide-react'

const glassSoft = {
  ...glass,
  background: 'rgba(10, 16, 28, 0.55)',
}

export default function Landing() {
  const { currentUser } = useAuth()

  usePageMeta({
    title: null,
    description: 'Axiomwriter is an AI-powered writing platform for fiction authors. Paste your manuscript and get chapters, scenes, characters, and a living lore bible — AI that knows your world. Free to start.',
    path: '/',
  })

  if (currentUser) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen relative text-slate-200" style={{ background: '#07060f' }}>

      {/* ── Hero background (same art as login) ── */}
      <div className="absolute inset-x-0 top-0 h-[90vh] overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/writing-desk-login.png')" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(6,11,20,0.72) 0%, rgba(6,11,20,0.58) 40%, rgba(7,6,15,0.92) 82%, #07060f 100%)',
          }}
        />
        <div className="absolute inset-0 bg-noise opacity-60" />
      </div>

      <MarketingNav />

      <main className="relative z-10">

        {/* ── Hero ── */}
        <section className="max-w-4xl mx-auto text-center px-5 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-500/80 mb-5">
            The writer's den
          </p>
          <h1 className="font-serif text-4xl sm:text-6xl font-semibold text-slate-50 leading-tight tracking-tight">
            Paste your manuscript.<br />
            <span className="text-gold-400">Get a story bible.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-300/90 max-w-2xl mx-auto leading-relaxed">
            Axiomwriter is a home for fiction — chapters, scenes, characters, and a living lore
            bible, with AI that knows <em>your</em> world, your cast, and your voice.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="btn-primary text-base px-7 py-3 flex items-center gap-2">
              Start writing free <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#showcase" className="text-sm text-slate-300 hover:text-gold-400 transition-colors">
              See the den ↓
            </a>
          </div>
          <p className="mt-5 text-xs text-slate-500">
            Free plan forever · 7-day free trial on paid plans · Export your work anytime
          </p>
        </section>

        {/* ── Showcase product cards (competitor-style selling demos) ── */}
        <section id="showcase" className="max-w-6xl mx-auto px-5 pb-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-500/75 mb-3">
              Why writers stay
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-100 tracking-tight">
              Not another blank page.<br className="hidden sm:block" />
              <span className="text-gold-400"> A full creative den.</span>
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-400 leading-relaxed">
              Competitors show feature lists. We show the work. Three windows into what
              Axiom feels like before you ever sign up.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <ShowcaseWriting />
            <ShowcaseComposer />
            <ShowcaseWorld />
          </div>

          {/* Secondary selling strip */}
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            <MiniSell
              icon={<Layers className="w-4 h-4" />}
              title="Layouts that fit the phase"
              body="Linear for drafting. Corkboard, timeline, and scene grid when you're shaping the book."
            />
            <MiniSell
              icon={<GitBranch className="w-4 h-4" />}
              title="Threads that don't go cold"
              body="Plot lines tracked across scenes — so the mystery you planted in chapter two still pays off."
            />
            <MiniSell
              icon={<BookUp className="w-4 h-4" />}
              title="Export when you're ready"
              body="EPUB, print PDF, DOCX for KDP and beyond. Your manuscript never gets locked in."
            />
          </div>
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
              body="Paste your whole manuscript or upload DOCX, TXT, or Markdown. Axiom detects chapters and scenes automatically — Word artifacts stripped, with an editable preview before anything is saved."
            />
            <Step
              icon={<Sparkles className="w-5 h-5 text-gold-400" />}
              n="2" title="Meet your cast"
              body="Entity extraction finds your characters — full names, aliases, nicknames — and builds character sheets and a lore bible from what you already wrote."
            />
            <Step
              icon={<Wand2 className="w-5 h-5 text-gold-400" />}
              n="3" title="Write with AI that keeps up"
              body="Composer Mode drafts in your voice, lore stays consistent, threads stay alive, structure stays honest — grounded in your world, not generic prompts."
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
              body="Write scene by scene or straight through a chapter. Instant scene splits, focus mode, and writing environments when you need the room to disappear." />
            <Feature icon={<ScrollText />} title="Living lore bible"
              body="A world-building database that stays in sync with your prose. AI flags contradictions and gaps between lore and scenes before readers do." />
            <Feature icon={<Users />} title="Characters & Voice DNA"
              body="Speech patterns, vocabulary, and verbal tics — so assistance writes each character in their own voice, not a generic one." />
            <Feature icon={<GitBranch />} title="Plot thread tracking"
              body="Narrative threads detected and tracked across chapters — active, resolved, or seeded — so nothing you planted gets forgotten by book three." />
            <Feature icon={<MapIcon />} title="World map builder"
              body="Paint terrain, place landmarks, export as PNG. Your geography lives beside your manuscript, not in a separate folder." />
            <Feature icon={<BookUp />} title="Publish-ready export"
              body="Real EPUB 3, print-ready PDF, and formatted DOCX — plus beta reader links your readers can open without an account." />
          </div>
        </section>

        {/* ── Trust strip ── */}
        <section className="max-w-6xl mx-auto px-5 pb-16">
          <div className="grid sm:grid-cols-3 gap-4">
            <TrustPill icon={<Shield className="w-4 h-4" />} title="Your words stay yours"
              body="Export anytime. AI does not train on your manuscript." />
            <TrustPill icon={<Download className="w-4 h-4" />} title="Bring the book you already have"
              body="Paste or upload. Chapters and scenes detected before save." />
            <TrustPill icon={<Heart className="w-4 h-4" />} title="Built for fiction, not memos"
              body="Cast, lore, threads, and Composer that know this world." />
          </div>
        </section>

        {/* ── Pricing teaser ── */}
        <section id="pricing" className="max-w-6xl mx-auto px-5 pb-16">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-100">
              Simple pricing, serious tools
            </h2>
            <p className="mt-3 text-slate-400 text-sm">
              Free forever to start. Paid plans include a 7-day free trial.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
            <Plan name="Free" price="0" blurb="Start your first book"
              features={['1 project', 'Full manuscript editor', 'Character list', 'DOCX import', 'Word export']} />
            <Plan name="Writer" price="9.99" blurb="For the working novelist"
              features={['Unlimited projects', 'All writing layouts', 'Lore Bible', 'Plot Thread Detector', 'Series continuity', 'Voice DNA', '100 AI assists / month']} />
            <Plan name="Composer" price="19.99" blurb="The full creative studio" highlight
              features={['Everything in Writer', 'Composer Mode drafting', 'Momentum engine', 'World Map Builder', 'Cover Studio', 'Publishing export (EPUB, PDF, KDP)', '1,000 AI assists / month']} />
            <Plan name="Architect" price="39.99" blurb="For authors with readers"
              features={['Everything in Composer', 'Beta reader sharing', 'Reader feedback inbox', '2,000 AI assists / month', 'Real-time collaboration (coming soon)']} />
          </div>
          <p className="mt-8 text-center">
            <Link to="/pricing" className="text-sm text-gold-400 hover:text-gold-300 transition-colors">
              Full comparison & who each plan is for →
            </Link>
          </p>
        </section>

        {/* ── FAQ teaser ── */}
        <section className="max-w-3xl mx-auto px-5 pb-16">
          <h2 className="font-serif text-3xl font-semibold text-center text-slate-100">
            Questions before you step in
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500 mb-8">
            Straight answers. Deeper archive on the FAQ page.
          </p>
          <div className="space-y-3">
            <Faq q="Do I own my writing?"
              a="Completely. Export Word, EPUB, PDF, plain text, or a full backup anytime. We never hold manuscripts hostage." />
            <Faq q="Is my manuscript used to train AI?"
              a="No. Assists run through Anthropic’s Claude API under terms that do not train on your content. Your world stays your world." />
            <Faq q="Can I import a book I’ve already written?"
              a="Yes — paste or upload DOCX, TXT, or Markdown. Preview chapters and scenes before anything is saved." />
            <Faq q="What happens if I cancel?"
              a="Access through the paid period, then Free. Projects remain. Export always available." />
          </div>
          <p className="mt-6 text-center">
            <Link to="/faq" className="text-sm text-gold-400 hover:text-gold-300 transition-colors">
              Browse the full FAQ →
            </Link>
          </p>
        </section>

        {/* ── Final invitation (not a lazy footer dump) ── */}
        <section className="max-w-4xl mx-auto px-5 pb-20">
          <div
            className="relative overflow-hidden p-10 sm:p-14 text-center"
            style={{
              ...glass,
              borderRadius: '1.5rem',
              border: '1px solid rgba(201,168,76,0.22)',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                background:
                  'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(201,168,76,0.12), transparent 65%)',
              }}
              aria-hidden="true"
            />
            <p className="relative text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-500/80 mb-4">
              Welcome home, author
            </p>
            <h2 className="relative font-serif text-3xl sm:text-4xl font-semibold text-slate-50 tracking-tight">
              Your world deserves better<br className="hidden sm:block" /> than a folder of documents.
            </h2>
            <p className="relative mt-5 text-slate-300/90 max-w-xl mx-auto leading-relaxed">
              Come in. Bring the draft you already love — or a blank first page.
              We’ll help you build the fantasy, keep the lore honest, and leave with every word still yours.
            </p>
            <div className="relative mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/signup" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3">
                Open the den free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/help" className="text-sm text-slate-400 hover:text-gold-400 transition-colors px-4 py-2">
                How it works first →
              </Link>
            </div>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
              <Link to="/about" className="hover:text-gold-400 transition-colors">About us</Link>
              <span className="text-slate-700">·</span>
              <Link to="/pricing" className="hover:text-gold-400 transition-colors">Pricing</Link>
              <span className="text-slate-700">·</span>
              <Link to="/faq" className="hover:text-gold-400 transition-colors">FAQ</Link>
              <span className="text-slate-700">·</span>
              <Link to="/login" className="hover:text-gold-400 transition-colors">Sign in</Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}

function TrustPill({ icon, title, body }) {
  return (
    <div style={glassSoft} className="p-5 flex gap-3.5">
      <span
        className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-gold-400 flex-shrink-0"
        style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.22)' }}
      >
        {icon}
      </span>
      <div>
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        <p className="mt-1 text-xs text-slate-400 leading-relaxed">{body}</p>
      </div>
    </div>
  )
}

// ── Showcase cards — visual product demos ─────────────────────────────────────

function ShowcaseCard({ badge, icon, title, tagline, children, accent = '201,168,76' }) {
  return (
    <article
      className="group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        ...glass,
        borderRadius: '1.35rem',
        boxShadow: `0 12px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(${accent},0.08), inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {/* Live mock window */}
      <div className="relative px-3 pt-3 pb-0">
        <div
          className="rounded-xl overflow-hidden border"
          style={{
            borderColor: `rgba(${accent},0.18)`,
            background: 'rgba(6, 8, 18, 0.95)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            minHeight: 200,
          }}
        >
          {children}
        </div>
      </div>

      {/* Copy */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2.5">
          <span
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gold-400"
            style={{ background: `rgba(${accent},0.12)`, border: `1px solid rgba(${accent},0.25)` }}
          >
            {icon}
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: `rgba(${accent},0.85)` }}
          >
            {badge}
          </span>
        </div>
        <h3 className="font-serif text-xl font-semibold text-slate-50 tracking-tight">{title}</h3>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed flex-1">{tagline}</p>
      </div>
    </article>
  )
}

function ShowcaseWriting() {
  return (
    <ShowcaseCard
      badge="The writing desk"
      icon={<PenLine className="w-4 h-4" />}
      title="Write like the page is already waiting"
      tagline="Full-width manuscript, chapter tree beside you, scenes that split when the story does. Border-to-border prose under a calm command bar — the den, not a cramped box."
      accent="201,168,76"
    >
      {/* Mini writing UI mock */}
      <div className="flex h-[210px]">
        {/* Binder */}
        <div className="w-[72px] sm:w-[88px] flex-shrink-0 border-r border-white/5 px-1.5 py-2 space-y-1" style={{ background: 'rgba(12,10,22,0.9)' }}>
          <div className="text-[7px] uppercase tracking-wider text-slate-600 px-1 mb-1.5">Ch. 3</div>
          {['The Crossing', 'Emberfall', 'Night Watch'].map((t, i) => (
            <div
              key={t}
              className="rounded px-1.5 py-1 text-[8px] truncate"
              style={i === 1
                ? { background: 'rgba(201,168,76,0.15)', color: '#d4b865' }
                : { color: '#6b7280' }}
            >
              {t}
            </div>
          ))}
          <div className="text-[7px] text-slate-700 px-1 pt-1">+ scene</div>
        </div>
        {/* Editor */}
        <div className="flex-1 min-w-0 flex flex-col px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-2 opacity-50">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            <span className="text-[8px] text-slate-500">Drafted · 1.2k words</span>
          </div>
          <p className="font-serif text-[11px] sm:text-[12px] text-slate-200/90 leading-[1.65]">
            The rain on the glass did not ask permission. Lyra pressed her palm to the cold
            and watched the city smear — every light a wound that refused to close.
          </p>
          <p className="font-serif text-[11px] sm:text-[12px] text-slate-400/80 leading-[1.65] mt-2 line-clamp-3">
            Behind her, the compass on the desk spun once, twice — then stopped, pointed
            somewhere maps had never named.
          </p>
          {/* Caret */}
          <span className="inline-block w-0.5 h-3.5 bg-gold-400 mt-1 animate-pulse" aria-hidden="true" />
        </div>
      </div>
    </ShowcaseCard>
  )
}

function ShowcaseComposer() {
  return (
    <ShowcaseCard
      badge="Composer Mode"
      icon={<Zap className="w-4 h-4" />}
      title="Two drafts. Your voice. Your choice."
      tagline="Composer is co-writing, not takeover — intent in, two scene drafts out, both grounded in your lore and Voice DNA. Accept, edit, or steal a sentence. You stay the author."
      accent="45,212,191"
    >
      <div className="h-[210px] flex flex-col px-2.5 py-2.5">
        {/* Intent bar */}
        <div className="rounded-lg px-2.5 py-1.5 mb-2 flex items-center gap-2" style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)' }}>
          <Sparkles className="w-3 h-3 text-teal-400 flex-shrink-0" />
          <span className="text-[9px] text-teal-300/90 truncate">
            Intent: Lyra discovers the compass lies — tension, not exposition
          </span>
        </div>
        {/* Dual drafts */}
        <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
          <div className="rounded-lg p-2 flex flex-col" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.22)' }}>
            <span className="text-[8px] font-semibold text-gold-400 tracking-wide mb-1.5">DRAFT A</span>
            <p className="text-[9px] text-slate-400 leading-snug flex-1 line-clamp-6">
              She almost laughed. The needle did not tremble toward north — it pointed at the
              scar on her wrist, as if the world had been measuring her the whole time.
            </p>
            <span className="mt-1.5 text-[8px] font-medium text-gold-500/80">Accept →</span>
          </div>
          <div className="rounded-lg p-2 flex flex-col" style={{ background: 'rgba(45,212,191,0.05)', border: '1px solid rgba(45,212,191,0.18)' }}>
            <span className="text-[8px] font-semibold text-teal-400 tracking-wide mb-1.5">DRAFT B</span>
            <p className="text-[9px] text-slate-400 leading-snug flex-1 line-clamp-6">
              The compass settled with a soft click. South. Then west. Then, impossibly,
              into the floorboards — toward something buried under the house.
            </p>
            <span className="mt-1.5 text-[8px] font-medium text-teal-500/80">Accept →</span>
          </div>
        </div>
      </div>
    </ShowcaseCard>
  )
}

function ShowcaseWorld() {
  return (
    <ShowcaseCard
      badge="Story bible"
      icon={<Globe className="w-4 h-4" />}
      title="A world that stays consistent"
      tagline="Characters, lore, and threads live beside the manuscript. Import a draft and watch Axiom build the cast and bible — then keep every chapter honest to the rules you set."
      accent="158,125,212"
    >
      <div className="h-[210px] flex flex-col px-2.5 py-2.5 gap-2">
        {/* Character chips */}
        <div className="flex gap-1.5">
          {[
            { name: 'Lyra', role: 'Protagonist', c: '#c9a84c' },
            { name: 'Edran', role: 'Antagonist', c: '#ef4444' },
            { name: 'Mira', role: 'Supporting', c: '#2dd4bf' },
          ].map(ch => (
            <div
              key={ch.name}
              className="flex-1 rounded-lg px-1.5 py-1.5 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${ch.c}33` }}
            >
              <div
                className="w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center text-[8px] font-semibold"
                style={{ background: `${ch.c}22`, color: ch.c, border: `1px solid ${ch.c}44` }}
              >
                {ch.name[0]}
              </div>
              <div className="text-[8px] font-medium text-slate-300 truncate">{ch.name}</div>
              <div className="text-[7px] text-slate-600 truncate">{ch.role}</div>
            </div>
          ))}
        </div>
        {/* Lore row */}
        <div className="rounded-lg px-2.5 py-2 flex-1" style={{ background: 'rgba(158,125,212,0.06)', border: '1px solid rgba(158,125,212,0.18)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[8px] font-semibold text-purple-400 tracking-wide">LORE · LOCKED</span>
            <span className="text-[7px] text-slate-600">Magic system</span>
          </div>
          <p className="text-[9px] text-slate-400 leading-snug">
            Compass-bound magic answers only to blood that has crossed a threshold willingly.
            Coercion breaks the needle.
          </p>
        </div>
        {/* Thread alert */}
        <div className="rounded-lg px-2.5 py-1.5 flex items-center gap-2" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
          <GitBranch className="w-3 h-3 text-orange-400 flex-shrink-0" />
          <span className="text-[8px] text-orange-300/90 truncate">
            Thread “Who sold the maps?” — dormant 6 scenes
          </span>
        </div>
      </div>
    </ShowcaseCard>
  )
}

function MiniSell({ icon, title, body }) {
  return (
    <div style={glassSoft} className="p-4 sm:p-5 flex gap-3">
      <span
        className="inline-flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 text-gold-400"
        style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.22)' }}
      >
        {icon}
      </span>
      <div>
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        <p className="mt-1 text-xs text-slate-400 leading-relaxed">{body}</p>
      </div>
    </div>
  )
}

// ── Existing section helpers ──────────────────────────────────────────────────

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
    <div style={glass} className="p-6 transition-transform duration-200 hover:-translate-y-0.5">
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
