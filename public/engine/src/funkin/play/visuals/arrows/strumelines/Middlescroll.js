/**
 * @file Middlescroll.js
 * Handler de los layouts en pantalla, delegando los cálculos del Y central a StrumlineConfig.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};

funkin.play.visuals.arrows.strumelines = funkin.play.visuals.arrows.strumelines || {};
funkin.play.visuals.arrows.strumlines = funkin.play.visuals.arrows.strumelines; 
funkin.play.visuals.arrows.strumelines.middlescroll = funkin.play.visuals.arrows.strumelines.middlescroll || {};

const msNamespace = funkin.play.visuals.arrows.strumelines.middlescroll;

// ============================================================================
// MODOS DE LAYOUT
// ============================================================================
msNamespace.DefaultMode = class {
    static calculate(ctx) {
        return {
            oppY: ctx.DEFAULT_Y, 
            playerY: ctx.DEFAULT_Y, 
            centerOpponent: ctx.screenWidth * 0.25, 
            centerPlayer: ctx.screenWidth * 0.75, 
            oppScale: ctx.skinScale, 
            playerScale: ctx.skinScale, 
            oppAlpha: 1.0, 
            playerAlpha: 1.0, 
            oppSpacing: ctx.BASE_SPACING, 
            playerSpacing: ctx.BASE_SPACING, 
            showOppBg: ctx.showBg, 
            showPlayerBg: ctx.showBg, 
            gapPlayer: 0, gapOpp: 0, 
            oppDownscroll: ctx.isDownscroll, 
            playerDownscroll: ctx.isDownscroll, 
            playAsOpponent: ctx.playAsOpponent, 
            bgOpacity: ctx.bgOpacity
        };
    }
};

msNamespace.NormalMode = class {
    static calculate(ctx) {
        const layout = msNamespace.DefaultMode.calculate(ctx);
        const activeSpacing = ctx.BASE_SPACING;

        if (ctx.playAsOpponent) {
            layout.playerScale = ctx.skinScale * 0.55;
            layout.playerSpacing = ctx.BASE_SPACING * 0.60;
            layout.playerAlpha = 0.35;
            layout.showPlayerBg = false;

            layout.centerOpponent = ctx.screenWidth / 2;
            layout.oppScale = ctx.skinScale;
            layout.oppSpacing = activeSpacing;

            const playerWidthHalf = (layout.playerSpacing * (ctx.keys - 1)) / 2;
            layout.centerPlayer = ctx.screenWidth - ctx.edgeMargin - playerWidthHalf;
        } else {
            layout.oppScale = ctx.skinScale * 0.55;
            layout.oppSpacing = ctx.BASE_SPACING * 0.60;
            layout.oppAlpha = 0.35;
            layout.showOppBg = false;

            layout.centerPlayer = ctx.screenWidth / 2;
            layout.playerScale = ctx.skinScale;
            layout.playerSpacing = activeSpacing;

            const oppWidthHalf = (layout.oppSpacing * (ctx.keys - 1)) / 2;
            layout.centerOpponent = ctx.edgeMargin + oppWidthHalf;
        }
        return layout;
    }
};

msNamespace.NarrowMode = class {
    static calculate(ctx) {
        const layout = msNamespace.NormalMode.calculate(ctx);
        if (ctx.playAsOpponent) layout.oppSpacing = 112;
        else layout.playerSpacing = 112;
        return layout;
    }
};

msNamespace.WideMode = class {
    static calculate(ctx) {
        const layout = msNamespace.NormalMode.calculate(ctx);
        if (ctx.playAsOpponent) layout.oppSpacing = 145;
        else layout.playerSpacing = 145;
        return layout;
    }
};

msNamespace.SplitMode = class {
    static calculate(ctx) {
        const layout = msNamespace.DefaultMode.calculate(ctx);
        layout.centerOpponent = ctx.screenWidth / 2;
        layout.centerPlayer = ctx.screenWidth / 2;
        if (ctx.playAsOpponent) {
            layout.gapPlayer = ctx.screenWidth * 0.55;
            layout.showOppBg = false;
        } else {
            layout.gapOpp = ctx.screenWidth * 0.55;
            layout.showPlayerBg = false;
        }
        return layout;
    }
};

// ============================================================================
// HANDLER PRINCIPAL
// ============================================================================
msNamespace.MiddlescrollHandler = class {
    static calculate(scene, keyCount) {
        const getStoredOption = (key) => {
            if (funkin.play && funkin.play.options && funkin.play.options[key] !== undefined) return funkin.play.options[key];
            try {
                const val = localStorage.getItem("fnf_" + key) || localStorage.getItem(key);
                if (val === "true") return true;
                if (val === "false") return false;
                if (!isNaN(parseFloat(val))) return parseFloat(val);
                return val;
            } catch(e) {}
            return false;
        };

        const screenWidth = scene.cameras.main.width || 1280;
        const screenHeight = scene.cameras.main.height || 720;
        const keys = keyCount || 4;
        const edgeMargin = screenWidth * 0.04;

        const isDownscroll = getStoredOption("downscroll") === true;
        const playAsOpponent = getStoredOption("playAsOpponent") === true;
        const isTwoPlayer = getStoredOption("twoPlayerLocal") === true;
        const showBg = getStoredOption("strumlineBg") === true;
        let bgOpacity = getStoredOption("laneOpacity");
        if (bgOpacity === false || bgOpacity === undefined) bgOpacity = 0.5;

        const skinData = window.funkin.play.uiSkins ? window.funkin.play.uiSkins.get("gameplay.strumline") : null;
        const skinScale = skinData && skinData.scale !== undefined ? skinData.scale : 0.7;

        const ConfigClass = funkin.play.visuals.arrows.strumelines.StrumlineConfig;
        
        // DEFAULT_Y representa el CENTRO MATEMÁTICO de la flecha.
        const DEFAULT_Y = ConfigClass.calculateCenterY(screenHeight, isDownscroll);

        const ctx = {
            screenWidth, screenHeight, keys, edgeMargin,
            isDownscroll, playAsOpponent, showBg, bgOpacity,
            skinScale, DEFAULT_Y, sideOffset: isDownscroll ? -30 : 30, BASE_SPACING: 118
        };

        let midScrollOption = getStoredOption("middlescroll");
        if (isTwoPlayer) midScrollOption = false;

        switch (midScrollOption) {
            case true: return msNamespace.NormalMode.calculate(ctx);
            case "narrow": return msNamespace.NarrowMode.calculate(ctx);
            case "wide": return msNamespace.WideMode.calculate(ctx);
            case "split": return msNamespace.SplitMode.calculate(ctx);
            default: return msNamespace.DefaultMode.calculate(ctx); 
        }
    }
};