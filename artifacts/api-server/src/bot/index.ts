import TelegramBot from "node-telegram-bot-api";
import { logger } from "../lib/logger";
import {
  getCurrentWeather,
  formatWeatherMessage,
  formatForecastMessage,
  getForecast,
} from "./weather";
import {
  UZBEKISTAN_CITIES,
  DEFAULT_CITY,
  CITY_KEYBOARD,
  findCity,
} from "./cities";
import {
  setBotInstance,
  startScheduler,
  addScheduledChat,
  removeScheduledChat,
  getScheduledChats,
  updateScheduledChatCity,
} from "./scheduler";

const TELEGRAM_BOT_TOKEN =
  process.env["TELEGRAM_BOT_TOKEN"] || "8607609282:AAEtdAifqTtCC3-1teOSX0LLwmBgGGQl-5Q";

const MAIN_KEYBOARD = {
  keyboard: [
    [
      { text: "🌤️ Hozirgi ob-havo" },
      { text: "📅 5 kunlik bashorat" },
    ],
    [
      { text: "🏙️ Viloyatlar ro'yxati" },
      { text: "⭐ Jizzax / Zomin" },
    ],
    [
      { text: "🔔 Avtomatik bildirishnomalar" },
      { text: "❌ Bildirishnomani o'chirish" },
    ],
    [{ text: "ℹ️ Yordam" }],
  ],
  resize_keyboard: true,
};

export function startBot(): void {
  const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

  setBotInstance(bot);
  startScheduler();

  const userSelectedCity = new Map<number, string>();

  function getUserCityQuery(userId: number): string {
    return userSelectedCity.get(userId) || DEFAULT_CITY.query;
  }

  function getUserCityLabel(userId: number): string {
    const query = userSelectedCity.get(userId) || DEFAULT_CITY.query;
    const city = UZBEKISTAN_CITIES.find((c) => c.query === query);
    return city ? city.label : DEFAULT_CITY.label;
  }

  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from?.first_name || "Foydalanuvchi";

    const welcomeText =
      `Salom, <b>${firstName}</b>! 🌤️\n\n` +
      `Men <b>Ob-havo Botman</b> — O'zbekiston shaharlari ob-havosini ko'rsataman!\n\n` +
      `🌟 <b>Imkoniyatlarim:</b>\n` +
      `• Istalgan viloyat ob-havosi\n` +
      `• Jizzax viloyati va Zomin tumani\n` +
      `• 5 kunlik ob-havo bashorati\n` +
      `• Har kuni 08:00 da avtomatik xabar\n` +
      `• Har kuni 21:00 da ertangi kun bashorati\n\n` +
      `⚙️ Quyidagi tugmalardan foydalaning:`;

    bot.sendMessage(chatId, welcomeText, {
      parse_mode: "HTML",
      reply_markup: MAIN_KEYBOARD,
    });
  });

  bot.onText(/\/help/, (msg) => {
    sendHelp(msg.chat.id);
  });

  bot.onText(/\/weather/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id || chatId;
    await sendCurrentWeather(chatId, userId);
  });

  bot.onText(/\/jizzax/, async (msg) => {
    const chatId = msg.chat.id;
    await sendWeatherForCity(chatId, "Jizzax,UZ", "🌄 Jizzax viloyati");
  });

  bot.onText(/\/zomin/, async (msg) => {
    const chatId = msg.chat.id;
    await sendWeatherForCity(chatId, "Zomin,UZ", "⛰️ Zomin tumani (Jizzax viloyati)");
  });

  bot.onText(/\/forecast/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id || chatId;
    await sendForecast(chatId, userId);
  });

  bot.onText(/\/cities/, (msg) => {
    sendCityList(msg.chat.id);
  });

  bot.onText(/\/subscribe/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id || chatId;
    const cityQuery = getUserCityQuery(userId);
    const cityLabel = getUserCityLabel(userId);
    addScheduledChat(chatId, cityQuery, cityLabel);
    bot.sendMessage(
      chatId,
      `✅ <b>Avtomatik bildirishnoma yoqildi!</b>\n\n` +
        `📍 Shahar: ${cityLabel}\n` +
        `🌅 Ertalab 08:00 da bugungi ob-havo\n` +
        `🌙 Kechqurun 21:00 da ertangi kun bashorati\n\n` +
        `(Toshkent vaqti bo'yicha)`,
      { parse_mode: "HTML" },
    );
  });

  bot.onText(/\/unsubscribe/, (msg) => {
    const chatId = msg.chat.id;
    removeScheduledChat(chatId);
    bot.sendMessage(
      chatId,
      `❌ Avtomatik bildirishnoma o'chirildi.`,
    );
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id || chatId;
    const text = msg.text || "";

    if (text.startsWith("/")) return;

    if (text === "🌤️ Hozirgi ob-havo") {
      await sendCurrentWeather(chatId, userId);
    } else if (text === "📅 5 kunlik bashorat") {
      await sendForecast(chatId, userId);
    } else if (text === "🏙️ Viloyatlar ro'yxati") {
      sendCityList(chatId);
    } else if (text === "⭐ Jizzax / Zomin") {
      await sendJizzaxZomin(chatId);
    } else if (text === "🔔 Avtomatik bildirishnomalar") {
      const cityQuery = getUserCityQuery(userId);
      const cityLabel = getUserCityLabel(userId);
      addScheduledChat(chatId, cityQuery, cityLabel);
      bot.sendMessage(
        chatId,
        `✅ <b>Avtomatik bildirishnoma yoqildi!</b>\n\n` +
          `📍 Shahar: ${cityLabel}\n` +
          `🌅 Ertalab 08:00 da bugungi ob-havo\n` +
          `🌙 Kechqurun 21:00 da ertangi kun bashorati\n\n` +
          `(Toshkent vaqti bo'yicha)`,
        { parse_mode: "HTML", reply_markup: MAIN_KEYBOARD },
      );
    } else if (text === "❌ Bildirishnomani o'chirish") {
      removeScheduledChat(chatId);
      bot.sendMessage(
        chatId,
        `❌ Avtomatik bildirishnoma o'chirildi.`,
        { reply_markup: MAIN_KEYBOARD },
      );
    } else if (text === "ℹ️ Yordam") {
      sendHelp(chatId);
    } else if (text.length > 2) {
      const city = findCity(text);
      if (city) {
        userSelectedCity.set(userId, city.query);
        updateScheduledChatCity(chatId, city.query, city.label);
        await sendWeatherForCity(chatId, city.query, city.label);
      } else {
        try {
          const weather = await getCurrentWeather(`${text},UZ`);
          const msg2 = formatWeatherMessage(weather, `📍 ${weather.city}`);
          bot.sendMessage(chatId, msg2, {
            parse_mode: "HTML",
            reply_markup: MAIN_KEYBOARD,
          });
        } catch {
          bot.sendMessage(
            chatId,
            `❌ "${text}" shahri topilmadi.\n\nQuyidagi tugmadan shahar tanlang:`,
            { reply_markup: CITY_KEYBOARD },
          );
        }
      }
    }
  });

  bot.on("callback_query", async (query) => {
    const chatId = query.message?.chat.id;
    const userId = query.from.id;
    if (!chatId) return;

    const data = query.data || "";

    if (data.startsWith("city:")) {
      const cityName = data.replace("city:", "");
      const city = UZBEKISTAN_CITIES.find((c) => c.name === cityName);
      if (city) {
        userSelectedCity.set(userId, city.query);
        updateScheduledChatCity(chatId, city.query, city.label);
        await bot.answerCallbackQuery(query.id, { text: `${city.label} tanlandi` });
        await sendWeatherForCity(chatId, city.query, city.label);
      }
    }
  });

  bot.on("my_chat_member", (msg) => {
    const chatId = msg.chat.id;
    const newStatus = msg.new_chat_member.status;

    if (newStatus === "member" || newStatus === "administrator") {
      addScheduledChat(chatId, DEFAULT_CITY.query, DEFAULT_CITY.label);
      logger.info({ chatId, chatType: msg.chat.type }, "Bot added to chat, auto-subscribed");

      if (msg.chat.type !== "private") {
        bot.sendMessage(
          chatId,
          `Salom! 🌤️ Men <b>Ob-havo Bot</b>!\n\n` +
            `Bu kanal/guruhga qo'shildim va har kuni ob-havo haqida xabar beraman:\n` +
            `🌅 Ertalab <b>08:00</b> — bugungi ob-havo\n` +
            `🌙 Kechqurun <b>21:00</b> — ertangi kun bashorati\n\n` +
            `Standart shahar: <b>Jizzax viloyati</b>\n` +
            `Shaharni o'zgartirish uchun /cities buyrug'ini yuboring.`,
          { parse_mode: "HTML" },
        );
      }
    } else if (newStatus === "left" || newStatus === "kicked") {
      removeScheduledChat(chatId);
      logger.info({ chatId }, "Bot removed from chat, unsubscribed");
    }
  });

  async function sendCurrentWeather(chatId: number, userId: number): Promise<void> {
    try {
      const cityQuery = getUserCityQuery(userId);
      const cityLabel = getUserCityLabel(userId);
      bot.sendMessage(chatId, "⏳ Ob-havo ma'lumoti yuklanmoqda...");
      const weather = await getCurrentWeather(cityQuery);
      const msg = formatWeatherMessage(weather, cityLabel);
      bot.sendMessage(chatId, msg, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "📅 5 kunlik bashorat", callback_data: `city:${cityQuery.split(",")[0].toLowerCase()}` },
            ],
            [
              { text: "🏙️ Boshqa shahar", callback_data: "show_cities" },
            ],
          ],
        },
      });
    } catch (err) {
      logger.error({ err }, "Failed to get weather");
      bot.sendMessage(
        chatId,
        "❌ Ob-havo ma'lumotini olishda xatolik yuz berdi. Keyinroq urinib ko'ring.",
      );
    }
  }

  async function sendWeatherForCity(chatId: number, cityQuery: string, cityLabel: string): Promise<void> {
    try {
      bot.sendMessage(chatId, `⏳ ${cityLabel} ob-havosi yuklanmoqda...`);
      const weather = await getCurrentWeather(cityQuery);
      const msg = formatWeatherMessage(weather, cityLabel);
      bot.sendMessage(chatId, msg, {
        parse_mode: "HTML",
        reply_markup: MAIN_KEYBOARD,
      });
    } catch (err) {
      logger.error({ err, cityQuery }, "Failed to get weather for city");
      bot.sendMessage(
        chatId,
        `❌ ${cityLabel} ob-havosini olishda xatolik yuz berdi.`,
        { reply_markup: MAIN_KEYBOARD },
      );
    }
  }

  async function sendForecast(chatId: number, userId: number): Promise<void> {
    try {
      const cityQuery = getUserCityQuery(userId);
      const cityLabel = getUserCityLabel(userId);
      bot.sendMessage(chatId, "⏳ 5 kunlik bashorat yuklanmoqda...");
      const forecast = await getForecast(cityQuery);
      const msg = formatForecastMessage(forecast, cityLabel);
      bot.sendMessage(chatId, msg, {
        parse_mode: "HTML",
        reply_markup: MAIN_KEYBOARD,
      });
    } catch (err) {
      logger.error({ err }, "Failed to get forecast");
      bot.sendMessage(
        chatId,
        "❌ Bashorat ma'lumotini olishda xatolik yuz berdi.",
      );
    }
  }

  async function sendJizzaxZomin(chatId: number): Promise<void> {
    try {
      bot.sendMessage(chatId, "⏳ Jizzax va Zomin ob-havosi yuklanmoqda...");

      const [jizzaxWeather, zominWeather] = await Promise.all([
        getCurrentWeather("Jizzax,UZ"),
        getCurrentWeather("Zomin,UZ"),
      ]);

      const jizzaxMsg = formatWeatherMessage(jizzaxWeather, "🌄 Jizzax viloyati");
      const zominMsg = formatWeatherMessage(zominWeather, "⛰️ Zomin tumani");

      await bot.sendMessage(chatId, jizzaxMsg, { parse_mode: "HTML" });
      await bot.sendMessage(chatId, zominMsg, {
        parse_mode: "HTML",
        reply_markup: MAIN_KEYBOARD,
      });
    } catch (err) {
      logger.error({ err }, "Failed to get Jizzax/Zomin weather");
      bot.sendMessage(
        chatId,
        "❌ Jizzax/Zomin ob-havosini olishda xatolik yuz berdi.",
      );
    }
  }

  function sendCityList(chatId: number): void {
    bot.sendMessage(
      chatId,
      "🏙️ <b>Shahar tanlang:</b>\n\nQuyidagi tugmalardan birini bosing:",
      {
        parse_mode: "HTML",
        reply_markup: CITY_KEYBOARD,
      },
    );
  }

  function sendHelp(chatId: number): void {
    const helpText =
      `ℹ️ <b>Ob-havo Bot — Yordam</b>\n\n` +
      `<b>Buyruqlar:</b>\n` +
      `/start — Botni ishga tushirish\n` +
      `/weather — Hozirgi ob-havo\n` +
      `/forecast — 5 kunlik bashorat\n` +
      `/jizzax — Jizzax viloyati ob-havosi\n` +
      `/zomin — Zomin tumani ob-havosi\n` +
      `/cities — Shaharlar ro'yxati\n` +
      `/subscribe — Avtomatik bildirishnomani yoqish\n` +
      `/unsubscribe — Avtomatik bildirishnomani o'chirish\n\n` +
      `<b>Xususiyatlar:</b>\n` +
      `🌅 Har kuni ertalab 08:00 da ob-havo xabari\n` +
      `🌙 Har kuni kechqurun 21:00 da ertangi kun bashorati\n` +
      `⭐ Jizzax viloyati va Zomin tumani alohida ko'rsatiladi\n` +
      `🌧️⛅☁️☀️ Ob-havo piktogrammalari\n\n` +
      `Shahar nomini yozsangiz ham ob-havo ko'rsatiladi!`;

    bot.sendMessage(chatId, helpText, {
      parse_mode: "HTML",
      reply_markup: MAIN_KEYBOARD,
    });
  }

  logger.info("Telegram bot started successfully");
}
