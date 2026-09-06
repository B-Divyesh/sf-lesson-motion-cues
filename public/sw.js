const CACHE = 'lesson-motion-cues-v3';
const SHELL = ['/', '/demo', '/privacy', '/terms', '/assets/hero-map.webp', '/assets/Atkinson-Hyperlegible-Regular.woff2', '/assets/Atkinson-Hyperlegible-Bold.woff2', '/favicon.svg'];
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  await cache.addAll(SHELL);
  const html = await (await fetch('/')).text();
  const builtAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(match => match[1]);
  await cache.addAll([...new Set(builtAssets)]);
  await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => { const copy = response.clone(); caches.open(CACHE).then(c => c.put(new URL(event.request.url).pathname, copy)); return response; }).catch(async () => { const cache = await caches.open(CACHE); return (await cache.match(new URL(event.request.url).pathname)) || cache.match('/'); }));
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = new URL(event.request.url).pathname;
    const hit = await cache.match(key, { ignoreSearch: true });
    if (hit) return hit;
    const response = await fetch(event.request);
    cache.put(key, response.clone());
    return response;
  })());
});
