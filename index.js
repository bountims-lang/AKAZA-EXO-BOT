const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys")
const P = require("pino")

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        auth: state,
        browser: ["AKAZA ULTRA", "Chrome", "1.0"],
        printQRInTerminal: true
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (u) => {
        const { connection, lastDisconnect } = u
        if(connection === 'close') {
            if(lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) startBot()
        } else if(connection === 'open') {
            console.log("👹 AKAZA ULTRA EN LIGNE !")
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message || msg.key.fromMe) return
        const from = msg.key.remoteJid
        const isGroup = from.endsWith('@g.us')
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || "").trim()
        const args = text.split(' ')
        const cmd = args[0].toLowerCase()

        if (cmd === "!menu" || cmd === "!help") {
            await sock.sendMessage(from, { text: `👹❄️ *AKAZA EXODUS ULTRA* ❄️👹\n⛩️━━━━━━━━━━━━⛩️\n*CLAN:*\n!akaza\n!purge\n!alive\n\n*CHEF:*\n!tagall [msg]\n!kick @user\n!promote @user\n!demote @user\n!open / !close\n\n*FUN:*\n!sticker (réponds à une image)\n!say [texte]\n⛩️━━━━━━━━━━━━⛩️` })
        }
        if (cmd === "!akaza") await sock.sendMessage(from, { text: "👹❄️ C'EST AKAZA EXODUS ❄️\nJE SUIS LA DESTRUCTION INCARNÉE !" })
        if (cmd === "!alive") await sock.sendMessage(from, { text: "✅ *AKAZA ULTRA EN LIGNE* ✅\nPuissance 100%" })
        if (cmd === "!say") await sock.sendMessage(from, { text: args.slice(1).join(" ") || "Dis quelque chose !" })

        if (cmd === "!tagall" && isGroup) {
            const meta = await sock.groupMetadata(from)
            const participants = meta.participants.map(p => p.id)
            let txt = `👹 *AKAZA TAGALL* 👹\n${args.slice(1).join(" ") || "REVEIL CLAN !"}\n\n`
            for (let p of participants) txt += `@${p.split('@')[0]} `
            await sock.sendMessage(from, { text: txt, mentions: participants })
        }
        if ((cmd === "!kick" || cmd === "!promote" || cmd === "!demote") && isGroup) {
            const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid
            if (!mentioned || mentioned.length === 0) {
                await sock.sendMessage(from, { text: "❌ Mentionne: !kick @pseudo" })
                return
            }
            const target = mentioned[0]
            try {
                if (cmd === "!kick") await sock.groupParticipantsUpdate(from, [target], "remove")
                if (cmd === "!promote") await sock.groupParticipantsUpdate(from, [target], "promote")
                if (cmd === "!demote") await sock.groupParticipantsUpdate(from, [target], "demote")
                await sock.sendMessage(from, { text: `✅ ${cmd} ok pour @${target.split('@')[0]}`, mentions: [target] })
            } catch { await sock.sendMessage(from, { text: "❌ Erreur: bot doit être admin" }) }
        }
        if (cmd === "!open" || cmd === "!close" && isGroup) {
            await sock.groupSettingUpdate(from, cmd === "!open" ? 'not_announcement' : 'announcement')
            await sock.sendMessage(from, { text: `Groupe ${cmd === "!open" ? "ouvert" : "fermé"}` })
        }
    })
}
startBot()
