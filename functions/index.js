const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https')
const { setGlobalOptions } = require('firebase-functions/v2')
const { getFirestore } = require('firebase-admin/firestore')
const admin = require('firebase-admin')
const Stripe = require('stripe')
const Anthropic = require('@anthropic-ai/sdk')

admin.initializeApp()
setGlobalOptions({ region: 'us-central1' })

const db = getFirestore('axiom-web')

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
}

// Price ID → tier name map (set these in Firebase Functions env config)
const PRICE_TO_TIER = {
  [process.env.STRIPE_WRITER_PRICE_ID]:   'writer',
  [process.env.STRIPE_COMPOSER_PRICE_ID]: 'composer',
  [process.env.STRIPE_ARCHITECT_PRICE_ID]:'architect',
}

// Subscription statuses that grant paid-tier access. 'trialing' counts —
// free-trial users get the full experience of the tier they're trying.
const ENTITLED_STATUSES = new Set(['active', 'trialing'])
const TRIAL_DAYS = 7

// ── Create Checkout Session ───────────────────────────────────────────────────
exports.createCheckoutSession = onCall(async (request) => {
  // Identity comes from the verified auth context, never the client payload.
  if (!request.auth) throw new HttpsError('unauthenticated', 'You must be signed in.')
  const userId    = request.auth.uid
  const userEmail = request.auth.token?.email || request.data?.userEmail
  const { priceId, successUrl, cancelUrl } = request.data

  if (!priceId) throw new HttpsError('invalid-argument', 'Missing priceId')

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

  // First-time subscribers get a free trial; anyone who has ever had a
  // subscription doesn't (prevents cancel-and-resubscribe trial farming).
  const hasSubscribedBefore = Boolean(userDoc.data()?.subscription?.stripeSubscriptionId)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: { firebaseUID: userId },
      ...(hasSubscribedBefore ? {} : { trial_period_days: TRIAL_DAYS }),
    },
    allow_promotion_codes: true,
  })

  // session.url is Stripe's hosted checkout page — the client navigates there
  // directly. (redirectToCheckout via stripe-js is deprecated/removed.)
  return { sessionId: session.id, url: session.url }
})

// ── Create Billing Portal ─────────────────────────────────────────────────────
exports.createBillingPortal = onCall(async (request) => {
  // Identity comes from the verified auth context — prevents pulling up another
  // user's Stripe billing portal by passing their uid.
  if (!request.auth) throw new HttpsError('unauthenticated', 'You must be signed in.')
  const userId = request.auth.uid
  const { returnUrl } = request.data

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

  // Helper: update user subscription in Firestore.
  // set(..., merge) instead of update() — must work even if the users doc
  // doesn't exist yet (fresh accounts that subscribe immediately).
  async function updateUserSubscription(subscription) {
    const uid = subscription.metadata?.firebaseUID
    if (!uid) {
      // Fall back to customer lookup
      const customerDoc = await db.collection('users')
        .where('stripeCustomerId', '==', subscription.customer).limit(1).get()
      if (customerDoc.empty) {
        console.error('[stripeWebhook] No user found for customer', subscription.customer)
        return
      }
      await customerDoc.docs[0].ref.set({ subscription: buildSubData(subscription) }, { merge: true })
      return
    }
    await db.collection('users').doc(uid).set({ subscription: buildSubData(subscription) }, { merge: true })
  }

  function buildSubData(sub) {
    const item = sub.items?.data?.[0]
    const priceId = item?.price?.id
    // Newer Stripe API versions moved current_period_end from the subscription
    // to the subscription item; trial subscriptions can also expose trial_end.
    const periodEndSec   = sub.current_period_end ?? item?.current_period_end ?? sub.trial_end ?? null
    const periodStartSec = sub.current_period_start ?? item?.current_period_start ?? sub.trial_start ?? null
    return {
      stripeSubscriptionId: sub.id,
      tier: PRICE_TO_TIER[priceId] ?? 'free',
      status: sub.status,
      currentPeriodEnd: Number.isFinite(periodEndSec)
        ? admin.firestore.Timestamp.fromMillis(periodEndSec * 1000)
        : null,
      // AI quota resets on this anniversary, not the calendar month
      currentPeriodStart: Number.isFinite(periodStartSec)
        ? admin.firestore.Timestamp.fromMillis(periodStartSec * 1000)
        : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
  }

  try {
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
  } catch (err) {
    // Return 500 so Stripe retries the delivery instead of marking it done
    console.error(`[stripeWebhook] Failed handling ${type}:`, err)
    return res.status(500).send('Webhook handler failed')
  }

  res.json({ received: true })
})

// ── AI Assist ─────────────────────────────────────────────────────────────────
// Routes calls to Haiku (cheap, fast) or Sonnet (smart, deep) based on feature.
// Haiku:  inline writing suggestions, continuations, rephrasing  (~$0.002/call)
// Sonnet: lore consistency checks, character analysis, deep edit  (~$0.008/call)

const DEEP_FEATURES = new Set(['lore_check', 'character_analysis', 'plot_thread_review'])

const AI_LIMITS = { free: 0, writer: 100, composer: 1000, architect: 2000 }

const FOUNDER_EMAILS = new Set([
  'billylw75@gmail.com',
  'stackedalchemist@gmail.com',
])

exports.callAI = onCall(async (request) => {
  // Caller identity comes from the verified auth context, never the payload —
  // otherwise anyone could spend another user's (or a founder's) AI quota.
  if (!request.auth) throw new HttpsError('unauthenticated', 'You must be signed in.')
  const userId = request.auth.uid

  // Accepts either simple form { feature, systemPrompt, userMessage }
  // or full form { feature, model, system, messages, max_tokens }
  const {
    feature,
    systemPrompt,
    userMessage,
    messages: rawMessages,
    system: rawSystem,
    model: requestedModel,
    max_tokens = 1024,
  } = request.data

  const messages = rawMessages ?? [{ role: 'user', content: userMessage }]
  const system   = rawSystem ?? systemPrompt ?? "You are a skilled fiction writing assistant. Be concise and match the author's voice."

  if (!messages?.length || !messages[0]?.content) {
    throw new HttpsError('invalid-argument', 'Missing message content')
  }

  // Load user subscription
  const userRef = db.collection('users').doc(userId)
  const userDoc = await userRef.get()
  const userData = userDoc.data() ?? {}

  // Founders get unlimited access — use Auth record (always authoritative)
  let authEmail = ''
  try {
    const authUser = await admin.auth().getUser(userId)
    authEmail = authUser.email?.toLowerCase() ?? ''
  } catch (_) {
    authEmail = userData.email?.toLowerCase() ?? ''
  }
  const isFounder = FOUNDER_EMAILS.has(authEmail)

  if (!isFounder) {
    const tier = ENTITLED_STATUSES.has(userData.subscription?.status)
      ? (userData.subscription?.tier ?? 'free')
      : 'free'

    const limit = AI_LIMITS[tier] ?? 0
    if (limit === 0) {
      throw new HttpsError('permission-denied', 'AI assists are not available on the free plan. Upgrade to Writer or above.')
    }

    // Quota window: the current billing period (anniversary-based). Falls
    // back to the calendar month for docs written before periods were stored.
    let windowStart
    const periodStart = userData.subscription?.currentPeriodStart
    if (periodStart?.toDate) {
      windowStart = periodStart.toDate()
    } else {
      windowStart = new Date()
      windowStart.setDate(1)
      windowStart.setHours(0, 0, 0, 0)
    }
    const usageSnap = await db.collection('aiSuggestions')
      .where('uid', '==', userId)
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(windowStart))
      .get()
    const usedThisPeriod = usageSnap.size

    if (usedThisPeriod >= limit) {
      throw new HttpsError('resource-exhausted', `You've used all ${limit} AI assists for this billing cycle. Upgrade your plan to continue.`)
    }
  }

  // Route model: explicit request wins, otherwise Haiku for fast / Sonnet for deep
  const ALLOWED_MODELS = ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-7']
  const defaultModel = DEEP_FEATURES.has(feature) ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001'
  const model = ALLOWED_MODELS.includes(requestedModel) ? requestedModel : defaultModel

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await anthropic.messages.create({
    model,
    max_tokens: Math.min(Math.max(1, Math.floor(max_tokens)), 4096),
    system,
    messages,
  })

  const responseText = response.content[0]?.text ?? ''
  const inputTokens  = response.usage?.input_tokens  ?? 0
  const outputTokens = response.usage?.output_tokens ?? 0

  // Record usage
  const firstUserMsg = messages.find(m => m.role === 'user')?.content ?? ''
  await db.collection('aiSuggestions').add({
    uid:      userId,
    feature:  feature || 'general',
    model,
    prompt:   String(firstUserMsg).slice(0, 500),
    response: responseText.slice(0, 500),
    tokens:   inputTokens + outputTokens,
    accepted: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  return {
    content: [{ type: 'text', text: responseText }],
    model,
    usage: { input_tokens: inputTokens, output_tokens: outputTokens },
  }
})

// ── Image Generation (Stability AI) ──────────────────────────────────────────
// Routes Stability AI calls server-side so the API key never touches the browser.
// Requires Composer tier or above (cover studio is a paid feature).

exports.generateImage = onCall(async (request) => {
  // Identity comes from the verified auth context, never the payload.
  if (!request.auth) throw new HttpsError('unauthenticated', 'You must be signed in.')
  const userId = request.auth.uid
  const { prompt, negativePrompt, width = 832, height = 1216, steps = 30, cfgScale = 7 } = request.data

  if (!prompt) throw new HttpsError('invalid-argument', 'Missing prompt')

  // Gate: Composer+ only
  const userDoc = await db.collection('users').doc(userId).get()
  const userData = userDoc.data() ?? {}
  let authEmail = ''
  try {
    const authUser = await admin.auth().getUser(userId)
    authEmail = authUser.email?.toLowerCase() ?? ''
  } catch (_) {
    authEmail = userData.email?.toLowerCase() ?? ''
  }
  const isFounder = FOUNDER_EMAILS.has(authEmail)

  if (!isFounder) {
    const tier = ENTITLED_STATUSES.has(userData.subscription?.status)
      ? (userData.subscription?.tier ?? 'free')
      : 'free'
    const TIER_ORDER = ['free', 'writer', 'composer', 'architect']
    if (TIER_ORDER.indexOf(tier) < TIER_ORDER.indexOf('composer')) {
      throw new HttpsError('permission-denied', 'Cover Studio requires Composer or Architect plan.')
    }
  }

  const key = process.env.STABILITY_API_KEY
  if (!key) throw new HttpsError('internal', 'Stability AI not configured.')

  const body = JSON.stringify({
    text_prompts: [
      { text: prompt + ', professional book cover art, dramatic lighting, no text, no words', weight: 1 },
      { text: negativePrompt || 'watermark, text, letters, words, logos, blurry, low quality', weight: -1 },
    ],
    cfg_scale: cfgScale,
    samples:   1,
    steps,
    width:     Math.round(width / 64) * 64,
    height:    Math.round(height / 64) * 64,
  })

  const res = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${key}`,
      'Content-Type': 'application/json',
      Accept:         'application/json',
    },
    body,
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[generateImage] Stability AI error:', res.status, err)
    throw new HttpsError('internal', `Image generation failed: ${res.status}`)
  }

  const data = await res.json()
  const b64  = data.artifacts?.[0]?.base64
  if (!b64) throw new HttpsError('internal', 'No image returned from Stability AI.')

  return { base64: b64 }
})
