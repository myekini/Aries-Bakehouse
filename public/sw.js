const VERSION = 'aries11-pwa-v1';
const PAGE_CACHE = `${VERSION}-pages`;
const ASSET_CACHE = `${VERSION}-assets`;
const PRECACHE = ['/', '/menu', '/offline', '/pwa-icon-192.png', '/pwa-icon-512.png'];
const PUBLIC_PAGE_PATHS = ['/', '/menu', '/about', '/contact', '/delivery', '/faq', '/privacy', '/returns', '/search', '/terms', '/offline'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE)
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('aries11-pwa-') && ![PAGE_CACHE, ASSET_CACHE].includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function isPublicPage(pathname) {
  return PUBLIC_PAGE_PATHS.some((path) => pathname === path || (path === '/menu' && pathname.startsWith('/menu/')));
}

async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGE_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) || (await caches.match('/offline'));
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request).then((response) => {
    if (response.ok && response.status === 200) cache.put(request, response.clone());
    return response;
  }).catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.headers.has('range')) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    if (isPublicPage(url.pathname)) event.respondWith(networkFirstPage(request));
    return;
  }

  if (['image', 'font', 'style', 'script'].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
