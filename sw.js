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
    cacheName: 'recursos-criticos',
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
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'imagenes-cache',
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