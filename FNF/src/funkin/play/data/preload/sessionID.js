/**
 * @file src/funkin/play/data/preload/sessionID.js
 * Generador de un ID de sesión único para aislar los recursos en la caché de Phaser.
 */

class SessionManager {
    constructor() {
        this.currentSession = null;
        this.customData = {}; 
    }

    generateNewSession() {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 7);
        this.currentSession = `play_${timestamp}_${randomStr}`;
        this.customData = {};
        
        console.log(`Nueva sesión de juego generada: ${this.currentSession}`);
        return this.currentSession;
    }

    get() {
        return this.currentSession;
    }

    getKey(originalKey) {
        // FIX: Si por algún motivo la sesión se borró o sobreescribió, crea una nueva automáticamente.
        if (!this.currentSession) {
            this.generateNewSession();
        }
        return `${this.currentSession}_${originalKey}`;
    }

    setCustomData(key, value) {
        this.customData[key] = value;
    }

    getCustomData(key) {
        return this.customData[key];
    }

    clearCustomData() {
        this.customData = {};
    }
}

funkin.play = funkin.play || {};
// Evita sobreescribir si ya existe una sesión válida funcionando
if (!funkin.play.session || typeof funkin.play.session.generateNewSession !== 'function') {
    funkin.play.session = new SessionManager();
}