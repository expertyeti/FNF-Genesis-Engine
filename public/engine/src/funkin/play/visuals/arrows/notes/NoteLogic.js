// src/funkin/play/visuals/arrows/notes/NoteLogic.js
window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.notes = funkin.play.visuals.arrows.notes || {};

class NotesManager {
    constructor(scene, strumlines) {
        this.scene = scene;
        this.strumlines = strumlines;
        this.notes = [];
        this.noteDataQueue = []; 
        this.queueIndex = 0; // d vdd esto evita el shift()
        this.lastSongPos = 0;
        this.globalYOffset = 0;

        // objetos reusables (zero-allocation runtime)
        this.hitEventData = { pressed: true, ms: 0, absMs: 0, judgment: "perfect", score: 0, direction: 0, isPlayer: false, isAuto: false, note: null };
        this.missEventData = { pressed: true, ms: 0, absMs: 0, judgment: "miss", score: -10, direction: 0, isPlayer: false, isAuto: false, note: null };
        this.ghostEventData = { direction: 0, isPlayer: false };

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
                const listeners = funkin.playNotes._listeners[eventName];
                if (listeners) {
                    for (let i = 0; i < listeners.length; i++) listeners[i](data);
                }
                for (let i = 0; i < funkin.playNotes._globalListeners.length; i++) {
                    funkin.playNotes._globalListeners[i](eventName, data);
                }
            },
            get: {
                all: () => this.notes,
                byLane: (laneIndex, isPlayer) => {
                    const res = [];
                    for (let i = 0; i < this.notes.length; i++) {
                        const n = this.notes[i];
                        if (n && n.scene && n.lane === laneIndex && n.isPlayer === isPlayer && n.active) res.push(n);
                    }
                    return res;
                },
                upcoming: (isPlayer = true, timeWindowMs = 1500) => {
                    const currentPos = funkin.conductor?.songPosition ?? 0;
                    const res = [];
                    for (let i = 0; i < this.notes.length; i++) {
                        const n = this.notes[i];
                        if (n && n.scene && n.isPlayer === isPlayer && n.active && n.noteTime >= currentPos && n.noteTime <= currentPos + timeWindowMs) res.push(n);
                    }
                    return res;
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
        const isTimeJumping = songPos - (this.lastSongPos ?? songPos) > 300 || isRewinding;
        this.lastSongPos = songPos;

        if (isRewinding) return this.recreateAllNotes();

        const chartSpeed = funkin.play?.chart?.get("metadata.scrollSpeed") ?? funkin.play?.chart?.get("metadata.speed");
        if (chartSpeed !== undefined) this.scrollSpeed = chartSpeed;

        const screenHeight = this.scene.scale?.height || 720;
        const spawnDistance = screenHeight * 1.5; 
        const spawnWindow = spawnDistance / (0.45 * (this.scrollSpeed || 1)); 

        if (this.noteDataQueue && this.noteDataQueue.length > 0) {
            while (this.queueIndex < this.noteDataQueue.length && (this.noteDataQueue[this.queueIndex].noteTime - songPos) <= spawnWindow) {
                const data = this.noteDataQueue[this.queueIndex];
                const spawner = funkin.play.visuals.arrows.ArrowsSpawner;
                if (spawner && spawner.spawnNoteFromPool) {
                    spawner.spawnNoteFromPool(this.scene, this, data);
                }
                this.queueIndex++;
            }
        }

        if (this.notes.length === 0 && (!this.noteDataQueue || this.queueIndex >= this.noteDataQueue.length)) return;

        this.processHitDetection(songPos, playAsOpponent, time);
        this.updateMovement(songPos, playAsOpponent, isTimeJumping, time);
    }

    removeNoteFromGame(note, arrayIndex) {
        if (arrayIndex !== undefined && arrayIndex >= 0) {
            this.notes.splice(arrayIndex, 1);
        } else {
            const idx = this.notes.indexOf(note);
            if (idx !== -1) this.notes.splice(idx, 1);
        }
        
        if (this.notePool && this.notePool.scene) {
            this.notePool.killAndHide(note);
            note.active = false;
        } else {
            note.destroy?.();
        }
    }

    recreateAllNotes() {
        for (let i = 0; i < this.notes.length; i++) {
            const note = this.notes[i];
            if (note) {
                if (note.anims) note.stop();
                if (this.notePool && this.notePool.scene) {
                    this.notePool.killAndHide(note);
                    note.active = false;
                } else {
                    note.destroy?.();
                }
            }
        }
        
        this.notes = [];
        this.noteDataQueue = [];
        this.queueIndex = 0;

        funkin.play.visuals?.arrows?.ArrowsSpawner?.spawnChartNotes?.(this.scene, this);
        this.skin.reloadSkin(); 
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
                    this.removeNoteFromGame(note, i);
                }
                continue;
            }

            note.visible = !(hideEnemy && !isMyNoteAuto && !isTwoPlayer);
            this.syncNotePosition(note, distance, isDownscroll);
        }
    }

    executeAutoHitFallback(note, timeDiff, isTimeJumping, time, isMyNoteAuto, arrayIndex) {
        if (!isTimeJumping) this.strumlines?.playConfirm?.(note.lane, note.isPlayer, time, note.length || 150);

        const absMs = timeDiff < 0 ? -timeDiff : timeDiff;
        
        this.hitEventData.pressed = true;
        this.hitEventData.ms = timeDiff;
        this.hitEventData.absMs = absMs;
        this.hitEventData.judgment = "perfect";
        this.hitEventData.score = isMyNoteAuto ? 500 : 0;
        this.hitEventData.direction = note.lane;
        this.hitEventData.isPlayer = note.isPlayer;
        this.hitEventData.isAuto = true;
        this.hitEventData.note = note;

        if (funkin.playNotes) {
            funkin.playNotes.lastHit = this.hitEventData;
            funkin.playNotes.emit("noteHit", this.hitEventData);
        }
        
        this.scene?.events?.emit("noteHit", this.hitEventData);
        if (isMyNoteAuto) navigator?.vibrate?.(15);

        this.removeNoteFromGame(note, arrayIndex);
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

        if (isTwoPlayer) { 
            this._processSideHits(true, this.prevKeysP1, this.strumlines?.keyStates?.player, songPos, time, ghostTappingEnabled); 
            this._processSideHits(false, this.prevKeysP2, this.strumlines?.keyStates?.opponent, songPos, time, ghostTappingEnabled); 
        } else {
            this._processSideHits(!playAsOpponent, this.prevKeysP1, !playAsOpponent ? this.strumlines?.keyStates?.player : this.strumlines?.keyStates?.opponent, songPos, time, ghostTappingEnabled);
        }
    }

    _processSideHits(isMySide, prevKeys, currentKeys, songPos, time, ghostTappingEnabled) {
        if (!currentKeys) return;

        for (let lane = 0; lane < this.keyCount; lane++) {
            if (currentKeys[lane] && !prevKeys[lane]) {
                let closestNote = null, closestTime = 166, closestIndex = -1;

                for (let i = 0; i < this.notes.length; i++) {
                    const n = this.notes[i];
                    if (n && n.scene && n.active && n.isPlayer === isMySide && n.lane === lane && !n.wasHit && !n.hasMissed) {
                        const diff = n.noteTime - songPos;
                        const absDiff = diff < 0 ? -diff : diff;

                        if (absDiff <= 166.0 && absDiff < (closestTime < 0 ? -closestTime : closestTime)) {
                            closestNote = n; closestTime = diff; closestIndex = i;
                        }
                    }
                }

                if (closestNote) {
                    this.registerHit(closestNote, closestTime, lane, time, closestIndex);
                } else if (!ghostTappingEnabled) {
                    this.registerMiss(isMySide, lane);
                } else if (funkin.playNotes) {
                    this.ghostEventData.direction = lane;
                    this.ghostEventData.isPlayer = isMySide;
                    funkin.playNotes.emit("directionPressed", this.ghostEventData);
                }
            }
            prevKeys[lane] = currentKeys[lane];
        }
    }

    registerHit(closestNote, closestTime, lane, time, arrayIndex) {
        const absMs = closestTime < 0 ? -closestTime : closestTime;
        const judgment = absMs <= 5.0 ? "perfect" : absMs <= 45.0 ? "sick" : absMs <= 90.0 ? "good" : absMs <= 135.0 ? "bad" : "shit";
        const score = absMs <= 5.0 ? 500 : absMs <= 45.0 ? 350 : absMs <= 90.0 ? 200 : absMs <= 135.0 ? 100 : 50;

        this.hitEventData.pressed = true;
        this.hitEventData.ms = closestTime;
        this.hitEventData.absMs = absMs;
        this.hitEventData.judgment = judgment;
        this.hitEventData.score = score;
        this.hitEventData.direction = lane;
        this.hitEventData.isPlayer = closestNote.isPlayer;
        this.hitEventData.isAuto = false;
        this.hitEventData.note = closestNote;

        if (funkin.playNotes) {
            funkin.playNotes.lastHit = this.hitEventData;
            funkin.playNotes.emit("noteHit", this.hitEventData);
        }

        this.scene?.events?.emit("noteHit", this.hitEventData);
        navigator?.vibrate?.(15);
        this.strumlines?.playConfirm?.(lane, closestNote.isPlayer, time, 150);

        this.removeNoteFromGame(closestNote, arrayIndex);
    }

    registerMiss(isPlayerSide, lane) {
        this.missEventData.pressed = true;
        this.missEventData.ms = 0;
        this.missEventData.absMs = 0;
        this.missEventData.judgment = "miss";
        this.missEventData.score = -10;
        this.missEventData.direction = lane;
        this.missEventData.isPlayer = isPlayerSide;
        this.missEventData.isAuto = false;
        this.missEventData.note = null;

        if (funkin.playNotes) {
            funkin.playNotes.lastHit = this.missEventData;
            funkin.playNotes.emit("noteMiss", this.missEventData);
        }
        this.scene?.events?.emit("noteMiss", this.missEventData);
        this.playMissSound(isPlayerSide);
    }

    playMissSound(isPlayerSide) {
        const getOpt = (key) => funkin.play?.options?.[key] ?? (() => { try { return localStorage.getItem(`fnf_${key}`) === "true"; } catch { return false; } })();
        const targetScene = this.scene || window.funkin.playScene || window.funkin.game?.scene?.scenes.find(s => s.sys.isActive() && s.sound);
        if (!targetScene?.sound) return;

        if (getOpt("twoPlayerLocal") || isPlayerSide) {
            const missKey = `missnote${Phaser.Math.Between(1, 3)}`;
            
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
        
        for (let i = 0; i < this.notes.length; i++) {
            const note = this.notes[i];
            if (note && note.active) {
                if (note.anims) note.stop();
                if (this.notePool) this.notePool.killAndHide(note);
                else note.destroy?.();
            }
        }
        
        if (this.notePool && this.notePool.scene) {
            this.notePool.destroy(true, true);
            this.notePool = null;
        }
        
        this.notes = [];
        this.noteDataQueue = [];
        this.queueIndex = 0;
        this.destroyAPI();
    }
}
funkin.play.visuals.arrows.notes.NotesManager = NotesManager;