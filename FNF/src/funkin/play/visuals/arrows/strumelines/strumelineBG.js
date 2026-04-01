/**
 * Modulo encargado de renderizar y adaptar los fondos opacos de los carriles.
 */
class StrumlineBG {
	/**
	 * Actualiza las propiedades visuales de los fondos segun la configuracion de layout.
	 * @param {Object} strumlines Instancia del manejador
	 * @param {Object} layout Datos de posicion y escala calculados
	 * @param {number} screenHeight Altura de la pantalla
	 */
	static update(strumlines, layout, screenHeight) {
		let arrowWidthOpp = 112 * layout.oppScale; 
		if (strumlines.opponentStrums[0]) arrowWidthOpp = strumlines.opponentStrums[0].displayWidth;

		let arrowWidthPlayer = 112 * layout.playerScale;
		if (strumlines.playerStrums[0]) arrowWidthPlayer = strumlines.playerStrums[0].displayWidth;

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
				
				const finalOppAlpha = layout.oppAlpha === 1.0 ? layout.bgOpacity : layout.bgOpacity * 0.6;
				strumlines.opponentBg.setAlpha(finalOppAlpha);
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
				
				const finalPlayerAlpha = layout.playerAlpha === 1.0 ? layout.bgOpacity : layout.bgOpacity * 0.6;
				strumlines.playerBg.setAlpha(finalPlayerAlpha);
			}
		}
	}
}

if (typeof window !== "undefined") {
	window.funkin = window.funkin || {};
	funkin.StrumlineBG = StrumlineBG;
}