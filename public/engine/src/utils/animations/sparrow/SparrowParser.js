/**
 * @file SparrowParser.js
 * Parsea y procesa spritesheets Sparrow (Adobe Animate),
 * aplicando recortes y rotaciones dinámicamente para que sean compatibles con Phaser 3.
 */

class SparrowParser {
  /**
   * Adapta los datos Sparrow XML a un formato de textura compatible con Phaser.
   * @param {Phaser.Scene} scene - La escena activa de Phaser.
   * @param {string} texKey - La clave (key) de la textura cargada.
   * @param {string} xmlText - El contenido en texto plano del archivo XML.
   */
  static fixPhaserSparrow(scene, texKey, xmlText) {
    if (!xmlText || !scene.textures.exists(texKey)) return;

    const texture = scene.textures.get(texKey);
    const sourceImage = texture.getSourceImage();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const subTextures = xmlDoc.getElementsByTagName("SubTexture");

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    for (let i = 0; i < subTextures.length; i++) {
      const node = subTextures[i];
      const name = node.getAttribute("name");
      const rotated = node.getAttribute("rotated") === "true";

      const xmlWidth = parseInt(node.getAttribute("width"), 10) || 0;
      const xmlHeight = parseInt(node.getAttribute("height"), 10) || 0;

      const frameX = node.hasAttribute("frameX")
        ? Math.abs(parseInt(node.getAttribute("frameX"), 10))
        : 0;
      const frameY = node.hasAttribute("frameY")
        ? Math.abs(parseInt(node.getAttribute("frameY"), 10))
        : 0;
      const frameWidth = node.hasAttribute("frameWidth")
        ? parseInt(node.getAttribute("frameWidth"), 10)
        : xmlWidth;
      const frameHeight = node.hasAttribute("frameHeight")
        ? parseInt(node.getAttribute("frameHeight"), 10)
        : xmlHeight;

      const x = parseInt(node.getAttribute("x"), 10) || 0;
      const y = parseInt(node.getAttribute("y"), 10) || 0;

      if (rotated) {
        tempCanvas.width = xmlHeight;
        tempCanvas.height = xmlWidth;
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
        tempCtx.rotate((-90 * Math.PI) / 180);
        tempCtx.drawImage(
          sourceImage,
          x,
          y,
          xmlWidth,
          xmlHeight,
          -xmlWidth / 2,
          -xmlHeight / 2,
          xmlWidth,
          xmlHeight,
        );

        const frameCanvas = document.createElement("canvas");
        frameCanvas.width = tempCanvas.width;
        frameCanvas.height = tempCanvas.height;
        frameCanvas.getContext("2d").drawImage(tempCanvas, 0, 0);

        if (
          typeof Phaser !== "undefined" &&
          Phaser.Textures &&
          Phaser.Textures.TextureSource
        ) {
          const texSource = new Phaser.Textures.TextureSource(
            texture,
            frameCanvas,
          );
          texture.source.push(texSource);
          const sourceIndex = texture.source.length - 1;

          if (texture.frames[name]) {
            delete texture.frames[name];
          }

          const newFrame = texture.add(
            name,
            sourceIndex,
            0,
            0,
            tempCanvas.width,
            tempCanvas.height,
          );
          if (newFrame) {
            newFrame.setTrim(
              frameWidth,
              frameHeight,
              frameX,
              frameY,
              tempCanvas.width,
              tempCanvas.height,
            );
          }
        }
      } else {
        let frame = texture.frames[name];

        if (!frame) {
          frame = texture.add(name, 0, x, y, xmlWidth, xmlHeight);
        }

        if (frame && frame.name !== "__BASE") {
          if (
            frameX !== 0 ||
            frameY !== 0 ||
            frameWidth !== xmlWidth ||
            frameHeight !== xmlHeight
          ) {
            frame.setTrim(
              frameWidth,
              frameHeight,
              frameX,
              frameY,
              xmlWidth,
              xmlHeight,
            );
          }
        }
      }
    }
  }
}

// Inyectamos la clase en nuestro namespace global
funkin.utils.animations.sparrow.SparrowParser = SparrowParser;
