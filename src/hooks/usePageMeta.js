import { useEffect } from 'react'

const SITE_NAME = 'Axiomwriter'
const ORIGIN = 'https://axiomwriter.com'

/**
 * Per-route SEO metadata for public pages.
 * Sets document.title, the meta description, the canonical link, and keeps
 * og:/twitter: title + description + url in sync so shared deep links
 * (e.g. /signup) preview correctly.
 *
 * @param {object} opts
 * @param {string} opts.title       Page title WITHOUT the site name suffix
 * @param {string} [opts.description]
 * @param {string} [opts.path]      Canonical path, e.g. '/signup' (defaults to current pathname)
 */
export default function usePageMeta({ title, description, path }) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — AI Writing Platform for Fiction Authors`
    document.title = fullTitle

    const canonicalUrl = ORIGIN + (path ?? window.location.pathname)

    setTag('link[rel="canonical"]', 'href', canonicalUrl)
    setTag('meta[property="og:url"]', 'content', canonicalUrl)
    setTag('meta[property="og:title"]', 'content', fullTitle)
    setTag('meta[name="twitter:title"]', 'content', fullTitle)

    if (description) {
      setTag('meta[name="description"]', 'content', description)
      setTag('meta[property="og:description"]', 'content', description)
      setTag('meta[name="twitter:description"]', 'content', description)
    }
  }, [title, description, path])
}

function setTag(selector, attr, value) {
  const el = document.head.querySelector(selector)
  if (el) el.setAttribute(attr, value)
}
