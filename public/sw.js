/**
 * Service Worker básico para desarrollo
 * Este archivo es generado automáticamente por Workbox en producción
 * Para desarrollo, proporcionamos una versión básica
 */

const CACHE_NAME = 'activos-fijos-dev-cache-v1';

// Archivos a cachear en desarrollo
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/_next/static/css/',
  '/_next/static/js/',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Evento de instalación
self.addEventListener('install', (event) => {
  console.log('[SW Dev] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW Dev] Caching static assets...');
      return cache.addAll(STATIC_CACHE_URLS).catch((error) => {
        console.warn('[SW Dev] Failed to cache some assets:', error);
        // No fallar si algunos assets no se pueden cachear
      });
    })
  );

  // Forzar activación inmediata
  self.skipWaiting();
});

// Evento de activación
self.addEventListener('activate', (event) => {
  console.log('[SW Dev] Activating service worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW Dev] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Tomar control inmediatamente
      return self.clients.claim();
    })
  );
});

// Evento de fetch
self.addEventListener('fetch', (event) => {
  // Solo manejar requests GET
  if (event.request.method !== 'GET') return;

  // No cachear requests de API
  if (event.request.url.includes('/api/') ||
      event.request.url.includes('/graphql') ||
      event.request.url.includes('localhost:8082')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Solo cachear responses exitosas
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Cachear assets estáticos
        if (event.request.url.match(/\.(css|js|png|jpg|jpeg|svg|ico|woff|woff2)$/)) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      }).catch((error) => {
        console.log('[SW Dev] Fetch failed, serving offline page:', error);

        // Si es una página, servir página offline
        if (event.request.mode === 'navigate') {
          return caches.match('/offline');
        }

        return new Response('', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});

// Evento de mensaje (para comunicación con la app)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW Dev] Skipping waiting...');
    self.skipWaiting();
  }
});
