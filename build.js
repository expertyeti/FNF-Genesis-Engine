const { spawn, exec } = require('child_process');

const colors = {
    reset: "\x1b[0m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m"
};

// Nueva funcion para limpiar procesos fantasma
function killProcess(processName) {
    return new Promise((resolve) => {
        console.log(`${colors.yellow}--- Verificando y cerrando procesos previos: ${processName} ---${colors.reset}`);
        
        // Usamos exec porque no necesitamos ver la salida en tiempo real de esto
        exec(`taskkill /F /IM "${processName}" /T`, (error) => {
            // Si hay un error, normalmente es porque el proceso no existia (lo cual es bueno).
            // Por eso resolvemos la promesa de todos modos para que el script continue.
            console.log(`${colors.green}--- Limpieza de procesos terminada ---${colors.reset}\n`);
            resolve();
        });
    });
}

function runCommand(command, description) {
    return new Promise((resolve, reject) => {
        console.log(`${colors.cyan}--- Iniciando: ${description} ---${colors.reset}`);
        
        const child = spawn(command, { stdio: 'inherit', shell: true });

        child.on('close', (code) => {
            if (code === 0) {
                console.log(`${colors.green}--- Terminado exitosamente: ${description} ---${colors.reset}\n`);
                resolve();
            } else {
                console.log(`${colors.red}--- Error en: ${description} (Codigo de salida: ${code}) ---${colors.reset}\n`);
                reject(new Error(`Fallo en ${description}`));
            }
        });
    });
}

async function buildAndPack() {
    try {
        // Paso 0: Matar cualquier instancia del motor que haya quedado abierta
        await killProcess('Genesis Engine-win_x64.exe');

        // Paso 1: Ejecutar neu build
        await runCommand('neu build', 'Compilacion Neutralino (neu build)');

        // Paso 2: Rutas y ejecucion de Inno Setup
        const isccPath = 'C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe';
        const issFile = 'C:\\Users\\Britex\\Proyectos\\Genesis\\pack.iss';
        const innoCommand = `"${isccPath}" "${issFile}"`;
        
        await runCommand(innoCommand, 'Empaquetado Inno Setup (ISCC)');

        console.log(`${colors.green}Todo el proceso finalizo correctamente. Instalador listo.${colors.reset}`);
        
    } catch (error) {
        console.error(`${colors.red}El proceso general se detuvo debido a un error previo.${colors.reset}`);
        process.exit(1);
    }
}

buildAndPack();