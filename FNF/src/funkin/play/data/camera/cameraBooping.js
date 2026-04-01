/**
 * Core module to manage camera booping logic.
 */
class CameraBooping {
  constructor() {
    this.enabled = true; // Global switch
    this.intensities = new Map(); // Store intensity per camera
  }

  /**
   * Sets the intensity multiplier for a specific camera.
   * @param {Phaser.Cameras.Scene2D.Camera} camera
   * @param {number} intensity
   */
  setIntensity(camera, intensity) {
    if (camera) {
      this.intensities.set(camera.name, intensity);
    }
  }

  /**
   * Gets the intensity multiplier for a specific camera.
   * @param {Phaser.Cameras.Scene2D.Camera} camera
   * @returns {number}
   */
  getIntensity(camera) {
    if (!camera) return 1.0;
    return this.intensities.has(camera.name) ? this.intensities.get(camera.name) : 1.0;
  }

  /**
   * Applies the rhythmic jump to a specific camera.
   * @param {Phaser.Cameras.Scene2D.Camera} camera
   * @param {number} [rawZoom=0.5]
   */
  applyBop(camera, rawZoom = 0.5) {
    if (!this.enabled || !camera) return;
    const intensity = this.getIntensity(camera);
    camera.zoom += (rawZoom * intensity);
  }
}

if (typeof window !== "undefined") {
  window.funkin = window.funkin || {};
  funkin.playCamera = funkin.playCamera || {};
  funkin.playCamera.booping = new CameraBooping();
}