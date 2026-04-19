/**
 * @file gameReferee.js
 * Controlador principal del flujo del juego y unificador de dependencias heredadas.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.data = funkin.play.data || {};
funkin.play.data.referee = funkin.play.data.referee || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};

// ============================================================================
// ALIAS Y UNIFICACIÓN DE NAMESPACES (Evita crashes por clases eliminadas)
// ============================================================================
// 1. Unificamos el typo histórico entre strumelines (con e) y strumlines (sin e)
funkin.play.visuals.arrows.strumelines = funkin.play.visuals.arrows.strumelines || {};
funkin.play.visuals.arrows.strumlines = funkin.play.visuals.arrows.strumelines;

// 2. Restauramos el namespace de StrumlineLayout para que MiddlescrollHandler no crashee
funkin.play.visuals.arrows.strumelines.StrumlineLayout = {
    updateLayout: (manager) => {
        if (manager && typeof manager.applyLayout === 'function') {
            manager.applyLayout();
        }
    }
};
// ============================================================================

class GameReferee {
    constructor(scene) {
        this.scene = scene;
        this.currentPhase = null;

        const refereeData = funkin.play.data.referee;
        
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
        if (this.scene.isGamePaused) return;

        if (this.currentPhase && typeof this.currentPhase.update === 'function') {
            this.currentPhase.update(time, delta);
        }
    }

    pauseGame() {
        this.scene.isGamePaused = true;
    }

    destroy() {
        this.scene = null;
        this.currentPhase = null;
        this.phases = {};
    }
}

funkin.play.data.referee.GameReferee = GameReferee;