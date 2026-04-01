/**
 * @file src/core/phaser/GameEvents.js
 * Maneja los eventos globales y ajustes del motor una vez que está listo.
 */

window.setupPhaserEvents = function(game) {
    game.events.once('ready', () => {
        // Evitar que el sistema de audio se pause o mutee al perder el foco
        if (game.sound) {
            game.sound.pauseOnBlur = false;
        }

        // Desactivar los eventos internos de Phaser que pausan el bucle de las escenas
        game.events.off('pause');
        game.events.off('hidden');
        game.events.off('blur');

        if (window.setupPanoramicResize) {
            window.setupPanoramicResize(game);
        }

        // Inicializar el monitor de rendimiento (opcional)
        if (window.GenesisFPSController) {
            window.GenesisFPSController.initMonitor(game);
        }
    });
};