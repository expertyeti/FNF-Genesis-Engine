(function() {
    window.GenesisTimeline = window.GenesisTimeline || { 
        isListeningGlobal: false,
        isPlaying: false,
        currentTime: 0,
        pixelsPerSecond: 50,
        animationFrame: null,
        maxDuration: 300,
        minTime: -4, 
        trackCounter: 0,
        bpm: 120,
        lastTime: 0,
        lastBeat: 0
    };

    function initGenesisTimeline() {
        const playBtn = document.getElementById('tl-play');
        const pauseBtn = document.getElementById('tl-pause');
        const prevBtn = document.getElementById('tl-prev');
        const nextBtn = document.getElementById('tl-next');
        const timeDisplay = document.getElementById('tl-time');
        const bpmInput = document.getElementById('tl-bpm');
        const trackWrapper = document.getElementById('track-content-wrapper');
        const timeRuler = document.getElementById('time-ruler');
        
        const trackHeadersList = document.getElementById('track-headers-list');
        const trackLanes = document.getElementById('track-lanes');
        const trackHeadersContainer = document.getElementById('track-headers');
        
        const btnAddTrack = document.getElementById('btn-add-track');
        const zoomSlider = document.getElementById('tl-zoom');
        const ctxMenu = document.getElementById('tl-context-menu');
        const cmenuAddTrack = document.getElementById('cmenu-add-track');
        
        if (!playBtn || !trackWrapper) return;

        function updateBpm(newBpm) {
            if (window.funkin && window.funkin.conductor) {
                let safeBpm = newBpm <= 0 ? 0.0001 : newBpm;
                if (typeof window.funkin.conductor.bpm.set === 'function') {
                    window.funkin.conductor.bpm.set(safeBpm);
                } else {
                    window.funkin.conductor.bpm = safeBpm;
                }
                if (window.funkin.conductorEvents && typeof window.funkin.conductorEvents.emit === 'function') {
                    window.funkin.conductorEvents.emit('bpm_changed', safeBpm);
                }
            }
        }

        function toggleEnginePause(isPaused) {
            if (window.game) {
                if (isPaused) {
                    if (window.game.sound) window.game.sound.pauseAll();
                    window.game.scene.scenes.forEach(scene => {
                        if (scene.sys.isActive()) {
                            if (scene.anims) scene.anims.pauseAll();
                            if (scene.tweens) scene.tweens.pauseAll();
                            scene.isGamePaused = true;
                        }
                    });
                } else {
                    if (window.game.sound) window.game.sound.resumeAll();
                    window.game.scene.scenes.forEach(scene => {
                        if (scene.sys.isActive() || scene.isGamePaused) {
                            if (scene.anims) scene.anims.resumeAll();
                            if (scene.tweens) scene.tweens.resumeAll();
                            scene.isGamePaused = false;
                            
                            scene.children.list.forEach(child => {
                                if (child && child.active && child.anims && child.anims.currentAnim) {
                                    child.anims.accumulator = 0;
                                    child.anims.nextTick = 0;
                                    if (child.anims.currentAnim.repeat === -1 && !child.anims.isPlaying) {
                                        try { child.anims.play(child.anims.currentAnim.key, true); } catch(e){}
                                    }
                                }
                            });
                        }
                    });
                }
            }
        }

        function syncEngineState() {
            let newTime = window.GenesisTimeline.currentTime;
            let dt = (newTime - (window.GenesisTimeline.lastTime || 0)) * 1000;
            window.GenesisTimeline.lastTime = newTime;
            
            let newSongPos = newTime * 1000;
            let beatHit = false;
            let currentBeat = 0;
            
            if (window.funkin && window.funkin.conductor) {
                window.funkin.conductor.songPosition = newSongPos;
                
                let bpmVal = window.GenesisTimeline.bpm || 120;
                if (bpmVal > 0) {
                    let crochet = (60 / bpmVal) * 1000;
                    currentBeat = Math.floor(newSongPos / crochet);
                    if (window.GenesisTimeline.lastBeat !== currentBeat) {
                        window.GenesisTimeline.lastBeat = currentBeat;
                        beatHit = true;
                        if (window.funkin.conductorEvents && typeof window.funkin.conductorEvents.emit === 'function') {
                            try { window.funkin.conductorEvents.emit('beat_hit', currentBeat); } catch(e){}
                        }
                    }
                }
            }
            
            let CharManager = window.funkin && window.funkin.play && window.funkin.play.visuals && window.funkin.play.visuals.characters && window.funkin.play.visuals.characters.charactersManager;
            
            if (window.game) {
                window.game.sound.getAll().forEach(s => {
                    if (s.seek !== undefined) {
                        s.seek = newTime;
                    }
                });
                
                window.game.scene.scenes.forEach(scene => {
                    if (scene.sys.isActive() || scene.isGamePaused) {
                        let isPaused = !window.GenesisTimeline.isPlaying;
                        scene.isRewinding = isPaused && (dt < 0);
                        
                        let simTime = scene.time ? scene.time.now : newSongPos;
                        
                        if (scene.notesManager && typeof scene.notesManager.update === 'function') {
                            if (dt < 0 && typeof scene.notesManager.recreateAllNotes === 'function') {
                                scene.notesManager.recreateAllNotes();
                            }
                            scene.notesManager.update(simTime, 16);
                            scene.notesManager.update(simTime, 16);
                        }
                        
                        if (scene.sustainNotesManager && typeof scene.sustainNotesManager.update === 'function') {
                            scene.sustainNotesManager.update(simTime, 16);
                        }
                        
                        if (isPaused) {
                            if (scene.activeCharacters && scene.notesManager && scene.notesManager.noteDataQueue) {
                                let p1Note = null, p1Time = -99999;
                                let p2Note = null, p2Time = -99999;
                                
                                scene.notesManager.noteDataQueue.forEach(n => {
                                    if (n.noteTime <= newSongPos) {
                                        if (n.isPlayer && n.noteTime > p1Time) { p1Time = n.noteTime; p1Note = n; }
                                        if (!n.isPlayer && n.noteTime > p2Time) { p2Time = n.noteTime; p2Note = n; }
                                    }
                                });
                                
                                const applyPose = (char, note, time) => {
                                    if (!char || !char.active || !CharManager) return;
                                    let bpmVal = window.GenesisTimeline.bpm || 120;
                                    let crochet = (60 / (bpmVal > 0 ? bpmVal : 120)) * 1000;
                                    let holdTime = (crochet / 4) * (char.holdTime || 4.0);
                                    
                                    let elapsedMs = 0;
                                    let targetAnimName = "";
                                    
                                    if (note && (newSongPos - time) < holdTime && (newSongPos - time) >= 0) {
                                        let dirs = ["LEFT", "DOWN", "UP", "RIGHT"];
                                        let dirName = dirs[note.lane % 4] || "UP";
                                        targetAnimName = 'sing' + dirName;
                                        elapsedMs = newSongPos - time;
                                        char.resetTimer = time + holdTime;
                                        char.isSinging = true;
                                    } else {
                                        if (char.danceMode === "danceLeftRight") {
                                            char.danced = (currentBeat % 2 !== 0);
                                        }
                                        targetAnimName = char.danceMode === "danceLeftRight" ? (char.danced ? "danceRight" : "danceLeft") : "idle";
                                        
                                        let lastBeatTime = currentBeat * crochet;
                                        elapsedMs = newSongPos - lastBeatTime;
                                        if (elapsedMs < 0) elapsedMs = 0;
                                        
                                        char.resetTimer = 0;
                                        char.isSinging = false;
                                    }
                                    
                                    if (char.currentAnim !== targetAnimName) {
                                        CharManager.playAnim(char, targetAnimName, true);
                                    }
                                    
                                    if (char.anims && char.anims.currentAnim) {
                                        let anim = char.anims.currentAnim;
                                        let timeScale = char.anims.timeScale || 1;
                                        let msPerFrame = (1000 / (anim.frameRate || 24)) / timeScale;
                                        let targetFrameIdx = Math.floor(elapsedMs / msPerFrame);
                                        let totFrames = anim.frames.length;
                                        
                                        if (targetFrameIdx < 0) targetFrameIdx = 0;
                                        
                                        if (anim.repeat === -1) {
                                            targetFrameIdx = targetFrameIdx % totFrames;
                                        } else {
                                            if (targetFrameIdx >= totFrames) targetFrameIdx = totFrames - 1;
                                        }
                                        
                                        if (targetFrameIdx >= 0 && targetFrameIdx < totFrames) {
                                            char.anims.setCurrentFrame(anim.frames[targetFrameIdx]);
                                            char.anims.accumulator = 0;
                                            char.anims.nextTick = 0;
                                        }
                                    }
                                };
                                
                                scene.activeCharacters.forEach(char => {
                                    if (char.isPlayer) applyPose(char, p1Note, p1Time);
                                    else if (char.isOpponent) applyPose(char, p2Note, p2Time);
                                    else if (char.isSpectator) applyPose(char, null, 0);
                                });
                            }

                            let bpmVal = window.GenesisTimeline.bpm || 120;
                            let crochet = (60 / (bpmVal > 0 ? bpmVal : 120)) * 1000;
                            let lastBeatTime = currentBeat * crochet;
                            let elapsedMs = newSongPos - lastBeatTime;

                            if (scene.healthBar) {
                                let bopStrength = 0.2;
                                let decay = Math.max(0, 1 - (elapsedMs / (crochet * 0.8))); 
                                let scaleAdd = bopStrength * decay;
                                
                                if (scene.healthBar.iconP1 && scene.healthBar.iconP1.sprite) {
                                    scene.healthBar.iconP1.currentScale = scene.healthBar.iconP1.baseScale + scaleAdd;
                                    scene.healthBar.iconP1.sprite.setScale(scene.healthBar.iconP1.currentScale);
                                }
                                if (scene.healthBar.iconP2 && scene.healthBar.iconP2.sprite) {
                                    scene.healthBar.iconP2.currentScale = scene.healthBar.iconP2.baseScale + scaleAdd;
                                    scene.healthBar.iconP2.sprite.setScale(scene.healthBar.iconP2.currentScale);
                                }
                            }

                            if (scene.gameCam) {
                                let zoomFreq = (window.funkin && window.funkin.play && window.funkin.play.data && window.funkin.play.data.camera && window.funkin.play.data.camera.zoomFreq) ? window.funkin.play.data.camera.zoomFreq : 4;
                                let lastBopBeat = Math.floor(currentBeat / zoomFreq) * zoomFreq;
                                let lastBopTime = lastBopBeat * crochet;
                                let elapsedFromBop = newSongPos - lastBopTime;
                                
                                if (elapsedFromBop >= 0) {
                                    let camDecay = Math.max(0, 1 - (elapsedFromBop / (crochet * zoomFreq * 0.5)));
                                    let gameBopInt = 0.015 * camDecay;
                                    let uiBopInt = 0.03 * camDecay;
                                    
                                    if (scene.gameCam.defaultZoom) {
                                        scene.gameCam.zoom = scene.gameCam.defaultZoom + gameBopInt;
                                    }
                                    if (scene.uiCam && scene.uiCam.defaultZoom) {
                                        scene.uiCam.zoom = scene.uiCam.defaultZoom + uiBopInt;
                                    }
                                }
                            }
                            
                            if (beatHit) {
                                if (window.funkin && window.funkin.play && window.funkin.play.playListSprites && typeof window.funkin.play.playListSprites.onBeat === 'function') {
                                    window.funkin.play.playListSprites.onBeat(currentBeat);
                                }
                            }
                            
                            if (scene.strumlines) {
                                const fixStrum = (s) => {
                                    if (s && s.active && s.currentAction !== 'static') {
                                        if (typeof s.playAnim === 'function') s.playAnim('static', true);
                                    }
                                };
                                if (scene.strumlines.playerStrums) scene.strumlines.playerStrums.forEach(fixStrum);
                                if (scene.strumlines.opponentStrums) scene.strumlines.opponentStrums.forEach(fixStrum);
                            }
                            
                            if (dt !== 0) {
                                scene.children.list.forEach(child => {
                                    if (!child || !child.active || !child.anims || !child.anims.currentAnim) return;
                                    if (child.lane !== undefined || child.currentAction !== undefined || child.noteTime !== undefined || child.isStrum) return;
                                    if (child.isPlayer || child.isOpponent || child.isSpectator) return; 
                                    
                                    try {
                                        child.anims.accumulator = 0;
                                        child.anims.nextTick = 0;
                                        
                                        let anim = child.anims.currentAnim;
                                        let timeScale = child.anims.timeScale || 1;
                                        let msPerFrame = (1000 / (anim.frameRate || 24)) / timeScale;
                                        
                                        if (!child.anims._scrubAccumulator) child.anims._scrubAccumulator = 0;
                                        child.anims._scrubAccumulator += dt;
                                        
                                        if (child.anims._scrubAccumulator >= msPerFrame) {
                                            let framesToAdvance = Math.floor(child.anims._scrubAccumulator / msPerFrame);
                                            child.anims._scrubAccumulator -= framesToAdvance * msPerFrame;
                                            
                                            for(let i=0; i<framesToAdvance; i++) {
                                                if (!child.active || !child.anims || !child.anims.currentAnim) break;
                                                if (typeof child.anims.nextFrame === 'function') {
                                                    child.anims.nextFrame();
                                                }
                                            }
                                        } 
                                        else if (child.anims._scrubAccumulator <= -msPerFrame) {
                                            let framesToReverse = Math.floor(Math.abs(child.anims._scrubAccumulator) / msPerFrame);
                                            child.anims._scrubAccumulator += framesToReverse * msPerFrame;
                                            
                                            for(let i=0; i<framesToReverse; i++) {
                                                if (!child.active || !child.anims || !child.anims.currentAnim) break;
                                                
                                                let curFrame = child.anims.currentFrame;
                                                let totFrames = child.anims.currentAnim.frames.length;
                                                if (curFrame && curFrame.index === 1) {
                                                    if (anim.repeat === -1) {
                                                        if (typeof child.anims.setCurrentFrame === 'function') {
                                                            child.anims.setCurrentFrame(anim.frames[totFrames - 1]);
                                                        }
                                                    } else {
                                                        break; 
                                                    }
                                                } else if (typeof child.anims.previousFrame === 'function') {
                                                    child.anims.previousFrame();
                                                }
                                            }
                                        }
                                        
                                        if (anim.repeat === -1 && !child.anims.isPlaying) {
                                            child.anims.isPlaying = true;
                                        }
                                    } catch (e) {}
                                });
                            }
                        }
                    }
                });
            }
        }

        zoomSlider.addEventListener('input', (e) => {
            window.GenesisTimeline.pixelsPerSecond = parseInt(e.target.value);
            trackWrapper.style.setProperty('--pps', window.GenesisTimeline.pixelsPerSecond);
            
            let totalSeconds = window.GenesisTimeline.maxDuration - window.GenesisTimeline.minTime;
            timeRuler.style.width = `calc(${totalSeconds} * var(--pps) * 1px)`;
            if (trackLanes) trackLanes.style.width = `calc(${totalSeconds} * var(--pps) * 1px)`;
        });
        
        trackWrapper.style.setProperty('--pps', window.GenesisTimeline.pixelsPerSecond);
        zoomSlider.value = window.GenesisTimeline.pixelsPerSecond;

        if (bpmInput) {
            if (window.funkin && window.funkin.conductor) {
                let actualBpm = typeof window.funkin.conductor.bpm.get === 'function' 
                    ? window.funkin.conductor.bpm.get() 
                    : window.funkin.conductor.bpm;
                window.GenesisTimeline.bpm = actualBpm > 0.1 ? actualBpm : 120;
                bpmInput.value = window.GenesisTimeline.bpm;
            }
            
            bpmInput.addEventListener('change', (e) => {
                let newBpm = parseFloat(e.target.value);
                if (isNaN(newBpm) || newBpm <= 0) newBpm = 120;
                window.GenesisTimeline.bpm = newBpm;
                updateBpm(newBpm);
                syncEngineState();
            });
        }

        timeRuler.innerHTML = `
            <div class="playhead" id="playhead">
                <div class="playhead-top"><i class="fas fa-caret-down"></i></div>
                <div class="playhead-line"></div>
            </div>
        `;
        
        let totalSeconds = window.GenesisTimeline.maxDuration - window.GenesisTimeline.minTime;
        timeRuler.style.width = `calc(${totalSeconds} * var(--pps) * 1px)`;
        if (trackLanes) trackLanes.style.width = `calc(${totalSeconds} * var(--pps) * 1px)`;

        for (let i = window.GenesisTimeline.minTime; i <= window.GenesisTimeline.maxDuration; i++) {
            const mark = document.createElement('span');
            mark.className = 'time-mark';
            if (i < 0) {
                mark.innerText = `cd ${i}s`;
            } else {
                mark.innerText = `${i}s`;
            }
            mark.style.left = `calc(${(i - window.GenesisTimeline.minTime)} * var(--pps) * 1px)`;
            timeRuler.appendChild(mark);
        }

        if(trackHeadersList) trackHeadersList.innerHTML = '';
        if(trackLanes) trackLanes.innerHTML = '';
        window.GenesisTimeline.trackCounter = 0;

        function addTrack(name = "new track", icon = "fa-layer-group") {
            window.GenesisTimeline.trackCounter++;
            const id = window.GenesisTimeline.trackCounter;
            
            const header = document.createElement('div');
            header.className = 'track-header';
            header.innerHTML = `
                <i class="fas ${icon}" style="width: 20px;"></i>
                <span style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${name} ${id}</span>
                <div class="track-header-icons">
                    <i class="fas fa-eye" title="visibility"></i>
                    <i class="fas fa-lock" title="lock"></i>
                </div>
            `;
            trackHeadersList.appendChild(header);
            
            const lane = document.createElement('div');
            lane.className = 'track-lane';
            lane.dataset.trackId = id;
            trackLanes.appendChild(lane);
        }

        if(btnAddTrack) {
            btnAddTrack.onclick = () => addTrack("track");
        }

        if (trackHeadersContainer && ctxMenu) {
            trackHeadersContainer.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                ctxMenu.style.display = 'block';
                ctxMenu.style.left = `${e.clientX}px`;
                ctxMenu.style.top = `${e.clientY}px`;
            });
            
            document.addEventListener('click', () => {
                ctxMenu.style.display = 'none';
            });
            
            cmenuAddTrack.onclick = () => {
                addTrack("track");
            };
        }

        trackWrapper.addEventListener('scroll', () => {
            if(trackHeadersList) {
                trackHeadersList.style.transform = `translateY(-${trackWrapper.scrollTop}px)`;
            }
        });

        const playhead = document.getElementById('playhead');
        
        function formatTime(seconds) {
            const sign = seconds < 0 ? '-' : '';
            const absSec = Math.abs(seconds);
            const h = Math.floor(absSec / 3600).toString().padStart(2, '0');
            const m = Math.floor((absSec % 3600) / 60).toString().padStart(2, '0');
            const s = Math.floor(absSec % 60).toString().padStart(2, '0');
            const ms = Math.floor((absSec % 1) * 100).toString().padStart(2, '0');
            return `${sign}${h}:${m}:${s}:${ms}`;
        }

        function updatePlayhead() {
            let relativeTime = window.GenesisTimeline.currentTime - window.GenesisTimeline.minTime;
            trackWrapper.style.setProperty('--current-time', relativeTime);
            if (timeDisplay) timeDisplay.textContent = formatTime(window.GenesisTimeline.currentTime);
        }

        function loop() {
            if (window.GenesisTimeline.isPlaying) {
                if (window.funkin && window.funkin.conductor && window.funkin.conductor.songPosition !== undefined) {
                    window.GenesisTimeline.currentTime = window.funkin.conductor.songPosition / 1000;
                } else {
                    window.GenesisTimeline.currentTime += 1 / 60; 
                }

                if (window.GenesisTimeline.currentTime > window.GenesisTimeline.maxDuration) {
                    window.GenesisTimeline.currentTime = window.GenesisTimeline.maxDuration;
                    pauseBtn.click();
                }
                
                window.GenesisTimeline.lastTime = window.GenesisTimeline.currentTime;
                updatePlayhead();
                window.GenesisTimeline.animationFrame = requestAnimationFrame(loop);
            }
        }

        playBtn.onclick = () => {
            window.GenesisTimeline.isPlaying = true;
            playBtn.style.display = 'none';
            pauseBtn.style.display = 'inline-block';
            
            toggleEnginePause(false);
            syncEngineState();
            loop();
        };

        pauseBtn.onclick = () => {
            window.GenesisTimeline.isPlaying = false;
            pauseBtn.style.display = 'none';
            playBtn.style.display = 'inline-block';
            
            toggleEnginePause(true);
            syncEngineState();
            cancelAnimationFrame(window.GenesisTimeline.animationFrame);
        };

        if (prevBtn) {
            prevBtn.onclick = () => {
                window.GenesisTimeline.currentTime = Math.max(window.GenesisTimeline.minTime, window.GenesisTimeline.currentTime - 10);
                updatePlayhead();
                syncEngineState();
            };
        }

        if (nextBtn) {
            nextBtn.onclick = () => {
                window.GenesisTimeline.currentTime = Math.min(window.GenesisTimeline.maxDuration, window.GenesisTimeline.currentTime + 10);
                updatePlayhead();
                syncEngineState();
            };
        }

        let isDragging = false;

        trackWrapper.addEventListener('mousedown', (e) => {
            if(e.offsetY >= trackWrapper.clientHeight || e.offsetX >= trackWrapper.clientWidth) return;
            isDragging = true;
            updateTimeFromMouse(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            updateTimeFromMouse(e);
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                syncEngineState();
            }
        });

        function updateTimeFromMouse(e) {
            const rect = trackWrapper.getBoundingClientRect();
            let x = (e.clientX - rect.left) + trackWrapper.scrollLeft;
            
            if (x < 0) x = 0;
            
            let relativeTime = x / window.GenesisTimeline.pixelsPerSecond;
            let time = relativeTime + window.GenesisTimeline.minTime;
            
            if (time < window.GenesisTimeline.minTime) time = window.GenesisTimeline.minTime;
            if (time > window.GenesisTimeline.maxDuration) time = window.GenesisTimeline.maxDuration;
            
            window.GenesisTimeline.currentTime = time;
            updatePlayhead();
            syncEngineState();
        }

        if (window.funkin && window.funkin.conductor && window.funkin.conductor.songPosition !== undefined) {
            window.GenesisTimeline.currentTime = Math.max(window.GenesisTimeline.minTime, window.funkin.conductor.songPosition / 1000);
            window.GenesisTimeline.lastTime = window.GenesisTimeline.currentTime;
            
            let isEnginePaused = false;
            if (window.game) {
                window.game.scene.scenes.forEach(scene => {
                    if (scene.sys.isActive() && scene.isGamePaused) {
                        isEnginePaused = true;
                    }
                });
            }
            
            if (!isEnginePaused) {
                window.GenesisTimeline.isPlaying = true;
                playBtn.style.display = 'none';
                pauseBtn.style.display = 'inline-block';
                if (window.GenesisTimeline.animationFrame) cancelAnimationFrame(window.GenesisTimeline.animationFrame);
                loop();
            } else {
                window.GenesisTimeline.isPlaying = false;
                playBtn.style.display = 'inline-block';
                pauseBtn.style.display = 'none';
            }
        }
        updatePlayhead();

        if (!window.GenesisTimeline.isListeningGlobal) {
            document.addEventListener('genesis:ui-rebuilt', () => initGenesisTimeline());
            window.GenesisTimeline.isListeningGlobal = true;
        }
    }

    initGenesisTimeline();
})();