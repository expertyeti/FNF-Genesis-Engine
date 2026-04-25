// src/utils/animations/sparrow/SparrowParser.js

window.funkin = window.funkin || {};
funkin.utils = funkin.utils || {};
funkin.utils.animations = funkin.utils.animations || {};
funkin.utils.animations.sparrow = funkin.utils.animations.sparrow || {};

class SparrowParser {
  static fixPhaserSparrow(scene, texKey, xmlText) {
    if (!xmlText || !scene.textures.exists(texKey)) return;

    const texture = scene.textures.get(texKey);
    const sourceImage = texture.getSourceImage();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const subTextures = xmlDoc.getElementsByTagName("SubTexture");

    let hasRotated = false;
    let currentX = 0, currentY = 0, maxRowHeight = 0, reqW = 0, reqH = 0;
    const MAX_TEX_WIDTH = 2048; 
    const packData = new Array(subTextures.length);

    // primer pase: empaquetar coordenadas pa UN solo canvas
    for (let i = 0; i < subTextures.length; i++) {
      const node = subTextures[i];
      const rotated = node.getAttribute("rotated") === "true";
      packData[i] = { rotated: rotated };

      if (rotated) {
        hasRotated = true;
        const xmlWidth = parseInt(node.getAttribute("width"), 10) || 0;
        const xmlHeight = parseInt(node.getAttribute("height"), 10) || 0;
        const rw = xmlHeight;
        const rh = xmlWidth;

        if (currentX + rw > MAX_TEX_WIDTH) {
          currentX = 0;
          currentY += maxRowHeight;
          maxRowHeight = 0;
        }

        packData[i].packX = currentX;
        packData[i].packY = currentY;
        packData[i].rw = rw;
        packData[i].rh = rh;

        currentX += rw;
        maxRowHeight = Math.max(maxRowHeight, rh);
        reqW = Math.max(reqW, currentX);
        reqH = Math.max(reqH, currentY + maxRowHeight);
      }
    }

    let rotatedCtx = null;
    let rotatedSourceIndex = 0;

    if (hasRotated) {
      const rotatedCanvas = document.createElement("canvas");
      rotatedCanvas.width = Math.max(1, reqW);
      rotatedCanvas.height = Math.max(1, reqH);
      rotatedCtx = rotatedCanvas.getContext("2d", { willReadFrequently: true });

      // subimos el mini-atlas rotado como unica fuente adicional a webgl
      const texSource = new Phaser.Textures.TextureSource(texture, rotatedCanvas);
      texture.source.push(texSource);
      rotatedSourceIndex = texture.source.length - 1;
    }

    // segundo pase: pintar texturas d vdd
    for (let i = 0; i < subTextures.length; i++) {
      const node = subTextures[i];
      const name = node.getAttribute("name");
      const data = packData[i];

      const xmlWidth = parseInt(node.getAttribute("width"), 10) || 0;
      const xmlHeight = parseInt(node.getAttribute("height"), 10) || 0;
      const frameX = node.hasAttribute("frameX") ? Math.abs(parseInt(node.getAttribute("frameX"), 10)) : 0;
      const frameY = node.hasAttribute("frameY") ? Math.abs(parseInt(node.getAttribute("frameY"), 10)) : 0;
      const frameWidth = node.hasAttribute("frameWidth") ? parseInt(node.getAttribute("frameWidth"), 10) : xmlWidth;
      const frameHeight = node.hasAttribute("frameHeight") ? parseInt(node.getAttribute("frameHeight"), 10) : xmlHeight;
      const x = parseInt(node.getAttribute("x"), 10) || 0;
      const y = parseInt(node.getAttribute("y"), 10) || 0;

      if (data.rotated) {
        rotatedCtx.save();
        
        rotatedCtx.translate(data.packX + data.rw / 2, data.packY + data.rh / 2);
        rotatedCtx.rotate((-90 * Math.PI) / 180);
        rotatedCtx.drawImage(
          sourceImage,
          x, y, xmlWidth, xmlHeight,
          -xmlWidth / 2, -xmlHeight / 2, xmlWidth, xmlHeight
        );
        rotatedCtx.restore();

        if (texture.frames[name] && texture.frames[name].name !== "__BASE") {
          delete texture.frames[name];
        }

        const newFrame = texture.add(name, rotatedSourceIndex, data.packX, data.packY, data.rw, data.rh);
        if (newFrame) {
          newFrame.setTrim(frameWidth, frameHeight, frameX, frameY, data.rw, data.rh);
        }
      } else {
        let frame = texture.frames[name];
        if (!frame) {
          frame = texture.add(name, 0, x, y, xmlWidth, xmlHeight);
        }
        if (frame && frame.name !== "__BASE") {
          if (frameX !== 0 || frameY !== 0 || frameWidth !== xmlWidth || frameHeight !== xmlHeight) {
            frame.setTrim(frameWidth, frameHeight, frameX, frameY, xmlWidth, xmlHeight);
          }
        }
      }
    }

    if (hasRotated && texture.source[rotatedSourceIndex]) {
      texture.source[rotatedSourceIndex].update();
    }
  }
}

funkin.utils.animations.sparrow.SparrowParser = SparrowParser;