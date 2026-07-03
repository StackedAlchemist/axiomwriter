import { getFunctions, httpsCallable } from 'firebase/functions'
import app from '../firebase/config'

export const PRICES = {
  writer:   { monthly: import.meta.env.VITE_STRIPE_WRITER_PRICE_ID,   amount: 9  },
  composer: { monthly: import.meta.env.VITE_STRIPE_COMPOSER_PRICE_ID, amount: 19 },
  architect:{ monthly: import.meta.env.VITE_STRIPE_ARCHITECT_PRICE_ID, amount: 39 },
}

const functions = getFunctions(app)

export async function startCheckout(tierId, userId, userEmail) {
  const createSession = httpsCallable(functions, 'createCheckoutSession')
  const { data } = await createSession({
    priceId: PRICES[tierId]?.monthly,
    userId,
    userEmail,
    successUrl: `${window.location.origin}/settings?upgraded=1`,
    cancelUrl:  `${window.location.origin}/settings`,
  })

  // Navigate straight to Stripe's hosted checkout page.
  if (!data?.url) throw new Error('Checkout session missing URL')
  window.location.href = data.url
}

export async function openBillingPortal(userId) {
  const createPortal = httpsCallable(functions, 'createBillingPortal')
  const { data } = await createPortal({
    userId,
    returnUrl: `${window.location.origin}/settings`,
  })
  window.location.href = data.url
}
