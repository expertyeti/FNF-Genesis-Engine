window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.skins = funkin.play.visuals.skins || {};

/**
 * Gestor de peticiones HTTP para la descarga de metadatos de las skins.
 */
class SkinDataLoader {
    static async load(skinName, forceReload = false) {
        const cb = forceReload ? `?t=${Date.now()}` : '';
        // Convierte a minúsculas por seguridad en la lectura de archivos (evita error "Funkin.json" vs "funkin.json")
        const targetSkin = (skinName && skinName.trim() !== "") ? skinName.trim().toLowerCase() : "funkin";
        const baseUrl = window.BASE_URL || "";
        
        let fallbackData = null;
        let mainData = null;

        try { 
            const resFallback = await fetch(`${baseUrl}assets/data/skins/funkin.json${cb}`);
            if (resFallback.ok) fallbackData = await resFallback.json();
        } catch (e) {
            console.warn(`[SkinDataLoader] No se pudo cargar la skin fallback funkin.json`);
        }

        try { 
            const resMain = await fetch(`${baseUrl}assets/data/skins/${targetSkin}.json${cb}`);
            if (resMain.ok) mainData = await resMain.json();
            else throw new Error(`HTTP Error ${resMain.status}`);
            console.log(`[SkinDataLoader] Skin "${targetSkin}" cargada correctamente.`);
        } catch (e) { 
            mainData = fallbackData; 
            console.warn(`[SkinDataLoader] Skin "${targetSkin}" no encontrada. Usando fallback.`, e);
        }

        return { skinData: mainData || fallbackData, fallbackSkinData: fallbackData };
    }
}

funkin.play.visuals.skins.SkinDataLoader = SkinDataLoader;