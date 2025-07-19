const { default: makeWASocket, DisconnectReason, fetchLatestBaileysVersion, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const { default: axios } = require("axios");
const P = require("pino");

async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
    const { version, isLatest } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        logger: P({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        console.log('📩 Mensaje recibido:', text);

        // Aquí puedes llamar a tu webhook de n8n
        const response = await axios.post('https://TU_WEBHOOK_N8N', {
            from: msg.key.remoteJid,
            message: text
        });

        if (response.data?.reply) {
            await sock.sendMessage(msg.key.remoteJid, { text: response.data.reply });
        }
    });
}

startSock();

