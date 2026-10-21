const APP_VERSION = '3.0.0'; // keep in sync with js/version.js
const CACHE = 'bvi-v' + APP_VERSION;
const PRECACHE = [
  './',
  './index.html',
  './css/style.css',
  './css/fonts.css',
  './fonts/dmmono-400-latin-ext.woff2',
  './fonts/dmmono-400-latin.woff2',
  './fonts/dmmono-500-latin-ext.woff2',
  './fonts/dmmono-500-latin.woff2',
  './fonts/roboto-400-latin-ext.woff2',
  './fonts/roboto-400-latin.woff2',
  './js/app.js',
  './js/idf-data.js',
  './js/pause.js',
  './js/pause-data.js',
  './js/duell.js',
  './js/jsqr.min.js',
  './js/version.js',
  './js/qrcode.min.js',
  './manifest.json',
  './data/plan-overrides.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

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
              || url.pathname.endsWith('.js')   || url.pathname.endsWith('.json') || url.pathname.endsWith('/')
              || url.pathname === '';

  if(isCore){
    // Network-first: immer frisch vom Server, Cache nur als Offline-Fallback
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' }) // immer beim Server nachfragen, nicht aus dem Browser-Zwischenspeicher
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
