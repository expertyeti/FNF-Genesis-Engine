/**
 * @file src/funkin/play/visuals/UI/judgment/text/botplayText.js
 * Clase independiente que gestiona el texto de BOTPLAY.
 */

class BotplayText {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;

    this.text = scene.add.text(0, 0, "BOTPLAY", {
      fontFamily: "vcr",
      fontSize: "36px",
      color: "#FFFFFF",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5).setAlpha(0);

    // Profundidad base súper alta para que nunca quede detrás del fondo
    this.text.setDepth(2000);

    this.alphaTarget = 0;
    this.tween = null;

    if (funkin.playCamera && funkin.playCamera.addObjToGame) {
      funkin.playCamera.addObjToGame(this.text);
    } else {
      this.text.setScrollFactor(0);
    }
  }

  /**
   * @param {number} time
   * @param {number} delta
   */
  update(time, delta) {
    if (window.autoplay) {
      const isOpponent = funkin.play?.options?.playAsOpponent === true;
      let charSprite = null;

      // Buscar el sprite correcto directamente en stageCharacters para evitar nulos
      if (this.scene.stageCharacters) {
        charSprite = isOpponent ? this.scene.stageCharacters.enemy : this.scene.stageCharacters.player;
      }

      if (charSprite && charSprite.active) {
        this.text.setVisible(charSprite.visible);
        
        // Nos aseguramos de que el texto siempre se renderice por encima del personaje
        this.text.setDepth(charSprite.depth + 10);
        
        if (charSprite.scrollFactorX !== undefined) {
           this.text.setScrollFactor(charSprite.scrollFactorX, charSprite.scrollFactorY);
        }

        // Calculamos el centro X y el tope Y del sprite considerando su origin dinámico
        const originX = charSprite.originX !== undefined ? charSprite.originX : 0;
        const originY = charSprite.originY !== undefined ? charSprite.originY : 0;
        
        const centerX = charSprite.x + (charSprite.displayWidth * (0.5 - originX));
        const topY = charSprite.y - (charSprite.displayHeight * originY);
        
        this.text.x = centerX;
        this.text.y = topY - 35; // Lo posicionamos 35px por encima de la cabeza

      } else {
        // Fallback ultra-seguro por si el escenario no tiene personajes (ej. centrado arriba)
        this.text.setVisible(true);
        this.text.x = this.scene.scale.width / 2;
        this.text.y = 150;
        this.text.setScrollFactor(0);
        this.text.setDepth(2000);
      }

      // Animación de parpadeo (Pulse effect)
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

      // Aplicamos el parpadeo. Si el personaje tiene alpha, lo multiplicamos
      const baseAlpha = charSprite ? charSprite.alpha : 1;
      this.text.setAlpha(this.alphaTarget * baseAlpha);

    } else {
      // Ocultar al momento de apagar el BOTPLAY
      this.text.setVisible(false);
      this.text.setAlpha(0);
      
      if (this.tween) {
        this.tween.stop();
        this.tween = null;
      }
    }
  }

  destroy() {
    if (this.text) {
      this.text.destroy();
    }
    if (this.tween) {
      this.tween.stop();
    }
  }
}

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.BotplayText = BotplayText;