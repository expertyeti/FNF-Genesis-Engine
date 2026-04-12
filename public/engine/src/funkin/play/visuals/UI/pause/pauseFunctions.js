/**
 * @file src/funkin/play/visuals/UI/pause/pauseFunctions.js
 */
class PauseFunctions {
    static resume(pauseScene) {
        const playScene = pauseScene.playScene;
        if (!playScene) return;

        pauseScene.stopMusic();

        let isDuringCountdown = false;
        if (funkin.conductor && funkin.conductor.songPosition < 0) {
            isDuringCountdown = true;
        }

        if (playScene.resumeWithCountdown && !isDuringCountdown) {
            pauseScene.pauseMenu.setVisible(false); 
            
            let steps = ["three", "two", "one", "go"];
            let currentStep = 0;

            let bpm = 100;
            if (funkin.play && funkin.play.chart && typeof funkin.play.chart.get === "function") {
                bpm = funkin.play.chart.get("metadata.audio.bpm") || 100;
            }
            const crochet = (60 / bpm) * 1000;

            PauseFunctions.executeCountdownStep(pauseScene, steps[0], crochet);
            currentStep++;

            pauseScene.time.addEvent({
                delay: crochet,
                callback: () => {
                    if (currentStep >= steps.length) {
                        playScene.isGamePaused = false;
                        playScene.scene.resume("PlayScene");
                        
                        if (playScene.sound && typeof playScene.sound.resumeAll === "function") playScene.sound.resumeAll();
                        if (playScene.songPlaylist) {
                            if (typeof playScene.songPlaylist.resume === "function") playScene.songPlaylist.resume("All");
                            else if (typeof playScene.songPlaylist.play === "function") playScene.songPlaylist.play("All");
                        }

                        pauseScene.scene.stop();
                        return;
                    }
                    PauseFunctions.executeCountdownStep(pauseScene, steps[currentStep], crochet);
                    currentStep++;
                },
                repeat: steps.length - 1
            });
        } else {
            playScene.isGamePaused = false;
            playScene.scene.resume("PlayScene");
            
            if (playScene.sound && typeof playScene.sound.resumeAll === "function") playScene.sound.resumeAll();
            if (playScene.songPlaylist) {
                if (typeof playScene.songPlaylist.resume === "function") playScene.songPlaylist.resume("All");
                else if (typeof playScene.songPlaylist.play === "function") playScene.songPlaylist.play("All");
            }
            pauseScene.scene.stop();
        }
    }

    static executeCountdownStep(scene, stepKey, crochet) {
        const skinData = funkin.play.uiSkins ? funkin.play.uiSkins.get(`ui.countdown.${stepKey}`) : null;
        if (!skinData) return;

        if (skinData.audio && skinData.audio.assetPath) {
            const audioKey = funkin.play.uiSkins.getAssetKey(skinData.audio.assetPath);
            if (scene.cache.audio.exists(audioKey)) {
                scene.sound.play(audioKey, { volume: skinData.audio.volume || 1.0 });
            }
        }

        if (skinData.image && skinData.image.assetPath) {
            const imgKey = funkin.play.uiSkins.getAssetKey(skinData.image.assetPath);
            if (scene.textures.exists(imgKey)) {
                const sprite = scene.add.sprite(scene.scale.width / 2, scene.scale.height / 2, imgKey);
                sprite.setOrigin(0.5, 0.5);
                sprite.setDepth(3000);

                if (skinData.image.scale !== undefined) sprite.setScale(skinData.image.scale);
                if (skinData.image.alpha !== undefined) sprite.setAlpha(skinData.image.alpha);

                scene.tweens.add({
                    targets: sprite,
                    alpha: 0,
                    duration: crochet,
                    ease: "Cubic.easeInOut",
                    onComplete: () => sprite.destroy()
                });
            }
        }
    }

    static restart(pauseScene) {
        const playScene = pauseScene.playScene;
        if (!playScene) return;

        pauseScene.stopMusic();
        pauseScene.pauseMenu.setVisible(false);
        
        if (playScene.songPlaylist && typeof playScene.songPlaylist.stop === "function") {
            playScene.songPlaylist.stop();
        }
        if (playScene.sound) playScene.sound.stopAll();

        let bpm = 100;
        if (funkin.play && funkin.play.chart && typeof funkin.play.chart.get === "function") {
            bpm = funkin.play.chart.get("metadata.audio.bpm") || 100;
        }
        const crochet = (60 / bpm) * 1000;
        const targetSongPos = -(crochet * 4); 

        // INICIAMOS EL VWOOSH
        playScene.isRewinding = true;
        playScene.isGamePaused = false;
        playScene.scene.resume("PlayScene");

        // Durante este Tween, las notas falladas en pantalla volarán hacia atrás solas.
        pauseScene.tweens.add({
            targets: funkin.conductor,
            songPosition: targetSongPos,
            duration: 900, 
            ease: 'Power3',
            onComplete: () => {
                playScene.isRewinding = false;
                
                // Una vez que llegaron a su lugar, reseteamos sus texturas y estados
                PauseFunctions.applyHardReset(playScene, bpm);
                
                pauseScene.scene.stop();
                if (playScene.referee) {
                    playScene.referee.changePhase("countdown");
                }
            }
        });
    }

    // Nueva función para dejar el código limpio y seguro
    static applyHardReset(playScene, bpm) {
        if (funkin.playerStaticsInSong) {
            funkin.playerStaticsInSong.combo = 0;
            funkin.playerStaticsInSong.score = 0;
            funkin.playerStaticsInSong.misses = 0;
            funkin.playerStaticsInSong.maxCombo = 0;
            funkin.playerStaticsInSong.sick = 0;
            funkin.playerStaticsInSong.good = 0;
            funkin.playerStaticsInSong.bad = 0;
            funkin.playerStaticsInSong.shit = 0;
            funkin.playerStaticsInSong.totalNotes = 0;
            funkin.playerStaticsInSong.ratingAcc = 0;
            funkin.playerStaticsInSong.clickTimestamps = [];
        }
        if (funkin.play.health) funkin.play.health.health = 1.0;

        if (funkin.conductor) {
            funkin.conductor.bpm = bpm;
            funkin.conductor.currentBeat = 0;
            funkin.conductor.currentStep = 0;
        }
        playScene.lastBeat = undefined;
        playScene.skipFade = true; 

        // Restaurar Notas (Quitar lo gris y resetear variables)
        if (playScene.notesManager && playScene.notesManager.notes) {
            playScene.notesManager.notes.forEach(note => {
                note.hasMissed = false; 
                note.wasHit = false;
                note.active = true;
                if (note.sprite) {
                    note.sprite.visible = true;
                    note.sprite.alpha = note.baseAlpha !== undefined ? note.baseAlpha : 1;
                    if (typeof note.sprite.clearTint === "function") note.sprite.clearTint();
                    if (note.sprite.play && note.lane !== undefined) {
                        note.sprite.play(`scroll_${note.lane}_${note.isPlayer ? 'player' : 'opponent'}`, true);
                    }
                }
            });
        }

        if (playScene.sustainNotesManager && playScene.sustainNotesManager.sustains) {
            playScene.sustainNotesManager.sustains.forEach(sustain => {
                sustain.active = true;
                sustain.isBeingHit = false;
                sustain.wasBeingHit = false;
                sustain.hasBeenHit = false;
                sustain.parentMissed = false;
                sustain.consumedTime = 0;
                sustain.strumReset = false;
                sustain.earlyReleaseCompleted = false;
                sustain.coverEnded = false;
                sustain.missAnimPlayed = false;
                
                sustain.bodyParts.forEach(p => { 
                    p.visible = true; 
                    p.alpha = sustain.baseAlpha !== undefined ? sustain.baseAlpha : 1; 
                    if (typeof p.clearTint === "function") p.clearTint(); 
                });
                sustain.end.visible = true;
                sustain.end.alpha = sustain.baseAlpha !== undefined ? sustain.baseAlpha : 1;
                if (typeof sustain.end.clearTint === "function") sustain.end.clearTint();
            });
        }

        // Personajes
        if (playScene.stageCharacters) {
            Object.values(playScene.stageCharacters).forEach(char => {
                if (char) {
                    if (typeof char.dance === 'function') char.dance();
                    else if (typeof char.playAnim === 'function') char.playAnim('idle', true);
                    if (char.danceFrame !== undefined) char.danceFrame = 0;
                }
            });
        }

        // Cámaras (Reset de Zoom y Coordenadas)
        if (playScene.gameCam) {
            playScene.tweens.killTweensOf(playScene.gameCam);
            playScene.gameCam.zoom = playScene.gameCam.defaultZoom || 1.0;
            if (playScene.gameCam.scrollX !== undefined) playScene.gameCam.scrollX = playScene.gameCam.defaultX || 0;
            if (playScene.gameCam.scrollY !== undefined) playScene.gameCam.scrollY = playScene.gameCam.defaultY || 0;
            if (playScene.gameCam.clearRenderToTexture) playScene.gameCam.clearRenderToTexture(); 
        }
        if (playScene.uiCam) {
            playScene.tweens.killTweensOf(playScene.uiCam);
            playScene.uiCam.zoom = playScene.uiCam.defaultZoom || 1.0;
            if (playScene.uiCam.scrollX !== undefined) playScene.uiCam.scrollX = 0;
            if (playScene.uiCam.scrollY !== undefined) playScene.uiCam.scrollY = 0;
        }

        if (playScene.eventsManager && typeof playScene.eventsManager.reset === 'function') {
            playScene.eventsManager.reset();
        }

        if (playScene.songPlaylist) {
            if (typeof playScene.songPlaylist.destroy === "function") playScene.songPlaylist.destroy();
            const PlaylistClass = funkin.play.data.song.PlaySongPlaylist || funkin.play.PlaySongPlaylist;
            if (PlaylistClass) {
                playScene.songPlaylist = new PlaylistClass(playScene);
            }
        }
    }

    static exit(pauseScene) {
        const playScene = pauseScene.playScene;
        if (!playScene) return;

        pauseScene.stopMusic();
        playScene.isGamePaused = false;
        playScene.scene.resume("PlayScene");
        pauseScene.scene.stop();

        if (playScene.referee) {
            playScene.referee.changePhase("end");
        }
    }
}

funkin.play.visuals.ui.PauseFunctions = PauseFunctions;