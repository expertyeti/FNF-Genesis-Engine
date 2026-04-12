/**
 * @file src/funkin/play/data/playScene/TwoPlayerLocal.js
 */
window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.data = funkin.play.data || {};

class TwoPlayerLocal {
    static init() {
        const options = window.funkin.play.options;
        if (!funkin.controls) return;

        // BLOQUEO MÓVIL: No permitir 2 Jugadores Locales en táctil
        if (window.funkin.mobile) {
            options.twoPlayerLocal = false;
            try { localStorage.setItem("fnf_twoPlayerLocal", "false"); } catch(e){}
            return;
        }

        if (options.twoPlayerLocal) {
            funkin.controls.applyTwoPlayerSplit();
        } else {
            funkin.controls.restoreBinds();
        }
    }
}

funkin.play.data.TwoPlayerLocal = TwoPlayerLocal;