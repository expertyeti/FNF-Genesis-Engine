/**
 * @class SoundTrayLogic
 * Plugin global para controlar el volumen maestro del juego y su persistencia.
 */
class SoundTrayLogic {
  constructor() {
    if (!window.pluginsEventBus) {
      window.pluginsEventBus = new Phaser.Events.EventEmitter();
    }

    window.pluginsEventBus.on('init_plugins', this.init, this);

    this.scene = null;
    this.currentVolume = 1;
    this.isMuted = false;
    this.isNativeVolume = false;
    this.isBlurred = false;
    this.volumeTween = null;
  }

  /**
   * Inicializa la lógica del volumen detectando el entorno.
   *
   * @param {Phaser.Scene} scene - La escena actual.
   */
  async init(scene) {
    this.scene = scene;

    const currentEnv = window.funkin.device.get();
    const isMobileOS = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    this.isNativeVolume = currentEnv === 'capacitor' || (currentEnv === 'web' && isMobileOS);

    // ¡CRÍTICO! Registramos los eventos ANTES del await. 
    // Así evitamos que un fallo asíncrono en web bloquee los controles.
    scene.events.on('update', this.update, this);
    scene.game.events.on('blur', this.onWindowBlur, this);
    scene.game.events.on('focus', this.onWindowFocus, this);

    try {
      if (this.isNativeVolume) {
        this.currentVolume = 1;
        this.isMuted = false;
        console.log(`Volumen gestionado por sistema nativo. (Entorno: ${currentEnv})`);
      } else {
        const savedVolume = await window.funkin.storage.get('global_volume');
        const savedMute = await window.funkin.storage.get('global_mute');

        // Parseo seguro con validación
        const parsedVolume = parseFloat(savedVolume);
        this.currentVolume = !isNaN(parsedVolume) ? parsedVolume : 1;
        this.isMuted = savedMute === 'true';
        console.log(`Volumen gestionado por SoundTray. (Entorno: ${currentEnv})`);
      }
    } catch (error) {
      console.warn('Error leyendo el storage del volumen, aplicando valores por defecto.', error);
      this.currentVolume = 1;
      this.isMuted = false;
    }

    // Doble validación de seguridad contra estados corruptos
    if (isNaN(this.currentVolume)) this.currentVolume = 1;

    if (scene.game.sound) {
      scene.game.sound.setVolume(this.currentVolume);
      scene.game.sound.mute = this.isMuted;
    }
  }

  /**
   * Reduce el volumen drásticamente cuando la ventana pierde el foco.
   */
  onWindowBlur() {
    if (!this.scene || this.isMuted || this.isNativeVolume) return;
    this.isBlurred = true;
    if (this.volumeTween) this.volumeTween.stop();
    this.volumeTween = this.scene.tweens.add({
      targets: this.scene.game.sound,
      volume: this.currentVolume * 0.2,
      duration: 500,
      ease: 'Sine.easeOut',
    });
  }

  /**
   * Restaura el volumen cuando la ventana recupera el foco.
   */
  onWindowFocus() {
    if (!this.scene || this.isMuted || this.isNativeVolume) return;
    this.isBlurred = false;
    if (this.volumeTween) this.volumeTween.stop();
    this.volumeTween = this.scene.tweens.add({
      targets: this.scene.game.sound,
      volume: this.currentVolume,
      duration: 500,
      ease: 'Sine.easeIn',
    });
  }

  /**
   * Bucle de actualización que escucha los inputs de volumen.
   */
  update() {
    // Si el volumen lo maneja el hardware o la ventana está desenfocada, ignoramos inputs
    if (this.isNativeVolume || !window.funkin || !window.funkin.controls || this.isBlurred) return;

    if (window.funkin.controls.VOL_MUTE_P) {
      this.isMuted = !this.isMuted;
      if (this.scene && this.scene.game.sound) this.scene.game.sound.mute = this.isMuted;
      
      try {
        window.funkin.storage.save('global_mute', this.isMuted.toString());
      } catch (e) {}
      
      window.pluginsEventBus.emit('volume_changed', this.currentVolume, this.isMuted, 'mute');
    }

    if (window.funkin.controls.VOL_UP_P) {
      this.changeVolume(0.1, 'up');
    }

    if (window.funkin.controls.VOL_DOWN_P) {
      this.changeVolume(-0.1, 'down');
    }
  }

  /**
   * Modifica el volumen global del juego de manera segura.
   *
   * @param {number} amount - Cantidad a sumar o restar.
   * @param {string} action - 'up' o 'down'.
   */
  changeVolume(amount, action) {
    let newVol = this.currentVolume + amount;
    
    // Rescate si el cálculo da NaN por algún motivo
    if (isNaN(newVol)) newVol = 1;

    newVol = Phaser.Math.Clamp(Math.round(newVol * 10) / 10, 0, 1);

    if (this.currentVolume !== newVol) {
      this.currentVolume = newVol;

      if (!this.isBlurred && this.scene && this.scene.game.sound) {
        this.scene.game.sound.setVolume(this.currentVolume);
      }

      try {
        window.funkin.storage.save('global_volume', this.currentVolume.toString());
      } catch (error) {
        console.warn('Fallo al guardar volumen en Web Storage', error);
      }

      if (this.isMuted && amount > 0) {
        this.isMuted = false;
        if (this.scene && this.scene.game.sound) this.scene.game.sound.mute = false;
        
        try {
          window.funkin.storage.save('global_mute', 'false');
        } catch (e) {}
      }
    }
    window.pluginsEventBus.emit('volume_changed', this.currentVolume, this.isMuted, action);
  }
}

window.soundTrayPlugin = new SoundTrayLogic();