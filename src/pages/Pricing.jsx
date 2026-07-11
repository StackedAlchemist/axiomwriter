import React from 'react'
import { Link } from 'react-router-dom'
import { Check, ArrowRight, Sparkles } from 'lucide-react'
import MarketingLayout, { MarketingHero, glass } from '../components/layout/MarketingLayout'
import usePageMeta from '../hooks/usePageMeta'

const PLANS = [
  {
    name: 'Free',
    price: '0',
    blurb: 'Start your first book',
    cta: 'Start free',
    features: [
      '1 project',
      'Full manuscript editor',
      'Character list',
      'DOCX import',
      'Word export',
    ],
  },
  {
    name: 'Writer',
    price: '9.99',
    blurb: 'For the working novelist',
    cta: 'Start 7-day trial',
    features: [
      'Unlimited projects',
      'All writing layouts',
      'Lore Bible',
      'Plot Thread Detector',
      'Series continuity',
      'Voice DNA',
      '100 AI assists / month',
    ],
  },
  {
    name: 'Composer',
    price: '19.99',
    blurb: 'The full creative studio',
    cta: 'Start 7-day trial',
    highlight: true,
    features: [
      'Everything in Writer',
      'Composer Mode drafting',
      'Momentum engine',
      'World Map Builder',
      'Cover Studio',
      'Publishing export (EPUB, PDF, KDP)',
      '1,000 AI assists / month',
    ],
  },
  {
    name: 'Architect',
    price: '39.99',
    blurb: 'For authors with readers',
    cta: 'Start 7-day trial',
    features: [
      'Everything in Composer',
      'Beta reader sharing',
      'Reader feedback inbox',
      '2,000 AI assists / month',
      'Real-time collaboration (coming soon)',
    ],
  },
]

const MATRIX = [
  { feature: 'Manuscript editor & scenes', free: true, writer: true, composer: true, architect: true },
  { feature: 'Characters', free: true, writer: true, composer: true, architect: true },
  { feature: 'Unlimited projects', free: false, writer: true, composer: true, architect: true },
  { feature: 'Layouts (corkboard, timeline…)', free: false, writer: true, composer: true, architect: true },
  { feature: 'Lore Bible & gaps', free: false, writer: true, composer: true, architect: true },
  { feature: 'Plot Thread Detector', free: false, writer: true, composer: true, architect: true },
  { feature: 'Voice DNA', free: false, writer: true, composer: true, architect: true },
  { feature: 'Composer Mode', free: false, writer: false, composer: true, architect: true },
  { feature: 'World Map & Cover Studio', free: false, writer: false, composer: true, architect: true },
  { feature: 'Publish export (EPUB / PDF)', free: false, writer: false, composer: true, architect: true },
  { feature: 'Beta reader sharing', free: false, writer: false, composer: false, architect: true },
]

export default function Pricing() {
  usePageMeta({
    title: 'Pricing',
    description: 'Axiomwriter pricing for fiction authors — Free forever plan, Writer, Composer, and Architect. Every paid plan includes a 7-day free trial.',
    path: '/pricing',
  })

  return (
    <MarketingLayout>
      <MarketingHero
        eyebrow="Pricing"
        title="Serious tools. Honest plans."
        subtitle="Start free. Upgrade when the den needs more room — lore, Composer, maps, and publish-ready export. Every paid plan includes a 7-day free trial."
      />

      <section className="max-w-6xl mx-auto px-5 pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {PLANS.map(plan => (
            <PlanCard key={plan.name} {...plan} />
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-slate-500">
          Cancel anytime. Your manuscripts stay yours — export is always available.
        </p>
      </section>

      {/* Who it's for */}
      <section className="max-w-6xl mx-auto px-5 pb-16">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-center text-slate-100 mb-8">
          Which den is yours?
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          <WhoCard
            title="Trying Axiom for the first time"
            plan="Free"
            body="One project, the full editor, and room to feel the page. Import a chapter. Meet the den before you commit."
          />
          <WhoCard
            title="Drafting novels & series"
            plan="Writer"
            body="Unlimited books, lore, threads, and layouts. The working novelist's desk — structure without the overwhelm of Scrivener, with a bible that stays alive."
          />
          <WhoCard
            title="Co-writing with AI & shipping"
            plan="Composer / Architect"
            body="Composer Mode, maps, covers, and publish export. Architect adds beta readers when the draft is ready for other eyes."
          />
        </div>
      </section>

      {/* Comparison matrix */}
      <section className="max-w-5xl mx-auto px-5 pb-20">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-center text-slate-100 mb-8">
          Compare plans
        </h2>
        <div style={glass} className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-4 text-slate-500 font-medium">Feature</th>
                {['Free', 'Writer', 'Composer', 'Architect'].map(h => (
                  <th key={h} className="p-4 text-center font-serif text-slate-200 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map(row => (
                <tr key={row.feature} className="border-b border-white/[0.04]">
                  <td className="p-3.5 pl-4 text-slate-400">{row.feature}</td>
                  {['free', 'writer', 'composer', 'architect'].map(k => (
                    <td key={k} className="p-3.5 text-center">
                      {row[k]
                        ? <Check className="w-4 h-4 text-gold-500 mx-auto" />
                        : <span className="text-slate-700">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-5 pb-24 text-center">
        <div style={glass} className="p-10">
          <Sparkles className="w-6 h-6 text-gold-400 mx-auto mb-4" />
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-50">
            Come in. The page is warm.
          </h2>
          <p className="mt-3 text-slate-400">
            Free forever to start. Upgrade only when the story asks for more.
          </p>
          <Link to="/signup" className="btn-primary inline-flex items-center gap-2 mt-7 px-7 py-3">
            Create your free account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  )
}

function PlanCard({ name, price, blurb, features, cta, highlight }) {
  return (
    <div
      style={{
        ...glass,
        ...(highlight
          ? { border: '1px solid rgba(201,168,76,0.45)', boxShadow: '0 8px 40px rgba(201,168,76,0.12), 0 8px 40px rgba(0,0,0,0.55)' }
          : {}),
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
        {cta}
      </Link>
    </div>
  )
}

function WhoCard({ title, plan, body }) {
  return (
    <div style={glass} className="p-6">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gold-500/80">{plan}</span>
      <h3 className="font-serif text-lg font-semibold text-slate-100 mt-2">{title}</h3>
      <p className="mt-2 text-sm text-slate-400 leading-relaxed">{body}</p>
    </div>
  )
}
