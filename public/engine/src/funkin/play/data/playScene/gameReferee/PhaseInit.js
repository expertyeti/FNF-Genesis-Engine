/**
 * @file src/funkin/play/data/playScene/gameReferee/PhaseInit.js
 * Construye el entorno gráfico y de datos de la PlayScene.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.data = funkin.play.data || {};
funkin.play.data.referee = funkin.play.data.referee || {};

class PhaseInit {
    /**
     * @param {Object} referee - Gestor maestro del ciclo de vida del juego.
     */
    constructor(referee) {
        this.referee = referee;
        this.scene = referee.scene;
    }

    /**
     * Ejecuta el flujo de inicialización asíncrona de recursos.
     * @returns {Promise<void>}
     */
    async enter() {
        const scene = this.scene;
        funkin.play.currentScene = scene;

        this._initDebuggers(scene);
        this._initCameras(scene);
        this._initSession(scene);

        const chartLoaded = await this._loadChartData(scene);
        if (!chartLoaded) return;

        const stageName = funkin.play.chart.get("metadata.stage") || "stage";
        await this._loadAssets(scene, stageName);

        // --- OPTIMIZACIÓN VRAM ---
        // Asegurar que la memoria gráfica cachee los recursos cargados antes de instanciar entidades
        if (funkin.play.data.clean && funkin.play.data.clean.GPUWarming) {
            await funkin.play.data.clean.GPUWarming.execute(scene);
        }

        this._buildStageAndCharacters(scene, stageName);
        this._buildNotesAndUI(scene);
        this._initHealthSystem(scene);
        this._setupConductor();

        scene.isReady = true;
        scene.lastBeat = 0;
        this.referee.changePhase("countdown");
    }

    _initDebuggers(scene) {
        if (!funkin.playDebugging) return;
        if (funkin.playDebugging.CameraDebugController) scene.cameraDebug = new funkin.playDebugging.CameraDebugController(scene);
        if (funkin.playDebugging.SongDebugger) scene.songDebugger = new funkin.playDebugging.SongDebugger(scene);
    }

    _initCameras(scene) {
        const cameras = funkin.play.data?.camera;
        if (!cameras) return;
        if (cameras.GameCamera) scene.gameCam = new cameras.GameCamera(scene);
        if (cameras.UICamera) scene.uiCam = new cameras.UICamera(scene);
        if (cameras.MainCamera) scene.mainCam = new cameras.MainCamera(scene);
    }

    _initSession(scene) {
        if (!funkin.play.session) {
            funkin.play.session = {
                generateNewSession: () => { scene.fallbackSessionId = "session_" + Date.now(); return scene.fallbackSessionId; },
                getKey: (originalKey) => `${scene.fallbackSessionId || "fallback"}_${originalKey}`,
                setCustomData: () => {},
                getCustomData: () => null,
                clearCustomData: () => {},
            };
        }
        funkin.play.session.generateNewSession();
    }

    async _loadChartData(scene) {
        if (!funkin.play.chart?.loadChart) {
            funkin.play.chart = { loadChart: async () => false, get: () => null };
        }

        const success = await funkin.play.chart.loadChart(scene.playData);
        if (!success) {
            const sourceScene = scene.playData?.sourceScene || "MainMenuScene";
            scene.scene.start(sourceScene);
            return false;
        }

        if (funkin.play.characterLoader?.loadCharacters) await funkin.play.characterLoader.loadCharacters();
        return true;
    }

    async _loadAssets(scene, stageName) {
        if (funkin.play.stageManager) await funkin.play.stageManager.loadStage(stageName);

        const keyCount = funkin.play.chart.get("metadata.mania") || 4;
        const notesAPI = funkin.play.visuals?.arrows || {};
        
        if (notesAPI.notes?.NoteDirectionManager) {
            scene.noteDirectionManager = new notesAPI.notes.NoteDirectionManager(keyCount);
        }

        if (!funkin.play.uiSkins?.loadSkinData) {
            const SkinsClass = funkin.play.visuals?.skins?.PlayUISkins;
            funkin.play.uiSkins = SkinsClass ? new SkinsClass() : {
                loadSkinData: async () => {}, preloadSkinAssets: async () => {}, getAssetKey: (k) => k, get: () => null
            };
        }

        await funkin.play.uiSkins.loadSkinData();

        if (window.funkin.playPreload?.preloadAudio) await window.funkin.playPreload.preloadAudio(scene, scene.playData.actuallyPlaying);
        if (funkin.play.preload?.characters) funkin.play.preload.characters.preload(scene);
        if (funkin.play.PreloadStage) await funkin.play.PreloadStage.preload(scene, stageName);
        
        await funkin.play.uiSkins.preloadSkinAssets(scene);

        await new Promise((resolve) => {
            if (scene.load.totalToLoad === 0 && !scene.load.isLoading()) resolve();
            else {
                scene.load.once("complete", resolve);
                if (!scene.load.isLoading()) scene.load.start();
            }
        });
    }

    async _buildStageAndCharacters(scene, stageName) {
        const stage = funkin.play.visuals?.stage || {};
        if (stage.PlayListSprites) funkin.play.playListSprites = new stage.PlayListSprites(scene);
        if (stage.CreateBG) stage.CreateBG.execute(scene, stageName);
        if (stage.CreateImages) stage.CreateImages.execute(scene, stageName);
        if (stage.CreateSprites) stage.CreateSprites.execute(scene, stageName);

        const chars = funkin.play.visuals?.characters || {};
        if (chars.AnimateCharacters) scene.animateCharacters = new chars.AnimateCharacters(scene);
        if (chars.SparrowCharacters) await chars.SparrowCharacters.execute(scene, stageName);
        if (chars.AtlasCharacters) await chars.AtlasCharacters.execute(scene, stageName);
    }

    _buildNotesAndUI(scene) {
        const notesAPI = funkin.play.visuals?.arrows || {};
        
        if (notesAPI.ArrowsSpawner?.clearExisting) notesAPI.ArrowsSpawner.clearExisting(scene);

        if (notesAPI.strumlines?.Strumlines) scene.strumlines = new notesAPI.strumlines.Strumlines(scene);
        if (notesAPI.notes?.SustainNotesManager && scene.strumlines) scene.sustainNotesManager = new notesAPI.notes.SustainNotesManager(scene, scene.strumlines);
        if (notesAPI.notes?.NotesManager && scene.strumlines) scene.notesManager = new notesAPI.notes.NotesManager(scene, scene.strumlines);

        if (notesAPI.ArrowsSpawner) {
            if (scene.strumlines) notesAPI.ArrowsSpawner.spawnStrumlines(scene, scene.strumlines);
            if (scene.notesManager) notesAPI.ArrowsSpawner.spawnChartNotes(scene, scene.notesManager);
        }

        if (funkin.play.data.clean?.AntiLagSystem) scene.antiLag = new funkin.play.data.clean.AntiLagSystem(scene);

        const ui = funkin.play.visuals?.ui || {};
        if (ui.PlayerStatics) scene.playerStatics = new ui.PlayerStatics();
        if (ui.JudgmentPopUpManager) scene.judgmentPopUpManager = new ui.JudgmentPopUpManager(scene);
        if (ui.ComboPopUpManager) scene.comboPopUpManager = new ui.ComboPopUpManager(scene);
        
        if (notesAPI.notes?.NoteSplashesManager) scene.noteSplashesManager = new notesAPI.notes.NoteSplashesManager(scene);
        if (notesAPI.notes?.HoldCoversManager) scene.holdCoversManager = new notesAPI.notes.HoldCoversManager(scene);
        
        if (funkin.play.input?.PlayInput) scene.inputHandler = new funkin.play.input.PlayInput(scene);
        
        if (ui.HealthBar) scene.healthBar = new ui.HealthBar(scene);
        if (ui.ScoreText) scene.scoreText = new ui.ScoreText(scene);
        if (ui.BotplayText) scene.botplayText = new ui.BotplayText(scene);
        if (ui.CountDown) scene.countDown = new ui.CountDown(scene);

        if (funkin.play.data.song?.PlaySongPlaylist) scene.songPlaylist = new funkin.play.data.song.PlaySongPlaylist(scene);
    }

    _initHealthSystem(scene) {
        funkin.play.health = {
            health: 1.0,
            healthLerp: 1.0,
            add: function (val) { this.health = Math.min(2.0, this.health + val); },
            subtract: function (val) { this.health = Math.max(0.0, this.health - val); },
            update: function (time, delta) {
                if (window.autoplay) this.health = 2.0;
                const lerpFactor = Math.min(1, (delta / 1000) * 10.5);
                this.healthLerp = Phaser.Math.Linear(this.healthLerp, this.health, lerpFactor);
            },
        };

        scene.events.on("noteHit", (data) => {
            if (data.isPlayer && !window.autoplay) {
                let bonus = data.judgment === "good" ? 0.02 : (data.judgment === "bad" ? 0.0 : (data.judgment === "shit" ? -0.05 : 0.04));
                funkin.play.health.add(bonus);
            }
        });

        scene.events.on("noteMiss", (data) => {
            if (!window.autoplay && data.isPlayer) {
                funkin.play.health.subtract(0.0475);
                const missSound = "missnote" + Phaser.Math.Between(1, 3);
                if (scene.cache.audio.exists(missSound)) scene.sound.play(missSound, { volume: Phaser.Math.FloatBetween(0.7, 0.9) });
                if (scene.songPlaylist?.vocalManager) scene.songPlaylist.vocalManager.muteVocals(data.isPlayer);
            }
        });
    }

    _setupConductor() {
        const bpm = funkin.play.chart ? funkin.play.chart.get("metadata.audio.bpm") || 120 : 120;
        if (window.funkin.conductor) {
            window.funkin.conductor.bpm = bpm;
            window.funkin.conductor.songPosition = 0;
        }
    }
}

funkin.play.data.referee.PhaseInit = PhaseInit;