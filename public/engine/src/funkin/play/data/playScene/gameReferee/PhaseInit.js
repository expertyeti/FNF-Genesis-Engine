window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.data = funkin.play.data || {};
funkin.play.data.referee = funkin.play.data.referee || {};

/**
 * Construye el entorno gráfico y de datos de la PlayScene.
 */
class PhaseInit {
    constructor(referee) {
        this.referee = referee;
        this.scene = referee.scene;
    }

    async enter() {
        funkin.play.currentScene = this.scene;

        this._initDebuggers();
        this._initCameras();
        this._initSession();

        if (!(await this._loadChartData())) return;

        const stageName = funkin.play.chart?.get("metadata.stage") || "stage";
        await this._loadAssets(stageName);

        await funkin.play.data.clean?.GPUWarming?.execute?.(this.scene);

        await this._buildStageAndCharacters(stageName);
        this._buildNotesAndUI();
        this._initHealthSystem();
        this._setupConductor();

        this.scene.isReady = true;
        this.scene.lastBeat = 0;
        this.referee.changePhase("countdown");
    }

    _initDebuggers() {
        const dbg = funkin.playDebugging;
        if (dbg?.CameraDebugController) this.scene.cameraDebug = new dbg.CameraDebugController(this.scene);
        if (dbg?.SongDebugger) this.scene.songDebugger = new dbg.SongDebugger(this.scene);
    }

    _initCameras() {
        const cams = funkin.play.data?.camera;
        if (cams?.GameCamera) this.scene.gameCam = new cams.GameCamera(this.scene);
        if (cams?.UICamera) this.scene.uiCam = new cams.UICamera(this.scene);
        if (cams?.MainCamera) this.scene.mainCam = new cams.MainCamera(this.scene);
    }

    _initSession() {
        funkin.play.session = funkin.play.session || {
            generateNewSession: () => (this.scene.fallbackSessionId = "session_" + Date.now()),
            getKey: (k) => `${this.scene.fallbackSessionId || "fallback"}_${k}`,
            setCustomData: () => {}, getCustomData: () => null, clearCustomData: () => {},
        };
        funkin.play.session.generateNewSession();
    }

    async _loadChartData() {
        funkin.play.chart = funkin.play.chart || { loadChart: async () => false, get: () => null };
        const success = await funkin.play.chart.loadChart(this.scene.playData);
        
        if (!success) {
            this.scene.scene.start(this.scene.playData?.sourceScene || "MainMenuScene");
            return false;
        }

        await funkin.play.characterLoader?.loadCharacters?.();
        return true;
    }

    async _loadAssets(stageName) {
        await funkin.play.stageManager?.loadStage?.(stageName);

        const keys = funkin.play.chart?.get("metadata.mania") ?? 4;
        const notesAPI = funkin.play.visuals?.arrows?.notes;
        if (notesAPI?.NoteDirectionManager) this.scene.noteDirectionManager = new notesAPI.NoteDirectionManager(keys);

        const SkinsClass = funkin.play.visuals?.skins?.PlayUISkins;
        funkin.play.uiSkins = funkin.play.uiSkins || (SkinsClass ? new SkinsClass() : null);
        
        await funkin.play.uiSkins?.loadSkinData?.();
        await window.funkin.playPreload?.preloadAudio?.(this.scene, this.scene.playData?.actuallyPlaying);
        funkin.play.preload?.characters?.preload?.(this.scene);
        await funkin.play.PreloadStage?.preload?.(this.scene, stageName);
        await funkin.play.uiSkins?.preloadSkinAssets?.(this.scene);

        await new Promise((resolve) => {
            if (this.scene.load.totalToLoad === 0 && !this.scene.load.isLoading()) resolve();
            else {
                this.scene.load.once("complete", resolve);
                if (!this.scene.load.isLoading()) this.scene.load.start();
            }
        });
    }

    async _buildStageAndCharacters(stageName) {
        const stage = funkin.play.visuals?.stage;
        if (stage?.PlayListSprites) funkin.play.playListSprites = new stage.PlayListSprites(this.scene);
        stage?.CreateBG?.execute?.(this.scene, stageName);
        stage?.CreateImages?.execute?.(this.scene, stageName);
        stage?.CreateSprites?.execute?.(this.scene, stageName);

        await funkin.play.visuals?.characters?.charactersManager?.execute?.(this.scene, stageName);

        const LogicClass = funkin.play.visuals?.characters?.CharacterLogic || funkin.play.visuals?.characters?.AnimateCharacters;
        if (LogicClass) this.scene.animateCharacters = new LogicClass(this.scene);
    }

    _buildNotesAndUI() {
        const arrows = funkin.play.visuals?.arrows;
        const strumAPI = arrows?.strumelines || arrows?.strumlines;
        const notesAPI = arrows?.notes;
        const ui = funkin.play.visuals?.ui;

        arrows?.ArrowsSpawner?.clearExisting?.(this.scene);

        if (strumAPI?.Strumlines) this.scene.strumlines = new strumAPI.Strumlines(this.scene);
        if (notesAPI?.SustainNotesManager && this.scene.strumlines) this.scene.sustainNotesManager = new notesAPI.SustainNotesManager(this.scene, this.scene.strumlines);
        if (notesAPI?.NotesManager && this.scene.strumlines) this.scene.notesManager = new notesAPI.NotesManager(this.scene, this.scene.strumlines);

        if (arrows?.ArrowsSpawner) {
            if (this.scene.strumlines) arrows.ArrowsSpawner.spawnStrumlines(this.scene, this.scene.strumlines);
            if (this.scene.notesManager) arrows.ArrowsSpawner.spawnChartNotes(this.scene, this.scene.notesManager);
        }

        if (funkin.play.data?.clean?.AntiLagSystem) this.scene.antiLag = new funkin.play.data.clean.AntiLagSystem(this.scene);

        if (ui?.PlayerStatics) this.scene.playerStatics = new ui.PlayerStatics();
        if (ui?.JudgmentPopUpManager) this.scene.judgmentPopUpManager = new ui.JudgmentPopUpManager(this.scene);
        if (ui?.ComboPopUpManager) this.scene.comboPopUpManager = new ui.ComboPopUpManager(this.scene);
        
        if (notesAPI?.NoteSplashesManager) this.scene.noteSplashesManager = new notesAPI.NoteSplashesManager(this.scene);
        if (notesAPI?.HoldCoversManager) this.scene.holdCoversManager = new notesAPI.HoldCoversManager(this.scene);
        
        if (funkin.play.input?.PlayInput) this.scene.inputHandler = new funkin.play.input.PlayInput(this.scene);
        
        if (ui?.HealthBar) this.scene.healthBar = new ui.HealthBar(this.scene);
        if (ui?.ScoreText) this.scene.scoreText = new ui.ScoreText(this.scene);
        if (ui?.BotplayText) this.scene.botplayText = new ui.BotplayText(this.scene);
        if (ui?.CountDown) this.scene.countDown = new ui.CountDown(this.scene);

        if (funkin.play.data?.song?.PlaySongPlaylist) this.scene.songPlaylist = new funkin.play.data.song.PlaySongPlaylist(this.scene);

        // SEÑAL VITAL: Obliga a todas las notas, strumlines y UI a aplicarse la skin correcta.
        this.scene.events?.emit("ui_skin_changed");
    }

    _initHealthSystem() {
        funkin.play.health = {
            health: 1.0, healthLerp: 1.0,
            add: function(val) { this.health = Math.min(2.0, this.health + val); },
            subtract: function(val) { this.health = Math.max(0.0, this.health - val); },
            update: function(time, delta) {
                if (window.autoplay) this.health = 2.0;
                this.healthLerp = Phaser.Math.Linear(this.healthLerp, this.health, Math.min(1, (delta / 1000) * 10.5));
            },
        };

        this.scene.events?.on("noteHit", (d) => !window.autoplay && d.isPlayer && funkin.play.health.add(d.judgment === "good" ? 0.02 : (d.judgment === "shit" ? -0.05 : 0.04)));
        this.scene.events?.on("noteMiss", (d) => {
            if (window.autoplay || !d.isPlayer) return;
            funkin.play.health.subtract(0.0475);
            
            // CORRECCIÓN: Validar que el audio exista en caché antes de reproducir
            const missKey = `missnote${Phaser.Math.Between(1, 3)}`;
            if (this.scene.cache.audio.exists(missKey)) {
                this.scene.sound?.play(missKey, { volume: Phaser.Math.FloatBetween(0.7, 0.9) });
            }
            
            this.scene.songPlaylist?.vocalManager?.handleMiss?.(d);
        });
    }

    _setupConductor() {
        if (window.funkin.conductor) {
            window.funkin.conductor.bpm = funkin.play.chart?.get("metadata.audio.bpm") ?? 120;
            window.funkin.conductor.songPosition = 0;
        }
    }
}

funkin.play.data.referee.PhaseInit = PhaseInit;