/**
 * Administrador global de modos de fusión personalizados y nativos de Phaser.
 */
if (typeof Phaser !== 'undefined' && Phaser.BlendModes) {
	Phaser.BlendModes.OVERLAY_CUSTOM = 30;
	Phaser.BlendModes.HARD_LIGHT_CUSTOM = 31;
	Phaser.BlendModes.SOFT_LIGHT_CUSTOM = 32;
	Phaser.BlendModes.COLOR_DODGE_CUSTOM = 33;
	Phaser.BlendModes.COLOR_BURN_CUSTOM = 34;
}

if (typeof Phaser !== 'undefined' && Phaser.GameObjects && Phaser.GameObjects.Sprite) {
	const originalSetBlendMode = Phaser.GameObjects.Sprite.prototype.setBlendMode; 
	
	Phaser.GameObjects.Sprite.prototype.setBlendMode = function(value) {
		let modeStr = (typeof value === 'string') ? value.toUpperCase() : null;
		
		const customModes = {
			'OVERLAY': 30,
			'HARD_LIGHT': 31,
			'SOFT_LIGHT': 32,
			'COLOR_DODGE': 33,
			'COLOR_BURN': 34
		};

		let blendID = null;

		if (modeStr && customModes[modeStr]) {
			blendID = customModes[modeStr];
		} else if (typeof value === 'number' && value >= 30 && value <= 34) {
			blendID = value;
		}

		if (blendID !== null) {
			if (this.scene && this.scene.sys.game.renderer.type === Phaser.WEBGL) {
				const renderer = this.scene.sys.game.renderer;
				
				if (renderer.pipelines && !renderer.pipelines.has('CustomBlendFX')) {
					if (window.funkin && window.funkin.shaders && window.funkin.shaders.CustomBlendFX) {
						renderer.pipelines.addPostPipeline('CustomBlendFX', window.funkin.shaders.CustomBlendFX);
					}
				}

				if (typeof this.setPostPipeline === 'function' && renderer.pipelines.has('CustomBlendFX')) {
					const pipeline = this.setPostPipeline('CustomBlendFX');
					if (pipeline && pipeline.length > 0) {
						pipeline[0].blendType = blendID;
					}
					return this;
				}
			}
		}

		return originalSetBlendMode.call(this, value);
	};
}

class BlendMode {
	/**
	 * @param {Phaser.Game} game 
	 */
	static initPipelines(game) {
		if (!game || game.renderer.type !== Phaser.WEBGL) return;

		const renderer = game.renderer;
		const pipelineName = 'CustomBlendFX';

		if (!renderer.pipelines.has(pipelineName)) {
			if (window.funkin && window.funkin.shaders && window.funkin.shaders.CustomBlendFX) {
				renderer.pipelines.addPostPipeline(pipelineName, window.funkin.shaders.CustomBlendFX);
			}
		}
	}

	/**
	 * Aplica un modo de fusión recursivamente, resolviendo el problema en Containers (como Atlas u Objetos Complejos).
	 * @param {Phaser.GameObjects.GameObject} gameObject 
	 * @param {string} blendString 
	 */
	static apply(gameObject, blendString) {
		if (!blendString || typeof blendString !== 'string' || !gameObject) return;
		
		const mode = blendString.trim().toUpperCase();

		if ((gameObject.type === 'Container' || gameObject.isRexContainerLite) && gameObject.list) {
			gameObject.list.forEach(child => BlendMode.apply(child, mode));
			return;
		}
		
		const customModes = ['OVERLAY', 'HARD_LIGHT', 'SOFT_LIGHT', 'COLOR_DODGE', 'COLOR_BURN'];
		
		if (customModes.includes(mode)) {
			if (gameObject.scene && gameObject.scene.sys.game.renderer.type === Phaser.WEBGL) {
				const renderer = gameObject.scene.sys.game.renderer;
				
				if (renderer.pipelines && !renderer.pipelines.has('CustomBlendFX')) {
					if (window.funkin && window.funkin.shaders && window.funkin.shaders.CustomBlendFX) {
						renderer.pipelines.addPostPipeline('CustomBlendFX', window.funkin.shaders.CustomBlendFX);
					}
				}

				if (typeof gameObject.setPostPipeline === 'function' && renderer.pipelines.has('CustomBlendFX')) {
					const pipeline = gameObject.setPostPipeline('CustomBlendFX');
					if (pipeline && pipeline.length > 0) {
						pipeline[0].blendType = Phaser.BlendModes[`${mode}_CUSTOM`];
					}
					return;
				}
			}
		}
		
		if (Phaser.BlendModes.hasOwnProperty(mode)) {
			if (typeof gameObject.setBlendMode === 'function') {
				gameObject.setBlendMode(Phaser.BlendModes[mode]);
			}
		} else if (mode === 'ERASE') {
			if (typeof gameObject.setBlendMode === 'function') {
				gameObject.setBlendMode(Phaser.BlendModes.ERASE);
			}
		}
	}
}

window.funkin = window.funkin || {};
window.funkin.play = window.funkin.play || {};
window.funkin.play.BlendMode = BlendMode;