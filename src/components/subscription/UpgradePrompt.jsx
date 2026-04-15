import React, { useState } from 'react'
import { Lock, X } from 'lucide-react'
import PricingModal from './PricingModal'

/**
 * Drop-in gate for any feature.
 * Usage:
 *   const { canAccess } = useSubscription()
 *   if (!canAccess('cover_generator')) return <UpgradePrompt feature="Cover Studio" />
 */
export default function UpgradePrompt({ feature, description, inline = false }) {
  const [showPricing, setShowPricing] = useState(false)

  if (inline) {
    return (
      <>
        <button
          onClick={() => setShowPricing(true)}
          className="flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 transition-colors"
        >
          <Lock className="w-3 h-3" />
          Upgrade to unlock
        </button>
        {showPricing && (
          <PricingModal
            onClose={() => setShowPricing(false)}
            highlightFeature={feature}
          />
        )}
      </>
    )
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center px-8">
        <div className="w-14 h-14 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-gold-400" />
        </div>
        <h3 className="font-serif text-xl text-slate-200 mb-2">{feature}</h3>
        {description && (
          <p className="text-sm text-slate-500 mb-6 max-w-xs">{description}</p>
        )}
        <button
          onClick={() => setShowPricing(true)}
          className="px-6 py-2.5 rounded-lg bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 border border-gold-500/30 text-sm font-semibold transition-colors"
        >
          View plans &amp; upgrade
        </button>
      </div>
      {showPricing && (
        <PricingModal
          onClose={() => setShowPricing(false)}
          highlightFeature={feature}
        />
      )}
    </>
  )
}
