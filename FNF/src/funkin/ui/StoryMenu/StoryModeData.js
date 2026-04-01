class StoryModeData {
    constructor() {
        this.weeks = [];
        this.weekKeys = [];
        this.difficulties = ["easy", "normal", "hard"];
        
        this.selectedWeekIndex = 0;
        this.selectedDifficulty = 1; 
    }

    async loadWeeksData(scene) {
        this.weeks = [];
        this.weekKeys = [];
        const assetsToLoad = []; 

        try {
            const response = await fetch(`public/data/ui/weeks.txt?t=${Date.now()}`);
            if (!response.ok) throw new Error("No se pudo cargar weeks.txt");
            
            const text = await response.text();
            const weekIds = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

            for (const weekId of weekIds) {
                try {
                    const jsonRes = await fetch(`public/data/weeks/${weekId}.json?t=${Date.now()}`);
                    if (!jsonRes.ok) continue;

                    let json;
                    try {
                        json = await jsonRes.json();
                    } catch (parseError) {
                        console.warn(`[StoryModeData] Nivel omitido: El JSON de "${weekId}" está corrupto o mal formateado.`);
                        continue; 
                    }

                    if (json.visible === false) continue;

                    const weekTitle = json.weekTitle || weekId;

                    this.weeks.push({
                        id: weekId,
                        titleImage: weekTitle,
                        data: json
                    });
                    this.weekKeys.push(weekId);

                    if (!scene.textures.exists(weekTitle)) {
                        assetsToLoad.push({ type: 'image', key: weekTitle, url: `public/images/menu/storymode/titles/${weekTitle}.png` });
                    }

                    if (json.weekBackground && typeof json.weekBackground === 'string') {
                        const bgVal = json.weekBackground.trim();
                        if (bgVal !== "" && !bgVal.startsWith("#") && !scene.textures.exists(bgVal)) {
                            assetsToLoad.push({ type: 'image', key: bgVal, url: `public/images/menu/storymode/backgrounds/${bgVal}.png` });
                        }
                    }

                    if (json.weekCharacters && typeof json.weekCharacters === 'object' && !Array.isArray(json.weekCharacters)) {
                        Object.keys(json.weekCharacters).forEach(charKey => {
                            const charData = json.weekCharacters[charKey];
                            const pathName = (charData.path && charData.path.trim() !== "") ? charData.path : charKey;
                            const texKey = `menu_char_${pathName}`;
                            
                            if (!scene.textures.exists(texKey)) {
                                // 1. Cargador normal
                                assetsToLoad.push({
                                    type: 'atlas',
                                    key: texKey,
                                    png: `public/images/menu/storymode/menucharacters/Menu_${pathName}.png`,
                                    xml: `public/images/menu/storymode/menucharacters/Menu_${pathName}.xml`
                                });
                                // 2. Cargamos el texto para el fix
                                assetsToLoad.push({
                                    type: 'text',
                                    key: texKey + '_xml_data',
                                    url: `public/images/menu/storymode/menucharacters/Menu_${pathName}.xml`
                                });
                            }
                        });
                    }

                } catch (e) {
                    console.warn(`[StoryModeData] Error en la red al cargar ${weekId}:`, e);
                }
            }

            if (this.selectedWeekIndex >= this.weeks.length) {
                this.selectedWeekIndex = 0;
            }

            if (assetsToLoad.length > 0) {
                return new Promise((resolve) => {
                    let hasStarted = false;
                    assetsToLoad.forEach(asset => {
                        if (asset.type === 'image') scene.load.image(asset.key, asset.url);
                        if (asset.type === 'atlas') scene.load.atlasXML(asset.key, asset.png, asset.xml);
                        if (asset.type === 'text') scene.load.text(asset.key, asset.url);
                        hasStarted = true;
                    });
                    
                    if (hasStarted) {
                        scene.load.once('complete', () => {
                            
                            // 3. AQUÍ SE LLAMA A LA CLASE MODULAR
                            assetsToLoad.forEach(asset => {
                                if (asset.type === 'atlas') {
                                    const texKey = asset.key;
                                    const xmlText = scene.cache.text.get(texKey + '_xml_data');
                                    
                                    if (xmlText && funkin.animation.sparrow) {
                                        funkin.animation.sparrow.fixPhaserSparrow(scene, texKey, xmlText);
                                    }
                                }
                            });
                            
                            resolve();
                        });
                        scene.load.start();
                    } else {
                        resolve();
                    }
                });
            } else {
                return Promise.resolve();
            }

        } catch (error) {
            console.error("[StoryModeData] Error fatal:", error);
            return Promise.resolve(); 
        }
    }

    changeWeek(direction) {
        if (this.weekKeys.length === 0) return;
        this.selectedWeekIndex = (this.selectedWeekIndex + direction + this.weekKeys.length) % this.weekKeys.length;
    }

    changeDifficulty(direction) {
        this.selectedDifficulty = (this.selectedDifficulty + direction + this.difficulties.length) % this.difficulties.length;
    }

    getCurrentWeek() {
        if (this.weeks.length === 0) return null;
        return this.weeks[this.selectedWeekIndex];
    }

    getCurrentWeekKey() {
        if (this.weekKeys.length === 0) return null;
        return this.weekKeys[this.selectedWeekIndex];
    }

    getCurrentDifficultyName() {
        return this.difficulties[this.selectedDifficulty];
    }
}

window.StoryModeData = StoryModeData;