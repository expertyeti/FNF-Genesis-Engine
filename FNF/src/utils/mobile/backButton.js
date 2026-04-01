/**
 * @file src/utils/mobile/backButton.js
 * Inyecta dinámicamente el botón de retroceso (BACK) exclusivamente en la Main Camera.
 */

class MobileBackButton {
    /**
     * @type {string[]} Lista de escenas que ignorarán automáticamente la inyección del botón BACK.
     */
    static customIgnoredScenes = [];

    /**
     * Permite a cualquier escena registrarse para que el botón BACK móvil no se dibuje en ella.
     * @param {string} sceneKey - La llave (key) de la escena de Phaser a ignorar.
     */
    static addIgnoredScene(sceneKey) {
        if (!this.customIgnoredScenes.includes(sceneKey)) {
            this.customIgnoredScenes.push(sceneKey);
        }
    }

    /**
     * Verifica e inyecta el botón de retroceso si las condiciones son correctas.
     * @param {object} controls - La instancia global del ControlsManager.
     */
    static checkAndInject(controls) {
        if (typeof window === 'undefined' || !window.game || !window.game.scene) return;
        
        const activeScenes = window.game.scene.getScenes(true);
        const ignoredScenes = ["FlashEffect", "TransitionScene", "GlobalPluginsScene", ...this.customIgnoredScenes];
        const scene = activeScenes.slice().reverse().find(s => !ignoredScenes.includes(s.scene.key));
        
        if (!scene) return;
        if (scene.sys.game.device.os.desktop) return;

        if (scene._backButtonSprite && scene._backButtonSprite.active) return;
        if (scene._isInjectingBack) return;
        
        scene._isInjectingBack = true;

        const atlasKey = 'mobile_back_button';

        if (!scene.textures.exists(atlasKey)) {
            scene.load.atlasXML(
                atlasKey, 
                'public/images/ui/backButton.png', 
                'public/images/ui/backButton.xml'
            );

            scene.load.once('complete', () => {
                this._createBackButtonSprite(scene, atlasKey, controls);
            });
            
            scene.load.start();
        } else {
            this._createBackButtonSprite(scene, atlasKey, controls);
        }
    }

    /**
     * Crea físicamente el sprite interactivo en la pantalla.
     * @param {Phaser.Scene} scene - La escena actual.
     * @param {string} atlasKey - Llave del atlas cargado en caché.
     * @param {object} controls - La instancia global de controles.
     */
    static _createBackButtonSprite(scene, atlasKey, controls) {
        scene._isInjectingBack = false;

        if (!scene.anims.exists('back_pressed_anim')) {
            scene.anims.create({
                key: 'back_pressed_anim',
                frames: scene.anims.generateFrameNames(atlasKey, { prefix: 'back', start: 0, end: 22, zeroPad: 4 }),
                frameRate: 24,
                repeat: 0
            });
        }

        const btn = scene.add.sprite(0, 0, atlasKey, 'back0000');
        const scale = 0.65;
        const padding = 35; 
        
        btn.setScale(scale);
        btn.setOrigin(0, 0);
        btn.x = scene.cameras.main.width - (btn.width * scale) - padding;
        btn.y = scene.cameras.main.height - (btn.height * scale) - padding;

        btn.setDepth(10001); 
        btn.setScrollFactor(0); 
        
        scene.cameras.cameras.forEach(cam => {
            if (cam !== scene.cameras.main) {
                cam.ignore(btn);
            }
        });

        btn.setInteractive();

        btn.on('pointerdown', () => {
            if (btn.isExecuting) return; 
            btn.isExecuting = true;
            let actionTriggered = false;

            btn.play('back_pressed_anim');
            
            const checkFrame = (anim, frame) => {
                if (frame.index >= 8 && !actionTriggered) {
                    actionTriggered = true;
                    controls.simulatePress('BACK');
                    
                    setTimeout(() => {
                        controls.simulateRelease('BACK');
                    }, 50);
                }
            };

            btn.on('animationupdate', checkFrame);

            btn.once('animationcomplete', () => {
                btn.off('animationupdate', checkFrame);
                if (btn.active) {
                    btn.isExecuting = false;
                    btn.setFrame('back0000');
                }
            });
        });

        scene._backButtonSprite = btn;
    }
}

if (typeof window !== 'undefined') {
    funkin.MobileBackButton = MobileBackButton;
}