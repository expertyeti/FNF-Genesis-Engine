/**
 * @file rpc.js
 * @description Integración de Discord RPC con soporte para la API del motor y Rich Presence.
 */

const WebSocket = require('ws');
const DiscordRPC = require('discord-rpc');

const clientId = '1475824730689765416'; // ID del cliente de tu aplicación en Discord

DiscordRPC.register(clientId);

/** @type {DiscordRPC.Client} */
const rpc = new DiscordRPC.Client({ transport: 'ipc' });

/** @type {WebSocket} */
let ws;

/** @type {Date} */
const startTimestamp = new Date();

const args = process.argv.slice(2);

/** @type {string} */
let NL_PORT = '';

/** @type {string} */
let NL_TOKEN = '';

/** @type {string} */
let NL_EXTID = '';

args.forEach((arg) => {
	if (arg.startsWith('--nl-port=')) NL_PORT = arg.split('=')[1];
	if (arg.startsWith('--nl-token=')) NL_TOKEN = arg.split('=')[1];
	if (arg.startsWith('--nl-extension-id=')) NL_EXTID = arg.split('=')[1];
});

process.stdin.on('close', () => process.exit(0));
process.stdin.on('end', () => process.exit(0));

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

rpc.on('ready', () => {
	console.log('Conectado exitosamente a Discord');
	
	rpc.setActivity({
		startTimestamp: startTimestamp,
		largeImageKey: 'logo',
		largeImageText: 'Friday Night Funkin',
		instance: true // Flag vital para que Discord permita acoplar el overlay al detectar la sesión
	}).catch((err) => console.error('[Discord RPC] Error al poner la actividad:', err));
});

rpc.login({ clientId }).catch((err) => console.error(' Discord no esta abierto:', err.message));

if (NL_PORT && NL_TOKEN && NL_EXTID) {
	ws = new WebSocket(`ws://127.0.0.1:${NL_PORT}?extensionId=${NL_EXTID}`);

	ws.on('open', () => {
		ws.send(
			JSON.stringify({
				id: 'auth-extension',
				method: 'extension.connect',
				data: {
					extensionId: NL_EXTID,
					token: NL_TOKEN
				}
			})
		);
	});

	ws.on('message', (data) => {
		const rawString = data.toString();
		const message = JSON.parse(rawString);

		let eventName = message.event;

		if (eventName === 'eventToExtension' || eventName === 'broadcast') {
			eventName = message.data.event || message.event;
		}

		if (
			eventName === 'app_closing' ||
			eventName === 'windowClose' ||
			eventName === 'emergency_quit'
		) {
			try {
				rpc.destroy();
			} catch (e) {}
			setTimeout(() => process.exit(0), 50);
		}
	});

	ws.on('close', () => {
		process.exit(0);
	});

	ws.on('error', () => {
		process.exit(1);
	});
}