/**
 * @file src/funkin/play/visuals/UI/judgment/text/scoreText.js
 */
window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.ui = funkin.play.visuals.ui || {};

class ScoreText {
  constructor(scene) {
    this.scene = scene;
    const { width, height } = scene.scale;

    this.alignMode = 'down';

    this.formatConfig = [
      { key: "botplay", label: "Botplay", visible: true },
      { key: "score", label: "Score", visible: true },
      { key: "misses", label: "Misses", visible: true },
      { key: "rating", label: "Rating", visible: true },
      { key: "accuracy", label: "Accuracy", visible: true },
      { key: "combo", label: "Combo", visible: true },
      { key: "maxCombo", label: "Max Combo", visible: true },
      { key: "cps", label: "CPS", visible: true }
    ];

    this.formatConfigP2 = [
      { key: "botplay", label: "Botplay", visible: true },
      { key: "score", label: "Score", visible: true },
      { key: "misses", label: "Misses", visible: true },
      { key: "rating", label: "Rating", visible: true },
      { key: "accuracy", label: "Accuracy", visible: true },
      { key: "combo", label: "Combo", visible: true },
      { key: "maxCombo", label: "Max Combo", visible: true },
      { key: "cps", label: "CPS", visible: false } 
    ];
    
    this.targetScore = 0;
    this.displayScore = 0;
    this.displayScoreP2 = 0; 
    
    this._cpsClicks = [];
    this._registerClick = () => {
        const isBotplay = window.autoplay || (funkin.play && funkin.play.options && funkin.play.options.botplay);
        if (isBotplay) return;
        this._cpsClicks.push(Date.now());
    };
    
    if (this.scene.input && this.scene.input.keyboard) {
        this.scene.input.keyboard.on('keydown', this._registerClick);
        this.scene.input.on('pointerdown', this._registerClick);
    }
    
    this.scene.events.on('shutdown', this.destroy, this);
    this.scene.events.on('restart_song', this.reset, this);
    this.scene.events.on('restart', this.reset, this);

    this.text = scene.add.text(0, 0, "", {
      fontFamily: 'vcr', fontSize: '20px', color: '#ffffff', stroke: '#000000', strokeThickness: 2
    });
    this.text.setScrollFactor(0);
    this.text.setDepth(1500); 

    this.textP2 = scene.add.text(0, 0, "", {
        fontFamily: 'vcr', fontSize: '20px', color: '#ffffff', stroke: '#000000', strokeThickness: 2
    });
    this.textP2.setScrollFactor(0);
    this.textP2.setDepth(1500);

    if (funkin.play && funkin.play.data && funkin.play.data.camera && typeof funkin.play.data.camera.addObjToUI === "function") {
        funkin.play.data.camera.addObjToUI(this.text);
        funkin.play.data.camera.addObjToUI(this.textP2);
    }
    
    this.reset();
  }

  reset() {
      if (funkin.playerStaticsInSong) {
          Object.assign(funkin.playerStaticsInSong, { 
              score: 0, misses: 0, accuracy: 0.0, combo: 0, maxCombo: 0, rating: "N/A", sick: 0, good: 0, bad: 0, shit: 0, totalNotes: 0 
          });
      }
      if (funkin.player2StaticsInSong) {
          Object.assign(funkin.player2StaticsInSong, { 
              score: 0, misses: 0, accuracy: 0.0, combo: 0, maxCombo: 0, rating: "N/A", sick: 0, good: 0, bad: 0, shit: 0, totalNotes: 0 
          });
      }
      this.targetScore = 0;
      this.displayScore = 0;
      this.displayScoreP2 = 0;
      this._cpsClicks = [];
      this.renderText();
  }

  update(time, delta) {
     if (!this.text || !this.text.active) return;

     const isBotplay = window.autoplay || funkin.play?.options?.botplay === true;

     // 1. LÓGICA DE BOTPLAY: Congelar y forzar las estadísticas en 0 en tiempo real
     if (isBotplay) {
         if (funkin.playerStaticsInSong) {
             Object.assign(funkin.playerStaticsInSong, { 
                 score: 0, misses: 0, accuracy: 0.0, combo: 0, maxCombo: 0, rating: "N/A", sick: 0, good: 0, bad: 0, shit: 0, totalNotes: 0 
             });
         }
         if (funkin.player2StaticsInSong) {
             Object.assign(funkin.player2StaticsInSong, { 
                 score: 0, misses: 0, accuracy: 0.0, combo: 0, maxCombo: 0, rating: "N/A", sick: 0, good: 0, bad: 0, shit: 0, totalNotes: 0 
             });
         }
         this.displayScore = 0;
         this.displayScoreP2 = 0;
         this._cpsClicks = [];
     }

     const isTwoPlayer = funkin.play?.options?.twoPlayerLocal === true;
     const screenWidth = this.scene.scale.width;

     // 2. Lógica de posicionamiento Dinámico (Reacciona al instante)
     if (isTwoPlayer) {
         this.text.x = screenWidth - 20;
         this.text.setOrigin(1, 0.5);
         this.text.setAlign('right');
         
         this.textP2.x = 20;
         this.textP2.setOrigin(0, 0.5);
         this.textP2.setAlign('left');
         this.textP2.visible = true;
     } else {
         this.textP2.visible = false;
         
         if (this.alignMode === 'left') {
             this.text.x = 20;
             this.text.setOrigin(0, 0.5);
             this.text.setAlign('left');
         } else if (this.alignMode === 'right') {
             this.text.x = screenWidth - 20;
             this.text.setOrigin(1, 0.5);
             this.text.setAlign('right');
         } else {
             this.text.x = screenWidth / 2;
             this.text.setOrigin(0.5, 0.5);
             this.text.setAlign('center');
         }
     }

     // 3. Altura de los textos
     let targetY;
     if (isTwoPlayer || this.alignMode === 'left' || this.alignMode === 'right') {
         targetY = this.scene.scale.height / 2;
     } else if (this.scene.healthBar && this.scene.healthBar.bgSprite) {
         targetY = this.scene.healthBar.bgSprite.y + 35;
     } else {
         const isDownscroll = funkin.play?.options?.downscroll === true;
         targetY = (isDownscroll ? this.scene.scale.height * 0.11 : this.scene.scale.height * 0.89) + 35;
     }
     
     const safeDelta = delta > 0 ? delta : 16;
     const lerpSpeedPos = Math.min(1, (safeDelta / 1000) * 12);
     this.text.y = Phaser.Math.Linear(this.text.y, targetY, lerpSpeedPos);
     this.textP2.y = this.text.y;

     // 4. Interpolación de números (Solo subirá si Botplay está desactivado)
     const stepNumber = (target, current) => {
         let diff = target - current;
         let amount = diff * 0.2;
         if (Math.abs(amount) < 1) amount = diff > 0 ? 1 : -1;
         return current + (current === target ? 0 : amount);
     };

     if (funkin.playerStaticsInSong) {
         this.displayScore = Math.round(stepNumber(funkin.playerStaticsInSong.score, this.displayScore));
     }
     if (isTwoPlayer && funkin.player2StaticsInSong) {
         this.displayScoreP2 = Math.round(stepNumber(funkin.player2StaticsInSong.score, this.displayScoreP2));
     }

     this.renderText();
  }

  getStatsText(configList, stats, isP1) {
     const isBotplay = window.autoplay || funkin.play?.options?.botplay === true;
     
     // Respetando tu orden anterior: Si el Botplay está activo, ocultamos el resto y mostramos "Botplay"
     if (isBotplay) return "Botplay"; 

     let parts = [];
     const now = Date.now();
     if (isP1) this._cpsClicks = this._cpsClicks.filter(t => now - t < 1000);

     configList.forEach(config => {
         if (!config.visible || config.key === "botplay") return;
         let val = 0;
         switch(config.key) {
             case "score": val = isP1 ? this.displayScore : this.displayScoreP2; break;
             case "misses": val = stats.misses || 0; break;
             case "rating": val = stats.rating || "N/A"; break;
             case "accuracy": val = stats.accuracy ? parseFloat(stats.accuracy).toFixed(2) + "%" : "0.00%"; break;
             case "combo": val = stats.combo || 0; break;
             case "maxCombo": val = stats.maxCombo || 0; break;
             case "cps": val = isP1 ? this._cpsClicks.length : 0; break;
         }
         parts.push(`${config.label}: ${val}`);
     });

     return (funkin.play?.options?.twoPlayerLocal) ? parts.join("\n") : parts.join(" | ");
  }

  renderText() {
     if (!this.text || !this.text.active) return;
     if (funkin.playerStaticsInSong) {
         this.text.setText(this.getStatsText(this.formatConfig, funkin.playerStaticsInSong, true));
     }
     if (this.textP2.visible && funkin.player2StaticsInSong) {
         this.textP2.setText(this.getStatsText(this.formatConfigP2, funkin.player2StaticsInSong, false));
     }
  }

  destroy() {
      if (this.scene && this.scene.events) {
          this.scene.events.off('restart_song', this.reset, this);
          this.scene.events.off('restart', this.reset, this);
      }
      if (this.text) this.text.destroy();
      if (this.textP2) this.textP2.destroy();
  }
}

funkin.play.visuals.ui.ScoreText = ScoreText;