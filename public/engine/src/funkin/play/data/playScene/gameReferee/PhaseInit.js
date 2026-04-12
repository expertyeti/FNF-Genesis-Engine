/**
 * @file PhaseInit.js
 * Fase inicial encargada de construir el entorno de juego.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.data = funkin.play.data || {};
funkin.play.data.referee = funkin.play.data.referee || {};

class PhaseInit {
  constructor(referee) {
    this.referee = referee;
    this.scene = referee.scene;
  }

  async enter() {
    const scene = this.scene;
    funkin.play.currentScene = scene;

    if (funkin.playDebugging && funkin.playDebugging.CameraDebugController)
      scene.cameraDebug = new funkin.playDebugging.CameraDebugController(scene);
    if (funkin.playDebugging && funkin.playDebugging.SongDebugger)
      scene.songDebugger = new funkin.playDebugging.SongDebugger(scene);

    const cameras = funkin.play.data && funkin.play.data.camera;
    if (cameras && cameras.GameCamera)
      scene.gameCam = new cameras.GameCamera(scene);
    if (cameras && cameras.UICamera) scene.uiCam = new cameras.UICamera(scene);
    if (cameras && cameras.MainCamera)
      scene.mainCam = new cameras.MainCamera(scene);

    if (!funkin.play.session) {
      funkin.play.session = {
        generateNewSession: () => {
          scene.fallbackSessionId = "session_" + Date.now();
          return scene.fallbackSessionId;
        },
        getKey: (originalKey) =>
          `${scene.fallbackSessionId || "fallback"}_${originalKey}`,
        setCustomData: () => {},
        getCustomData: () => null,
        clearCustomData: () => {},
      };
    }
    funkin.play.session.generateNewSession();

    if (!funkin.play.chart || typeof funkin.play.chart.loadChart !== "function") {
      funkin.play.chart = { loadChart: async () => false, get: () => null };
    }

    const chartLoaded = await funkin.play.chart.loadChart(scene.playData);
    if (!chartLoaded) {
      const sourceScene = scene.playData && scene.playData.sourceScene ? scene.playData.sourceScene : "MainMenuScene";
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

    const notesAPI = funkin.play.visuals && funkin.play.visuals.arrows ? funkin.play.visuals.arrows : {};
    if (notesAPI.notes && notesAPI.notes.NoteDirectionManager)
      scene.noteDirectionManager = new notesAPI.notes.NoteDirectionManager(keyCount);

    if (!funkin.play.uiSkins || typeof funkin.play.uiSkins.loadSkinData !== "function") {
      const skinsNamespace = funkin.play.visuals && funkin.play.visuals.skins;
      if (skinsNamespace && skinsNamespace.PlayUISkins) {
        funkin.play.uiSkins = new skinsNamespace.PlayUISkins();
      } else {
        funkin.play.uiSkins = {
          loadSkinData: async () => {},
          preloadSkinAssets: async () => {},
          getAssetKey: (key) => key,
          get: () => null,
        };
      }
    }

    await funkin.play.uiSkins.loadSkinData();

    if (window.funkin.playPreload && typeof window.funkin.playPreload.preloadAudio === "function") {
      await window.funkin.playPreload.preloadAudio(scene, scene.playData.actuallyPlaying);
    }

    if (funkin.play.preload && funkin.play.preload.characters) funkin.play.preload.characters.preload(scene);
    if (funkin.play.PreloadStage) await funkin.play.PreloadStage.preload(scene, stageName);

    await funkin.play.uiSkins.preloadSkinAssets(scene);

    await new Promise((resolve) => {
      if (scene.load.totalToLoad === 0 && !scene.load.isLoading()) resolve();
      else {
        scene.load.once("complete", resolve);
        if (!scene.load.isLoading()) scene.load.start();
      }
    });

    await new Promise((resolve) => scene.time.delayedCall(50, resolve));

    if (funkin.play.visuals.stage && funkin.play.visuals.stage.PlayListSprites)
      funkin.play.playListSprites = new funkin.play.visuals.stage.PlayListSprites(scene);
    if (funkin.play.visuals.characters && funkin.play.visuals.characters.AnimateCharacters)
      scene.animateCharacters = new funkin.play.visuals.characters.AnimateCharacters(scene);

    const stage = funkin.play.visuals.stage || {};
    if (stage.CreateBG) stage.CreateBG.execute(scene, stageName);
    if (stage.CreateImages) stage.CreateImages.execute(scene, stageName);
    if (stage.CreateSprites) stage.CreateSprites.execute(scene, stageName);

    const chars = funkin.play.visuals.characters || {};
    if (chars.SparrowCharacters) await chars.SparrowCharacters.execute(scene, stageName);
    if (chars.AtlasCharacters) await chars.AtlasCharacters.execute(scene, stageName);

    if (notesAPI.ArrowsSpawner && typeof notesAPI.ArrowsSpawner.clearExisting === "function")
      notesAPI.ArrowsSpawner.clearExisting(scene);

    if (notesAPI.strumlines && notesAPI.strumlines.Strumlines)
      scene.strumlines = new notesAPI.strumlines.Strumlines(scene);
    if (notesAPI.notes && notesAPI.notes.SustainNotesManager && scene.strumlines)
      scene.sustainNotesManager = new notesAPI.notes.SustainNotesManager(scene, scene.strumlines);
    if (notesAPI.notes && notesAPI.notes.NotesManager && scene.strumlines)
      scene.notesManager = new notesAPI.notes.NotesManager(scene, scene.strumlines);

    if (notesAPI.ArrowsSpawner) {
      if (scene.strumlines) notesAPI.ArrowsSpawner.spawnStrumlines(scene, scene.strumlines);
      if (scene.notesManager) notesAPI.ArrowsSpawner.spawnChartNotes(scene, scene.notesManager);
    }

    if (funkin.play.data.clean && funkin.play.data.clean.AntiLagSystem)
      scene.antiLag = new funkin.play.data.clean.AntiLagSystem(scene);

    const ui = funkin.play.visuals.ui || {};
    if (ui.PlayerStatics) scene.playerStatics = new ui.PlayerStatics();
    if (ui.JudgmentPopUpManager) scene.judgmentPopUpManager = new ui.JudgmentPopUpManager(scene);
    if (ui.ComboPopUpManager) scene.comboPopUpManager = new ui.ComboPopUpManager(scene);
    if (notesAPI.notes && notesAPI.notes.NoteSplashesManager) scene.noteSplashesManager = new notesAPI.notes.NoteSplashesManager(scene);
    if (notesAPI.notes && notesAPI.notes.HoldCoversManager) scene.holdCoversManager = new notesAPI.notes.HoldCoversManager(scene);
    if (funkin.play.input && funkin.play.input.PlayInput) scene.inputHandler = new funkin.play.input.PlayInput(scene);

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
        if (scene.songPlaylist && scene.songPlaylist.vocalManager) scene.songPlaylist.vocalManager.muteVocals(data.isPlayer);
      }
    });

    if (ui.HealthBar) scene.healthBar = new ui.HealthBar(scene);
    if (ui.ScoreText) scene.scoreText = new ui.ScoreText(scene);
    if (ui.BotplayText) scene.botplayText = new ui.BotplayText(scene);

    const bpm = funkin.play.chart ? funkin.play.chart.get("metadata.audio.bpm") || 120 : 120;
    if (window.funkin.conductor) {
      window.funkin.conductor.bpm = bpm;
      window.funkin.conductor.songPosition = 0;
    }

    if (ui.CountDown) scene.countDown = new ui.CountDown(scene);
    if (funkin.play.data.song && funkin.play.data.song.PlaySongPlaylist)
      scene.songPlaylist = new funkin.play.data.song.PlaySongPlaylist(scene);

    scene.isReady = true;
    scene.lastBeat = 0;
    this.referee.changePhase("countdown");
  }
}

funkin.play.data.referee.PhaseInit = PhaseInit;