/**
 * @file NoteLogic.js
 * Unificación total: Manager, API y Lógica de movimiento en una sola clase (NotesManager).
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.notes = funkin.play.visuals.arrows.notes || {};

// ============================================================================
// CLASE ÚNICA: NOTES MANAGER
// ============================================================================
class NotesManager {
    constructor(scene, strumlines) {
        this.scene = scene;
        this.strumlines = strumlines;
        this.notes = [];
        this.scrollSpeed = 1.0; 
        this.lastSongPos = 0; 
        this.globalYOffset = 0;

        if (funkin.play && funkin.play.chart) {
            const initialSpeed = funkin.play.chart.get("base.scrollSpeed") || funkin.play.chart.get("metadata.scrollSpeed") || funkin.play.chart.get("metadata.speed");
            if (initialSpeed !== undefined && initialSpeed !== null) {
                this.scrollSpeed = initialSpeed;
            }
        }

        const NoteDir = funkin.play.visuals.arrows.notes.NoteDirection || window.funkin.NoteDirection;
        this.keyCount = NoteDir ? NoteDir.keyCount : 4;
        
        this.prevKeysP1 = new Array(this.keyCount).fill(false);
        this.prevKeysP2 = new Array(this.keyCount).fill(false);

        this.initAPI();
        
        this.skin = new funkin.play.visuals.arrows.notes.NoteSkin(this);
        this.scene.events.on("ui_skin_changed", () => this.skin.reloadSkin(), this);
    }

    initAPI() {
        const self = this;
        const existingListeners = funkin.playNotes ? funkin.playNotes._listeners : {};
        const existingGlobals = funkin.playNotes ? funkin.playNotes._globalListeners : [];

        funkin.playNotes = {
            _listeners: existingListeners,
            _globalListeners: existingGlobals,
            lastHit: { pressed: false, ms: 0, absMs: 0, judgment: null, score: 0 },
            subscribeEvents: function (callback) {
                this._globalListeners.push(callback);
            },
            event: function (eventName, callback) {
                if (!this._listeners[eventName]) this._listeners[eventName] = [];
                this._listeners[eventName].push(callback);
            },
            emit: function (eventName, data) {
                if (this._listeners[eventName]) {
                    this._listeners[eventName].forEach((cb) => cb(data));
                }
                this._globalListeners.forEach((cb) => cb(eventName, data));
            },
            get: {
                all: () => self.notes,
                byLane: (laneIndex, isPlayer) =>
                    self.notes.filter((n) => n && n.scene && n.lane === laneIndex && n.isPlayer === isPlayer && n.active),
                upcoming: (isPlayer = true, timeWindowMs = 1500) => {
                    if (!funkin.conductor) return [];
                    const currentPos = funkin.conductor.songPosition;
                    return self.notes.filter(
                        (n) => n && n.scene && n.isPlayer === isPlayer && n.active &&
                               n.noteTime >= currentPos && n.noteTime <= currentPos + timeWindowMs
                    );
                },
            },
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
        if (!funkin.conductor || this.notes.length === 0) return;

        const songPos = funkin.conductor.songPosition;
        const playAsOpponent = funkin.play.options && funkin.play.options.playAsOpponent;
        const isMobileMode = funkin.play.options && funkin.play.options.middlescroll === "mobile";

        if (isMobileMode && this.scene.hitbox && this.scene.hitbox.visible !== false) {
            if (typeof this.scene.hitbox.setVisible === "function") this.scene.hitbox.setVisible(false);
            else this.scene.hitbox.visible = false;
        }

        let isTimeJumping = false;
        if (this.lastSongPos !== undefined) {
            if (Math.abs(songPos - this.lastSongPos) > 300) isTimeJumping = true;
        }
        this.lastSongPos = songPos;

        if (funkin.play && funkin.play.chart) {
            const chartSpeed = funkin.play.chart.get("metadata.scrollSpeed") || funkin.play.chart.get("metadata.speed");
            if (chartSpeed !== undefined && chartSpeed !== null) {
                this.scrollSpeed = chartSpeed;
            }
        }

        this.handleRewind(songPos);
        this.processHitDetection(songPos, playAsOpponent, time);
        this.updateMovement(songPos, playAsOpponent, isTimeJumping, time);
    }

    updateMovement(songPos, playAsOpponent, isTimeJumping, time) {
        const getStoredOption = (key) => {
            if (funkin.play && funkin.play.options && funkin.play.options[key] !== undefined) return funkin.play.options[key];
            return false;
        };

        const globalDownscroll = getStoredOption("downscroll") === true;
        const hideEnemy = getStoredOption("hideOpponentNotes") === true;
        const isTwoPlayer = getStoredOption("twoPlayerLocal") === true;
        const schedule = getStoredOption("mobileSchedule");
        const isArrowScheduleActive = window.funkin.mobile && !window.funkin.isKeyboardActive && schedule === "arrow";
        const isRewinding = this.scene && this.scene.isRewinding;
        
        const BotPlayClass = window.BotPlay || (funkin.play.visuals.arrows && funkin.play.visuals.arrows.BotPlay);

        for (let i = this.notes.length - 1; i >= 0; i--) {
            const note = this.notes[i];
            
            if (!note || !note.scene || isRewinding) continue;
            if (!note.active && !note.hasMissed) continue; 

            const timeDiff = note.noteTime - songPos;
            const distance = timeDiff * 0.45 * this.scrollSpeed;
            
            const isNotePlayer = note.pType === "pl" || note.isPlayer === true;
            const isMyNoteAuto = (playAsOpponent && !isTwoPlayer) ? !isNotePlayer : isNotePlayer;
            
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
                    if (BotPlayClass && typeof BotPlayClass.executeAutoHit === 'function') {
                        BotPlayClass.executeAutoHit(note, timeDiff, isTimeJumping, time, isMyNoteAuto, this, i);
                    } else {
                        this.executeAutoHitFallback(note, timeDiff, isTimeJumping, time, isMyNoteAuto, i);
                    }
                    continue; 
                }
                
                if ((isMyNoteAuto || isTwoPlayer) && timeDiff < -166.0 && !note.hasMissed && !note.wasHit) {
                    this.executeLateMiss(note, timeDiff, isTimeJumping, isMyNoteAuto);
                    continue;
                }
            }

            if (distance > 5000 || distance < -2000) {
                note.visible = false;
                if (distance < -2000 && !isRewinding) {
                    this.notes.splice(i, 1);
                    if (note.destroy) note.destroy();
                }
                continue;
            }

            note.visible = !(hideEnemy && !isMyNoteAuto && !isTwoPlayer);
            this.syncNotePosition(note, distance, isDownscroll);
        }
    }

    executeAutoHitFallback(note, timeDiff, isTimeJumping, time, isMyNoteAuto, arrayIndex) {
        note.wasHit = true;
        note.active = false;
        note.visible = false;
        note.alpha = 0;

        if (!isTimeJumping && this.strumlines && typeof this.strumlines.playConfirm === 'function') {
            const extraTime = note.length && note.length > 0 ? note.length : 150;
            this.strumlines.playConfirm(note.lane, note.isPlayer, time, extraTime);
        }

        const hitData = {
            pressed: true, ms: timeDiff, absMs: Math.abs(timeDiff), judgment: "perfect", 
            score: isMyNoteAuto ? 500 : 0, direction: note.lane, isPlayer: note.isPlayer, isAuto: true, note: note
        };

        if (funkin.playNotes && typeof funkin.playNotes.emit === 'function') {
            funkin.playNotes.lastHit = hitData;
            funkin.playNotes.emit("noteHit", hitData);
        }
        
        // EMITIR SEÑAL GLOBAL PARA EL CHARACTER RENDERER Y OTROS COMPONENTES
        if (this.scene && this.scene.events) {
            this.scene.events.emit("noteHit", hitData);
        }

        if (isMyNoteAuto && typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(15);
        }

        if (arrayIndex !== undefined && arrayIndex >= 0) {
            this.notes.splice(arrayIndex, 1);
        }
        if (note.destroy) note.destroy();
    }

    syncNotePosition(note, distance, fallbackDownscroll) {
        if (!note || !note.scene) return;

        let strumScale = 1.0;
        let strumBaseScale = 1.0;
        let strumAlpha = 1.0;
        let strumCenterX = 0;
        let strumCenterY = 0;
        let isDownscroll = fallbackDownscroll;

        const isPlayer = note.pType === "pl" || note.isPlayer === true;
        const targetStrums = isPlayer ? this.strumlines.playerStrums : this.strumlines.opponentStrums;

        if (targetStrums && targetStrums[note.lane]) {
            const strum = targetStrums[note.lane];
            strumScale = strum.scaleX;
            strumBaseScale = strum.baseScale || 1.0;
            strumAlpha = strum.alpha;

            if (strum.downscroll !== undefined) isDownscroll = strum.downscroll;
            else if (strum.isDownscroll !== undefined) isDownscroll = strum.isDownscroll;

            const originX = strum.originX !== undefined ? strum.originX : 0.5;
            const originY = strum.originY !== undefined ? strum.originY : 0.5;

            if (strum.currentAction !== "static" && strum.lastStaticWidth) {
                strumCenterX = strum.baseX + strum.lastStaticWidth * (0.5 - originX);
                strumCenterY = strum.baseY + strum.lastStaticHeight * (0.5 - originY);
            } else {
                strum.lastStaticWidth = strum.displayWidth;
                strum.lastStaticHeight = strum.displayHeight;
                strumCenterX = strum.baseX + strum.displayWidth * (0.5 - originX);
                strumCenterY = strum.baseY + strum.displayHeight * (0.5 - originY);
            }
        } else {
            const fallbackX = funkin.play.visuals.arrows.notes.RialNotes.getXPosition(note.lane, isPlayer, this.strumlines);
            const fallbackY = funkin.play.visuals.arrows.notes.RialNotes.getYPosition(note.lane, isPlayer, this.strumlines);
            strumCenterX = fallbackX + 56;
            strumCenterY = fallbackY + 56;
        }

        const relativeScale = strumScale / strumBaseScale;
        note.setScale(note.baseScale * relativeScale);
        
        if (!note.hasMissed && !note.wasHit) {
            note.setAlpha(strumAlpha * note.baseAlpha);
        }

        const noteOriginX = note.originX !== undefined ? note.originX : 0.5;
        const noteOriginY = note.originY !== undefined ? note.originY : 0.5;

        const finalX = strumCenterX - note.displayWidth * (0.5 - noteOriginX) + (note.skinOffset[0] || 0) * relativeScale;
        const finalY = strumCenterY - note.displayHeight * (0.5 - noteOriginY) + (isDownscroll ? -distance : distance) + (note.skinOffset[1] || 0) * relativeScale + this.globalYOffset;

        if (!isNaN(finalX) && !isNaN(finalY)) {
            note.x = Math.round(finalX);
            note.y = Math.round(finalY);
        }
    }

    processHitDetection(songPos, playAsOpponent, time) {
        const getStoredOption = (key) => {
            if (funkin.play && funkin.play.options && funkin.play.options[key] !== undefined) return funkin.play.options[key];
            return false;
        };

        const isTwoPlayer = getStoredOption("twoPlayerLocal") === true;
        const isCountdown = funkin.CountDown && funkin.CountDown.isInCountdown;
        
        if (isCountdown || window.autoplay) return;

        if (window.funkin.controls) {
            if (isTwoPlayer && !window.funkin.controls.isTwoPlayerSplit) {
                window.funkin.controls.applyTwoPlayerSplit();
            } else if (!isTwoPlayer && window.funkin.controls.isTwoPlayerSplit) {
                window.funkin.controls.restoreBinds();
            }
        }

        if (this.scene && this.scene.input && this.scene.input.keyboard) {
            const kb = this.scene.input.keyboard;
            if (kb.addKey(17).isDown && kb.addKey(16).isDown && kb.addKey(18).isDown) return;
        }

        const ghostTappingEnabled = getStoredOption("ghostTapping") !== false; 

        const processSideHits = (isMySide, prevKeysObj) => {
            if(!this.strumlines || !this.strumlines.keyStates) return;
            const currentKeys = isMySide ? this.strumlines.keyStates.player : this.strumlines.keyStates.opponent;

            for (let lane = 0; lane < this.keyCount; lane++) {
                if (currentKeys[lane] && !prevKeysObj[lane]) {
                    let closestNote = null;
                    let closestTime = 166;
                    let closestIndex = -1;

                    for (let i = 0; i < this.notes.length; i++) {
                        const n = this.notes[i];
                        if (n && n.scene && n.active && n.isPlayer === isMySide && n.lane === lane && !n.wasHit && !n.hasMissed) {
                            const diff = n.noteTime - songPos;
                            if (Math.abs(diff) <= 166.0 && Math.abs(diff) < Math.abs(closestTime)) {
                                closestNote = n;
                                closestTime = diff;
                                closestIndex = i;
                            }
                        }
                    }

                    if (closestNote) {
                        this.registerHit(closestNote, closestTime, lane, time, closestIndex);
                    } else {
                        if (!ghostTappingEnabled) {
                            this.registerMiss(isMySide, lane);
                        } else {
                            if (funkin.playNotes) {
                                funkin.playNotes.emit("directionPressed", { direction: lane, isPlayer: isMySide });
                            }
                        }
                    }
                }
                prevKeysObj[lane] = currentKeys[lane];
            }
        };

        if (isTwoPlayer) {
            processSideHits(true, this.prevKeysP1);
            processSideHits(false, this.prevKeysP2);
        } else {
            const isMySide = !playAsOpponent;
            processSideHits(isMySide, this.prevKeysP1);
        }
    }

    registerHit(closestNote, closestTime, lane, time, arrayIndex) {
        const absMs = Math.abs(closestTime);
        let judgment = "shit";
        let score = 50;

        if (absMs <= 5.0) { judgment = "perfect"; score = 500; } 
        else if (absMs <= 45.0) { judgment = "sick"; score = 350; } 
        else if (absMs <= 90.0) { judgment = "good"; score = 200; } 
        else if (absMs <= 135.0) { judgment = "bad"; score = 100; }

        closestNote.wasHit = true;
        closestNote.active = false;
        closestNote.visible = false;
        
        const hitData = {
            pressed: true,
            ms: closestTime,
            absMs: absMs,
            judgment: judgment,
            score: score,
            direction: lane,
            isPlayer: closestNote.isPlayer,
            isAuto: false,
            note: closestNote
        };

        if (window.funkin && window.funkin.playNotes && typeof window.funkin.playNotes.emit === 'function') {
            window.funkin.playNotes.lastHit = hitData;
            window.funkin.playNotes.emit("noteHit", hitData);
        }

        // EMITIR SEÑAL GLOBAL DE HIT 
        if (this.scene && this.scene.events) {
            this.scene.events.emit("noteHit", hitData);
        }

        if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(15);
        }

        if (this.strumlines && typeof this.strumlines.playConfirm === 'function') {
            this.strumlines.playConfirm(lane, closestNote.isPlayer, time, 150);
        }

        if (arrayIndex !== undefined && arrayIndex >= 0) {
            this.notes.splice(arrayIndex, 1);
        } else {
            const idx = this.notes.indexOf(closestNote);
            if (idx !== -1) this.notes.splice(idx, 1);
        }
        if (closestNote.destroy) closestNote.destroy();
    }

    registerMiss(isPlayerSide, lane) {
        const missData = {
            pressed: true, ms: 0, absMs: 0, judgment: "miss", score: -10,
            direction: lane, isPlayer: isPlayerSide, isAuto: false
        };

        if (funkin.playNotes) {
            funkin.playNotes.lastHit = missData;
            funkin.playNotes.emit("noteMiss", missData);
        }

        // EMITIR SEÑAL GLOBAL DE MISS 
        if (this.scene && this.scene.events) {
            this.scene.events.emit("noteMiss", missData);
        }

        if (this.playMissSound) {
            this.playMissSound(isPlayerSide, false);
        }
    }

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
            } else if (targetScene.cache.audio.has("missnote1")) {
                targetScene.sound.play("missnote1", { volume: 0.6 });
            } else {
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

    executeLateMiss(note, timeDiff, isTimeJumping, isMyNoteAuto) {
        note.hasMissed = true;
        note.alpha = note.baseAlpha * 0.3; 
        
        if (!isTimeJumping) {
            this.registerMiss(note.isPlayer, note.lane);
        }
    }

    handleRewind(songPos) {
        this.notes.forEach((note) => {
            if (!note || !note.scene) return;
            const timeDiff = note.noteTime - songPos;
            if (timeDiff > 166.0 && (note.wasHit || note.hasMissed)) {
                note.wasHit = false;
                note.hasMissed = false;
                note.visible = true;
                note.active = true;
                note.clearTint();
                note.alpha = note.baseAlpha;
            }
        });
    }

    destroy() {
        this.scene.events.off("ui_skin_changed", this.skin.reloadSkin, this);
        this.notes.forEach((note) => {
            if (note && note.active) {
                note.stop();
                note.destroy();
            }
        });
        this.notes = [];
        this.destroyAPI();
    }
}
funkin.play.visuals.arrows.notes.NotesManager = NotesManager;