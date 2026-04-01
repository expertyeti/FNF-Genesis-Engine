class HotReloadManager {
    constructor() {
        // Bloqueo global de la tecla F5
        this.f5Handler = (e) => {
            if (e.key === 'F5' || e.keyCode === 116) {
                e.preventDefault(); 
                this.executeReload();
            }
        };
        
        window.removeEventListener('keydown', this.f5Handler); // Evitar duplicados si se recarga el script
        window.addEventListener('keydown', this.f5Handler);
    }

    executeReload() {
        // Asegurarnos de que el juego está inicializado
        if (!window.game || !window.game.scene) {
            console.warn("El juego no está inicializado aún.");
            return;
        }

        // Obtener todas las escenas que están activas actualmente en Phaser
        const activeScenes = window.game.scene.getScenes(true);

        // Lista de escenas globales o persistentes que NO queremos reiniciar directamente
        const scenesToIgnore = ["FlashEffect", "TransitionScene", "GlobalPluginsScene"];

        // Buscamos la escena principal activa (invertimos el array por si hay varias, tomar la que está más "arriba")
        const targetScene = activeScenes.reverse().find(s => !scenesToIgnore.includes(s.scene.key));

        if (!targetScene) {
            console.warn("No hay ninguna escena principal activa para recargar.");
            return;
        }

        const sceneKey = targetScene.scene.key;
        console.log(`Recargando: ${sceneKey}`);

        // Si la escena tiene una lógica de limpieza personalizada (como tu StoryModeScene), la usamos
        if (typeof targetScene.hotReload === 'function') {
            targetScene.hotReload();
        } else {
            // Reinicio estándar de Phaser: detiene la escena, limpia memoria y vuelve a crearla
            targetScene.scene.restart();
        }
    }
}

// Inicialización única global
if (typeof window !== 'undefined') {
    window.hotReloadManager = new HotReloadManager();
}