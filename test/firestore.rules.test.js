/**
 * Firestore security rules — billing & quota lockdown.
 *
 * Run via `npm run test:rules` (spins up the Firestore emulator, runs this
 * file with Node's built-in test runner, tears the emulator down).
 *
 * These specifically guard the two paid-feature exploits found in a 2026-07
 * security audit:
 *   1. users/{uid}.subscription / .stripeCustomerId are admin-only — callAI
 *      and generateImage trust subscription.tier/.status straight off this
 *      doc to authorize paid Anthropic/Stability spend, so a client-writable
 *      subscription field lets a user self-grant a paid tier for free.
 *   2. aiSuggestions has no client delete — callAI's per-billing-period quota
 *      check counts docs in this collection by uid + createdAt, so a
 *      client-writable delete would let a user erase usage history and
 *      exceed their tier's AI assist limit.
 *
 * If either exploit reopens (someone loosens firestore.rules without
 * noticing), this suite fails loudly instead of silently regressing.
 */
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let testEnv

test.before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'axiom-writer-ruletest',
    firestore: {
      rules: readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  })
})

test.after(async () => {
  await testEnv.cleanup()
})

test.beforeEach(async () => {
  await testEnv.clearFirestore()
})

test('billing fields: user cannot self-upgrade subscription.tier', async () => {
  const uid = 'attacker'
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await ctx.firestore().collection('users').doc(uid).set({
      uid, email: 'a@example.com', subscription: { tier: 'free', status: 'none' },
    })
  })
  const asUser = testEnv.authenticatedContext(uid).firestore()

  await assertFails(
    asUser.collection('users').doc(uid).update({ subscription: { tier: 'architect', status: 'active' } })
  )
})

test('billing fields: user cannot forge stripeCustomerId', async () => {
  const uid = 'attacker2'
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await ctx.firestore().collection('users').doc(uid).set({ uid, subscription: { tier: 'free', status: 'none' } })
  })
  const asUser = testEnv.authenticatedContext(uid).firestore()

  await assertFails(
    asUser.collection('users').doc(uid).update({ stripeCustomerId: 'cus_fake123' })
  )
})

test('billing fields: subscription cannot be smuggled inside an otherwise-legit update', async () => {
  const uid = 'attacker3'
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await ctx.firestore().collection('users').doc(uid).set({ uid, subscription: { tier: 'free', status: 'none' } })
  })
  const asUser = testEnv.authenticatedContext(uid).firestore()

  await assertFails(
    asUser.collection('users').doc(uid).update({
      displayName: 'Totally Normal Update',
      subscription: { tier: 'composer', status: 'active' },
    })
  )
})

test('billing fields: subscription cannot be set at account-creation time', async () => {
  const uid = 'new-attacker'
  const asUser = testEnv.authenticatedContext(uid).firestore()

  await assertFails(
    asUser.collection('users').doc(uid).set({ uid, subscription: { tier: 'architect', status: 'active' } })
  )
})

test('billing fields: non-billing profile fields remain client-writable', async () => {
  const uid = 'legit-user'
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await ctx.firestore().collection('users').doc(uid).set({ uid, subscription: { tier: 'free', status: 'none' } })
  })
  const asUser = testEnv.authenticatedContext(uid).firestore()

  await assertSucceeds(
    asUser.collection('users').doc(uid).update({ aiModel: 'sonnet' })
  )
})

test('aiSuggestions quota: user cannot delete their own usage-tracking docs', async () => {
  const uid = 'quota-dodger'
  let docId
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const ref = await ctx.firestore().collection('aiSuggestions').add({
      uid, feature: 'refine', createdAt: new Date(),
    })
    docId = ref.id
  })
  const asUser = testEnv.authenticatedContext(uid).firestore()

  await assertFails(
    asUser.collection('aiSuggestions').doc(docId).delete()
  )
})

test('aiSuggestions quota: user can still read/update (but not delete) their own docs', async () => {
  const uid = 'legit-suggestion-owner'
  let docId
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const ref = await ctx.firestore().collection('aiSuggestions').add({
      uid, feature: 'refine', accepted: null, createdAt: new Date(),
    })
    docId = ref.id
  })
  const asUser = testEnv.authenticatedContext(uid).firestore()

  await assertSucceeds(asUser.collection('aiSuggestions').doc(docId).update({ accepted: true }))
  await assertSucceeds(asUser.collection('aiSuggestions').doc(docId).get())
})
