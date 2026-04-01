/**
 * Initial phase in charge of injecting dependencies, downloading dynamic resources
 * and building visually and logically the game environment.
 */
class PhaseInit {
  /**
   * @param {Object} referee
   */
  constructor(referee) {
    this.referee = referee;
    this.scene = referee.scene;
  }

  async enter() {
    const scene = this.scene;
    funkin.play.currentScene = scene;

    if (funkin.CameraDebugController) scene.cameraDebug = new funkin.CameraDebugController(scene);
    if (funkin.SongDebugger) scene.songDebugger = new funkin.SongDebugger(scene);

    if (funkin.GameCamera) scene.gameCam = new funkin.GameCamera(scene);
    if (funkin.UICamera) scene.uiCam = new funkin.UICamera(scene);
    if (funkin.MainCamera) scene.mainCam = new funkin.MainCamera(scene);

    if (!funkin.play.session) {
      funkin.play.session = {
        generateNewSession: () => {
          scene.fallbackSessionId = "session_" + Date.now();
          return scene.fallbackSessionId;
        },
        getKey: (originalKey) => `${scene.fallbackSessionId || "fallback"}_${originalKey}`,
        setCustomData: () => {},
        getCustomData: () => null,
        clearCustomData: () => {},
      };
    }
    funkin.play.session.generateNewSession();

    if (!funkin.play.chart) funkin.play.chart = { loadChart: async () => false, get: () => null };
    
    const chartLoaded = await funkin.play.chart.loadChart(scene.playData);
    if (!chartLoaded) {
      console.error("Failed to load chart returning to previous scene");
      const sourceScene = (scene.playData && scene.playData.sourceScene) ? scene.playData.sourceScene : "MainMenuScene";
      scene.scene.start(sourceScene);
      return; 
    }

    if (funkin.play.characterLoader && typeof funkin.play.characterLoader.loadCharacters === "function") {
      await funkin.play.characterLoader.loadCharacters();
    }

    const stageName = funkin.play.chart.get("metadata.stage") || "stage";

    if (funkin.play.stageManager) {
      await funkin.play.stageManager.loadStage(stageName);
    }

    const keyCount = funkin.play.chart.get("metadata.mania") || 4;
    if (funkin.NoteDirectionManager) scene.noteDirectionManager = new funkin.NoteDirectionManager(keyCount);

    if (!funkin.play.uiSkins) {
      funkin.play.uiSkins = {
        loadSkinData: async () => {},
        preloadSkinAssets: async () => {},
        getAssetKey: (key) => key,
        get: () => null,
      };
    }
    await funkin.play.uiSkins.loadSkinData();

    if (funkin.playPreload && typeof funkin.playPreload.preloadAudio === "function") {
      await funkin.playPreload.preloadAudio(scene, scene.playData.actuallyPlaying);
    }

    if (funkin.play.preload && funkin.play.preload.characters) {
      funkin.play.preload.characters.preload(scene);
    }

    if (funkin.play.PreloadStage) {
      await funkin.play.PreloadStage.preload(scene, stageName);
    }

    await funkin.play.uiSkins.preloadSkinAssets(scene);

    await new Promise((resolve) => {
      if (scene.load.totalToLoad === 0 && !scene.load.isLoading()) resolve();
      else {
        scene.load.once("complete", resolve);
        if (!scene.load.isLoading()) scene.load.start();
      }
    });

    await new Promise((resolve) => scene.time.delayedCall(50, resolve));

    if (funkin.play.PlayListSprites) funkin.play.playListSprites = new funkin.play.PlayListSprites(scene);
    if (funkin.play.AnimateCharacters) scene.animateCharacters = new funkin.play.AnimateCharacters(scene);

    if (funkin.play.stage && funkin.play.stage.CreateBG) funkin.play.stage.CreateBG.execute(scene, stageName);
    else if (funkin.play.CreateBG) funkin.play.CreateBG.execute(scene, stageName);

    if (funkin.play.stage && funkin.play.stage.CreateImages) funkin.play.stage.CreateImages.execute(scene, stageName);
    else if (funkin.play.CreateImages) funkin.play.CreateImages.execute(scene, stageName);

    if (funkin.play.stage && funkin.play.stage.CreateSprites) funkin.play.stage.CreateSprites.execute(scene, stageName);
    else if (funkin.play.CreateSprites) funkin.play.CreateSprites.execute(scene, stageName);

    if (funkin.play.stage && funkin.play.stage.CreateAtlasSprite) funkin.play.stage.CreateAtlasSprite.execute(scene, stageName);
    else if (funkin.play.CreateAtlasSprite) funkin.play.CreateAtlasSprite.execute(scene, stageName);

    if (funkin.play && funkin.play.SparrowCharacters) {
      await funkin.play.SparrowCharacters.execute(scene, stageName);
    }

    if (funkin.play && funkin.play.AtlasCharacters) {
      await funkin.play.AtlasCharacters.execute(scene, stageName);
    }

    if (funkin.ArrowsSpawner && typeof funkin.ArrowsSpawner.clearExisting === "function") funkin.ArrowsSpawner.clearExisting(scene);

    if (funkin.Strumlines) scene.strumlines = new funkin.Strumlines(scene);
    if (funkin.SustainNotesManager && scene.strumlines) scene.sustainNotesManager = new funkin.SustainNotesManager(scene, scene.strumlines);
    if (funkin.NotesManager && scene.strumlines) scene.notesManager = new funkin.NotesManager(scene, scene.strumlines);

    if (funkin.ArrowsSpawner) {
      if (scene.strumlines) funkin.ArrowsSpawner.spawnStrumlines(scene, scene.strumlines);
      if (scene.notesManager) funkin.ArrowsSpawner.spawnChartNotes(scene, scene.notesManager);
    }

    if (funkin.AntiLagSystem) scene.antiLag = new funkin.AntiLagSystem(scene);
    if (funkin.PlayerStatics) scene.playerStatics = new funkin.PlayerStatics();
    if (funkin.JudgmentPopUpManager) scene.judgmentPopUpManager = new funkin.JudgmentPopUpManager(scene);
    if (funkin.ComboPopUpManager) scene.comboPopUpManager = new funkin.ComboPopUpManager(scene);
    if (funkin.NoteSplashesManager) scene.noteSplashesManager = new funkin.NoteSplashesManager(scene);
    if (funkin.HoldCoversManager) scene.holdCoversManager = new funkin.HoldCoversManager(scene);
    if (funkin.PlayInput) scene.inputHandler = new funkin.PlayInput(scene);

    funkin.play.health = {
      health: 1.0,
      healthLerp: 1.0,
      add: function (val) {
        this.health = Math.min(2.0, this.health + val);
      },
      subtract: function (val) {
        this.health = Math.max(0.0, this.health - val);
      },
      update: function (time, delta) {
        if (window.autoplay) this.health = 2.0;
        const lerpFactor = Math.min(1, (delta / 1000) * 10.5);
        this.healthLerp = Phaser.Math.Linear(this.healthLerp, this.health, lerpFactor);
      },
    };

    scene.events.on("noteHit", (data) => {
      if (data.isPlayer && !window.autoplay) {
        let bonus = 0.04;
        if (data.judgment === "good") bonus = 0.02;
        else if (data.judgment === "bad") bonus = 0.0;
        else if (data.judgment === "shit") bonus = -0.05;
        funkin.play.health.add(bonus);
      }
    });

    scene.events.on("noteMiss", (data) => {
      if (data.isPlayer && !window.autoplay) funkin.play.health.subtract(0.0475);
    });

    if (funkin.play.HealthBar) scene.healthBar = new funkin.play.HealthBar(scene);
    if (funkin.play.ScoreText) scene.scoreText = new funkin.play.ScoreText(scene);
    
    // --> INYECCIÓN DE BOTPLAYTEXT ACÁ <--
    if (funkin.play.BotplayText) scene.botplayText = new funkin.play.BotplayText(scene);

    const bpm = funkin.play.chart && funkin.play.chart.get ? funkin.play.chart.get("metadata.audio.bpm") || 120 : 120;
    if (funkin.conductor) {
      if (funkin.conductor.bpm && typeof funkin.conductor.bpm.set === "function") funkin.conductor.bpm.set(bpm);
      else funkin.conductor.bpm = bpm;
      funkin.conductor.songPosition = 0;
    }

    if (funkin.CountDown) scene.countDown = new funkin.CountDown(scene);
    if (funkin.play.PlaySongPlaylist) scene.songPlaylist = new funkin.play.PlaySongPlaylist(scene);

    scene.isReady = true;
    scene.lastBeat = 0;

    this.referee.changePhase("countdown");
  }
}

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.PhaseInit = PhaseInit;