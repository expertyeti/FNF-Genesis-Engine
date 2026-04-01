/**
 * @file src/funkin/effects/TransitionScene.js
 * Escena de transición y API global funkin.transition()
 */

class TransitionScene extends Phaser.Scene {
    constructor() {
        // MUY IMPORTANTE: No debe tener "active: true"
        super({ key: "TransitionScene" });
    }

    create() {
        const gradientTexture = this.createGradientTexture();
        
        this.blackScreen = this.add.sprite(
            this.scale.width / 2, 
            this.scale.height * 1.5,
            gradientTexture
        )
        .setOrigin(0.5)
        .setDepth(9999)
        .setAlpha(0);

        this.isTransitioning = false;
    }

    createGradientTexture() {
        const textureKey = 'transitionGradient';
        if (this.textures.exists(textureKey)) return textureKey;

        const width = this.scale.width;
        const height = this.scale.height * 2;
        
        const canvas = this.textures.createCanvas(textureKey, width, height);
        const ctx = canvas.context;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.2, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.8, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        canvas.refresh();

        return textureKey;
    }

    // AHORA RECIBE LA ESCENA QUE LO LLAMÓ
    startTransition(callingScene, nextScene) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        this.scene.bringToTop();
        this.blackScreen.setAlpha(1);

        this.tweens.add({
            targets: this.blackScreen,
            y: this.cameras.main.centerY, 
            duration: 500,
            ease: 'Power2.Out',
            onComplete: () => {
                
                // LA MAGIA ESTÁ AQUÍ: Solo detenemos la escena que ejecutó la transición.
                // Los plugins globales y demás capas son 100% ignoradas.
                if (callingScene && callingScene.scene) {
                    callingScene.scene.stop();
                }

                this.scene.launch(nextScene);

                this.time.delayedCall(300, () => {
                    this.tweens.add({
                        targets: this.blackScreen,
                        y: -this.cameras.main.height, 
                        duration: 500,
                        ease: 'Power2.In',
                        onComplete: () => {
                            this.blackScreen.y = this.cameras.main.height * 1.5; 
                            this.blackScreen.setAlpha(0);
                            this.isTransitioning = false;
                        }
                    });
                });
            }
        });
    }
}

window.game.scene.add("TransitionScene", TransitionScene);

/**
 * Transiciona suavemente de una escena a otra.
 * @param {Phaser.Scene} currentScene - Pasa 'this' desde la escena actual.
 * @param {string} targetSceneName - El key de la escena a la que quieres ir.
 */
window.funkin.transition = function(currentScene, targetSceneName) {
    if (!currentScene || !currentScene.scene) {
        console.warn("funkin.transition: Faltó pasar 'this' como primer parámetro.");
        return;
    }

    const transitionScene = currentScene.scene.get("TransitionScene");
    
    if (transitionScene) {
        if (!transitionScene.blackScreen) {
            // Si la escena nunca se ha iniciado, la lanzamos y esperamos un tick
            currentScene.scene.launch("TransitionScene");
            currentScene.time.delayedCall(50, () => { 
                transitionScene.startTransition(currentScene, targetSceneName); 
            });
        } else {
            // Si ya existe y está viva en memoria
            transitionScene.startTransition(currentScene, targetSceneName);
        }
    } else {
        // Fallback de emergencia por si el archivo no cargó
        currentScene.scene.start(targetSceneName);
    }
};