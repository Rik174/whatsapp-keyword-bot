import express from "express";
import qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js";   // <-- новый импорт
const { Client, LocalAuth } = pkg;  // <-- деструктуризация CommonJS

// --- HTTP сервер для Render ---
const app = express();
app.get("/", (_, res) => res.send("✅ WhatsApp Keyword Bot работает на Render!"));
app.listen(3000, () => console.log("🌍 Сервер запущен на порту 3000"));

// --- Настройки ---
const KEYWORDS = [
  "освещение",
  "звук", "свет", "яркость", "громкость", "звучание",
  "мерцает", "не горит", "тише", "громче", "ярче", "тускло", "лампочки"
];
const TARGET_CONTACT = "971588479697@c.us";

// --- Инициализация клиента ---
const client = new Client({ authStrategy: new LocalAuth() });
let lastQr = null;
// — получаем QR и запоминаем его —
client.on("qr", (qr) => {
  lastQr = qr;
  console.log("QR обновлён — открой /qr и отсканируй");
});

// — HTTP эндпоинт для просмотра QR —
app.get("/qr", async (req, res) => {
  if (!lastQr) return res.status(404).send("QR ещё не готов");
  const png = await qrcode.toBuffer(lastQr);
  res.type("png").send(png);
});

app.listen(process.env.PORT || 3000, () =>
  console.log("HTTP сервер запущен на порту", process.env.PORT || 3000)
);

client.on("ready", () => {
  console.log("✅ Бот успешно запущен и готов к работе!");
});

// --- Основная логика ---
client.on("message", async (msg) => {
    try {
        const chat = await msg.getChat();
        if (chat.isGroup) {
            const text = msg.body.toLowerCase();
            const foundKeyword = KEYWORDS.find((kw) => text.includes(kw));
            if (foundKeyword) {
                console.log(`🚀 Найдено ключевое слово [${foundKeyword}] в "${chat.name}"`);

                if (msg.hasMedia) {
                    const media = await msg.downloadMedia();
                    await client.sendMessage(
                        TARGET_CONTACT,
                        `📩 Сообщение из группы "${chat.name}" с ключевым словом "${foundKeyword}":\n\n${msg.body || ""}`,
                        { media }
                    );
                } else {
                    await client.sendMessage(
                        TARGET_CONTACT,
                        `📩 Сообщение из группы "${chat.name}" с ключевым словом "${foundKeyword}":\n\n${msg.body}`
                    );
                }
            }
        }
    } catch (error) {
        console.error("⚠️ Ошибка при обработке сообщения:", error);
    }
});

client.initialize();
