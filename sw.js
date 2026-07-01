const CACHE = 'kavya-hq-v3';
const ASSETS = [
  '/',
  '/kavya-dashboard.html',
  '/timer.html',
  '/weekly-plan.html',
  '/study-tracker.html',
  '/icon.svg',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  // Force the new SW to activate immediately, don't wait for old tabs to close
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim()) // Take control of all open tabs immediately
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Never intercept Firebase, Google APIs, or auth requests
  if (url.includes('firebase') || url.includes('googleapis') || url.includes('gstatic') || url.includes('google.com')) return;

  // For HTML pages: network first, fall back to cache
  // This means you always get the latest version when online
  if (e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // For other assets: cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
