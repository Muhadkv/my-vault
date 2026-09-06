const CACHE_NAME = 'vault-cache-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  )
})

// Network-first for navigation/API, cache-first for static assets.
// Nothing sensitive (passwords, expenses) is ever cached here -- only the
// app shell itself, so the app can still open while offline.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return // don't touch Supabase requests

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const response = await fetch(event.request)
        if (event.request.method === 'GET') cache.put(event.request, response.clone())
        return response
      } catch {
        const cached = await cache.match(event.request)
        return cached || Response.error()
      }
    })
  )
})
