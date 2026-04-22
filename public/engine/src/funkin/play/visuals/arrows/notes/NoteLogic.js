window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.notes = funkin.play.visuals.arrows.notes || {};

/**
 * Gestor principal de notas. Controla la instanciación, movimiento, colisiones y la recreación al reiniciar/retroceder.
 */
class NotesManager {
    constructor(scene, strumlines) {
        this.scene = scene;
        this.strumlines = strumlines;
        this.notes = [];
        this.lastSongPos = 0;
        this.globalYOffset = 0;

        const chart = funkin.play?.chart;
        this.scrollSpeed = chart?.get("base.scrollSpeed") ?? chart?.get("metadata.scrollSpeed") ?? chart?.get("metadata.speed") ?? 1.0;

        const NoteDir = funkin.play.visuals.arrows.notes.NoteDirection || window.funkin.NoteDirection;
        this.keyCount = NoteDir?.keyCount ?? 4;
        
        this.prevKeysP1 = new Array(this.keyCount).fill(false);
        this.prevKeysP2 = new Array(this.keyCount).fill(false);

        this.initAPI();
        
        this.skin = new funkin.play.visuals.arrows.notes.NoteSkin(this);
        this.scene.events?.on("ui_skin_changed", () => this.skin.reloadSkin(), this);
    }

    initAPI() {
        const existingListeners = funkin.playNotes?._listeners ?? {};
        const existingGlobals = funkin.playNotes?._globalListeners ?? [];

        funkin.playNotes = {
            _listeners: existingListeners,
            _globalListeners: existingGlobals,
            lastHit: { pressed: false, ms: 0, absMs: 0, judgment: null, score: 0 },
            subscribeEvents: (callback) => funkin.playNotes._globalListeners.push(callback),
            event: (eventName, callback) => {
                if (!funkin.playNotes._listeners[eventName]) funkin.playNotes._listeners[eventName] = [];
                funkin.playNotes._listeners[eventName].push(callback);
            },
            emit: (eventName, data) => {
                funkin.playNotes._listeners[eventName]?.forEach(cb => cb(data));
                funkin.playNotes._globalListeners.forEach(cb => cb(eventName, data));
            },
            get: {
                all: () => this.notes,
                byLane: (laneIndex, isPlayer) => this.notes.filter(n => n?.scene && n.lane === laneIndex && n.isPlayer === isPlayer && n.active),
                upcoming: (isPlayer = true, timeWindowMs = 1500) => {
                    const currentPos = funkin.conductor?.songPosition ?? 0;
                    return this.notes.filter(n => n?.scene && n.isPlayer === isPlayer && n.active && n.noteTime >= currentPos && n.noteTime <= currentPos + timeWindowMs);
                }
            }
        };

        funkin.playNotes.event("inject_note", (noteData) => this.skin.injectNote(noteData));
    }

    destroyAPI() {
        if (funkin.playNotes) {
            funkin.playNotes._listeners = {};
            funkin.playNotes._globalListeners = [];
        }
    }

    update(time, delta) {
        if (!funkin.conductor) return;

        const songPos = funkin.conductor.songPosition;
        const opts = funkin.play?.options;
        const playAsOpponent = opts?.playAsOpponent === true;

        if (opts?.middlescroll === "mobile" && this.scene.hitbox?.visible !== false) {
            this.scene.hitbox?.setVisible ? this.scene.hitbox.setVisible(false) : (this.scene.hitbox.visible = false);
        }

        const isRewinding = songPos < (this.lastSongPos - 300);
        const isTimeJumping = Math.abs(songPos - (this.lastSongPos ?? songPos)) > 300;
        this.lastSongPos = songPos;

        if (isRewinding) return this.recreateAllNotes();
        if (this.notes.length === 0) return;

        const chartSpeed = funkin.play?.chart?.get("metadata.scrollSpeed") ?? funkin.play?.chart?.get("metadata.speed");
        if (chartSpeed !== undefined) this.scrollSpeed = chartSpeed;

        this.processHitDetection(songPos, playAsOpponent, time);
        this.updateMovement(songPos, playAsOpponent, isTimeJumping, time);
    }

    recreateAllNotes() {
        for (let i = this.notes.length - 1; i >= 0; i--) {
            if (this.notes[i]) {
                this.notes[i].stop?.();
                this.notes[i].destroy?.();
            }
        }
        this.notes = [];

        funkin.play.visuals?.arrows?.ArrowsSpawner?.spawnChartNotes?.(this.scene, this);
        this.skin.reloadSkin(); // OBLIGATORIO para aplicar la skin a las notas recién recreadas.
    }

    updateMovement(songPos, playAsOpponent, isTimeJumping, time) {
        const opts = funkin.play?.options;
        const globalDownscroll = opts?.downscroll === true;
        const hideEnemy = opts?.hideOpponentNotes === true;
        const isTwoPlayer = opts?.twoPlayerLocal === true;
        const isArrowScheduleActive = window.funkin?.mobile && !window.funkin?.isKeyboardActive && opts?.mobileSchedule === "arrow";
        
        const BotPlayClass = window.BotPlay || funkin.play.visuals.arrows?.BotPlay;

        for (let i = this.notes.length - 1; i >= 0; i--) {
            const note = this.notes[i];
            
            if (!note?.scene || (!note.active && !note.hasMissed)) continue;

            const timeDiff = note.noteTime - songPos;
            const distance = timeDiff * 0.45 * this.scrollSpeed;
            const isNotePlayer = note.pType === "pl" || note.isPlayer === true;
            const isMyNoteAuto = (playAsOpponent && !isTwoPlayer) ? !isNotePlayer : isNotePlayer;
            
            const isAutoHit = isTwoPlayer ? window.autoplay : (!isMyNoteAuto || (isMyNoteAuto && window.autoplay));
            const isDownscroll = isArrowScheduleActive ? isMyNoteAuto : globalDownscroll;

            if (isAutoHit && timeDiff <= 0 && !note.wasHit && !note.hasMissed) {
                if (BotPlayClass?.executeAutoHit) BotPlayClass.executeAutoHit(note, timeDiff, isTimeJumping, time, isMyNoteAuto, this, i);
                else this.executeAutoHitFallback(note, timeDiff, isTimeJumping, time, isMyNoteAuto, i);
                continue; 
            }
            
            if ((isMyNoteAuto || isTwoPlayer) && timeDiff < -166.0 && !note.hasMissed && !note.wasHit) {
                this.executeLateMiss(note);
                continue;
            }

            if (distance > 5000 || distance < -2000) {
                note.visible = false;
                if (distance < -2000) {
                    this.notes.splice(i, 1);
                    note.destroy?.();
                }
                continue;
            }

            note.visible = !(hideEnemy && !isMyNoteAuto && !isTwoPlayer);
            this.syncNotePosition(note, distance, isDownscroll);
        }
    }

    executeAutoHitFallback(note, timeDiff, isTimeJumping, time, isMyNoteAuto, arrayIndex) {
        if (!isTimeJumping) this.strumlines?.playConfirm?.(note.lane, note.isPlayer, time, note.length || 150);

        const hitData = { pressed: true, ms: timeDiff, absMs: Math.abs(timeDiff), judgment: "perfect", score: isMyNoteAuto ? 500 : 0, direction: note.lane, isPlayer: note.isPlayer, isAuto: true, note };

        if (funkin.playNotes) {
            funkin.playNotes.lastHit = hitData;
            funkin.playNotes.emit("noteHit", hitData);
        }
        
        this.scene?.events?.emit("noteHit", hitData);
        if (isMyNoteAuto) navigator?.vibrate?.(15);

        if (arrayIndex !== undefined && arrayIndex >= 0) this.notes.splice(arrayIndex, 1);
        else {
            const idx = this.notes.indexOf(note);
            if (idx !== -1) this.notes.splice(idx, 1);
        }
        note.destroy?.();
    }

    syncNotePosition(note, distance, fallbackDownscroll) {
        if (!note?.scene) return;

        const isPlayer = note.pType === "pl" || note.isPlayer === true;
        const targetStrums = isPlayer ? this.strumlines?.playerStrums : this.strumlines?.opponentStrums;
        const strum = targetStrums?.[note.lane];

        let strumCenterX, strumCenterY;
        let relativeScale = 1.0;
        let isDownscroll = fallbackDownscroll;

        if (strum) {
            relativeScale = (strum.scaleX) / (strum.baseScale || 1.0);
            isDownscroll = strum.downscroll ?? strum.isDownscroll ?? fallbackDownscroll;

            const activeWidth = strum.currentAction !== "static" ? (strum.lastStaticWidth ?? strum.displayWidth) : (strum.lastStaticWidth = strum.displayWidth);
            const activeHeight = strum.currentAction !== "static" ? (strum.lastStaticHeight ?? strum.displayHeight) : (strum.lastStaticHeight = strum.displayHeight);

            strumCenterX = strum.baseX + activeWidth * (0.5 - (strum.originX ?? 0.5));
            strumCenterY = strum.baseY + activeHeight * (0.5 - (strum.originY ?? 0.5));
            
            if (!note.hasMissed && !note.wasHit) note.setAlpha(strum.alpha * note.baseAlpha);
        } else {
            const RialNotes = funkin.play.visuals.arrows.notes.RialNotes;
            strumCenterX = (RialNotes?.getXPosition?.(note.lane, isPlayer, this.strumlines) ?? 0) + 56;
            strumCenterY = (RialNotes?.getYPosition?.(note.lane, isPlayer, this.strumlines) ?? 0) + 56;
        }

        note.setScale(note.baseScale * relativeScale);
        const finalX = strumCenterX - note.displayWidth * (0.5 - (note.originX ?? 0.5)) + (note.skinOffset[0] || 0) * relativeScale;
        const finalY = strumCenterY - note.displayHeight * (0.5 - (note.originY ?? 0.5)) + (isDownscroll ? -distance : distance) + (note.skinOffset[1] || 0) * relativeScale + this.globalYOffset;

        if (!isNaN(finalX) && !isNaN(finalY)) note.setPosition(Math.round(finalX), Math.round(finalY));
    }

    processHitDetection(songPos, playAsOpponent, time) {
        if (funkin.CountDown?.isInCountdown || window.autoplay) return;

        const opts = funkin.play?.options;
        const isTwoPlayer = opts?.twoPlayerLocal === true;
        const ghostTappingEnabled = opts?.ghostTapping !== false;

        const controls = window.funkin.controls;
        if (controls) {
            if (isTwoPlayer && !controls.isTwoPlayerSplit) controls.applyTwoPlayerSplit();
            else if (!isTwoPlayer && controls.isTwoPlayerSplit) controls.restoreBinds();
        }

        const kb = this.scene?.input?.keyboard;
        if (kb && kb.addKey(17).isDown && kb.addKey(16).isDown && kb.addKey(18).isDown) return;

        const processSideHits = (isMySide, prevKeys) => {
            const currentKeys = isMySide ? this.strumlines?.keyStates?.player : this.strumlines?.keyStates?.opponent;
            if (!currentKeys) return;

            for (let lane = 0; lane < this.keyCount; lane++) {
                if (currentKeys[lane] && !prevKeys[lane]) {
                    let closestNote = null, closestTime = 166, closestIndex = -1;

                    for (let i = 0; i < this.notes.length; i++) {
                        const n = this.notes[i];
                        if (n?.scene && n.active && n.isPlayer === isMySide && n.lane === lane && !n.wasHit && !n.hasMissed) {
                            const diff = n.noteTime - songPos;
                            if (Math.abs(diff) <= 166.0 && Math.abs(diff) < Math.abs(closestTime)) {
                                closestNote = n; closestTime = diff; closestIndex = i;
                            }
                        }
                    }

                    if (closestNote) this.registerHit(closestNote, closestTime, lane, time, closestIndex);
                    else if (!ghostTappingEnabled) this.registerMiss(isMySide, lane);
                    else funkin.playNotes?.emit("directionPressed", { direction: lane, isPlayer: isMySide });
                }
                prevKeys[lane] = currentKeys[lane];
            }
        };

        if (isTwoPlayer) { processSideHits(true, this.prevKeysP1); processSideHits(false, this.prevKeysP2); } 
        else processSideHits(!playAsOpponent, this.prevKeysP1);
    }

    registerHit(closestNote, closestTime, lane, time, arrayIndex) {
        const absMs = Math.abs(closestTime);
        const judgment = absMs <= 5.0 ? "perfect" : absMs <= 45.0 ? "sick" : absMs <= 90.0 ? "good" : absMs <= 135.0 ? "bad" : "shit";
        const score = absMs <= 5.0 ? 500 : absMs <= 45.0 ? 350 : absMs <= 90.0 ? 200 : absMs <= 135.0 ? 100 : 50;

        const hitData = { pressed: true, ms: closestTime, absMs, judgment, score, direction: lane, isPlayer: closestNote.isPlayer, isAuto: false, note: closestNote };

        if (funkin.playNotes) {
            funkin.playNotes.lastHit = hitData;
            funkin.playNotes.emit("noteHit", hitData);
        }

        this.scene?.events?.emit("noteHit", hitData);
        navigator?.vibrate?.(15);
        this.strumlines?.playConfirm?.(lane, closestNote.isPlayer, time, 150);

        if (arrayIndex !== undefined && arrayIndex >= 0) this.notes.splice(arrayIndex, 1);
        else {
            const idx = this.notes.indexOf(closestNote);
            if (idx !== -1) this.notes.splice(idx, 1);
        }
        closestNote.destroy?.();
    }

    registerMiss(isPlayerSide, lane) {
        const missData = { pressed: true, ms: 0, absMs: 0, judgment: "miss", score: -10, direction: lane, isPlayer: isPlayerSide, isAuto: false };
        if (funkin.playNotes) {
            funkin.playNotes.lastHit = missData;
            funkin.playNotes.emit("noteMiss", missData);
        }
        this.scene?.events?.emit("noteMiss", missData);
        this.playMissSound(isPlayerSide);
    }

    playMissSound(isPlayerSide) {
        const getOpt = (key) => funkin.play?.options?.[key] ?? (() => { try { return localStorage.getItem(`fnf_${key}`) === "true"; } catch { return false; } })();
        const targetScene = this.scene || window.funkin.playScene || window.funkin.game?.scene?.scenes.find(s => s.sys.isActive() && s.sound);
        if (!targetScene?.sound) return;

        if (getOpt("twoPlayerLocal") || isPlayerSide) {
            const missKey = `missnote${Phaser.Math.Between(1, 3)}`;
            
            // CORRECCIÓN: Se cambió a .exists() que es el método nativo correcto de Phaser para verificar audios en la caché
            if (targetScene.cache.audio.exists(missKey)) targetScene.sound.play(missKey, { volume: 0.6 });
            else if (targetScene.cache.audio.exists("missnote1")) targetScene.sound.play("missnote1", { volume: 0.6 });
            else if (!targetScene.sys.isLoadingEmergencyMiss) {
                targetScene.sys.isLoadingEmergencyMiss = true;
                targetScene.load.audio(missKey, `${window.BASE_URL || ""}assets/sounds/miss/${missKey}.ogg`);
                targetScene.load.once(`filecomplete-audio-${missKey}`, () => {
                    targetScene.sound.play(missKey, { volume: 0.6 });
                    targetScene.sys.isLoadingEmergencyMiss = false;
                });
                targetScene.load.once('loaderror', () => targetScene.sys.isLoadingEmergencyMiss = false);
                targetScene.load.start();
            }
        }
    }

    executeLateMiss(note) {
        note.hasMissed = true;
        note.alpha = note.baseAlpha * 0.3; 
        this.registerMiss(note.isPlayer, note.lane);
    }

    destroy() {
        this.scene?.events?.off("ui_skin_changed", this.skin.reloadSkin, this);
        this.notes.forEach(note => { if (note?.active) { note.stop?.(); note.destroy?.(); } });
        this.notes = [];
        this.destroyAPI();
    }
}
funkin.play.visuals.arrows.notes.NotesManager = NotesManager;