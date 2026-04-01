/**
 * Modulo orquestador del calculo posicional de las flechas.
 */
class StrumlineLayout {
	/**
	 * Actualiza las posiciones de los carriles activos usando modulos delegados.
	 * @param {Object} strumlines Instancia del manejador de strumlines
	 */
	static updateLayout(strumlines) {
		if (!strumlines || !strumlines.scene) return;

		const scene = strumlines.scene;
		const screenHeight = scene.cameras.main.height;

		const layout = funkin.StrumlineMode.calculate(scene, strumlines.keyCount);

		// Ajuste para forzar la misma separacion que el middlescroll (50px) cuando esta desactivado
		const midScrollOption = funkin.play.options && funkin.play.options.middlescroll;
		const globalDownscroll = funkin.play.options && funkin.play.options.downscroll;
		
		if (!midScrollOption || midScrollOption === "none" || midScrollOption === false) {
			const marginY = 50; 
			const approxStrumHeight = 112; 
			
			if (globalDownscroll) {
				layout.oppY = screenHeight - marginY - approxStrumHeight;
				layout.playerY = screenHeight - marginY - approxStrumHeight;
			} else {
				layout.oppY = marginY;
				layout.playerY = marginY;
			}
		}

		strumlines.opponentStrums.forEach((arrow) => {
			if (arrow) arrow.setScale(layout.oppScale);
		});
		strumlines.playerStrums.forEach((arrow) => {
			if (arrow) arrow.setScale(layout.playerScale);
		});

		const oppCentersWidth =
			(strumlines.keyCount - 1) * layout.oppSpacing + layout.gapOpp;
		const playerCentersWidth =
			(strumlines.keyCount - 1) * layout.playerSpacing + layout.gapPlayer;

		const oppCenterStartX = layout.centerOpponent - oppCentersWidth / 2;
		const playerCenterStartX = layout.centerPlayer - playerCentersWidth / 2;

		const halfKeyCount = Math.floor(strumlines.keyCount / 2);
		const isOdd = strumlines.keyCount % 2 !== 0;

		const actions = ["NOTE_LEFT", "NOTE_DOWN", "NOTE_UP", "NOTE_RIGHT"];

		const setupMobileHitbox = (arrow, spacing, scale, yPos, index) => {
			if (!layout.isMobile) {
				if (arrow.input) arrow.disableInteractive();
				return;
			}

			const hitAreaWidth = spacing / scale;
			const hitAreaHeight = screenHeight / 2 / scale;
			const originY = arrow.originY !== undefined ? arrow.originY : 0.5;

			const hitX = arrow.width / 2 - hitAreaWidth / 2;
			const globalTopY = screenHeight / 2;
			const localTopY = (globalTopY - yPos) / scale + arrow.height * originY;

			if (!arrow.input) {
				arrow.setInteractive(
					new Phaser.Geom.Rectangle(
						hitX,
						localTopY,
						hitAreaWidth,
						hitAreaHeight,
					),
					Phaser.Geom.Rectangle.Contains,
				);
			} else {
				arrow.setInteractive();
				arrow.input.hitArea.setTo(hitX, localTopY, hitAreaWidth, hitAreaHeight);
			}

			arrow.removeAllListeners("pointerdown");
			arrow.removeAllListeners("pointerup");
			arrow.removeAllListeners("pointerout");
			arrow.removeAllListeners("pointerover");

			if (funkin.controls) {
				const action = actions[index % actions.length];

				arrow.on("pointerdown", () => {
					funkin.controls.simulatePress(action);
				});
				arrow.on("pointerup", () => {
					funkin.controls.simulateRelease(action);
				});
				arrow.on("pointerout", () => {
					funkin.controls.simulateRelease(action);
				});
				arrow.on("pointerover", (pointer) => {
					if (pointer && pointer.isDown) funkin.controls.simulatePress(action);
				});
			}
		};

		strumlines.opponentStrums.forEach((arrow, i) => {
			if (!arrow) return;
			let currentGap = 0;
			if (layout.gapOpp > 0) {
				if (isOdd && i === halfKeyCount) currentGap = layout.gapOpp / 2;
				else if (i >= Math.ceil(strumlines.keyCount / 2))
					currentGap = layout.gapOpp;
			}

			const targetCenterX =
				oppCenterStartX + i * layout.oppSpacing + currentGap;
			const originX = arrow.originX !== undefined ? arrow.originX : 0.5;

			arrow.baseX = targetCenterX - arrow.displayWidth * (0.5 - originX);
			arrow.baseY = layout.oppY;
			arrow.setAlpha(
				arrow.baseAlpha !== undefined
					? arrow.baseAlpha * layout.oppAlpha
					: layout.oppAlpha,
			);
			if (typeof arrow.playAnim === "function")
				arrow.playAnim(arrow.currentAction || "static", true);

			if (layout.playAsOpponent) {
				setupMobileHitbox(
					arrow,
					layout.oppSpacing,
					layout.oppScale,
					layout.oppY,
					i,
				);
			} else if (arrow.input) {
				arrow.disableInteractive();
			}
		});

		strumlines.playerStrums.forEach((arrow, i) => {
			if (!arrow) return;
			let currentGap = 0;
			if (layout.gapPlayer > 0) {
				if (isOdd && i === halfKeyCount) currentGap = layout.gapPlayer / 2;
				else if (i >= Math.ceil(strumlines.keyCount / 2))
					currentGap = layout.gapPlayer;
			}

			const targetCenterX =
				playerCenterStartX + i * layout.playerSpacing + currentGap;
			const originX = arrow.originX !== undefined ? arrow.originX : 0.5;

			arrow.baseX = targetCenterX - arrow.displayWidth * (0.5 - originX);
			arrow.baseY = layout.playerY;
			arrow.setAlpha(
				arrow.baseAlpha !== undefined
					? arrow.baseAlpha * layout.playerAlpha
					: layout.playerAlpha,
			);
			if (typeof arrow.playAnim === "function")
				arrow.playAnim(arrow.currentAction || "static", true);

			if (!layout.playAsOpponent) {
				setupMobileHitbox(
					arrow,
					layout.playerSpacing,
					layout.playerScale,
					layout.playerY,
					i,
				);
			} else if (arrow.input) {
				arrow.disableInteractive();
			}
		});

		if (funkin.StrumlineBG) {
			funkin.StrumlineBG.update(strumlines, layout, screenHeight);
		}
	}
}

if (typeof window !== "undefined") {
	window.funkin = window.funkin || {};
	funkin.StrumlineLayout = StrumlineLayout;
}