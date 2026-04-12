/**
 * @file public/engine/src/core/native/isMobile.js
 * Namespace que detecta globalmente si el dispositivo es móvil.
 */
window.funkin = window.funkin || {};

window.funkin.mobile = (function () {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // Comprobación de User Agent y capacidad táctil (incluyendo iPads modernos)
  return (
    /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      ua,
    ) ||
    (navigator.maxTouchPoints > 0 && /Macintosh|Android/.test(ua))
  );
})();
