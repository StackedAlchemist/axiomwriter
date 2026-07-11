import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BookOpen, Feather, GitBranch, Globe, PenLine, Sparkles,
  Upload, Users, Zap, BookUp, Layers,
} from 'lucide-react'
import MarketingLayout, { MarketingHero, glass } from '../components/layout/MarketingLayout'
import usePageMeta from '../hooks/usePageMeta'

const STEPS = [
  {
    n: '01',
    icon: Upload,
    title: 'Bring your draft home',
    body: 'Create a project, then paste a manuscript or upload DOCX / TXT / Markdown. Review the chapter and scene tree before you commit — nothing lands as a surprise blob.',
  },
  {
    n: '02',
    icon: PenLine,
    title: 'Write at the desk',
    body: 'Open a scene and write full-width. Use the manuscript binder for chapters and scenes. Double-click titles to rename. Auto-save keeps pace while you think.',
  },
  {
    n: '03',
    icon: Users,
    title: 'Know your cast',
    body: 'Add characters or import names from the manuscript. Fill Voice DNA so dialogue assistance sounds like them. Keep quick-ref open while you draft.',
  },
  {
    n: '04',
    icon: BookOpen,
    title: 'Build the lore bible',
    body: 'Locations, magic, factions, rules — lock what must never break. Lore gaps highlight terms in prose that still need a canonical answer.',
  },
  {
    n: '05',
    icon: GitBranch,
    title: 'Track the threads',
    body: 'Mysteries, promises, conflicts, arcs. Link them to scenes. Axiom warns when a thread goes quiet so payoffs don’t vanish into the middle of the book.',
  },
  {
    n: '06',
    icon: Zap,
    title: 'Unstick with Composer',
    body: 'Set scene intent, generate two drafts grounded in your bible, accept or remix. Co-writing — you remain the author of record.',
  },
]

const TOPICS = [
  {
    icon: Layers,
    title: 'Layouts',
    body: 'Linear for drafting. Corkboard, scene grid, timeline, and threads view when you’re shaping structure. Switch anytime — same data underneath.',
  },
  {
    icon: Globe,
    title: 'World map',
    body: 'Paint terrain, drop stamps, export PNG. Geography lives next to the manuscript so “three days north” has a place to point.',
  },
  {
    icon: BookUp,
    title: 'Publish & export',
    body: 'DOCX anytime. Paid plans unlock EPUB, print PDF, cover studio, and reader links for beta feedback without forcing accounts on your readers.',
  },
  {
    icon: Sparkles,
    title: 'In-app Codex',
    body: 'Once you’re signed in, open Codex from the sidebar for illustrated, feature-by-feature guides — Writing Scenes, Characters, Threads, Composer, and more.',
  },
]

export default function Help() {
  usePageMeta({
    title: 'Help Guide',
    description: 'Learn Axiomwriter — import manuscripts, write scenes, build a lore bible, track plot threads, use Composer Mode, and export for publishing.',
    path: '/help',
  })

  return (
    <MarketingLayout>
      <MarketingHero
        eyebrow="Help guide"
        title="How the den works"
        subtitle="A short tour before you sign in — and a map once you’re inside. Start free anytime; the page will wait."
      />

      {/* Quick start path */}
      <section className="max-w-6xl mx-auto px-5 pb-16">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-100 text-center mb-3">
          First hour in Axiom
        </h2>
        <p className="text-center text-sm text-slate-500 mb-10 max-w-xl mx-auto">
          Six steps from empty project to a living story workspace.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {STEPS.map(step => (
            <div key={step.n} style={glass} className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-gold-400"
                  style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}
                >
                  <step.icon className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-semibold tracking-widest text-gold-500/70">{step.n}</span>
              </div>
              <h3 className="font-serif text-lg font-semibold text-slate-100">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* More topics */}
      <section className="max-w-6xl mx-auto px-5 pb-16">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-100 text-center mb-10">
          Deeper rooms of the den
        </h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {TOPICS.map(t => (
            <div key={t.title} style={glass} className="p-6 flex gap-4">
              <span
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-gold-400 flex-shrink-0"
                style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}
              >
                <t.icon className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-serif text-lg font-semibold text-slate-100">{t.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{t.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tips */}
      <section className="max-w-3xl mx-auto px-5 pb-16">
        <div style={glass} className="p-7 sm:p-9">
          <h2 className="font-serif text-xl font-semibold text-slate-100 mb-4">Tips from the desk</h2>
          <ul className="space-y-3 text-sm text-slate-400 leading-relaxed">
            <li className="flex gap-2">
              <span className="text-gold-500 flex-shrink-0">✦</span>
              Lock lore that must never break (magic costs, geography). Leave flavor text Flexible.
            </li>
            <li className="flex gap-2">
              <span className="text-gold-500 flex-shrink-0">✦</span>
              Assign POV on scene Details — Timeline layout becomes instantly useful.
            </li>
            <li className="flex gap-2">
              <span className="text-gold-500 flex-shrink-0">✦</span>
              Use Focus mode when the den gets too interesting and you only need the page.
            </li>
            <li className="flex gap-2">
              <span className="text-gold-500 flex-shrink-0">✦</span>
              Still stuck? Open Codex in the app sidebar, check the <Link to="/faq" className="text-gold-400 hover:text-gold-300">FAQ</Link>, or email us.
            </li>
          </ul>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-5 pb-24 text-center">
        <div style={glass} className="p-10">
          <Feather className="w-6 h-6 text-gold-400 mx-auto mb-4" />
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-50">
            The best way to learn is to write
          </h2>
          <p className="mt-3 text-slate-400">
            Free plan forever. Bring a chapter. See how the den holds it.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup" className="btn-primary inline-flex items-center gap-2 px-7 py-3">
              Start free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/faq" className="text-sm text-slate-400 hover:text-gold-400 transition-colors px-4 py-2">
              Browse FAQ →
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
