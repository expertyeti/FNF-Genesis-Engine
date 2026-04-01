/**
 * @class SoundTrayVisual
 * Plugin global para mostrar la interfaz visual del volumen con imágenes y animaciones.
 */
class SoundTrayVisual {
  constructor() {
    if (!window.pluginsEventBus) {
      window.pluginsEventBus = new Phaser.Events.EventEmitter();
    }

    window.pluginsEventBus.on('preload_plugins', this.preload, this);
    window.pluginsEventBus.on('init_plugins', this.init, this);

    this.scene = null;
    this.trayContainer = null;
    this.barSprite = null;
    this.hideTimer = null;

    this.offScreenY = -150; 
    this.onScreenY = 10; 
  }

  /**
   * Precarga los recursos visuales y auditivos del SoundTray.
   *
   * @param {Phaser.Scene} scene - La escena actual.
   */
  preload(scene) {
    scene.load.audio('vol_down', 'public/sounds/soundtray/Voldown.ogg');
    scene.load.audio('vol_up', 'public/sounds/soundtray/Volup.ogg');
    scene.load.audio('vol_max', 'public/sounds/soundtray/VolMAX.ogg');

    scene.load.image('volumebox', 'public/images/ui/soundtray/volumebox.png');

    for (let i = 1; i <= 10; i++) {
      scene.load.image(`bars_${i}`, `public/images/ui/soundtray/bars_${i}.png`);
    }
  }

  /**
   * Inicializa el componente visual.
   *
   * @param {Phaser.Scene} scene - La escena actual.
   */
  init(scene) {
    this.scene = scene;
    console.log('UI Gráfica y sonidos del SoundTray registrados.');

    this.createVisuals();

    window.pluginsEventBus.on('volume_changed', this.onVolumeChanged, this);
  }

  /**
   * Crea el contenedor y los sprites de la barra de volumen.
   */
  createVisuals() {
    const centerX = this.scene.scale.width / 2;

    this.trayContainer = this.scene.add.container(centerX, this.offScreenY);
    this.trayContainer.setAlpha(0);
    this.trayContainer.setDepth(99999);

    this.trayContainer.setScale(0.65);

    const baseBars = this.scene.add.sprite(0, 15, 'bars_10');
    baseBars.setOrigin(0.5, 0);
    baseBars.setAlpha(0.5);

    const bgBox = this.scene.add.sprite(0, 0, 'volumebox');
    bgBox.setOrigin(0.5, 0);

    this.barSprite = this.scene.add.sprite(0, 15, 'bars_10');
    this.barSprite.setOrigin(0.5, 0);

    this.trayContainer.add([baseBars, bgBox, this.barSprite]);
  }

  /**
   * Ejecuta efectos visuales y auditivos al cambiar el volumen.
   *
   * @param {number} currentVolume - El nivel de volumen actual sincronizado.
   * @param {boolean} isMuted - Si está o no silenciado el juego.
   * @param {string} action - 'up', 'down' o 'mute'.
   */
  onVolumeChanged(currentVolume, isMuted, action) {
    if (action === 'up') {
      if (currentVolume >= 1 && !isMuted) {
        this.scene.sound.play('vol_max');
      } else {
        this.scene.sound.play('vol_up');
      }
    } else if (action === 'down') {
      this.scene.sound.play('vol_down');
    }

    this.showVisualTray(currentVolume, isMuted);
  }

  /**
   * Anima la entrada del panel y ajusta la barra visual.
   *
   * @param {number} currentVolume - El nivel de volumen actual.
   * @param {boolean} isMuted - Si el juego está silenciado.
   */
  showVisualTray(currentVolume, isMuted) {
    let barLevel = Math.round(currentVolume * 10);

    if (isMuted || currentVolume <= 0.01) {
      barLevel = 0;
    } else if (barLevel === 0 && currentVolume > 0) {
      barLevel = 1;
    }

    if (barLevel > 0) {
      this.barSprite.setVisible(true);
      this.barSprite.setTexture(`bars_${barLevel}`);
    } else {
      this.barSprite.setVisible(false);
    }

    this.scene.tweens.killTweensOf(this.trayContainer);

    if (this.trayContainer.alpha === 0) {
      this.trayContainer.y = this.offScreenY;
    }

    this.scene.tweens.add({
      targets: this.trayContainer,
      y: this.onScreenY,
      alpha: 1,
      duration: 300,
      ease: 'Back.out',
    });

    if (this.hideTimer) this.hideTimer.remove();

    this.hideTimer = this.scene.time.delayedCall(1500, () => {
      this.scene.tweens.add({
        targets: this.trayContainer,
        y: this.offScreenY,
        alpha: 0,
        duration: 400,
        ease: 'Power2.in',
      });
    });
  }
}

window.soundTrayVisualPlugin = new SoundTrayVisual();