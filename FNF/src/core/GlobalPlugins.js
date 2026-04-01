/**
 * @file src/core/GlobalPlugins.js
 * Escena persistente que actúa como contenedor y emisor para plugins globales.
 */

class GlobalPluginsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GlobalPluginsScene' }); 
        
        if (!window.pluginsEventBus) {
            window.pluginsEventBus = new Phaser.Events.EventEmitter();
        }
        
        // El log ahora está limpio, el logger se encargará de darle formato
        console.log("Escena contenedora registrada.");
    }

    preload() {
        window.pluginsEventBus.emit('preload_plugins', this);
    }

    create() {
        // Mantener esta escena siempre por encima
        this.game.events.on('step', () => {
            if (this.scene.isActive()) {
                this.scene.bringToTop();
            }
        });

        window.pluginsEventBus.emit('init_plugins', this);
    }
}

// Arrancamos la escena forzosamente
window.game.scene.add('GlobalPluginsScene', GlobalPluginsScene, true);