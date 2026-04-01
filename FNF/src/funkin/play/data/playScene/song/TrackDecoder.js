/**
 * @file src/funkin/play/data/playScene/TrackDecoder.js
 * Se encarga de analizar los datos del chart y los audios precargados
 * para determinar qué pistas se deben reproducir y cuáles pertenecen al jugador.
 */

class TrackDecoder {
    static getKeysToPlay(audioKeys, type = 'All') {
        const typeLower = type.toLowerCase();
        
        if (typeLower === 'instrumental' || typeLower === 'inst') {
            return [...audioKeys.instrumental];
        } else if (typeLower === 'vocals' || typeLower === 'voices') {
            return [...audioKeys.vocals];
        }
        
        return [...audioKeys.instrumental, ...audioKeys.vocals];
    }

    static getPlayerVocalKeys(keysToPlay) {
        let playerVocalKeys = [];
        
        if (funkin.play.chart) {
            const isMultiChannel = 
                String(funkin.play.chart.get('metadata.audio.multichannelVocals')) === 'true' || 
                String(funkin.play.chart.get('multichannelVocals')) === 'true';
            
            const needVoices = 
                String(funkin.play.chart.get('metadata.audio.needVoices')) === 'true' || 
                String(funkin.play.chart.get('needVoices')) === 'true';

            if (isMultiChannel && needVoices) {
                const vocalsObj = funkin.play.chart.get('metadata.audio.vocals') || funkin.play.chart.get('vocals');
                
                if (vocalsObj && vocalsObj.player) {
                    const expectedKey = funkin.play.session ? funkin.play.session.getKey('player') : 'player';
                    if (keysToPlay.includes(expectedKey)) {
                        playerVocalKeys.push(expectedKey);
                    }
                }
            }
        }
        
        return playerVocalKeys;
    }
}

funkin.play = funkin.play || {};
funkin.play.TrackDecoder = TrackDecoder;