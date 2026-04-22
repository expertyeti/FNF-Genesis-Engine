window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.notes = funkin.play.visuals.arrows.notes || {};

/**
 * Renderizador visual de Hold Covers basado en datos de la UI Skin activa.
 */
class HoldCoverSkin {
    constructor(manager) {
        this.manager = manager;
        this.scene = manager.scene;
        this.skinData = null;
    }

    reloadSkin(triggerDrops = false) {
        if (!funkin.play?.uiSkins) return;
        this.skinData = funkin.play.uiSkins.get("gameplay.holdCovers") || funkin.play.uiSkins.get("holdCovers");
        this.setupAnimations();

        if (triggerDrops) {
            const reloadSide = (covers, isPlayer) => {
                covers.forEach((cover, i) => {
                    if (cover?.active) {
                        cover.stop?.();
                        this.manager.logic.onSustainDrop({ lane: i, isPlayer, id: cover.sustainId });
                        this.manager.logic.onSustainStart({ lane: i, isPlayer, id: cover.sustainId });
                    }
                });
            };
            reloadSide(this.manager.activeCovers.player, true);
            reloadSide(this.manager.activeCovers.opponent, false);
        }
    }

    setupAnimations() {
        if (!this.skinData?.directions) return;

        this.manager.directions.forEach((dir) => {
            const dirData = this.skinData.directions[dir];
            if (!dirData?.assetPath) return;

            const assetKey = funkin.play.uiSkins?.getAssetKey(dirData.assetPath);
            if (!assetKey || !this.scene.textures.exists(assetKey)) return;

            // --- APLICAR FILTRO ANTIALIASING ---
            const isAntialiased = typeof funkin.play.uiSkins.getAntialiasing === 'function' ? funkin.play.uiSkins.getAntialiasing() : true;
            const filterMode = isAntialiased ? Phaser.Textures.FilterMode.LINEAR : Phaser.Textures.FilterMode.NEAREST;
            this.scene.textures.get(assetKey).setFilter(filterMode);
            // ------------------------------------

            const rawXML = this.scene.cache.text.get(`${assetKey}_rawXML`);
            if (rawXML) {
                funkin.utils.animations?.sparrow?.SparrowParser?.fixPhaserSparrow(this.scene, assetKey, rawXML);
                this.scene.textures.get(assetKey)?.source.forEach((s) => s.update());
            }

            const chroma = dirData.chromaKey || this.skinData.chromaKey;
            if (chroma) funkin.play.uiSkins?.applyChromaKey(this.scene, assetKey, chroma);

            const frameNames = this.scene.textures.get(assetKey).getFrameNames();

            ["start", "hold", "end"].forEach((type) => {
                const prefix = dirData.animations?.[type];
                if (!prefix) return;

                const animName = `${assetKey}_cover_${dir}_${type}`;
                if (this.scene.anims.exists(animName)) return;

                const cleanPrefix = prefix.trim().toLowerCase().replace(/\s+/g, "");
                const matched = frameNames.filter(n => n.startsWith(prefix) || n.trim().toLowerCase().replace(/\s+/g, "").startsWith(cleanPrefix)).sort();

                if (matched.length > 0) {
                    this.scene.anims.create({
                        key: animName,
                        frames: matched.map(frame => ({ key: assetKey, frame })),
                        frameRate: 24,
                        repeat: type === "hold" ? -1 : 0,
                    });
                }
            });
        });
    }

    getAssetKeyAndAnims(dirName) {
        const dirData = this.skinData?.directions?.[dirName];
        if (!dirData) return null;
        
        return {
            assetKey: funkin.play.uiSkins?.getAssetKey(dirData.assetPath),
            animsConfig: dirData.animations,
            dirData: dirData,
        };
    }
}
funkin.play.visuals.arrows.notes.HoldCoverSkin = HoldCoverSkin;