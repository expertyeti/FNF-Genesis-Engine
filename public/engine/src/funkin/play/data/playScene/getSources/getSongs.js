window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.data = funkin.play.data || {};

class GetSongs {
    static getAudioData() {
        let audio = null;

        if (funkin.play.chart) {
            if (typeof funkin.play.chart.get === 'function') {
                audio = funkin.play.chart.get('metadata.audio');
            } else if (funkin.play.chart.metadata) {
                audio = funkin.play.chart.metadata.audio;
            } else if (funkin.play.chart.audio) {
                audio = funkin.play.chart.audio; // Respaldo extra
            }
        }

        if (!audio) {
            console.warn("[Audio Debug] No se encontró metadata.audio en el chart. Usando valores por defecto.");
            audio = {};
        } else {
            console.log("[Audio Debug] Metadata del chart leída correctamente:", audio);
        }

        return {
            multiVoc: audio.multichannelVocals ?? false,
            needVoc: audio.needVoices ?? true,
            inst: audio.instrumental || { "inst": "Inst.ogg" },
            voc: audio.vocals || { "vocals": "Voices.ogg" }
        };
    }
}

funkin.play.data.GetSongs = GetSongs;