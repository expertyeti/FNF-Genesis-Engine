class IDEScene extends Phaser.Scene {
    constructor() {
        super({ key: "IDEScene" });
        this.canInteract = false;
    }

    preload() {
        if (!this.cache.audio.exists('cancelSound')) {
            this.load.audio('cancelSound', 'public/sounds/cancelMenu.ogg');
        }
    }

    create() {
        this.cancelSound = this.sound.add('cancelSound');
        const { width, height } = this.scale;

        // Texto en el centro de la escena
        this.add.text(width / 2, height / 2, 'IDE', {
            fontFamily: 'vcr',
            fontSize: '64px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        this.inputHandler = new window.IDEInput(this);

        this.time.delayedCall(100, () => {
            this.canInteract = true;
        });
    }

    update(time, delta) {
        if (funkin.controls) funkin.controls.update();
        if (this.inputHandler) this.inputHandler.update();
    }

    goBack() {
        if (!this.canInteract) return;
        this.canInteract = false;

        this.cancelSound.play();

        const transition = this.scene.get("TransitionScene");
        if (transition) {
            if (!transition.blackScreen) {
                this.scene.launch("TransitionScene");
                this.time.delayedCall(50, () => { transition.startTransition("MainMenuScene"); });
            } else {
                transition.startTransition("MainMenuScene");
            }
        } else {
            this.scene.start("MainMenuScene");
        }
    }
}

window.game.scene.add("IDEScene", IDEScene);