import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Feather, Heart, MapPin, Sparkles } from 'lucide-react'
import MarketingLayout, { MarketingHero, glass } from '../components/layout/MarketingLayout'
import usePageMeta from '../hooks/usePageMeta'

export default function About() {
  usePageMeta({
    title: 'About',
    description: 'Axiomwriter is the writer’s den from Stacked Alchemist LLC — built for fiction authors who want manuscripts, lore, and AI that respects their world.',
    path: '/about',
  })

  return (
    <MarketingLayout>
      <MarketingHero
        eyebrow="About Axiomwriter"
        title="Built for authors who live in their worlds"
        subtitle="Not another generic doc with a chatbot bolted on. A den for long-form fiction — where the manuscript, the cast, and the lore stay in conversation."
      />

      <section className="max-w-3xl mx-auto px-5 pb-16 space-y-6">
        <div style={glass} className="p-7 sm:p-9">
          <p className="font-serif text-xl sm:text-2xl text-slate-100 leading-relaxed">
            Stories deserve more than a folder of documents and a tool that forgets who your protagonist is by chapter twelve.
          </p>
          <p className="mt-5 text-sm sm:text-base text-slate-400 leading-relaxed">
            Axiomwriter exists because fiction is systems as much as sentences — POV, promises, magic rules, the thread you
            planted on page forty. We built a workspace where structure and imagination share a desk: write in full view,
            keep a living bible, and invite AI that has read <em>your</em> world, not the internet’s average of every world.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 pb-16">
        <div className="grid md:grid-cols-3 gap-5">
          <Value
            icon={<Feather className="w-5 h-5" />}
            title="The page first"
            body="Everything serves the draft. Layouts, focus mode, writing environments — chrome that gets out of the way when you’re mid-sentence."
          />
          <Value
            icon={<Sparkles className="w-5 h-5" />}
            title="AI that knows your bible"
            body="Composer, refinements, and structure checks pull characters, lore, and threads. Co-writing, not ghostwriting. You always choose what stays."
          />
          <Value
            icon={<Heart className="w-5 h-5" />}
            title="Your work, always"
            body="Export anytime. No hostage manuscripts. Privacy-minded AI. Built by people who believe authors should own every word."
          />
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-5 pb-16">
        <div style={glass} className="p-7 sm:p-9">
          <div className="flex items-center gap-2 text-gold-500/80 text-xs font-semibold uppercase tracking-widest mb-4">
            <MapPin className="w-3.5 h-3.5" />
            Stacked Alchemist LLC
          </div>
          <h2 className="font-serif text-2xl font-semibold text-slate-100">Who’s behind the den</h2>
          <p className="mt-4 text-sm text-slate-400 leading-relaxed">
            Axiomwriter is a product of <strong className="text-slate-300 font-medium">Stacked Alchemist LLC</strong>, based in
            Mesa, Arizona. We craft software with the same care we expect from a good novel: intention, consistency, and a
            little bit of magic under the floorboards.
          </p>
          <p className="mt-4 text-sm text-slate-400 leading-relaxed">
            If the den helps you finish a chapter, a trilogy, or just return to the page after a long dry spell — that’s the win.
          </p>
          <a
            href="mailto:hello@stackedalchemist.dev"
            className="inline-flex items-center gap-2 mt-6 text-sm text-gold-400 hover:text-gold-300 transition-colors"
          >
            hello@stackedalchemist.dev <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-5 pb-24 text-center">
        <div style={glass} className="p-10">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-50">
            Welcome home, author.
          </h2>
          <p className="mt-3 text-slate-400">
            Come in. Let’s build that world — one scene, one rule, one honest page at a time.
          </p>
          <Link to="/signup" className="btn-primary inline-flex items-center gap-2 mt-7 px-7 py-3">
            Open the den <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  )
}

function Value({ icon, title, body }) {
  return (
    <div style={glass} className="p-6">
      <span
        className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-gold-400 mb-4"
        style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}
      >
        {icon}
      </span>
      <h3 className="font-serif text-lg font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-400 leading-relaxed">{body}</p>
    </div>
  )
}
