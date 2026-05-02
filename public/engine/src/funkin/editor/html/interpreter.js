window.funkin = window.funkin || {};
funkin.editor = funkin.editor || {};
funkin.editor.html = funkin.editor.html || {};

class XMLInterpreter {
  static initResizer() {
    if (window._genesisResizerInitialized) return;
    window._genesisResizerInitialized = true;

    document.documentElement.style.setProperty('--genesis-top-height', '36px');
    document.documentElement.style.setProperty('--genesis-bottom-height', '150px');
    document.documentElement.style.setProperty('--genesis-left-width', '250px');
    document.documentElement.style.setProperty('--genesis-right-width', '0px');

    let isResizing = false;
    let currentWindow = null;
    let direction = null;

    document.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('genesis-resizer')) {
        isResizing = true;
        currentWindow = e.target.closest('.genesis-window');
        if (e.target.classList.contains('resizer-right')) direction = 'right';
        else if (e.target.classList.contains('resizer-left')) direction = 'left';
        else if (e.target.classList.contains('resizer-top')) direction = 'top';
        document.body.style.cursor = direction === 'top' ? 'row-resize' : 'col-resize';
        e.preventDefault();
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing || !currentWindow) return;

      if (direction === 'right') { 
        const newWidth = e.clientX - currentWindow.getBoundingClientRect().left;
        if (newWidth > 150) {
            currentWindow.style.width = `${newWidth}px`;
            document.documentElement.style.setProperty('--genesis-left-width', `${newWidth}px`);
        }
      } 
      else if (direction === 'left') { 
        const newWidth = currentWindow.getBoundingClientRect().right - e.clientX;
        if (newWidth > 150) {
            currentWindow.style.width = `${newWidth}px`;
            document.documentElement.style.setProperty('--genesis-right-width', `${newWidth}px`);
        }
      }
      else if (direction === 'top') { 
        const newHeight = window.innerHeight - e.clientY;
        if (newHeight > 100) {
          document.documentElement.style.setProperty('--genesis-bottom-height', `${newHeight}px`);
        }
      }
      
      document.dispatchEvent(new Event("genesis:ui-resizing"));
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
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
        // En lugar de ejecutar a ciegas, encolamos el script para la carga síncrona
        window._genesisScriptsQueue = window._genesisScriptsQueue || new Set();
        window._genesisScriptsQueue.add(src);
      }

      let htmlTag = tagName === "window" ? "div" : tagName;
      let styles = "box-sizing: border-box; ";
      let classAttr = "";
      let contentPrefix = "";
      let contentSuffix = "";

      if (tagName === "viewport") {
        htmlTag = "div";
        classAttr = `id="genesis-viewport"`;
        styles += `position: absolute !important; top: var(--genesis-top-height) !important; left: var(--genesis-left-width) !important; right: var(--genesis-right-width) !important; bottom: var(--genesis-bottom-height) !important; pointer-events: none !important; background: transparent !important; z-index: 0 !important; `;
      } 
      else if (tagName === "window") {
        const anchored = attr("anchored") || "none";
        classAttr = `class="genesis-window anchored-${anchored}"`;
        const isResizable = attr("resizable") === "true";
        const h = attr("height");
        const w = attr("width");

        styles += `background: #1a1a1a; color: #FFFFFF; font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; pointer-events: auto; position: absolute; overflow: visible; border: none; `;

        if (anchored === "top") {
          document.documentElement.style.setProperty('--genesis-top-height', h || '36px');
          styles += `width: 100%; height: var(--genesis-top-height); top: 0; left: 0; z-index: 10010; `;
          contentPrefix = `<div class="window-content" style="flex-grow: 1; display: flex; align-items: center; gap: 2px; padding: 0 8px; width: 100%; height: 100%; box-sizing: border-box;">`;
        } 
        else if (anchored === "left") {
          document.documentElement.style.setProperty('--genesis-left-width', w || '250px');
          styles += `width: var(--genesis-left-width); top: var(--genesis-top-height); bottom: var(--genesis-bottom-height); left: 0; z-index: 10000; `;
          contentPrefix = `<div class="window-content" style="flex-grow: 1; display: flex; flex-direction: column; width: 100%; height: 100%; position: relative;">`;
          if (isResizable) contentSuffix = `<div class="genesis-resizer resizer-right" style="position: absolute; top: 0; right: 0; width: 4px; height: 100%; cursor: col-resize; z-index: 10001; background: transparent;"></div>`;
        }
        else if (anchored === "right") {
          document.documentElement.style.setProperty('--genesis-right-width', w || '250px');
          styles += `width: var(--genesis-right-width); top: var(--genesis-top-height); bottom: var(--genesis-bottom-height); right: 0; z-index: 10000; `;
          contentPrefix = `<div class="window-content" style="flex-grow: 1; display: flex; flex-direction: column; width: 100%; height: 100%; position: relative;">`;
          if (isResizable) contentSuffix = `<div class="genesis-resizer resizer-left" style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; cursor: col-resize; z-index: 10001; background: transparent;"></div>`;
        }
        else if (anchored === "bottom") {
          document.documentElement.style.setProperty('--genesis-bottom-height', h || '150px');
          styles += `width: 100%; height: var(--genesis-bottom-height); bottom: 0; left: 0; z-index: 10005; border-top: 1px solid #333; `;
          contentPrefix = `<div class="window-content" style="flex-grow: 1; display: flex; flex-direction: column; width: 100%; height: 100%; position: relative;">`;
          if (isResizable) {
            contentPrefix += `<div class="genesis-resizer resizer-top" style="position: absolute; top: -3px; left: 0; width: 100%; height: 6px; cursor: row-resize; z-index: 10006; background: transparent;"></div>`;
          }
        }

        contentSuffix = `</div>` + contentSuffix;
      }

      const attributes = Array.from(node.attributes)
        .filter(a => !["title", "style", "script", "shortcut", "anchored", "resizable"].includes(a.name))
        .map(a => `${a.name}="${a.value}"`).join(" ");

      let innerHTML = "";
      for (let child of node.childNodes) {
        innerHTML += convertNode(child);
      }

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