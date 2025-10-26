import express from "express";
import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

// --- HTTP сервер для Render ---
const app = express();
app.get("/", (_, res) => res.send("✅ WhatsApp Keyword Bot работает на Render!"));
app.listen(3000, () => console.log("🌍 Сервер запущен на порту 3000 (для Render)"))

// --- Настройки ---
const KEYWORDS = [
  "срочно", "оплата", "важно", "доставка",
  "звук", "свет", "яркость", "громкость", "звучание",
  "мерцает", "не горит", "тише", "громче", "ярче", "тускло", "лампочки"
]; // слова, которые бот ищет

// ✅ Номер получателя — +971 58 847 9697
const TARGET_CONTACT = "971588479697@c.us"; // WhatsApp ID получателя

// --- Инициализация клиента ---
const client = new Client({
  authStrategy: new LocalAuth(), // сохраняет сессию (QR не нужно сканировать каждый раз)
});

client.on("qr", (qr) => {
  console.log("📱 Отсканируй этот QR-код, чтобы войти в WhatsApp:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("✅ Бот успешно запущен и готов к работе!");
});

// --- Основная логика ---
client.on("message", async (msg) => {
  try {
    const chat = await msg.getChat();

    // Проверяем, что сообщение пришло из группы
    if (chat.isGroup) {
      const text = msg.body.toLowerCase();
      const foundKeyword = KEYWORDS.find((kw) => text.includes(kw));

      if (foundKeyword) {
        console.log(`🚀 Найдено ключевое слово [${foundKeyword}] в "${chat.name}"`);

        // Если есть медиа — скачиваем и пересылаем
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

// --- Запуск клиента ---
client.initialize();
