/**
 * @file src/funkin/play/data/preload/preloadSong.js
 * Sistema exclusivo para precargar dinámicamente el audio de la canción (instrumental y voces)
 * basándose en la metadata del chart. NO gestiona reproducción.
 */

class SongPreloader {
    constructor() {
        this.loadedAudioKeys = {
            instrumental: [],
            vocals: []
        };
    }

    async preloadAudio(scene, songName) {
        return new Promise((resolve) => {
            if (!funkin.play.chart) {
                console.error("funkin.play.chart no está inicializado.");
                return resolve(null);
            }

            const audioMeta = funkin.play.chart.get('metadata.audio');
            if (!audioMeta) {
                console.error("No se encontró 'metadata.audio' en el chart.");
                return resolve(null);
            }

            this.loadedAudioKeys = { instrumental: [], vocals: [] };
            
            let filesAddedToLoader = 0;

            const loadFile = (cacheKey, fileName, type) => {
                const sessionKey = funkin.play.session.getKey(cacheKey); 
                const url = `public/songs/${songName}/song/${fileName}`;
                
                if (!scene.cache.audio.exists(sessionKey)) {
                    console.log(`Encolando audio: ${url} (Key: ${sessionKey})`);
                    scene.load.audio(sessionKey, url);
                    filesAddedToLoader++;
                }
                
                this.loadedAudioKeys[type].push(sessionKey);
            };

            if (audioMeta.instrumental) {
                for (const [key, fileName] of Object.entries(audioMeta.instrumental)) {
                    loadFile(key, fileName, 'instrumental');
                }
            }

            if (audioMeta.needVoices !== false) {
                if (audioMeta.multichannelVocals === false) {
                    loadFile('vocals', 'Voices.ogg', 'vocals');
                } else if (audioMeta.vocals) {
                    for (const [key, fileName] of Object.entries(audioMeta.vocals)) {
                        loadFile(key, fileName, 'vocals');
                    }
                }
            } else {
                console.log("needVoices es false. Se ignoran las pistas vocales.");
            }

            if (filesAddedToLoader === 0) {
                console.log("Los audios ya estaban listos en caché:\n", this.loadedAudioKeys);
                return resolve(this.loadedAudioKeys);
            }

            scene.load.once('complete', () => {
                console.log("¡Recursos de audio precargados con éxito!\n", this.loadedAudioKeys);
                resolve(this.loadedAudioKeys);
            });

            scene.load.on('loaderror', (file) => {
                console.error(`Falló la carga del archivo: ${file.src}`);
            });

            scene.load.start();
        });
    }

    get(path) {
        if (!this.loadedAudioKeys) return null;

        if (!path || path.toLowerCase() === 'all') return this.loadedAudioKeys;

        const keys = path.split('.');
        let current = this.loadedAudioKeys;

        for (const key of keys) {
            if (key.toLowerCase() === 'all') return current;
            if (current === undefined || current === null) return undefined;
            current = current[key];
        }

        return current;
    }
}

funkin.playPreload = new SongPreloader();