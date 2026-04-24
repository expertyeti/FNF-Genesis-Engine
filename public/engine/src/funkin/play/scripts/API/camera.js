/**
 * @file camera.js
 * @description API avanzada para el control de cámaras, seguimiento de personajes y animaciones.
 * Corregida la inversión de targets y añadido un motor interno de Booping rítmico autónomo.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.scripts = funkin.play.scripts || {};
funkin.play.scripts.api = funkin.play.scripts.api || {};

class CameraAPI {
    constructor(scene) {
        this.scene = scene;
        this.customEasings = new Map();
        
        // Estado interno para el booping rítmico
        this.boopingState = {
            enabled: false,
            interval: 4,
            intensity: 0.015,
            targets: [],
            lastBoopedBeat: -1
        };
    }

    /**
     * @description Se llama cada frame para calcular si toca hacer el rebote rítmico (Boop).
     * @param {number} songPosition - Milisegundos actuales de la canción.
     */
    update(songPosition) {
        if (!this.boopingState.enabled) return;

        const bpm = window.funkin?.conductor?.bpm?.get?.() ?? window.funkin?.conductor?.bpm ?? 120;
        const crochet = 60000 / Math.max(bpm, 1);
        
        // Calcular el beat actual
        const currentBeat = Math.floor(songPosition / crochet);

        // Si entramos a un nuevo beat y cumple con el intervalo (ej. cada 2 beats)
        if (currentBeat !== this.boopingState.lastBoopedBeat && currentBeat % this.boopingState.interval === 0) {
            this.boopingState.lastBoopedBeat = currentBeat;
            
            // Aplicar el salto de zoom directo a las cámaras
            this.boopingState.targets.forEach(camObj => {
                if (camObj && camObj.cam) {
                    camObj.cam.zoom += this.boopingState.intensity;
                }
            });
        }
    }

    /**
     * @description Registra una curva de animación personalizada (Easing).
     */
    addCustomEasing(name, func) {
        if (typeof func !== 'function') return;
        Phaser.Tweens.Builders.GetEaseFunction(name, func);
        this.customEasings.set(name, func);
    }

    /**
     * @description Mueve la cámara hacia un personaje o coordenadas.
     */
    follow(target, duration = 0, isBeats = false, ease = 'Quad.easeOut', config = {x: 0, y: 0, useDPI: true}, type = 'game') {
        const ms = this._resolveTime(duration, isBeats);
        const pos = this._resolveTargetPosition(target, config);
        const resolvedEase = this._resolveEase(ease);

        this._getTargetCameras(type).forEach(camObj => {
            const phaserCam = camObj.cam; 

            const targetTL_X = pos.x - phaserCam.width / 2;
            const targetTL_Y = pos.y - phaserCam.height / 2;

            if (camObj.scrollTween) camObj.scrollTween.stop();

            if (ms <= 0) {
                if (camObj.targetScrollX !== undefined) {
                    camObj.targetScrollX = targetTL_X;
                    camObj.targetScrollY = targetTL_Y;
                }
                phaserCam.setScroll(targetTL_X, targetTL_Y);
            } else {
                if (camObj.targetScrollX !== undefined) {
                    camObj.scrollTween = this.scene.tweens.add({
                        targets: camObj,
                        targetScrollX: targetTL_X,
                        targetScrollY: targetTL_Y,
                        duration: ms,
                        ease: resolvedEase
                    });
                } else {
                    phaserCam.pan(pos.x, pos.y, ms, resolvedEase);
                }
            }
        });
    }

    /**
     * @description Ajusta el zoom de la cámara iterpolando targetZoom.
     */
    zoom(targetZoom, duration = 0, isBeats = false, ease = 'Linear', type = 'game') {
        const ms = this._resolveTime(duration, isBeats);
        const resolvedEase = this._resolveEase(ease);

        this._getTargetCameras(type).forEach(camObj => {
            const phaserCam = camObj.cam;

            if (camObj.zoomTween) camObj.zoomTween.stop();

            if (ms <= 0) {
                if (camObj.targetZoom !== undefined) camObj.targetZoom = targetZoom;
                phaserCam.setZoom(targetZoom);
            } else {
                if (camObj.targetZoom !== undefined) {
                    camObj.zoomTween = this.scene.tweens.add({
                        targets: camObj,
                        targetZoom: targetZoom,
                        duration: ms,
                        ease: resolvedEase
                    });
                } else {
                    phaserCam.zoomTo(targetZoom, ms, resolvedEase, true);
                }
            }
        });
    }

    /**
     * @description Configura el rebote rítmico activando el motor interno de la API.
     */
    setBooping(enabled, interval = 4, intensity = 0.015, type = 'all') {
        this.boopingState.enabled = enabled;
        this.boopingState.interval = Math.max(interval, 1);
        this.boopingState.intensity = intensity;
        this.boopingState.targets = this._getTargetCameras(type);
        this.boopingState.lastBoopedBeat = -1; // Resetear para que haga boop de inmediato
    }

    /**
     * @description Agita la cámara.
     */
    shake(intensity = 0.05, duration = 500, isBeats = false, type = 'game') {
        const ms = this._resolveTime(duration, isBeats);
        this._getTargetCameras(type).forEach(c => c.cam.shake(ms, intensity));
    }

    /**
     * @description Oscurece la cámara.
     */
    fadeOut(color = '#000000', duration = 1000, isBeats = false, type = 'all') {
        const ms = this._resolveTime(duration, isBeats);
        const rgb = Phaser.Display.Color.HexStringToColor(color);
        this._getTargetCameras(type).forEach(c => c.cam.fadeOut(ms, rgb.r, rgb.g, rgb.b));
    }

    /**
     * @description Aclara la cámara.
     */
    fadeIn(color = '#000000', duration = 1000, isBeats = false, type = 'all') {
        const ms = this._resolveTime(duration, isBeats);
        const rgb = Phaser.Display.Color.HexStringToColor(color);
        this._getTargetCameras(type).forEach(c => c.cam.fadeIn(ms, rgb.r, rgb.g, rgb.b));
    }

    // --- MÉTODOS PRIVADOS ---

    /** @private */
    _resolveTime(time, isBeats) {
        if (!isBeats) return time;
        const bpm = window.funkin?.conductor?.bpm?.get?.() ?? window.funkin?.conductor?.bpm ?? 120;
        return time * (60000 / Math.max(bpm, 1));
    }

    /** @private */
    _resolveEase(ease) {
        if (!ease || ease === 'CLASSIC' || ease === 'linear') return 'Linear';
        const easeMap = {
            'expoout': 'Expo.easeOut', 'expoin': 'Expo.easeIn', 'expoinout': 'Expo.easeInOut',
            'elasticinout': 'Elastic.easeInOut', 'elasticout': 'Elastic.easeOut', 'elasticin': 'Elastic.easeIn',
            'quadinout': 'Quad.easeInOut', 'quadout': 'Quad.easeOut', 'quadin': 'Quad.easeIn',
            'cubeinout': 'Cubic.easeInOut', 'cubeout': 'Cubic.easeOut', 'cubein': 'Cubic.easeIn',
            'sineinout': 'Sine.easeInOut', 'sineout': 'Sine.easeOut', 'sinein': 'Sine.easeIn',
            'bounceout': 'Bounce.easeOut', 'bouncein': 'Bounce.easeIn', 'backout': 'Back.easeOut'
        };
        return easeMap[ease.toLowerCase()] || ease;
    }

    /** @private */
    _resolveTargetPosition(target, config) {
        let tx = 0, ty = 0;
        let resolvedTarget = target;

        // ==========================================
        // CORRECCIÓN: INVERSIÓN TOTAL DE OBJETIVOS
        // ==========================================
        if (target === 0 || target === '0' || target === 'player') {
            resolvedTarget = 'enemy';
        } else if (target === 1 || target === '1' || target === 'enemy' || target === 'opponent') {
            resolvedTarget = 'player';
        }

        const char = resolvedTarget === 'player' ? this.scene.player : (resolvedTarget === 'enemy' ? this.scene.opponent : (resolvedTarget === 'spectator' ? this.scene.spectator : null));

        if (char) {
            tx = char.x + (char.displayWidth / 2) + (char.cameraPosition?.[0] || 0);
            ty = char.y + (char.displayHeight / 2) + (char.cameraPosition?.[1] || 0);
        } else if (typeof target === 'object') {
            tx = target.x || 0;
            ty = target.y || 0;
        }

        const scale = config.useDPI ? (this.scene.scale.displayScale.x || 1) : 1;
        return { x: tx + (config.x || 0) * scale, y: ty + (config.y || 0) * scale };
    }

    /** @private */
    _getTargetCameras(type) {
        const list = [];
        if (type === 'game' || type === 'all' || type === 'stage') list.push(this.scene.gameCam);
        if (type === 'ui'   || type === 'all' || type === 'hud') list.push(this.scene.uiCam);
        if (type === 'main') list.push(this.scene.mainCam);
        return list.filter(c => c && c.cam);
    }
}

funkin.play.scripts.api.CameraAPI = CameraAPI;