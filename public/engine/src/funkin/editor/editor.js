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
    const xmlFiles = ["toolbar", "files"];
    // Cargamos los archivos desde el preloader
    const cache = await funkin.editor.html.XMLPreloader.loadXMLs(xmlFiles);
    
    let htmlContent = "";

    // Iteramos y parseamos CADA archivo de forma individual
    for (const file of xmlFiles) {
        if (cache[file]) {
            htmlContent += funkin.editor.html.XMLInterpreter.parse(cache[file]);
        }
    }

    // Si no se generó nada, salimos
    if (htmlContent === "") return;

    // Envolvemos todo en un div contenedor para que Phaser lo maneje como un solo DOMElement
    this.domElement = this.add.dom(0, 0).createFromHTML(`<div>${htmlContent}</div>`);
    this.domElement.setOrigin(0, 0);
    
    if (this.domElement.node) {
      // Forzar que el nodo del DOM ocupe todo el canvas real
      this.domElement.node.style.width = this.scale.width + 'px';
      this.domElement.node.style.height = this.scale.height + 'px';
      this.domElement.node.style.pointerEvents = 'none';
      
      // Crítico: Aseguramos que el contenedor padre sirva de ancla absoluta para las ventanas
      this.domElement.node.style.position = 'absolute';
      this.domElement.node.style.top = '0';
      this.domElement.node.style.left = '0';
    }

    this.scene.bringToTop();
  }
}

funkin.editor.EditorScene = EditorScene;
if (window.game) window.game.scene.add("EditorScene", EditorScene);