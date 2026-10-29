import { Bot, InlineKeyboard, InputFile, Keyboard } from "grammy";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GUILD_HTML,
  HEROES,
  STICKER_PACK_URL,
  WELCOME_HTML,
} from "./content.js";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error(
    "[HELLSTORM] Не задан TELEGRAM_BOT_TOKEN. Добавьте токен в переменные окружения.",
  );
  process.exit(1);
}

const bot = new Bot(token);
const botDirectory = dirname(fileURLToPath(import.meta.url));
const heroImageDirectory = join(botDirectory, "assets", "heroes");
const mainKeyboard = new Keyboard()
  .text("🛡 О гильдии")
  .text("⚔️ Сборки героев")
  .resized()
  .persistent()
  .placeholder("Выберите раздел");

function buildsKeyboard() {
  const keyboard = new InlineKeyboard();

  HEROES.forEach((hero, index) => {
    keyboard.text(`⚔️ ${hero.name}`, `hero:${hero.id}`);
    if ((index + 1) % 2 === 0) keyboard.row();
  });

  return keyboard
    .row()
    .url("🎟️ Стикерпак героев", STICKER_PACK_URL);
}

function heroKeyboard(heroIndex) {
  const previous = HEROES[(heroIndex - 1 + HEROES.length) % HEROES.length];
  const next = HEROES[(heroIndex + 1) % HEROES.length];

  return new InlineKeyboard()
    .url("🎟️ Стикеры HELLSTORM", STICKER_PACK_URL)
    .row()
    .text("⬅️ Все сборки", "builds")
    .text("🏠 Главное меню", "home")
    .row()
    .text("◀️ Предыдущий", `hero:${previous.id}`)
    .text("Следующий ▶️", `hero:${next.id}`);
}

async function showWelcome(ctx) {
  await ctx.reply(WELCOME_HTML, {
    parse_mode: "HTML",
    reply_markup: mainKeyboard,
  });
}

async function showGuild(ctx) {
  await ctx.reply(GUILD_HTML, {
    parse_mode: "HTML",
    reply_markup: mainKeyboard,
  });
}

async function showBuilds(ctx) {
  await ctx.reply(
    [
      "💎 <b>СБОРКИ ГЕРОЕВ HELLSTORM</b> 💎",
      "",
      "Выбери героя — бот пришлёт скриншот его сборки.",
      "Ссылка на стикеры есть в каждом сообщении.",
    ].join("\n"),
    {
      parse_mode: "HTML",
      reply_markup: buildsKeyboard(),
    },
  );
}

async function showHero(ctx, heroId) {
  const heroIndex = HEROES.findIndex((hero) => hero.id === heroId);
  const hero = HEROES[heroIndex];

  if (!hero) {
    await ctx.reply("Не нашёл эту сборку. Открой список героев и выбери ещё раз.");
    return;
  }

  const imagePath = join(heroImageDirectory, hero.image);
  if (!existsSync(imagePath)) {
    throw new Error(`Не найден скриншот сборки: ${hero.image}`);
  }

  const caption = [
    `⚔️ <b>${hero.name}</b>`,
    `✨ Навык на скриншоте: <b>${hero.skill}</b>`,
    "",
    "Экипировка, питомец и остальные параметры — на изображении.",
    "Добавь настроение бою стикерами HELLSTORM 🦊",
  ].join("\n");

  await ctx.replyWithPhoto(new InputFile(imagePath), {
    caption,
    parse_mode: "HTML",
    reply_markup: heroKeyboard(heroIndex),
  });
}

bot.command("start", showWelcome);
bot.command("help", showWelcome);
bot.command("guild", showGuild);
bot.command("builds", showBuilds);

bot.hears("🛡 О гильдии", showGuild);
bot.hears("⚔️ Сборки героев", showBuilds);

bot.callbackQuery("builds", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showBuilds(ctx);
});

bot.callbackQuery("home", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showWelcome(ctx);
});

bot.callbackQuery(/^hero:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await showHero(ctx, ctx.match[1]);
});

bot.catch((error) => {
  // Avoid logging the API URL, which can contain the bot token.
  console.error(
    `[HELLSTORM] Ошибка обработки Telegram: ${error.error?.name ?? "неизвестная ошибка"}`,
  );
});

await bot.api.setMyCommands([
  { command: "start", description: "Открыть главное меню" },
  { command: "guild", description: "Информация о гильдии" },
  { command: "builds", description: "Сборки героев" },
]);

await bot.start({
  onStart: (botInfo) => {
    console.info(`[HELLSTORM] Бот @${botInfo.username} запущен.`);
  },
});
