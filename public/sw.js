const CACHE = 'clinic-inventory-v1'

// App shell routes to cache on first visit
const SHELL = [
  '/inventory/dashboard',
  '/inventory/products',
  '/inventory/movements/new',
  '/inventory/alerts',
]

// ---------------------------------------------------------------------------
// Install — cache the app shell
// ---------------------------------------------------------------------------
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  )
})

// ---------------------------------------------------------------------------
// Activate — delete stale caches from old versions
// ---------------------------------------------------------------------------
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// ---------------------------------------------------------------------------
// Fetch — network first, fall back to cache
// Skip non-GET, browser extensions, and Supabase API calls (always need network)
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  if (
    request.method !== 'GET' ||
    url.origin !== location.origin ||
    url.pathname.startsWith('/_next/webpack-hmr') ||
    url.pathname.startsWith('/api/') ||
    url.host.includes('supabase.co')
  ) {
    return
  }

  e.respondWith(
    fetch(request)
      .then((res) => {
        // Cache successful navigation and static asset responses
        if (res.ok && (request.destination === 'document' || request.destination === 'script' || request.destination === 'style' || request.destination === 'image')) {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(request, clone))
        }
        return res
      })
      .catch(() => caches.match(request))
  )
})

// ---------------------------------------------------------------------------
// Background sync — flush pending offline movements
// ---------------------------------------------------------------------------
self.addEventListener('sync', (e) => {
  if (e.tag === 'sync-movements') {
    e.waitUntil(syncPendingMovements())
  }
})

async function syncPendingMovements() {
  // Notify all open clients to trigger the sync
  const clients = await self.clients.matchAll({ type: 'window' })
  clients.forEach((c) => c.postMessage({ type: 'SYNC_MOVEMENTS' }))
}
