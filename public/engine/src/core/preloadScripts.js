/**
 * @file preloadScripts.js (Client-Side Dynamic Loader)
 * Lee preload.scripts.json mediante fetch y carga los scripts dinámicamente en el navegador.
 * Arquitectura sin-compilación (No-Build).
 */

(async function initGenesisEngine() {
    // 1. Asegurar el BASE_URL para Neutralino / React Native
    if (!window.BASE_URL) {
        window.BASE_URL = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, "/");
    }

    const jsonUrl = window.BASE_URL + "src/core/preload.scripts.json";

    try {
        // 2. Descargar el JSON directamente desde el navegador
        const response = await fetch(jsonUrl);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const scripts = await response.json();
        console.log(`[Engine Loader] Inyectando ${scripts.length} módulos...`);

        let loadedCounter = 0;
        const totalScripts = scripts.length;

        // 3. Inyectar los scripts dinámicamente
        for (let i = 0; i < totalScripts; i++) {
            const scriptEl = document.createElement("script");
            
            // Combinar BASE_URL con la ruta relativa del JSON
            scriptEl.src = window.BASE_URL + scripts[i];
            
            // LA MAGIA AQUÍ: Permite descargar en paralelo pero ejecuta secuencialmente
            scriptEl.async = false; 

            scriptEl.onload = () => {
                loadedCounter++;
                if (loadedCounter === totalScripts) {
                    console.log("[Engine Loader] ¡Todos los módulos cargados! Motor listo.");
                }
            };

            scriptEl.onerror = () => {
                console.error(`[Engine Loader] ❌ Error crítico al cargar: ${scripts[i]}`);
            };

            document.head.appendChild(scriptEl);
        }

    } catch (error) {
        console.error("[Engine Loader] ❌ Fallo al inicializar el motor:", error);
    }
})();