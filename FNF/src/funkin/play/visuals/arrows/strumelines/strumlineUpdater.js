/**
 * Modulo iterativo responsable de procesar el estado en tiempo real (inputs y bot).
 */
class StrumlineUpdater {
	/**
	 * Revisa las teclas presionadas y actualiza el comportamiento visual por frame.
	 * @param {Object} strumlines 
	 * @param {number} time 
	 */
	static update(strumlines, time) {
		if (!funkin.controls) return;

		const isAutoplay = window.autoplay;
		const playAsOpponent = funkin.play && funkin.play.options && funkin.play.options.playAsOpponent === true;

		// Determinamos dinamicamente cuales strums son mios y cuales del bot
		const myStrums = playAsOpponent ? strumlines.opponentStrums : strumlines.playerStrums;
		const botStrums = playAsOpponent ? strumlines.playerStrums : strumlines.opponentStrums;

		myStrums.forEach((arrow, i) => {
			const dir = strumlines.directions[i];
			const actionKey = 'NOTE_' + dir.toUpperCase();
			const isPressed = !!funkin.controls[actionKey];

			if (isAutoplay) {
				if (arrow.currentAction !== 'static' && time >= arrow.resetTime) {
					arrow.playAnim('static');
				}
			} else {
				if (isPressed) {
					if (arrow.currentAction !== 'confirm' || time >= arrow.resetTime) {
						arrow.playAnim('press');
					}
				} else {
					if (arrow.currentAction !== 'confirm' || time >= arrow.resetTime) {
						arrow.playAnim('static');
					}
				}
			}
		});

		botStrums.forEach((arrow) => {
			if (arrow.currentAction !== 'static' && time >= arrow.resetTime) {
				arrow.playAnim('static');
			}
		});
	}
}

if (typeof window !== 'undefined') {
	window.funkin = window.funkin || {};
	funkin.StrumlineUpdater = StrumlineUpdater;
}