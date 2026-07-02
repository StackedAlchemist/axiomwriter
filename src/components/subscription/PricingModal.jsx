import React, { useState } from 'react'
import { X, Check, Zap, BookOpen, Layers, Crown } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useSubscription, TIERS } from '../../hooks/useSubscription'
import { startCheckout } from '../../lib/stripe'

const PLAN_ICONS = {
  free:      BookOpen,
  writer:    Zap,
  composer:  Layers,
  architect: Crown,
}

const PLAN_COLORS = {
  free:      'text-slate-400 border-axiom-border',
  writer:    'text-teal-400 border-teal-500/30',
  composer:  'text-gold-400 border-gold-500/30',
  architect: 'text-purple-400 border-purple-500/30',
}

const PLAN_FEATURES = {
  free: [
    '1 project',
    'No AI assists',
    'Manuscript editor',
    'Basic export',
  ],
  writer: [
    'Unlimited projects',
    '100 AI assists / month',
    'All editor layouts',
    'Voice DNA analysis',
    'Lore Bible',
    'Thread Detector',
    'Series Architecture',
  ],
  composer: [
    'Everything in Writer',
    '1,000 AI assists / month',
    'Momentum Engine',
    'Composer Mode (AI co-writing)',
    'World Map Builder',
    'Cover Studio',
    'Print-ready PDF export',
  ],
  architect: [
    'Everything in Composer',
    '2,000 AI assists / month',
    'Real-time editor collaboration',
    'Live cursor presence',
    'Beta reader sharing',
    'Priority support',
  ],
}

export default function PricingModal({ onClose, highlightFeature }) {
  const { currentUser } = useAuth()
  const { tierId } = useSubscription()
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState('')

  async function handleUpgrade(planId) {
    if (planId === 'free' || planId === tierId) return
    setLoading(planId)
    setError('')
    try {
      await startCheckout(planId, currentUser.uid, currentUser.email)
    } catch (err) {
      setError('Could not start checkout. Please try again.')
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-axiom-surface border border-axiom-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-axiom-border">
          <div>
            <h2 className="font-serif text-2xl text-slate-100">Choose your plan</h2>
            <p className="text-sm text-slate-500 mt-0.5">Upgrade anytime, cancel anytime</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {highlightFeature && (
          <div className="mx-6 mt-4 px-4 py-2.5 bg-gold-500/10 border border-gold-500/20 rounded-lg text-sm text-gold-300">
            <strong>"{highlightFeature}"</strong> requires a paid plan. Upgrade below to unlock it.
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 px-4 py-2.5 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
          {Object.values(TIERS).map(plan => {
            const Icon = PLAN_ICONS[plan.id]
            const colorClass = PLAN_COLORS[plan.id]
            const isCurrent = plan.id === tierId
            const isPopular = plan.id === 'composer'

            return (
              <div
                key={plan.id}
                className={`
                  relative flex flex-col border rounded-xl p-5 transition-all
                  ${isCurrent ? 'border-gold-500/50 bg-gold-500/5' : 'border-axiom-border bg-axiom-surface2'}
                  ${isPopular && !isCurrent ? 'ring-1 ring-gold-500/30' : ''}
                `}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-[10px] font-bold bg-gold-500 text-black px-3 py-0.5 rounded-full uppercase tracking-wider">
                      Popular
                    </span>
                  </div>
                )}

                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center mb-3 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>

                <h3 className="font-semibold text-slate-100 mb-1">{plan.name}</h3>
                <div className="mb-4">
                  {plan.price === 0 ? (
                    <span className="text-2xl font-bold text-slate-300">Free</span>
                  ) : (
                    <span className="text-2xl font-bold text-slate-100">
                      ${Number.isInteger(plan.price) ? plan.price : plan.price.toFixed(2)}
                      <span className="text-sm font-normal text-slate-500">/mo</span>
                    </span>
                  )}
                </div>

                <ul className="space-y-1.5 flex-1 mb-5">
                  {PLAN_FEATURES[plan.id].map(feat => (
                    <li key={feat} className="flex items-start gap-2 text-xs text-slate-400">
                      <Check className="w-3.5 h-3.5 text-teal-500 flex-shrink-0 mt-0.5" />
                      {feat}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full py-2 text-center text-xs font-medium text-gold-400 border border-gold-500/30 rounded-lg">
                    Current plan
                  </div>
                ) : plan.id === 'free' ? (
                  <div className="w-full py-2 text-center text-xs text-slate-600">
                    —
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={!!loading}
                    className="w-full py-2 rounded-lg text-xs font-semibold bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 border border-gold-500/30 transition-colors disabled:opacity-50"
                  >
                    {loading === plan.id ? 'Redirecting…' : `Start 7-day free trial`}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-slate-600 pb-6">
          7-day free trial on your first plan · You won't be charged until the trial ends · Secure payments via Stripe · Cancel anytime
        </p>
      </div>
    </div>
  )
}
