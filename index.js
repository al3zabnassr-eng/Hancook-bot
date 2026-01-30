import {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers
} from '@whiskeysockets/baileys';
import pino from 'pino';
import express from 'express';
import { handleMessage } from './handler.js';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// رقم الهاتف المخصص للمستخدم (تأكد أنه نفس رقمك)
const PHONE_NUMBER = '967730403327';
const OWNER_JID = PHONE_NUMBER + '@s.whatsapp.net';

// إعداد خادم Express لضمان بقاء الخدمة نشطة على Render
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.status(200).json({ status: 'Hancock Bot is running', target_number: PHONE_NUMBER });
});

app.listen(PORT, () => {
    console.log(chalk.green(`✅ Server is running on port ${PORT}`));
});

async function connectToWhatsApp() {
    console.log(chalk.cyan.bold('\n🧊 HANCOCK BOT - STARTING FOR ' + PHONE_NUMBER + ' 🧊\n'));
    
    // إنشاء مجلد auth_info_baileys إذا لم يكن موجوداً لحفظ الجلسة
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome'),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        shouldIgnoreJid: (jid) => /status@broadcast/.test(jid),
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 15000,
    });

    // طلب كود الاقتران تلقائياً إذا لم تكن هناك جلسة نشطة
    if (!sock.authState.creds.registered) {
        console.log(chalk.yellow('⏳ Requesting Pairing Code for: ' + PHONE_NUMBER));
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(PHONE_NUMBER);
                console.log(chalk.white.bgGreen.bold('\n\n========================================='));
                console.log(chalk.white.bgGreen.bold('      YOUR WHATSAPP PAIRING CODE:       '));
                console.log(chalk.white.bgGreen.bold(`             ${code}             `));
                console.log(chalk.white.bgGreen.bold('=========================================\n\n'));
            } catch (err) {
                console.error('❌ Failed to request pairing code:', err);
            }
        }, 5000);
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'connecting') {
            console.log(chalk.blue('⏳ Connecting to WhatsApp...'));
        }

        if (connection === 'open') {
            console.log(chalk.green.bold('\n✅ SUCCESS: Connected to ' + PHONE_NUMBER + '\n'));
            
            // إرسال رسالة ترحيبية للمالك عند نجاح الربط
            setTimeout(async () => {
                try {
                    await sock.sendMessage(OWNER_JID, { 
                        text: `*🧊 تم ربط هانكوك بوت بنجاح! 🧊*\n\nمرحباً بك يا صاحب الرقم ${PHONE_NUMBER}\nالبوت الآن يعمل وجاهز لاستقبال أوامرك بدون مجلدات داتا.\n\nاكتب *.مساعدة* لعرض قائمة الأوامر.` 
                    });
                    console.log(chalk.cyan('✅ Welcome message sent to owner.'));
                } catch (err) {
                    console.error('❌ Failed to send welcome message:', err);
                }
            }, 3000);
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red('❌ Connection closed.'));
            if (shouldReconnect) {
                console.log(chalk.yellow('🔄 Reconnecting...'));
                setTimeout(() => connectToWhatsApp(), 5000);
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const message = m.messages[0];
            if (!message.message || message.key.fromMe) return;

            // تم التعديل: نرسل OWNER_JID و PHONE_NUMBER بشكل صحيح للـ handler
            await handleMessage(sock, message, OWNER_JID, PHONE_NUMBER);
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });

    return sock;
}

connectToWhatsApp().catch(err => {
    console.error(chalk.red('Fatal Error:'), err);
    process.exit(1);
});
    console.log(chalk.cyan.bold('\n🧊 HANCOCK BOT - STARTING FOR ' + PHONE_NUMBER + ' 🧊\n'));
    
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome'),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        shouldIgnoreJid: (jid) => /status@broadcast/.test(jid),
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 15000,
    });

    // طلب كود الاقتران تلقائياً إذا لم تكن هناك جلسة نشطة
    if (!sock.authState.creds.registered) {
        console.log(chalk.yellow('⏳ Requesting Pairing Code for: ' + PHONE_NUMBER));
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(PHONE_NUMBER);
                console.log(chalk.white.bgGreen.bold('\n\n========================================='));
                console.log(chalk.white.bgGreen.bold('      YOUR WHATSAPP PAIRING CODE:       '));
                console.log(chalk.white.bgGreen.bold(`             ${code}             `));
                console.log(chalk.white.bgGreen.bold('=========================================\n\n'));
            } catch (err) {
                console.error('❌ Failed to request pairing code:', err);
            }
        }, 5000);
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'connecting') {
            console.log(chalk.blue('⏳ Connecting to WhatsApp...'));
        }

        if (connection === 'open') {
            console.log(chalk.green.bold('\n✅ SUCCESS: Connected to ' + PHONE_NUMBER + '\n'));
            
            // إرسال رسالة ترحيبية للمالك عند نجاح الربط
            setTimeout(async () => {
                try {
                    await sock.sendMessage(OWNER_JID, { 
                        text: `*🧊 تم ربط هانكوك بوت بنجاح! 🧊*\n\nمرحباً بك يا صاحب الرقم ${PHONE_NUMBER}\nالبوت الآن يعمل وجاهز لاستقبال أوامرك.\n\nاكتب *.مساعدة* لعرض قائمة الأوامر.` 
                    });
                    console.log(chalk.cyan('✅ Welcome message sent to owner.'));
                } catch (err) {
                    console.error('❌ Failed to send welcome message:', err);
                }
            }, 3000);
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red('❌ Connection closed.'));
            if (shouldReconnect) {
                console.log(chalk.yellow('🔄 Reconnecting...'));
                setTimeout(() => connectToWhatsApp(), 5000);
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        // التعديل: إرسال PHONE_NUMBER بدلاً من OWNER_JID كمعامل ثالث
await handleMessage(sock, message, PHONE_NUMBER, PHONE_NUMBER);

            const message = m.messages[0];
            if (!message.message || message.key.fromMe) return;
            await handleMessage(sock, message, OWNER_JID, PHONE_NUMBER);
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });

    return sock;
}

connectToWhatsApp().catch(err => {
    console.error(chalk.red('Fatal Error:'), err);
    process.exit(1);
});
