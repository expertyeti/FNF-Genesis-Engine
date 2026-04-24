/**
 * @file PhaseGameOver.js
 * Fase de fracaso definitiva. Desactiva cámaras de UI, destruye strumlines, 
 * verifica agresivamente la existencia de animaciones, aplica el Fallback de BF
 * y corrige el "flash" del spritesheet completo.
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
        
        this.firstDeathData = null;
        this.deathLoopData = null;
        this.deathConfirmData = null;
    }

    async enter() {
        this.isConfirming = false;
        this.isExiting = false;
        
        // 1. Detener música y sonidos globales
        if (this.scene.songPlaylist && typeof this.scene.songPlaylist.stopAll === 'function') {
            this.scene.songPlaylist.stopAll();
        }
        if (this.scene.sound) {
            this.scene.sound.stopAll();
        }

        // 2. Seleccionar personaje controlado
        const playAsOpponent = funkin.play.options?.playAsOpponent === true;
        this.controlledChar = playAsOpponent ? this.scene.opponent : this.scene.player;

        if (!this.controlledChar) {
            this.exitToMenu();
            return;
        }

        // 3. DESACTIVACIÓN RADICAL DE UI Y CÁMARAS
        if (this.scene.uiCam?.cameras?.main) {
            this.scene.uiCam.cameras.main.enabled = false;
            this.scene.uiCam.cameras.main.setVisible(false);
        }

        // 4. DESTRUIR STRUMLINES Y APAGAR EVENTOS (Evita inputs fantasma)
        if (this.scene.strumlines) {
            if (typeof this.scene.strumlines.destroy === 'function') {
                this.scene.strumlines.destroy();
            } else {
                if (this.scene.strumlines.playerStrums) this.scene.strumlines.playerStrums.forEach(s => { if(s) { s.setVisible(false); s.destroy(); } });
                if (this.scene.strumlines.opponentStrums) this.scene.strumlines.opponentStrums.forEach(s => { if(s) { s.setVisible(false); s.destroy(); } });
            }
            this.scene.strumlines = null; 
        }
        
        this.scene.events.off("noteHit");
        this.scene.events.off("noteMiss");
        this.scene.events.off("sustainActive");

        // 5. PURGA VISUAL: Ocultar todo excepto el jugador
        this.scene.children.list.forEach(child => {
            if (child !== this.controlledChar && child.type !== 'Camera') {
                if (typeof child.setVisible === 'function') child.setVisible(false);
            }
        });

        // 6. ENFOCAR CÁMARA
        const targetCam = this.scene.gameCam?.cameras?.main || this.scene.cameras.main;
        targetCam.setBackgroundColor('#000000');
        const midX = this.controlledChar.x + (this.controlledChar.displayWidth / 2);
        const midY = this.controlledChar.y + (this.controlledChar.displayHeight / 2);
        const camOffsetX = this.controlledChar.cameraPosition?.[0] || 0;
        const camOffsetY = this.controlledChar.cameraPosition?.[1] || 0;
        targetCam.pan(midX + camOffsetX, midY + camOffsetY, 1200, 'Expo.easeOut');
        targetCam.zoomTo(0.95, 1200, 'Expo.easeOut');

        // Detener cualquier animación actual para evitar que se quede congelado
        if (this.controlledChar.stop) this.controlledChar.stop();
        this.controlledChar.isDead = true;
        this.controlledChar.dance = () => {}; 

        // 7. EXTRACCIÓN DE DATOS Y VERIFICACIÓN AGRESIVA
        const charsData = funkin.play.characterLoader?.charactersData;
        const rawCharData = playAsOpponent ? charsData?.opponents?.[0] : charsData?.players?.[0];
        const anims = rawCharData?.animations || [];

        this.firstDeathData = anims.find(a => a.anim === "firstDeath");
        this.deathLoopData = anims.find(a => a.anim === "deathLoop");
        this.deathConfirmData = anims.find(a => a.anim === "deathConfirm");

        // Verificamos si las animaciones REALMENTE existen en la memoria de Phaser
        let needsFallback = false;
        
        if (!this.firstDeathData || !this.deathLoopData || !this.deathConfirmData) {
            needsFallback = true;
        } else {
            const checkAnimExists = (animName) => {
                const key = this.controlledChar.animKeys?.get(animName);
                return key && this.scene.anims.exists(key);
            };
            // Si el JSON dice que las tiene, pero Phaser no pudo crearlas (frames rotos o faltantes en XML)
            if (!checkAnimExists("firstDeath") || !checkAnimExists("deathLoop") || !checkAnimExists("deathConfirm")) {
                needsFallback = true;
            }
        }

        // --- INYECCIÓN DEL FALLBACK ---
        if (needsFallback) {
            console.warn("Animaciones de muerte rotas o ausentes. Forzando Fallback de Boyfriend.");
            
            this.firstDeathData = { loop: false, offsets: [-37, 11], anim: "firstDeath", fps: 24, name: "BF dies", sound: { path: "bf/fnf_loss_sfx.ogg", volume: 0.5, loop: false }, indices: [] };
            this.deathLoopData = { loop: false, offsets: [-37, 5], anim: "deathLoop", fps: 24, name: "BF Dead Loop", sound: { path: "bf/gameOver.ogg", volume: 0.5, loop: true }, indices: [] };
            this.deathConfirmData = { loop: false, offsets: [-37, 69], anim: "deathConfirm", fps: 24, name: "BF Dead confirm", sound: { path: "bf/gameOverEnd.ogg", volume: 0.5, loop: false }, indices: [] };

            const fallbackKey = 'characters/BOYFRIEND';

            if (this.scene.textures.exists(fallbackKey)) {
                // FIX: Ocultar para evitar el flash de 1 frame del spritesheet
                this.controlledChar.setVisible(false);

                // Forzar textura, restaurar escala original y color
                this.controlledChar.setTexture(fallbackKey);
                this.controlledChar.setScale(1.0); // Evitar que herede escalas locas de otros personajes
                this.controlledChar.setTint(0xffffff);
                this.controlledChar.setAlpha(1);
                
                // Parseo manual a prueba de fallos
                const xmlKey = `${fallbackKey}_xml`;
                if (this.scene.cache.text.exists(xmlKey)) {
                    const tex = this.scene.textures.get(fallbackKey);
                    // Solo parsear si Phaser no lo hizo como Atlas
                    if (tex && Object.keys(tex.frames).length <= 1) { 
                        if (funkin.utils?.animations?.sparrow) {
                            funkin.utils.animations.sparrow.SparrowParser.fixPhaserSparrow(this.scene, fallbackKey, this.scene.cache.text.get(xmlKey));
                        }
                    }
                }

                if (!this.controlledChar.animKeys) this.controlledChar.animKeys = new Map();
                if (!this.controlledChar.animOffsets) this.controlledChar.animOffsets = new Map();

                // Crear y anclar las animaciones
                const ensureAnim = (data) => {
                    const globalKey = `${fallbackKey}_${data.anim}`;
                    if (!this.scene.anims.exists(globalKey)) {
                        let frames = [];
                        const texture = this.scene.textures.get(fallbackKey);
                        if (texture && texture.frames) {
                            const allFrames = Object.keys(texture.frames);
                            const animFrames = allFrames.filter(f => f.startsWith(data.name)).sort(
                                (a, b) => a.localeCompare(b, undefined, {numeric: true})
                            );
                            frames = animFrames.map(f => ({ key: fallbackKey, frame: f }));
                        }
                        if (frames.length > 0) {
                            this.scene.anims.create({ key: globalKey, frames: frames, frameRate: data.fps, repeat: data.loop ? -1 : 0 });
                        }
                    }
                    this.controlledChar.animKeys.set(data.anim, globalKey);
                    this.controlledChar.animOffsets.set(data.anim, data.offsets);
                };

                ensureAnim(this.firstDeathData);
                ensureAnim(this.deathLoopData);
                ensureAnim(this.deathConfirmData);

                // FIX: Asignar el primer frame exacto de la muerte ANTES de que el hilo se pause
                const tex = this.scene.textures.get(fallbackKey);
                if (tex && tex.frames) {
                    const framesList = Object.keys(tex.frames)
                        .filter(f => f.startsWith(this.firstDeathData.name))
                        .sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
                        
                    if (framesList.length > 0) {
                        this.controlledChar.setFrame(framesList[0]);
                        // Aplicar los offsets del primer frame para que no brinque
                        const off = this.firstDeathData.offsets || [0,0];
                        this.controlledChar.setPosition(this.controlledChar.baseX - off[0], this.controlledChar.baseY - off[1]);
                    }
                }

                // Ahora sí podemos mostrarlo con seguridad
                this.controlledChar.setVisible(true);
            } else {
                console.error("El Fallback de BOYFRIEND no está en la caché.");
            }
        }
        // ------------------------------

        // Asegurar comportamiento del loop
        const loopKey = this.controlledChar.animKeys?.get("deathLoop");
        if (loopKey && this.scene.anims.exists(loopKey)) {
            this.scene.anims.get(loopKey).repeat = -1;
        }

        // Al hacer await aquí, el juego hace un render. 
        // Como ya pusimos el primer frame explícitamente, ya no habrá flash.
        await Promise.all([
            this.loadAudio(this.firstDeathData),
            this.loadAudio(this.deathLoopData),
            this.loadAudio(this.deathConfirmData)
        ]);

        this.playGameOverSequence(this.firstDeathData, this.deathLoopData);
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
        
        // Si no hay sonido, esperar a que termine la animación
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

        // 1. ACEPTAR
        if (window.funkin.controls?.ACCEPT) {
            this.isConfirming = true;
            this.confirmAndRestart();
        }

        // 2. SALIR
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

        const charRenderer = funkin.play.visuals.characters.charactersManager;
        charRenderer.playAnim(this.controlledChar, "deathConfirm", true);

        if (this.deathConfirmData?.sound?.path) {
            const audioKey = `gameOver_deathConfirm`;
            if (this.scene.cache.audio.exists(audioKey)) {
                this.scene.sound.play(audioKey, { volume: this.deathConfirmData.sound.volume ?? 1.0 });
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
        if (funkin.play.data.clean?.PlayCleanUp) {
            funkin.play.data.clean.PlayCleanUp.execute(this.scene);
        }
        this.referee.changePhase("end");
    }
}

funkin.play.data.referee.PhaseGameOver = PhaseGameOver;