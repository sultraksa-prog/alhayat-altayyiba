const CACHE_NAME = 'alhayat-cache-v2.1.116';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './css/calendar.css',
  './css/prayer-settings.css',
  './css/alarms.css',
  './js/app.js',
  './js/azkar-data.js',
 './js/locations-data.js',
  './js/prayer-settings.js',
  './js/alarm-engine.js',
  './js/calendar.js',
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
  // لا نتدخل في طلبات الصوت، أو طلبات المدى (Range)، أو الـ APIs الخارجية، أو صور Unsplash
  if (
    e.request.destination === 'audio' ||
    e.request.headers.has('range') ||
    e.request.url.includes('.mp3') ||
    e.request.url.includes('api.aladhan.com') ||
    e.request.url.includes('api.bigdatacloud.net') ||
    e.request.url.includes('nominatim.openstreetmap.org') ||
    e.request.url.includes('islamcan.com') ||
    e.request.url.includes('archive.org') ||
    e.request.url.includes('images.unsplash.com')
  ) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      // استراتيجية (Stale-While-Revalidate): نُرجع الكاش فوراً للسرعة، ونحدثه في الخلفية
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // منع إرجاع undefined نهائياً لتفادي خطأ Failed to convert value to 'Response'
        return cachedResponse || new Response('', { status: 503, statusText: 'Offline' });
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

// التعامل مع التفاعل مع إشعار الأذان على شاشة القفل
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // إذا ضغط المستخدم على "كتم" لا نفتح التطبيق
  if (event.action === 'dismiss') {
    return;
  }

  // إذا ضغط على "صلّ الآن" أو على الإشعار نفسه: نفتح التطبيق ونظهر شاشة الأذان
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({ type: 'OPEN_ADHAN_SCREEN', prayerKey: event.notification.data?.prayerKey });
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./index.html');
      }
    })
  );
});
