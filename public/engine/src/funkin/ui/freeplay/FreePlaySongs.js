/**
 * @file FreePlaySongs.js
 * Carga las listas de canciones de las semanas y dibuja el alfabeto dinámico.
 */
class FreePlaySongs {
  constructor(scene) {
    this.scene = scene;
    this.songs = [];
    this.songTexts = [];

    const savedIndex = this.scene.game.registry.get("freeplaySongIndex");
    this.selectedIndex = savedIndex !== undefined ? savedIndex : 0;

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
      const response = await fetch(
        `${window.BASE_URL}assets/data/ui/weeks.txt?t=${Date.now()}`,
      );
      if (!response.ok) throw new Error("No se pudo cargar weeks.txt");

      const text = await response.text();
      const weekIds = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      for (const weekId of weekIds) {
        try {
          const jsonRes = await fetch(
            `${window.BASE_URL}assets/data/weeks/${weekId}.json?t=${Date.now()}`,
          );
          if (!jsonRes.ok) continue;

          const json = await jsonRes.json();
          if (json.visible === false) continue;

          let weekColor = json.weekBackground || "#F9CF51";

          const tracksList = json.tracks || json.songs;
          if (tracksList && Array.isArray(tracksList)) {
            const trackPromises = tracksList.map(async (trackData) => {
              let folderName = "???";
              if (typeof trackData === "string") folderName = trackData;
              else if (Array.isArray(trackData) && trackData.length > 0)
                folderName = trackData[0];

              let displayName = folderName;
              let songDifficulties = ["easy", "normal", "hard"]; // Fallback por defecto

              if (folderName !== "???") {
                try {
                  const metaRes = await fetch(`${window.BASE_URL}assets/songs/${folderName.toLowerCase()}/charts/meta.json`);
                  if (metaRes.ok) {
                    const metaJson = await metaRes.json();
                    displayName = metaJson.songName || folderName;
                    
                    // Extraemos las dificultades disponibles del meta.json
                    if (metaJson.difficulties && typeof metaJson.difficulties === 'object') {
                      songDifficulties = Object.keys(metaJson.difficulties);
                    }
                  }
                } catch (e) {
                  // Fallback silencioso
                }
              }

              return { 
                name: folderName, 
                displayName: displayName, 
                color: weekColor,
                difficulties: songDifficulties 
              };
            });

            const resolvedTracks = await Promise.all(trackPromises);
            this.songs.push(...resolvedTracks);
          }
        } catch (e) {
          console.warn(`[FreePlaySongs] Error cargando semana ${weekId}:`, e);
        }
      }

      if (this.selectedIndex >= this.songs.length) this.selectedIndex = 0;
      this.createUI();
    } catch (error) {
      console.error("[FreePlaySongs] Error fatal cargando canciones:", error);
    }
  }

  createUI() {
    const centerY = this.scene.cameras.main.height / 2;
    const screenWidth = this.scene.scale.width;

    this.songs.forEach((songData, i) => {
      const textItem = new window.Alphabet(
        this.scene,
        100,
        0,
        songData.displayName.toUpperCase(),
        true,
        this.alphabetScale,
      );
      textItem.setDepth(10);
      textItem.targetY =
        centerY +
        (i - this.selectedIndex) * this.itemSpacing -
        (this.baseLetterHeight * this.alphabetScale) / 2;
      textItem.y = textItem.targetY;

      const hitWidth = screenWidth;
      const hitHeight = this.itemSpacing;
      textItem.setSize(hitWidth, hitHeight);
      textItem.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, hitWidth, hitHeight),
        Phaser.Geom.Rectangle.Contains,
      );

      this.songTexts.push(textItem);
    });

    this.updateSelection(0);
  }

  updateSelection(change) {
    if (this.songs.length === 0 || this.isConfirming) return;

    this.selectedIndex += change;

    if (this.selectedIndex < 0) this.selectedIndex = this.songs.length - 1;
    else if (this.selectedIndex >= this.songs.length) this.selectedIndex = 0;

    this.scene.game.registry.set("freeplaySongIndex", this.selectedIndex);

    if (change !== 0 && this.scene.cache.audio.exists("scrollMenu")) {
      this.scene.sound.play("scrollMenu", { volume: 1 });
    }

    const centerY = this.scene.cameras.main.height / 2;

    this.songTexts.forEach((textItem, i) => {
      textItem.targetY =
        centerY +
        (i - this.selectedIndex) * this.itemSpacing -
        (this.baseLetterHeight * this.alphabetScale) / 2;
      textItem.setAlpha(i === this.selectedIndex ? 1 : 0.6);
    });

    const currentSongData = this.songs[this.selectedIndex];
    if (currentSongData) {
      if (this.scene.bgManager) {
        this.scene.bgManager.updateColor(currentSongData.color);
      }
      
      // Actualizamos dinámicamente las dificultades en el UI
      if (this.scene.diffManager && currentSongData.difficulties) {
        this.scene.diffManager.updateDifficultiesList(currentSongData.difficulties);
      }
    }
  }

  confirmSelection() {
    if (this.isConfirming || this.songs.length === 0) return;
    this.isConfirming = true;

    const selectedText = this.songTexts[this.selectedIndex];
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
    return this.songs && this.songs.length > 0
      ? this.songs[this.selectedIndex]
      : null;
  }

  update(time, delta) {
    if (this.songTexts.length > 0) {
      const lerpFactor = Phaser.Math.Clamp(delta * 0.015, 0, 1);
      this.songTexts.forEach((textItem) => {
        textItem.y = Phaser.Math.Linear(
          textItem.y,
          textItem.targetY,
          lerpFactor,
        );
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