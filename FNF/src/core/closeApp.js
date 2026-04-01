/**
 * @file src/core/closeApp.js
 * Script para forzar el cierre de la aplicación Genesis Engine y sus extensiones.
 */

class AppCloser {
    // Bandera para evitar que la secuencia de cierre se ejecute más de una vez
    static isClosing = false;

    static async forceQuit() {
        if (AppCloser.isClosing) return;
        AppCloser.isClosing = true;

        if (typeof Neutralino !== 'undefined') {
            console.log("Iniciando secuencia de cierre seguro y forzado...");
            
            try {
                // 1. Avisar a todas las extensiones que la app se está cerrando.
                // (Tus extensiones de Node.js deben escuchar 'app_closing' y ejecutar process.exit(0))
                await Neutralino.events.broadcast('app_closing', 'force_quit');
                
                // 2. Pequeño delay de 150ms para darles tiempo a las extensiones en segundo plano de morir
                await new Promise(resolve => setTimeout(resolve, 150));
                
                // 3. Matar el proceso principal
                await Neutralino.app.exit();
            } catch (e) {
                console.error("Error al forzar el cierre de Neutralino:", e);
                window.close(); // Fallback si falla Neutralino
            }
        } else {
            // Comportamiento normal si estás probando en un navegador web convencional
            window.close();
        }
    }

    static registerListener() {
        // 1. Escuchar el cierre desde la 'X' de la ventana (Neutralino)
        // Esto también suele ser disparado por el sistema operativo al presionar ALT+F4
        if (typeof Neutralino !== 'undefined') {
            Neutralino.events.on('windowClose', () => {
                AppCloser.forceQuit();
            });
        }

        // 2. Interceptar explícitamente ALT + F4 desde el teclado (DOM)
        // Sirve como red de seguridad por si el motor web intercepta el comando antes que la ventana nativa
        window.addEventListener('keydown', (e) => {
            if (e.altKey && (e.key === 'F4' || e.code === 'F4')) {
                e.preventDefault(); // Evita el cierre abrupto nativo del WebView
                console.log("ALT+F4 detectado");
                AppCloser.forceQuit();
            }
        });

        // 3. Cierre "por otros medios" (Última línea de defensa)
        // El evento beforeunload se dispara justo antes de que el documento web se destruya.
        window.addEventListener('beforeunload', (e) => {
            if (!AppCloser.isClosing && typeof Neutralino !== 'undefined') {
                console.log("Cierre inesperado detectado. Avisando a las extensiones...");
                // Como 'beforeunload' es síncrono, no podemos usar 'await' aquí con seguridad,
                // pero enviamos el broadcast de emergencia de tipo "dispara y olvida".
                Neutralino.events.broadcast('app_closing', 'emergency_quit').catch(() => {});
            }
        });
    }
}

window.AppCloser = AppCloser;