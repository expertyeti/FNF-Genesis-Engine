/**
 * Calcula el ancho panorámico ideal basado en el aspect ratio actual de la ventana.
 * @returns {number} El ancho calculado para el juego.
 */
function calculatePanoramicWidth() {
    const gameHeight = 720;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const windowRatio = window.innerWidth / window.innerHeight;
    const baseRatio = 1280 / 720; // 16:9

    if (windowRatio > baseRatio) {
        if (isMobile) { // Mobile
            return Math.ceil(gameHeight * windowRatio);
        } else { // PC
            const maxAspectRatio = 20 / 9; 
            const clampedRatio = Math.min(windowRatio, maxAspectRatio);
            return Math.ceil(gameHeight * clampedRatio);
        }
    }
    
    return 1280;
}

/**
 * Genera y retorna el objeto de configuración de Phaser adaptado a pantallas panorámicas.
 * @returns {Phaser.Types.Core.GameConfig}
 */
function getPanoramicConfig() {
    return {
        type: Phaser.AUTO,
        parent: "game-container",
        width: calculatePanoramicWidth(),
        height: 720,
        dom: {
            createContainer: true
        },
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        autoFocus: true,
        disableContextMenu: true,
        scene: [],
        title: "Genesis Engine",
        version: "1.0"
    };
}

/**
 * Agrega un escuchador al navegador para actualizar la resolución de Phaser dinámicamente.
 * @param {Phaser.Game} game - La instancia global del juego.
 */
function setupPanoramicResize(game) {
    let resizeTimeout;

    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        
        resizeTimeout = setTimeout(() => {
            if (game && game.isRunning && game.scale) {
                const newWidth = calculatePanoramicWidth();
                
                if (game.scale.gameSize.width !== newWidth) {
                    game.scale.setGameSize(newWidth, 720);
                }
            }
        }, 100);
    });
}

if (typeof window !== 'undefined') {
    window.getPanoramicConfig = getPanoramicConfig;
    window.setupPanoramicResize = setupPanoramicResize;
}