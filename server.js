const express = require("express");
const cors = require("cors");
const fs = require("fs");
const QRCode = require("qrcode");
const { default: makeWASocket, useSingleFileAuthState } = require("@adiwajshing/baileys");

const app = express();
app.use(cors());
app.use(express.static("public"));

const SESSION_FILE = "./session.json";

// ✅ API to start WhatsApp pairing and return QR
app.get("/generate", async (req, res) => {
  const { state, saveState } = useSingleFileAuthState(SESSION_FILE);
  const sock = makeWASocket({ auth: state });

  sock.ev.on("connection.update", async (update) => {
    const { qr, connection } = update;
    if (qr) {
      // Convert QR to Base64 Image
      const qrImage = await QRCode.toDataURL(qr);
      res.json({ qr: qrImage });
    }
    if (connection === "open") {
      // Session Ready → return session encoded
      const sessionData = fs.readFileSync(SESSION_FILE, "utf-8");
      res.json({ session: Buffer.from(sessionData).toString("base64") });
    }
  });

  sock.ev.on("creds.update", saveState);
});

app.listen(3000, () => console.log("🚀 Server running at http://localhost:3000"));