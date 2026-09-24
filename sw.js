const CACHE_NAME = 'alhayat-cache-v2.0.09';
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
  // لا نتدخل في طلبات الـ API الخارجية ليتم التعامل معها من داخل التطبيق
  if (e.request.url.includes('api.aladhan.com') || e.request.url.includes('api.bigdatacloud.net') || e.request.url.includes('nominatim.openstreetmap.org')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      // استراتيجية (Stale-While-Revalidate): نُرجع الكاش فوراً للسرعة، ونحدثه في الخلفية
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // خطأ الشبكة (أوفلاين) يتم تجاهله بصمت والاعتماد على الكاش
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// الاستماع لرسالة التحديث الفوري من التطبيق
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
