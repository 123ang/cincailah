const CACHE_NAME = 'cincailah-v2';
const OFFLINE_ASSETS = [
  '/',
  '/solo',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Only cache http(s) GETs that return a full 200 OK. This avoids:
//  - "Request scheme 'chrome-extension' is unsupported"
//  - "Partial response (status code 206) is unsupported"
//  - accidentally caching opaque/error responses
function isCacheableRequest(request) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  return true;
}

function isCacheableResponse(response) {
  if (!response) return false;
  if (response.status !== 200) return false; // skip 206, 3xx, errors
  if (response.type === 'opaque' || response.type === 'opaqueredirect') return false;
  return true;
}

function safeCachePut(request, response) {
  if (!isCacheableRequest(request) || !isCacheableResponse(response)) return;
  const clone = response.clone();
  caches
    .open(CACHE_NAME)
    .then((cache) => cache.put(request, clone))
    .catch(() => {
      // ignore cache write failures (quota, scheme, etc.)
    });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!isCacheableRequest(request)) return;

  const url = new URL(request.url);
  const isStatic =
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/foods/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js');

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          safeCachePut(request, res);
          return res;
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((res) => {
        safeCachePut(request, res);
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        return cached || caches.match('/');
      })
  );
});

self.addEventListener('push', (event) => {
  let payload = { title: 'Cincailah', body: 'Time to makan!', url: '/' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // ignore malformed payload
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: payload.url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  const url = event.notification?.data?.url || '/';
  event.notification.close();
  event.waitUntil(self.clients.openWindow(url));
});
