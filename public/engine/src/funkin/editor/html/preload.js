window.funkin = window.funkin || {};
funkin.editor = funkin.editor || {};
funkin.editor.html = funkin.editor.html || {};

class XMLPreloader {
  static async loadXMLs(files) {
    // Usamos el origen actual o BASE_URL para evitar errores de ruta
    const baseUrl = window.BASE_URL || "./"; 
    const cache = {};

    const loadPromises = files.map(async (file) => {
      try {
        // Aseguramos que la ruta sea assets/ui/editor/
        const url = `${baseUrl}assets/ui/editor/${file}.xml`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        cache[file] = text;
      } catch (e) {
        console.error(`[XMLPreloader] Error cargando: ${file}.xml en ${baseUrl}`, e);
      }
    });

    await Promise.all(loadPromises);
    return cache;
  }
}

funkin.editor.html.XMLPreloader = XMLPreloader;