/**
 * @file src/core/globalHUD.js
 */

window.funkin = window.funkin || {};
funkin.core = funkin.core || {};

class GlobalHUDScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GlobalHUDScene' }); 
        
        if (!window.hudEventBus) {
            window.hudEventBus = new Phaser.Events.EventEmitter();
        }
    }

    preload() {
        window.hudEventBus.emit('preload_hud', this);
    }

    create() {
        // Se mantiene arriba del todo siempre
        this.game.events.on('step', () => {
            if (this.scene.isActive()) {
                this.scene.bringToTop();
            }
        });

        this.isHUDInitialized = true;
        
        console.log('[GlobalHUD] Despertando a los plugins...');
        window.hudEventBus.emit('init_hud', this);
    }
}

funkin.core.GlobalHUDScene = GlobalHUDScene;

// Asegurarse de que el juego esté listo antes de inyectar la escena
if (window.game) {
    if (window.game.isBooted) {
        window.game.scene.add('GlobalHUDScene', GlobalHUDScene, true);
    } else {
        window.game.events.once('boot', () => {
            window.game.scene.add('GlobalHUDScene', GlobalHUDScene, true);
        });
    }
}