/**
 * @file FNF/js/native/fpsController.js
 * Controlador de rendimiento y framerate nativo para el entorno WebView.
 */

window.GenesisFPSController = {
    applyConfig: function(baseConfig) {
        // Inyectamos la configuración de FPS que respeta el entorno sincrónico
        baseConfig.fps = {
            min: 10,
            target: 200, // Puedes subir esto a 120 o 144 si lo deseas en el futuro
            limit: 0,
            forceSetTimeOut: true, // CLAVE: Usa el reloj interno en lugar del refresco del monitor
            deltaHistory: 10,
            panicMax: 120,
            smoothStep: false, // Desactivado para evitar cuellos de botella en las físicas
        };

        // Forzamos al webview a darle prioridad de rendimiento al renderizado
        baseConfig.render = baseConfig.render || {};
        baseConfig.render.powerPreference = 'high-performance';

        return baseConfig;
    },

    // Herramienta opcional para monitorear la estabilidad desde la consola de Neutralino
    initMonitor: function(gameInstance) {
        if (!gameInstance) return;
        
        // Emite una alerta en consola solo si los FPS caen por debajo del mínimo de forma crítica
        setInterval(() => {
            if (gameInstance.loop && gameInstance.loop.actualFps < 30) {
                console.warn(`[Alerta de Rendimiento] Los FPS han caído a: ${Math.round(gameInstance.loop.actualFps)}`);
            }
        }, 5000);
    }
};