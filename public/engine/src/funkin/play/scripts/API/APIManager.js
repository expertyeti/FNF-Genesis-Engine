/**
 * @file APIManager.js
 * @description Orquestador central de las APIs del Genesis Engine.
 * Se encarga de instanciar los módulos de control y limpiar el entorno global al finalizar la partida.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.scripts = funkin.play.scripts || {};
funkin.play.scripts.api = funkin.play.scripts.api || {};

class APIManager {
    /**
     * @param {Phaser.Scene} scene - La escena de PlayScene activa.
     */
    constructor(scene) {
        this.scene = scene;
        
        /** @type {CameraAPI} - Instancia del controlador de cámaras */
        this.camera = null;

        this.init();
    }

    /**
     * @description Inicializa las APIs y las expone globalmente.
     * Esto permite a los modders usar 'Camera.zoom()' directamente.
     */
    init() {
        console.log("[APIManager] Inicializando APIs de Modding...");

        if (funkin.play.scripts.api.CameraAPI) {
            this.camera = new funkin.play.scripts.api.CameraAPI(this.scene);
        }

        // Exposición global
        window.Camera = this.camera;
        window.GameAPI = this;
        
        // Aquí se pueden agregar más como window.Characters, window.UI, etc.
    }

    /**
     * @description Destruye las referencias globales para evitar fugas de memoria (Memory Leaks)
     * y conflictos entre diferentes canciones.
     */
    destroy() {
        console.log("[APIManager] Limpiando APIs...");
        window.Camera = null;
        window.GameAPI = null;
        
        if (this.camera && this.camera.customEasings) {
            this.camera.customEasings.clear();
        }
    }
}

funkin.play.scripts.api.APIManager = APIManager;