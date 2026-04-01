class MultiplayerInput {
    constructor(scene) {
        this.scene = scene;
    }

    update() {
        if (!this.scene.canInteract) return;

        if (funkin.controls && funkin.controls.BACK_P) {
            this.scene.goBack();
        }
    }
}

window.MultiplayerInput = MultiplayerInput;