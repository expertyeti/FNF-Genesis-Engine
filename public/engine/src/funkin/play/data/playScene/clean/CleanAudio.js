/**
 * @file CleanAudio.js
 * Detiene y elimina todo el audio activo y limpia la caché musical de Phaser.
 */
class CleanAudio {
    static execute(scene) {
        if (funkin.countDown) {
            if (typeof funkin.countDown.destroy === "function") funkin.countDown.destroy();
            funkin.countDown = null;
        }

        if (funkin.songPlaylist) {
            if (typeof funkin.songPlaylist.destroy === "function") funkin.songPlaylist.destroy();
            funkin.songPlaylist = null;
        }
        
        if (scene.songPlaylist) {
            if (typeof scene.songPlaylist.destroy === "function") scene.songPlaylist.destroy();
            scene.songPlaylist = null;
        }

        if (scene.songDebugger) {
            scene.songDebugger.destroy();
            scene.songDebugger = null;
        }

        // DESTRUCCIÓN EXPLÍCITA DE MANAGERS PARA EVITAR DUPLICACIÓN Y LEAKS
        if (scene.trackPlayer) {
            if (typeof scene.trackPlayer.destroy === 'function') scene.trackPlayer.destroy();
            scene.trackPlayer = null;
        }

        if (scene.vocalManager) {
            if (typeof scene.vocalManager.destroy === 'function') scene.vocalManager.destroy();
            scene.vocalManager = null;
        }

        if (scene.sound) {
            scene.sound.stopAll();
            scene.sound.removeAll(); // Purga forzada del manager de Phaser
        }

        if (funkin.play.PlayPreload && funkin.play.PlayPreload.loadedAudioKeys) {
            const keys = funkin.play.PlayPreload.loadedAudioKeys;
            if (keys.instrumental) keys.instrumental.forEach(k => scene.cache.audio.remove(k));
            if (keys.vocals) keys.vocals.forEach(k => scene.cache.audio.remove(k));
            funkin.play.PlayPreload.loadedAudioKeys = { instrumental: [], vocals: [] };
        }
    }
}

funkin.play.data.clean.CleanAudio = CleanAudio;