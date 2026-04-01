/**
 * @file src/funkin/play/visuals/UI/healthBar/barExclude.js
 * Extrae el color rojo puro del centro de la barra para crear el hueco donde irán los colores.
 */

class BarExclude {
    static createHollowBar(scene, originalKey) {
        const newKey = `${originalKey}_hollow`;
        if (scene.textures.exists(newKey)) return newKey;

        const texture = scene.textures.get(originalKey);
        if (!texture || texture.key === '__MISSING') return originalKey;

        const sourceImage = texture.getSourceImage();
        if (!sourceImage) return originalKey;

        const canvas = document.createElement('canvas');
        canvas.width = sourceImage.width;
        canvas.height = sourceImage.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        ctx.drawImage(sourceImage, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            if (r > 180 && g < 50 && b < 50) {
                data[i + 3] = 0; 
            }
        }

        ctx.putImageData(imageData, 0, 0);
        scene.textures.addCanvas(newKey, canvas);
        return newKey;
    }
}

funkin.play = funkin.play || {};
funkin.play.BarExclude = BarExclude;