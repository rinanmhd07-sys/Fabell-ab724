const CACHE_NAME = 'fabel-shell-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('fabel-shell-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Never cache account, database, storage, or configuration responses.
  if (/\/(rest\/v1|auth\/v1|storage\/v1|functions\/v1)(\/|$)/.test(url.pathname) || url.pathname === '/config.js') return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put('/', response.clone()));
      return response;
    }).catch(async () => (await caches.match(req)) || (await caches.match('/'))));
    return;
  }
  if (SHELL.includes(url.pathname)) {
    event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(req, response.clone()));
      return response;
    })));
  }
});