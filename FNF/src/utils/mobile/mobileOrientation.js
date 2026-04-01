/**
 * @file src/utils/mobileOrientation.js
 * Sistema para forzar pantalla completa y modo horizontal en dispositivos móviles.
 */

class MobileOrientationManager {
    constructor() {
        this.overlay = null;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || navigator.maxTouchPoints > 0;

        if (this.isMobile) {
            this.init();
        }
    }

    init() {
        this.overlay = document.getElementById('orientation-overlay');
        
        if (!this.overlay) {
            console.warn("No se encontro el overlay de orientacion en el DOM.");
            return;
        }

        const btn = document.getElementById('orientation-btn');
        if (btn) {
            btn.addEventListener('click', () => this.enableFullscreenAndLandscape());
        }

        window.addEventListener('resize', () => this.checkOrientation());
        window.addEventListener('orientationchange', () => setTimeout(() => this.checkOrientation(), 200));
        
        document.addEventListener('fullscreenchange', () => this.checkOrientation());
        document.addEventListener('webkitfullscreenchange', () => this.checkOrientation());
        document.addEventListener('mozfullscreenchange', () => this.checkOrientation());
        document.addEventListener('MSFullscreenChange', () => this.checkOrientation());

        setTimeout(() => this.checkOrientation(), 300);
    }

    checkOrientation() {
        if (!this.overlay) return;

        const isPortrait = window.innerHeight > window.innerWidth;
        const isFullscreen = !!(
            document.fullscreenElement || 
            document.webkitFullscreenElement || 
            document.mozFullScreenElement || 
            document.msFullscreenElement
        );

        if (isPortrait || !isFullscreen) {
            this.showOverlay();
        } else {
            this.hideOverlay();
        }
    }

    showOverlay() {
        if(this.overlay) this.overlay.style.display = 'flex';
    }

    hideOverlay() {
        if(this.overlay) this.overlay.style.display = 'none';
    }

    async enableFullscreenAndLandscape() {
        try {
            const docEl = document.documentElement;
            
            if (docEl.requestFullscreen) {
                await docEl.requestFullscreen();
            } else if (docEl.webkitRequestFullscreen) {
                await docEl.webkitRequestFullscreen();
            } else if (docEl.mozRequestFullScreen) {
                await docEl.mozRequestFullScreen();
            } else if (docEl.msRequestFullscreen) {
                await docEl.msRequestFullscreen();
            }

            if (screen.orientation && screen.orientation.lock) {
                await screen.orientation.lock('landscape').catch((e) => {
                    console.warn("Navegador no soporta bloqueo automatico de giro:", e);
                });
            }
        } catch (err) {
            console.warn("Interaccion requerida o API no soportada:", err);
        }

        setTimeout(() => this.checkOrientation(), 500);
    }
}

if (typeof window !== 'undefined') {
    window.mobileOrientationManager = new MobileOrientationManager();
}