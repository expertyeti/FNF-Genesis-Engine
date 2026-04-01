/**
 * @file src/core/phaser/ConfigBuilder.js
 * Se encarga de inyectar configuraciones adicionales a Phaser antes de iniciarlo.
 */

window.buildPhaserConfig = function(config) {
    // 1. Aplicamos el controlador nativo de FPS
    if (window.GenesisFPSController) {
        config = window.GenesisFPSController.applyConfig(config);
    }

    // 2. Llamamos a la inyección de plugins REX si está disponible
    if (typeof window.injectREXPlugins === 'function') {
        config = window.injectREXPlugins(config);
    }

    return config;
};