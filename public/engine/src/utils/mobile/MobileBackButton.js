/**
 * @file src/utils/mobile/MobileBackButton.js
 * Inyecta el botón de retroceso con detección dinámica y global de dispositivos (Teclado vs Tacto).
 */
window.funkin = window.funkin || {};
funkin.utils = funkin.utils || {};

class MobileBackButton {
    static customIgnoredScenes = [];

    static addIgnoredScene(sceneKey) {
        if (!this.customIgnoredScenes.includes(sceneKey)) {
            this.customIgnoredScenes.push(sceneKey);
        }
    }

    // Método que registra EventListeners NATIVOS del navegador para atrapar TODO
    static setupGlobalInputListeners() {
        if (window.funkin._mobileInputListenerAdded) return;
        
        // Estado inicial de controles móviles
        window.funkin.mobileControlsActive = true; 

        // 1. Detectar teclado: Atrapa flechas, espaciadora, teclas especiales... TODAS.
        window.addEventListener('keydown', () => {
            if (window.funkin.mobileControlsActive) {
                window.funkin.mobileControlsActive = false;
                if (window.game && window.game.events) {
                    window.game.events.emit('device_input_changed', false);
                }
            }
        }, { passive: true });

        // 2. Detectar pantalla: Vuelve a habilitar el input móvil al hacer touch
        window.addEventListener('pointerdown', () => {
            if (!window.funkin.mobileControlsActive) {
                window.funkin.mobileControlsActive = true;
                if (window.game && window.game.events) {
                    window.game.events.emit('device_input_changed', true);
                }
            }
        }, { passive: true });

        window.funkin._mobileInputListenerAdded = true;
    }

    static checkAndInject(controls) {
        if (typeof window === 'undefined' || !window.game || !window.game.scene) return;
        
        this.setupGlobalInputListeners();

        // Si la bandera global sabe que estás usando teclado, IGNORA LA CREACIÓN.
        // No se volverá a recrear en más escenas hasta que toques la pantalla.
        if (!window.funkin.mobileControlsActive) return;

        const activeScenes = window.game.scene.getScenes(true);
        const ignoredScenes = ["FlashEffect", "TransitionScene", "GlobalHUDScene", ...this.customIgnoredScenes];
        const scene = activeScenes.slice().reverse().find(s => !ignoredScenes.includes(s.scene.key));
        
        if (!scene || !scene.sys || !scene.sys.game) return;
        
        const device = scene.sys.game.device;
        if (device.os.desktop && navigator.maxTouchPoints === 0) return;

        if (scene._backButtonSprite && scene._backButtonSprite.active) return;
        if (scene._isInjectingBack) return;
        
        scene._isInjectingBack = true;

        const atlasKey = 'mobile_back_button';

        if (!scene.textures.exists(atlasKey)) {
            scene.load.atlasXML(
                atlasKey, 
                window.BASE_URL + 'assets/images/ui/backButton.png', 
                window.BASE_URL + 'assets/images/ui/backButton.xml'
            );

            scene.load.once('complete', () => {
                this._createBackButtonSprite(scene, atlasKey, controls);
            });
            
            scene.load.start();
        } else {
            this._createBackButtonSprite(scene, atlasKey, controls);
        }
    }

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

        btn.setDepth(100000); 
        btn.setScrollFactor(0); 
        
        // LA PRIMERA VEZ QUE APARECE, HACE FADE-IN
        btn.setAlpha(0);
        scene.tweens.add({
            targets: btn,
            alpha: 1,
            duration: 400,
            ease: 'Linear'
        });
        
        if (scene.cameras.cameras) {
            scene.cameras.cameras.forEach(cam => {
                if (cam !== scene.cameras.main) {
                    cam.ignore(btn);
                }
            });
        }

        btn.setInteractive();

        // Si el estado cambia a teclado estando adentro de la escena actual, hace Fade Out
        if (!scene._deviceInputListenerAdded) {
            scene.game.events.on('device_input_changed', (isMobile) => {
                if (!scene._backButtonSprite || !scene._backButtonSprite.active) return;
                
                const targetAlpha = isMobile ? 1 : 0;
                
                if (scene._backButtonSprite.alpha !== targetAlpha && !scene._backButtonSprite._isFading) {
                    scene._backButtonSprite._isFading = true;
                    
                    if (isMobile) {
                        scene._backButtonSprite.setInteractive();
                    } else {
                        scene._backButtonSprite.disableInteractive();
                    }

                    scene.tweens.add({
                        targets: scene._backButtonSprite,
                        alpha: targetAlpha,
                        duration: 300,
                        onComplete: () => { 
                            scene._backButtonSprite._isFading = false; 
                        }
                    });
                }
            });
            scene._deviceInputListenerAdded = true;
        }

        btn.on('pointerdown', () => {
            if (btn.isExecuting) return; 
            btn.isExecuting = true;
            let actionTriggered = false;

            btn.play('back_pressed_anim');
            
            const checkFrame = (anim, frame) => {
                if (frame.index >= 8 && !actionTriggered) {
                    actionTriggered = true;
                    if (controls && controls.simulatePress) controls.simulatePress('BACK');
                    
                    setTimeout(() => {
                        if (controls && controls.simulateRelease) controls.simulateRelease('BACK');
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

funkin.utils.MobileBackButton = MobileBackButton;