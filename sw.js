importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
  console.log('¡Genial! Workbox está cargado');

  // Fuerza a que el nuevo Service Worker tome el control en cuanto se instala
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  

  // Estrategia: Stale-While-Revalidate (Carga del caché pero actualiza por detrás)
  // Ideal para CSS, JS y el propio HTML

  // 1. Para el HTML y los Scripts (Prioridad: Estar al día)
workbox.routing.registerRoute(
  ({request}) => request.destination === 'document' || 
                 request.destination === 'script' ||
                 request.destination === 'style',
  new workbox.strategies.NetworkFirst({
    cacheName: 'recursos-criticosv2',
    networkTimeoutSeconds: 3,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50, // No llenamos el móvil de basura
      }),
    ],
  })
);

// 2. Para imágenes (Prioridad: Velocidad)
// Aquí sí usamos CacheFirst porque las imágenes no cambian cada hora
workbox.routing.registerRoute(
  ({request}) => request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'imagenes-cachev2',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
      }),
    ],
  })
);


} else {
  console.log('Workbox falló al cargar');
}

// Escuchar el evento 'push'
self.addEventListener('push', function(event) {
    console.log('[Service Worker] Push recibido.');

    // Valores por defecto por si falla el parseo
    let data = { 
        titulo: 'Alerta de Sistema', 
        contenido: 'Hay nuevas actualizaciones disponibles.',
        url: '/' 
    };

    if (event.data) {
        try {
            const rawData = event.data.json();
            // Mapeo flexible: acepta 'titulo' o 'title', 'contenido' o 'body'
            data.titulo = rawData.titulo || rawData.title || data.titulo;
            data.contenido = rawData.contenido || rawData.body || data.contenido;
            // Extraer la URL si viene dentro de un objeto 'data' o en la raíz
            data.url = (rawData.data && rawData.data.url) || rawData.url || data.url;
        } catch (e) {
            data.contenido = event.data.text();
        }
    }

    const options = {
        body: data.contenido,
        icon: 'icons/icon-192.png', 
        badge: 'icons/icon-72.png', 
        vibrate: [200, 100, 200],
        data: {
            url: data.url // Guardamos la URL para el evento 'notificationclick'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.titulo, options)
    );
});

// Escuchar el click en la notificación (Este código ya lo tienes bien)
self.addEventListener('notificationclick', function(event) {
    event.notification.close(); // Cierra el globito de la notificación

    // La URL que quieres mostrar (la de tu PWA)
    const urlBusqueda = new URL(event.notification.data.url, self.location.origin).href;

    event.waitUntil(
        // Buscamos todas las ventanas/pestañas abiertas por este Service Worker
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(windowClients) {
            // 1. Intentamos encontrar una ventana que ya tenga nuestra URL abierta
            for (let i = 0; i < windowClients.length; i++) {
                let client = windowClients[i];
                // Si la URL coincide y tiene la capacidad de ponerse en foco
                if (client.url === urlBusqueda && 'focus' in client) {
                    return client.focus();
                }
            }
            // 2. Si no hay ninguna abierta (App cerrada), entonces sí la abrimos
            // Al estar la PWA instalada, Android debería abrirla en su propio contenedor
            if (clients.openWindow) {
                return clients.openWindow(urlBusqueda);
            }
        })
    );
});
