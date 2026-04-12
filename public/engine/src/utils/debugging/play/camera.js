window.funkin = window.funkin || {};
funkin.playDebugging = funkin.playDebugging || {};

class CameraDebugController {
    constructor(scene) {
        this.scene = scene;
        this.baseSpeed = 8; 
        
        this.keys = this.scene.input.keyboard.addKeys('W,A,S,D');
        this.ctrlKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL);

        this.scene.input.addPointer(2);

        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        this.pinchStartDistance = null;
        this.pinchStartZoom = null;

        this.panningEnabled = localStorage.getItem('funkin_camPanning') === 'true';
        this.showcaseEnabled = localStorage.getItem('funkin_showcaseMode') === 'true';

        this.scene.events.once('shutdown', this.destroy, this);

        this.initMouseControls();
        this.initKeyboardShortcuts();

        if (this.showcaseEnabled && window.funkin.debugMode) {
            this.scene.time.delayedCall(100, () => {
                this.applyShowcaseMode(false);
            });
        }
    }

    getSpeedMultiplier() {
        return this.ctrlKey.isDown ? 4 : 1;
    }

    initKeyboardShortcuts() {
        this.scene.input.keyboard.on('keydown', (event) => {
            if (!window.funkin.debugMode || !event.altKey) return;

            if (event.code === 'KeyC' && !event.shiftKey) {
                this.panningEnabled = !this.panningEnabled;
                localStorage.setItem('funkin_camPanning', this.panningEnabled);
                console.log("Paneo de Camara: " + (this.panningEnabled ? "ACTIVADO" : "DESACTIVADO"));
            }
            else if (event.code === 'KeyH' && !event.shiftKey) {
                this.showcaseEnabled = !this.showcaseEnabled;
                localStorage.setItem('funkin_showcaseMode', this.showcaseEnabled);
                this.applyShowcaseMode(!this.showcaseEnabled);
                console.log("Showcase Mode: " + (this.showcaseEnabled ? "ACTIVADO" : "DESACTIVADO"));
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

        if (this.scene.uiCam) toggleCam(this.scene.uiCam);
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
            if (!window.funkin.debugMode || !this.panningEnabled) return;
            
            const camControl = this.scene.gameCam;
            if (!camControl) return;

            const zoomSpeed = 0.05 * this.getSpeedMultiplier(); 
            if (deltaY > 0) camControl.targetZoom = Math.max(0.1, camControl.targetZoom - zoomSpeed);
            else if (deltaY < 0) camControl.targetZoom = Math.min(5.0, camControl.targetZoom + zoomSpeed);
        });

        this.scene.input.on('pointerdown', (pointer) => {
            if (!window.funkin.debugMode || !this.panningEnabled) return;
            
            const pointer1 = this.scene.input.pointer1;
            const pointer2 = this.scene.input.pointer2;

            if (pointer1.isDown && pointer2.isDown) {
                this.isPanning = false; 
                this.pinchStartDistance = Phaser.Math.Distance.Between(pointer1.x, pointer1.y, pointer2.x, pointer2.y);
                const camControl = this.scene.gameCam;
                this.pinchStartZoom = camControl ? camControl.targetZoom : 1;
                return;
            }

            if (pointer.primaryDown || pointer.middleButtonDown() || pointer.isDown) {
                this.isPanning = true;
                this.panStartX = pointer.x;
                this.panStartY = pointer.y;
            }
        });

        this.scene.input.on('pointerup', (pointer) => {
            if (!window.funkin.debugMode || !this.panningEnabled) return;
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
            if (!window.funkin.debugMode || !this.panningEnabled) return;
            
            const camControl = this.scene.gameCam;
            if (!camControl) return;

            const nativeCam = camControl.cam || this.scene.cameras.main;

            const pointer1 = this.scene.input.pointer1;
            const pointer2 = this.scene.input.pointer2;

            if (pointer1.isDown && pointer2.isDown) {
                this.isPanning = false;
                const currentDist = Phaser.Math.Distance.Between(pointer1.x, pointer1.y, pointer2.x, pointer2.y);
                
                if (this.pinchStartDistance === null) {
                    this.pinchStartDistance = currentDist;
                    this.pinchStartZoom = camControl.targetZoom;
                } else if (this.pinchStartDistance > 0) {
                    const scaleFactor = currentDist / this.pinchStartDistance;
                    camControl.targetZoom = Math.min(5.0, Math.max(0.1, this.pinchStartZoom * scaleFactor));
                }
                return; 
            } else {
                this.pinchStartDistance = null;
            }

            if (!this.isPanning) return;

            const panSpeed = 0.5 * this.getSpeedMultiplier();
            const dx = ((this.panStartX - pointer.x) / nativeCam.zoom) * panSpeed;
            const dy = ((this.panStartY - pointer.y) / nativeCam.zoom) * panSpeed;

            camControl.targetScrollX += dx;
            camControl.targetScrollY += dy;

            this.panStartX = pointer.x;
            this.panStartY = pointer.y;
        });
    }

    update() {
        if (!window.funkin.debugMode || !this.panningEnabled) return;
        
        const camControl = this.scene.gameCam;
        if (!camControl) return;

        const nativeCam = camControl.cam || this.scene.cameras.main;
        const currentSpeed = (this.baseSpeed * this.getSpeedMultiplier()) / nativeCam.zoom;

        if (this.keys.A.isDown) camControl.targetScrollX -= currentSpeed;
        if (this.keys.D.isDown) camControl.targetScrollX += currentSpeed;
        if (this.keys.W.isDown) camControl.targetScrollY -= currentSpeed;
        if (this.keys.S.isDown) camControl.targetScrollY += currentSpeed;
    }

    destroy() {}
}

funkin.playDebugging.CameraDebugController = CameraDebugController;
window.funkin.CameraDebugController = CameraDebugController;