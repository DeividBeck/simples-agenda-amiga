// Service Worker para PWA - Agenda Paroquial
const CACHE_NAME = 'agenda-paroquial-v1';
const urlsToCache = [
  '/agendaparoquial/',
  '/agendaparoquial/index.html',
  '/agendaparoquial/manifest.json',
  '/agendaparoquial/offline.html',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna do cache se encontrado
        if (response) {
          return response;
        }

        // Faz a requisição se não estiver no cache
        return fetch(event.request).then((response) => {
          // Verifica se a resposta é válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clona a resposta para o cache
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Fallback para páginas offline
        if (event.request.destination === 'document') {
          return caches.match('/offline.html') || caches.match('/');
        }
      })
  );
});

// Push notifications (para futuras implementações)
self.addEventListener('push', (event) => {

  const options = {
    body: event.data ? event.data.text() : 'Você tem uma nova notificação!',
    icon: 'lovable-uploads/logo.png',
    badge: 'lovable-uploads/logo.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver mais',
        icon: 'lovable-uploads/logo.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: 'lovable-uploads/logo.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Agenda Paroquial', options)
  );
});

// Background sync (para sincronização offline)
self.addEventListener('sync', (event) => {

  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Implementar lógica de sincronização aqui
    );
  }
});