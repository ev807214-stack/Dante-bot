const {
 default: makeWASocket,
 useMultiFileAuthState,
 DisconnectReason
} = require("@whiskeysockets/baileys")

const P = require("pino")
const fs = require("fs")

async function startBot() {

 const { state, saveCreds } = await useMultiFileAuthState("./auth")

 const sock = makeWASocket({
  auth: state,
  logger: P({ level: "silent" }),
  printQRInTerminal: true
 })

 sock.ev.on("creds.update", saveCreds)

 sock.ev.on("connection.update", (update) => {

  const { connection } = update

  if(connection === "open"){
   console.log("👹 Dante conectado")
  }

  if(connection === "close"){
   console.log("⚠️ Reconectando...")
   startBot()
  }

 })

 sock.ev.on("messages.upsert", async ({ messages }) => {

  const msg = messages[0]
  if(!msg.message) return

  const from = msg.key.remoteJid
  const text =
   msg.message.conversation ||
   msg.message.extendedTextMessage?.text

  if(!text) return

  let users = {}

  if(fs.existsSync("./database/users.json")){
   users = JSON.parse(fs.readFileSync("./database/users.json"))
  }

  if(!users[from]){
   users[from] = {
    souls: 500,
    level: 1,
    xp: 0
   }
  }

  if(text === "/bal"){
   await sock.sendMessage(from, {
    text: `👹 Souls: ${users[from].souls}`
   })
  }

  if(text === "/profile"){
   await sock.sendMessage(from, {
    text:
`👹 PROFILE

💰 Souls: ${users[from].souls}
⭐ Level: ${users[from].level}
✨ XP: ${users[from].xp}`
   })
  }

  if(text === "/cazar"){
   const gain = Math.floor(Math.random() * 300)

   users[from].souls += gain
   users[from].xp += 10

   await sock.sendMessage(from, {
    text: `🔥 Cazaste un demonio\n+${gain} souls`
   })
  }

  fs.writeFileSync("./database/users.json", JSON.stringify(users, null, 2))
 })

}

startBot()
