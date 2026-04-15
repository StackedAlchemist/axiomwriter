/**
 * Safe Anthropic API Request Builder
 *
 * Centralizes validation, sanitization, and header construction for all
 * Anthropic API calls. Prevents 400 errors from malformed payloads.
 *
 * Usage:
 *   import { buildAnthropicRequest, callAnthropic } from '../utils/buildAnthropicRequest'
 *
 *   // Low-level — get a validated fetch options object:
 *   const options = buildAnthropicRequest({ model, messages, system, max_tokens })
 *   const res = await fetch('https://api.anthropic.com/v1/messages', options)
 *
 *   // High-level — fetch + parse + error logging in one call:
 *   const data = await callAnthropic({ model, messages, system, max_tokens })
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

// Valid Claude model IDs — update as new models ship
const VALID_MODELS = new Set([
  'claude-haiku-4-5-20251001',
  'claude-sonnet-4-6',
  'claude-opus-4-6',
])

// Default safe model for lightweight tasks
export const DEFAULT_FAST_MODEL   = 'claude-haiku-4-5-20251001'
export const DEFAULT_QUALITY_MODEL = 'claude-sonnet-4-6'

/**
 * Strips undefined/null from a string value, returning '' if falsy.
 */
function safeString(val) {
  if (val === null || val === undefined) return ''
  return String(val)
}

/**
 * Validates and normalizes a messages array for Anthropic.
 * Removes entries with empty content.
 */
function normalizeMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('[buildAnthropicRequest] messages must be a non-empty array')
  }

  const normalized = messages
    .filter(m => m && typeof m === 'object')
    .map(m => {
      const role    = m.role === 'assistant' ? 'assistant' : 'user'
      const content = safeString(m.content)
      return { role, content }
    })
    .filter(m => m.content.trim().length > 0)

  if (normalized.length === 0) {
    throw new Error('[buildAnthropicRequest] All messages had empty content after sanitization')
  }

  return normalized
}

/**
 * Builds a validated fetch options object for an Anthropic /v1/messages call.
 *
 * @param {object} opts
 * @param {string}   opts.model        - Claude model ID (defaults to fast model)
 * @param {Array}    opts.messages     - Message array [{role, content}]
 * @param {string}  [opts.system]      - Optional system prompt
 * @param {number}  [opts.max_tokens]  - Max tokens (defaults to 1024)
 * @returns {RequestInit} fetch options object ready for use
 */
export function buildAnthropicRequest({
  model      = DEFAULT_FAST_MODEL,
  messages,
  system,
  max_tokens = 1024,
}) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('[buildAnthropicRequest] VITE_ANTHROPIC_API_KEY is not set. Add it to your .env file.')
  }

  // Validate model
  const resolvedModel = VALID_MODELS.has(model) ? model : DEFAULT_FAST_MODEL
  if (!VALID_MODELS.has(model)) {
    console.warn(`[buildAnthropicRequest] Unknown model "${model}", falling back to "${DEFAULT_FAST_MODEL}"`)
  }

  const normalized = normalizeMessages(messages)

  const body = {
    model:      resolvedModel,
    max_tokens: Math.max(1, Math.floor(max_tokens)),
    messages:   normalized,
  }

  // Only include system if it's a non-empty string
  if (system && typeof system === 'string' && system.trim().length > 0) {
    body.system = system.trim()
  }

  return {
    method: 'POST',
    headers: {
      'Content-Type':                        'application/json',
      'x-api-key':                           apiKey,
      'anthropic-version':                   '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  }
}

/**
 * Executes a validated Anthropic API call and returns the parsed response data.
 * Logs the full response body on non-2xx status so 400s are debuggable.
 *
 * @param {object} opts - Same options as buildAnthropicRequest
 * @returns {Promise<object>} The parsed Anthropic response
 * @throws {Error} on network failure or non-2xx response
 */
export async function callAnthropic(opts) {
  const options = buildAnthropicRequest(opts)

  const res = await fetch(ANTHROPIC_URL, options)

  if (!res.ok) {
    let errorBody = {}
    try { errorBody = await res.json() } catch { /* non-JSON error body */ }

    const detail = errorBody?.error?.message || JSON.stringify(errorBody)
    const msg = `[callAnthropic] ${res.status} ${res.statusText} — ${detail}`
    console.error(msg, { requestModel: opts.model, status: res.status, body: errorBody })
    throw new Error(msg)
  }

  return res.json()
}

/**
 * Extracts the first text content block from an Anthropic response.
 * Returns '' if not found.
 */
export function extractText(response) {
  return response?.content?.[0]?.text?.trim() ?? ''
}
