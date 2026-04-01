/**
 * @file src/core/logger.js
 * Intercepta console.log para añadir el nombre del archivo con un color persistente y no pastel.
 */
(function() {
    const originalLog = console.log;

    // Genera un color HSL persistente basado en un string (hash) evitando tonos pastel
    function stringToColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        // Calculamos el Tono (Hue) entre 0 y 360
        const h = Math.abs(hash) % 360;
        // Saturación alta para que el color sea vivo (85%)
        const s = 85; 
        // Luminosidad media-baja para evitar que sea pastel o demasiado claro (40%)
        const l = 40; 
        
        return `hsl(${h}, ${s}%, ${l}%)`;
    }

    // Extrae el nombre del archivo js actual desde la pila de llamadas (stack trace)
    function getCallerFileName() {
        try {
            const err = new Error();
            const stack = err.stack.split('\n');
            
            for (let i = 1; i < stack.length; i++) {
                const line = stack[i];
                if (!line.includes('logger.js') && !line.includes('Error')) {
                    const match = line.match(/([a-zA-Z0-9_.-]+\.js)/);
                    if (match && match[1]) {
                        return match[1];
                    }
                }
            }
        } catch (e) {}
        return 'Desconocido';
    }

    // Sobrescribimos el console.log global
    console.log = function(...args) {
        const fileName = getCallerFileName();
        
        if (fileName !== 'Desconocido') {
            const color = stringToColor(fileName);
            // El color de fondo ahora siempre será un tono fuerte/oscuro, por lo que el texto blanco se lee perfecto
            const style = `background: ${color}; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;`;
            const resetStyle = 'background: transparent; color: inherit;';

            if (typeof args[0] === 'string') {
                const msg = args.shift();
                originalLog.call(console, `%c[${fileName}]%c ` + msg, style, resetStyle, ...args);
            } else {
                originalLog.call(console, `%c[${fileName}]`, style, ...args);
            }
        } else {
            originalLog.apply(console, args);
        }
    };
})();