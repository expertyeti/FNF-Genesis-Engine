/**
 * @file SustainLogic.js
 * Lógica de procesamiento para notas largas en Genesis Engine.
 */
class SustainLogic {
  constructor(manager) {
    this.manager = manager;
    this.scene = manager.scene;
  }

  playMissSound(isMyNote, isAuto) {
    if (!isAuto && this.scene && this.scene.sound) {
      const rnd = Phaser.Math.Between(1, 3);
      const missKey = `missnote${rnd}`;
      if (this.scene.cache.audio.exists(missKey)) {
        this.scene.sound.play(missKey, { volume: 0.6 });
      } else if (this.scene.cache.audio.exists("missnote1")) {
        this.scene.sound.play("missnote1", { volume: 0.6 });
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
    
    if (!isCountdown && !window.autoplay) {
      const dirs = funkin.NoteDirection ? funkin.NoteDirection.getMappings().names : ["left", "down", "up", "right"];
      const mapP1 = dirs.map((dir) => `NOTE_${dir.toUpperCase()}`);
      const mapP2 = dirs.map((dir) => `P2_NOTE_${dir.toUpperCase()}`);
      
      currentKeysP1 = mapP1.map((key) => !!(funkin.controls && funkin.controls[key]));
      currentKeysP2 = mapP2.map((key) => !!(funkin.controls && funkin.controls[key]));
    }

    this.manager.sustains.forEach((sustain) => {
      this.handleRewind(sustain, songPos);
      if (!sustain.active) return;

      // --- NUEVA LÓGICA DE DETECCIÓN POR STRINGS ---
      // Si el spawner ya convirtió p: "pl" a isPlayer: true, lo usamos. 
      // Si no, lo extraemos directamente del objeto de la nota.
      const isPlayer = sustain.pType === "pl" || sustain.isPlayer === true;
      const isOpponent = sustain.pType === "op" || sustain.isOpponent === true;

      // Determinamos si es "Nuestra" nota (la que el humano debe presionar)
      const isMyNote = (playAsOpponent && !isTwoPlayer) ? isOpponent : isPlayer;
      
      // Lógica de Bot mejorada: El oponente solo es bot si no estamos en modo 2 Jugadores Local
      let isBot = window.autoplay;
      if (!isTwoPlayer) {
          isBot = !isMyNote || (isMyNote && window.autoplay);
      }

      let isHeld = true;
      if (!isBot) {
          if (isTwoPlayer) {
              // En 2P, el jugador 1 presiona sus notas y el jugador 2 las suyas
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

    if (this.manager.strumlines) {
      const isPlayer = sustain.pType === "pl" || sustain.isPlayer === true;
      const strums = isPlayer
        ? this.manager.strumlines.playerStrums
        : this.manager.strumlines.opponentStrums;
        
      const arrow = strums[sustain.lane];
      if (arrow && arrow.playAnim) {
        arrow.playAnim("confirm", false);
        arrow.resetTime = time + 50;
      }
    }
  }

  dropHold(sustain, songPos, isNearEnd, isMyNote, isTwoPlayer) {
    sustain.isBeingHit = false;
    if (sustain.hasBeenHit && songPos > sustain.time && !isNearEnd) {
      if (!sustain.parentMissed) {
        sustain.parentMissed = true;
        if (!window.autoplay && funkin.playNotes && (isMyNote || isTwoPlayer)) {
          funkin.playNotes.lastHit = {
            pressed: false,
            ms: 0,
            absMs: 0,
            judgment: "miss",
            score: -10,
            direction: sustain.lane,
            isPlayer: (sustain.pType === "pl" || sustain.isPlayer === true),
            isSustain: true,
            isAuto: false,
          };
          funkin.playNotes.emit("noteMiss", funkin.playNotes.lastHit);
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

  triggerMissFeedback(sustain, songPos, isBot) {
    if (sustain.parentMissed && !sustain.hasBeenHit && songPos > sustain.time + 166.0 && !isBot) {
      if (!sustain.missAnimPlayed) {
        if (funkin.playNotes && !window.autoplay) {
          const isPlayer = sustain.pType === "pl" || sustain.isPlayer === true;
          funkin.playNotes.lastHit = {
            pressed: false,
            ms: 0,
            absMs: 0,
            judgment: "miss",
            score: -10,
            direction: sustain.lane,
            isPlayer: isPlayer,
            isSustain: true,
            isAuto: false,
          };
          funkin.playNotes.emit("noteMiss", funkin.playNotes.lastHit);
          this.playMissSound(true, false);
        }
        sustain.missAnimPlayed = true;
      }
    }
  }
}
funkin.play.visuals.arrows.notes.SustainLogic = SustainLogic;