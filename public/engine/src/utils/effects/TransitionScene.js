class TransitionScene extends Phaser.Scene {
    constructor() {
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

funkin.utils.TransitionScene = TransitionScene;
window.game.scene.add("TransitionScene", TransitionScene);

// API Global
funkin.transition = function(currentScene, targetSceneName) {
    if (!currentScene || !currentScene.scene) {
        console.warn("funkin.transition: Faltó pasar 'this' como primer parámetro.");
        return;
    }

    const transitionScene = currentScene.scene.get("TransitionScene");
    
    if (transitionScene) {
        if (!transitionScene.blackScreen) {
            currentScene.scene.launch("TransitionScene");
            currentScene.time.delayedCall(50, () => { 
                transitionScene.startTransition(currentScene, targetSceneName); 
            });
        } else {
            transitionScene.startTransition(currentScene, targetSceneName);
        }
    } else {
        currentScene.scene.start(targetSceneName);
    }
};