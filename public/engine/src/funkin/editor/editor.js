window.funkin = window.funkin || {};
funkin.editor = funkin.editor || {};

class EditorScene extends Phaser.Scene {
  constructor() {
    super({ key: "EditorScene" });
  }

  create() {
    const playScene = this.scene.get("PlayScene");
    if (playScene) {
      playScene.events.once("shutdown", () => {
        this.scene.stop("EditorScene");
      }, this);
    }
    this.buildUI();
  }

  async buildUI() {
    const cache = await funkin.editor.html.XMLPreloader.loadXMLs(["toolbar"]);
    const xmlContent = cache["toolbar"];
    if (!xmlContent) return;

    const htmlContent = funkin.editor.html.XMLInterpreter.parse(xmlContent);

    this.domElement = this.add.dom(0, 0).createFromHTML(htmlContent);
    this.domElement.setOrigin(0, 0);
    
    if (this.domElement.node) {
      // Forzar que el nodo del DOM ocupe todo el canvas real
      this.domElement.node.style.width = this.scale.width + 'px';
      this.domElement.node.style.height = this.scale.height + 'px';
      this.domElement.node.style.pointerEvents = 'none';
    }

    this.scene.bringToTop();
  }
}

funkin.editor.EditorScene = EditorScene;
if (window.game) window.game.scene.add("EditorScene", EditorScene);