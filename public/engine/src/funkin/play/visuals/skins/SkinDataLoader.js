/**
 * @file SkinDataLoader.js
 * Exclusivo para gestionar las peticiones HTTP y descargar los JSON de las skins.
 */

// Garantizamos el namespace global
window.funkin = window.funkin || {};
funkin.play = funkin.play || {};
funkin.play.visuals = funkin.play.visuals || {};
funkin.play.visuals.skins = funkin.play.visuals.skins || {};

class SkinDataLoader {
    static async load(skinName, forceReload = false) {
        const cb = forceReload ? `?t=${Date.now()}` : '';
        let fallbackData = null;
        let mainData = null;

        try {
            const fallbackRes = await fetch(`${window.BASE_URL}assets/data/skins/Funkin.json${cb}`);
            if (fallbackRes.ok) {
                fallbackData = await fallbackRes.json();
            }
        } catch (e) {
            console.warn("[Genesis Engine] No se pudo cargar la skin de respaldo 'Funkin'.", e);
        }

        const targetSkin = (skinName && skinName.trim() !== "") ? skinName : "Funkin";
        
        try {
            const mainRes = await fetch(`${window.BASE_URL}assets/data/skins/${targetSkin}.json${cb}`);
            if (mainRes.ok) {
                mainData = await mainRes.json();
            } else {
                mainData = fallbackData;
            }
        } catch (error) {
            console.warn(`[Genesis Engine] Error cargando skin '${targetSkin}', recayendo en Funkin.`, error);
            mainData = fallbackData;
        }

        return { skinData: mainData, fallbackSkinData: fallbackData };
    }
}

funkin.play.visuals.skins.SkinDataLoader = SkinDataLoader;