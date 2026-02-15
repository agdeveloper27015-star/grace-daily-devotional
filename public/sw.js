const CACHE_NAME = 'biblia-dabar-cache-v2';
const OFFLINE_URL = '/';
const DICTIONARY_INDEX_URL = '/data/dictionary/index.json';
const DICTIONARY_SYNC_MARKER_URL = '/data/dictionary/.sync-state.json';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/data/pt_acf.json',
  '/data/readingPlans/bibleInOneYear.json',
  DICTIONARY_INDEX_URL,
  '/og/cover.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => Promise.all(PRECACHE_URLS.map((url) => cache.add(url).catch(() => undefined))))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

const shouldCache = (request, response) => {
  if (!response || response.status !== 200) return false;
  if (request.method !== 'GET') return false;
  if (!request.url.startsWith(self.location.origin)) return false;
  return true;
};

const cacheFirst = async (request) => {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (shouldCache(request, response)) {
    const clone = response.clone();
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, clone);
  }

  return response;
};

const persistDictionarySyncMarker = async (payload) => {
  const cache = await caches.open(CACHE_NAME);
  const body = JSON.stringify(payload || {});
  await cache.put(
    DICTIONARY_SYNC_MARKER_URL,
    new Response(body, {
      headers: { 'content-type': 'application/json' },
    })
  );
};

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (event.data?.type === 'DICTIONARY_SYNC_COMPLETE') {
    event.waitUntil(
      persistDictionarySyncMarker({
        ...event.data.payload,
        synced: true,
        cache: CACHE_NAME,
      })
    );
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const isNavigation = request.mode === 'navigate';
  const url = new URL(request.url);
  const isStaticAsset =
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.webmanifest');

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (shouldCache(request, response)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  if (isStaticAsset) {
    event.respondWith(
      cacheFirst(request).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw new Error('offline');
      })
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      throw new Error('offline');
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Bíblia Dabar';
  const body = data.body || 'Seu lembrete diario de leitura chegou.';
  const url = data.url || '/';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
