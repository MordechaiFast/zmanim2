const VERSION = '1.0.0';
const CACHE_NAME = `zmanim-cache-v${VERSION}`;
const FILES_TO_CACHE = [
  './',
  './index.html',
  './script.js',
  './style.css',
  './manifest.json',
  './api.js',
  './computations.js',
  './icon512.png',
  './keys.js',
  './zman.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil( (async () => {
    const files = await caches.keys();
    await Promise.all(
      files.map((file) => {
        if (file !== CACHE_NAME) {
          return caches.delete(file);
        }
      }),
    )
    await clients.claim();
  })() );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    // Handle navigation requests by serving the cached index.html
    event.respondWith(caches.match('./index.html'));
    return;
  } else {
    event.respondWith( (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request.url);
      if (cachedResponse) {
        return cachedResponse;
      } else {
        return fetch(event.request);
      }
    })() );
  }
});
