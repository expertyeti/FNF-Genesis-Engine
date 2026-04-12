class FunScript {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        this.secretMusic = null;
        this.inputBuffer = [];
        this.hueOffset = 0;
        this.beatCounter = 0;

        this.sequence = ['LEFT', 'RIGHT', 'LEFT', 'RIGHT', 'UP', 'DOWN', 'UP', 'DOWN'];
    }

    update() {
        if (this.active) return;

        if (funkin.controls.UI_LEFT_P) this.checkInput('LEFT');
        else if (funkin.controls.UI_RIGHT_P) this.checkInput('RIGHT');
        else if (funkin.controls.UI_UP_P) this.checkInput('UP');
        else if (funkin.controls.UI_DOWN_P) this.checkInput('DOWN');
    }

    checkInput(key) {
        this.inputBuffer.push(key);
        if (this.inputBuffer.length > this.sequence.length) this.inputBuffer.shift();

        if (this.checkBufferMatch()) {
            this.activateSecretMode();
            this.inputBuffer = [];
        }
    }

    checkBufferMatch() {
        if (this.inputBuffer.length !== this.sequence.length) return false;
        for (let i = 0; i < this.sequence.length; i++) {
            if (this.inputBuffer[i] !== this.sequence[i]) return false;
        }
        return true;
    }

    activateSecretMode() {
        console.log("[FunScript] ¡Código Secreto Activado!");
        this.active = true;

        try { if (navigator.vibrate) navigator.vibrate(70); } catch(e){}

        this.scene.sound.stopAll();
        this.scene.sound.play("confirmMenu", { volume: 1.0 });
        this.scene.cameras.main.flash(1000, 255, 255, 255);

        this.hueOffset = 0.125;
        this.scene.registry.set('hueOffset', this.hueOffset);
        this.applyShader();

        if (this.scene.gf && this.scene.gf.anims) {
            this.scene.gf.anims.timeScale = 1.5;
        }

        this.secretMusic = this.scene.sound.add("girlfriendsRingtone", { loop: true, volume: 0 });
        this.secretMusic.play();
        this.scene.tweens.add({ targets: this.secretMusic, volume: 1.0, duration: 4000 });

        this.scene.time.addEvent({
            delay: 60000 / 160, 
            loop: true,
            callback: () => this.beatHit()
        });
    }

    applyShader() {
        if (this.scene.game.renderer.type !== Phaser.WEBGL) return;

        const pipelineName = 'RainbowShader';
        
        if (!this.scene.renderer.pipelines.has(pipelineName)) {
            const fragShader = this.scene.cache.text.get('rainbowShader');
            if (!fragShader) return;

            class RainbowPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
                constructor(game) {
                    super({ game: game, renderTarget: true, fragShader: fragShader });
                }
                onPreRender() {
                    this.set1f('uTime', this.game.registry.get('hueOffset') || 0);
                }
            }
            this.scene.renderer.pipelines.addPostPipeline(pipelineName, RainbowPipeline);
        }

        if (this.scene.gf) this.scene.gf.setPostPipeline(pipelineName);
        if (this.scene.logo) this.scene.logo.setPostPipeline(pipelineName);
    }

    beatHit() {
        if (!this.active) return;
        this.beatCounter++;
        if (this.beatCounter % 4 === 0) {
            this.hueOffset += 0.125;
            this.scene.registry.set('hueOffset', this.hueOffset);
        }
    }
}

funkin.ui.intro.FunScript = FunScript;