const CACHE = 'lesson-motion-cues-v1';
const SHELL = ['/', '/privacy', '/terms', '/assets/hero-map.webp'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => { const copy = response.clone(); caches.open(CACHE).then(c => c.put(event.request, copy)); return response; }).catch(() => caches.match(event.request).then(hit => hit || caches.match('/'))));
    return;
  }
  event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).then(response => { const copy = response.clone(); caches.open(CACHE).then(c => c.put(event.request, copy)); return response; }).catch(() => caches.match('/'))));
});
