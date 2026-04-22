/**
 * @file PhaseGameOver.js
 * Fase de fracaso definitiva. Desactiva cámaras de UI, detiene managers de entrada,
 * maneja la secuencia de muerte y permite salir al menú o reiniciar.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.data = funkin.play.data || {};
funkin.play.data.referee = funkin.play.data.referee || {};

class PhaseGameOver {
    constructor(referee) {
        this.referee = referee;
        this.scene = referee.scene;
        this.isConfirming = false;
        this.isExiting = false;
        this.controlledChar = null;
        this.currentSound = null;
    }

    async enter() {
        this.isConfirming = false;
        this.isExiting = false;
        
        // 1. Detener música y sonidos
        if (this.scene.songPlaylist && typeof this.scene.songPlaylist.stopAll === 'function') {
            this.scene.songPlaylist.stopAll();
        }
        if (this.scene.sound) {
            this.scene.sound.stopAll();
        }

        // 2. Determinar personaje y anular dance
        const playAsOpponent = funkin.play.options?.playAsOpponent === true;
        this.controlledChar = playAsOpponent ? this.scene.opponent : this.scene.player;

        if (!this.controlledChar) {
            this.exitToMenu();
            return;
        }

        // 3. DESACTIVACIÓN RADICAL DE UI Y CÁMARAS
        // Desactivamos las cámaras para que Phaser ignore sus renders aunque los objetos se activen
        if (this.scene.uiCam?.cameras?.main) {
            this.scene.uiCam.cameras.main.enabled = false;
            this.scene.uiCam.cameras.main.setVisible(false);
        }
        if (this.scene.mainCam?.cameras?.main) {
            this.scene.mainCam.cameras.main.enabled = false;
            this.scene.mainCam.cameras.main.setVisible(false);
        }

        // 4. PURGA VISUAL: Ocultar todo lo que no sea el jugador muerto
        this.scene.children.list.forEach(child => {
            if (child !== this.controlledChar && child.type !== 'Camera') {
                if (typeof child.setVisible === 'function') child.setVisible(false);
            }
        });

        // 5. CONFIGURACIÓN DE CÁMARA JUEGO (GAME OVER STATE)
        const targetCam = this.scene.gameCam?.cameras?.main || this.scene.cameras.main;
        targetCam.setBackgroundColor('#000000');

        const midX = this.controlledChar.x + (this.controlledChar.displayWidth / 2);
        const midY = this.controlledChar.y + (this.controlledChar.displayHeight / 2);
        const camOffsetX = this.controlledChar.cameraPosition?.[0] || 0;
        const camOffsetY = this.controlledChar.cameraPosition?.[1] || 0;
        
        targetCam.pan(midX + camOffsetX, midY + camOffsetY, 1200, 'Expo.easeOut');
        targetCam.zoomTo(0.95, 1200, 'Expo.easeOut');

        // Impedir que el personaje vuelva a IDLE
        this.controlledChar.isDead = true;
        this.controlledChar.dance = () => {}; 

        // 6. Cargar y configurar animaciones/sonidos
        const charsData = funkin.play.characterLoader?.charactersData;
        const rawCharData = playAsOpponent ? charsData?.opponents?.[0] : charsData?.players?.[0];
        const anims = rawCharData?.animations || [];

        const firstDeathData = anims.find(a => a.anim === "firstDeath");
        const deathLoopData = anims.find(a => a.anim === "deathLoop");
        const deathConfirmData = anims.find(a => a.anim === "deathConfirm");

        // Forzar Loop en Phaser
        const loopKey = this.controlledChar.animKeys?.get("deathLoop");
        if (loopKey && this.scene.anims.exists(loopKey)) {
            this.scene.anims.get(loopKey).repeat = -1;
        }

        await Promise.all([
            this.loadAudio(firstDeathData),
            this.loadAudio(deathLoopData),
            this.loadAudio(deathConfirmData)
        ]);

        this.playGameOverSequence(firstDeathData, deathLoopData);
    }

    async loadAudio(animData) {
        return new Promise((resolve) => {
            if (!animData || !animData.sound || !animData.sound.path) return resolve(null);
            const audioKey = `gameOver_${animData.anim}`;
            if (this.scene.cache.audio.exists(audioKey)) return resolve(audioKey);

            const url = `${window.BASE_URL || ""}assets/sounds/gameOver/${animData.sound.path}`;
            this.scene.load.audio(audioKey, url);
            this.scene.load.once(`filecomplete-audio-${audioKey}`, () => resolve(audioKey));
            this.scene.load.once('loaderror', () => resolve(null));
            if (!this.scene.load.isLoading()) this.scene.load.start();
        });
    }

    playGameOverSequence(firstDeathData, deathLoopData) {
        const charRenderer = funkin.play.visuals.characters.charactersManager;
        charRenderer.playAnim(this.controlledChar, "firstDeath", true);

        if (firstDeathData?.sound?.path) {
            const audioKey = `gameOver_firstDeath`;
            if (this.scene.cache.audio.exists(audioKey)) {
                this.currentSound = this.scene.sound.add(audioKey, { 
                    volume: firstDeathData.sound.volume ?? 1.0,
                    loop: firstDeathData.sound.loop ?? false
                });
                this.currentSound.play();
                this.currentSound.once('complete', () => this.playLoopSequence(deathLoopData));
                return;
            }
        }
        
        this.controlledChar.once('animationcomplete', (anim) => {
            if (!this.isConfirming && !this.isExiting && anim.key.toLowerCase().includes("firstdeath")) {
                this.playLoopSequence(deathLoopData);
            }
        });
    }

    playLoopSequence(deathLoopData) {
        if (this.isConfirming || this.isExiting) return;

        const charRenderer = funkin.play.visuals.characters.charactersManager;
        charRenderer.playAnim(this.controlledChar, "deathLoop", true);

        if (deathLoopData?.sound?.path) {
            const audioKey = `gameOver_deathLoop`;
            if (this.scene.cache.audio.exists(audioKey)) {
                if (this.currentSound) this.currentSound.stop();
                this.currentSound = this.scene.sound.add(audioKey, { 
                    volume: deathLoopData.sound.volume ?? 1.0,
                    loop: true 
                });
                this.currentSound.play();
            }
        }
    }

    update(time, delta) {
        if (this.isConfirming || this.isExiting) return;

        window.funkin.controls?.update();

        // 1. Lógica de ACEPTAR (Reiniciar)
        if (window.funkin.controls?.ACCEPT) {
            this.isConfirming = true;
            this.confirmAndRestart();
        }

        // 2. Lógica de CANCELAR (Salir al menú)
        if (window.funkin.controls?.BACK) {
            this.isExiting = true;
            this.exitToMenu();
        }
    }

    confirmAndRestart() {
        if (this.currentSound) {
            this.currentSound.stop();
            this.currentSound.destroy();
        }

        const playAsOpponent = funkin.play.options?.playAsOpponent === true;
        const charsData = funkin.play.characterLoader?.charactersData;
        const rawCharData = playAsOpponent ? charsData?.opponents?.[0] : charsData?.players?.[0];
        const deathConfirmData = rawCharData?.animations?.find(a => a.anim === "deathConfirm");

        const charRenderer = funkin.play.visuals.characters.charactersManager;
        charRenderer.playAnim(this.controlledChar, "deathConfirm", true);

        if (deathConfirmData?.sound?.path) {
            const audioKey = `gameOver_deathConfirm`;
            if (this.scene.cache.audio.exists(audioKey)) {
                this.scene.sound.play(audioKey, { volume: deathConfirmData.sound.volume ?? 1.0 });
            }
        }

        const targetCam = this.scene.gameCam?.cameras?.main || this.scene.cameras.main;
        targetCam.fadeOut(2000, 0, 0, 0);
        
        targetCam.once('camerafadeoutcomplete', () => {
            if (funkin.play.data.clean?.PlayCleanUp) {
                funkin.play.data.clean.PlayCleanUp.execute(this.scene);
            }
            this.scene.scene.restart();
        });
    }

    exitToMenu() {
        if (this.currentSound) this.currentSound.stop();
        
        // Ejecutar limpieza profunda antes de cambiar de escena
        if (funkin.play.data.clean?.PlayCleanUp) {
            funkin.play.data.clean.PlayCleanUp.execute(this.scene);
        }

        // Delegar la salida a PhaseEnd que ya tiene la lógica de retorno
        this.referee.changePhase("end");
    }
}

funkin.play.data.referee.PhaseGameOver = PhaseGameOver;