window.funkin = window.funkin || {};
funkin.editor = funkin.editor || {};
funkin.editor.html = funkin.editor.html || {};

class XMLInterpreter {
  static initResizer() {
    if (window._genesisResizerInitialized) return;
    window._genesisResizerInitialized = true;

    let isResizing = false;
    let currentWindow = null;
    let direction = null;

    document.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('genesis-resizer')) {
        isResizing = true;
        currentWindow = e.target.closest('.genesis-window');
        direction = e.target.classList.contains('resizer-right') ? 'right' : 'left';
        document.body.style.cursor = 'col-resize';
        e.preventDefault();
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing || !currentWindow) return;
      if (direction === 'right') {
        const newWidth = e.clientX - currentWindow.getBoundingClientRect().left;
        if (newWidth > 150 && newWidth < (window.innerWidth * 0.8)) {
          currentWindow.style.width = `${newWidth}px`;
        }
      } else {
        const newWidth = currentWindow.getBoundingClientRect().right - e.clientX;
        if (newWidth > 150 && newWidth < (window.innerWidth * 0.8)) {
          currentWindow.style.width = `${newWidth}px`;
        }
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        currentWindow = null;
        document.body.style.cursor = 'default';
        document.dispatchEvent(new Event("genesis:ui-rebuilt"));
      }
    });
  }

  static parse(xmlString) {
    this.initResizer();
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
          link.rel = "stylesheet"; link.href = href;
          document.head.appendChild(link);
        }
        return ""; 
      }

      if (tagName === "window" && attr("script")) {
        const src = `${baseUrl}assets/ui/editor/js/${attr("script")}`;
        setTimeout(() => {
          if (!document.querySelector(`script[src="${src}"]`)) {
            const script = document.createElement("script");
            script.src = src; script.type = "text/javascript";
            document.body.appendChild(script);
          } else {
            document.dispatchEvent(new Event("genesis:ui-rebuilt"));
          }
        }, 50);
      }

      let htmlTag = tagName === "window" ? "div" : tagName;
      let styles = "box-sizing: border-box; ";
      let classAttr = "";
      let contentPrefix = "";
      let contentSuffix = "";

      if (tagName === "window") {
        classAttr = 'class="genesis-window"';
        const anchored = attr("anchored") || "none";
        const isResizable = attr("resizable") === "true";
        const h = attr("height") || "36px";
        const w = attr("width") || "250px";

        // Color restaurado a #1a1a1a (gris oscuro por defecto del motor)
        styles += `background: #1a1a1a; color: #FFFFFF; font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; pointer-events: auto; position: absolute; overflow: visible; border: none; `;

        if (anchored === "top") {
          // Z-index alto para que submenús (z-index 10001) floten sobre todo
          styles += `width: 100%; height: ${h}; top: 0; left: 0; z-index: 10010; `;
          contentPrefix = `<div class="window-content" style="flex-grow: 1; display: flex; align-items: center; gap: 2px; padding: 0 8px; width: 100%; height: 100%; box-sizing: border-box;">`;
        } 
        else if (anchored === "left") {
          // Capa base para el explorador
          styles += `width: ${w}; height: calc(100% - 36px); top: 36px; left: 0; z-index: 10000; `;
          contentPrefix = `<div class="window-content" style="flex-grow: 1; display: flex; flex-direction: column; width: 100%; height: 100%; position: relative;">`;
          if (isResizable) {
            contentSuffix = `<div class="genesis-resizer resizer-right" style="position: absolute; top: 0; right: 0; width: 4px; height: 100%; cursor: col-resize; z-index: 10001; background: transparent;"></div>`;
          }
        }

        contentSuffix = `</div>` + contentSuffix;
      }

      const attributes = Array.from(node.attributes)
        .filter(a => !["title", "style", "script", "shortcut", "anchored", "resizable"].includes(a.name))
        .map(a => `${a.name}="${a.value}"`).join(" ");

      let innerHTML = "";
      for (let child of node.childNodes) innerHTML += convertNode(child);

      if (attr("shortcut")) {
        innerHTML += `<span class="shortcut-text">${attr("shortcut")}</span>`;
      }

      const finalStyles = styles + (attr("style") || "");
      return `<${htmlTag} ${classAttr} ${attributes} style="${finalStyles}">
        ${contentPrefix}${innerHTML}${contentSuffix}
      </${htmlTag}>`;
    };

    return convertNode(xmlDoc.documentElement);
  }
}
funkin.editor.html.XMLInterpreter = XMLInterpreter;