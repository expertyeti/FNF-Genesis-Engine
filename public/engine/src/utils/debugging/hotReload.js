class HotReloadManager {
    constructor() {
        // Almacenamos el handler globalmente para poder removerlo en caso de que este script se vuelva a ejecutar
        if (window._hotReloadHandler) {
            window.removeEventListener('keydown', window._hotReloadHandler);
        }

        window._hotReloadHandler = (e) => {
            if (e.key === 'F5' || e.keyCode === 116) {
                e.preventDefault(); 
                this.executeReload();
            }
        };
        
        window.addEventListener('keydown', window._hotReloadHandler);
    }

    executeReload() {
        if (!window.game || !window.game.scene) {
            console.warn("El juego no está inicializado aún.");
            return;
        }

        const activeScenes = window.game.scene.getScenes(true);

        // Actualizado para incluir GlobalHUDScene, TransitionScene y FlashEffect
        const scenesToIgnore = ["FlashEffect", "TransitionScene", "GlobalHUDScene"];

        const targetScene = activeScenes.reverse().find(s => !scenesToIgnore.includes(s.scene.key));

        if (!targetScene) {
            console.warn("No hay ninguna escena principal activa para recargar.");
            return;
        }

        const sceneKey = targetScene.scene.key;
        console.log(`Recargando: ${sceneKey}`);

        if (typeof targetScene.hotReload === 'function') {
            targetScene.hotReload();
        } else {
            targetScene.scene.restart();
        }
    }
}

if (typeof window !== 'undefined') {
    window.hotReloadManager = new HotReloadManager();
}