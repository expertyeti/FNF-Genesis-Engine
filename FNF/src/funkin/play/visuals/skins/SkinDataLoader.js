/**
 * @file src/funkin/play/visuals/skins/SkinDataLoader.js
 * Exclusivo para gestionar las peticiones HTTP y descargar los JSON de las skins.
 */

class SkinDataLoader {
    static async load(skinName, forceReload = false) {
        const cb = forceReload ? `?t=${Date.now()}` : '';
        let fallbackData = null;
        let mainData = null;

        try {
            const fallbackRes = await fetch(`public/data/skins/Funkin.json${cb}`);
            if (fallbackRes.ok) {
                fallbackData = await fallbackRes.json();
            }
        } catch (e) {
            console.warn("No se pudo cargar la skin de respaldo 'Funkin'.", e);
        }

        const targetSkin = (skinName && skinName.trim() !== "") ? skinName : "Funkin";
        
        try {
            const mainRes = await fetch(`public/data/skins/${targetSkin}.json${cb}`);
            if (mainRes.ok) {
                mainData = await mainRes.json();
            } else {
                mainData = fallbackData;
            }
        } catch (error) {
            console.warn(`Error cargando skin '${targetSkin}', recayendo en Funkin.`, error);
            mainData = fallbackData;
        }

        return { skinData: mainData, fallbackSkinData: fallbackData };
    }
}

funkin.play = funkin.play || {};
funkin.play.SkinDataLoader = SkinDataLoader;