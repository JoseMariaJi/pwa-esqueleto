/**
 * Lógica de Video y Grabación para PWA de Fisioterapia
 */

let player;           // Objeto del reproductor de YouTube
let mediaRecorder;    // Objeto para grabar la cámara
let recordedChunks = []; // Almacén temporal de los datos de video
let stream;           // El flujo de la cámara
let grabando = false; // Flag de estado

// 1. CARGA ASÍNCRONA DE LA API DE YOUTUBE
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Esta función la llama automáticamente la API de YT cuando está lista
function onYouTubeIframeAPIReady() {
    console.log("API de YouTube lista");
}

/**
 * Función principal disparada desde 'page-videos'
 */
async function prepararSesionVideo(youtubeId) {
    // 1. Cambiar sección
    activarSeccion('section-video-player');
    
    // 2. Intentar forzar horizontal (Landscape)
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {
            console.log("El bloqueo de orientación requiere pantalla completa o no es soportado.");
        });
    }

    // A. Preguntar al usuario
    const quiereGrabar = confirm("¿Deseas grabarte realizando los ejercicios para tu terapeuta?");

    // C. Configurar el reproductor
    crearReproductorYoutube(youtubeId);

    if (quiereGrabar) {
        configurarModoGrabacion();
    } else {
        configurarModoSoloVideo();
    }
}
/**
 * Caso 1: El usuario SÍ quiere grabarse (Encuadre previo)
 */
async function configurarModoGrabacion() {
    try {
        grabando = true;
        const preview = document.getElementById('camera-preview');
        const msg = document.getElementById('status-msg');
        const btnMain = document.getElementById('btn-main-action');

        msg.innerText = "Posiciónate frente a la cámara";
        btnMain.innerText = "¡Listo! Empezar";
        btnMain.style.display = "block";

        // Activar cámara para el encuadre
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        preview.srcObject = stream;
        preview.style.display = "block"; // Mostramos el recuadro de la cámara

        // El botón iniciará la reproducción y la grabación simultánea
        btnMain.onclick = comenzarGrabacionYVideo;

    } catch (err) {
        alert("Error al acceder a la cámara. Se reproducirá solo el video.");
        configurarModoSoloVideo();
    }
}

/**
 * Caso 2: El usuario NO quiere grabarse
 */
function configurarModoSoloVideo() {
    grabando = false;
    
    // Referencias a los elementos
    const cameraPreview = document.getElementById('camera-preview');
    const statusMsg = document.getElementById('status-msg');
    const btnMain = document.getElementById('btn-main-action');

    // Comprobación de seguridad: si no existen, algo va mal en el HTML
    if (!cameraPreview || !statusMsg || !btnMain) {
        console.error("❌ No se encontraron los elementos necesarios en el DOM.");
        return;
    }

    cameraPreview.style.display = "none";
    statusMsg.innerText = "Pulsa play para empezar";
    
    btnMain.style.display = "block"; 
    btnMain.innerText = "Reproducir Ejercicio";
    btnMain.onclick = () => {
        if (player && typeof player.playVideo === "function") {
            player.playVideo();
            btnMain.style.display = "none";
        }
    };
}
/**
 * Inicia la grabación del paciente y el video de YouTube
 */
function comenzarGrabacionYVideo() {
    const btnMain = document.getElementById('btn-main-action');
    
    if (grabando) {
        recordedChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunks.push(e.data);
        };
        
        mediaRecorder.onstop = ofrecerEnvioAlTerapeuta;
        mediaRecorder.start();
    }

    player.playVideo();
    
    // Cambiar botón para poder finalizar manualmente
    btnMain.innerText = "Finalizar ahora";
    btnMain.classList.add('btn-danger');
    btnMain.onclick = detenerTodo;
}

/**
 * Detiene tanto el video como la grabación
 */
function detenerTodo() {
    if (player) player.pauseVideo();
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }
    // Si no estábamos grabando, simplemente salimos
    if (!grabando) salirDelReproductor();
}

/**
 * Procesa el video capturado y ofrece enviarlo
 */
async function ofrecerEnvioAlTerapeuta() {
    const quiereEnviar = confirm("Ejercicio terminado. ¿Quieres enviar la grabación a tu terapeuta?");
    
    if (quiereEnviar) {
        const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
        await enviarVideoAlServidor(videoBlob);
    }
    
    // Limpieza
    recordedChunks = [];
    salirDelReproductor();
}

/**
 * Envío del archivo al servidor (POST)
 */
async function enviarVideoAlServidor(blob) {
    const formData = new FormData();
    formData.append('video', blob, `ejercicio_${Date.now()}.webm`);

    try {
        const response = await fetch('https://tu-servidor.com/api/upload', {
            method: 'POST',
            body: formData
        });
        if (response.ok) alert("Video enviado con éxito.");
    } catch (err) {
        alert("Error al enviar el video. Asegúrate de tener conexión.");
    }
}

/**
 * Utilidades de Control y Navegación
 */
function crearReproductorYoutube(videoId) {
    // Si ya existe un reproductor, lo destruimos para cargar el nuevo limpio
    if (player) player.destroy();

    player = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: { 'playsinline': 1, 'modestbranding': 1 },
        events: {
            'onStateChange': (event) => {
                // Si el video de YouTube termina solo
                if (event.data === YT.PlayerState.ENDED) detenerTodo();
            }
        }
    });
}

function saltar10Segundos(segundos) {
    player.seekTo(player.getCurrentTime() + segundos, true);
}

function alternarMute() {
    player.isMuted() ? player.unMute() : player.mute();
}

function salirDelReproductor() {
    if (player) player.stopVideo();
    if (stream) stream.getTracks().forEach(t => t.stop());
    activarSeccion('page-videos');
}

// Función auxiliar para tu sistema SPA
function activarSeccion(id) {
    document.querySelectorAll('.page, .app-section').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    // Para asegurar visibilidad si usas display:none en lugar de clases CSS
    //document.querySelectorAll('.page, .app-section').forEach(p => p.style.display = 'none');
    //document.getElementById(id).style.display = 'block';
}
