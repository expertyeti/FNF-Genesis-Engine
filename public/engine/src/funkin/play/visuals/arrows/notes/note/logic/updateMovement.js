/**
 * @file src/funkin/play/visuals/arrows/notes/note/logic/updateMovement.js
 */
funkin.play.visuals.arrows.notes.NoteLogic.prototype.updateMovement = function (songPos, playAsOpponent, isTimeJumping, time) {
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
      if (key === "mobileSchedule") return "arrow";
      return false;
  };

  const globalDownscroll = getStoredOption("downscroll") === true;
  const hideEnemy = getStoredOption("hideOpponentNotes") === true;
  const isTwoPlayer = getStoredOption("twoPlayerLocal") === true;
  
  const schedule = getStoredOption("mobileSchedule");
  const isArrowScheduleActive = window.funkin.mobile && !window.funkin.isKeyboardActive && schedule === "arrow";
  
  const isRewinding = this.manager.scene && this.manager.scene.isRewinding;

  this.manager.notes.forEach((note) => {
    if (!note.active && !note.hasMissed && !isRewinding) return; 

    const timeDiff = note.noteTime - songPos;
    const distance = timeDiff * 0.45 * this.manager.scrollSpeed;
    
    // En multijugador, determinamos el lado original sin invertirlo
    const isMyNoteAuto = (playAsOpponent && !isTwoPlayer) ? !note.isPlayer : note.isPlayer;
    
    // CORRECCIÓN DE MULTIJUGADOR: El enemigo ya no es un Bot si 2P está activo
    let isAutoHit = window.autoplay;
    if (!isTwoPlayer) {
        isAutoHit = !isMyNoteAuto || (isMyNoteAuto && window.autoplay);
    }

    let isDownscroll = globalDownscroll;
    if (isArrowScheduleActive) {
        isDownscroll = isMyNoteAuto; 
    }

    if (!isRewinding) {
        if (isAutoHit && timeDiff <= 0 && !note.wasHit && !note.hasMissed) {
            this.executeAutoHit(note, timeDiff, isTimeJumping, time, isMyNoteAuto);
            return;
        }
        if ((isMyNoteAuto || isTwoPlayer) && timeDiff < -166.0 && !note.hasMissed && !note.wasHit) {
            this.executeLateMiss(note, timeDiff, isTimeJumping, isMyNoteAuto);
        }
    }

    if (!note.hasMissed && (distance > 5000 || distance < -2000)) {
        note.visible = false;
        return;
    } else if (note.hasMissed && distance < -2000 && !isRewinding) {
        note.visible = false;
        return;
    }

    if (hideEnemy && !isMyNoteAuto && !isTwoPlayer) {
        note.visible = false;
    } else {
        note.visible = true;
    }

    this.syncNotePosition(note, distance, isDownscroll);
  });
};