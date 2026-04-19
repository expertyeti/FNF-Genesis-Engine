window.funkin = window.funkin || {};
funkin.playDebugging = funkin.playDebugging || {};

class CharacterPositionDebug {
  constructor(scene) {
    this.scene = scene;
    this.debugObjects = [];
    this.isVisible = false;
    this.isDestroyed = false;

    this.keydownHandler = this.onKeyDown.bind(this);
    if (this.scene && this.scene.input && this.scene.input.keyboard) {
        this.scene.input.keyboard.on("keydown", this.keydownHandler);
    }
    
    this.scene.events.once("shutdown", this.destroy, this);
  }

  onKeyDown(event) {
    if (window.funkin.debugMode && event.altKey && event.code === "KeyX") {
      this.toggle();
    }
  }

  drawPositions() {
    let foundAny = false;

    // Roles que buscaremos en el JSON del Stage
    const roles = ["player", "opponent", "spectator"];

    if (!funkin.play.stageManager) {
        console.warn("[CharacterPositionDebug] StageManager no está disponible.");
        return;
    }

    roles.forEach((role) => {
      // Obtenemos los datos puros y directos desde el JSON cargado
      let roleData = funkin.play.stageManager.getCharacterData(role);
      
      if (roleData) {
          let stagePos = null;
          
          if (roleData.position && Array.isArray(roleData.position)) {
              stagePos = roleData.position;
          } else if (Array.isArray(roleData)) {
              stagePos = roleData;
          }

          if (stagePos && stagePos.length >= 2) {
              this.createMarker(role, stagePos[0], stagePos[1]);
              foundAny = true;
          }
      }
    });

    if (!foundAny) {
    }
  }

  createMarker(role, targetX, targetY) {
    // Colores para distinguir qué crucecita pertenece a cada quién
    let roleColor = 0xffffff;
    if (role === "player") roleColor = 0x00ff00; // Verde
    if (role === "opponent") roleColor = 0xff0000; // Rojo
    if (role === "spectator") roleColor = 0x0000ff; // Azul

    const markerSize = 80;
    const markerAlpha = 0.8;

    const groundLine = this.scene.add.line(targetX, targetY, 0, 0, markerSize, 0, roleColor, markerAlpha);
    groundLine.setDepth(999999);
    groundLine.setScrollFactor(1);
    groundLine.setVisible(this.isVisible);
    groundLine.setOrigin(0.5);

    const verticalLine = this.scene.add.line(targetX, targetY, 0, 0, 0, markerSize / 2, roleColor, markerAlpha);
    verticalLine.setDepth(999999);
    verticalLine.setScrollFactor(1);
    verticalLine.setVisible(this.isVisible);
    verticalLine.setOrigin(0.5, 1);

    const debugCircle = this.scene.add.circle(targetX, targetY, markerSize / 4, roleColor, markerAlpha);
    debugCircle.setDepth(999999);
    debugCircle.setScrollFactor(1);
    debugCircle.setVisible(this.isVisible);

    const debugText = this.scene.add
      .text(targetX, targetY - markerSize / 1.5, role.toUpperCase(), {
        fontFamily: "vcr, Arial, sans-serif",
        fontSize: "24px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5, 1);

    debugText.setDepth(999999);
    debugText.setScrollFactor(1);
    debugText.setVisible(this.isVisible);

    if (
      window.funkin.play &&
      window.funkin.play.data &&
      window.funkin.play.data.camera &&
      typeof window.funkin.play.data.camera.addObjToGame === "function"
    ) {
      window.funkin.play.data.camera.addObjToGame(groundLine);
      window.funkin.play.data.camera.addObjToGame(verticalLine);
      window.funkin.play.data.camera.addObjToGame(debugCircle);
      window.funkin.play.data.camera.addObjToGame(debugText);
    }

    this.debugObjects.push(groundLine, verticalLine, debugCircle, debugText);
  }

  toggle() {
    if (this.debugObjects.length === 0) {
      this.drawPositions();
    }

    if (this.debugObjects.length === 0) return;

    this.isVisible = !this.isVisible;
    this.debugObjects.forEach((obj) => {
      if (obj) {
        obj.setVisible(this.isVisible);
      }
    });

    console.log("Position indicators: " + (this.isVisible ? "VISIBLE" : "HIDDEN"));
  }

  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    if (this.scene && this.scene.input && this.scene.input.keyboard) {
        this.scene.input.keyboard.off("keydown", this.keydownHandler);
    }

    this.debugObjects.forEach((obj) => {
      if (obj && typeof obj.destroy === "function") obj.destroy();
    });
    this.debugObjects = [];

    if (this.scene && this.scene.events) {
      this.scene.events.off("shutdown", this.destroy, this);
    }
  }
}

funkin.playDebugging.CharacterPositionDebug = CharacterPositionDebug;