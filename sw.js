// Heart AI Service Worker
const CACHE_NAME = 'heartai-v1.0.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/ai-test.html',
  '/feedback.html',
  '/profile.html',
  '/info.html',
  '/feedback-page.html',
  '/manifest.json',
  '/heart.png'
];

// Install Event
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Network first for HTML pages
  if (event.request.url.includes('.html') || event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200) return response;
          
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache first for assets
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) return response;
          
          return fetch(event.request).then(response => {
            if (!response || response.status !== 200) return response;
            
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
            return response;
          });
        })
        .catch(() => {
          // Return offline page if available
          return caches.match('/index.html');
        })
    );
  }
});

// Background Sync (for future use)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-tests') {
    event.waitUntil(syncTestData());
  }
});

async function syncTestData() {
  try {
    console.log('[SW] Syncing test data...');
    // Sync logic here
  } catch (error) {
    console.error('[SW] Sync error:', error);
  }
}
