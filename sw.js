/**
 * Beer Cellar — Service Worker
 * Strategia: Cache-First per asset statici, con aggiornamento in background (stale-while-revalidate).
 * I dati dell'app sono in localStorage → nessun sync remoto necessario.
 */

const APP_VERSION   = 'v1.0.0';
const CACHE_STATIC  = `beer-cellar-static-${APP_VERSION}`;
const CACHE_FONTS   = `beer-cellar-fonts-${APP_VERSION}`;
const ALL_CACHES    = [CACHE_STATIC, CACHE_FONTS];

// Asset da precachare all'installazione
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg',
];

// Host di font da trattare con cache separata (stale-while-revalidate)
const FONT_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

// ─────────────────────────────────────────────────────────────────────────────
// INSTALL — precaching sincrono
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      // Attiva subito senza attendere che le tab esistenti vengano chiuse
      return self.skipWaiting();
    })
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVATE — pulizia vecchie cache
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => !ALL_CACHES.includes(key))
          .map((key) => {
            console.log('[SW] Eliminazione cache obsoleta:', key);
            return caches.delete(key);
          })
      );
    }).then(() => {
      // Prendi controllo di tutte le tab aperte immediatamente
      return self.clients.claim();
    })
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// FETCH — routing strategico per tipo di risorsa
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora richieste non-GET e richieste verso estensioni browser
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // ── Font Google: stale-while-revalidate ──────────────────────────────────
  if (FONT_HOSTS.some((host) => url.hostname === host)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_FONTS));
    return;
  }

  // ── App shell & asset locali: cache-first ────────────────────────────────
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── Tutto il resto: network con fallback cache ───────────────────────────
  event.respondWith(networkWithCacheFallback(request));
});

// ─────────────────────────────────────────────────────────────────────────────
// STRATEGIE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cache-First: restituisce dalla cache se disponibile, altrimenti scarica
 * dalla rete e aggiorna la cache.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_STATIC);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Offline e non in cache → restituisce l'app shell come fallback
    const fallback = await caches.match('./index.html');
    if (fallback) return fallback;
    return new Response('Offline — apri l\'app quando sei connesso.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

/**
 * Stale-While-Revalidate: risponde subito dalla cache (se disponibile)
 * e in background aggiorna la cache con la versione di rete.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache   = await caches.open(cacheName);
  const cached  = await cache.match(request);

  const networkFetch = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);

  return cached || networkFetch;
}

/**
 * Network-First con fallback cache: tenta la rete, se fallisce usa la cache.
 */
async function networkWithCacheFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_STATIC);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Risorsa non disponibile offline.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE CHANNEL — comunicazione con la pagina
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (!event.data) return;

  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_VERSION':
      event.ports[0]?.postMessage({ version: APP_VERSION });
      break;

    case 'CACHE_PURGE':
      caches.keys().then((keys) =>
        Promise.all(keys.map((k) => caches.delete(k)))
      ).then(() => {
        event.ports[0]?.postMessage({ ok: true });
      });
      break;
  }
});
