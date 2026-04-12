/**
 * Modulo encargado de renderizar y adaptar los fondos opacos de los carriles.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.strumlines = funkin.play.visuals.arrows.strumlines || {};

class StrumlineBG {
	/**
	 * Actualiza las propiedades visuales de los fondos segun la configuracion de layout.
	 * @param {Object} strumlines Instancia del manejador
	 * @param {Object} layout Datos de posicion y escala calculados
	 * @param {number} screenHeight Altura de la pantalla
	 */
	static update(strumlines, layout, screenHeight) {
		let arrowWidthOpp = 112 * layout.oppScale; 
		if (strumlines.opponentStrums && strumlines.opponentStrums[0]) arrowWidthOpp = strumlines.opponentStrums[0].displayWidth;

		let arrowWidthPlayer = 112 * layout.playerScale;
		if (strumlines.playerStrums && strumlines.playerStrums[0]) arrowWidthPlayer = strumlines.playerStrums[0].displayWidth;

		const oppCentersWidth = (strumlines.keyCount - 1) * layout.oppSpacing + layout.gapOpp;
		const playerCentersWidth = (strumlines.keyCount - 1) * layout.playerSpacing + layout.gapPlayer;
		
		const oppCenterStartX = layout.centerOpponent - (oppCentersWidth / 2);
		const playerCenterStartX = layout.centerPlayer - (playerCentersWidth / 2);

		const PADDING = 16;
		const oppBgWidth = oppCentersWidth + arrowWidthOpp + (PADDING * 2);
		const playerBgWidth = playerCentersWidth + arrowWidthPlayer + (PADDING * 2);

		if (strumlines.opponentBg) {
			strumlines.opponentBg.setVisible(layout.showOppBg);
			if (layout.showOppBg) {
				strumlines.opponentBg.displayWidth = oppBgWidth;
				strumlines.opponentBg.displayHeight = screenHeight;
				strumlines.opponentBg.x = oppCenterStartX - (arrowWidthOpp / 2) - PADDING;
				strumlines.opponentBg.y = 0;
				strumlines.opponentBg.setOrigin(0, 0); 
				
				// Correccion de opacidad: Si el objeto grafica (por ejemplo un rectangulo) fue 
				// instanciado con fillAlpha < 1, lo forzamos a 1 para que setAlpha aplique el valor absoluto.
				if (typeof strumlines.opponentBg.setFillStyle === 'function') {
				    strumlines.opponentBg.setFillStyle(0x000000, 1);
				}
				strumlines.opponentBg.setAlpha(layout.bgOpacity);
			}
		}

		if (strumlines.playerBg) {
			strumlines.playerBg.setVisible(layout.showPlayerBg);
			if (layout.showPlayerBg) {
				strumlines.playerBg.displayWidth = playerBgWidth;
				strumlines.playerBg.displayHeight = screenHeight;
				strumlines.playerBg.x = playerCenterStartX - (arrowWidthPlayer / 2) - PADDING;
				strumlines.playerBg.y = 0;
				strumlines.playerBg.setOrigin(0, 0); 
				
				if (typeof strumlines.playerBg.setFillStyle === 'function') {
				    strumlines.playerBg.setFillStyle(0x000000, 1);
				}
				strumlines.playerBg.setAlpha(layout.bgOpacity);
			}
		}
	}
}

funkin.play.visuals.arrows.strumlines.StrumlineBG = StrumlineBG;