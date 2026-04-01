/**
 * @file src/funkin/play/data/playScene/TrackPlayer.js
 * Encargado puramente del ciclo de vida del audio en Phaser (Play, Pause, Stop).
 */

class TrackPlayer {
    constructor(scene) {
        this.scene = scene;
        this.activeSounds = [];
    }

    play(keysToPlay, playerVocalKeys, vocalManager) {
        this.stop(); 
        let endEventRegistered = false;

        const audioKeys = funkin.playPreload.loadedAudioKeys || { instrumental: [], vocals: [] };

        keysToPlay.forEach(key => {
            if (this.scene.cache.audio.exists(key)) {
                const sound = this.scene.sound.add(key);
                
                // Si la pista es del jugador, se la mandamos al VocalManager
                if (playerVocalKeys.includes(key) && vocalManager) {
                    vocalManager.addVocalTrack(sound);
                }
                
                // Avisar a la escena cuando termine la canción (Priorizando la Instrumental)
                if (!endEventRegistered && audioKeys.instrumental.includes(key)) {
                    sound.once('complete', () => {
                        if (this.scene) this.scene.events.emit('song_finished');
                    });
                    endEventRegistered = true;
                }

                sound.play();
                this.activeSounds.push(sound);
            }
        });

        // Fallback: Si no había instrumental, usamos la primera pista cargada
        if (!endEventRegistered && this.activeSounds.length > 0) {
            this.activeSounds[0].once('complete', () => {
                if (this.scene) this.scene.events.emit('song_finished');
            });
        }
    }

    stop() {
        this.activeSounds.forEach(sound => {
            if (sound && sound.isPlaying) sound.stop();
            if (sound && sound.destroy) sound.destroy();
        });
        this.activeSounds = [];
    }

    pause() {
        this.activeSounds.forEach(sound => {
            if (sound && sound.isPlaying) sound.pause();
        });
    }

    resume() {
        this.activeSounds.forEach(sound => {
            if (sound && sound.isPaused) sound.resume();
        });
    }

    destroy() {
        this.stop();
        this.scene = null;
    }
}

funkin.play = funkin.play || {};
funkin.play.TrackPlayer = TrackPlayer;