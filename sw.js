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

    let data = { titulo: 'Alerta de Datos', contenido: 'Algo ha cambiado.' };

    // Si el servidor envía un JSON, lo parseamos
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.contenido = event.data.text();
        }
    }

    const options = {
        body: data.contenido,
        icon: '/icons/icon-192.png', // Tu icono de PWA
        badge: '/icons/icon-72.png', // Icono pequeño para la barra de estado
        vibrate: [100, 50, 100],      // Vibración (opcional)
        data: {
            url: '/' // Podrías poner aquí una URL específica para abrir al pulsar
        }
    };

    // Mostrar la notificación
    event.waitUntil(
        self.registration.showNotification(data.titulo, options)
    );
});

// Escuchar el click en la notificación
self.addEventListener('notificationclick', function(event) {
    event.notification.close(); // Cerramos la notificación

    // Abrir la app o llevar a una sección concreta
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
