/**
 * Axiom Service Worker
 *
 * Strategy:
 * - App shell (index.html): cache-first with network update
 * - Static assets (CSS, JS, fonts, icons): cache-first
 * - External APIs (Firestore, Claude, Stability AI): network-only
 * - Navigation: network-first → cached index.html offline fallback
 *
 * Firestore offline persistence is handled by the Firebase SDK via IndexedDB —
 * we do NOT need to queue writes in the SW.
 */

const CACHE   = 'axiom-shell-v1'
const OFFLINE  = '/offline.html'

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// URLs we never intercept — let them go straight to network
const PASSTHROUGH = [
  'firestore.googleapis.com',
  'googleapis.com',
  'anthropic.com',
  'stability.ai',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firebase.googleapis.com',
  'firebaseio.com',
  'firebaseapp.com',
  'fonts.gstatic.com',
]

// ── Lifecycle ────────────────────────────────────────────────────────────────

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

// ── Fetch handler ────────────────────────────────────────────────────────────

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Always pass through external API calls
  if (PASSTHROUGH.some(h => url.hostname.includes(h))) {
    return // default browser fetch
  }

  // Only handle same-origin and CDN requests
  if (url.origin !== self.location.origin &&
      !url.hostname.includes('fonts.googleapis.com')) {
    return
  }

  // Navigation requests: network-first, fall back to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(res => {
          // Cache a fresh copy of index.html on every successful navigation
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then(c => c.put('/index.html', clone))
          }
          return res
        })
        .catch(() =>
          caches.match('/index.html').then(cached => cached || new Response(
            '<h1>Offline</h1><p>Open Axiom when connected to get started.</p>',
            { headers: { 'Content-Type': 'text/html' } }
          ))
        )
    )
    return
  }

  // Static assets (JS, CSS, fonts, images): cache-first with background update
  event.respondWith(
    caches.match(request).then(cached => {
      const networkFetch = fetch(request).then(res => {
        if (res.ok && res.type !== 'opaque') {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
        }
        return res
      }).catch(() => null)

      return cached || networkFetch
    })
  )
})

// ── Background sync (used by OfflineIndicator to trigger sync checks) ────────

self.addEventListener('sync', event => {
  if (event.tag === 'axiom-sync') {
    // Firestore SDK handles actual data sync automatically via IndexedDB.
    // This event signals that connectivity was restored — we notify clients.
    event.waitUntil(
      self.clients.matchAll().then(clients =>
        clients.forEach(client => client.postMessage({ type: 'SYNC_RESTORED' }))
      )
    )
  }
})

// ── Push notifications (future use) ─────────────────────────────────────────

self.addEventListener('push', event => {
  if (!event.data) return
  let data = {}
  try { data = event.data.json() } catch { return }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Axiom', {
      body:    data.body    || '',
      icon:    '/icons/icon-192.png',
      badge:   '/icons/icon-72.png',
      tag:     data.tag     || 'axiom-notification',
      data:    data.url     || '/',
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  )
})
