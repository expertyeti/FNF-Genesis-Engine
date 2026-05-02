window.funkin = window.funkin || {};
funkin.editor = funkin.editor || {};

class EditorScene extends Phaser.Scene {
  constructor() {
    super({ key: "EditorScene" });
    this.uiContainer = null;
    this._resizeTick = null;
    
    this._originalScaleMode = null; 
    this._originalAutoCenter = null;
    this._originalCanvasStyle = "";
    this._originalWidth = 1280;
    this._originalHeight = 720;

    this.currentMode = "stage"; 
  }

  create() {
    const canvas = this.game.canvas;
    if (this.scale) {
        this._originalScaleMode = this.scale.scaleMode;
        this._originalAutoCenter = this.scale.autoCenter;
        this._originalCanvasStyle = canvas.style.cssText;
        this._originalWidth = this.scale.width;
        this._originalHeight = this.scale.height;
        this.scale.scaleMode = Phaser.Scale.NONE; 
        this.scale.autoCenter = Phaser.Scale.NO_CENTER;
    }

    this.events.once("shutdown", this.cleanUpDOM, this);
    this.syncCSS = this.syncCSS.bind(this);
    this.syncEngine = this.syncEngine.bind(this);
    
    this.setupTimeEventListeners();
     
    this.buildUI().then(() => {
      window.addEventListener('resize', this.syncCSS);
      document.addEventListener('genesis:ui-resizing', this.syncCSS);
      document.addEventListener('genesis:ui-rebuilt', this.syncEngine);
    });
  }

  setupTimeEventListeners() {
    document.addEventListener('genesis:time-set-paused', (e) => {
        const playScene = this.scene.get("PlayScene");
        if (!playScene || !playScene.inst) return;
        
        if (e.detail.paused) {
            playScene.inst.pause();
            if (playScene.vocals) playScene.vocals.pause();
        } else {
            playScene.inst.resume();
            if (playScene.vocals) playScene.vocals.resume();
        }
    });

    document.addEventListener('genesis:time-seek', (e) => {
        const playScene = this.scene.get("PlayScene");
        if (!playScene || !playScene.inst) return;

        const targetTimeSec = e.detail.time;
        const targetMs = targetTimeSec * 1000;

        playScene.inst.seek = targetTimeSec;
        if (playScene.vocals) playScene.vocals.seek = targetTimeSec;
        
        if (window.Conductor) {
            window.Conductor.songPosition = targetMs;
        }

        this.syncCharacterFrames(playScene, targetMs);
    });

    // Control de Volumen
    document.addEventListener('genesis:audio-volume', (e) => {
        const playScene = this.scene.get("PlayScene");
        if (!playScene) return;
        
        const vol = e.detail.volume;
        if (playScene.inst) playScene.inst.setVolume(vol);
        if (playScene.vocals) playScene.vocals.setVolume(vol);
    });

    // Control de BPM
    document.addEventListener('genesis:bpm-change', (e) => {
        if (window.Conductor) {
            // Asegura compatibilidad si Conductor tiene el método nativo, sino recálcula crochet
            if (typeof window.Conductor.changeBPM === 'function') {
                window.Conductor.changeBPM(e.detail.bpm);
            } else {
                window.Conductor.bpm = e.detail.bpm;
                window.Conductor.crochet = ((60 / e.detail.bpm) * 1000);
                window.Conductor.stepCrochet = window.Conductor.crochet / 4;
            }
        }
    });
  }

  syncCharacterFrames(playScene, timeMs) {
    const chars = [playScene.dad, playScene.boyfriend, playScene.gf];
    chars.forEach(char => {
        if (char && char.anims && char.anims.currentAnim) {
            char.update(this.game.loop.time, this.game.loop.delta);
        }
    });
  }

  update() {
    const playScene = this.scene.get("PlayScene");
    if (!playScene || !playScene.inst) return;

    let currentTimeSec = window.Conductor ? (window.Conductor.songPosition / 1000) : playScene.inst.seek;
    let durationSec = playScene.inst.duration || 0;
    let isPlaying = playScene.inst.isPlaying || false;
    let currentBpm = window.Conductor ? window.Conductor.bpm : 100;

    document.dispatchEvent(new CustomEvent('genesis:time-sync', { 
        detail: { 
            currentTime: currentTimeSec, 
            duration: durationSec, 
            isPlaying: isPlaying,
            bpm: currentBpm
        } 
    }));
    
    if (window.funkin?.play?.song) {
        window.funkin.play.song.time = currentTimeSec;
    }
  }

  async buildUI() {
    window._genesisScriptsQueue = new Set(); 
    const xmlFiles = ["toolbar", "files", "timeline", "viewport", "inspector"];
    const cache = await funkin.editor.html.XMLPreloader.loadXMLs(xmlFiles);
    let htmlContent = "";
    for (const file of xmlFiles) {
        if (cache[file]) htmlContent += funkin.editor.html.XMLInterpreter.parse(cache[file]);
    }
    if (htmlContent === "") return;
    this.uiContainer = document.createElement('div');
    this.uiContainer.id = "genesis-editor-ui";
    this.uiContainer.innerHTML = htmlContent;
    Object.assign(this.uiContainer.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        zIndex: '999999', pointerEvents: 'none', display: 'block'
    });
    document.body.appendChild(this.uiContainer);
    this.scene.bringToTop();
    const totalScripts = window._genesisScriptsQueue.size;
    if (totalScripts === 0) {
        this.dispatchReadyEvents();
    } else {
        let scriptsLoaded = 0;
        window._genesisScriptsQueue.forEach(src => {
            let existing = document.querySelector(`script[data-src="${src}"]`);
            if (existing) existing.remove();
            const script = document.createElement("script");
            script.src = src;
            script.setAttribute('data-src', src);
            script.onload = script.onerror = () => {
                scriptsLoaded++;
                if (scriptsLoaded === totalScripts) this.dispatchReadyEvents();
            };
            document.body.appendChild(script);
        });
    }
  }

  dispatchReadyEvents() {
      this.syncEngine();
      setTimeout(() => this.syncEngine(), 100);
      document.dispatchEvent(new Event("genesis:ui-rebuilt"));
  }

  syncCSS() {
    if (this._resizeTick) cancelAnimationFrame(this._resizeTick);
    this._resizeTick = requestAnimationFrame(() => {
        const canvas = this.game?.canvas;
        const viewportNode = document.getElementById('genesis-viewport');
        if (!canvas || !viewportNode) return;
        const rect = viewportNode.getBoundingClientRect();
        const internalW = this.scale.gameSize.width;
        const internalH = this.scale.gameSize.height;
        const internalRatio = internalW / internalH;
        const rectRatio = rect.width / rect.height;
        let finalCSSWidth, finalCSSHeight;
        if (rectRatio > internalRatio) {
            finalCSSHeight = rect.height;
            finalCSSWidth = rect.height * internalRatio;
        } else {
            finalCSSWidth = rect.width;
            finalCSSHeight = rect.width / internalRatio;
        }
        const offsetX = rect.left + (rect.width - finalCSSWidth) / 2;
        const offsetY = rect.top + (rect.height - finalCSSHeight) / 2;
        const style = canvas.style;
        style.setProperty('width', `${finalCSSWidth}px`, 'important');
        style.setProperty('height', `${finalCSSHeight}px`, 'important');
        style.setProperty('position', 'fixed', 'important'); 
        style.setProperty('left', `${offsetX}px`, 'important');
        style.setProperty('top', `${offsetY}px`, 'important');
        style.setProperty('margin', '0px', 'important');
        style.setProperty('transform', 'none', 'important');
        style.setProperty('z-index', '1', 'important');
        this._resizeTick = null;
    });
  }

  syncEngine() {
    const viewportNode = document.getElementById('genesis-viewport');
    if (!viewportNode) return;
    const rect = viewportNode.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const baseHeight = 720;
    const availableRatio = rect.width / rect.height;
    const targetRatio = Math.max(16/9, Math.min(availableRatio, 20/9));
    const logicalWidth = Math.round(baseHeight * targetRatio);
    if (this.scale && (this.scale.gameSize.width !== logicalWidth || this.scale.gameSize.height !== baseHeight)) {
        this.scale.resize(logicalWidth, baseHeight);
        this.game.scene.scenes.forEach(s => { 
            if(s.cameras && s.cameras.main) s.cameras.main.setSize(logicalWidth, baseHeight); 
        });
    }
    this.syncCSS();
  }

  cleanUpDOM() {
    if (this._resizeTick) cancelAnimationFrame(this._resizeTick);
    window.removeEventListener('resize', this.syncCSS);
    document.removeEventListener('genesis:ui-resizing', this.syncCSS);
    document.removeEventListener('genesis:ui-rebuilt', this.syncEngine);
    if (this.uiContainer && this.uiContainer.parentNode) this.uiContainer.parentNode.removeChild(this.uiContainer);
    const canvas = this.game?.canvas;
    if(canvas && this.scale) {
        canvas.style.cssText = this._originalCanvasStyle;
        this.scale.scaleMode = this._originalScaleMode;
        this.scale.autoCenter = this._originalAutoCenter;
        this.scale.resize(this._originalWidth, this._originalHeight);
        this.scale.refresh();
        this.game.scene.scenes.forEach(s => {
            if (s.cameras && s.cameras.main) s.cameras.main.setSize(this._originalWidth, this._originalHeight);
        });
    }
  }
}

funkin.editor.EditorScene = EditorScene;
if (window.game) window.game.scene.add("EditorScene", EditorScene);