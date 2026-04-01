/**
 * Hold note logic handling sustained hits and timing calculations.
 */
class SustainLogic {
  constructor(manager) {
    this.manager = manager;
    this.scene = manager.scene;
  }

  playMissSound(isMyNote, isAuto) {
    if (isMyNote && !isAuto && this.scene && this.scene.sound) {
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
    const playAsOpponent = funkin.play.options && funkin.play.options.playAsOpponent;
    const isCountdown = funkin.CountDown && funkin.CountDown.isInCountdown;
    const isMobileMode = funkin.play.options && funkin.play.options.middlescroll === "mobile";

    let currentKeys = new Array(this.manager.keyCount).fill(false);
    if (!isCountdown && !window.autoplay) {
      const dirs = funkin.NoteDirection ? funkin.NoteDirection.getMappings().names : ["left", "down", "up", "right"];
      const controlsMapping = dirs.map((dir) => `NOTE_${dir.toUpperCase()}`);
      currentKeys = controlsMapping.map((key) => !!(funkin.controls && funkin.controls[key]));

      let activePointers = [];
      if (this.scene.input) {
        const pointersArr = this.scene.input.manager ? this.scene.input.manager.pointers : [];
        activePointers = pointersArr.filter((p) => p && p.isDown);
        if (
          this.scene.input.activePointer &&
          this.scene.input.activePointer.isDown &&
          !activePointers.includes(this.scene.input.activePointer)
        ) {
          activePointers.push(this.scene.input.activePointer);
        }
      }

      const targetStrums = playAsOpponent
        ? this.manager.strumlines?.opponentStrums
        : this.manager.strumlines?.playerStrums;
      
      if (targetStrums) {
        activePointers.forEach((pointer) => {
          targetStrums.forEach((strum, lane) => {
            if (!strum) return;

            const originX = strum.originX !== undefined ? strum.originX : 0.5;
            const originY = strum.originY !== undefined ? strum.originY : 0.5;
            const strumCenterX = strum.baseX + (strum.displayWidth * (0.5 - originX));
            const strumCenterY = strum.baseY + (strum.displayHeight * (0.5 - originY));

            const hitRadiusX = (strum.displayWidth || 112) * 0.90;
            const hitRadiusY = 400; 

            if (Math.abs(pointer.x - strumCenterX) <= hitRadiusX && Math.abs(pointer.y - strumCenterY) <= hitRadiusY) {
              currentKeys[lane] = true;
            }
          });
        });
      }
    }

    this.manager.sustains.forEach((sustain) => {
      this.handleRewind(sustain, songPos);
      if (!sustain.active) return;

      const isMyNote = playAsOpponent ? !sustain.isPlayer : sustain.isPlayer;
      let isBot = !isMyNote || (isMyNote && window.autoplay);
      let isHeld = true;

      if (!isBot) isHeld = currentKeys[sustain.lane];

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
          this.dropHold(sustain, songPos, isNearEnd, isMyNote);
        }
      } else {
        sustain.isBeingHit = false;
      }

      this.emitSustainEvents(sustain, isFullyConsumed);

      if (isFinishedTime && sustain.hasBeenHit && !sustain.strumReset) {
        sustain.strumReset = true;
      }

      this.triggerMissFeedback(sustain, songPos, isMyNote);
    });
  }

  handleRewind(sustain, songPos) {
    const timeDiffRewind = sustain.time - songPos;
    if (timeDiffRewind > 166.0) {
      if ((sustain.isBeingHit || sustain.wasBeingHit) && !sustain.coverEnded) {
        sustain.coverEnded = true;
        if (funkin.playSustains) {
          funkin.playSustains.emit("sustainDrop", {
            lane: sustain.lane,
            isPlayer: sustain.isPlayer,
            id: sustain.id,
          });
        }
      }
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
    if (isMyNote && sustain.hasBeenHit && !sustain.parentMissed) {
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
      const strums = sustain.isPlayer
        ? this.manager.strumlines.playerStrums
        : this.manager.strumlines.opponentStrums;
      const arrow = strums[sustain.lane];
      if (arrow && arrow.playAnim) {
        arrow.playAnim("confirm", false);
        arrow.resetTime = time + 50;
      }
    }
  }

  dropHold(sustain, songPos, isNearEnd, isMyNote) {
    sustain.isBeingHit = false;
    if (sustain.hasBeenHit && songPos > sustain.time && !isNearEnd) {
      if (!sustain.parentMissed) {
        sustain.parentMissed = true;
        if (isMyNote && !window.autoplay && funkin.playNotes) {
          funkin.playNotes.lastHit = {
            pressed: false,
            ms: 0,
            absMs: 0,
            judgment: "miss",
            score: -10,
            direction: sustain.lane,
            isPlayer: sustain.isPlayer,
            isSustain: true,
            isAuto: false,
          };
          funkin.playNotes.emit("noteMiss", funkin.playNotes.lastHit);
        }
      }
    }
  }

  emitSustainEvents(sustain, isFullyConsumed) {
    if (!sustain.wasBeingHit && sustain.isBeingHit) {
      if (funkin.playSustains)
        funkin.playSustains.emit("sustainStart", { lane: sustain.lane, isPlayer: sustain.isPlayer, id: sustain.id });
    } else if (sustain.wasBeingHit && sustain.isBeingHit) {
      if (isFullyConsumed && !sustain.coverEnded) {
        sustain.coverEnded = true;
        if (funkin.playSustains)
          funkin.playSustains.emit("sustainEnd", { lane: sustain.lane, isPlayer: sustain.isPlayer, id: sustain.id });
      } else if (!sustain.coverEnded) {
        if (funkin.playSustains)
          funkin.playSustains.emit("sustainActive", { lane: sustain.lane, isPlayer: sustain.isPlayer, id: sustain.id });
      }
    } else if (sustain.wasBeingHit && !sustain.isBeingHit) {
      if (isFullyConsumed) {
        if (!sustain.coverEnded) {
          sustain.coverEnded = true;
          if (funkin.playSustains)
            funkin.playSustains.emit("sustainEnd", { lane: sustain.lane, isPlayer: sustain.isPlayer, id: sustain.id });
        }
      } else {
        if (!sustain.coverEnded) {
          sustain.coverEnded = true;
          if (funkin.playSustains)
            funkin.playSustains.emit("sustainDrop", { lane: sustain.lane, isPlayer: sustain.isPlayer, id: sustain.id });
        }
      }
    }
    sustain.wasBeingHit = sustain.isBeingHit;
  }

  triggerMissFeedback(sustain, songPos, isMyNote) {
    if (sustain.parentMissed && !sustain.hasBeenHit && songPos > sustain.time + 166.0 && isMyNote) {
      if (!sustain.missAnimPlayed) {
        if (funkin.playNotes && !window.autoplay) {
          funkin.playNotes.lastHit = {
            pressed: false,
            ms: 0,
            absMs: 0,
            judgment: "miss",
            score: -10,
            direction: sustain.lane,
            isPlayer: sustain.isPlayer,
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

if (typeof window !== "undefined") funkin.SustainLogic = SustainLogic;