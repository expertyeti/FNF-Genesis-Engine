/**
 * @file src/core/phaser.js
 */

window.funkin = window.funkin || {};

let config = window.getPanoramicConfig ? window.getPanoramicConfig() : {
    type: Phaser.AUTO,
    parent: "game-container", 
    scale: {
        mode: Phaser.Scale.FIT, 
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720,
    },
    dom: {
        createContainer: false,
    },
    scene: [],
    title: "Genesis Engine",
    url: 'https://phaser.io',
    version: "1.0",
};

// 1. Construir y aplicar las modificaciones de configuración (FPS, REX Plugins)
if (window.buildPhaserConfig) {
    config = window.buildPhaserConfig(config);
}

// 2. Inicializar el juego
window.GAME_COMMIT = "";
window.game = new Phaser.Game(config);

// 3. Configurar eventos globales de Phaser (Audio, Resize, Monitor)
if (window.setupPhaserEvents) {
    window.setupPhaserEvents(window.game);
}

if (window.AppCloser && window.AppCloser.registerListener) {
    window.AppCloser.registerListener();
}