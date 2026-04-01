class FreePlaySongs {
  constructor(scene) {
    this.scene = scene;
    this.songs = [];
    this.songTexts = [];

    // USO DEL REGISTRY DE PHASER PARA PERSISTENCIA SEGURA
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
      const response = await fetch(`public/data/ui/weeks.txt?t=${Date.now()}`);
      if (!response.ok) throw new Error("No se pudo cargar weeks.txt");

      const text = await response.text();
      const weekIds = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      for (const weekId of weekIds) {
        try {
          const jsonRes = await fetch(`public/data/weeks/${weekId}.json?t=${Date.now()}`);
          if (!jsonRes.ok) continue;

          const json = await jsonRes.json();
          if (json.visible === false) continue;

          let weekColor = json.weekBackground || "#F9CF51";

          const tracksList = json.tracks || json.songs;
          if (tracksList && Array.isArray(tracksList)) {
            tracksList.forEach((trackData) => {
              let songName = "???";
              if (typeof trackData === "string") {
                songName = trackData;
              } else if (Array.isArray(trackData) && trackData.length > 0) {
                songName = trackData[0];
              }
              this.songs.push({ name: songName, color: weekColor });
            });
          }
        } catch (e) {
          console.warn(`[FreePlaySongs] Error cargando semana ${weekId}:`, e);
        }
      }

      // ASEGURAR QUE EL ÍNDICE ES VÁLIDO (Por si el archivo json cambió y hay menos canciones)
      if (this.selectedIndex >= this.songs.length) {
        this.selectedIndex = 0;
      }

      this.createUI();
    } catch (error) {
      console.error("[FreePlaySongs] Error fatal cargando canciones:", error);
    }
  }

  createUI() {
    const centerY = this.scene.cameras.main.height / 2;
    const screenWidth = this.scene.scale.width;

    this.songs.forEach((songData, i) => {
      const textItem = new window.Alphabet(this.scene, 100, 0, songData.name.toUpperCase(), true, this.alphabetScale);
      textItem.setDepth(10);

      textItem.targetY = centerY + (i - this.selectedIndex) * this.itemSpacing - (this.baseLetterHeight * this.alphabetScale) / 2;
      textItem.y = textItem.targetY;

      // MEJORA PARA MÓVILES: Área de impacto ampliada a todo el ancho y alto del espaciado
      const hitWidth = screenWidth;
      const hitHeight = this.itemSpacing;
      textItem.setSize(hitWidth, hitHeight);

      // FIX: Se establece la geometría de interacción exactamente en 0, 0
      // (top-left absolute respect al item) eliminando el offset de -hitHeight / 2.
      textItem.setInteractive(new Phaser.Geom.Rectangle(0, 0, hitWidth, hitHeight), Phaser.Geom.Rectangle.Contains);

      this.songTexts.push(textItem);
    });

    this.updateSelection(0);
  }

  updateSelection(change) {
    if (this.songs.length === 0 || this.isConfirming) return;

    this.selectedIndex += change;

    if (this.selectedIndex < 0) {
      this.selectedIndex = this.songs.length - 1;
    } else if (this.selectedIndex >= this.songs.length) {
      this.selectedIndex = 0;
    }

    // GUARDAR ESTADO PERSISTENTE EN EL REGISTRY DE PHASER
    this.scene.game.registry.set("freeplaySongIndex", this.selectedIndex);

    if (change !== 0) {
      if (this.scene.cache.audio.exists("scrollMenu")) {
        this.scene.sound.play("scrollMenu", { volume: 1 });
      }
    }

    const centerY = this.scene.cameras.main.height / 2;

    this.songTexts.forEach((textItem, i) => {
      textItem.targetY = centerY + (i - this.selectedIndex) * this.itemSpacing - (this.baseLetterHeight * this.alphabetScale) / 2;

      if (i === this.selectedIndex) {
        textItem.setAlpha(1);
      } else {
        textItem.setAlpha(0.6);
      }
    });

    const currentSongData = this.songs[this.selectedIndex];
    if (currentSongData && this.scene.bgManager) {
      this.scene.bgManager.updateColor(currentSongData.color);
    }
  }

  confirmSelection() {
    if (this.isConfirming || this.songs.length === 0) return;

    this.isConfirming = true;

    if (this.scene.cache.audio.exists("confirmMenu")) {
      this.scene.sound.play("confirmMenu");
    }

    // Patrón de vibración FUERTE al elegir una canción
    if (navigator.vibrate) navigator.vibrate([150, 50, 150]);

    const selectedText = this.songTexts[this.selectedIndex];
    let flickers = 0;

    this.flickerTimer = this.scene.time.addEvent({
      delay: 90,
      repeat: 11,
      callback: () => {
        selectedText.setAlpha(selectedText.alpha === 1 ? 0 : 1);
        flickers++;
        if (flickers > 10) {
          selectedText.setAlpha(1);
        }
      },
    });
  }

  /**
   * Retrieves the currently selected song object.
   * Needed by FreePlayScene and FreePlayDiff to update scores.
   * @returns {Object|null}
   */
  getCurrentSong() {
    if (this.songs && this.songs.length > 0) {
      return this.songs[this.selectedIndex];
    }
    return null;
  }

  update(time, delta) {
    if (this.songTexts.length > 0) {
      const lerpFactor = Phaser.Math.Clamp(delta * 0.015, 0, 1);
      this.songTexts.forEach((textItem) => {
        textItem.y = Phaser.Math.Linear(textItem.y, textItem.targetY, lerpFactor);
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

if (typeof window !== "undefined") {
  window.FreePlaySongs = FreePlaySongs;
}