/**
 * @file src/funkin/play/visuals/arrows/notes/note/logic/processInputs.js
 * Processes virtual and physical interactions mapping it onto the lanes.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.notes = funkin.play.visuals.arrows.notes || {};

funkin.play.visuals.arrows.notes.NoteLogic.prototype.processInputs = function (songPos, playAsOpponent, time) {
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

  const isTwoPlayer = getStoredOption("twoPlayerLocal") === true;

  // ¡AQUÍ ESTÁ LA SOLUCIÓN! 
  // Activamos o desactivamos la división de controles (WASD / Flechas) en tiempo real.
  if (window.funkin.controls) {
      if (isTwoPlayer && !window.funkin.controls.isTwoPlayerSplit) {
          window.funkin.controls.applyTwoPlayerSplit();
      } else if (!isTwoPlayer && window.funkin.controls.isTwoPlayerSplit) {
          window.funkin.controls.restoreBinds();
      }
  }

  const isCountdown = funkin.CountDown && funkin.CountDown.isInCountdown;
  if (isCountdown || window.autoplay) return;

  if (this.scene && this.scene.input && this.scene.input.keyboard) {
    const kb = this.scene.input.keyboard;
    const ctrl = kb.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL).isDown;
    const shift = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT).isDown;
    const alt = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ALT).isDown;

    if (ctrl && shift && alt) return;
  }

  const ghostTappingEnabled = getStoredOption("ghostTapping") !== false; 

  // Garantizamos que los arrays de lectura estén separados para cada jugador
  if (!this.manager.prevKeysP1) this.manager.prevKeysP1 = new Array(this.manager.keyCount || 4).fill(false);
  if (!this.manager.prevKeysP2) this.manager.prevKeysP2 = new Array(this.manager.keyCount || 4).fill(false);

  const dirs = funkin.NoteDirection ? funkin.NoteDirection.getMappings().names : ["left", "down", "up", "right"];

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

  const processSide = (isMySide, actionPrefix, targetStrums, prevKeysObj) => {
    const currentKeys = dirs.map((dir) => !!(funkin.controls && funkin.controls[actionPrefix + dir.toUpperCase()]));

    if (targetStrums) {
      activePointers.forEach((pointer) => {
        targetStrums.forEach((strum, lane) => {
          if (!strum) return;

          const originX = strum.originX !== undefined ? strum.originX : 0.5;
          const originY = strum.originY !== undefined ? strum.originY : 0.5;

          const w = strum._staticFrameWidth || strum.lastStaticWidth || strum.displayWidth;
          const h = strum._staticFrameHeight || strum.lastStaticHeight || strum.displayHeight;
          const scaleX = strum.scaleX || 1;
          const scaleY = strum.scaleY || 1;

          // Usamos baseX y baseY para que las hitboxes táctiles sean inmunes a temblores por animaciones
          const strumCenterX = (strum.baseX !== undefined ? strum.baseX : strum.x) + (w * scaleX) * (0.5 - originX);
          const strumCenterY = (strum.baseY !== undefined ? strum.baseY : strum.y) + (h * scaleY) * (0.5 - originY);

          const hitRadiusX = (w * scaleX) * 0.7; 
          const hitRadiusY = (h * scaleY) * 0.9; 

          if (Math.abs(pointer.x - strumCenterX) <= hitRadiusX) {
            if (Math.abs(pointer.y - strumCenterY) <= hitRadiusY) {
              currentKeys[lane] = true;
            }
          }
        });
      });
    }

    for (let lane = 0; lane < this.manager.keyCount; lane++) {
      if (currentKeys[lane] && !prevKeysObj[lane]) {
        let closestNote = null;
        let closestTime = 166;

        for (let i = 0; i < this.manager.notes.length; i++) {
          const n = this.manager.notes[i];

          if (n.active && n.isPlayer === isMySide && n.lane === lane && !n.wasHit && !n.hasMissed) {
            const diff = n.noteTime - songPos;
            if (Math.abs(diff) <= 166.0) {
              if (Math.abs(diff) < Math.abs(closestTime)) {
                closestNote = n;
                closestTime = diff;
              }
            }
          }
        }

        if (closestNote) {
          this.registerHit(closestNote, closestTime, lane, time);
        } else {
          if (!ghostTappingEnabled) {
            this.registerMiss(isMySide, lane);
          }
        }
      }
      prevKeysObj[lane] = currentKeys[lane];
    }
  };

  if (isTwoPlayer) {
      processSide(true, "NOTE_", this.manager.strumlines?.playerStrums, this.manager.prevKeysP1);
      processSide(false, "P2_NOTE_", this.manager.strumlines?.opponentStrums, this.manager.prevKeysP2);
  } else {
      const isMySide = playAsOpponent ? false : true;
      const targetStrums = playAsOpponent ? this.manager.strumlines?.opponentStrums : this.manager.strumlines?.playerStrums;
      processSide(isMySide, "NOTE_", targetStrums, this.manager.prevKeysP1);
  }
};