// Comprobamos si el navegador es compatible con Service Workers
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('✅ PWA: Service Worker registrado con éxito');
            })
            .catch(error => {
                console.log('❌ PWA: Error al registrar el Service Worker:', error);
            });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof APP_VERSION !== 'undefined') {
        const versionElement = document.getElementById('app-version');
        if (versionElement) {
            versionElement.textContent = (typeof APP_VERSION !== 'undefined') ? APP_VERSION : 'Desconocida';
        }
    }
});



/**
 * Nota: Al no usar preventDefault() en el evento 'beforeinstallprompt',
 * Chrome en Android mostrará automáticamente el "Mini-infobar" o el
 * banner de instalación cuando considere que el usuario ha interactuado
 * lo suficiente con la página.
 */
/*
let deferredPrompt;


// 2. Manejo de Instalación para Android / Chrome / Edge
window.addEventListener('beforeinstallprompt', (e) => {
    // Evitamos que aparezca el banner por defecto
    e.preventDefault();
    deferredPrompt = e;
    
    // Aquí podrías mostrar TU PROPIO botón de instalación
    // Ejemplo: document.getElementById('btnInstalar').style.display = 'block';
    console.log('PWA lista para instalar en Android/Windows');
});

// 3. Función para llamar cuando el usuario pulse tu botón de instalar
async function instalarApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Respuesta del usuario: ${outcome}`);
        deferredPrompt = null;
    }
}

// 4. Detección específica para iOS (Safari)
const isIos = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

// Si es iOS y no está instalada, podemos mostrar un mensaje de ayuda
const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

if (isIos() && !isInStandaloneMode()) {
    console.log('Estás en iOS. Para instalar: pulsa Compartir > Añadir a pantalla de inicio.');
    // Aquí podrías mostrar un pequeño aviso o flecha señalando hacia abajo
}
*/