class IDEInput {
    constructor(scene) {
        this.scene = scene;
    }

    update() {
        if (!this.scene.canInteract) return;

        if (funkin.controls && funkin.controls.BACK_P) {
            this.scene.canInteract = false;
            if (this.scene.cancelSound) this.scene.cancelSound.play();
            
            // Reemplazo limpio con la API directa
            if (typeof funkin !== 'undefined' && funkin.transition) {
                funkin.transition(this.scene, "MainMenuScene");
            } else {
                this.scene.scene.start("MainMenuScene");
            }
        }
    }
}

window.IDEInput = IDEInput;