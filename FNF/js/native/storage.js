/**
 * @file src/native/storage.js
 * Wrapper global para el sistema de guardado persistente (Neutralino o Web).
 */

window.funkin = window.funkin || {};

window.funkin.storage = {
    /**
     * Guarda un valor en el almacenamiento.
     * @param {string} key 
     * @param {any} value - Se convertirá a string automáticamente.
     */
    async save(key, value) {
        const strValue = String(value); // Aseguramos que sea texto
        
        if (typeof Neutralino !== 'undefined') {
            try {
                await Neutralino.storage.setData(key, strValue);
            } catch (e) {
                console.error(`[Storage] Error al guardar '${key}' en Neutralino:`, e);
            }
        } else {
            localStorage.setItem(key, strValue);
        }
    },

    /**
     * Obtiene un valor del almacenamiento.
     * @param {string} key 
     * @returns {Promise<string|null>} Devuelve el string o null si no existe.
     */
    async get(key) {
        if (typeof Neutralino !== 'undefined') {
            try {
                return await Neutralino.storage.getData(key);
            } catch (e) {
                // Neutralino lanza un error nativo si la key no existe aún.
                // Lo atrapamos y devolvemos null para que actúe igual que localStorage.
                return null; 
            }
        } else {
            return localStorage.getItem(key);
        }
    },

    /**
     * Elimina una clave del almacenamiento.
     * @param {string} key 
     */
    async delete(key) {
        if (typeof Neutralino !== 'undefined') {
            try {
                // Neutralino no tiene un "deleteData" oficial en todas sus versiones,
                // así que la convención segura es sobreescribir con un string vacío.
                await Neutralino.storage.setData(key, '');
            } catch (e) {
                console.error(`[Storage] Error al borrar '${key}' en Neutralino:`, e);
            }
        } else {
            localStorage.removeItem(key);
        }
    }
};