class CreateBG {
	static execute(scene, stageName) {
		const isSimpleMode = funkin.play.options?.simpleMode === true;
		const centerX = scene.scale.width / 2;
		const centerY = scene.scale.height / 2;

		if (isSimpleMode) {
			const key = 'menuBG'; 
			if (scene.textures.exists(key)) {
				let bg = scene.add.sprite(centerX, centerY, key);
				bg.setOrigin(0.5, 0.5);
				bg.setScrollFactor(0); 
				bg.setDepth(-1000); 
				
				const scaleX = scene.scale.width / bg.width;
				const scaleY = scene.scale.height / bg.height;
				const coverScale = Math.max(scaleX, scaleY);
				
				bg.setScale(coverScale);

				if (funkin.play.data.camera && typeof funkin.play.data.camera.addObjToGame === 'function') {
					funkin.play.data.camera.addObjToGame(bg);
				}
			} else {
				console.log("Textura menuBG no encontrada para el modo simple.");
			}
			return; 
		}

		const data = funkin.play.stageManager.get();
		if (!data || !data.background) return;

		const pathName = data.pathName || stageName;
		let bg = null;

		if (data.background.startsWith('#')) {
			const hexColor = Phaser.Display.Color.HexStringToColor(data.background).color;
			
			bg = scene.add.rectangle(centerX, centerY, 100000, 100000, hexColor);
			bg.setOrigin(0.5, 0.5);
			bg.setScrollFactor(0); 
			bg.setDepth(-1);       
			
		} else {
			const key = `bg_${pathName}`;
			if (scene.textures.exists(key)) {
				bg = scene.add.sprite(centerX, centerY, key);
				bg.setOrigin(0.5, 0.5);
				bg.setScrollFactor(0); 
				bg.setDepth(-1);       
				
				const scaleX = scene.scale.width / bg.width;
				const scaleY = scene.scale.height / bg.height;
				const maxScale = Math.max(scaleX, scaleY) * 1.5;
				
				bg.setScale(maxScale);
			}
		}

		if (bg && funkin.play.data.camera && typeof funkin.play.data.camera.addObjToGame === 'function') {
			funkin.play.data.camera.addObjToGame(bg);
		}
	}
}
funkin.play.visuals.stage.CreateBG = CreateBG;