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
    ejecutarLogicaDePagina(idPagina);
}

function ejecutarLogicaDePagina(idSeccion) {
    switch(idSeccion) {
        case 'page-configuracion-api':
            // Rellenamos el input con lo que haya en LocalStorage
            const urlGuardada = localStorage.getItem('API_BASE_URL') || '';
            const input = document.getElementById("URLAPI");
            if (input) {
                input.value = urlGuardada;
            }
            break;

        case 'page-perfil-usuario':
            // Ejemplo: Rellenar nombre de usuario
            document.getElementById("nombreUser").value = localStorage.getItem('user_name') || '';
            break;

        case 'page-datos-ine':
            // Podrías disparar la carga de datos del JSON automáticamente si quieres
            // cargarDatosINE();
            break;
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


async function actualizarDatosSistema() {
    const btnContent = document.getElementById('header-title'); // O donde quieras mostrar el feedback
    const originalText = btnContent.innerText;

    try {
        // 1. Feedback visual inicial
        btnContent.innerText = "🔄 Actualizando...";

        // 2. Llamada asíncrona al dominio
        // Añadimos un timestamp para evitar cachés de red agresivas
        const respuesta = await fetch(`https://servicios.ine.es/wstempus/js/es/VALORES_VARIABLE/115?det=f&t=${Date.now()}`);
        
        if (!respuesta.ok) throw new Error("Error en la red");

        const nuevosDatos = await respuesta.json();

        // 3. Persistencia Local
        // Guardamos el JSON completo para uso offline futuro
        localStorage.setItem('datos_app', JSON.stringify(nuevosDatos));
        
        // Si usas IndexedDB para datos pesados, aquí iría la lógica de apertura y guardado
        // await guardarEnIndexedDB(nuevosDatos); 

        // 4. Actualizar la pantalla
        // En lugar de recargar, llamamos a una función que pinte los nuevos datos
        renderizarDatosEnPantalla(nuevosDatos);

        alert("¡Datos actualizados con éxito!");

    } catch (error) {
        console.error("Fallo al actualizar:", error);
        alert("No se pudo actualizar. Se usarán los datos locales.");
    } finally {
        // 5. Restaurar interfaz
        btnContent.innerText = originalText;
    }
}

/**
 * Renderiza el JSON en crudo dentro de un contenedor
 * @param {Object} datos - El objeto JSON devuelto por la API
 */
function renderizarDatosEnPantalla(datos) {
    const contenedor = document.getElementById('app-content-config-server'); // O el ID de tu página activa
    
    // Usamos JSON.stringify con parámetros (null, 2) para que lo formatee con sangría
    contenedor.innerHTML = `
        <div style="padding: 20px;">
            <h3>Datos Recibidos:</h3>
            <pre style="background: #f4f4f4; border: 1px solid #ccc; padding: 15px; overflow-x: auto; border-radius: 5px;">
${JSON.stringify(datos, null, 2)}
            </pre>
        </div>
    `;
}



// FUNCION 1: El "almacén" de la llave pública
async function obtenerVAPIDpublickey() {
    const apiBase = localStorage.getItem('API_BASE_URL');
    
    // Si no hay URL configurada, el esqueleto avisa elegantemente
    if (!apiBase || apiBase.includes('ponaquitudominio')) {
        alert("⚠️ Configuración necesaria: Por favor, introduce una URL de API válida en los ajustes para activar las alertas.");
        return null; 
    }

    let llave = localStorage.getItem('vapid_public_key');
    if (!llave) {
        try {
            // 2. Intentamos la petición
            const resp = await fetch(`${apiBase}get-vapid-key.php`);
            
            // Si el servidor responde pero con un error (ej. 404 No encontrado)
            if (!resp.ok) {
                throw new Error(`El servidor respondió con un error ${resp.status}`);
            }

            const data = await resp.json();
            
            // Si el JSON no tiene lo que buscamos
            if (!data.public_key) {
                throw new Error("El JSON recibido no contiene la clave 'public_key'");
            }

            llave = data.public_key;
            localStorage.setItem('vapid_public_key', llave);

        } catch (error) {
            // 3. Si la URL no existe, no hay internet, o el JSON es inválido
            console.error("Error al obtener VAPID:", error);
            alert(`❌ Error de conexión con la API:\n${error.message}\n\nRevisa la URL en la configuración.`);
            
            // Opcional: Limpiamos la URL mal puesta para que no siga fallando
            // localStorage.removeItem('API_BASE_URL'); 
            
            return null; // Abortamos el proceso
        }
    }
    return llave;
}

// FUNCION 2: El enlace con el Navegador (Service Worker)
async function obtenerDireccionPostal() {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
        const llavePublica = await obtenerVAPIDpublickey(); // Llama a la Func 1
        if (!llavePublica) return null;
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(llavePublica)
        });
    }
    return subscription;
}

// FUNCION 3: El enlace con tu lógica de negocio (PHP)
async function registrarAlertaEnServidor(idEstacion) {
    const apiBase = localStorage.getItem('API_BASE_URL');
    
    // Si no hay URL configurada, el esqueleto avisa elegantemente
    if (!apiBase || apiBase.includes('ponaquitudominio')) {
    alert("⚠️ Configuración necesaria: Por favor, introduce una URL de API válida en los ajustes para activar las alertas.");
        return null; 
    }

    const sub = await obtenerDireccionPostal(); // Llama a la Func 2
    
    await fetch(`${apiBase}gestionar-alertas.php`, {
        method: 'POST',
        body: JSON.stringify({
            subscription: sub,
            estacion: idEstacion
        })
    });
    guardarAlertaLocalmente(idEstacion);
}

function guardarAlertaLocalmente(idEstacion) {
    let alertas = JSON.parse(localStorage.getItem('mis_alertas_aemet') || '[]');
    
    // Si no está ya en la lista, la añadimos
    if (!alertas.includes(idEstacion)) {
        alertas.push(idEstacion);
        localStorage.setItem('mis_alertas_aemet', JSON.stringify(alertas));
    }
}

// Al guardar la configuración
function guardarConfiguracionManual() {
    const input = document.getElementById("URLAPI");
    let urlIntroducida = input.value.trim(); // .trim() quita espacios accidentales al inicio/final

    // 1. Validar que no esté vacío
    if (!urlIntroducida) {
        alert("⚠️ Por favor, introduce una URL.");
        return;
    }

    // 2. Validar que empiece por https
    if (!urlIntroducida.startsWith('https://')) {
        alert("❌ Error: La URL debe empezar por https:// (las PWA no aceptan conexiones inseguras).");
        return;
    }
    // Aseguramos que termine en barra para evitar errores de concatenación
    const urlLimpia = urlIntroducida.endsWith('/') ? urlIntroducida : urlIntroducida + '/';
    localStorage.setItem('API_BASE_URL', urlLimpia);
    
    // Limpiamos la VAPID key antigua para forzar a la PWA a pedir la nueva al nuevo dominio
    localStorage.removeItem('vapid_public_key');
    
    alert("✅ Configuración guardada correctamente.");
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
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