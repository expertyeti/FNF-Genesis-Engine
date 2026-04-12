/**
 * @file strumelinesAPI.js
 * Expone métodos globales para interactuar con los strums sin acoplar código.
 */

// Blindaje: Garantiza que la rama exista antes de inyectar variables
window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.strumlines = funkin.play.visuals.arrows.strumlines || {};

const strumNamespace = funkin.play.visuals.arrows.strumlines;

// Sistema de eventos nativo inyectado en el namespace
strumNamespace._listeners = {};
strumNamespace._globalListeners = [];

strumNamespace.on = function(event, callback) {
    if (!this._listeners[event]) {
        this._listeners[event] = [];
    }
    this._listeners[event].push(callback);
};

strumNamespace.onAny = function(callback) {
    this._globalListeners.push(callback);
};

strumNamespace.emit = function(event, data) {
    if (this._listeners[event]) {
        this._listeners[event].forEach(callback => callback(data));
    }
    this._globalListeners.forEach(callback => callback(event, data));
};

class StrumlinesAPI {
    /**
     * @param {Object} strumlinesInstance 
     */
    static init(strumlinesInstance) {
        this.instance = strumlinesInstance;
    }

    static getPlayerStrums() {
        return this.instance ? this.instance.playerStrums : [];
    }

    static getOpponentStrums() {
        return this.instance ? this.instance.opponentStrums : [];
    }

    static playStrumAnim(isPlayer, direction, animName, force = false) {
        if (!this.instance) return;
        const targetArray = isPlayer ? this.instance.playerStrums : this.instance.opponentStrums;
        const dirIndex = this.instance.getDirIndex(direction);
        
        if (targetArray[dirIndex]) {
            targetArray[dirIndex].playAnim(animName, force);
        }
    }
}

strumNamespace.StrumlinesAPI = StrumlinesAPI;