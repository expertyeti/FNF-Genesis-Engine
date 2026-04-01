/**
 * @file src/funkin/play/data/playScene/getData.js
 * Extrae y formatea los datos de la partida dependiendo de la escena de origen.
 */

class PlayDataParser {
    /**
     * @param {object} sceneData - Los datos pasados a través de scene.start('PlayScene', datos)
     * @returns {object} JSON con los datos parseados
     */
    static parse(sceneData) {
        // Estructura base requerida
        let data = {
            sourceScene: "MainMenuScene", // de donde viene
            songPlayList: ["Test"],       // array de canciones a tocar (playlist)
            actuallyPlaying: "Test",      // canción específica actual
            difficulty: "normal"          // string de dificultad (cualquier valor)
        };

        // Extraemos los datos del argumento de Phaser, o del payload global seguro
        const payload = (sceneData && Object.keys(sceneData).length > 0) ? sceneData : funkin.PlayDataPayload;

        if (payload) {
            if (payload.sourceScene) data.sourceScene = payload.sourceScene;
            if (payload.songPlayList) data.songPlayList = Array.isArray(payload.songPlayList) ? payload.songPlayList : [payload.songPlayList];
            if (payload.actuallyPlaying) data.actuallyPlaying = payload.actuallyPlaying;
            if (payload.difficulty !== undefined) data.difficulty = payload.difficulty;
        }

        // El logger global ya pondrá los corchetes con el nombre del archivo
        console.log("Datos de la partida:\n" + JSON.stringify(data, null, 2));

        return data;
    }
}

funkin.PlayDataParser = PlayDataParser;