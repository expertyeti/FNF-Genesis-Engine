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
        const targetSkin = skinName?.trim() ? skinName : "funkin";
        const baseUrl = window.BASE_URL || "";
        
        let fallbackData = null;
        let mainData = null;

        try { fallbackData = await (await fetch(`${baseUrl}assets/data/skins/funkin.json${cb}`)).json(); } catch (e) {}
        try { mainData = await (await fetch(`${baseUrl}assets/data/skins/${targetSkin}.json${cb}`)).json(); } catch (e) { mainData = fallbackData; }

        return { skinData: mainData || fallbackData, fallbackSkinData: fallbackData };
    }
}

funkin.play.visuals.skins.SkinDataLoader = SkinDataLoader;