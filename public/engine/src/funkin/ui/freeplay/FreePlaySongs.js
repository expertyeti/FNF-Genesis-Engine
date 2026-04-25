// src/funkin/ui/freeplay/FreePlaySongs.js

window.funkin = window.funkin || {};
window.funkin.ui = window.funkin.ui || {};
window.funkin.ui.freeplay = window.funkin.ui.freeplay || {};

class FreePlaySongs {
  constructor(scene) {
    this.scene = scene;
    this.masterSongs = []; 
    this.songTexts = [];
    this.visibleIndices = [];

    this.selectedIndex = 0;
    this.isConfirming = false;
    this.flickerTimer = null;

    this.alphabetScale = 1.1;
    this.baseLetterHeight = 70;
    this.itemSpacing = this.baseLetterHeight * this.alphabetScale + 50;

    if (window.Alphabet && this.scene.textures.exists("alphabet")) {
      window.Alphabet.createAtlas(this.scene);
    }

    this.loadSongs();
  }

  async loadSongs() {
    try {
      // si ya cargaron en esta sesion, las sacamos d vdd d la ram
      if (window.funkin.masterSongList && window.funkin.allDifficulties) {
        this.masterSongs = window.funkin.masterSongList;
        this.allDifficulties = window.funkin.allDifficulties;
        
        // ntp, esperamos 50ms pa q FreePlayScene logre instanciar FreePlayDiff
        this.scene.time.delayedCall(50, () => {
            this.createUI();
            this.onDataReady();
        });
        return;
      }

      const response = await fetch(`${window.BASE_URL}assets/data/ui/weeks.txt?t=${Date.now()}`);
      if (!response.ok) throw new Error("No se pudo cargar weeks.txt");

      const text = await response.text();
      const weekIds = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);

      for (const weekId of weekIds) {
        try {
          const jsonRes = await fetch(`${window.BASE_URL}assets/data/weeks/${weekId}.json?t=${Date.now()}`);
          if (!jsonRes.ok) continue;

          const json = await jsonRes.json();
          if (json.visible === false) continue;

          let weekColor = json.weekBackground || "#F9CF51";
          const tracksList = json.tracks || json.songs;

          if (tracksList && Array.isArray(tracksList)) {
            const trackPromises = tracksList.map(async (trackData) => {
              let folderName = "???";
              if (typeof trackData === "string") folderName = trackData;
              else if (Array.isArray(trackData) && trackData.length > 0) folderName = trackData[0];

              let displayName = folderName;
              let songDifficulties = ["easy", "normal", "hard"]; 

              if (folderName !== "???") {
                try {
                  const metaRes = await fetch(`${window.BASE_URL}assets/songs/${folderName.toLowerCase()}/charts/meta.json`);
                  if (metaRes.ok) {
                    const metaJson = await metaRes.json();
                    displayName = metaJson.songName || folderName;
                    if (metaJson.difficulties && typeof metaJson.difficulties === 'object') {
                      songDifficulties = Object.keys(metaJson.difficulties);
                    }
                  }
                } catch (e) {}
              }

              return { 
                name: folderName, 
                displayName: displayName, 
                color: weekColor,
                difficulties: songDifficulties.map(d => d.toUpperCase()) 
              };
            });

            const resolvedTracks = await Promise.all(trackPromises);
            this.masterSongs.push(...resolvedTracks);
          }
        } catch (e) {}
      }

      let diffSet = new Set(["EASY", "NORMAL", "HARD"]); 
      this.masterSongs.forEach(s => s.difficulties.forEach(d => diffSet.add(d)));
      this.allDifficulties = Array.from(diffSet);

      window.funkin.masterSongList = this.masterSongs;
      window.funkin.allDifficulties = this.allDifficulties;

      this.createUI();
      this.onDataReady();
    } catch (error) {}
  }

  createUI() {
    const centerY = this.scene.cameras.main.height / 2;
    const screenWidth = this.scene.scale.width;

    this.masterSongs.forEach((songData, i) => {
      const textItem = new window.Alphabet(
        this.scene,
        100,
        0,
        songData.displayName.toUpperCase(),
        true,
        this.alphabetScale,
      );
      
      textItem.setDepth(10);
      textItem.targetY = centerY;
      textItem.y = textItem.targetY;
      textItem.visible = false;
      textItem.active = false;

      const hitWidth = screenWidth;
      const hitHeight = this.itemSpacing;
      textItem.setSize(hitWidth, hitHeight);
      textItem.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, hitWidth, hitHeight),
        Phaser.Geom.Rectangle.Contains,
      );

      this.songTexts.push(textItem);
    });

    const lastSong = this.scene.game.registry.get("freeplayLastSong");
    if (lastSong) {
      const foundIndex = this.masterSongs.findIndex(s => s.name === lastSong);
      if (foundIndex !== -1) {
        this.selectedIndex = foundIndex;
      }
    }
  }

  onDataReady() {
    if (this.scene.diffManager) {
        this.scene.diffManager.initGlobalDifficulties(this.allDifficulties);
    } else {
        this.applyDifficultyFilter(this.scene.game.registry.get("freeplayGlobalDiff") || "NORMAL");
    }
  }

  applyDifficultyFilter(diffString) {
    if (!diffString) return;
    this.currentDiff = diffString.toUpperCase();

    this.visibleIndices = [];
    this.masterSongs.forEach((s, i) => {
      if (s.difficulties.includes(this.currentDiff)) {
        this.visibleIndices.push(i);
      }
    });

    if (this.visibleIndices.length === 0) {
      this.visibleIndices = this.masterSongs.map((_, i) => i);
    }

    if (!this.visibleIndices.includes(this.selectedIndex)) {
      this.selectedIndex = this.visibleIndices.length > 0 ? this.visibleIndices[0] : 0;
    }

    this.updateLayout();
  }

  updateSelection(change) {
    if (this.visibleIndices.length === 0 || this.isConfirming) return;

    let currentVisualIndex = this.visibleIndices.indexOf(this.selectedIndex);
    currentVisualIndex += change;

    if (currentVisualIndex < 0) currentVisualIndex = this.visibleIndices.length - 1;
    else if (currentVisualIndex >= this.visibleIndices.length) currentVisualIndex = 0;

    this.selectedIndex = this.visibleIndices[currentVisualIndex];

    if (change !== 0 && this.scene.cache.audio.exists("scrollMenu")) {
      this.scene.sound.play("scrollMenu", { volume: 1 });
    }

    this.updateLayout();
  }

  selectExactSong(masterIndex) {
    if (!this.visibleIndices.includes(masterIndex) || this.isConfirming) return;
    this.selectedIndex = masterIndex;
    
    if (this.scene.cache.audio.exists("scrollMenu")) {
      this.scene.sound.play("scrollMenu", { volume: 1 });
    }
    
    this.updateLayout();
  }

  updateLayout() {
    const centerY = this.scene.cameras.main.height / 2;
    const currentVisualIndex = this.visibleIndices.indexOf(this.selectedIndex);

    this.songTexts.forEach((textItem, masterIdx) => {
      if (this.visibleIndices.includes(masterIdx)) {
        textItem.setVisible(true);
        textItem.setActive(true);
        const visualPos = this.visibleIndices.indexOf(masterIdx);
        const offset = visualPos - currentVisualIndex;

        textItem.targetY = centerY + offset * this.itemSpacing - (this.baseLetterHeight * this.alphabetScale) / 2;
        textItem.setAlpha(masterIdx === this.selectedIndex ? 1 : 0.6);
      } else {
        textItem.setVisible(false);
        textItem.setActive(false);
        textItem.targetY = centerY - 2000;
        textItem.y = textItem.targetY;
      }
    });

    const currentSongData = this.masterSongs[this.selectedIndex];
    if (currentSongData) {
      this.scene.game.registry.set("freeplayLastSong", currentSongData.name);

      if (this.scene.bgManager) {
        this.scene.bgManager.updateColor(currentSongData.color);
      }
      if (this.scene.diffManager) {
        this.scene.diffManager.updateScoreDisplay(currentSongData.name);
      }
    }
  }

  confirmSelection() {
    if (this.isConfirming || this.visibleIndices.length === 0) return;
    this.isConfirming = true;

    const selectedText = this.songTexts[this.selectedIndex];
    if (!selectedText) return;

    let flickers = 0;
    this.flickerTimer = this.scene.time.addEvent({
      delay: 90,
      repeat: 11,
      callback: () => {
        selectedText.setAlpha(selectedText.alpha === 1 ? 0 : 1);
        flickers++;
        if (flickers > 10) selectedText.setAlpha(1);
      },
    });
  }

  getCurrentSong() {
    return this.masterSongs && this.masterSongs.length > 0
      ? this.masterSongs[this.selectedIndex]
      : null;
  }

  update(time, delta) {
    if (this.songTexts.length > 0) {
      const lerpFactor = Phaser.Math.Clamp(delta * 0.015, 0, 1);
      this.songTexts.forEach((textItem) => {
        if (textItem.visible) {
            textItem.y = Phaser.Math.Linear(
            textItem.y,
            textItem.targetY,
            lerpFactor,
            );
        }
      });
    }
  }

  destroy() {
    if (this.flickerTimer) {
      this.flickerTimer.destroy();
      this.flickerTimer = null;
    }
    this.songTexts.forEach((t) => t.destroy());
    this.songTexts = [];
  }
}

funkin.ui.freeplay.FreePlaySongs = FreePlaySongs;