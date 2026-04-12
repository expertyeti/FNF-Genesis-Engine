/**
 * @file public/engine/src/funkin/play/visuals/arrows/strumelines/middlescroll/MiddlescrollHandler.js
 */
window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.strumlines = funkin.play.visuals.arrows.strumlines || {};
funkin.play.visuals.arrows.strumlines.middlescroll = funkin.play.visuals.arrows.strumlines.middlescroll || {};

class MiddlescrollHandler {
    static calculate(scene, keyCount) {
        // DETECTOR DE TECLADO (Puro, sin ensuciar el localStorage)
        if (scene && scene.input && scene.input.keyboard && !scene._strumKeyboardDetectorAdded) {
            scene.input.keyboard.on('keydown', () => {
                if (window.funkin.isKeyboardActive) return;
                window.funkin.isKeyboardActive = true;
                if (scene.strumlines && window.funkin.play.visuals.arrows.strumlines.StrumlineLayout) {
                    window.funkin.play.visuals.arrows.strumlines.StrumlineLayout.updateLayout(scene.strumlines);
                }
            });
            scene._strumKeyboardDetectorAdded = true;
        }

        // DETECTOR DE TOUCH (Puro, sin ensuciar el localStorage)
        if (scene && scene.input && !scene._strumTouchDetectorAdded) {
            scene.input.on('pointerdown', (pointer) => {
                const isTouch = pointer.pointerType === 'touch' || (window.funkin.mobile && pointer.pointerType !== 'mouse');
                if (isTouch && window.funkin.isKeyboardActive) {
                    window.funkin.isKeyboardActive = false;
                    if (scene.strumlines && window.funkin.play.visuals.arrows.strumlines.StrumlineLayout) {
                        window.funkin.play.visuals.arrows.strumlines.StrumlineLayout.updateLayout(scene.strumlines);
                    }
                }
            });
            scene._strumTouchDetectorAdded = true;
        }

        const getStoredOption = (key) => {
            if (typeof funkin !== 'undefined' && funkin.play && funkin.play.options && funkin.play.options[key] !== undefined) return funkin.play.options[key];
            try {
                const keys = ['genesis_options', 'funkin_options', 'options', 'play_options', 'game_options'];
                for (let i = 0; i < keys.length; i++) {
                    let val = localStorage.getItem(keys[i]);
                    if (val) {
                        let p = JSON.parse(val);
                        if (p[key] !== undefined) return p[key];
                        if (p.play && p.play.options && p.play.options[key] !== undefined) return p.play.options[key];
                        if (p.options && p.options[key] !== undefined) return p.options[key];
                    }
                }
            } catch(e) {}
            if (key === "mobileSchedule") return "arrow";
            return false;
        };

        const screenWidth = scene.cameras.main.width;
        const screenHeight = scene.cameras.main.height;
        const keys = keyCount || 4;
        const edgeMargin = screenWidth * 0.04;

        const isDownscroll = getStoredOption("downscroll") === true;
        const playAsOpponent = getStoredOption("playAsOpponent") === true;
        const isTwoPlayer = getStoredOption("twoPlayerLocal") === true;
        const showBg = getStoredOption("strumlineBg") === true;
        let bgOpacity = getStoredOption("laneOpacity");
        if (bgOpacity === false || bgOpacity === undefined) bgOpacity = 0.5;

        const skinData = window.funkin.play.uiSkins ? window.funkin.play.uiSkins.get("gameplay.strumline") : null;
        const skinScale = skinData ? skinData.scale : 0.7;

        const offsetPixels = isDownscroll ? 150 : 50;
        const DEFAULT_Y = isDownscroll ? (screenHeight - offsetPixels) : offsetPixels;
        const sideOffset = isDownscroll ? -30 : 30;
        const BASE_SPACING = 118;

        const ctx = {
            screenWidth, screenHeight, keys, edgeMargin,
            isDownscroll, playAsOpponent, showBg, bgOpacity,
            skinScale, DEFAULT_Y, sideOffset, BASE_SPACING
        };

        let midScrollOption = getStoredOption("middlescroll");

        // SI ESTÁ EN 2 PLAYER LOCAL: Forzamos temporalmente a falso (Default FNF Layout normal)
        // Esto evita que las flechas se monten en el medio, arruinando el espacio del P2.
        if (isTwoPlayer) {
            midScrollOption = false;
        }

        const msNamespace = funkin.play.visuals.arrows.strumlines.middlescroll;

        switch (midScrollOption) {
            case true: return msNamespace.NormalMode.calculate(ctx);
            case "narrow": return msNamespace.NarrowMode.calculate(ctx);
            case "wide": return msNamespace.WideMode.calculate(ctx);
            case "split": return msNamespace.SplitMode.calculate(ctx);
            default: return msNamespace.DefaultMode.calculate(ctx); // <- Este es el modo "Normal" (Layout estándar de FNF)
        }
    }
}

funkin.play.visuals.arrows.strumlines.middlescroll.MiddlescrollHandler = MiddlescrollHandler;