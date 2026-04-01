/**
 * @file src/funkin/play/visuals/UI/pause/pauseSubScene.js
 */

class PauseSubScene extends Phaser.Scene {
    constructor() {
        super({ key: "PauseSubScene" });
    }

    create() {
            funkin.MobileBackButton.addIgnoredScene("PauseSubScene");

        this.playScene = this.scene.get("PlayScene");
        this.scene.moveAbove("PlayScene", "PauseSubScene");

        if (funkin.PauseSubSceneMenu) {
            this.pauseMenu = new funkin.PauseSubSceneMenu(this);
            this.menuContainer = this.pauseMenu.container; 
            // Siempre visible porque la escena en sí solo se abre al pausar
            this.menuContainer.setVisible(true);
        }

        // Recuperar el estado del teclado/pantalla al instante para evitar salidas accidentales en el primer frame
        this.prevPause = funkin.controls ? funkin.controls.PAUSE_P : false;
        this.prevBack = funkin.controls ? funkin.controls.BACK_P : false;
    }

    resumeGame() {
        funkin.PauseFunctions.resume(this);
    }

    update() {
        if (this.pauseMenu) {
            this.pauseMenu.update();
        }

        if (funkin.controls) {
            funkin.controls.update();

            const pauseHit = funkin.controls.PAUSE_P;
            const backHit = funkin.controls.BACK_P;

            // Salir de la pausa consumiendo el input manualmente si fue una pulsación limpia
            if ((pauseHit && !this.prevPause) || (backHit && !this.prevBack)) {
                this.resumeGame();
            }

            this.prevPause = pauseHit;
            this.prevBack = backHit;
        }
    }
}

if (typeof window !== 'undefined') {
    window.PauseSubScene = PauseSubScene;
    if (window.game && window.game.scene) {
        window.game.scene.add("PauseSubScene", PauseSubScene);
    }
}