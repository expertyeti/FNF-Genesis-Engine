class FlashEffect extends Phaser.Scene {
    constructor() {
        super({ key: "FlashEffect", active: true });
    }

    create() {
        // Utiliza el ancho y alto completo de la escena 
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        // Crear un rectángulo blanco que cubra toda la pantalla
        this.whiteScreen = this.add.rectangle(
            screenWidth / 2,
            screenHeight / 2,
            screenWidth * 1.5, // Multiplicado x1.5 para asegurar que cubra toda la pantalla panorámica
            screenHeight * 1.5,
            0xffffff // Color blanco
        )
        .setOrigin(0.5)
        .setDepth(9999) // Asegurarse de que esté por encima de todo
        .setAlpha(0); // Iniciar invisible

        this.isTransitioning = false; // Controlar si ya hay una transición en curso
    }

    startTransition(nextScene) {
        if (this.isTransitioning) return; // Evitar múltiples transiciones simultáneas
        this.isTransitioning = true;

        // 1. Traer FlashEffect al frente
        this.scene.bringToTop();

        // 2. Fade In (cuadro blanco aparece rápido)
        this.tweens.add({
            targets: this.whiteScreen,
            alpha: 1, 
            duration: 200, 
            ease: 'Linear',
            onComplete: () => {
                // 3. Detener la escena actual
                const currentScene = this.game.scene.getScenes(true).find(s => s.scene.key !== "FlashEffect");
                if (currentScene) {
                    currentScene.scene.stop();
                }

                // 4. Iniciar la nueva escena (esto desencadenará su preload)
                this.scene.launch(nextScene);
                
                // 5. Garantizar que el Flash se mantenga por encima de la nueva escena
                this.scene.bringToTop();

                // 6. Obtener la referencia a la nueva escena
                const nextSceneObj = this.scene.get(nextScene);

                // CLAVE: Esperar a que la nueva escena termine de cargar (preload) y arme todo (create).
                // Una vez que esté lista y dibujada por debajo, desvanecemos el flash.
                nextSceneObj.events.once('create', () => {
                    // 7. Fade Out (cuadro blanco desaparece)
                    this.tweens.add({
                        targets: this.whiteScreen,
                        alpha: 0, 
                        duration: 500, 
                        ease: 'Linear',
                        onComplete: () => {
                            this.isTransitioning = false; 
                        }
                    });
                });
            }
        });
    }
}

// Lo agregamos globalmente
window.game.scene.add("FlashEffect", FlashEffect);