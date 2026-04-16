/**
 * @file preloadSong.js
 * Optimizado: Compatibilidad con carga global unificada.
 */
window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.data = funkin.play.data || {};
funkin.play.data.preload = funkin.play.data.preload || {};

class PreloadSong {
    static async preload(scene, playData, isGlobalBatch = false) {
        const preloader = new PreloadSong();
        const songName = playData ? playData.actuallyPlaying : "Test";
        return preloader.preloadAudio(scene, songName, isGlobalBatch);
    }

    async preloadAudio(scene, songName, isGlobalBatch = false) {
        let audioData = { multiVoc: false, needVoc: false, inst: {}, voc: {} };
        const chartMetaAudio = funkin.play.chart?.get?.("metadata.audio");

        if (chartMetaAudio) {
            audioData.multiVoc = chartMetaAudio.multiVocal || false;
            audioData.needVoc = chartMetaAudio.needsVoices || false;
            audioData.inst = chartMetaAudio.instrumental || { inst: "Inst.ogg" };
            audioData.voc = chartMetaAudio.vocals || { vocals: "Voices.ogg" };
        } else {
            const GetSongs = funkin.play.data.GetSongs;
            if (GetSongs?.getAudioData) audioData = GetSongs.getAudioData();
            else audioData = { multiVoc: false, needVoc: true, inst: { inst: "Inst.ogg" }, voc: { vocals: "Voices.ogg" } };
        }
        
        const loadedData = {
            multiVoc: audioData.multiVoc, needVoc: audioData.needVoc,
            instKeys: [], vocKeys: { player: null, opponent: null, generic: [] }
        };

        const baseUrl = window.BASE_URL || "";
        let filesAdded = 0;

        const loadAudio = (key, fileName, type) => {
            let cacheKey = `${songName}_${type}_${key}`;
            if (funkin.play.session?.getKey) cacheKey = funkin.play.session.getKey(cacheKey);
            const url = `${baseUrl}assets/songs/${songName}/song/${fileName}`;
            
            if (!scene.cache.audio.exists(cacheKey)) {
                scene.load.audio(cacheKey, url);
                filesAdded++;
            }
            return cacheKey;
        };

        if (audioData.inst) {
            for (const [key, fileData] of Object.entries(audioData.inst)) {
                const fileName = typeof fileData === 'string' ? fileData : fileData?.file;
                if (fileName) loadedData.instKeys.push(loadAudio(key, fileName, 'inst'));
            }
        }

        if (audioData.needVoc && audioData.voc) {
            for (const [key, fileData] of Object.entries(audioData.voc)) {
                const fileName = typeof fileData === 'string' ? fileData : fileData?.file;
                if (!fileName) continue;

                const cacheKey = loadAudio(key, fileName, 'voc');
                const lowerKey = key.toLowerCase();
                
                if (lowerKey === 'player') loadedData.vocKeys.player = cacheKey;
                else if (lowerKey === 'enemy' || lowerKey === 'opponent') loadedData.vocKeys.opponent = cacheKey;
                else loadedData.vocKeys.generic.push(cacheKey);
            }
        }

        funkin.play.songAudioData = loadedData;

        // Si es parte del batch global o no hay archivos, retornamos de inmediato
        if (isGlobalBatch || filesAdded === 0) {
            return loadedData.instKeys;
        }

        // Si se llamó de forma aislada (ej: hot-reload de solo la canción)
        return new Promise(resolve => {
            scene.load.once("complete", () => resolve(loadedData.instKeys));
            scene.load.start();
        });
    }
}

funkin.play.data.preload.PreloadSong = PreloadSong;
funkin.play.preloadSong = PreloadSong.preload;
window.funkin.playPreload = new PreloadSong();