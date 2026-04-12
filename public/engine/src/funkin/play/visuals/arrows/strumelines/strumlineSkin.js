/**
 * Modulo dedicado a la recarga, redimensionamiento y actualizacion visual de los strums.
 */
class StrumlineSkin {
	/**
	 * Refresca texturas y variables fisicas de todos los strums activos en pantalla.
	 * @param {Object} strumlines 
	 */
	static reload(strumlines) {
		if (!funkin.play || !funkin.play.uiSkins) return;

		const skinData = funkin.play.uiSkins.get('gameplay.strumline');
		if (!skinData) return;

		const assetKey = funkin.play.uiSkins.getAssetKey(skinData.assetPath);
		if (!strumlines.scene.textures.exists(assetKey)) return;

		if (funkin.ArrowsSpawner) {
			funkin.ArrowsSpawner.checkSparrowXML(strumlines.scene, assetKey);
			funkin.ArrowsSpawner.createStrumAnimations(strumlines.scene, assetKey, skinData.animations, strumlines.directions);
		}

		const scale = skinData.scale || 0.7;
		const alpha = skinData.alpha !== undefined ? skinData.alpha : 1.0;

		const updateArrows = (arrowsArray) => {
			arrowsArray.forEach((arrow) => {
				if (arrow.anims) arrow.stop(); 
				arrow.setTexture(assetKey); 
				arrow.setScale(scale);
				arrow.setAlpha(alpha);
				arrow.animsOffsets = skinData.offsets || { static: [0, 0], press: [0, 0], confirm: [0, 0] };
				
				if (funkin.StrumlineAnimator) {
					funkin.StrumlineAnimator.assignPlayAnimFunction(arrow, assetKey);
				}
				
				const lastAction = arrow.currentAction;
				arrow.currentAction = null;
				arrow.playAnim(lastAction || 'static', true);
			});
		};

		updateArrows(strumlines.opponentStrums);
		updateArrows(strumlines.playerStrums);

		if (funkin.StrumlineLayout) {
			funkin.StrumlineLayout.updateLayout(strumlines);
		}
	}
}

funkin.play.visuals.arrows.strumlines.StrumlineSkin = StrumlineSkin;
