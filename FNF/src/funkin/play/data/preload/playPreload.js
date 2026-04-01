/**
 * Modulo encargado de las precargas estaticas y gestion de recursos principales.
 */
class PlayPreload {
	/**
	 * Precarga de texturas y sonidos estaticos para el gameplay de forma optimizada
	 * @param {Phaser.Scene} scene Escena actual activa
	 */
	static preloadGeneralAssets(scene) {
		const audioAssets = [
			{ key: "cancelSound", path: "public/sounds/cancelMenu.ogg" },
			{ key: "missnote1", path: "public/sounds/miss/missnote1.ogg" },
			{ key: "missnote2", path: "public/sounds/miss/missnote2.ogg" },
			{ key: "missnote3", path: "public/sounds/miss/missnote3.ogg" }
		];

		for (const audio of audioAssets) {
			if (!scene.cache.audio.exists(audio.key)) {
				scene.load.audio(audio.key, audio.path);
			}
		}

		const imageAssets = [
			{ key: "icon_face", path: "public/images/icons/face.png" },
			{ key: "menuBG", path: "public/images/menu/bg/menuBG.png" }
		];

		for (const img of imageAssets) {
			if (!scene.textures.exists(img.key)) {
				scene.load.image(img.key, img.path);
			}
		}

		if (funkin.play.preloadSong) funkin.play.preloadSong(scene, scene.playData);
		if (funkin.play.preloadCharacters) funkin.play.preloadCharacters(scene, scene.playData);
		if (funkin.play.preloadStage) funkin.play.preloadStage(scene, scene.playData);
		if (funkin.play.preloadSkins) funkin.play.preloadSkins(scene, scene.playData);
	}
}

if (typeof window !== "undefined") {
	window.funkin = window.funkin || {};
	funkin.play = funkin.play || {};
	funkin.play.PlayPreload = PlayPreload;
}