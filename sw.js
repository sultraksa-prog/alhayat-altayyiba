const CACHE_NAME = 'alhayat-cache-v2';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/azkar-data.js',
  './manifest.webmanifest',
  './icon.svg',
  './fonts/amiri.woff2',
  './fonts/cairo.woff2',
  './fonts/noto-naskh.woff2',
  './fonts/ruqaa.woff2',
  './fonts/scheherazade.woff2',
  './fonts/tajawal.woff2'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
