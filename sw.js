const APP_VERSION = '3.0.4'; // keep in sync with js/version.js
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
  './js/jg.js',
  './js/faq.js',
  './js/jg-ui.js',
  './js/app.js',
  './js/idf-data.js',
  './js/pause.js',
  './js/pause-data.js',
  './js/duell.js',
  './js/snake.js',
  './js/solitaer.js',
  './js/minesweeper.js',
  './js/raumplan.js',
  './embed/stabskarte.html',
  './embed/embed-sync.js',
  './embed/vb-lernen.html',
  './embed/vb-lernstoff.js',
  './embed/gk.html',
  './embed/gk.js',
  './embed/gk-katalog.js',
  './embed/sonderbau.html',
  './embed/sonderbau.js',
  './embed/lib/react.min.js',
  './embed/lib/react-dom.min.js',
  './js/three.min.js',
  './js/jsqr.min.js',
  './js/version.js',
  './js/qrcode.min.js',
  './manifest.json',
  './data/plan-overrides.json',
  './data/speiseplan.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/icon-maskable-512.png',
  './img/armaturen/seite01_bild1.png',
  './img/armaturen/seite01_bild2.png',
  './img/armaturen/seite02_bild1.png',
  './img/armaturen/seite04_bild1.png',
  './img/armaturen/seite04_bild2.png',
  './img/armaturen/seite04_bild3.png',
  './img/armaturen/seite05_bild1.png',
  './img/armaturen/seite05_bild2.png',
  './img/armaturen/seite05_bild3.png',
  './img/atemschutz/seite01_bild1.png',
  './img/atemschutz/seite01_bild2.png',
  './img/atemschutz/seite01_bild3.png',
  './img/atemschutz/seite03_bild1.png',
  './img/atemschutz/seite04_bild1.png',
  './img/atemschutz/seite04_bild2.png',
  './img/atemschutz/seite04_bild3.png',
  './img/atemschutz/seite05_bild1.png',
  './img/atemschutz/seite06_bild1.png',
  './img/atemschutz/seite06_bild2.png',
  './img/atemschutz/seite11_bild1.png',
  './img/atemschutz/seite11_bild2.png',
  './img/atemschutz/seite12_bild1.png',
];

self.addEventListener('install', e => {
  // Einzeln mit cache:'reload' laden (kein veralteter Browser-Cache) und ablegen;
  // ein fehlschlagendes Bild verhindert die Installation nicht.
  e.waitUntil(caches.open(CACHE).then(cache => Promise.all(PRECACHE.map(u =>
    fetch(new Request(u, { cache: 'reload' }))
      .then(res => { if(!res.ok) throw new Error(u + ' ' + res.status); return cache.put(u, res); })
      .catch(err => { if(!u.startsWith('./img/')) throw err; })
  ))));
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
  if(url.origin !== self.location.origin) return;
  const isCore = e.request.mode === 'navigate'
              || url.pathname.endsWith('.html') || url.pathname.endsWith('.css')
              || url.pathname.endsWith('.js')   || url.pathname.endsWith('.json') || url.pathname.endsWith('/')
              || url.pathname === '';

  const store = res => {
    if(res.ok){
      const copy = res.clone(); // synchron, bevor der Body gelesen wird
      e.waitUntil(caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {}));
    }
    return res;
  };

  if(isCore){
    // Network-first: immer frisch vom Server, Cache nur als Offline-Fallback
    // Bei langsamer Verbindung (länger als 3 s) erscheint die gespeicherte Seite sofort; die frische Version wird trotzdem geladen und abgelegt
    const fromCache = () => caches.match(e.request, { ignoreSearch: true })
      .then(r => r || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined));
    e.respondWith(new Promise(resolve => {
      let done = false;
      const t = setTimeout(() => { fromCache().then(r => { if(r && !done){ done = true; resolve(r); } }); }, 3000);
      fetch(e.request, { cache: 'no-cache' }) // immer beim Server nachfragen, nicht aus dem Browser-Zwischenspeicher
        .then(store)
        .then(res => { clearTimeout(t); if(!done){ done = true; resolve(res); } })
        .catch(() => { clearTimeout(t); if(!done) fromCache().then(r => { done = true; resolve(r || Response.error()); }); });
    }));
  } else {
    // Cache-first für Icons/Bilder
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(store))
    );
  }
});

// Die Seite fragt beim Nutzer nach und löst das Aktualisieren aus (statt automatischem Neuladen)
self.addEventListener('message', e => { if(e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
