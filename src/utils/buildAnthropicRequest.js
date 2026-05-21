/**
 * Anthropic API bridge — routes all AI calls through the callAI Firebase Function.
 * The API key never touches the browser. Rate limiting and usage tracking are server-side.
 */

import { getFunctions, httpsCallable } from 'firebase/functions'
import { getAuth } from 'firebase/auth'

export const DEFAULT_FAST_MODEL    = 'claude-haiku-4-5-20251001'
export const DEFAULT_QUALITY_MODEL = 'claude-sonnet-4-6'

let _callAIFn = null
function getCallAI() {
  if (!_callAIFn) {
    const functions = getFunctions(undefined, 'us-central1')
    _callAIFn = httpsCallable(functions, 'callAI')
  }
  return _callAIFn
}

/**
 * Calls the Anthropic API via the callAI Cloud Function.
 * Returns a response object shaped like a raw Anthropic response
 * so all existing callers (claudeApi.js, etc.) work without changes.
 */
export async function callAnthropic({ model = DEFAULT_FAST_MODEL, messages, system, max_tokens = 1024 }) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('[callAnthropic] messages must be a non-empty array')
  }

  const normalized = messages
    .filter(m => m && m.content && String(m.content).trim().length > 0)
    .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content) }))

  if (normalized.length === 0) {
    throw new Error('[callAnthropic] All messages had empty content after sanitization')
  }

  const auth = getAuth()
  const user = auth.currentUser
  if (!user) throw new Error('[callAnthropic] User not authenticated')

  const callAI = getCallAI()
  const result = await callAI({
    userId:     user.uid,
    feature:    'general',
    model,
    system:     system ?? '',
    messages:   normalized,
    max_tokens: Math.max(1, Math.floor(max_tokens)),
  })

  // result.data is already in Anthropic response shape: { content: [{type, text}], ... }
  return result.data
}

/**
 * Extracts the first text content block from an Anthropic response.
 */
export function extractText(response) {
  return response?.content?.[0]?.text?.trim() ?? ''
}

// Kept for backwards compatibility — not used in production
export function buildAnthropicRequest() {
  throw new Error('[buildAnthropicRequest] Direct browser API calls are disabled. Use callAnthropic() instead.')
}
