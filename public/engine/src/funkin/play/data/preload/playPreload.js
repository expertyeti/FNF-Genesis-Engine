/**
 * @file src/funkin/play/data/preload/playPreload.js
 * Modulo encargado de las precargas estaticas y gestion de recursos principales.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};

// Funcion de seguridad para asegurar que la BASE_URL siempre tenga el formato correcto
const getSafeBaseUrl = () => {
    let base = window.BASE_URL || "";
    if (base && !base.endsWith("/")) {
        base += "/";
    }
    return base;
};

funkin.play.missSoundsAssets = [
    { key: "missnote1", path: getSafeBaseUrl() + "assets/sounds/miss/missnote1.ogg" },
    { key: "missnote2", path: getSafeBaseUrl() + "assets/sounds/miss/missnote2.ogg" },
    { key: "missnote3", path: getSafeBaseUrl() + "assets/sounds/miss/missnote3.ogg" }
];

class PlayPreload {
	static preloadGeneralAssets(scene) {
        // Desactivamos el mapa de bits para los assets ligeros para evitar colas asíncronas
        scene.load.imageBitmapFormat = false;

		const audioAssets = [
			{ key: "cancelSound", path: getSafeBaseUrl() + "assets/sounds/cancelMenu.ogg" },
            ...funkin.play.missSoundsAssets 
		];

        let requiresManualLoadStart = false;

		for (const audio of audioAssets) {
			if (!scene.cache.audio.has(audio.key)) {
				scene.load.audio(audio.key, audio.path);
                requiresManualLoadStart = true;
			}
		}

		const imageAssets = [
			{ key: "icon_face", path: getSafeBaseUrl() + "assets/images/icons/face.png" },
			{ key: "menuBG", path: getSafeBaseUrl() + "assets/images/menu/bg/menuBG.png" }
		];

		for (const img of imageAssets) {
			if (!scene.textures.exists(img.key)) {
				scene.load.image(img.key, img.path);
                requiresManualLoadStart = true;
			}
		}

        // Si la escena ya paso su estado nativo de preload, debemos iniciar la descarga manualmente
        if (requiresManualLoadStart && scene.sys.isBooted && scene.sys.settings.status !== Phaser.Scene.PRELOAD) {
            scene.load.start();
        }

		if (funkin.play.preloadSong) funkin.play.preloadSong(scene, scene.playData);
		if (funkin.play.preloadCharacters) funkin.play.preloadCharacters(scene, scene.playData);
		if (funkin.play.preloadStage) funkin.play.preloadStage(scene, scene.playData);
		if (funkin.play.preloadSkins) funkin.play.preloadSkins(scene, scene.playData);
	}
}

funkin.play.PlayPreload = PlayPreload;