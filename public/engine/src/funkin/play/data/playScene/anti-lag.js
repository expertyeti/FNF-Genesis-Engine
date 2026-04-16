/**
 * @file src/funkin/play/data/playScene/anti-lag.js
 * Sistema dinámico para detectar caídas de cuadros y aplicar Smooth Fix.
 */
class AntiLagSystem {
    /**
     * @param {Phaser.Scene} scene - Escena donde operará el sistema.
     */
    constructor(scene) {
        this.scene = scene;
        this.lagThreshold = 150; 
        this.isEnabled = true;
        this.isRecovering = false; 
        this.currentRate = 1.0; 
    }

    /**
     * Evalúa el delta y ajusta la velocidad temporal global.
     * @param {number} time - Tiempo absoluto.
     * @param {number} delta - Milisegundos desde el último frame.
     */
    update(time, delta) {
        if (!this.isEnabled || !funkin.songPlaylist || !window.funkin.conductor) return;

        if (delta > this.lagThreshold) {
            this.currentRate = 0.8;
            this.isRecovering = true;
            this.setGameRate(this.currentRate);
        } else if (this.isRecovering && delta < 35) {
            this.currentRate += 0.05 * (delta / 1000);

            if (this.currentRate >= 1.0) {
                this.currentRate = 1.0;
                this.isRecovering = false;
            }

            this.setGameRate(this.currentRate);
        }
    }

    /**
     * Aplica el multiplicador a sonidos, animaciones y tweens.
     * @param {number} newRate - Multiplicador de velocidad (1.0 = normal).
     */
    setGameRate(newRate) {
        if (funkin.songPlaylist && funkin.songPlaylist.activeSounds) {
            funkin.songPlaylist.activeSounds.forEach((sound) => {
                if (sound && sound.isPlaying) sound.setRate(newRate);
            });
        }

        if (this.scene) {
            if (this.scene.anims) this.scene.anims.globalTimeScale = newRate;
            if (this.scene.tweens) this.scene.tweens.timeScale = newRate;
            if (this.scene.time) this.scene.time.timeScale = newRate;
        }
    }

    /**
     * Alterna el estado del sistema anti-lag.
     * @param {boolean} [state] - Fuerza un estado específico.
     */
    toggle(state) {
        this.isEnabled = state !== undefined ? state : !this.isEnabled;

        if (!this.isEnabled) {
            this.setGameRate(1.0);
            this.isRecovering = false;
        }
    }

    /**
     * Limpia referencias de memoria.
     */
    destroy() {
        this.setGameRate(1.0);
        this.scene = null;
    }
}

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.data = funkin.play.data || {};
funkin.play.data.clean = funkin.play.data.clean || {};
funkin.play.data.clean.AntiLagSystem = AntiLagSystem;