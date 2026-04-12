class PauseSubScene extends Phaser.Scene {
    constructor() {
        super({ key: "PauseSubScene" });
        this.pauseMusic = null;
        this.musicTween = null; 
    }

    preload() {
        const baseUrl = window.BASE_URL || "public/engine/";
        
        if (!this.cache.json.exists('pauseJSON')) {
            this.load.json('pauseJSON', baseUrl + 'assets/data/ui/pause.json');
        }
        if (!this.cache.audio.exists('breakfast')) {
            this.load.audio('breakfast', baseUrl + 'assets/music/breakfast.ogg');
        }
    }

    create() {
        if (funkin.MobileBackButton) funkin.MobileBackButton.addIgnoredScene("PauseSubScene");

        this.playScene = this.scene.get("PlayScene");
        
        this.scene.moveAbove("PlayScene", "PauseSubScene");
        if (this.scene.manager.keys["GlobalHUDScene"]) {
            this.scene.moveBelow("PauseSubScene", "GlobalHUDScene");
        }

        this.game.events.emit('hide_mobile_pause');
        
        this.events.once('shutdown', () => {
            this.game.events.emit('show_mobile_pause');
        });

        // Llamamos al método estático refactorizado! Solo 1 línea.
        if (funkin.utils.MobilePauseBtn) {
            funkin.utils.MobilePauseBtn.playTransitionIn(this);
        }

        const pauseData = this.cache.json.get('pauseJSON');
        const musicKey = (pauseData && pauseData.music) ? pauseData.music : 'breakfast';
        this.playMusic(musicKey);

        if (funkin.play.visuals.ui.PauseSubSceneMenu) {
            this.pauseMenu = new funkin.play.visuals.ui.PauseSubSceneMenu(this, pauseData);
            this.pauseMenu.setVisible(true);
        }

        this.prevPause = funkin.controls ? funkin.controls.PAUSE_P : false;
    }

    playMusic(key) {
        if (this.cache.audio.exists(key)) {
            this.pauseMusic = this.sound.add(key, { volume: 0, loop: true });
            this.pauseMusic.play();
            
            this.musicTween = this.tweens.add({
                targets: this.pauseMusic,
                volume: 0.6,
                duration: 1000,
                ease: 'Linear'
            });
        }
    }

    stopMusic() {
        if (this.musicTween) {
            this.musicTween.stop();
            this.musicTween = null;
        }

        if (this.pauseMusic && this.pauseMusic.isPlaying) {
            this.pauseMusic.stop();
            this.pauseMusic.destroy();
            this.pauseMusic = null;
        }
    }

    resumeGame() {
        if (funkin.play.visuals.ui.PauseFunctions) {
            funkin.play.visuals.ui.PauseFunctions.resume(this);
        }
    }

    update() {
        if (this.pauseMenu) this.pauseMenu.update();

        if (funkin.controls) {
            funkin.controls.update();
            const pauseHit = funkin.controls.PAUSE_P;
            const acceptHit = funkin.controls.ACCEPT_P;

            if (pauseHit && !this.prevPause && !acceptHit) {
                this.resumeGame();
            }
            this.prevPause = pauseHit;
        }
    }
}

window.game.scene.add("PauseSubScene", PauseSubScene);