const CACHE_NAME = 'mappa-pwa-v0.8.6';
const urlsToCache = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/script.js",
  "./js/config.js",
  "./js/camera.js",
  "./js/mapRenderer.js",
  "./js/ui.js",
  "./js/pathfinder.js",
  "./assets/mappa.svg",
  "./assets/icons/icon-open-school-192.png",
  "./assets/icons/icon-open-school-512.png",
  "./assets/icons/icon-school-day-192.png",
  "./assets/icons/icon-school-day-512.png",
  "./config/base/stanze.json",
  "./config/custom/open-school.json",
  "./config/custom/school-day.json",
  "./config/navigation/grafo.js"
];

// Installazione: salvataggio file in cache (gestione resiliente)
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        urlsToCache.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[SW] Impossibile aggiungere alla cache: ${url}`, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Attivazione: pulizia vecchie cache
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercettazione richieste: risposta da cache se disponibile, altrimenti rete
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});