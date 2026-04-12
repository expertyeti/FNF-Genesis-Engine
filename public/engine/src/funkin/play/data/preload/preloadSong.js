/**
 * @file preloadSong.js
 * Precarga dinámica del audio de la canción con compatibilidad para PhaseInit y la nueva estructura meta.jsonc.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.data = funkin.play.data || {};
funkin.play.data.preload = funkin.play.data.preload || {};

class PreloadSong {
    // Método síncrono para playPreload.js
    static preload(scene, playData) {
        const preloader = new PreloadSong();
        const songName = playData ? playData.actuallyPlaying : "Test";
        preloader.preloadAudio(scene, songName);
    }

    // Método asíncrono requerido por PhaseInit.js
    async preloadAudio(scene, songName) {
        return new Promise((resolve) => {
            console.log(`[Audio Debug] PhaseInit llamó a preloadAudio con la canción: ${songName}`);

            // Lógica actualizada: Buscar metadatos del chart cargado desde meta.jsonc
            let audioData = { multiVoc: false, needVoc: false, inst: {}, voc: {} };
            const chartMetaAudio = funkin.play.chart && typeof funkin.play.chart.get === 'function' ? funkin.play.chart.get("metadata.audio") : null;

            if (chartMetaAudio) {
                // Si el chart tiene datos (nueva arquitectura)
                audioData.multiVoc = chartMetaAudio.multiVocal || false;
                audioData.needVoc = chartMetaAudio.needsVoices || false;
                audioData.inst = chartMetaAudio.instrumental || { "inst": "Inst.ogg" };
                audioData.voc = chartMetaAudio.vocals || { "vocals": "Voices.ogg" };
            } else {
                // Fallback de seguridad por si no se cargó el chart
                const GetSongs = funkin.play.data.GetSongs;
                if (GetSongs && typeof GetSongs.getAudioData === 'function') {
                    audioData = GetSongs.getAudioData();
                } else {
                    audioData = {
                        multiVoc: false, needVoc: true, inst: { "inst": "Inst.ogg" }, voc: { "vocals": "Voices.ogg" }
                    };
                }
            }
            
            const loadedData = {
                multiVoc: audioData.multiVoc, needVoc: audioData.needVoc,
                instKeys: [], vocKeys: { player: null, opponent: null, generic: [] }
            };

            let baseUrl = window.BASE_URL || "";
            let filesAdded = 0;

            const loadAudio = (key, fileName, type) => {
                let cacheKey = `${songName}_${type}_${key}`;
                if (funkin.play.session && typeof funkin.play.session.getKey === 'function') {
                    cacheKey = funkin.play.session.getKey(cacheKey);
                }

                const url = `${baseUrl}assets/songs/${songName}/song/${fileName}`;
                
                if (!scene.cache.audio.exists(cacheKey)) {
                    console.log(`[Audio Debug] Encolando audio -> Key: ${cacheKey} | URL: ${url}`);
                    scene.load.audio(cacheKey, url);
                    filesAdded++;
                } else {
                    console.log(`[Audio Debug] El audio ya estaba en caché -> Key: ${cacheKey}`);
                }
                return cacheKey;
            };

            // Precargar Instrumentales
            if (audioData.inst) {
                for (const [key, fileData] of Object.entries(audioData.inst)) {
                    // FIX: Verifica si viene como string (formato viejo) o como objeto (nuevo formato meta.jsonc)
                    const fileName = typeof fileData === 'string' ? fileData : fileData.file;
                    
                    if (fileName) {
                        loadedData.instKeys.push(loadAudio(key, fileName, 'inst'));
                    }
                }
            }

            // Precargar Vocales
            if (audioData.needVoc && audioData.voc) {
                for (const [key, fileData] of Object.entries(audioData.voc)) {
                    // FIX: Extracción del nombre del archivo previniendo "[object Object]"
                    const fileName = typeof fileData === 'string' ? fileData : fileData.file;
                    
                    if (!fileName) continue;

                    const cacheKey = loadAudio(key, fileName, 'voc');
                    const lowerKey = key.toLowerCase();
                    
                    if (lowerKey === 'player') loadedData.vocKeys.player = cacheKey;
                    else if (lowerKey === 'enemy' || lowerKey === 'opponent') loadedData.vocKeys.opponent = cacheKey;
                    else loadedData.vocKeys.generic.push(cacheKey);
                }
            }

            // Guardar datos globalmente para que PlaySongPlaylist.js los use después
            funkin.play.songAudioData = loadedData;

            // Si no hay archivos nuevos, resolvemos inmediatamente
            if (filesAdded === 0) {
                console.log("[Audio Debug] No hubo archivos nuevos por cargar. Resolviendo inmediato.");
                return resolve(loadedData.instKeys);
            }

            // Eventos de Phaser para esperar la descarga
            scene.load.once("complete", () => {
                console.log("[Audio Debug] Carga asíncrona de audio completada con éxito.");
                resolve(loadedData.instKeys);
            });

            scene.load.on("loaderror", (file) => {
                if (file.key.includes(songName)) {
                    console.error(`[Audio Debug] ERROR 404 AL CARGAR: ${file.src}`);
                }
            });

            scene.load.start();
        });
    }
}

funkin.play.data.preload.PreloadSong = PreloadSong;
funkin.play.preloadSong = PreloadSong.preload;

// ALIAS GLOBAL REQUERIDO POR PhaseInit.js
window.funkin.playPreload = new PreloadSong();