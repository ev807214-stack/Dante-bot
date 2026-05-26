const {
 default: makeWASocket,
 useMultiFileAuthState,
 DisconnectReason
} = require("@whiskeysockets/baileys")

const P = require("pino")
const fs = require("fs")
const qrcode = require("qrcode-terminal")

async function startBot() {

 const { state, saveCreds } = await useMultiFileAuthState("auth")

 const sock = makeWASocket({
  logger: P({ level: "silent" }),
  auth: state
 })

 sock.ev.on("creds.update", saveCreds)

 sock.ev.on("connection.update", ({ connection, qr }) => {

  if(qr){
   qrcode.generate(qr, { small: true })
  }

  if(connection === "open"){
   console.log("👹 Dante conectado")
  }

 })

 sock.ev.on("messages.upsert", async ({ messages }) => {

  const msg = messages[0]

  if(!msg.message) return

  const text =
   msg.message.conversation ||
   msg.message.extendedTextMessage?.text

  if(!text) return

  const from = msg.key.remoteJid

  // DATABASE

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

  // /bal

  if(text === "/bal"){

   await sock.sendMessage(from, {
    text:
`👹 Souls: ${users[from].souls}`
   })

  }

  // /profile

  if(text === "/profile"){

   await sock.sendMessage(from, {
    text:
`👹 DANTE PROFILE

🔥 Level: ${users[from].level}
✨ XP: ${users[from].xp}
💰 Souls: ${users[from].souls}`
   })

  }

  // /cazar

  if(text === "/cazar"){

   const gain =
    Math.floor(Math.random() * 300)

   users[from].souls += gain
   users[from].xp += 15

   await sock.sendMessage(from, {
    text:
`🔥 Cazaste un demonio

+${gain} souls
+15 XP`
   })

  }

  fs.writeFileSync(
   "./database/users.json",
   JSON.stringify(users, null, 2)
  )

 })

}

startBot()
