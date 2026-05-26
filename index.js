const {
 default: makeWASocket,
 useMultiFileAuthState
} = require("@whiskeysockets/baileys")

const P = require("pino")
const fs = require("fs")

let isRunning = false

async function startBot() {

 if (isRunning) return
 isRunning = true

 const { state, saveCreds } = await useMultiFileAuthState("./auth")

 const sock = makeWASocket({
  auth: state,
  logger: P({ level: "silent" })
 })

 sock.ev.on("creds.update", saveCreds)

 sock.ev.on("connection.update", (update) => {

  const { connection, qr } = update

  // 📱 QR CODE
  if (qr) {
   console.log("\n📱 ESCANEA ESTE QR:\n")
   console.log(qr)
  }

  // 👹 CONECTADO
  if (connection === "open") {
   console.log("👹 Dante conectado")
  }

  // ⚠️ DESCONECTADO
  if (connection === "close") {

   console.log("⚠️ Conexión cerrada, reintentando...")

   isRunning = false

   setTimeout(() => {
    startBot()
   }, 8000)
  }

 })

 sock.ev.on("messages.upsert", async ({ messages }) => {

  const msg = messages[0]
  if (!msg.message) return

  const from = msg.key.remoteJid

  const text =
   msg.message.conversation ||
   msg.message.extendedTextMessage?.text

  if (!text) return

  // 📦 DATABASE
  let users = {}

  if (fs.existsSync("./database/users.json")) {
   users = JSON.parse(fs.readFileSync("./database/users.json"))
  }

  if (!users[from]) {
   users[from] = {
    souls: 500,
    level: 1,
    xp: 0
   }
  }

  // 💰 BALANCE
  if (text === "/bal") {
   await sock.sendMessage(from, {
    text: `👹 Souls: ${users[from].souls}`
   })
  }

  // 👤 PROFILE
  if (text === "/profile") {
   await sock.sendMessage(from, {
    text:
`👹 DANTE PROFILE

💰 Souls: ${users[from].souls}
⭐ Level: ${users[from].level}
✨ XP: ${users[from].xp}`
   })
  }

  // ⚔️ CAZAR
  if (text === "/cazar") {

   const gain = Math.floor(Math.random() * 300)

   users[from].souls += gain
   users[from].xp += 10

   await sock.sendMessage(from, {
    text:
`🔥 Cazaste un demonio

+${gain} souls
+10 XP`
   })
  }

  // 💾 GUARDAR
  fs.writeFileSync(
   "./database/users.json",
   JSON.stringify(users, null, 2)
  )

 })

}

startBot()
