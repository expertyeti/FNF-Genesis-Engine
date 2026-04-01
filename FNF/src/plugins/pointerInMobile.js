/**
 * @class PointerInMobile
 * Plugin global para mostrar múltiples rastros táctiles (multi-touch) en dispositivos móviles.
 */
class PointerInMobile {
    /**
     * @constructor
     */
    constructor() {
        if (!window.pluginsEventBus) {
            window.pluginsEventBus = new Phaser.Events.EventEmitter();
        }
        
        window.pluginsEventBus.on('preload_plugins', this.preload, this);
        window.pluginsEventBus.on('init_plugins', this.init, this);
        
        this.scene = null;

        this.activePointers = new Map();
    }

    /**
     * @method preload
     * @param {Phaser.Scene} scene - The scene to preload assets in.
     */
    preload(scene) {
        scene.load.image('michael_cursor', 'public/images/ui/cursor/michael.png');
        scene.load.image('kevin_cursor', 'public/images/ui/cursor/kevin.png');
    }

    /**
     * @method init
     * @param {Phaser.Scene} scene - The scene to initialize the plugin in.
     */
    init(scene) {
        this.scene = scene;
        
        const isTouch = scene.sys.game.device.input.touch || navigator.maxTouchPoints > 0;
        
        if (!isTouch) {
            return; 
        }

        console.log("Sistema Multi-Touch inicializado.");

        scene.input.on('pointerdown', this.handlePointerDown, this);
        scene.input.on('pointermove', this.handlePointerMove, this);
        scene.input.on('pointerup', this.handlePointerUp, this);
    }

    /**
     * @method getPointerData
     * @param {Phaser.Input.Pointer} pointer - The pointer object.
     */
    getPointerData(pointer) {
        let data = this.activePointers.get(pointer.id);

        if (!data) {
            const sprite = this.scene.add.sprite(pointer.x, pointer.y, 'michael_cursor');
            sprite.setAlpha(0);
            sprite.setDepth(99999);
            sprite.setOrigin(0.5, 0.5);
            sprite.setVisible(true);

            data = {
                sprite: sprite,
                fadeTimer: null,
                lastX: pointer.x,
                lastY: pointer.y
            };
            this.activePointers.set(pointer.id, data);
        }
        return data;
    }

    /**
     * @method handlePointerDown
     * @param {Phaser.Input.Pointer} pointer - The pointer object.
     */
    handlePointerDown(pointer) {
        const data = this.getPointerData(pointer);

        data.sprite.setTexture('michael_cursor');
        data.sprite.setRotation(0);
        data.lastX = pointer.x;
        data.lastY = pointer.y;
        
        this.showPointer(data, pointer.x, pointer.y);
    }

    /**
     * @method handlePointerMove
     * @param {Phaser.Input.Pointer} pointer - The pointer object.
     */
    handlePointerMove(pointer) {
        if (!pointer.isDown) return;

        const data = this.getPointerData(pointer);

        let dx = pointer.x - data.lastX;
        let dy = pointer.y - data.lastY;

        if (dx !== 0 || dy !== 0) {
            let angle = Math.atan2(dy, dx);
            data.sprite.setRotation(angle + Math.PI);
        }

        data.lastX = pointer.x;
        data.lastY = pointer.y;

        data.sprite.setTexture('kevin_cursor');
        this.showPointer(data, pointer.x, pointer.y);
    }

    /**
     * @method handlePointerUp
     * @param {Phaser.Input.Pointer} pointer - The pointer object.
     */
    handlePointerUp(pointer) {
        const data = this.activePointers.get(pointer.id);
        if (!data) return;

        data.sprite.setTexture('michael_cursor');
        data.sprite.setRotation(0);
        
        this.showPointer(data, pointer.x, pointer.y);
    }

    /**
     * @method showPointer
     * @param {object} data - The pointer data object.
     * @param {number} x - The x position.
     * @param {number} y - The y position.
     */
    showPointer(data, x, y) {
        if (!data.sprite.active) return;

        this.scene.tweens.killTweensOf(data.sprite);
        
        data.sprite.setPosition(x, y);
        data.sprite.setAlpha(0.15);

        if (data.fadeTimer) {
            data.fadeTimer.remove();
        }

        data.fadeTimer = this.scene.time.delayedCall(600, () => {
            if (!data.sprite.active) return;

            this.scene.tweens.add({
                targets: data.sprite,
                alpha: 0,
                duration: 300,
                ease: 'Linear',
                onComplete: () => {
                    if (data.sprite.active) {
                        data.sprite.destroy();
                    }
                    for (let [id, ptrData] of this.activePointers.entries()) {
                         if (ptrData.sprite === data.sprite) {
                             this.activePointers.delete(id);
                             break;
                         }
                    }
                }
            });
        });
    }
}

window.pointerInMobilePlugin = new PointerInMobile();