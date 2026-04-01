/**
 * @file src/funkin/debugging/camera.js
 * Herramienta de debug para mover la cámara. Aumenta la velocidad usando CTRL.
 * Incluye soporte para Pinch to Zoom (pellizcar la pantalla) en móviles.
 * Atajo ALT + S: Activar/Desactivar Showcase Mode (Oculta la UI).
 * Atajo ALT + SHIFT + C: Activar/Desactivar Paneo de Cámara.
 * Guarda las preferencias en LocalStorage.
 */

class CameraDebugController {
    constructor(scene) {
        this.scene = scene;
        this.baseSpeed = 8; 
        this.isDebugActive = funkin.debugMode || false; 
        
        this.keys = this.scene.input.keyboard.addKeys('W,A,S,D');
        this.ctrlKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL);

        this.scene.input.addPointer(2);

        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        this.pinchStartDistance = null;
        this.pinchStartZoom = null;

        // Cargar preferencias guardadas
        this.panningEnabled = localStorage.getItem('funkin_camPanning') === 'true';
        this.showcaseEnabled = localStorage.getItem('funkin_showcaseMode') === 'true';

        this.debugToggleHandler = (e) => {
            this.isDebugActive = e.detail;
        };
        
        if (typeof window !== "undefined") {
            window.addEventListener('debugModeToggled', this.debugToggleHandler);
        }

        this.scene.events.once('shutdown', this.destroy, this);

        this.initMouseControls();
        this.initKeyboardShortcuts();

        // Aplicar estado inicial de Showcase si estaba guardado
        if (this.showcaseEnabled && this.isDebugActive) {
            this.scene.time.delayedCall(100, () => {
                this.applyShowcaseMode(false); // Falso = Ocultar UI
            });
        }
    }

    getSpeedMultiplier() {
        return this.ctrlKey.isDown ? 4 : 1;
    }

    initKeyboardShortcuts() {
        // Atajos de teclado
        this.scene.input.keyboard.on('keydown', (event) => {
            if (!this.isDebugActive) return;

            // ALT + SHIFT + C (Paneo)
            if (event.altKey && event.shiftKey && event.code === 'KeyC') {
                this.panningEnabled = !this.panningEnabled;
                localStorage.setItem('funkin_camPanning', this.panningEnabled);
                console.log("🎥 Paneo de Cámara:", this.panningEnabled ? "ACTIVADO" : "DESACTIVADO");
            }
            // ALT + S (Showcase)
            else if (event.altKey && !event.shiftKey && event.code === 'KeyS') {
                this.showcaseEnabled = !this.showcaseEnabled;
                localStorage.setItem('funkin_showcaseMode', this.showcaseEnabled);
                this.applyShowcaseMode(!this.showcaseEnabled); // Si showcase es true, visible es false
                console.log("🎬 Showcase Mode:", this.showcaseEnabled ? "ACTIVADO (UI Oculta)" : "DESACTIVADO (UI Visible)");
            }
        });
    }

    applyShowcaseMode(isVisible) {
        const toggleCam = (camObj) => {
            if (!camObj) return;
            if (typeof camObj.setVisible === 'function') {
                camObj.setVisible(isVisible);
            } else if (camObj.cameras && camObj.cameras.main) {
                camObj.cameras.main.setVisible(isVisible);
            } else if (camObj.camera) {
                camObj.camera.setVisible(isVisible);
            } else if (camObj.cam) {
                camObj.cam.setVisible(isVisible);
            }
        };

        if (funkin.playCamera && funkin.playCamera.uiCam) toggleCam(funkin.playCamera.uiCam);
        else if (this.scene.uiCam) toggleCam(this.scene.uiCam);

        if (this.scene.strumlines && this.scene.strumlines.cam) toggleCam(this.scene.strumlines.cam);
        
        if (this.scene.cameras && this.scene.cameras.cameras) {
            this.scene.cameras.cameras.forEach(cam => {
                if (cam.name === 'uiCam' || cam.name === 'hudCam' || cam.name === 'ui') {
                    cam.setVisible(isVisible);
                }
            });
        }
    }

    initMouseControls() {
        this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (!this.isDebugActive || !this.panningEnabled) return;
            const cam = funkin.playCamera.game;
            if (!cam) return;

            const zoomSpeed = 0.05 * this.getSpeedMultiplier(); 
            if (deltaY > 0) cam.targetZoom = Math.max(0.1, cam.targetZoom - zoomSpeed);
            else if (deltaY < 0) cam.targetZoom = Math.min(5.0, cam.targetZoom + zoomSpeed);
        });

        this.scene.input.on('pointerdown', (pointer) => {
            if (!this.isDebugActive || !this.panningEnabled) return;
            
            const pointer1 = this.scene.input.pointer1;
            const pointer2 = this.scene.input.pointer2;

            if (pointer1.isDown && pointer2.isDown) {
                this.isPanning = false; 
                this.pinchStartDistance = Phaser.Math.Distance.Between(pointer1.x, pointer1.y, pointer2.x, pointer2.y);
                const cam = funkin.playCamera.game;
                this.pinchStartZoom = cam ? cam.targetZoom : 1;
                return;
            }

            if (pointer.primaryDown || pointer.middleButtonDown() || pointer.isDown) {
                this.isPanning = true;
                this.panStartX = pointer.x;
                this.panStartY = pointer.y;
            }
        });

        this.scene.input.on('pointerup', (pointer) => {
            if (!this.isDebugActive || !this.panningEnabled) return;
            const pointer1 = this.scene.input.pointer1;
            const pointer2 = this.scene.input.pointer2;

            if (!pointer1.isDown && !pointer2.isDown) {
                this.isPanning = false;
                this.pinchStartDistance = null;
            } 
            else if (!pointer1.isDown || !pointer2.isDown) {
                this.pinchStartDistance = null;
                this.isPanning = true;
                const activePointer = pointer1.isDown ? pointer1 : pointer2;
                this.panStartX = activePointer.x;
                this.panStartY = activePointer.y;
            }
        });

        this.scene.input.on('pointermove', (pointer) => {
            if (!this.isDebugActive || !this.panningEnabled) return;
            const cam = funkin.playCamera.game;
            if (!cam) return;

            const pointer1 = this.scene.input.pointer1;
            const pointer2 = this.scene.input.pointer2;

            if (pointer1.isDown && pointer2.isDown) {
                this.isPanning = false;
                const currentDist = Phaser.Math.Distance.Between(pointer1.x, pointer1.y, pointer2.x, pointer2.y);
                
                if (this.pinchStartDistance === null) {
                    this.pinchStartDistance = currentDist;
                    this.pinchStartZoom = cam.targetZoom;
                } else if (this.pinchStartDistance > 0) {
                    const scaleFactor = currentDist / this.pinchStartDistance;
                    cam.targetZoom = Math.min(5.0, Math.max(0.1, this.pinchStartZoom * scaleFactor));
                }
                return; 
            } else {
                this.pinchStartDistance = null;
            }

            if (!this.isPanning) return;

            const panSpeed = 0.5 * this.getSpeedMultiplier();
            const dx = ((this.panStartX - pointer.x) / cam.zoom) * panSpeed;
            const dy = ((this.panStartY - pointer.y) / cam.zoom) * panSpeed;

            cam.targetScrollX += dx;
            cam.targetScrollY += dy;

            this.panStartX = pointer.x;
            this.panStartY = pointer.y;
        });
    }

    update() {
        if (!this.isDebugActive || !this.panningEnabled) return;
        const cam = funkin.playCamera.game;
        if (!cam) return;

        const currentSpeed = (this.baseSpeed * this.getSpeedMultiplier()) / cam.zoom;

        if (this.keys.A.isDown) cam.targetScrollX -= currentSpeed;
        if (this.keys.D.isDown) cam.targetScrollX += currentSpeed;
        if (this.keys.W.isDown) cam.targetScrollY -= currentSpeed;
        if (this.keys.S.isDown) cam.targetScrollY += currentSpeed;
    }

    destroy() {
        if (typeof window !== "undefined" && this.debugToggleHandler) {
            window.removeEventListener('debugModeToggled', this.debugToggleHandler);
        }
    }
}
funkin.CameraDebugController = CameraDebugController;