/**
 * Modulo responsable de calcular las posiciones y escalas de las strumlines
 * dependiendo del modo de juego (middlescroll, downscroll, mobile, etc).
 */
class StrumlineMode {
	/**
	 * @param {Phaser.Scene} scene Escena actual
	 * @param {number} keyCount Cantidad de teclas activas
	 * @returns {Object} Configuracion de layout resultante
	 */
	static calculate(scene, keyCount) {
		const screenWidth = scene.cameras.main.width;
		const screenHeight = scene.cameras.main.height;

		funkin.play.options = funkin.play.options || {};

		const isDownscroll = funkin.play.options.downscroll === true; 
		const midScrollOption = funkin.play.options.middlescroll;
		const isMobileOption = midScrollOption === "mobile"; 
		const isSplit = midScrollOption === "split";
		const isMiddleScroll = midScrollOption === true || midScrollOption === "narrow" || midScrollOption === "wide" || isSplit || isMobileOption;

		const isDeviceMobile = /Mobi|Android/i.test(navigator.userAgent);

		const showBg = funkin.play.options.strumlineBg === true;
		const playAsOpponent = funkin.play.options.playAsOpponent === true; 
		const bgOpacity = funkin.play.options.laneOpacity !== undefined ? funkin.play.options.laneOpacity : 0.5;

		const skinScale = funkin.play.uiSkins?.get("gameplay.strumline")?.scale || 0.7; 
		
		let offsetPixels = (isDeviceMobile || isDownscroll || isMobileOption) ? 150 : 50; 
		if ((isMiddleScroll && isDownscroll) || isMobileOption) {
			offsetPixels = 180;
		}

		const DEFAULT_Y = isDownscroll ? (screenHeight - offsetPixels) : offsetPixels;

		let oppY = DEFAULT_Y; 
		let playerY = DEFAULT_Y; 

		let centerOpponent = screenWidth * 0.25; 
		let centerPlayer = screenWidth * 0.75; 

		let oppScale = skinScale;
		let playerScale = skinScale;
		let oppAlpha = 1.0;
		let playerAlpha = 1.0;

		const BASE_SPACING = 118; 
		let oppSpacing = BASE_SPACING;
		let playerSpacing = BASE_SPACING;

		let showOppBg = showBg;
		let showPlayerBg = showBg;

		let gapPlayer = 0; 
		let gapOpp = 0; 

		if (isMiddleScroll) {
			const sideOffset = isDownscroll ? -30 : 30;
			let activeSpacing = BASE_SPACING;

			if (midScrollOption === "narrow") {
				activeSpacing = 112;
			} else if (midScrollOption === "wide") {
				activeSpacing = 145;
			} else if (isMobileOption) {
				activeSpacing = 135;
			}

			if (playAsOpponent) {
				centerOpponent = screenWidth / 2;
				centerPlayer = screenWidth * 0.85;

				playerY = DEFAULT_Y + sideOffset;

				oppScale = skinScale;
				playerScale = skinScale * 0.75;

				oppSpacing = activeSpacing;
				playerSpacing = BASE_SPACING * 0.75;

				playerAlpha = 0.35;

				showOppBg = showBg;
				showPlayerBg = false;

				if (isMobileOption) { 
					oppY = screenHeight - 180; 
					playerY = 50; 
					playerScale = skinScale * 0.55;
					playerSpacing = BASE_SPACING * 0.55;
					gapOpp = 120;
				} else if (isSplit) {
					centerOpponent = screenWidth / 2;
					oppY = DEFAULT_Y; 
					centerPlayer = screenWidth / 2;
					playerY = DEFAULT_Y;
					playerScale = skinScale;
					playerAlpha = 1.0;
					playerSpacing = BASE_SPACING;
					gapPlayer = screenWidth * 0.55;
				}
			} else {
				centerPlayer = screenWidth / 2;
				centerOpponent = screenWidth * 0.15;

				oppY = DEFAULT_Y + sideOffset;

				oppScale = skinScale * 0.75;
				playerScale = skinScale;

				oppSpacing = BASE_SPACING * 0.75;
				playerSpacing = activeSpacing;

				oppAlpha = 0.35;

				showOppBg = false;
				showPlayerBg = showBg;

				if (isMobileOption) { 
					playerY = screenHeight - 180; 
					oppY = 50; 
					oppScale = skinScale * 0.55;
					oppSpacing = BASE_SPACING * 0.55;
					gapPlayer = 120;
				} else if (isSplit) {
					centerPlayer = screenWidth / 2;
					playerY = DEFAULT_Y;
					centerOpponent = screenWidth / 2;
					oppY = DEFAULT_Y; 
					oppScale = skinScale;
					oppAlpha = 1.0;
					oppSpacing = BASE_SPACING;
					gapOpp = screenWidth * 0.55;
				}
			}
		}

		return {
			oppY, playerY, centerOpponent, centerPlayer, oppScale, playerScale, 
			oppAlpha, playerAlpha, oppSpacing, playerSpacing, showOppBg, showPlayerBg, 
			gapPlayer, gapOpp, isMobile: isMobileOption, playAsOpponent, bgOpacity
		};
	}
}

if (typeof window !== "undefined") {
	window.funkin = window.funkin || {};
	funkin.StrumlineMode = StrumlineMode;
}