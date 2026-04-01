const fragShader = `
#define SHADER_NAME CUSTOM_BLEND_FS
precision mediump float;

uniform sampler2D uMainSampler;
varying vec2 outTexCoord;
uniform int uBlendMode;

void main() {
	vec4 src = texture2D(uMainSampler, outTexCoord);
	vec3 color = src.rgb;
	
	float luminance = dot(color, vec3(0.299, 0.587, 0.114));

	if (uBlendMode == 30) {
		if (luminance < 0.5) {
			color *= 2.0 * color;
		} else {
			color = 1.0 - 2.0 * (1.0 - color) * (1.0 - color);
		}
	} else if (uBlendMode == 31) {
		if (luminance < 0.5) {
			color = 2.0 * color * color;
		} else {
			color = 1.0 - 2.0 * (1.0 - color) * (1.0 - color);
		}
	} else if (uBlendMode == 32) {
		if (luminance < 0.5) {
			color = 2.0 * color * color + color * color * (1.0 - 2.0 * color);
		} else {
			color = sqrt(color) * (2.0 * color - 1.0) + 2.0 * color * (1.0 - color);
		}
	} else if (uBlendMode == 33) {
		color = color / max(1.0 - luminance, 0.001);
	} else if (uBlendMode == 34) {
		color = 1.0 - (1.0 - color) / max(luminance, 0.001);
	}
	
	gl_FragColor = vec4(clamp(color, 0.0, 1.0), src.a);
}
`;

class CustomBlendFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
	/**
	 * @param {Phaser.Game} game 
	 */
	constructor(game) {
		super({
			game: game,
			fragShader: fragShader
		});
		
		this.blendType = 30;
	}

	onPreRender() {
		this.set1i('uBlendMode', this.blendType);
	}
}

window.funkin = window.funkin || {};
window.funkin.shaders = window.funkin.shaders || {};
window.funkin.shaders.CustomBlendFX = CustomBlendFX;