/**
 * @file src/funkin/play/scripts/API/song.js
 * API para el control total de la canción actual.
 * Diseñado para herramientas de depuración, Editores de Charts y manipulación en tiempo real.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.scripts = funkin.play.scripts || {};
funkin.play.scripts.api = funkin.play.scripts.api || {};

class SongAPI {
    /**
     * @param {Phaser.Scene} scene - La escena de PlayScene.
     */
    constructor(scene) {
        this.scene = scene;
        this.conductor = window.funkin.utils ? window.funkin.utils.Conductor : null;
    }

    /**
     * Obtiene todos los tracks de audio relacionados a la canción.
     * Soporta diferentes arquitecturas de FNF (TrackPlayer dedicado o variables sueltas).
     * @returns {Phaser.Sound.BaseSound[]} Array con los objetos de sonido.
     */
    getTracks() {
        let tracks = [];
        
        // Búsqueda en caso de tener un TrackPlayer modular
        if (this.scene.trackPlayer) {
            if (this.scene.trackPlayer.inst) tracks.push(this.scene.trackPlayer.inst);
            if (this.scene.trackPlayer.vocals) tracks.push(this.scene.trackPlayer.vocals);
            if (this.scene.trackPlayer.opponentVocals) tracks.push(this.scene.trackPlayer.opponentVocals);
        } else {
            // Fallback si los audios están montados directamente en la escena
            if (this.scene.inst) tracks.push(this.scene.inst);
            if (this.scene.vocals) tracks.push(this.scene.vocals);
            if (this.scene.opponentVocals) tracks.push(this.scene.opponentVocals);
        }
        
        return tracks.filter(track => track !== null && track !== undefined);
    }

    /**
     * Reanuda o inicia la reproducción de todos los tracks.
     */
    play() {
        this.getTracks().forEach(track => {
            if (track.isPaused) {
                track.resume();
            } else if (!track.isPlaying) {
                track.play();
            }
        });
    }

    /**
     * Pausa temporalmente todos los tracks de la canción.
     */
    pause() {
        this.getTracks().forEach(track => {
            if (track.isPlaying) track.pause();
        });
    }

    /**
     * Alterna entre pausa y reproducción.
     */
    togglePlay() {
        if (this.isPlaying()) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * Detiene la canción por completo, reiniciando el tiempo a 0.
     */
    stop() {
        this.getTracks().forEach(track => {
            track.stop();
        });
        this.syncConductor(0);
    }

    /**
     * Salta a un momento específico de la canción.
     * @param {number} timeMs - El tiempo objetivo en milisegundos.
     */
    seek(timeMs) {
        // Asegurarse de no ir a tiempos negativos o superar la duración
        const duration = this.getDuration();
        let targetTime = Math.max(0, timeMs);
        if (duration > 0) targetTime = Math.min(targetTime, duration);

        // Phaser requiere el seek en segundos
        const timeSec = targetTime / 1000;

        this.getTracks().forEach(track => {
            if (track.isPlaying || track.isPaused) {
                track.seek = timeSec;
            }
        });

        this.syncConductor(targetTime);
    }

    /**
     * Adelanta la canción.
     * @param {number} amountMs - Milisegundos a adelantar (Ej: 1000 para 1 segundo).
     */
    forward(amountMs = 1000) {
        this.seek(this.getTime() + amountMs);
    }

    /**
     * Atrasa la canción.
     * @param {number} amountMs - Milisegundos a atrasar.
     */
    rewind(amountMs = 1000) {
        this.seek(this.getTime() - amountMs);
    }

    /**
     * Obtiene el tiempo actual de reproducción.
     * @returns {number} Tiempo en milisegundos.
     */
    getTime() {
        const tracks = this.getTracks();
        if (tracks.length > 0) {
            return (tracks[0].seek || 0) * 1000; // Phaser devuelve segundos, convertimos a ms
        }
        return this.conductor ? this.conductor.songPosition : 0;
    }

    /**
     * Obtiene la duración total de la canción (basado en el instrumental).
     * @returns {number} Duración en milisegundos.
     */
    getDuration() {
        const tracks = this.getTracks();
        if (tracks.length > 0 && tracks[0].duration) {
            return tracks[0].duration * 1000;
        }
        return 0;
    }

    /**
     * Modifica el volumen global de la canción.
     * @param {number} volume - Volumen entre 0.0 y 1.0
     */
    setVolume(volume) {
        const clampedVol = Phaser.Math.Clamp(volume, 0, 1);
        this.getTracks().forEach(track => {
            track.setVolume(clampedVol);
        });
    }

    /**
     * Modifica exclusivamente el volumen de las voces (útil para editores/debug).
     * @param {number} volume - Volumen entre 0.0 y 1.0
     */
    setVocalsVolume(volume) {
        const clampedVol = Phaser.Math.Clamp(volume, 0, 1);
        if (this.scene.trackPlayer && this.scene.trackPlayer.vocals) {
            this.scene.trackPlayer.vocals.setVolume(clampedVol);
        } else if (this.scene.vocals) {
            this.scene.vocals.setVolume(clampedVol);
        }
    }

    /**
     * Cambia la velocidad/pitch de reproducción.
     * Ideal para analizar charts rápidos en el editor.
     * @param {number} rate - 1.0 es velocidad normal, 0.5 es mitad, 2.0 es el doble.
     */
    setPlaybackRate(rate) {
        const clampedRate = Math.max(0.1, rate);
        this.getTracks().forEach(track => {
            if (track.setRate) track.setRate(clampedRate);
        });
        
        // Sincronizar el conductor con el nuevo rate si el motor lo soporta
        if (this.conductor) {
            this.conductor.playbackRate = clampedRate;
        }
    }

    /**
     * Verifica si la canción está reproduciéndose actualmente.
     * @returns {boolean}
     */
    isPlaying() {
        const tracks = this.getTracks();
        return tracks.length > 0 && tracks[0].isPlaying;
    }

    /**
     * Sincroniza la lógica del Conductor global con el tiempo manipulado.
     * Vital para que las notas y animaciones coincidan tras un "seek".
     * @param {number} timeMs - Tiempo actual en milisegundos
     */
    syncConductor(timeMs) {
        if (this.conductor) {
            this.conductor.songPosition = timeMs;
        }
        
        // Si hay manejadores de notas en la escena, informarles del salto temporal
        if (this.scene.notesManager && typeof this.scene.notesManager.syncTime === 'function') {
            this.scene.notesManager.syncTime(timeMs);
        }
    }
}

funkin.play.scripts.api.SongAPI = SongAPI;