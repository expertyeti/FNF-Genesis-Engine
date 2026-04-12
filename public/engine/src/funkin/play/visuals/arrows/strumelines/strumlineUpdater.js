/**
 * Modulo iterativo responsable de procesar el estado en tiempo real (inputs y bot).
 */
class StrumlineUpdater {
	static update(strumlines, time) {
		if (!funkin.controls) return;
        
        if (!StrumlineUpdater.previousKeys) StrumlineUpdater.previousKeys = {};

		const isAutoplay = window.autoplay;
        
        const getStoredOption = (key) => {
            if (typeof funkin !== 'undefined' && funkin.play && funkin.play.options && funkin.play.options[key] !== undefined) return funkin.play.options[key];
            try {
                const keys = ['genesis_options', 'funkin_options', 'options', 'play_options', 'game_options'];
                for (let i = 0; i < keys.length; i++) {
                    let val = localStorage.getItem(keys[i]);
                    if (val) {
                        let p = JSON.parse(val);
                        if (p[key] !== undefined) return p[key];
                        if (p.play && p.play.options && p.play.options[key] !== undefined) return p.play.options[key];
                        if (p.options && p.options[key] !== undefined) return p.options[key];
                    }
                }
            } catch(e) {}
            return false;
        };

		const playAsOpponent = getStoredOption("playAsOpponent") === true;
        const isTwoPlayer = getStoredOption("twoPlayerLocal") === true;

		const myStrums = (playAsOpponent && !isTwoPlayer) ? strumlines.opponentStrums : strumlines.playerStrums;
		const botStrums = (playAsOpponent && !isTwoPlayer) ? strumlines.playerStrums : strumlines.opponentStrums;

		myStrums.forEach((arrow, i) => {
			const dir = strumlines.directions[i];
			const actionKey = 'NOTE_' + dir.toUpperCase();
            
			const isPressed = !!funkin.controls[actionKey];
            const wasPressed = !!StrumlineUpdater.previousKeys[actionKey];

            if (!isAutoplay && isPressed && !wasPressed) {
                if (funkin.playerStaticsInSong && funkin.playerStaticsInSong.clickTimestamps) {
                    funkin.playerStaticsInSong.clickTimestamps.push(performance.now());
                }
            }
            
            StrumlineUpdater.previousKeys[actionKey] = isPressed;

			if (isAutoplay && !isTwoPlayer) {
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

        // CORRECCIÓN PARA P2: El enemigo deja de ser Bot y reacciona a los controles de P2
		botStrums.forEach((arrow, i) => {
            if (isTwoPlayer) {
                const dir = strumlines.directions[i];
                const actionKey = 'P2_NOTE_' + dir.toUpperCase();
                const isPressed = !!funkin.controls[actionKey];
                
                if (isPressed) {
                    if (arrow.currentAction !== 'confirm' || time >= arrow.resetTime) arrow.playAnim('press');
                } else {
                    if (arrow.currentAction !== 'confirm' || time >= arrow.resetTime) arrow.playAnim('static');
                }
            } else {
                if (arrow.currentAction !== 'static' && time >= arrow.resetTime) {
                    arrow.playAnim('static');
                }
            }
		});
	}
}

funkin.play.visuals.arrows.strumlines.StrumlineUpdater = StrumlineUpdater;