/**
 * @file src/funkin/play/visuals/UI/pause/pauseSubSceneMenu.js
 */

class PauseSubSceneMenu {
    constructor(scene) {
        this.scene = scene;
        this.container = scene.add.container(0, 0);
        
        this.options = ['Resume Game', 'Exit to Menu'];
        this.optionTexts = [];
        this.curSelected = 0;
        
        this.isMobile = scene.sys.game.device.os.android || scene.sys.game.device.os.iOS;
        this.isSwiping = false;
        this.isAccepting = true; // Empieza bloqueado para evitar ejecución inmediata

        this.prevUp = false;
        this.prevDown = false;
        this.prevAccept = false;

        this.createUI();
        this.setupInputs();
    }

    createUI() {
        const { width, height } = this.scene.cameras.main;

        const bg = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.6);
        bg.setOrigin(0, 0);

        const pauseText = this.scene.add.text(width / 2, height / 2 - 120, 'PAUSED', {
            fontSize: '64px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.container.add([bg, pauseText]);

        const startY = height / 2 + 20;
        this.options.forEach((optName, i) => {
            const text = this.scene.add.text(width / 2, startY + (i * 70), optName, {
                fontSize: '36px', fontFamily: 'Arial', color: '#ffffff'
            }).setOrigin(0.5);
            
            this.optionTexts.push(text);
            this.container.add(text);

            if (this.isMobile) {
                text.setInteractive();
                
                text.on('pointerup', () => {
                    if (this.isSwiping || this.isAccepting) return;

                    if (this.curSelected === i) {
                        this.acceptSelection();
                    } else {
                        this.curSelected = i;
                        this.changeSelection(0);
                    }
                });
            }
        });

        this.changeSelection(0);
        this.container.setVisible(false);
    }

    setupInputs() {
        if (!this.isMobile) {
            this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
                if (!this.container.visible || this.isAccepting) return;
                
                if (deltaY > 0) this.changeSelection(1);
                else if (deltaY < 0) this.changeSelection(-1);
            });
        }

        if (this.isMobile) {
            let startY = 0;

            this.scene.input.on('pointerdown', (pointer) => {
                if (!this.container.visible || this.isAccepting) return;
                startY = pointer.y;
                this.isSwiping = false;
            });

            this.scene.input.on('pointermove', (pointer) => {
                if (!this.container.visible || !pointer.isDown || this.isAccepting) return;
                if (Math.abs(pointer.y - startY) > 20) {
                    this.isSwiping = true;
                }
            });

            this.scene.input.on('pointerup', (pointer) => {
                if (!this.container.visible || !this.isSwiping || this.isAccepting) return;
                
                let diff = pointer.y - startY;
                if (diff > 40) {
                    this.changeSelection(-1); 
                } else if (diff < -40) {
                    this.changeSelection(1); 
                }
            });
        }
    }

    changeSelection(change = 0) {
        if (!this.container.visible || this.isAccepting) return;

        if (change !== 0 && this.scene.playScene && this.scene.playScene.cache.audio.exists('scrollMenu')) {
            this.scene.playScene.sound.play('scrollMenu');
        }

        this.curSelected += change;

        if (this.curSelected < 0) this.curSelected = this.options.length - 1;
        if (this.curSelected >= this.options.length) this.curSelected = 0;

        this.optionTexts.forEach((txt, i) => {
            if (i === this.curSelected) {
                txt.setColor('#ffff00'); 
                txt.setAlpha(1);
            } else {
                txt.setColor('#ffffff'); 
                txt.setAlpha(0.6);
            }
        });
    }

    acceptSelection() {
        if (!this.container.visible || this.isAccepting) return;
        this.isAccepting = true; 

        const opt = this.options[this.curSelected];
        
        if (opt === 'Resume Game') {
            if (funkin.PauseFunctions) funkin.PauseFunctions.resume(this.scene);
        } else if (opt === 'Exit to Menu') {
            if (funkin.PauseFunctions) funkin.PauseFunctions.exit(this.scene);
        }
    }

    update() {
        if (!this.container.visible) {
            // Seguir leyendo los botones mientras está invisible para mantener el registro correcto
            if (funkin.controls) {
                this.prevUp = funkin.controls.UI_UP_P;
                this.prevDown = funkin.controls.UI_DOWN_P;
                this.prevAccept = funkin.controls.ACCEPT_P;
            }
            return;
        }

        if (funkin.controls && !this.isMobile && !this.isAccepting) {
            const upHit = funkin.controls.UI_UP_P;
            const downHit = funkin.controls.UI_DOWN_P;
            const acceptHit = funkin.controls.ACCEPT_P;

            // Solo accionar si el botón se acaba de presionar (evita que un solo toque se cuente doble)
            if (upHit && !this.prevUp) this.changeSelection(-1);
            if (downHit && !this.prevDown) this.changeSelection(1);
            if (acceptHit && !this.prevAccept) this.acceptSelection();

            this.prevUp = upHit;
            this.prevDown = downHit;
            this.prevAccept = acceptHit;
        }
    }

    setVisible(visible) {
        this.container.setVisible(visible);
        if (visible) {
            this.curSelected = 0;
            this.changeSelection(0);
            this.isAccepting = true; // Bloquear brevemente cuando aparece el menú
            this.scene.time.delayedCall(300, () => {
                this.isAccepting = false;
            });
        }
    }
}

funkin.PauseSubSceneMenu = PauseSubSceneMenu;