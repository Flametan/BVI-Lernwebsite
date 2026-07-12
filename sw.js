const CACHE = 'bvi-v8';
const PRECACHE = ['./icons/icon-192.svg', './icons/icon-512.svg', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isCore = url.pathname.endsWith('.html') || url.pathname.endsWith('.css')
              || url.pathname.endsWith('.js')   || url.pathname.endsWith('/')
              || url.pathname === '';

  if(isCore){
    // Network-first: immer frisch vom Server, Cache nur als Offline-Fallback
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if(res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache-first für Icons/Bilder
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        if(res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }))
    );
  }
});
