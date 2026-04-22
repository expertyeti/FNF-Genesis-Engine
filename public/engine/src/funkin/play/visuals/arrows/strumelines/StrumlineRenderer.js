/**
 * @file StrumlineRenderer.js
 * Clase monolítica Strumlines (Parte Gráfica): Inyecta la creación de sprites, texturas, animaciones y fondos a la clase principal.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.arrows = funkin.play.visuals.arrows || {};
funkin.play.visuals.arrows.strumelines = funkin.play.visuals.arrows.strumelines || {};

if (funkin.play.visuals.arrows.strumelines.Strumlines) {
    const StrumlinesProto = funkin.play.visuals.arrows.strumelines.Strumlines.prototype;

    // ============================================================================
    // INICIALIZACIÓN DE SPRITES
    // ============================================================================
    StrumlinesProto.initStrums = function() {
        if (!this.bgGraphics) {
            this.bgGraphics = this.scene.add.graphics();
            this.bgGraphics.setDepth(1900);
            this.bgGraphics.setScrollFactor(0);
        }

        for (let i = 0; i < this.keyCount; i++) {
            this.opponentStrums.push(this.createStrum(i, false));
            this.playerStrums.push(this.createStrum(i, true));
        }

        this.loadSkin();
    };

    StrumlinesProto.createStrum = function(lane, isPlayer) {
        const strum = this.scene.add.sprite(-5000, -5000, '');
        strum.lane = lane;
        strum.isPlayer = isPlayer;
        strum.resetTime = 0;
        strum.setDepth(2000);
        strum.setScrollFactor(0);
        
        this.setupAnimator(strum);
        
        if (funkin.play.data.camera && funkin.play.data.camera.addObjToUI) {
            funkin.play.data.camera.addObjToUI(strum);
        }
        return strum;
    };

    // ============================================================================
    // GESTIÓN DE SKINS Y TEXTURAS
    // ============================================================================
    StrumlinesProto.loadSkin = function() {
        if (!funkin.play || !funkin.play.uiSkins) return;
        
        // ¡EL ARREGLO! Buscar la clave correcta de las skins de tu motor
        let skinData = funkin.play.uiSkins.get("gameplay.strumline");
        if (!skinData) skinData = funkin.play.uiSkins.get("gameplay.strums");
        if (!skinData) return;

        const assetKey = funkin.play.uiSkins.getAssetKey(skinData.assetPath);
        
        // --- APLICAR FILTRO ANTIALIASING ---
        if (this.scene.textures.exists(assetKey)) {
            const isAntialiased = typeof funkin.play.uiSkins.getAntialiasing === 'function' ? funkin.play.uiSkins.getAntialiasing() : true;
            const filterMode = isAntialiased ? Phaser.Textures.FilterMode.LINEAR : Phaser.Textures.FilterMode.NEAREST;
            this.scene.textures.get(assetKey).setFilter(filterMode);
        }
        // ------------------------------------

        const scale = skinData.scale !== undefined ? skinData.scale : 0.7;

        const setupSide = (strums) => {
            strums.forEach(strum => {
                strum.setTexture(assetKey);
                strum.setScale(scale);
                strum.baseScale = scale;
                
                const NoteDir = funkin.play.visuals.arrows.notes.NoteDirection || window.funkin.NoteDirection;
                const dirName = NoteDir ? NoteDir.getDirectionName(strum.lane) : ["left", "down", "up", "right"][strum.lane % 4];
                
                // Forzar carga de la animación si no existe
                this.loadAnimations(strum, assetKey, skinData.animations, dirName);
                
                // Darle un instante a Phaser para setear la textura antes de reproducir
                this.scene.time.delayedCall(1, () => {
                    if(strum && strum.playAnim) strum.playAnim('static');
                });
            });
        };

        setupSide(this.opponentStrums);
        setupSide(this.playerStrums);
    };

    // ============================================================================
    // GESTIÓN DE ANIMACIONES
    // ============================================================================
    StrumlinesProto.setupAnimator = function(strum) {
        const scene = this.scene;
        strum.playAnim = function(animName, forced = false) {
            const NoteDir = funkin.play.visuals.arrows.notes.NoteDirection || window.funkin.NoteDirection;
            const dirName = NoteDir ? NoteDir.getDirectionName(this.lane) : ["left", "down", "up", "right"][this.lane % 4];
            
            // ¡Nombres alineados con ArrowsSpawner!
            const fullAnim = `${this.texture.key}_strum_${animName}_${dirName}`;
            
            if (scene.anims.exists(fullAnim)) {
                this.play(fullAnim, forced);
                this.currentAction = animName;
            } else if (this.texture.key) {
                // Fallback de emergencia si la animación falla
                const frames = this.texture.getFrameNames();
                if (frames && frames.length > 0) {
                    const fallback = frames.find(f => f.includes(dirName) && f.includes(animName)) || frames[0];
                    this.setFrame(fallback);
                }
            }
        };
    };

    StrumlinesProto.loadAnimations = function(strum, assetKey, animsDataMaster, dirName) {
        if (!animsDataMaster || !animsDataMaster[dirName]) return;
        const animsData = animsDataMaster[dirName];
        const scene = this.scene;
        const frameNames = scene.textures.get(assetKey).getFrameNames();

        Object.keys(animsData).forEach(action => {
            const prefixToSearch = animsData[action];
            const animName = `${assetKey}_strum_${action}_${dirName}`;

            if (!scene.anims.exists(animName)) {
                // ¡Parseo Correcto para Sparrow XML de FNF!
                const matchingFrames = frameNames.filter((name) => name.startsWith(prefixToSearch));
                matchingFrames.sort();

                if (matchingFrames.length > 0) {
                    scene.anims.create({
                        key: animName,
                        frames: matchingFrames.map((frame) => ({ key: assetKey, frame: frame })),
                        frameRate: 24,
                        repeat: action === 'static' ? -1 : 0
                    });
                }
            }
        });
    };

    // ============================================================================
    // GESTIÓN DEL FONDO OSCURO (Lanes Background)
    // ============================================================================
    StrumlinesProto.drawBgLayout = function(layoutCtx) {
        if (!this.bgGraphics) return;
        this.bgGraphics.clear();
        if (!layoutCtx) return;

        const drawBgForSide = (centerX, spacing, scale, gap) => {
            const height = this.scene.cameras.main.height * 2;
            const singleWidth = 160 * scale; 
            const totalWidth = (spacing * (this.keyCount - 1)) + singleWidth; 
            const rectX = centerX - (totalWidth / 2);
            
            this.bgGraphics.fillStyle(0x000000, layoutCtx.bgOpacity !== undefined ? layoutCtx.bgOpacity : 0.5);
            
            if (gap && gap > 0) {
                const halfWidth = (totalWidth - gap) / 2;
                this.bgGraphics.fillRect(rectX, -100, halfWidth, height);
                this.bgGraphics.fillRect(rectX + halfWidth + gap, -100, halfWidth, height);
            } else {
                this.bgGraphics.fillRect(rectX, -100, totalWidth, height);
            }
        };

        if (layoutCtx.showOppBg) {
            drawBgForSide(layoutCtx.centerOpponent, layoutCtx.oppSpacing, layoutCtx.oppScale, layoutCtx.gapOpp);
        }
        if (layoutCtx.showPlayerBg) {
            drawBgForSide(layoutCtx.centerPlayer, layoutCtx.playerSpacing, layoutCtx.playerScale, layoutCtx.gapPlayer);
        }
    };
} else {
    console.error("Strumlines no está definido. Asegúrate de cargar StrumlineLogic.js primero.");
}