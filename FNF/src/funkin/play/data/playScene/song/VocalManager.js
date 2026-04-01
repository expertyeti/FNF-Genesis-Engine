/**
 * @file src/funkin/play/data/playScene/VocalManager.js
 * Gestiona las pistas de voz del jugador, silenciándolas al fallar notas y reactivándolas al acertar.
 */

class VocalManager {
    constructor(scene) {
        this.scene = scene;
        this.playerVocalSounds = [];
        this.setupMuteEvents();
    }

    addVocalTrack(sound) {
        this.playerVocalSounds.push(sound);
    }

    clearTracks() {
        this.playerVocalSounds = [];
    }

    muteVocals() {
        this.playerVocalSounds.forEach(snd => {
            if (snd && snd.isPlaying) snd.setVolume(0.0);
        });
    }

    unmuteVocals() {
        this.playerVocalSounds.forEach(snd => {
            if (snd && snd.isPlaying) snd.setVolume(1.0);
        });
    }

    setupMuteEvents() {
        if (!funkin.playNotes) {
            console.warn("funkin.playNotes no está inicializado. Los eventos de voz no funcionarán.");
            return;
        }

        // --- EVENTOS DE NOTAS NORMALES ---
        funkin.playNotes.event('noteHit', (hitData) => {
            if (hitData.pressed && hitData.judgment !== 'miss' && hitData.isPlayer) {
                this.unmuteVocals();
            }
        });

        funkin.playNotes.event('noteMiss', (hitData) => {
            if (hitData.isPlayer) {
                this.muteVocals();

                // Reproducir sonido de fallo
                const randomMiss = Phaser.Math.Between(1, 3);
                const missKey = `missnote${randomMiss}`;
                if (this.scene && this.scene.cache.audio.exists(missKey)) {
                    this.scene.sound.play(missKey, { volume: 0.8 });
                }
            }
        });

        // --- EVENTOS DE NOTAS LARGAS (SUSTAINS) ---
        if (funkin.playSustains) {
            funkin.playSustains.event('sustainActive', (data) => {
                if (data.isPlayer) this.unmuteVocals();
            });
            
            funkin.playSustains.event('sustainDrop', (data) => {
                if (data.isPlayer) {
                    this.muteVocals(); 
                }
            });
        }
    }

    destroy() {
        this.clearTracks();
        this.scene = null;
    }
}

funkin.play = funkin.play || {};
funkin.play.VocalManager = VocalManager;