// Heart AI Service Worker for PWA (handles auto version updates)
const CACHE_NAME = 'heartai-cache-v1.0.0';
const APP_SHELL = [
  '/',
  'index.html',
  'BMI.html',
  'profile.html',
  'about.html',
  'manifest.json',
  'heart.png',
  'heart.png'
  // Add CSS/JS if saved separately
];

// On install, cache core files
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
});

// On activate, clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// On fetch, try cache then network (network-first for html)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  if (event.request.url.endsWith('.html')) {
    event.respondWith(
      fetch(event.request).then(resp => {
        // Optionally update cache for html
        const respClone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
        return resp;
      }).catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(resp =>
        resp || fetch(event.request).then(netResp => {
          // Store new cache
          if(netResp.ok) {
            const netRespClone = netResp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, netRespClone));
          }
          return netResp;
        })
      )
    );
  }
});

// (Version.json check handled in app JS for reload logic)
