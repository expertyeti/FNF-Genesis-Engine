/**
 * @file PhaseEnd.js
 * Fase 4: Finaliza la canción y coordina la transición hacia menús o siguientes canciones.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.data = funkin.play.data || {};
funkin.play.data.referee = funkin.play.data.referee || {};

class PhaseEnd {
    constructor(referee) {
        this.referee = referee;
        this.scene = referee.scene;
    }

    async enter() {
        const scene = this.scene;

        // --- INTEGRACIÓN APIManager ---
        // Destruir APIs para limpiar memoria y eventos
        if (scene.apiManager) {
            scene.apiManager.destroy();
            scene.apiManager = null;
        }
        // ------------------------------
        
        const currentList = scene.playData.songPlayList || [];
        const currentIndex = currentList.indexOf(scene.playData.actuallyPlaying);

        if (currentIndex !== -1 && currentIndex + 1 < currentList.length) {
            scene.playData.actuallyPlaying = currentList[currentIndex + 1];
            funkin.PlayDataPayload = JSON.parse(JSON.stringify(scene.playData)); 
            scene.scene.restart(); 
        } else {
            funkin.PlayDataPayload = null; 
            const source = scene.playData.sourceScene || "MainMenuScene";
            
            if (funkin.transition) funkin.transition(scene, source);
            else scene.scene.start(source);
        }
    }

    update(time, delta) {
        // La fase final congela el update para evitar bugs visuales durante el Fade Out
    }
}

funkin.play.data.referee.PhaseEnd = PhaseEnd;