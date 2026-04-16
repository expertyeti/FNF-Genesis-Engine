/**
 * @file src/funkin/play/data/playScene/GPUWarming.js
 * Arquitectura de calentamiento estático para VRAM y buffers de audio.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.data = funkin.play.data || {};
funkin.play.data.clean = funkin.play.data.clean || {};

class GPUWarming {
    /**
     * Fuerza la transferencia de texturas a la GPU y la decodificación de audio
     * para prevenir bloqueos en el Main Thread durante la instanciación.
     * * @param {Phaser.Scene} scene - La escena activa de Phaser.
     * @returns {Promise<void>} Promesa que resuelve cuando la memoria está estabilizada.
     */
    static async execute(scene) {
        return new Promise((resolve) => {
            const textureKeys = scene.textures.getTextureKeys();
            const tempSprites = [];

            for (let i = 0; i < textureKeys.length; i++) {
                const key = textureKeys[i];
                
                if (key === '__DEFAULT' || key === '__MISSING') continue;

                const spr = scene.add.sprite(-5000, -5000, key);
                spr.setAlpha(0.01); 
                spr.setActive(false);
                tempSprites.push(spr);
            }

            const audioKeys = scene.cache.audio.getKeys();
            
            for (let i = 0; i < audioKeys.length; i++) {
                const key = audioKeys[i];
                if (scene.sound) {
                    const tempSound = scene.sound.add(key);
                    tempSound.play({ volume: 0 });
                    tempSound.stop();
                    tempSound.destroy();
                }
            }

            scene.time.delayedCall(50, () => {
                for (let i = 0; i < tempSprites.length; i++) {
                    tempSprites[i].destroy();
                }
                resolve();
            });
        });
    }
}

funkin.play.data.clean.GPUWarming = GPUWarming;