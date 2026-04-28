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

const CONFIG_MENU = {
    'Ayuda': [
        { nombre: 'FAQ', ejecutar: () => navegar('Preguntas', 'tipo2') },
        { nombre: 'Contacto', ejecutar: () => alert('Email enviado') }
    ]
};

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('beforeinstallprompt fired');
  e.preventDefault();
  deferredPrompt = e;
  // HACEMOS VISIBLE EL BOTÓN
  const btnInstall = document.getElementById('btn-install');
  if (btnInstall) {
    btnInstall.style.display = 'block';
    btnInstall.addEventListener('click', triggerInstall);
  }
  // aquí puedes mostrar tu botón instalar si quieres:
  // document.getElementById('btn-install').style.display = 'block';
});

async function triggerInstall() {
  if (!deferredPrompt) return;
  
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log('userChoice', outcome);
  
  if (outcome === 'accepted') {
    document.getElementById('btn-install').style.display = 'none';
  }
  deferredPrompt = null;
}


window.addEventListener('version-lista', () => {
    const versionElement = document.getElementById('app-version');
    if (versionElement && typeof APP_VERSION !== 'undefined') {
        versionElement.textContent = APP_VERSION;
        console.log("Versión actualizada a:", APP_VERSION);
    }
});


let paginaPadreActual = {
    nombre: 'Principal',
    id: 'page-home'
};

// =========================================
// 1. GESTIÓN DEL MENÚ LATERAL Y OVERLAY
// =========================================

function toggleMenu() {
    const menu = document.getElementById('side-menu');
    const overlay = document.getElementById('overlay');
    
    const isOpen = menu.classList.contains('open');

    if (isOpen) {
        menu.classList.remove('open');
        overlay.style.display = 'none';
    } else {
        menu.classList.add('open');
        overlay.style.display = 'block';
    }
}


// =========================================
// 2. NAVEGACIÓN Y CAMBIO DE VISTAS
// =========================================

function navegar(nombre, tipo, idPagina, acciones = []) {
    // 1. Limpieza de UI
    const menu = document.getElementById('side-menu');
    const overlay = document.getElementById('overlay');
    menu.classList.remove('open');
    overlay.style.display = 'none';

    // 2. Gestión de Secciones (Cuerpo)
    if (idPagina !== '_self' && idPagina !== null) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const targetPage = document.getElementById(idPagina);
        if (targetPage) {
            targetPage.classList.add('active');
            document.getElementById('app-content').scrollTop = 0;
        }
    }

    // 3. Gestión de Header
    const mainNav = document.getElementById('header-main-nav');
    const backNav = document.getElementById('header-back-nav');
    const submenu = document.getElementById('submenu-content');
    const dotMenu = document.getElementById('dropdown-container'); // Importante tener este ID

    if (tipo === 'tipo1') {
        // CORRECCIÓN: Solo guardamos como padre si el ID es real, no si es '_self'
        if (idPagina !== '_self') {
            paginaPadreActual = { nombre, id: idPagina, acciones };
        }

        mainNav.style.display = 'flex';
        backNav.style.display = 'none';
        document.getElementById('header-title').innerText = nombre;

        // Limpieza y Reconstrucción del submenú
        submenu.innerHTML = '';
        
        if (acciones.length > 0) {
            dotMenu.style.display = 'block'; // Mostramos los tres puntos
            acciones.forEach(acc => {
                if (!acc.ejecutar) return;
                const btn = document.createElement('button');
                btn.innerText = acc.nombre;
                btn.onclick = () => {
                    if (typeof acc.ejecutar === 'function') acc.ejecutar();
                    toggleSubMenu();
                };
                submenu.appendChild(btn);
            });
        } else {
            dotMenu.style.display = 'none'; // Ocultamos si no hay acciones
        }

    } else {
        // Tipo 2 (Subpágina)
        mainNav.style.display = 'none';
        backNav.style.display = 'flex';
        document.getElementById('header-subtitle').innerText = nombre;
    }
}

function volver() {
    // Navegamos de vuelta a la página padre que guardamos previamente
    navegar(
        paginaPadreActual.nombre, 
        'tipo1', 
        paginaPadreActual.id, 
        paginaPadreActual.acciones
    );
}


// =========================================
// 3. SUBMENÚ (TRES PUNTOS) Y CLICKS EXTERNOS
// =========================================

function toggleSubMenu() {
    const sub = document.getElementById('submenu-content');
    sub.classList.toggle('show');
}

// Cerrar submenú o menú lateral si se hace click fuera
window.onclick = function(event) {
    const menu = document.getElementById('side-menu');
    const sub = document.getElementById('submenu-content');
    const overlay = document.getElementById('overlay');

    // CASO A: El usuario hace click/touch en el overlay (fuera del menú)
    if (event.target === overlay) {
        // Solo cerramos si el menú está abierto
        if (menu.classList.contains('open')) {
            toggleMenu();
        }
    }
    
    // CASO B: Cerrar el submenú de los tres puntos si toca en cualquier otro lado
    if (!event.target.matches('.icon-btn')) {
        if (sub && sub.classList.contains('show')) {
            sub.classList.remove('show');
        }
    }
}

// =========================================
// 4. ESTADO DE CONEXIÓN (FOOTER)
// =========================================

window.addEventListener('online', () => updateStatus(true));
window.addEventListener('offline', () => updateStatus(false));

function updateStatus(online) {
    const status = document.getElementById('connection-status');
    if (!status) return; // Evita errores si el span no existe aún
    
    if (online) {
        status.innerText = "● Online";
        status.style.color = "green";
    } else {
        status.innerText = "○ Offline";
        status.style.color = "red";
    }
}


// VARIABLES PARA EL GESTO TÁCTIL
let touchStartX = 0;
let touchEndX = 0;

const sideMenu = document.getElementById('side-menu');

// Detectar cuando el usuario pone el dedo en la pantalla
sideMenu.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
}, {passive: true});

// Detectar cuando el usuario mueve y levanta el dedo
sideMenu.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, {passive: true});

function handleSwipe() {
    // Si el movimiento hacia la izquierda es mayor a 50px, cerramos
    if (touchStartX - touchEndX > 50) {
        if (sideMenu.classList.contains('open')) {
            toggleMenu();
        }
    }
}

//recuperamos el pullñ-tp-refresh

let touchStartPull = 0;
const contentArea = document.getElementById('app-content');


contentArea.addEventListener('touchstart', e => {
    touchStartPull = e.touches[0].clientY;
}, {passive: true});

contentArea.addEventListener('touchmove', e => {
    // Si el menú está abierto, NO permitimos la recarga por error
    if (sideMenu.classList.contains('open')) return;

    const touchY = e.touches[0].clientY;
    const scrollTop = contentArea.scrollTop;

    // Solo si estamos arriba del todo y el movimiento es hacia abajo
    if (scrollTop === 0 && (touchY - touchStartPull) > 150) {
        // Opcional: podrías poner un aviso visual aquí
        
        window.location.reload();
    }
}, {passive: true});

function actualizaAlgo(){
    generarContenidoAleatorio('algo');
}
function generarContenidoAleatorio(idDestino) {
    const elemento = document.getElementById(idDestino);
    if (!elemento) return;

    const opciones = [
        () => `Número aleatorio: <b>${Math.floor(Math.random() * 1000)}</b>`,
        () => `Frase del momento: <b>${obtenerFrase()}</b>`,
        () => `Estado del sistema: <span style="color: ${Math.random() > 0.5 ? 'green' : 'red'}">● Activo</span>`,
        () => `Hora de actualización: <b>${new Date().toLocaleTimeString()}</b>`
    ];

    // Elegimos una función al azar del array y la ejecutamos
    const seleccionada = opciones[Math.floor(Math.random() * opciones.length)];
    elemento.innerHTML = seleccionada();
}

function obtenerFrase() {
    const frases = [
        "La persistencia es la clave del éxito.",
        "PWA: Rápida, instalable y fiable.",
        "El código es poesía escrita en lógica.",
        "Si puedes imaginarlo, puedes programarlo."
    ];
    return frases[Math.floor(Math.random() * frases.length)];
}

function accionA() {
    alert("Ejecutando Acción A");
}

function abrirAjustes() {
    console.log("Abriendo abrirAjustes...");
}

function abrirTutorial() {
    console.log("Abriendo abrirTutorial...");
}

function contactarSoporte() {
    console.log("Abriendo contactarSoporte...");
}

function ponerModoOscuro() {
    const pagina = document.getElementById('page-ajustes');
    pagina.style.backgroundColor = '#333';
    pagina.style.color = 'white';
}

document.addEventListener('DOMContentLoaded', () => {
    // Opción A: Llamar directamente a la función con los datos de la home
    // Esto asegura que la App arranque en 'Principal'
    /*navegar('Principal', 'tipo1', 'page-home', [
        { nombre: 'Subopcion 1', ejecutar: () => navegar('Subopcion 1', 'tipo2', 'page-home-sub1') },
        { nombre: 'Subopcion 2', ejecutar: () => navegar('Subopcion 2', 'tipo2', 'page-home-sub2') }
    ]);
    */
    // Opción B (Más automática): Si quieres que siempre sea el primer <li> del menú
    //const primerItem = document.querySelector('#side-menu li');
    //if (primerItem) primerItem.click();
    // opcion C, la B no funciona, no muestra el submenu
    const primerItem = document.querySelector('#side-menu li');
    if (primerItem) {
        // Obtenemos el texto que hay dentro del atributo onclick
        const codigoOnClick = primerItem.getAttribute('onclick');
        // Lo ejecutamos manualmente
        if (codigoOnClick) {
            eval(codigoOnClick); 
        }
    }
});


async function buscarActualizacionesRadical() {
    console.log("Iniciando purga nuclear...");

    try {
        // 1. Borrar todas las cachés (esto ya lo hacías bien, es vital)
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log("Cachés borradas");

        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                await registration.unregister();
            }
            console.log("Service Workers desregistrados");
        }

        // 2. EL TRUCO MAESTRO: Evitar la caché del navegador en la recarga
        // En lugar de un reload normal, añadimos un parámetro aleatorio a la URL
        // Esto obliga al navegador a pensar que es una página nueva
        const url = new URL(window.location.href);
        url.searchParams.set('v', Date.now()); // Ej: ?v=1714382000
        
        console.log("Redirigiendo a versión limpia...");
        window.location.href = url.toString();

    } catch (error) {
        console.error("Error en la purga:", error);
        window.location.reload(); // Fallback
    }
}


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