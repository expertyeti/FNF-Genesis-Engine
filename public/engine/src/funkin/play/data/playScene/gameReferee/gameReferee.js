/**
 * @file gameReferee.js
 * Controlador principal del flujo del juego. Mueve el ciclo de vida por las distintas fases.
 */

// Garantizamos la existencia de la jerarquía para evitar crashes durante la inyección
window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.data = funkin.play.data || {};
funkin.play.data.referee = funkin.play.data.referee || {};

class GameReferee {
    constructor(scene) {
        this.scene = scene;
        this.currentPhase = null;

        // Instanciamos todas las fases del ciclo de vida apuntando al namespace global
        const refereeData = funkin.play.data.referee;
        
        // Operadores de encadenamiento/condicionales por si alguna fase aún no se ha inyectado
        this.phases = {
            init: refereeData.PhaseInit ? new refereeData.PhaseInit(this) : null,
            countdown: refereeData.PhaseCountdown ? new refereeData.PhaseCountdown(this) : null,
            playing: refereeData.PhasePlaying ? new refereeData.PhasePlaying(this) : null,
            end: refereeData.PhaseEnd ? new refereeData.PhaseEnd(this) : null
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
        // Bloqueamos el update si el juego está en pausa
        if (this.scene.isGamePaused) return;

        if (this.currentPhase && typeof this.currentPhase.update === 'function') {
            this.currentPhase.update(time, delta);
        }
    }

    pauseGame() {
        this.scene.isGamePaused = true;
        // Aquí puedes lanzar la escena de pausa
        // this.scene.scene.launch("PauseSubScene", { parentScene: this.scene });
    }

    destroy() {
        this.scene = null;
        this.currentPhase = null;
        this.phases = {};
    }
}

// Registro explícito en el árbol global
funkin.play.data.referee.GameReferee = GameReferee;