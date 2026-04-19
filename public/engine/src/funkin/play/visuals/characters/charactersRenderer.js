/**
 * @file CharacterRenderer.js
 * Constructor maestro de personajes. Recibe los JSON completos, carga texturas dinámicamente,
 * aplica Pixel Art (nearest) si es necesario, y renderiza desde el pivote inferior central.
 * INCLUYE: Soporte para notas Sustain mediante eventos continuos de Strumlines.
 */

window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.characters = funkin.play.visuals.characters || {};

class CharacterRenderer {
    static async execute(scene, stageName) {
        if (scene.charactersRendered) return;
        scene.charactersRendered = true;

        scene.events.once('shutdown', () => { scene.charactersRendered = false; });
        scene.events.once('destroy', () => { scene.charactersRendered = false; });

        const fallbackBf = funkin.play.chart ? (funkin.play.chart.get("metadata.characters.player") || "bf") : "bf";
        const fallbackDad = funkin.play.chart ? (funkin.play.chart.get("metadata.characters.opponent") || "dad") : "dad";
        const fallbackGf = funkin.play.chart ? (funkin.play.chart.get("metadata.characters.spectator") || "gf") : "gf";

        let loadedChars = {};
        if (funkin.play.characterLoader && funkin.play.characterLoader.charactersData) {
            loadedChars = funkin.play.characterLoader.charactersData;
        }

        const bfData = (Array.isArray(loadedChars.players) && loadedChars.players.length > 0) ? loadedChars.players[0] : null;
        const dadData = (Array.isArray(loadedChars.opponents) && loadedChars.opponents.length > 0) ? loadedChars.opponents[0] : null;
        const gfData = (Array.isArray(loadedChars.spectator) && loadedChars.spectator.length > 0) ? loadedChars.spectator[0] : null;

        let stageData = funkin.play.stageManager ? funkin.play.stageManager.get() : null;
        
        if (!stageData || (!stageData.stage && !stageData.characters)) {
            stageData = { 
                scale: 1.0, 
                stage: [
                    { player: { position: [770, 100] } }, 
                    { enemy: { position: [100, 100] } }, 
                    { playergf: { position: [400, 130] } } 
                ] 
            };
        }

        scene.opponent = await this.buildCharacter(scene, dadData, fallbackDad, "opponent", stageData);
        scene.spectator = await this.buildCharacter(scene, gfData, fallbackGf, "spectator", stageData);
        scene.player = await this.buildCharacter(scene, bfData, fallbackBf, "player", stageData);

        if (scene.spectator) scene.spectator.setDepth(10);
        if (scene.opponent) scene.opponent.setDepth(11);
        if (scene.player) scene.player.setDepth(12);

        scene.activeCharacters = [scene.opponent, scene.spectator, scene.player].filter(c => c !== null);
    }

    static async buildCharacter(scene, charData, defaultName, role, stageData) {
        if (!charData) {
            charData = scene.cache.json.get(defaultName) || scene.cache.json.get(`character_${defaultName}`);
        }

        let assetKey = defaultName; 
        if (charData && charData.image) assetKey = charData.image; 

        if (!charData) charData = this.getFallbackData(assetKey, role);

        if (!scene.textures.exists(assetKey)) {
            const basePath = window.BASE_URL || "";
            const pngUrl = `${basePath}assets/images/${assetKey}.png`;
            const xmlUrl = `${basePath}assets/images/${assetKey}.xml`;

            await new Promise((resolve) => {
                scene.load.atlas(assetKey, pngUrl, xmlUrl);
                scene.load.once(`filecomplete-atlas-${assetKey}`, () => resolve());
                scene.load.once('loaderror', (fileObj) => { if (fileObj.key === assetKey) resolve(); });
                scene.load.start();
            });
        }

        if (!scene.textures.exists(assetKey)) {
            console.error(`[CharacterRenderer] ❌ Error: No se pudo cargar la textura para "${assetKey}".`);
            return null;
        }

        if (charData.antialiasing === false) {
            scene.textures.get(assetKey).setFilter(Phaser.Textures.FilterMode.NEAREST);
        }

        if (funkin.utils && funkin.utils.animations && funkin.utils.animations.sparrow) {
            const xmlText = scene.cache.text.get(assetKey) || scene.cache.text.get(`${assetKey}_xml`);
            if (xmlText) {
                funkin.utils.animations.sparrow.SparrowParser.fixPhaserSparrow(scene, assetKey, xmlText);
                const tex = scene.textures.get(assetKey);
                if (tex && tex.source) tex.source.forEach(s => s.update());
            }
        }

        const charSprite = scene.add.sprite(0, 0, assetKey);
        
        if (funkin.play.data?.camera?.addObjToGame) {
            funkin.play.data.camera.addObjToGame(charSprite);
        }
        
        charSprite.setScrollFactor(1); 
        charSprite.anims.timeScale = 1; 
        
        charSprite.isPlayer = role === "player";
        charSprite.isOpponent = role === "opponent";
        charSprite.isSpectator = role === "spectator";
        charSprite.role = role;
        
        charSprite.animOffsets = new Map();
        charSprite.danceMode = "idle"; 
        
        charSprite.isSinging = false;
        charSprite.singDuration = charData.singing !== undefined ? charData.singing : (charData.sing_duration || 4.0);
        charSprite.holdTime = charSprite.singDuration;
        
        let camPosRaw = charData.camera_position || [0, 0];
        if (!Array.isArray(camPosRaw)) camPosRaw = [0, 0];
        charSprite.cameraPosition = camPosRaw;

        const charScale = charData.scale !== undefined ? charData.scale : 1.0;
        const stageScale = stageData.scale !== undefined ? stageData.scale : 1.0;
        charSprite.setScale(charScale * stageScale);
        
        const anims = (charData.animations && Array.isArray(charData.animations)) ? charData.animations : this.getFallbackAnimations();
        this.setupAnimations(scene, charSprite, anims, assetKey);

        if (charSprite.animOffsets.has("danceLeft") && charSprite.animOffsets.has("danceRight")) {
            charSprite.danceMode = "danceLeftRight";
            charSprite.danced = false;
        }

        this.positionCharacter(charSprite, charData, role, stageData);

        if (charSprite.isPlayer) {
            charSprite.setFlipX(!charData.flip_x); 
        } else {
            charSprite.setFlipX(!!charData.flip_x);
        }

        charSprite.dance = (forced = false) => {
            if (!forced && charSprite.isSinging) return;

            if (!forced && charSprite.anims && charSprite.anims.isPlaying) {
                const currentAnim = charSprite.anims.currentAnim ? charSprite.anims.currentAnim.key.toLowerCase() : "";
                if (!currentAnim.includes("idle") && !currentAnim.includes("dance")) return; 
            }

            if (charSprite.danceMode === "danceLeftRight") {
                charSprite.danced = !charSprite.danced;
                CharacterRenderer.playAnim(charSprite, charSprite.danced ? "danceRight" : "danceLeft", forced);
            } else {
                CharacterRenderer.playAnim(charSprite, "idle", forced);
            }
        };

        charSprite.on('animationcomplete', (animation, frame) => {
            const animKey = animation.key.toLowerCase();
            if (!animKey.includes('idle') && !animKey.includes('dance')) {
                if (!charSprite.isSinging) charSprite.dance(true); 
            }
        });

        // ---------------- SISTEMA DE INTERCEPCIÓN DE NOTAS ----------------

        const DIR_MAP = ["LEFT", "DOWN", "UP", "RIGHT"];
        
        const extractDirection = (data) => {
            if (typeof data === "number") return data;
            if (data && data.direction !== undefined) return data.direction;
            if (data && data.noteData !== undefined) return data.noteData;
            if (data && data.note && data.note.direction !== undefined) return data.note.direction;
            if (data && data.note && data.note.noteData !== undefined) return data.note.noteData;
            if (data && data.dir !== undefined) return data.dir;
            return 0; 
        };

        // isSustain = true evita forzar el reinicio (ignoreIfPlaying = true)
        const playSingAnim = (sprite, dirIndex, miss = false, isSustain = false) => {
            const dirName = DIR_MAP[dirIndex % 4] || "UP";
            const animName = `sing${dirName}${miss ? 'miss' : ''}`;
            
            const forceRestart = !isSustain; 
            CharacterRenderer.playAnim(sprite, animName, forceRestart);
            
            sprite.isSinging = true;
            if (sprite.singTimeout) {
                if (scene && scene.time) scene.time.removeEvent(sprite.singTimeout);
                sprite.singTimeout = null;
            }
            
            let crochet = 500;
            if (window.funkin?.conductor?.bpm) {
                let bpm = typeof window.funkin.conductor.bpm.get === 'function' ? window.funkin.conductor.bpm.get() : window.funkin.conductor.bpm;
                if (bpm > 0) crochet = (60 / bpm) * 1000;
            }
            const stepCrochet = crochet / 4;
            const holdMs = (sprite.holdTime || 4) * stepCrochet;

            // Reinicia la cuenta regresiva que regresará a idle al terminar
            if (scene && scene.time) {
                sprite.singTimeout = scene.time.delayedCall(holdMs, () => {
                    sprite.isSinging = false;
                    sprite.dance(true);
                });
            }
        };

        // Hit regular
        scene.events.on("noteHit", (data) => {
            if (!charSprite || !charSprite.active) return;
            const dirIndex = extractDirection(data);
            const isPlayerNote = data && data.isPlayer !== false; 
            
            if (isPlayerNote && charSprite.isPlayer) playSingAnim(charSprite, dirIndex, false, false);
            else if (!isPlayerNote && charSprite.isOpponent) playSingAnim(charSprite, dirIndex, false, false);
        });

        // 🚨 SEÑAL CONSTANTE DE LA SUSTAIN CONSUMIÉNDOSE
        scene.events.on("sustainActive", (data) => {
            if (!charSprite || !charSprite.active) return;
            const dirIndex = extractDirection(data);
            const isPlayerNote = data && data.isPlayer !== false; 
            
            // isSustain = true para mantener la animación sin volver al frame 0
            if (isPlayerNote && charSprite.isPlayer) playSingAnim(charSprite, dirIndex, false, true);
            else if (!isPlayerNote && charSprite.isOpponent) playSingAnim(charSprite, dirIndex, false, true);
        });

        scene.events.on("opponentNoteHit", (data) => {
            if (!charSprite || !charSprite.active) return;
            if (charSprite.isOpponent) playSingAnim(charSprite, extractDirection(data), false, false);
        });

        scene.events.on("enemyNoteHit", (data) => {
            if (!charSprite || !charSprite.active) return;
            if (charSprite.isOpponent) playSingAnim(charSprite, extractDirection(data), false, false);
        });

        scene.events.on("noteMiss", (data) => {
            if (!charSprite || !charSprite.active) return;
            const isPlayerNote = data && data.isPlayer !== false; 
            if (isPlayerNote && charSprite.isPlayer) playSingAnim(charSprite, extractDirection(data), true, false);
        });

        charSprite.dance(true);

        return charSprite;
    }

    static setupAnimations(scene, charSprite, animsArray, assetKey) {
        const frameNames = scene.textures.get(assetKey).getFrameNames();

        animsArray.forEach(anim => {
            const animName = anim.anim;
            const prefix = anim.name || anim.prefix || animName;
            const fps = anim.fps || 24;
            const loop = anim.loop || false;
            const offsets = anim.offsets || [0, 0];
            const indices = anim.indices || [];

            charSprite.animOffsets.set(animName, offsets);

            const fullAnimKey = `${assetKey}_${animName}`;
            if (!scene.anims.exists(fullAnimKey)) {
                let matchingFrames = frameNames.filter(name => {
                    if (!name.startsWith(prefix)) return false;
                    const remainder = name.substring(prefix.length);
                    return /^\d*$/.test(remainder); 
                });
                
                matchingFrames.sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));

                let finalFrames = [];

                if (indices.length > 0) {
                    indices.forEach(index => {
                        if (matchingFrames[index]) {
                            finalFrames.push({ key: assetKey, frame: matchingFrames[index] });
                        }
                    });
                } else {
                    finalFrames = matchingFrames.map(frame => ({ key: assetKey, frame: frame }));
                }

                if (finalFrames.length > 0) {
                    scene.anims.create({
                        key: fullAnimKey,
                        frames: finalFrames,
                        frameRate: fps,
                        repeat: loop ? -1 : 0
                    });
                }
            }
        });
    }

    static positionCharacter(charSprite, charData, role, stageData) {
        let stagePos = [0, 0];

        let roleData = funkin.play.stageManager ? funkin.play.stageManager.getCharacterData(role) : null;

        if (roleData) {
            if (roleData.position && Array.isArray(roleData.position)) {
                stagePos = roleData.position;
            } else if (Array.isArray(roleData)) {
                stagePos = roleData;
            }

            if (roleData.scale !== undefined) {
                const newScaleX = charSprite.scaleX * roleData.scale;
                const newScaleY = charSprite.scaleY * roleData.scale;
                charSprite.setScale(newScaleX, newScaleY);
            }

            let camOffsetRaw = roleData.camera_Offset || roleData.camera_position;
            if (Array.isArray(camOffsetRaw) && camOffsetRaw.length >= 2) {
                charSprite.cameraPosition = camOffsetRaw;
            }
        }

        const charOffset = charData.position || [0, 0];

        const frames = charSprite.texture.getFrameNames();
        if (frames && frames.length > 0) {
            const idleFrame = frames.find(f => f.toLowerCase().includes("idle")) || frames[0];
            charSprite.setFrame(idleFrame);
        }

        charSprite.setOrigin(0, 0);

        const widthOffset = (charSprite.width * charSprite.scaleX) / 2;
        const heightOffset = (charSprite.height * charSprite.scaleY);

        charSprite.baseX = (stagePos[0] + charOffset[0]) - widthOffset;
        charSprite.baseY = (stagePos[1] + charOffset[1]) - heightOffset;

        charSprite.x = charSprite.baseX;
        charSprite.y = charSprite.baseY;

        console.log(`[CharacterRenderer] ${role.toUpperCase()} instanciado | Pos: [${charSprite.x}, ${charSprite.y}]`);
    }

    static playAnim(charSprite, animName, forced = false) {
        if (!charSprite || !charSprite.active) return;
        
        const fullAnimKey = `${charSprite.texture.key}_${animName}`;
        if (charSprite.scene.anims.exists(fullAnimKey)) {
            const animDef = charSprite.scene.anims.get(fullAnimKey);
            
            charSprite.play({
                key: fullAnimKey,
                frameRate: animDef.frameRate,
                timeScale: 1
            }, !forced);
            
            if (charSprite.animOffsets.has(animName)) {
                const offset = charSprite.animOffsets.get(animName);
                charSprite.x = charSprite.baseX - offset[0];
                charSprite.y = charSprite.baseY - offset[1];
            } else {
                charSprite.x = charSprite.baseX;
                charSprite.y = charSprite.baseY;
            }
            
            charSprite.currentAnim = animName;
        } else if (charSprite.texture && charSprite.texture.key) {
            const frames = charSprite.texture.getFrameNames();
            if (frames && frames.length > 0) {
                const safeFrame = frames.find(f => f.startsWith(animName) && /^\d*$/.test(f.substring(animName.length))) 
                               || frames.find(f => f.startsWith("idle") && /^\d*$/.test(f.substring(4))) 
                               || frames[0];
                charSprite.setFrame(safeFrame);
            }
        }
    }

    static getFallbackData(assetKey, role) {
        return {
            image: assetKey, scale: 1.0, singing: 4, position: [0, 0],
            camera_position: [0, 0], flip_x: false, animations: this.getFallbackAnimations()
        };
    }

    static getFallbackAnimations() {
        return [
            { anim: "idle", name: "idle", fps: 24, loop: false, offsets: [0,0] },
            { anim: "singLEFT", name: "left", fps: 24, loop: false, offsets: [0,0] },
            { anim: "singDOWN", name: "down", fps: 24, loop: false, offsets: [0,0] },
            { anim: "singUP", name: "up", fps: 24, loop: false, offsets: [0,0] },
            { anim: "singRIGHT", name: "right", fps: 24, loop: false, offsets: [0,0] }
        ];
    }
}

funkin.play.visuals.characters.charactersManager = CharacterRenderer;