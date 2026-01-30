import fs from 'fs';
import path from 'path';

// ملف قاعدة البيانات
const DATA_DIR = './data';
const USERS_DB = path.join(DATA_DIR, 'users.json');
const GAMES_DB = path.join(DATA_DIR, 'games.json');
const AUTH_DB = path.join(DATA_DIR, 'authorized.json');

// إنشاء الملفات إذا لم تكن موجودة
function initDB() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
    if (!fs.existsSync(USERS_DB)) fs.writeFileSync(USERS_DB, JSON.stringify({}));
    if (!fs.existsSync(GAMES_DB)) fs.writeFileSync(GAMES_DB, JSON.stringify({}));
    if (!fs.existsSync(AUTH_DB)) fs.writeFileSync(AUTH_DB, JSON.stringify([]));
}

// دوال قراءة وكتابة قواعد البيانات
function getAuthorized() {
    initDB();
    return JSON.parse(fs.readFileSync(AUTH_DB, 'utf-8'));
}

function saveAuthorized(data) {
    fs.writeFileSync(AUTH_DB, JSON.stringify(data, null, 2));
}

function getUsers() {
    initDB();
    return JSON.parse(fs.readFileSync(USERS_DB, 'utf-8'));
}

function saveUsers(data) {
    fs.writeFileSync(USERS_DB, JSON.stringify(data, null, 2));
}

function getGames() {
    initDB();
    return JSON.parse(fs.readFileSync(GAMES_DB, 'utf-8'));
}

function saveGames(data) {
    fs.writeFileSync(GAMES_DB, JSON.stringify(data, null, 2));
}

// ====================================================================================
// منطق الأوامر
// ====================================================================================

const commands = {
    // ===== أوامر المالك (الصلاحيات) =====
    'سماح': {
        category: 'مالك',
        description: 'منح صلاحية استخدام البوت لشخص (بالرد أو الرقم)',
        handler: async (sock, m, args, sender, ownerNum) => {
            if (sender !== ownerNum + '@s.whatsapp.net') return;
            
            let targetJid = m.message?.extendedTextMessage?.contextInfo?.participant || (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
            
            if (!targetJid) return await sock.sendMessage(m.key.remoteJid, { text: '❌ رد على رسالة الشخص أو اكتب رقمه' }, { quoted: m });
            
            let authorized = getAuthorized();
            if (!authorized.includes(targetJid)) {
                authorized.push(targetJid);
                saveAuthorized(authorized);
                await sock.sendMessage(m.key.remoteJid, { text: `✅ تم منح الصلاحية لـ @${targetJid.split('@')[0]}`, mentions: [targetJid] }, { quoted: m });
            } else {
                await sock.sendMessage(m.key.remoteJid, { text: '⚠️ هذا الشخص لديه صلاحية بالفعل' }, { quoted: m });
            }
        }
    },
    
    'سحب': {
        category: 'مالك',
        description: 'سحب صلاحية استخدام البوت من شخص (بالرد أو الرقم)',
        handler: async (sock, m, args, sender, ownerNum) => {
            if (sender !== ownerNum + '@s.whatsapp.net') return;
            
            let targetJid = m.message?.extendedTextMessage?.contextInfo?.participant || (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
            
            if (!targetJid) return await sock.sendMessage(m.key.remoteJid, { text: '❌ رد على رسالة الشخص أو اكتب رقمه' }, { quoted: m });
            
            let authorized = getAuthorized();
            if (authorized.includes(targetJid)) {
                authorized = authorized.filter(id => id !== targetJid);
                saveAuthorized(authorized);
                await sock.sendMessage(m.key.remoteJid, { text: `✅ تم سحب الصلاحية من @${targetJid.split('@')[0]}`, mentions: [targetJid] }, { quoted: m });
            } else {
                await sock.sendMessage(m.key.remoteJid, { text: '⚠️ هذا الشخص ليس لديه صلاحية أصلاً' }, { quoted: m });
            }
        }
    },

    // ===== أوامر النظام والأدوات =====
    'مساعدة': {
        category: 'عام',
        description: 'عرض قائمة الأوامر',
        handler: async (sock, m, args, sender, ownerNum) => {
            let helpText = `*🧊 هانكوك بوت 🧊*\n\n*البادئة: .*\n\n`;
            const categories = {};
            
            for (const cmd in commands) {
                const { category, description } = commands[cmd];
                if (category === 'مالك' && sender !== ownerNum + '@s.whatsapp.net') continue; // إخفاء أوامر المالك
                if (!categories[category]) categories[category] = [];
                categories[category].push(`*.${cmd}* - ${description}`);
            }
            
            for (const category in categories) {
                helpText += `*${category}*\n${categories[category].join('\n')}\n\n`;
            }
            
            helpText += `*المطور:* بوراشد\n*رقم الربط:* ${ownerNum}`;
            await sock.sendMessage(m.key.remoteJid, { text: helpText }, { quoted: m });
        }
    },
    
    'بنج': {
        category: 'نظام',
        description: 'فحص سرعة استجابة البوت',
        handler: async (sock, m) => {
            const startTime = Date.now();
            const sentMsg = await sock.sendMessage(m.key.remoteJid, { text: 'جاري الفحص...' }, { quoted: m });
            const endTime = Date.now();
            const latency = endTime - startTime;
            await sock.sendMessage(m.key.remoteJid, { text: `🚀 السرعة: ${latency} مللي ثانية` }, { quoted: sentMsg });
        }
    },
    
    'وقت': {
        category: 'نظام',
        description: 'عرض وقت تشغيل البوت',
        handler: async (sock, m) => {
            const uptime = process.uptime();
            const seconds = Math.floor(uptime % 60);
            const minutes = Math.floor((uptime / 60) % 60);
            const hours = Math.floor((uptime / (60 * 60)) % 24);
            const days = Math.floor(uptime / (60 * 60 * 24));
            
            const timeString = `${days} يوم، ${hours} ساعة، ${minutes} دقيقة، ${seconds} ثانية`;
            await sock.sendMessage(m.key.remoteJid, { text: `⏱️ وقت التشغيل: ${timeString}` }, { quoted: m });
        }
    },

    // ===== أوامر الألعاب والمرح =====
    'لعبة': {
        category: 'ترفيه',
        description: 'لعبة حجر ورقة مقص. الاستخدام: .لعبة حجر/ورقة/مقص',
        handler: async (sock, m, args) => {
            const choices = ['حجر', 'ورقة', 'مقص'];
            const userChoice = args[0]?.toLowerCase();
            if (!choices.includes(userChoice)) {
                return await sock.sendMessage(m.key.remoteJid, { text: '❌ اختر بين حجر، ورقة، أو مقص.' }, { quoted: m });
            }
            
            const botChoice = choices[Math.floor(Math.random() * choices.length)];
            let result;
            
            if (userChoice === botChoice) {
                result = 'تعادل! 🤝';
            } else if (
                (userChoice === 'حجر' && botChoice === 'مقص') ||
                (userChoice === 'ورقة' && botChoice === 'حجر') ||
                (userChoice === 'مقص' && botChoice === 'ورقة')
            ) {
                result = 'فزت! 🎉';
            } else {
                result = 'خسرت! 😭';
            }
            
            await sock.sendMessage(m.key.remoteJid, { text: `أنت: ${userChoice}\nالبوت: ${botChoice}\nالنتيجة: ${result}` }, { quoted: m });
        }
    },
    
    'مرح': {
        category: 'ترفيه',
        description: 'نكتة عشوائية',
        handler: async (sock, m) => {
            const jokes = [
                "مرة واحد مسطول ماشي في الشارع لقى قشرة موزة، قال: يا خبر أبيض! هتزحلق تاني!",
                "مدرس سأل طالب: إيه الفرق بين النملة والفيل؟ قال الطالب: الفيل رجله تنمل، لكن النملة رجلها ما تفيل!",
                "واحد غبي بيسأل صاحبه: إيه الفرق بين النملة والفيل؟ قال صاحبه: الفيل ينام على السرير، والنملة تنام على الأرض! قال الغبي: لا، النملة تنام على السرير بس ما حدش بيشوفها!",
                "واحد بلع ريقه، لقى طعمه مر، قال: أكيد صلاحيته انتهت!"
            ];
            const joke = jokes[Math.floor(Math.random() * jokes.length)];
            await sock.sendMessage(m.key.remoteJid, { text: `😂 ${joke}` }, { quoted: m });
        }
    },
    
    'سؤال': {
        category: 'ترفيه',
        description: 'سؤال صراحة أو تحدي عشوائي',
        handler: async (sock, m) => {
            const questions = [
                "صراحة: ما هو أكثر شيء ندمت عليه في حياتك؟",
                "تحدي: اتصل بآخر شخص تحدثت معه وقل له 'أنا أحبك' ثم أغلق الخط.",
                "صراحة: ما هو أسوأ قرار اتخذته هذا الأسبوع؟",
                "تحدي: ارسل إيموجي عشوائي في المجموعة.",
                "صراحة: ما هو الشيء الذي تخاف منه أكثر من أي شيء آخر؟"
            ];
            const question = questions[Math.floor(Math.random() * questions.length)];
            await sock.sendMessage(m.key.remoteJid, { text: `❓ صراحة أم تحدي؟\n\n${question}` }, { quoted: m });
        }
    },

    // ===== أوامر فعاليات الألعاب (تنسيق خاص) =====
    'تر': {
        category: 'فعاليات',
        description: 'بدء فعالية الترتيب',
        handler: async (sock, m) => {
            const words = ["سيارة", "طائرة", "قطار", "سفينة", "دراجة"];
            const word = words[Math.floor(Math.random() * words.length)];
            const shuffled = word.split('').sort(() => 0.5 - Math.random()).join('');
            
            const reply = `*┇⦏فعـ🃏ـالية الترتيب⦐┇*\n\n*⊹‏⊱≼━━━━━⌬〔•❄️•〕⌬━━━━━≽⊰⊹*\n\n*❄️┇الجائزة 💵┇5k⤹*\n*❄️┇الكلمة┇${shuffled}⤹*\n*❄️┇المقدم ┇هانكوك⤹*\n\n*⊹‏⊱≼━━━━━⌬〔•❄️•〕⌬━━━━━≽⊰⊹*\n*『𝑭.𝑹.𝑺⊰❄️⊱𝑭𝑹𝑶𝑺𝑻』*`;
            
            const games = getGames();
            games[m.key.remoteJid] = { type: 'ترتيب', answer: word, startTime: Date.now() };
            saveGames(games);
            
            await sock.sendMessage(m.key.remoteJid, { text: reply }, { quoted: m });
        }
    },
    
    'كت': {
        category: 'فعاليات',
        description: 'بدء فعالية الكتابة (أسرع كتابة)',
        handler: async (sock, m) => {
            const phrases = ["الذئب لا يخشى أن ينبح", "هانكوك بوت هو الأفضل", "البرمجة متعة وإبداع"];
            const phrase = phrases[Math.floor(Math.random() * phrases.length)];
            
            const reply = `*┇⦏فعـ🃏ـالية الكتابة⦐┇*\n\n*⊹‏⊱≼━━━━━⌬〔•❄️•〕⌬━━━━━≽⊰⊹*\n\n*❄️┇الجائزة 💵┇5k⤹*\n*❄️┇الكلمة┇${phrase}⤹*\n*❄️┇المقدم ┇هانكوك⤹*\n\n*⊹‏⊱≼━━━━━⌬〔•❄️•〕⌬━━━━━≽⊰⊹*\n*『𝑭.𝑹.𝑺⊰❄️⊱𝑭𝑹𝑶𝑺𝑻』*`;
            
            const games = getGames();
            games[m.key.remoteJid] = { type: 'كتابة', answer: phrase, startTime: Date.now() };
            saveGames(games);
            
            await sock.sendMessage(m.key.remoteJid, { text: reply }, { quoted: m });
        }
    },
    
    'فك': {
        category: 'فعاليات',
        description: 'بدء فعالية التفكيك (فك الرموز)',
        handler: async (sock, m) => {
            const codes = ["@#$%", "1234", "ABCD", "X Y Z"];
            const code = codes[Math.floor(Math.random() * codes.length)];
            
            const reply = `*┇⦏فعـ🃏ـالية التفكيك⦐┇*\n\n*⊹‏⊱≼━━━━━⌬〔•❄️•〕⌬━━━━━≽⊰⊹*\n\n*❄️┇الجائزة 💵┇5k⤹*\n*❄️┇الكلمة┇${code}⤹*\n*❄️┇المقدم ┇هانكوك⤹*\n\n*⊹‏⊱≼━━━━━⌬〔•❄️•〕⌬━━━━━≽⊰⊹*\n*『𝑭.𝑹.𝑺⊰❄️⊱𝑭𝑹𝑶𝑺𝑻』*`;
            
            const games = getGames();
            games[m.key.remoteJid] = { type: 'تفكيك', answer: code, startTime: Date.now() };
            saveGames(games);
            
            await sock.sendMessage(m.key.remoteJid, { text: reply }, { quoted: m });
        }
    },
    
    'علم': {
        category: 'فعاليات',
        description: 'بدء فعالية تخمين العلم',
        handler: async (sock, m) => {
            const flags = {
                "🇸🇦": "السعودية",
                "🇪🇬": "مصر",
                "🇦🇪": "الإمارات",
                "🇶🇦": "قطر",
                "🇰🇼": "الكويت"
            };
            const flagKeys = Object.keys(flags);
            const flag = flagKeys[Math.floor(Math.random() * flagKeys.length)];
            const answer = flags[flag];
            
            const reply = `*┇⦏فعـ🃏ـالية تخمين العلم⦐┇*\n\n*⊹‏⊱≼━━━━━⌬〔•❄️•〕⌬━━━━━≽⊰⊹*\n\n*❄️┇الجائزة 💵┇5k⤹*\n*❄️┇الكلمة┇${flag}⤹*\n*❄️┇المقدم ┇هانكوك⤹*\n\n*⊹‏⊱≼━━━━━⌬〔•❄️•〕⌬━━━━━≽⊰⊹*\n*『𝑭.𝑹.𝑺⊰❄️⊱𝑭𝑹𝑶𝑺𝑻』*`;
            
            const games = getGames();
            games[m.key.remoteJid] = { type: 'علم', answer: answer, startTime: Date.now() };
            saveGames(games);
            
            await sock.sendMessage(m.key.remoteJid, { text: reply }, { quoted: m });
        }
    },
    
    'ح': {
        category: 'فعاليات',
        description: 'بدء فعالية احزر الإيموجي',
        handler: async (sock, m) => {
            const emojis = {
                "🍎": "تفاح",
                "🦁": "أسد",
                "🥕": "جزر",
                "🍌": "موز",
                "🐘": "فيل"
            };
            const emojiKeys = Object.keys(emojis);
            const emoji = emojiKeys[Math.floor(Math.random() * emojiKeys.length)];
            const answer = emojis[emoji];
            
            const reply = `*┇⦏فعـ🃏ـالية احزر الإيموجي⦐┇*\n\n*⊹‏⊱≼━━━━━⌬〔•❄️•〕⌬━━━━━≽⊰⊹*\n\n*❄️┇الجائزة 💵┇5k⤹*\n*❄️┇الكلمة┇${emoji}⤹*\n*❄️┇المقدم ┇هانكوك⤹*\n\n*⊹‏⊱≼━━━━━⌬〔•❄️•〕⌬━━━━━≽⊰⊹*\n*『𝑭.𝑹.𝑺⊰❄️⊱𝑭𝑹𝑶𝑺𝑻』*`;
            
            const games = getGames();
            games[m.key.remoteJid] = { type: 'إيموجي', answer: answer, startTime: Date.now() };
            saveGames(games);
            
            await sock.sendMessage(m.key.remoteJid, { text: reply }, { quoted: m });
        }
    },
    
    'اكس': {
        category: 'فعاليات',
        description: 'بدء لعبة إكس أو (X O) مع شخص آخر (بالرد أو الإشارة)',
        handler: async (sock, m) => {
            // منطق لعبة إكس أو معقد ويتطلب حفظ حالة اللعبة، سيتم تبسيطه هنا للإشارة إلى بدء اللعبة
            await sock.sendMessage(m.key.remoteJid, { text: '❌ O جاري بدء لعبة إكس أو. يرجى الرد على رسالة الشخص الذي تريد اللعب معه.' }, { quoted: m });
        }
    },

    // ===== أوامر البنك =====
    'انش': {
        category: 'بنك',
        description: 'إنشاء حساب بنكي',
        handler: async (sock, m, args, sender) => {
            const users = getUsers();
            if (users[sender]) {
                return await sock.sendMessage(m.key.remoteJid, { text: `⚠️ لديك حساب بنكي بالفعل. رقم الحساب: ${users[sender].accountNumber}` }, { quoted: m });
            }
            
            const accountNumber = Math.floor(Math.random() * 900000) + 100000;
            users[sender] = {
                accountNumber: accountNumber,
                balance: 0,
                wallet: 0,
                createdAt: new Date().toISOString()
            };
            saveUsers(users);
            
            await sock.sendMessage(m.key.remoteJid, { text: `✅ تم إنشاء حسابك البنكي بنجاح!\n\n🏦 رقم الحساب: ${accountNumber}\n💵 الرصيد: 0$` }, { quoted: m });
        }
    },
    
    'حس': {
        category: 'بنك',
        description: 'الاستعلام عن الحساب البنكي',
        handler: async (sock, m, args, sender) => {
            const users = getUsers();
            if (!users[sender]) {
                return await sock.sendMessage(m.key.remoteJid, { text: '❌ ليس لديك حساب بنكي. استخدم الأمر .انش لإنشاء حساب.' }, { quoted: m });
            }
            
          if (!isAuthorized) {
    return await sock.sendMessage(m.key.remoteJid, { text: '⚠️ عذراً، يجب أن يمنحك المالك صلاحية لاستخدام البوت.' }, { quoted: m });
}
  const user = users[sender];
            const msg = `🏦 *بيانات حسابك البنكي*\n\n👤 المستخدم: @${sender.split('@')[0]}\n💳 رقم الحساب: ${user.accountNumber}\n💵 رصيد الحساب: ${user.balance}$\n👛 رصيد المحفظة: ${user.wallet}$`;
            await sock.sendMessage(m.key.remoteJid, { text: msg, mentions: [sender] }, { quoted: m });
        }
    },
    
    'مح': {
        category: 'بنك',
        description: 'الاستعلام عن رصيد المحفظة',
        handler: async (sock, m, args, sender) => {
            const users = getUsers();
            if (!users[sender]) {
                return await sock.sendMessage(m.key.remoteJid, { text: '❌ ليس لديك حساب بنكي. استخدم الأمر .انش لإنشاء حساب.' }, { quoted: m });
            }
            
            const walletBalance = users[sender].wallet;
            await sock.sendMessage(m.key.remoteJid, { text: `👛 رصيد محفظتك هو: ${walletBalance}$` }, { quoted: m });
        }
    },
    
    'اودع': {
        category: 'بنك',
        description: 'إيداع مبلغ من المحفظة إلى الحساب البنكي. الاستخدام: .اودع <المبلغ>',
        handler: async (sock, m, args, sender) => {
            const users = getUsers();
            if (!users[sender]) {
                return await sock.sendMessage(m.key.remoteJid, { text: '❌ ليس لديك حساب بنكي. استخدم الأمر .انش لإنشاء حساب.' }, { quoted: m });
            }
            
            const amount = parseInt(args[0]);
            if (isNaN(amount) || amount <= 0) {
                return await sock.sendMessage(m.key.remoteJid, { text: '❌ أدخل مبلغ صحيح للإيداع. مثال: .اودع 100' }, { quoted: m });
            }
            
            if (users[sender].wallet < amount) {
                return await sock.sendMessage(m.key.remoteJid, { text: '❌ رصيد محفظتك غير كافٍ لإجراء الإيداع.' }, { quoted: m });
            }
            
            users[sender].wallet -= amount;
            users[sender].balance += amount;
            saveUsers(users);
            
            const msg = `✅ *تم الإيداع بنجاح*\n\n💵 المبلغ: *${amount}$*\n🏦 رصيد الحساب الجديد: *${users[sender].balance}$*\n👛 رصيد المحفظة الجديد: *${users[sender].wallet}$*`;
            await sock.sendMessage(m.key.remoteJid, { text: msg }, { quoted: m });
        }
    },
    
    'تحويل': {
        category: 'بنك',
        description: 'تحويل مبلغ من شخص لآخر (بالرد على رسالته). الاستخدام: .تحويل <المبلغ>',
        handler: async (sock, m, args, sender) => {
            const users = getUsers();
            if (!users[sender]) {
                return await sock.sendMessage(m.key.remoteJid, { text: '❌ ليس لديك حساب بنكي. استخدم الأمر .انش لإنشاء حساب.' }, { quoted: m });
            }
            
            const targetJid = m.message?.extendedTextMessage?.contextInfo?.participant;
            if (!targetJid) {
                return await sock.sendMessage(m.key.remoteJid, { text: '❌ يجب الرد على رسالة الشخص الذي تريد التحويل إليه.' }, { quoted: m });
            }
            
            const amount = parseInt(args[0]);
            if (isNaN(amount) || amount <= 0) {
                return await sock.sendMessage(m.key.remoteJid, { text: '❌ أدخل مبلغ صحيح للتحويل. مثال: .تحويل 50' }, { quoted: m });
            }
            
            if (users[sender].balance < amount) {
                return await sock.sendMessage(m.key.remoteJid, { text: '❌ رصيد حسابك البنكي غير كافٍ لإجراء التحويل.' }, { quoted: m });
            }
            
            if (!users[targetJid]) {
                return await sock.sendMessage(m.key.remoteJid, { text: '❌ الشخص الذي تحاول التحويل إليه ليس لديه حساب بنكي.' }, { quoted: m });
            }
            
            users[sender].balance -= amount;
            users[targetJid].balance += amount;
            saveUsers(users);
            
            const msg = `✅ *تم التحويل بنجاح*\n\n💵 المبلغ: *${amount}$*\n👤 إلى: @${targetJid.split('@')[0]}\n🏦 رصيدك الجديد: *${users[sender].balance}$*`;
            await sock.sendMessage(m.key.remoteJid, { text: msg, mentions: [targetJid] }, { quoted: m });
        }
    },
    
    'شحن': {
        category: 'بنك',
        description: 'طلب شحن المحفظة (للمالك فقط)',
        handler: async (sock, m, args, sender, ownerNum) => {
            const amount = parseInt(args[0]);
            if (isNaN(amount) || amount <= 0) {
                return await sock.sendMessage(m.key.remoteJid, { text: '❌ أدخل مبلغ صحيح. مثال: .شحن 1000' }, { quoted: m });
            }
            
            const msg = `📱 *طلب شحن من المحفظة*\n\n👤 المستخدم: @${sender.split('@')[0]}\n💵 المبلغ: ${amount}$\n\n✅ للموافقة: .ادد ${sender.split('@')[0]} ${amount}`;
            await sock.sendMessage(ownerNum + '@s.whatsapp.net', { text: msg, mentions: [sender] });
            
            await sock.sendMessage(m.key.remoteJid, { text: '✅ تم إرسال طلب الشحن إلى المالك' }, { quoted: m });
        }
    },
    
    'ادد': {
        category: 'مالك',
        description: 'إضافة مبلغ لحساب شخص آخر (للمالك فقط). الاستخدام: .ادد <الرقم> <المبلغ>',
        handler: async (sock, m, args, sender, ownerNum) => {
            if (sender !== ownerNum + '@s.whatsapp.net') return;
            
            const targetNum = args[0];
            const amount = parseInt(args[1]);
            
            if (!targetNum || isNaN(amount) || amount <= 0) {
                return await sock.sendMessage(m.key.remoteJid, { text: '❌ الاستخدام: .ادد <الرقم> <المبلغ>' }, { quoted: m });
            }
            
            const targetJid = targetNum.includes('@') ? targetNum : targetNum + '@s.whatsapp.net';
            const users = getUsers();
            
            if (!users[targetJid]) {
                // إنشاء حساب إذا لم يكن موجوداً
                users[targetJid] = {
                    accountNumber: Math.floor(Math.random() * 900000) + 100000,
                    balance: 0,
                    wallet: 0,
                    createdAt: new Date().toISOString()
                };
            }
            
            users[targetJid].wallet += amount;
            saveUsers(users);
            
            const msg = `✅ *تم إضافة ${amount}$ إلى محفظتك*\n\n👛 رصيد المحفظة الجديد: ${users[targetJid].wallet}$`;
            await sock.sendMessage(targetJid, { text: msg });
            
            await sock.sendMessage(m.key.remoteJid, { text: `✅ تم إضافة ${amount}$ للمستخدم ${targetNum}` }, { quoted: m });
        }
    }
};

// ====================================================================================
// معالج الرسائل الرئيسي
// ====================================================================================

/**
 * معالج الرسائل الرئيسي
 */
export async function handleMessage(sock, m, ownerNum, ownerPhone) {
    const prefix = '.';
    const sender = m.key.participant || m.key.remoteJid;
    const body = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || m.message?.videoMessage?.caption || '';
    
    // 1. معالجة الألعاب (الردود)
    const games = getGames();
    const activeGame = games[m.key.remoteJid];
    
    if (activeGame && body.toLowerCase() === activeGame.answer.toLowerCase()) {
        const timeTaken = ((Date.now() - activeGame.startTime) / 1000).toFixed(2);
        const winnerJid = sender;
        
        // إيقاف اللعبة
        delete games[m.key.remoteJid];
        saveGames(games);
        
        // مكافأة الفائز (إضافة 5000 للمحفظة)
        const users = getUsers();
        if (!users[winnerJid]) {
            users[winnerJid] = {
                accountNumber: Math.floor(Math.random() * 900000) + 100000,
                balance: 0,
                wallet: 0,
                createdAt: new Date().toISOString()
            };
        }
        users[winnerJid].wallet += 5000;
        saveUsers(users);
        
        const winMsg = `🎉 *مبروك!* 🎉\n\nالفائز: @${winnerJid.split('@')[0]}\nالوقت: ${timeTaken} ثانية\nالجائزة: 5000$ (تم إضافتها إلى محفظتك)`;
        await sock.sendMessage(m.key.remoteJid, { text: winMsg, mentions: [winnerJid] }, { quoted: m });
        return;
    }

    // 2. معالجة الأوامر
    if (!body.startsWith(prefix)) return;

    const authorized = getAuthorized();
    const isOwner = sender === ownerNum + '@s.whatsapp.net';
    const isAuthorized = authorized.includes(sender) || isOwner;

    const [command, ...args] = body.slice(prefix.length).trim().split(/\s+/);
    const cmd = command.toLowerCase();

    if (commands[cmd]) {
        // التحقق من الصلاحية
        if (!isAuthorized && commands[cmd].category !== 'مالك') {
            // إذا لم يكن مصرحاً له، لا يستجيب
            return; 
        }
        
        // التحقق من أوامر المالك
        if (commands[cmd].category === 'مالك' && !isOwner) {
            return await sock.sendMessage(m.key.remoteJid, { text: '❌ هذا الأمر مخصص للمالك فقط.' }, { quoted: m });
        }

        try {
            await commands[cmd].handler(sock, m, args, sender, ownerPhone);
        } catch (error) {
            console.error('خطأ في تنفيذ الأمر:', error);
            await sock.sendMessage(m.key.remoteJid, { text: `❌ حدث خطأ أثناء تنفيذ الأمر *.${cmd}*` }, { quoted: m });
        }
    }
}
