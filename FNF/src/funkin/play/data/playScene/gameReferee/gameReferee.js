/**
 * @file src/funkin/play/data/playScene/gameReferee/gameReferee.js
 * Controlador principal del flujo del juego. Mueve el ciclo de vida por las distintas fases.
 */

class GameReferee {
    constructor(scene) {
        this.scene = scene;
        this.currentPhase = null;

        // Instanciamos todas las fases del ciclo de vida
        this.phases = {
            init: new funkin.play.PhaseInit(this),
            countdown: new funkin.play.PhaseCountdown(this),
            playing: new funkin.play.PhasePlaying(this),
            end: new funkin.play.PhaseEnd(this)
        };
    }

    async start() {
        await this.changePhase('init');
    }

    async changePhase(phaseName) {
        if (this.currentPhase && typeof this.currentPhase.exit === 'function') {
            this.currentPhase.exit();
        }
        
        this.currentPhase = this.phases[phaseName];
        
        if (this.currentPhase && typeof this.currentPhase.enter === 'function') {
            await this.currentPhase.enter();
        }
    }

    update(time, delta) {
        if (this.currentPhase && typeof this.currentPhase.update === 'function') {
            this.currentPhase.update(time, delta);
        }
    }
}

funkin.play = funkin.play || {};
funkin.play.GameReferee = GameReferee;