/**
 * @file src/funkin/play/data/playScene/clean/CleanAudio.js
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

        if (scene.sound) {
            scene.sound.stopAll();
            scene.sound.removeAll();
        }

        if (funkin.playPreload && funkin.playPreload.loadedAudioKeys) {
            const keys = funkin.playPreload.loadedAudioKeys;
            if (keys.instrumental) keys.instrumental.forEach(k => scene.cache.audio.remove(k));
            if (keys.vocals) keys.vocals.forEach(k => scene.cache.audio.remove(k));
            funkin.playPreload.loadedAudioKeys = { instrumental: [], vocals: [] };
        }
    }
}

funkin.play = funkin.play || {};
funkin.play.CleanAudio = CleanAudio;