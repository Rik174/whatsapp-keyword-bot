import express from "express";
import qrcode from "qrcode";
import pkg from "whatsapp-web.js";   // <-- новый импорт
const { Client, LocalAuth } = pkg;  // <-- деструктуризация CommonJS

// --- HTTP сервер для Render ---
const app = express();
app.get("/", (_, res) => res.send("✅ WhatsApp Keyword Bot работает на Render!"));
app.listen(process.env.PORT || 3000, () =>
  console.log("HTTP сервер запущен на порту", process.env.PORT || 3000)
);
// --- Настройки ---
const KEYWORDS = [
  "освещение", "повысить", "сделать",
  "звук", "свет", "яркость", "громкость", "звучание",
  "мерцает", "не горит", "тише", "громче", "ярче", "тускло", "лампочки"
];
const TARGET_CONTACT = "971588479697@c.us";

// --- Инициализация клиента ---
const client = new Client({
  authStrategy: new LocalAuth(), // сохраняет сессию (QR не нужно сканировать каждый раз)
});
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
    ],
  },
});
let lastQr = null;
// — получаем QR и запоминаем его —
client.on("qr", (qr) => {
  lastQr = qr;
  console.log("QR обновлён — открой /qr и отсканируй");
});

// — HTTP эндпоинт для просмотра QR —
app.get("/qr", async (req, res) => {
  if (!lastQr) return res.status(404).send("QR ещё не готов");
  try {
    const dataUrl = await qrcode.toDataURL(lastQr); // base64
    const img = Buffer.from(dataUrl.split(",")[1], "base64");
    res.set("Content-Type", "image/png");
    res.send(img);
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка генерации QR");
  }
});


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
