import cron from "node-cron";
import { logger } from "../lib/logger";
import { getCurrentWeather, formatDailyReport } from "./weather";
import { DEFAULT_CITY } from "./cities";

interface ScheduledChat {
  chatId: number | string;
  cityQuery: string;
  cityLabel: string;
}

const scheduledChats = new Map<string, ScheduledChat>();

let botInstance: { sendMessage: (chatId: number | string, text: string, opts?: object) => Promise<unknown> } | null =
  null;

export function setBotInstance(bot: {
  sendMessage: (chatId: number | string, text: string, opts?: object) => Promise<unknown>;
}): void {
  botInstance = bot;
}

export function addScheduledChat(chatId: number | string, cityQuery?: string, cityLabel?: string): void {
  const key = String(chatId);
  scheduledChats.set(key, {
    chatId,
    cityQuery: cityQuery || DEFAULT_CITY.query,
    cityLabel: cityLabel || DEFAULT_CITY.label,
  });
  logger.info({ chatId, cityQuery }, "Added chat to scheduled list");
}

export function removeScheduledChat(chatId: number | string): void {
  const key = String(chatId);
  scheduledChats.delete(key);
  logger.info({ chatId }, "Removed chat from scheduled list");
}

export function getScheduledChats(): Map<string, ScheduledChat> {
  return scheduledChats;
}

export function updateScheduledChatCity(
  chatId: number | string,
  cityQuery: string,
  cityLabel: string,
): void {
  const key = String(chatId);
  const existing = scheduledChats.get(key);
  if (existing) {
    existing.cityQuery = cityQuery;
    existing.cityLabel = cityLabel;
    scheduledChats.set(key, existing);
  }
}

async function sendWeatherToChats(isEvening: boolean): Promise<void> {
  if (!botInstance) return;
  if (scheduledChats.size === 0) return;

  for (const [, chat] of scheduledChats) {
    try {
      const weather = await getCurrentWeather(chat.cityQuery);
      const msg = formatDailyReport(weather, chat.cityLabel, isEvening);
      await botInstance.sendMessage(chat.chatId, msg, { parse_mode: "HTML" });
      logger.info({ chatId: chat.chatId, isEvening }, "Sent scheduled weather");
    } catch (err) {
      logger.error({ err, chatId: chat.chatId }, "Failed to send scheduled weather");
    }
  }
}

export function startScheduler(): void {
  cron.schedule(
    "0 8 * * *",
    async () => {
      logger.info("Running morning weather job");
      await sendWeatherToChats(false);
    },
    {
      timezone: "Asia/Tashkent",
    },
  );

  cron.schedule(
    "0 21 * * *",
    async () => {
      logger.info("Running evening weather job");
      await sendWeatherToChats(true);
    },
    {
      timezone: "Asia/Tashkent",
    },
  );

  logger.info("Weather scheduler started (08:00 morning, 21:00 evening Tashkent time)");
}
