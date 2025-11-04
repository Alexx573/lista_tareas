const CACHE_NAME = 'tareas-pwa-cache-v1';
// Archivos que componen el "App Shell"
const urlsToCache = [
  '/',
  'index.html',
  'main.js',
  'manifest.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/pouchdb@9.0.0/dist/pouchdb.min.js'
  // Agrega aquí las rutas a tus iconos (ej: '/images/icon-192.png')
];

// 1. Instalación del Service Worker: Guarda el App Shell en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto:', CACHE_NAME);
        // Agrega todos los archivos del App Shell al caché
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Activa el SW inmediatamente
  );
});

// 2. Activación: Limpia cachés antiguos (si los hay)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Toma control de la página
});

// 3. Estrategia de Fetch: Cache-First (Cache falling back to Network)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // 1. Intenta buscar en el caché
    caches.match(event.request)
      .then((response) => {
        // Si se encuentra en caché, la devuelve
        if (response) {
          return response;
        }

        // 2. Si no está en caché, va a la red
        return fetch(event.request)
          .then((networkResponse) => {
            // Clona la respuesta antes de guardarla en caché y devolverla
            const responseToCache = networkResponse.clone();
            
            // Abre el caché y guarda la nueva respuesta
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
              
            return networkResponse;
          })
          .catch((err) => {
            // Manejo de error si falla la red y no está en caché
            console.error('Fetch fallido:', err);
            // Podrías devolver una página de "offline" genérica aquí
          });
      })
  );
});