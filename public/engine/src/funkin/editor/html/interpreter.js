window.funkin = window.funkin || {};
funkin.editor = funkin.editor || {};
funkin.editor.html = funkin.editor.html || {};

class XMLInterpreter {
  static parse(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");
    const baseUrl = window.BASE_URL || "";

    const convertNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) return node.nodeValue;
      if (node.nodeType !== Node.ELEMENT_NODE) return "";

      const attr = (name) => node.getAttribute(name);
      const tagName = node.tagName.toLowerCase();

      // --- INYECCIÓN DE ESTILOS (XSS) ---
      if (tagName === "link" && attr("style")) {
        const href = `${baseUrl}assets/ui/editor/css/${attr("style")}`;
        if (!document.querySelector(`link[href="${href}"]`)) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = href;
          document.head.appendChild(link);
        }
        return ""; 
      }

      // --- INYECCIÓN DE SCRIPTS (JS) ---
      if (tagName === "window" && attr("script")) {
        const src = `${baseUrl}assets/ui/editor/js/${attr("script")}`;
        // Timeout para asegurar que el DOM de Phaser ya existe
        setTimeout(() => {
          if (!document.querySelector(`script[src="${src}"]`)) {
            const script = document.createElement("script");
            script.src = src;
            script.type = "text/javascript";
            document.body.appendChild(script);
          }
        }, 50);
      }

      let htmlTag = tagName === "window" ? "div" : tagName;
      let styles = "box-sizing: border-box; ";
      let contentPrefix = "";
      let contentSuffix = "";

      if (tagName === "window") {
        const anchored = attr("anchored") || "none";
        // Si borderless es "false", ocultamos la barra de título
        const showTitleBar = attr("borderless") !== "false";
        
        let w = "100%";
        let h = attr("height") || "45px";

        styles += `width: ${w}; height: ${h}; background: #FFFFFF; color: #000000; font-family: sans-serif; display: flex; flex-direction: column; pointer-events: auto; position: absolute; left: 0; z-index: 10000; `;

        if (anchored === "top") styles += "top: 0; border-bottom: 2px solid #000000; ";

        if (showTitleBar) {
          contentPrefix = `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 12px; background: #FFFFFF; border-bottom: 1px solid #000000; width: 100%; box-sizing: border-box;">
              <span style="font-weight: bold; font-size: 13px;">${attr("title") || ""}</span>
            </div>`;
        }
        
        // El contenedor interno tiene padding para que los items no toquen los bordes de la ventana
        contentPrefix += `<div class="window-content" style="padding: 0 15px; flex-grow: 1; display: flex; align-items: center; gap: 0; overflow: visible; width: 100%; box-sizing: border-box;">`;
        contentSuffix = `</div>`;
      }

      // Filtramos 'title' para evitar el tooltip del navegador
      const attributes = Array.from(node.attributes)
        .filter(a => a.name !== "title" && a.name !== "style" && a.name !== "script")
        .map(a => `${a.name}="${a.value}"`)
        .join(" ");

      let innerHTML = "";
      for (let child of node.childNodes) innerHTML += convertNode(child);

      // Combinamos estilos XML con estilos del intérprete
      const finalStyles = styles + (attr("style") || "");

      return `<${htmlTag} ${attributes} style="${finalStyles}">
        ${contentPrefix}${innerHTML}${contentSuffix}
      </${htmlTag}>`;
    };

    return convertNode(xmlDoc.documentElement);
  }
}

funkin.editor.html.XMLInterpreter = XMLInterpreter;