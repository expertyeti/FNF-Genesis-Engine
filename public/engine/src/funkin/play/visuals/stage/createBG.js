/**
 * @file createBG.js
 * Genera el fondo base del escenario. En modo simple, coloca un placeholder optimizado.
 */
class CreateBG {
  static execute(scene, stageName) {
    const isSimpleMode = funkin.play.options?.simpleMode === true;
    const width = scene.scale.width;
    const height = scene.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // --- LÓGICA DE MODO SIMPLE ---
    if (isSimpleMode) {
      const key = "menuBG";

      // 1. Siempre ponemos un color base ultra oscuro al fondo por seguridad
      let baseColor = scene.add.rectangle(
        centerX,
        centerY,
        width * 2,
        height * 2,
        0x050505,
      );
      baseColor.setScrollFactor(0);
      baseColor.setDepth(-20);
      if (
        funkin.play.data.camera &&
        typeof funkin.play.data.camera.addObjToGame === "function"
      ) {
        funkin.play.data.camera.addObjToGame(baseColor);
      }

      // 2. Creamos la imagen INMEDIATAMENTE (aunque no tenga textura aún)
      let bgImage = scene.add.image(centerX, centerY, "__MISSING"); // '__MISSING' es una textura vacía de Phaser
      bgImage.setVisible(false); // La ocultamos hasta que esté lista
      bgImage.setScrollFactor(0);
      bgImage.setDepth(-10); // Enfrente del color base

      // 3. La vinculamos a la cámara YA MISMO. Así la cámara no se la pierde.
      if (
        funkin.play.data.camera &&
        typeof funkin.play.data.camera.addObjToGame === "function"
      ) {
        funkin.play.data.camera.addObjToGame(bgImage);
      }

      const defaultKey = "menuBG";
      const alternateKey = "menuBackground";
      const menuBgPath =
        (window.BASE_URL || "") + "assets/images/menu/bg/menuBG.png";

      // 4. Función para inyectar la textura cuando exista
      const applyTexture = (textureKey) => {
        bgImage.setTexture(textureKey);
        bgImage.setVisible(true);

        // Escalar correctamente para cubrir la pantalla
        if (bgImage.width > 0 && bgImage.height > 0) {
          const scaleX = width / bgImage.width;
          const scaleY = height / bgImage.height;
          bgImage.setScale(Math.max(scaleX, scaleY));
        }
      };

      const useTextureKey = (textureKey, message) => {
        if (message) console.log(message);
        applyTexture(textureKey);
      };

      // 5. Comprobamos si ya existe la textura en cache
      if (scene.textures.exists(defaultKey)) {
        useTextureKey(defaultKey);
      } else if (scene.textures.exists(alternateKey)) {
        useTextureKey(
          alternateKey,
          "Modo Simple: usando 'menuBackground' existente como fallback.",
        );
      } else {
        console.log("Modo Simple: cargando menuBG para modo simple...");
        scene.load.image(defaultKey, menuBgPath);

        scene.load.once("complete", () => {
          if (scene.textures.exists(defaultKey)) {
            useTextureKey(
              defaultKey,
              "Modo Simple: Textura menuBG inyectada con éxito tras carga.",
            );
          } else {
            console.warn(
              "Modo Simple: 'menuBG' nunca cargó. Se mantiene el color base.",
            );
          }
        });

        if (!scene.load.isLoading()) {
          scene.load.start();
        }
      }

      return; // Salimos para no ejecutar el modo normal
    }

    // --- LÓGICA DE MODO NORMAL (STAGE REAL) ---
    const data = funkin.play.stageManager.get();
    if (!data || !data.background) return;

    const pathName = data.pathName || stageName;
    let normalBg = null;

    if (data.background.startsWith("#")) {
      const hexColor = Phaser.Display.Color.HexStringToColor(
        data.background,
      ).color;
      normalBg = scene.add.rectangle(
        centerX,
        centerY,
        width * 4,
        height * 4,
        hexColor,
      );
      normalBg.setOrigin(0.5, 0.5);
      normalBg.setScrollFactor(0);
      normalBg.setDepth(-10);
    } else {
      const key = `bg_${pathName}`;
      if (scene.textures.exists(key)) {
        normalBg = scene.add.image(centerX, centerY, key);
        normalBg.setOrigin(0.5, 0.5);
        normalBg.setScrollFactor(0);
        normalBg.setDepth(-10);

        const scaleX = width / normalBg.width;
        const scaleY = height / normalBg.height;
        const maxScale = Math.max(scaleX, scaleY) * 1.2;
        normalBg.setScale(maxScale);
      }
    }

    // Añadir a la cámara de juego
    if (
      normalBg &&
      funkin.play.data.camera &&
      typeof funkin.play.data.camera.addObjToGame === "function"
    ) {
      funkin.play.data.camera.addObjToGame(normalBg);
    }
  }
}

funkin.play.visuals.stage.CreateBG = CreateBG;
