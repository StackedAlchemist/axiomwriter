import React, { useState } from 'react'
import { Zap } from 'lucide-react'
import { useUsageTracking } from '../../hooks/useUsageTracking'
import { useSubscription } from '../../hooks/useSubscription'
import PricingModal from './PricingModal'

export default function UsageMeter({ compact = false }) {
  const { usage, remaining, percentUsed, limit } = useUsageTracking()
  const { tierId } = useSubscription()
  const [showPricing, setShowPricing] = useState(false)

  if (limit === Infinity) return null // unlimited tier — don't show meter

  const isWarning = percentUsed >= 80
  const isDanger  = percentUsed >= 95

  const barColor = isDanger  ? 'bg-red-500'
    : isWarning ? 'bg-amber-500'
    : 'bg-teal-500'

  if (compact) {
    return (
      <button
        onClick={() => setShowPricing(true)}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        title={`${usage} / ${limit} AI assists used`}
      >
        <Zap className={`w-3 h-3 ${isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-teal-400'}`} />
        <span>{remaining === 0 ? 'Limit reached' : `${remaining} left`}</span>
        {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
      </button>
    )
  }

  return (
    <>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-slate-400">
            <Zap className="w-3 h-3" />
            AI assists this month
          </span>
          <span className={isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-slate-500'}>
            {usage} / {limit}
          </span>
        </div>
        <div className="h-1.5 bg-axiom-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
        {isWarning && (
          <button
            onClick={() => setShowPricing(true)}
            className="text-xs text-gold-400 hover:underline"
          >
            {isDanger ? 'Limit reached — upgrade to continue' : 'Running low — upgrade for more'}
          </button>
        )}
      </div>
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </>
  )
}
