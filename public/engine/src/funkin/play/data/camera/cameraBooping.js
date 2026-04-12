/**
 * @file cameraBooping.js
 * Módulo central para manejar la lógica de "booping" (saltos rítmicos) de las cámaras.
 */
class CameraBooping {
  constructor() {
    this.enabled = true; 
    this.intensities = new Map(); 
  }

  /**
   * Establece el multiplicador de intensidad para una cámara específica.
   */
  setIntensity(camera, intensity) {
    if (camera) {
      this.intensities.set(camera.name, intensity);
    }
  }

  /**
   * Obtiene el multiplicador de intensidad.
   */
  getIntensity(camera) {
    if (!camera) return 1.0;
    return this.intensities.has(camera.name) ? this.intensities.get(camera.name) : 1.0;
  }

  /**
   * Aplica el salto rítmico a la cámara.
   */
  applyBop(camera, rawZoom = 0.5) {
    if (!this.enabled || !camera) return;
    const intensity = this.getIntensity(camera);
    camera.zoom += (rawZoom * intensity);
  }
}

// Inyectamos la clase y creamos la instancia global en el namespace correcto
funkin.play.data.camera.CameraBooping = CameraBooping;
funkin.play.data.camera.booping = new CameraBooping();