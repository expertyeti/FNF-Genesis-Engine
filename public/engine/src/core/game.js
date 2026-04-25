/**
 * calcula el ancho panoramico ideal basado en el aspect ratio actual de la ventana.
 * @returns {number} el ancho calculado para el juego.
 */
function calculatePanoramicWidth() {
  const gameHeight = 720;
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  const windowRatio = window.innerWidth / window.innerHeight;
  const baseRatio = 1280 / 720; // 16:9

  if (windowRatio > baseRatio) {
    if (isMobile) {
      // mobile
      return Math.ceil(gameHeight * windowRatio);
    } else {
      // pc
      const maxAspectRatio = 20 / 9;
      const clampedRatio = Math.min(windowRatio, maxAspectRatio);
      return Math.ceil(gameHeight * clampedRatio);
    }
  }

  return 1280;
}

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: calculatePanoramicWidth(),
  height: 720,
  dom: {
    createContainer: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  callbacks: {
    preBoot: function (game) {
      game.registry.set("debugMode", true); 
    }
  },
  autoFocus: true,
  disableContextMenu: true,
  scene: [],
  title: "Genesis Engine",
  version: "1.0",
};

window.GAME_COMMIT = "";
window.game = new Phaser.Game(config);

// inicializacion de neutralino y fix del crash de memoria al salir
if (typeof Neutralino !== 'undefined') {
    Neutralino.init();

    Neutralino.events.on('windowClose', () => {
        if (window.game) {
            // forzamos a phaser a destruir todo y soltar webgl
            window.game.destroy(true);
        }
        // cerramos el proceso de pc seguro
        Neutralino.app.exit();
    });
}