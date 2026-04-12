/**
 * @file PhaseEnd.js
 * Fase 4: Finaliza la canción y coordina la transición hacia menús o siguientes canciones.
 */
class PhaseEnd {
    constructor(referee) {
        this.referee = referee;
        this.scene = referee.scene;
    }

    async enter() {
        const scene = this.scene;
        
        const currentList = scene.playData.songPlayList || [];
        const currentIndex = currentList.indexOf(scene.playData.actuallyPlaying);

        // Verifica si la playlist tiene más canciones
        if (currentIndex !== -1 && currentIndex + 1 < currentList.length) {
            scene.playData.actuallyPlaying = currentList[currentIndex + 1];
            funkin.PlayDataPayload = JSON.parse(JSON.stringify(scene.playData)); 
            scene.scene.restart(); 
        } else {
            // Si no hay más canciones, va al menú o lugar de origen
            funkin.PlayDataPayload = null; 
            const source = scene.playData.sourceScene || "MainMenuScene";
            
            // Usamos nuestra API de transición global si existe
            if (funkin.transition) funkin.transition(scene, source);
            else scene.scene.start(source);
        }
    }

    update(time, delta) {
        // La fase final congela el update para evitar bugs visuales durante el Fade Out
    }
}

funkin.play.data.referee.PhaseEnd = PhaseEnd;