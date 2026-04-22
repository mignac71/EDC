const CACHE_NAME = 'chinatrip26-v3';
const APP_SHELL = [
  './chinatrip26.html',
  './chinatrip26.webmanifest',
  './images/chinatrip26-icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isDocumentRequest = event.request.mode === 'navigate' || event.request.destination === 'document';
  const isChinaTripPage = url.pathname.endsWith('/chinatrip26') || url.pathname.endsWith('/chinatrip26.html');

  if (isDocumentRequest || isChinaTripPage) {
    event.respondWith(
      fetch(new Request(event.request, { cache: 'no-store' }))
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./chinatrip26.html', copy));
          return response;
        })
        .catch(() => caches.match('./chinatrip26.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached || caches.match('./chinatrip26.html'));
      return cached || networkFetch;
    })
  );
});
