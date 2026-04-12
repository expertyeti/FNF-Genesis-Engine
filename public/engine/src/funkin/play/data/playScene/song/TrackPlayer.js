/**
 * @file src/funkin/play/data/playScene/song/TrackPlayer.js
 * Reproductor de pistas directo, sin validaciones de multicanal o voces.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.data = funkin.play.data || {};
funkin.play.data.song = funkin.play.data.song || {};

class TrackPlayer {
    constructor(scene) {
        this.scene = scene;
        this.activeSounds = [];
    }

    play(keysToPlay) {
        this.stop(); 
        let endEventRegistered = false;

        keysToPlay.forEach(key => {
            if (this.scene && this.scene.cache.audio.has(key)) {
                const sound = this.scene.sound.add(key);
                
                // Solo se necesita registrar el evento de fin en el primer (o único) audio
                if (!endEventRegistered) {
                    sound.once('complete', () => {
                        if (this.scene && this.scene.events) this.scene.events.emit('song_finished');
                    });
                    endEventRegistered = true;
                }

                sound.play();
                this.activeSounds.push(sound);
            }
        });

        // Respaldo por si falló el primer if
        if (!endEventRegistered && this.activeSounds.length > 0) {
            this.activeSounds[0].once('complete', () => {
                if (this.scene && this.scene.events) this.scene.events.emit('song_finished');
            });
        }
    }

    stop() {
        this.activeSounds.forEach(sound => {
            if (sound) {
                if (sound.isPlaying) sound.stop();
                if (typeof sound.destroy === 'function') sound.destroy();
            }
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

funkin.play.data.song.TrackPlayer = TrackPlayer;