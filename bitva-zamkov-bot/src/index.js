import "dotenv/config";
import { createBot } from "./bot.js";

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();

if (!token) {
  console.error(
    "[HELLSTORM] Нет TELEGRAM_BOT_TOKEN. Скопируй .env.example в .env и вставь токен BotFather.",
  );
  process.exit(1);
}

const bot = createBot(token);

await bot.api.setMyCommands([
  { command: "start", description: "Главное меню" },
  { command: "guild", description: "Об ордене HELLSTORM" },
  { command: "builds", description: "Сборки героев" },
  { command: "guide", description: "Справочник прокачки" },
  { command: "help", description: "Как пользоваться" },
]);

await bot.start({
  onStart: (info) => {
    console.info(`[HELLSTORM] @${info.username} в строю.`);
  },
});
