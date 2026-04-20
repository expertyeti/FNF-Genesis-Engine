window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.characters = funkin.play.visuals.characters || {};

/**
 * Constructor de renders visuales para personajes.
 * Resuelve XMLs, animaciones (incluyendo FPS específicos y paths custom), offsets y métricas posicionales de escena.
 */
class CharacterRenderer {
    static async execute(scene, stageName) {
        if (scene.charactersRendered) return;
        scene.charactersRendered = true;

        scene.events?.once('shutdown', () => scene.charactersRendered = false);
        scene.events?.once('destroy', () => scene.charactersRendered = false);

        const chart = funkin.play.chart;
        const loadedChars = funkin.play.characterLoader?.charactersData || {};
        
        const stageData = funkin.play.stageManager?.get() || { scale: 1.0, stage: [{ player: { position: [770, 100] } }, { enemy: { position: [100, 100] } }, { playergf: { position: [400, 130] } }] };

        scene.opponent = await this.buildCharacter(scene, loadedChars.opponents?.[0], chart?.get("metadata.characters.opponent") || "dad", "opponent", stageData);
        scene.spectator = await this.buildCharacter(scene, loadedChars.spectator?.[0], chart?.get("metadata.characters.spectator") || "gf", "spectator", stageData);
        scene.player = await this.buildCharacter(scene, loadedChars.players?.[0], chart?.get("metadata.characters.player") || "bf", "player", stageData);

        scene.activeCharacters = [scene.opponent, scene.spectator, scene.player].filter(c => c);
    }

    static async buildCharacter(scene, charData, defaultName, role, stageData) {
        charData = charData || scene.cache.json.get(defaultName) || scene.cache.json.get(`character_${defaultName}`);
        
        let assetKey = charData?.image || defaultName; 
        const mainExtIndex = assetKey.lastIndexOf('.');
        const mainExt = mainExtIndex !== -1 && (assetKey.length - mainExtIndex <= 5) ? assetKey.substring(mainExtIndex) : '.png';
        if (mainExtIndex !== -1) assetKey = assetKey.substring(0, mainExtIndex);

        charData = charData || this.getFallbackData(assetKey);

        const basePath = window.BASE_URL || "";
        const textureMap = new Map([[assetKey, { imgPath: `${basePath}assets/images/${assetKey}${mainExt}`, xmlPath: `${basePath}assets/images/${assetKey}.xml` }]]);

        charData.animations?.forEach(anim => {
            if (anim.path) {
                const extIdx = anim.path.lastIndexOf('.');
                const customKey = extIdx !== -1 && (anim.path.length - extIdx <= 5) ? anim.path.substring(0, extIdx) : anim.path;
                textureMap.set(customKey, { imgPath: `${basePath}assets/images/${anim.path}`, xmlPath: `${basePath}assets/images/${customKey}.xml` });
                anim.customAssetKey = customKey; 
            }
        });

        const missingKeys = Array.from(textureMap.keys()).filter(key => !scene.textures.exists(key));
        if (missingKeys.length > 0) {
            await new Promise(resolve => {
                let loadedCount = 0;
                missingKeys.forEach(key => {
                    scene.load.atlas(key, textureMap.get(key).imgPath, textureMap.get(key).xmlPath);
                    const check = () => { if (++loadedCount >= missingKeys.length) resolve(); };
                    scene.load.once(`filecomplete-atlas-${key}`, check);
                    scene.load.once('loaderror', (f) => { if (f.key === key) check(); });
                });
                scene.load.start();
            });
        }

        if (!scene.textures.exists(assetKey)) return null;

        textureMap.forEach((_, key) => {
            if (!scene.textures.exists(key)) return;
            if (charData.antialiasing === false) scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
            
            const xmlText = scene.cache.text.get(key) || scene.cache.text.get(`${key}_xml`);
            if (xmlText && funkin.utils?.animations?.sparrow) {
                funkin.utils.animations.sparrow.SparrowParser.fixPhaserSparrow(scene, key, xmlText);
                scene.textures.get(key)?.source.forEach(s => s.update());
            }
        });

        const charSprite = scene.add.sprite(0, 0, assetKey);
        funkin.play.data?.camera?.addObjToGame?.(charSprite);
        
        Object.assign(charSprite, {
            isPlayer: role === "player", isOpponent: role === "opponent", isSpectator: role === "spectator", role,
            animOffsets: new Map(), animKeys: new Map(), danceMode: "idle",
            isSinging: false, isSpecialAnim: false,
            singDuration: charData.singing ?? charData.sing_duration ?? 4.0,
            holdTime: charData.singing ?? charData.sing_duration ?? 4.0,
            cameraPosition: Array.isArray(charData.camera_position) ? charData.camera_position : [0, 0]
        });

        charSprite.setScrollFactor(1); 
        charSprite.setScale((charData.scale ?? 1.0) * (stageData.scale ?? 1.0));
        
        this.setupAnimations(scene, charSprite, charData.animations || this.getFallbackAnimations(), assetKey);

        const lowerKeys = Array.from(charSprite.animOffsets.keys()).map(k => k.toLowerCase());
        const leftIdx = lowerKeys.findIndex(k => k === "danceleft" || k === "dance_left");
        const rightIdx = lowerKeys.findIndex(k => k === "danceright" || k === "dance_right");

        if (leftIdx !== -1 && rightIdx !== -1) {
            charSprite.danceMode = "danceLeftRight";
            charSprite.danceLeftKey = Array.from(charSprite.animOffsets.keys())[leftIdx];
            charSprite.danceRightKey = Array.from(charSprite.animOffsets.keys())[rightIdx];
            charSprite.danced = false;
        }

        this.positionCharacter(charSprite, charData, role, stageData);
        charSprite.setFlipX(charSprite.isPlayer ? !charData.flip_x : !!charData.flip_x);

        charSprite.dance = (forced = false) => {
            if (!forced && charSprite.isSinging) return;
            if (charSprite.danceMode === "danceLeftRight") {
                charSprite.danced = !charSprite.danced;
                CharacterRenderer.playAnim(charSprite, charSprite.danced ? charSprite.danceRightKey : charSprite.danceLeftKey, forced);
            } else {
                CharacterRenderer.playAnim(charSprite, "idle", forced);
            }
        };

        charSprite.on('animationcomplete', (anim) => {
            if (charSprite.isSpecialAnim) {
                charSprite.isSpecialAnim = charSprite.isSinging = false;
                return charSprite.dance(true);
            }
            if (!anim.key.toLowerCase().includes('idle') && !anim.key.toLowerCase().includes('dance') && !charSprite.isSinging) {
                charSprite.dance(true); 
            }
        });

        const extractDir = (data) => data?.direction ?? data?.noteData ?? data?.note?.direction ?? data?.dir ?? (typeof data === "number" ? data : 0);

        const playSingAnim = (sprite, dirIndex, miss = false, isSustain = false) => {
            sprite.isSpecialAnim = false; 
            const animName = `sing${["LEFT", "DOWN", "UP", "RIGHT"][dirIndex % 4] || "UP"}${miss ? 'miss' : ''}`;
            
            CharacterRenderer.playAnim(sprite, animName, !isSustain);
            sprite.isSinging = true;
            
            if (sprite.singTimeout) scene.time?.removeEvent(sprite.singTimeout);
            
            const bpm = window.funkin?.conductor?.bpm?.get?.() ?? window.funkin?.conductor?.bpm ?? 120;
            const holdMs = (sprite.holdTime || 4) * (((60 / (bpm > 0 ? bpm : 120)) * 1000) / 4);

            sprite.singTimeout = scene.time?.delayedCall(holdMs, () => {
                sprite.isSinging = false;
                sprite.dance(true);
            });
        };

        scene.events?.on("noteHit", (d) => charSprite.active && ((d?.isPlayer !== false && charSprite.isPlayer) || (d?.isPlayer === false && charSprite.isOpponent)) && playSingAnim(charSprite, extractDir(d), false, false));
        scene.events?.on("sustainActive", (d) => charSprite.active && ((d?.isPlayer !== false && charSprite.isPlayer) || (d?.isPlayer === false && charSprite.isOpponent)) && playSingAnim(charSprite, extractDir(d), false, true));
        scene.events?.on("opponentNoteHit", (d) => charSprite.active && charSprite.isOpponent && playSingAnim(charSprite, extractDir(d), false, false));
        scene.events?.on("enemyNoteHit", (d) => charSprite.active && charSprite.isOpponent && playSingAnim(charSprite, extractDir(d), false, false));
        scene.events?.on("noteMiss", (d) => charSprite.active && d?.isPlayer !== false && charSprite.isPlayer && playSingAnim(charSprite, extractDir(d), true, false));

        charSprite.dance(true);
        return charSprite;
    }

    static setupAnimations(scene, charSprite, animsArray, assetKey) {
        animsArray.forEach(anim => {
            const targetAssetKey = anim.customAssetKey || assetKey;
            const frames = scene.textures.get(targetAssetKey)?.getFrameNames();
            if (!frames) return;

            const prefix = anim.name || anim.prefix || anim.anim;
            charSprite.animOffsets.set(anim.anim, anim.offsets || [0, 0]);
            
            const fullAnimKey = `${targetAssetKey}_${anim.anim}`;
            charSprite.animKeys.set(anim.anim, fullAnimKey); 
            
            if (!scene.anims.exists(fullAnimKey)) {
                const matched = frames.filter(n => n.startsWith(prefix) && /^[\s_\-a-zA-Z]*\d*$/.test(n.substring(prefix.length)))
                                      .sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));

                const finalFrames = (anim.indices?.length > 0 ? anim.indices.map(i => matched[i]).filter(Boolean) : matched)
                                      .map(f => ({ key: targetAssetKey, frame: f }));

                if (finalFrames.length > 0) {
                    scene.anims.create({ 
                        key: fullAnimKey, 
                        frames: finalFrames, 
                        frameRate: anim.fps ?? 24, 
                        repeat: anim.loop ? -1 : 0 
                    });
                }
            }
        });
    }

    static positionCharacter(charSprite, charData, role, stageData) {
        const roleData = funkin.play.stageManager?.getCharacterData(role);
        const stagePos = roleData?.position || roleData || [0, 0];
        
        if (roleData?.scale !== undefined) charSprite.setScale(charSprite.scaleX * roleData.scale, charSprite.scaleY * roleData.scale);
        if (roleData?.camera_Offset || roleData?.camera_position) charSprite.cameraPosition = roleData.camera_Offset || roleData.camera_position;

        charSprite.setDepth(roleData?.layer ?? (role === 'spectator' ? 10 : (role === 'opponent' ? 11 : 12)));
        
        const frames = charSprite.texture.getFrameNames();
        if (frames?.length > 0) charSprite.setFrame(frames.find(f => f.toLowerCase().includes("idle")) || frames[0]);
        charSprite.setOrigin(0, 0);

        charSprite.baseX = (stagePos[0] + (charData.position?.[0] || 0)) - ((charSprite.width * charSprite.scaleX) / 2);
        charSprite.baseY = (stagePos[1] + (charData.position?.[1] || 0)) - (charSprite.height * charSprite.scaleY);
        charSprite.x = charSprite.baseX;
        charSprite.y = charSprite.baseY;
    }

    static playAnim(charSprite, animName, forced = false) {
        if (!charSprite?.active) return;
        
        const fullAnimKey = charSprite.animKeys?.get(animName) || (charSprite.scene.anims.exists(`${charSprite.texture.key}_${animName}`) ? `${charSprite.texture.key}_${animName}` : null);
        
        if (fullAnimKey && charSprite.scene.anims.exists(fullAnimKey)) {
            charSprite.play(fullAnimKey, !forced);
            
            const offset = charSprite.animOffsets?.get(animName) || [0, 0];
            charSprite.setPosition(charSprite.baseX - offset[0], charSprite.baseY - offset[1]);
            charSprite.currentAnim = animName;
        } else if (charSprite.texture?.key) {
            const frames = charSprite.texture.getFrameNames();
            if (frames?.length > 0) {
                const frameName = frames.find(f => f.startsWith(animName) && /^\d*$/.test(f.substring(animName.length))) || frames.find(f => f.startsWith("idle") && /^\d*$/.test(f.substring(4))) || frames[0];
                charSprite.setFrame(frameName);
                charSprite.currentAnim = animName; 
            }
        }
    }

    static getFallbackData(assetKey) { return { image: assetKey, scale: 1.0, singing: 4, position: [0, 0], camera_position: [0, 0], flip_x: false, animations: this.getFallbackAnimations() }; }
    static getFallbackAnimations() { return [ { anim: "idle", name: "idle", fps: 24, loop: false, offsets: [0,0] }, { anim: "singLEFT", name: "left", fps: 24, loop: false, offsets: [0,0] }, { anim: "singDOWN", name: "down", fps: 24, loop: false, offsets: [0,0] }, { anim: "singUP", name: "up", fps: 24, loop: false, offsets: [0,0] }, { anim: "singRIGHT", name: "right", fps: 24, loop: false, offsets: [0,0] } ]; }
}

funkin.play.visuals.characters.charactersManager = CharacterRenderer;