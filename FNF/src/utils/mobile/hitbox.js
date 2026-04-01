/**
 * Modulo encargado de inyectar hitboxes tactiles para dispositivos moviles.
 */
class MobileHitbox {
	/**
	 * Verifica el entorno y añade areas tactiles si es pertinente
	 * @param {Object} controls Instancia de controles del juego
	 */
	static checkAndInject(controls) {
		if (typeof window === 'undefined' || !window.game || !window.game.scene) return;
		
		const activeScenes = window.game.scene.getScenes(true); // Lista de escenas activas
		if (!activeScenes || activeScenes.length === 0) return;
		
		const ignoredScenes = ["FlashEffect", "TransitionScene", "GlobalPluginsScene", "PauseSubScene"]; // Escenas a ignorar para la inyeccion
		const scene = activeScenes.slice().reverse().find(s => !ignoredScenes.includes(s.scene.key)); // Escena principal activa encontrada
		
		if (!scene || !scene.sys || !scene.sys.game || !scene.cameras || !scene.cameras.main) return;
		
		const device = scene.sys.game.device; // Informacion del hardware y sistema operativo
		if (!device || !device.os) return; 

		if (device.os.desktop || navigator.maxTouchPoints === 0) return;

		if (typeof funkin !== 'undefined' && funkin.play && funkin.play.options) {
			const midScrollOption = funkin.play.options.middlescroll; // Estado actual de la distribucion de notas
			if (midScrollOption === "mobile") return;
		}

		if (scene._mobileHitboxes && scene._mobileHitboxes.length > 0) {
			if (scene._mobileHitboxes[0] && scene._mobileHitboxes[0].active) {
				return;
			}
		}

		scene._mobileHitboxes = []; // Referencias en memoria de los hitboxes inyectados

		const w = scene.cameras.main.width / 4;
		const h = scene.cameras.main.height;

		const actions = ['NOTE_LEFT', 'NOTE_DOWN', 'NOTE_UP', 'NOTE_RIGHT']; // Acciones de control por indice
		const colors = [0xC24B99, 0x00FFFF, 0x12FA05, 0xF9393F]; // Colores de retroalimentacion por indice

		const BASE_ALPHA = 0.05; // Transparencia base
		const PRESSED_ALPHA = 0.15; // Transparencia al interactuar

		for (let i = 0; i < 4; i++) {
			const rect = scene.add.rectangle((w * i), 0, w, h, colors[i]); // Area tactil individual
			rect.setOrigin(0, 0);
			rect.setAlpha(BASE_ALPHA); 
			rect.setDepth(100000); 
			rect.setScrollFactor(0);
			
			if (typeof funkin !== 'undefined' && funkin.playCamera && funkin.playCamera.ui) {
				if (scene.cameras.cameras && Array.isArray(scene.cameras.cameras)) {
					scene.cameras.cameras.forEach(cam => {
						if (cam !== funkin.playCamera.ui) {
							cam.ignore(rect);
						}
					});
				}
			} else {
				if (scene.cameras.cameras && Array.isArray(scene.cameras.cameras)) {
					scene.cameras.cameras.forEach(cam => {
						if (cam !== scene.cameras.main) {
							cam.ignore(rect);
						}
					});
				}
			}
			
			rect.setInteractive();

			rect.on('pointerdown', () => {
				controls.simulatePress(actions[i]);
				rect.setAlpha(PRESSED_ALPHA); 
			});

			rect.on('pointerup', () => {
				controls.simulateRelease(actions[i]);
				rect.setAlpha(BASE_ALPHA); 
			});

			rect.on('pointerout', () => {
				controls.simulateRelease(actions[i]);
				rect.setAlpha(BASE_ALPHA); 
			});

			rect.on('pointerover', (pointer) => {
				if (pointer && pointer.isDown) {
					controls.simulatePress(actions[i]);
					rect.setAlpha(PRESSED_ALPHA); 
				}
			});

			scene._mobileHitboxes.push(rect);
		}
	}
}

if (typeof window !== 'undefined') {
	window.MobileHitbox = MobileHitbox;
}