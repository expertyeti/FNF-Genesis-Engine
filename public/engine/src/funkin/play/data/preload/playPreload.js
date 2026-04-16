/**
 * @file src/funkin/play/data/preload/playPreload.js
 * Modulo encargado de las precargas estaticas. Optimizado con cargas concurrentes unificadas.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};

const getSafeBaseUrl = () => {
    let base = window.BASE_URL || "";
    return base.endsWith("/") || base === "" ? base : base + "/";
};

funkin.play.missSoundsAssets = [
    { key: "missnote1", path: "assets/sounds/miss/missnote1.ogg" },
    { key: "missnote2", path: "assets/sounds/miss/missnote2.ogg" },
    { key: "missnote3", path: "assets/sounds/miss/missnote3.ogg" }
];

class PlayPreload {
    static async preloadGeneralAssets(scene) {
        // Optimización 1: Evitar procesamientos de texturas innecesarios
        scene.load.imageBitmapFormat = false;
        
        // Optimización 2: Aumentar la concurrencia de descargas paralelas (XP: Performance)
        scene.load.maxParallelDownloads = 8; 

        const baseUrl = getSafeBaseUrl();
        const audioAssets = [
            { key: "cancelSound", path: "assets/sounds/cancelMenu.ogg" },
            ...funkin.play.missSoundsAssets 
        ];

        // Encolar audios genéricos
        for (const { key, path } of audioAssets) {
            if (!scene.cache.audio.has(key)) scene.load.audio(key, baseUrl + path);
        }

        // Encolar imágenes genéricas
        const imageAssets = [
            { key: "icon_face", path: "assets/images/icons/face.png" },
            { key: "menuBG", path: "assets/images/menu/bg/menuBG.png" }
        ];

        for (const { key, path } of imageAssets) {
            if (!scene.textures.exists(key)) scene.load.image(key, baseUrl + path);
        }

        // Optimización 3: Resolver toda la lógica de encolado de los submódulos EN PARALELO
        await Promise.all([
            funkin.play.preloadSong ? funkin.play.preloadSong(scene, scene.playData, true) : Promise.resolve(),
            funkin.play.preloadCharacters ? funkin.play.preloadCharacters(scene) : Promise.resolve(),
            funkin.play.preloadStage ? funkin.play.preloadStage(scene, scene.playData) : Promise.resolve(),
            funkin.play.preloadSkins ? funkin.play.preloadSkins(scene, funkin.play.uiSkinsManager) : Promise.resolve()
        ]);

        // Optimización 4: Iniciar la carga UNA SOLA VEZ y esperar
        return new Promise((resolve) => {
            if (scene.load.totalToLoad === 0) {
                return resolve(); // Todo estaba en caché
            }
            
            scene.load.once("complete", () => {
                console.log("[PlayPreload] Carga global completada.");
                resolve();
            });
            
            if (!scene.load.isLoading()) {
                scene.load.start();
            }
        });
    }
}

funkin.play.PlayPreload = PlayPreload;