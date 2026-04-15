const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https')
const { setGlobalOptions } = require('firebase-functions/v2')
const admin = require('firebase-admin')
const Stripe = require('stripe')

admin.initializeApp()
setGlobalOptions({ region: 'us-central1' })

const db = admin.firestore()

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
}

// Price ID → tier name map (set these in Firebase Functions env config)
const PRICE_TO_TIER = {
  [process.env.STRIPE_WRITER_PRICE_ID]:   'writer',
  [process.env.STRIPE_COMPOSER_PRICE_ID]: 'composer',
  [process.env.STRIPE_ARCHITECT_PRICE_ID]:'architect',
}

// ── Create Checkout Session ───────────────────────────────────────────────────
exports.createCheckoutSession = onCall(async (request) => {
  const { priceId, userId, userEmail, successUrl, cancelUrl } = request.data

  if (!priceId || !userId) throw new HttpsError('invalid-argument', 'Missing priceId or userId')

  const stripe = getStripe()

  // Get or create Stripe customer
  const userRef = db.collection('users').doc(userId)
  const userDoc = await userRef.get()
  let customerId = userDoc.data()?.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { firebaseUID: userId },
    })
    customerId = customer.id
    await userRef.update({ stripeCustomerId: customerId })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: { firebaseUID: userId },
    },
    allow_promotion_codes: true,
  })

  return { sessionId: session.id }
})

// ── Create Billing Portal ─────────────────────────────────────────────────────
exports.createBillingPortal = onCall(async (request) => {
  const { userId, returnUrl } = request.data
  if (!userId) throw new HttpsError('invalid-argument', 'Missing userId')

  const userDoc = await db.collection('users').doc(userId).get()
  const customerId = userDoc.data()?.stripeCustomerId
  if (!customerId) throw new HttpsError('not-found', 'No Stripe customer found')

  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return { url: session.url }
})

// ── Stripe Webhook ────────────────────────────────────────────────────────────
exports.stripeWebhook = onRequest(async (req, res) => {
  const stripe = getStripe()
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  const { type, data } = event

  // Helper: update user subscription in Firestore
  async function updateUserSubscription(subscription) {
    const uid = subscription.metadata?.firebaseUID
    if (!uid) {
      // Fall back to customer lookup
      const customerDoc = await db.collection('users')
        .where('stripeCustomerId', '==', subscription.customer).limit(1).get()
      if (customerDoc.empty) return
      await customerDoc.docs[0].ref.update({ subscription: buildSubData(subscription) })
      return
    }
    await db.collection('users').doc(uid).update({ subscription: buildSubData(subscription) })
  }

  function buildSubData(sub) {
    const priceId = sub.items?.data[0]?.price?.id
    return {
      stripeSubscriptionId: sub.id,
      tier: PRICE_TO_TIER[priceId] ?? 'free',
      status: sub.status,
      currentPeriodEnd: admin.firestore.Timestamp.fromMillis(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
  }

  switch (type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await updateUserSubscription(data.object)
      break

    case 'customer.subscription.deleted':
      await updateUserSubscription({ ...data.object, status: 'canceled' })
      break

    default:
      // Unhandled event types are fine
      break
  }

  res.json({ received: true })
})
