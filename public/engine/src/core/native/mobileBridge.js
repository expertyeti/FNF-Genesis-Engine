/**
 * @file mobileBridge.js
 * Puente web para detectar el segundo plano de manera instantánea
 */

const pauseEngine = () => {
    console.log("Out Display...");
    
    // 1. Pausa pura de HTML5 (Apaga la etiqueta y la mutea)
    document.querySelectorAll('audio, video').forEach(media => { 
        media.muted = true; 
        media.pause(); 
    });
    
    // 2. Suspende todos los contextos de audio
    if (window._audioContexts) {
        window._audioContexts.forEach(ctx => { if (ctx.state === 'running') ctx.suspend(); });
    }

    // 3. Apaga a Phaser nativamente
    if (window.game) {
        if (window.game.loop) window.game.loop.sleep();
        if (window.game.sound) {
            window.game.sound.mute = true;
            if (window.game.sound.context && window.game.sound.context.state === 'running') {
                window.game.sound.context.suspend();
            }
        }
    }
};

const resumeEngine = () => {
    console.log("On Display...");
    
    document.querySelectorAll('audio, video').forEach(media => { 
        media.muted = false; 
        media.play().catch(e => console.log("Autoplay bloqueado hasta toque", e)); 
    });
    
    if (window._audioContexts) {
        window._audioContexts.forEach(ctx => { if (ctx.state === 'suspended') ctx.resume(); });
    }

    if (window.game) {
        if (window.game.loop) window.game.loop.wake();
        if (window.game.sound) {
            window.game.sound.mute = false;
            if (window.game.sound.context && window.game.sound.context.state === 'suspended') {
                window.game.sound.context.resume();
            }
        }
    }
};

// --- LOS DETECTORES ---

// 1. Detector de React Native (Como respaldo por si falla la web)
window.addEventListener('appBackground', pauseEngine);
window.addEventListener('appForeground', resumeEngine);

// 2. DETECTOR WEB NATIVO (LA SOLUCIÓN PRINCIPAL)
// Esto salta inmediatamente cuando el navegador (WebView) deja de estar visible.
document.addEventListener("visibilitychange", () => {
    if (document.hidden || document.visibilityState === 'hidden') {
        pauseEngine();
    } else {
        resumeEngine();
    }
});