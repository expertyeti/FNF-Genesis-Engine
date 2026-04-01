/**
 * @file src/funkin/play/data/playScene/playSongPlaylist.js
 * Controlador maestro (Facade) que coordina los módulos de audio y voces.
 */

class PlaySongPlaylist {
    constructor(scene) {
        this.scene = scene;
        
        this.vocalManager = new funkin.play.VocalManager(scene);
        this.trackPlayer = new funkin.play.TrackPlayer(scene);
    }

    get activeSounds() {
        return this.trackPlayer ? this.trackPlayer.activeSounds : [];
    }

    play(type = 'All') {
        if (!funkin.playPreload || !funkin.playPreload.loadedAudioKeys) return;

        const audioKeys = funkin.playPreload.loadedAudioKeys;
        
        const keysToPlay = funkin.play.TrackDecoder.getKeysToPlay(audioKeys, type);
        const playerVocalKeys = funkin.play.TrackDecoder.getPlayerVocalKeys(keysToPlay);

        this.trackPlayer.play(keysToPlay, playerVocalKeys, this.vocalManager);
    }

    stop() {
        if (this.trackPlayer) this.trackPlayer.stop();
        if (this.vocalManager) this.vocalManager.clearTracks(); 
    }

    pause() {
        if (this.trackPlayer) this.trackPlayer.pause();
    }

    resume() {
        if (this.trackPlayer) this.trackPlayer.resume();
    }

    destroy() {
        this.stop();
        
        if (this.vocalManager) {
            this.vocalManager.destroy();
            this.vocalManager = null;
        }
        if (this.trackPlayer) {
            this.trackPlayer.destroy();
            this.trackPlayer = null;
        }
        
        this.scene = null;
    }
}

funkin.play = funkin.play || {};
funkin.play.PlaySongPlaylist = PlaySongPlaylist;