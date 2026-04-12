/**
 * @file playSongPlaylist.js
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.data = funkin.play.data || {};
funkin.play.data.song = funkin.play.data.song || {};

class PlaySongPlaylist {
    constructor(scene) {
        this.scene = scene;
        
        const TP = funkin.play.data.song.TrackPlayer || funkin.play.TrackPlayer;
        if (TP) this.trackPlayer = new TP(scene);

        const VM = funkin.play.VocalManager;
        if (VM) {
            this.vocalManager = new VM(scene);
            this.vocalManager.init();
        }
    }

    get activeSounds() {
        return this.trackPlayer ? this.trackPlayer.activeSounds : [];
    }

    play() {
        const audioData = funkin.play.songAudioData;
        let keysToPlay = audioData ? audioData.instKeys : [];

        console.log(`PlaySongPlaylist intentando reproducir las llaves:`, keysToPlay);

        if (!keysToPlay || keysToPlay.length === 0) {
            console.warn("No se encontraron instKeys válidas en songAudioData. Usando llaves de emergencia.");
            const allKeys = this.scene.cache.audio.getKeys();
            keysToPlay = allKeys.filter(key => key.toLowerCase().includes("inst"));
        }

        /** 
        * Ya NO filtramos con this.scene.cache.audio.exists()
        * Si el archivo no existe, dejamos que Phaser tire su propio error nativo para saber qué está fallando.
        */ 

        if (this.trackPlayer && keysToPlay.length > 0) {
            this.trackPlayer.play(keysToPlay);
        } else {
            console.warn("[Genesis Engine] No hay llaves para enviar al TrackPlayer.");
        }

        if (this.vocalManager) {
            this.vocalManager.play();
        }
    }

    stop() {
        if (this.trackPlayer) this.trackPlayer.stop();
        if (this.vocalManager) this.vocalManager.stop();
    }

    pause() {
        if (this.trackPlayer) this.trackPlayer.pause();
        if (this.vocalManager) this.vocalManager.pause();
    }

    resume() {
        if (this.trackPlayer) this.trackPlayer.resume();
        if (this.vocalManager) this.vocalManager.resume();
    }

    destroy() {
        this.stop();
        if (this.trackPlayer) {
            this.trackPlayer.destroy();
            this.trackPlayer = null;
        }
        if (this.vocalManager) {
            this.vocalManager.destroy();
            this.vocalManager = null;
        }
        this.scene = null;
    }
}

funkin.play.data.song.PlaySongPlaylist = PlaySongPlaylist;