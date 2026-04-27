importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
  console.log('¡Genial! Workbox está cargado');

  // Fuerza a que el nuevo Service Worker tome el control en cuanto se instala
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  

  // Estrategia: Stale-While-Revalidate (Carga del caché pero actualiza por detrás)
  // Ideal para CSS, JS y el propio HTML
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'script' ||
                   request.destination === 'style' ||
                   request.destination === 'document',
    new workbox.strategies.NetworkFirst({
      cacheName: 'recursos-dinamicos',
    })
  );
// Estrategia: Cache First (Caché primero) para imágenes y fuentes
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'imagenes-cache',
    })
  );


} else {
  console.log('Workbox falló al cargar');
}