/**
 * @file StrumlineLogic.js
 * Orquestador principal, Posicionamiento Matemático (15%), Lectura de Inputs y Emisión de Señales.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.strumelines = funkin.play.visuals.arrows.strumelines || {};
funkin.play.visuals.arrows.strumlines = funkin.play.visuals.arrows.strumelines;

class StrumlineConfig {
    static get MARGIN_PERCENT() { return 0.15; } 
    static get BASE_STRUM_SIZE() { return 160; }

    static calculateCenterY(screenHeight, isDownscroll) {
        const margin = screenHeight * this.MARGIN_PERCENT;
        return isDownscroll ? (screenHeight - margin) : margin;
    }
}
funkin.play.visuals.arrows.strumelines.StrumlineConfig = StrumlineConfig;

class NoteLane {
    static getXPosition(lane, isPlayer, strumlinesInstance) {
        if (!strumlinesInstance) return 0;
        const strumArray = isPlayer ? strumlinesInstance.playerStrums : strumlinesInstance.opponentStrums;
        if (strumArray && strumArray[lane]) return strumArray[lane].baseX; 
        return 0;
    }
    static getYPosition(lane, isPlayer, strumlinesInstance) {
        if (!strumlinesInstance) return 50; 
        const strumArray = isPlayer ? strumlinesInstance.playerStrums : strumlinesInstance.opponentStrums;
        if (strumArray && strumArray[lane]) return strumArray[lane].baseY;
        return 50;
    }
}
funkin.play.visuals.arrows.strumelines.NoteLane = NoteLane;
funkin.play.visuals.arrows.notes = funkin.play.visuals.arrows.notes || {};
funkin.play.visuals.arrows.notes.RialNotes = NoteLane;

class Strumlines {
    constructor(scene) {
        this.scene = scene;
        
        this.opponentStrums = [];
        this.playerStrums = [];
        
        const NoteDir = funkin.play.visuals.arrows.notes.NoteDirection || window.funkin.NoteDirection;
        this.keyCount = NoteDir ? NoteDir.keyCount : 4;
        this.directions = (NoteDir && typeof NoteDir.getMappings === 'function') 
                            ? NoteDir.getMappings().names 
                            : ["left", "down", "up", "right"];
        
        this.bgGraphics = null;

        this.keyStates = {
            player: new Array(this.keyCount).fill(false),
            opponent: new Array(this.keyCount).fill(false)
        };

        this.initAPI();

        if (typeof this.initStrums === 'function') {
            this.initStrums();
            this.applyLayout();
        }

        this.scene.events.on('ui_skin_changed', this.onSkinChanged, this);
    }

    onSkinChanged() {
        if (typeof this.loadSkin === 'function') {
            this.loadSkin();
            this.applyLayout();
        }
    }

    initAPI() {
        funkin.playStrums = {
            _listeners: {},
            event: function(eventName, callback) {
                if (!this._listeners[eventName]) this._listeners[eventName] = [];
                this._listeners[eventName].push(callback);
            },
            emit: function(eventName, data) {
                if (this._listeners[eventName]) {
                    this._listeners[eventName].forEach(cb => cb(data));
                }
            }
        };
    }

    destroyAPI() {
        if (funkin.playStrums) funkin.playStrums._listeners = {};
    }

    applyLayout() {
        if (!this.scene) return;

        const api = funkin.play.visuals.arrows.strumelines;
        const msNamespace = api.middlescroll;
        const schedNamespace = api.schedules;

        let layoutCtx = null;

        if (msNamespace && msNamespace.MiddlescrollHandler) {
            layoutCtx = msNamespace.MiddlescrollHandler.calculate(this.scene, this.keyCount);
        } else {
            const screenHeight = this.scene.cameras.main.height || 720;
            const defaultY = StrumlineConfig.calculateCenterY(screenHeight, false); 
            
            layoutCtx = {
                centerOpponent: this.scene.sys.game.config.width * 0.25,
                centerPlayer: this.scene.sys.game.config.width * 0.75,
                oppY: defaultY, playerY: defaultY,
                oppScale: 0.7, playerScale: 0.7,
                oppAlpha: 1, playerAlpha: 1,
                oppSpacing: 112, playerSpacing: 112,
                showOppBg: false, showPlayerBg: false,
                gapOpp: 0, gapPlayer: 0,
                oppDownscroll: false, playerDownscroll: false
            };
        }

        if (schedNamespace && schedNamespace.ArrowsSchedule) {
            layoutCtx = schedNamespace.ArrowsSchedule.applyMobile(layoutCtx, this.scene, this.keyCount);
        }

        const applyCoordinatesToSide = (strumsArray, startX, layoutSpacing, layoutY, layoutScale, layoutAlpha, layoutDownscroll) => {
            strumsArray.forEach((strum, i) => {
                if(!strum) return;
                const originX = strum.originX !== undefined ? strum.originX : 0;
                const originY = strum.originY !== undefined ? strum.originY : 0;
                
                const scaledWidth = StrumlineConfig.BASE_STRUM_SIZE * layoutScale;
                const scaledHeight = StrumlineConfig.BASE_STRUM_SIZE * layoutScale;

                strum.baseX = (startX + (i * layoutSpacing)) - (scaledWidth * (0.5 - originX));
                strum.baseY = layoutY - (scaledHeight * (0.5 - originY));
                
                strum.x = strum.baseX; 
                strum.y = strum.baseY; 
                
                strum.setScale(layoutScale);
                strum.baseScale = layoutScale;
                strum.alpha = layoutAlpha;
                strum.downscroll = layoutDownscroll;
                
                strum.setVisible(layoutAlpha > 0.05);
            });
        };

        const totalOppWidth = layoutCtx.oppSpacing * (this.keyCount - 1);
        applyCoordinatesToSide(this.opponentStrums, layoutCtx.centerOpponent - (totalOppWidth / 2), layoutCtx.oppSpacing, layoutCtx.oppY, layoutCtx.oppScale, layoutCtx.oppAlpha, layoutCtx.oppDownscroll);

        const totalPlayerWidth = layoutCtx.playerSpacing * (this.keyCount - 1);
        applyCoordinatesToSide(this.playerStrums, layoutCtx.centerPlayer - (totalPlayerWidth / 2), layoutCtx.playerSpacing, layoutCtx.playerY, layoutCtx.playerScale, layoutCtx.playerAlpha, layoutCtx.playerDownscroll);

        if (typeof this.drawBgLayout === 'function') {
            this.drawBgLayout(layoutCtx);
        }
    }

    updateInputStates(time) {
        if (window.autoplay || (funkin.CountDown && funkin.CountDown.isInCountdown)) return;

        const getStoredOption = (key) => {
            if (funkin.play && funkin.play.options && funkin.play.options[key] !== undefined) return funkin.play.options[key];
            try {
                const val = localStorage.getItem("fnf_" + key) || localStorage.getItem(key);
                return val === "true" ? true : val === "false" ? false : val;
            } catch(e) {}
            return false;
        };

        const isTwoPlayer = getStoredOption("twoPlayerLocal") === true;
        const playAsOpponent = getStoredOption("playAsOpponent") === true;

        let activePointers = [];
        if (this.scene && this.scene.input) {
            const pointersArr = this.scene.input.manager ? this.scene.input.manager.pointers : [];
            activePointers = pointersArr.filter((p) => p && p.isDown);
            if (this.scene.input.activePointer && this.scene.input.activePointer.isDown && !activePointers.includes(this.scene.input.activePointer)) {
                activePointers.push(this.scene.input.activePointer);
            }
        }

        const updateSide = (isMySide, actionPrefix, targetStrums, statesArray) => {
            if (!targetStrums) return;
            const currentKeys = this.directions.map((dir) => !!(window.funkin.controls && window.funkin.controls[actionPrefix + dir.toUpperCase()]));
            
            activePointers.forEach((pointer) => {
                targetStrums.forEach((strum, lane) => {
                    if (!strum) return;
                    const originX = strum.originX !== undefined ? strum.originX : 0.5;
                    const originY = strum.originY !== undefined ? strum.originY : 0.5;
                    const w = strum._staticFrameWidth || strum.lastStaticWidth || strum.displayWidth;
                    const h = strum._staticFrameHeight || strum.lastStaticHeight || strum.displayHeight;
                    const scaleX = strum.scaleX || 1;
                    const scaleY = strum.scaleY || 1;
                    const strumCenterX = (strum.baseX !== undefined ? strum.baseX : strum.x) + (w * scaleX) * (0.5 - originX);
                    const strumCenterY = (strum.baseY !== undefined ? strum.baseY : strum.y) + (h * scaleY) * (0.5 - originY);
                    
                    if (Math.abs(pointer.x - strumCenterX) <= (w * scaleX * 0.7) && Math.abs(pointer.y - strumCenterY) <= (h * scaleY * 0.9)) {
                        currentKeys[lane] = true;
                    }
                });
            });

            for (let lane = 0; lane < this.keyCount; lane++) {
                const isJustPressed = currentKeys[lane] && !statesArray[lane];
                const isJustReleased = !currentKeys[lane] && statesArray[lane];

                // SEÑALES DE EVENTOS GLOBALES (Reemplaza la señal que se había perdido)
                if (isJustPressed && funkin.playStrums) {
                    funkin.playStrums.emit("keyPress", { lane: lane, isPlayer: isMySide });
                }
                if (isJustReleased && funkin.playStrums) {
                    funkin.playStrums.emit("keyRelease", { lane: lane, isPlayer: isMySide });
                }

                statesArray[lane] = currentKeys[lane];
                
                const arrow = targetStrums[lane];
                if (!arrow) continue;

                if (arrow.resetTime > 0 && time < arrow.resetTime) continue;

                if (currentKeys[lane]) {
                    if (arrow.currentAction !== "press") {
                        if(arrow.playAnim) arrow.playAnim("press", true);
                    }
                    arrow.resetTime = 0; 
                } else {
                    if (arrow.currentAction !== "static" && (arrow.resetTime === 0 || time >= arrow.resetTime)) {
                        if(arrow.playAnim) arrow.playAnim("static", true);
                        arrow.resetTime = 0;
                    }
                }
            }
        };

        if (isTwoPlayer) {
            updateSide(true, "NOTE_", this.playerStrums, this.keyStates.player);
            updateSide(false, "P2_NOTE_", this.opponentStrums, this.keyStates.opponent);
        } else {
            const targetStrums = playAsOpponent ? this.opponentStrums : this.playerStrums;
            const targetStates = playAsOpponent ? this.keyStates.opponent : this.keyStates.player;
            updateSide(true, "NOTE_", targetStrums, targetStates);
        }
    }

    playConfirm(lane, isPlayer, time, duration = 150) {
        const strums = isPlayer ? this.playerStrums : this.opponentStrums;
        const arrow = strums[lane];
        if (arrow && arrow.playAnim) {
            arrow.playAnim("confirm", true);
            arrow.resetTime = time + duration;
        }

        // 🚨 AQUÍ EL ARREGLO: Emitir señal de hold/consumo de sustain al CharacterRenderer
        if (this.scene && this.scene.events) {
            this.scene.events.emit("sustainActive", { direction: lane, isPlayer: isPlayer });
        }
    }

    update(time, delta) {
        this.updateInputStates(time);
        
        const checkReset = (strum) => {
            if (strum && strum.resetTime > 0 && time >= strum.resetTime) {
                strum.resetTime = 0;
                if (strum.playAnim && strum.currentAction !== "press") {
                    strum.playAnim('static', true);
                }
            }
        };

        this.opponentStrums.forEach(checkReset);
        this.playerStrums.forEach(checkReset);
    }

    destroy() {
        this.scene.events.off('ui_skin_changed', this.onSkinChanged, this);
        this.opponentStrums.forEach(s => { if(s) s.destroy(); });
        this.playerStrums.forEach(s => { if(s) s.destroy(); });
        this.destroyAPI();
        if (this.bgGraphics) this.bgGraphics.destroy();
    }
}

funkin.play.visuals.arrows.strumelines.Strumlines = Strumlines;