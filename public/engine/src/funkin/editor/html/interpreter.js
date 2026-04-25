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

      // --- LÓGICA DE REINYECCIÓN DE EVENTOS ---
      if (tagName === "window" && attr("script")) {
        const src = `${baseUrl}assets/ui/editor/js/${attr("script")}`;
        setTimeout(() => {
          if (!document.querySelector(`script[src="${src}"]`)) {
            const script = document.createElement("script");
            script.src = src;
            script.type = "text/javascript";
            document.body.appendChild(script);
          } else {
            // El script ya existe (la escena se reinició).
            // Avisamos globalmente que hay un nuevo DOM listo para recibir eventos.
            document.dispatchEvent(new Event("genesis:ui-rebuilt"));
          }
        }, 50);
      }

      let htmlTag = tagName === "window" ? "div" : tagName;
      let styles = "box-sizing: border-box; ";
      let contentPrefix = "";
      let contentSuffix = "";

      if (tagName === "window") {
        const anchored = attr("anchored") || "none";
        let h = attr("height") || "35px";

        styles += `width: 100%; height: ${h}; background: #1a1a1a; color: #FFFFFF; font-family: sans-serif; display: flex; flex-direction: column; pointer-events: auto; position: absolute; left: 0; z-index: 10000; overflow: visible; `;
        if (anchored === "top") styles += "top: 0; ";
        
        contentPrefix += `<div class="window-content" style="flex-grow: 1; display: flex; align-items: center; gap: 2px; padding: 0 8px; width: 100%; box-sizing: border-box;">`;
        contentSuffix = `</div>`;
      }

      const attributes = Array.from(node.attributes)
        .filter(a => !["title", "style", "script", "shortcut"].includes(a.name))
        .map(a => `${a.name}="${a.value}"`)
        .join(" ");

      let innerHTML = "";
      for (let child of node.childNodes) innerHTML += convertNode(child);

      if (attr("shortcut")) {
        innerHTML += `<span class="shortcut-text">${attr("shortcut")}</span>`;
      }

      const finalStyles = styles + (attr("style") || "");

      return `<${htmlTag} ${attributes} style="${finalStyles}">
        ${contentPrefix}${innerHTML}${contentSuffix}
      </${htmlTag}>`;
    };

    return convertNode(xmlDoc.documentElement);
  }
}

funkin.editor.html.XMLInterpreter = XMLInterpreter;