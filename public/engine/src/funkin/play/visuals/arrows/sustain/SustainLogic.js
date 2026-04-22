/**
 * @file SustainLogic.js
 * Lógica del procesamiento de las notas largas y cargador robusto de sonidos de fallo.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.notes = funkin.play.visuals.arrows.notes || {};

// ============================================================================
// SUSTAIN API
// ============================================================================
class SustainAPI {
	constructor(manager) {
		this.manager = manager;
	}

	init() {
		funkin.playSustains = {
			_listeners: {},
			event: function (eventName, callback) {
				if (!this._listeners[eventName]) this._listeners[eventName] = [];
				this._listeners[eventName].push(callback);
			},
			emit: function (eventName, data) {
				if (this._listeners[eventName]) {
					this._listeners[eventName].forEach((cb) => cb(data));
				}
			},
		};
	}

	destroy() {
		if (funkin.playSustains) funkin.playSustains._listeners = {};
	}
}
funkin.play.visuals.arrows.notes.SustainAPI = SustainAPI;

// ============================================================================
// SUSTAIN LOGIC
// ============================================================================
class SustainLogic {
  constructor(manager) {
    this.manager = manager;
    this.scene = manager.scene;
  }

  // 🚨 ARREGLO: Cargador dinámico seguro para cuando falla una nota
  playMissSound(isPlayerSide, isAuto) {
    const getStoredOption = (key) => {
        if (funkin.play && funkin.play.options && funkin.play.options[key] !== undefined) return funkin.play.options[key];
        try { return localStorage.getItem("fnf_" + key) === "true"; } catch(e) { return false; }
    };

    const is2P = getStoredOption("twoPlayerLocal");
    let targetScene = this.scene || window.funkin.playScene;

    if (!targetScene && window.funkin && window.funkin.game) {
        const scenes = window.funkin.game.scene.scenes;
        targetScene = scenes.find(s => s.sys.isActive() && s.sound);
    }

    const shouldPlay = is2P ? true : isPlayerSide;

    if (shouldPlay && targetScene && targetScene.sound) {
        const rndIndex = Phaser.Math.Between(1, 3);
        const missKey = `missnote${rndIndex}`;

        if (targetScene.cache.audio.exists(missKey)) {
            targetScene.sound.play(missKey, { volume: 0.6 });
        } else if (targetScene.cache.audio.exists("missnote1")) {
            targetScene.sound.play("missnote1", { volume: 0.6 });
        } else {
            // Loader Dinámico Robusto
            const basePath = window.BASE_URL || "";
            if (!targetScene.sys.isLoadingEmergencyMiss) {
                targetScene.sys.isLoadingEmergencyMiss = true;
                targetScene.load.audio(missKey, `${basePath}assets/sounds/miss/${missKey}.ogg`);
                targetScene.load.once(`filecomplete-audio-${missKey}`, () => {
                    targetScene.sound.play(missKey, { volume: 0.6 });
                    targetScene.sys.isLoadingEmergencyMiss = false;
                });
                targetScene.load.once('loaderror', () => { targetScene.sys.isLoadingEmergencyMiss = false; });
                targetScene.load.start();
            }
        }
    }
  }

  update(time, delta) {
    const songPos = funkin.conductor.songPosition;
    
    const getStoredOption = (key) => {
        if (typeof funkin !== 'undefined' && funkin.play && funkin.play.options && funkin.play.options[key] !== undefined) return funkin.play.options[key];
        try {
            const keys = ['genesis_options', 'funkin_options', 'options', 'play_options', 'game_options'];
            for (let i = 0; i < keys.length; i++) {
                let val = localStorage.getItem(keys[i]);
                if (val) {
                    let p = JSON.parse(val);
                    if (p[key] !== undefined) return p[key];
                    if (p.play && p.play.options && p.play.options[key] !== undefined) return p.play.options[key];
                    if (p.options && p.options[key] !== undefined) return p.options[key];
                }
            }
        } catch(e) {}
        return false;
    };

    const playAsOpponent = getStoredOption("playAsOpponent") === true;
    const isTwoPlayer = getStoredOption("twoPlayerLocal") === true;
    const isCountdown = funkin.play.visuals.ui && funkin.play.visuals.ui.CountDown && funkin.play.visuals.ui.CountDown.isInCountdown;

    let currentKeysP1 = new Array(this.manager.keyCount).fill(false);
    let currentKeysP2 = new Array(this.manager.keyCount).fill(false);
    
    if (!isCountdown && !window.autoplay && this.manager.strumlines && this.manager.strumlines.keyStates) {
        currentKeysP1 = this.manager.strumlines.keyStates.player;
        currentKeysP2 = this.manager.strumlines.keyStates.opponent;
    }

    this.manager.sustains.forEach((sustain) => {
      this.handleRewind(sustain, songPos);
      if (!sustain.active) return;

      const isPlayer = sustain.pType === "pl" || sustain.isPlayer === true;
      const isOpponent = sustain.pType === "op" || sustain.isOpponent === true;

      const isMyNote = (playAsOpponent && !isTwoPlayer) ? isOpponent : isPlayer;
      
      let isBot = window.autoplay;
      if (!isTwoPlayer) {
          isBot = !isMyNote || (isMyNote && window.autoplay);
      }

      let isHeld = true;
      if (!isBot) {
          if (isTwoPlayer) {
              isHeld = isPlayer ? currentKeysP1[sustain.lane] : currentKeysP2[sustain.lane];
          } else {
              isHeld = currentKeysP1[sustain.lane];
          }
      }

      const isNearEnd = songPos >= sustain.time + sustain.length - this.manager.toleranceMs;
      const isFinishedTime = songPos > sustain.time + sustain.length;
      const isFullyConsumed = sustain.hasBeenHit && (isFinishedTime || sustain.earlyReleaseCompleted);

      this.checkEarlyRelease(sustain, isMyNote, isHeld, isNearEnd);
      this.checkParentMiss(sustain, songPos);

      let canHitSustain = songPos >= sustain.time && songPos <= sustain.time + sustain.length;

      if (!sustain.parentMissed && canHitSustain && !isCountdown) {
        if (isHeld) {
          this.applyHold(sustain, songPos, time);
        } else {
          this.dropHold(sustain, songPos, isNearEnd, isMyNote, isTwoPlayer);
        }
      } else {
        sustain.isBeingHit = false;
      }

      this.emitSustainEvents(sustain, isFullyConsumed);

      if (isFinishedTime && sustain.hasBeenHit && !sustain.strumReset) {
        sustain.strumReset = true;
      }

      this.triggerMissFeedback(sustain, songPos, isBot);
    });
  }

  handleRewind(sustain, songPos) {
    const timeDiffRewind = sustain.time - songPos;
    if (timeDiffRewind > 166.0) {
      sustain.active = true;
      sustain.isBeingHit = false;
      sustain.wasBeingHit = false;
      sustain.hasBeenHit = false;
      sustain.parentMissed = false;
      sustain.consumedTime = 0;
      sustain.strumReset = false;
      sustain.earlyReleaseCompleted = false;
      sustain.coverEnded = false;
      sustain.missAnimPlayed = false;
    }
  }

  checkEarlyRelease(sustain, isMyNote, isHeld, isNearEnd) {
    if (sustain.hasBeenHit && !sustain.parentMissed) {
      if (!isHeld && isNearEnd) {
        sustain.consumedTime = sustain.length;
        sustain.earlyReleaseCompleted = true;
      }
    }
  }

  checkParentMiss(sustain, songPos) {
    if (songPos > sustain.time + 166.0 && !sustain.hasBeenHit) sustain.parentMissed = true;
  }

  applyHold(sustain, songPos, time) {
    sustain.isBeingHit = true;
    sustain.hasBeenHit = true;
    sustain.consumedTime = Math.max(0, songPos - sustain.time);

    if (this.manager.strumlines && typeof this.manager.strumlines.playConfirm === 'function') {
        const isPlayer = sustain.pType === "pl" || sustain.isPlayer === true;
        this.manager.strumlines.playConfirm(sustain.lane, isPlayer, time, 50); 
    }
  }

  // 🚨 ARREGLO: Emitir el fallo (miss) de forma global para que quite vida y detenga vocales
  dropHold(sustain, songPos, isNearEnd, isMyNote, isTwoPlayer) {
    sustain.isBeingHit = false;
    if (sustain.hasBeenHit && songPos > sustain.time && !isNearEnd) {
      if (!sustain.parentMissed) {
        sustain.parentMissed = true; // Se considera fallada
        
        if (!window.autoplay && funkin.playNotes && (isMyNote || isTwoPlayer)) {
          const isPlayerSide = (sustain.pType === "pl" || sustain.isPlayer === true);
          
          const missData = {
            pressed: false,
            ms: 0,
            absMs: 0,
            judgment: "miss",
            score: -10,
            direction: sustain.lane,
            isPlayer: isPlayerSide,
            isSustain: true,
            isAuto: false,
          };
          
          funkin.playNotes.lastHit = missData;
          funkin.playNotes.emit("noteMiss", missData);
          
          // 🔥 VITAL: Enviar a la escena para aplicar penalización y silenciar al cantante
          if (this.scene && this.scene.events) {
             this.scene.events.emit("noteMiss", missData);
          }
          
          this.playMissSound(isPlayerSide, false);
        }
      }
    }
  }

  emitSustainEvents(sustain, isFullyConsumed) {
    const isPlayer = sustain.pType === "pl" || sustain.isPlayer === true;
    const eventData = { lane: sustain.lane, isPlayer: isPlayer, id: sustain.id };

    if (!sustain.wasBeingHit && sustain.isBeingHit) {
      if (funkin.playSustains) funkin.playSustains.emit("sustainStart", eventData);
    } else if (sustain.wasBeingHit && sustain.isBeingHit) {
      if (isFullyConsumed && !sustain.coverEnded) {
        sustain.coverEnded = true;
        if (funkin.playSustains) funkin.playSustains.emit("sustainEnd", eventData);
      } else if (!sustain.coverEnded) {
        if (funkin.playSustains) funkin.playSustains.emit("sustainActive", eventData);
      }
    } else if (sustain.wasBeingHit && !sustain.isBeingHit) {
      sustain.coverEnded = true;
      const eventName = isFullyConsumed ? "sustainEnd" : "sustainDrop";
      if (funkin.playSustains) funkin.playSustains.emit(eventName, eventData);
    }
    sustain.wasBeingHit = sustain.isBeingHit;
  }

  // 🚨 ARREGLO: También asegurar que las notas ignoradas por completo avisen a la escena
  triggerMissFeedback(sustain, songPos, isBot) {
    if (sustain.parentMissed && !sustain.hasBeenHit && songPos > sustain.time + 166.0 && !isBot) {
      if (!sustain.missAnimPlayed) {
        if (funkin.playNotes && !window.autoplay) {
          const isPlayerSide = sustain.pType === "pl" || sustain.isPlayer === true;
          const missData = {
            pressed: false,
            ms: 0,
            absMs: 0,
            judgment: "miss",
            score: -10,
            direction: sustain.lane,
            isPlayer: isPlayerSide,
            isSustain: true,
            isAuto: false,
          };
          
          funkin.playNotes.lastHit = missData;
          funkin.playNotes.emit("noteMiss", missData);
          
          if (this.scene && this.scene.events) {
              this.scene.events.emit("noteMiss", missData);
          }
          
          this.playMissSound(isPlayerSide, false);
        }
        sustain.missAnimPlayed = true;
      }
    }
  }
}
funkin.play.visuals.arrows.notes.SustainLogic = SustainLogic;

// ============================================================================
// SUSTAIN NOTES MANAGER
// ============================================================================
class SustainNotesManager {
  constructor(scene, strumlines) {
    this.scene = scene;
    this.strumlines = strumlines;
    this.sustains = [];
    this.scrollSpeed = 1.0;

    const notesNamespace = funkin.play.visuals.arrows.notes;
    this.keyCount = notesNamespace.NoteDirection ? notesNamespace.NoteDirection.keyCount : 4;

    this.globalSustainAlpha = 1;
    this.sustainOverlap = 2;
    this.sustainChunkMs = 100;
    this.globalYOffset = 200;
    this.maskWidth = 600;
    this.maskXOffset = 300;
    this.toleranceMs = 150;
    this.missedAlphaMultiplier = 0.4;

    this.maskGraphicsList = [];
    this.sustainMasksList = [];

    for (let i = 0; i < this.keyCount * 2; i++) {
      let mg = this.scene.add.graphics();
      mg.setScrollFactor(0);
      mg.setVisible(false);
      if (funkin.play.data.camera && funkin.play.data.camera.addObjToUI) {
        funkin.play.data.camera.addObjToUI(mg);
      }
      this.maskGraphicsList.push(mg);
      this.sustainMasksList.push(mg.createGeometryMask());
    }

    this.api = new notesNamespace.SustainAPI(this);
    this.skin = new notesNamespace.SustainSkin(this);
    this.logic = new notesNamespace.SustainLogic(this);
    this.renderer = new notesNamespace.SustainRenderer(this);

    this.api.init();
    this.scene.events.on("ui_skin_changed", () => this.skin.reloadSkin(), this);
    this.skin.initSustains();
  }

  update(time, delta) {
    if (!funkin.conductor || this.sustains.length === 0) return;

    if (funkin.play && funkin.play.chart) {
        const chartSpeed = funkin.play.chart.get("metadata.scrollSpeed") || funkin.play.chart.get("metadata.speed");
        if (chartSpeed !== undefined && chartSpeed !== null) {
            this.scrollSpeed = chartSpeed;
        }
    }

    this.logic.update(time, delta);
    this.renderer.update(time, delta);
  }

  destroy() {
    this.scene.events.off("ui_skin_changed", this.skin.reloadSkin, this);
    this.sustains.forEach((s) => {
      if (s.bodyParts) s.bodyParts.forEach((p) => { if (p) p.destroy(); });
      if (s.end) s.end.destroy();
    });
    this.sustains = [];

    if (this.maskGraphicsList) {
      this.maskGraphicsList.forEach((mg) => mg.destroy());
      this.maskGraphicsList = [];
    }
    this.sustainMasksList = [];
    this.api.destroy();
  }
}

funkin.play.visuals.arrows.notes.SustainNotesManager = SustainNotesManager;