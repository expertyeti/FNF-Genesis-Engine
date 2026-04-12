/**
 * @file getData.js
 * Extrae y formatea los datos de la partida dependiendo de la escena de origen.
 */
class PlayDataParser {
    static parse(sceneData) {
        let data = {
            sourceScene: "MainMenuScene",
            songPlayList: ["Test"],
            actuallyPlaying: "Test",
            difficulty: "normal"
        };

        const payload = (sceneData && Object.keys(sceneData).length > 0) ? sceneData : funkin.PlayDataPayload;

        if (payload) {
            if (payload.sourceScene) data.sourceScene = payload.sourceScene;
            if (payload.songPlayList) data.songPlayList = Array.isArray(payload.songPlayList) ? payload.songPlayList : [payload.songPlayList];
            if (payload.actuallyPlaying) data.actuallyPlaying = payload.actuallyPlaying;
            if (payload.difficulty !== undefined) data.difficulty = payload.difficulty;
        }

        console.log("Datos de la partida:\n" + JSON.stringify(data, null, 2));

        return data;
    }
}

funkin.play.data.sources.PlayDataParser = PlayDataParser;

// Alias global requerido por PlayScene
funkin.PlayDataParser = PlayDataParser;