const { makeWASocket, useSingleFileAuthState } = require("@whiskeysockets/baileys");
const { default: axios } = require("axios");

const { state, saveState } = useSingleFileAuthState('./auth_info.json');

async function connectToWhatsApp() {
    const sock = makeWASocket({
        auth: state
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        // Aquí puedes integrar con tu webhook de n8n
        const response = await axios.post("https://TU-WEBHOOK-N8N", {
            from: msg.key.remoteJid,
            message: text
        });

        if (response.data?.reply) {
            await sock.sendMessage(msg.key.remoteJid, { text: response.data.reply });
        }
    });

    sock.ev.on('creds.update', saveState);
}

connectToWhatsApp();
