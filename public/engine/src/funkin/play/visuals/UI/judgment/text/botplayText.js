/**
 * @file src/funkin/play/visuals/UI/judgment/text/botplayText.js
 */
window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.ui = funkin.play.visuals.ui || {};

class BotplayText {
  constructor(scene) {
    this.scene = scene;

    // Función auxiliar para crear el texto de manera idéntica a tu código
    const createText = () => {
        const text = scene.add.text(0, 0, "BOTPLAY", {
          fontFamily: "vcr",
          fontSize: "36px",
          color: "#FFFFFF",
          stroke: "#000000",
          strokeThickness: 4,
        }).setOrigin(0.5, 0.5).setAlpha(0);

        text.setDepth(2000);

        if (funkin.play?.data?.camera && funkin.play.data.camera.addObjToGame) {
          funkin.play.data.camera.addObjToGame(text);
        } else {
          text.setScrollFactor(0);
        }
        return text;
    };

    // Crear dos instancias (P1 y P2)
    this.textP1 = createText();
    this.textP2 = createText();

    this.alphaTarget = 0;
    this.tween = null;
  }

  update(time, delta) {
    const isBotplay = window.autoplay || funkin.play?.options?.botplay === true;

    if (isBotplay) {
      const isTwoPlayer = funkin.play?.options?.twoPlayerLocal === true;
      const isOpponent = funkin.play?.options?.playAsOpponent === true;

      // 1. Manejo del Tween (Opacidad y parpadeo original)
      if (!this.tween || !this.tween.isPlaying()) {
        this.alphaTarget = 0;
        this.tween = this.scene.tweens.add({
          targets: this,
          alphaTarget: 1,
          duration: 400,
          ease: "Sine.easeInOut",
          yoyo: true,
          hold: 1300,
          onComplete: () => {
            this.alphaTarget = 0;
          }
        });
      }

      // 2. Determinar personajes (P1 y P2)
      let charP1 = null;
      let charP2 = null;

      if (this.scene.stageCharacters) {
          charP1 = (isOpponent && !isTwoPlayer) ? this.scene.stageCharacters.enemy : this.scene.stageCharacters.player;
          if (isTwoPlayer) {
              charP2 = this.scene.stageCharacters.enemy;
          }
      }

      // 3. Actualizar textos
      this.updateTextObj(this.textP1, charP1);
      
      if (isTwoPlayer) {
          this.updateTextObj(this.textP2, charP2);
      } else {
          this.textP2.setVisible(false);
          this.textP2.setAlpha(0);
      }

    } else {
      // Si no es botplay, apagar todo y detener animaciones
      this.textP1.setVisible(false);
      this.textP1.setAlpha(0);
      
      this.textP2.setVisible(false);
      this.textP2.setAlpha(0);
      
      if (this.tween) {
        this.tween.stop();
        this.tween = null;
      }
    }
  }

  updateTextObj(textObj, charSprite) {
    if (charSprite && charSprite.active) {
      textObj.setVisible(charSprite.visible);
      textObj.setDepth(charSprite.depth + 10);
      
      if (charSprite.scrollFactorX !== undefined) {
         textObj.setScrollFactor(charSprite.scrollFactorX, charSprite.scrollFactorY);
      }

      const originX = charSprite.originX !== undefined ? charSprite.originX : 0;
      const originY = charSprite.originY !== undefined ? charSprite.originY : 0;
      
      const centerX = charSprite.x + (charSprite.displayWidth * (0.5 - originX));
      const topY = charSprite.y - (charSprite.displayHeight * originY);
      
      textObj.x = centerX;
      textObj.y = topY - 35; 

      const baseAlpha = charSprite.alpha !== undefined ? charSprite.alpha : 1;
      textObj.setAlpha(this.alphaTarget * baseAlpha);
    } else {
      // Fallback si el personaje no se ha renderizado
      textObj.setVisible(true);
      textObj.x = this.scene.scale.width / 2;
      textObj.y = 150;
      textObj.setScrollFactor(0);
      textObj.setDepth(2000);
      textObj.setAlpha(this.alphaTarget);
    }
  }

  destroy() {
    if (this.textP1) this.textP1.destroy();
    if (this.textP2) this.textP2.destroy();
    if (this.tween) this.tween.stop();
  }
}

funkin.play.visuals.ui.BotplayText = BotplayText;