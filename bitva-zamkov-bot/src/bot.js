import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Bot, InputFile } from "grammy";
import { GUILD_HTML, HELP_HTML, WELCOME_HTML } from "./content/guild.js";
import { GUIDES, GUIDE_KEYWORDS } from "./content/guides.js";
import { HEROES } from "./content/heroes.js";
import { block, title } from "./format.js";
import {
  buildsInline,
  heroInline,
  homeInline,
  keyboardFor,
  replyMenu,
} from "./keyboards.js";

const rootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..");
const heroImageDirectory = join(rootDirectory, "assets", "heroes");

const PAGES = {
  "menu:home": WELCOME_HTML,
  "menu:guild": GUILD_HTML,
  "menu:help": HELP_HTML,
  "menu:builds": block([
    title("⚔️", "Сборки ордена"),
    "Двенадцать скринов — как ходим мы, а не соседняя гильдия.",
    "Выбери героя. Подпись к навыку и листание — под картинкой.",
  ]),
};

function pageHtml(id) {
  if (PAGES[id]) return PAGES[id];
  return GUIDES[id]?.html;
}

async function sendPage(ctx, id, { edit = false } = {}) {
  const html = pageHtml(id);
  const markup = id === "menu:builds" ? buildsInline() : keyboardFor(id);
  const options = { parse_mode: "HTML", reply_markup: markup };

  if (edit && ctx.callbackQuery?.message?.text) {
    try {
      await ctx.editMessageText(html, options);
      return;
    } catch {
      // Same text or photo message — отправим новое.
    }
  }

  await ctx.reply(html, options);
}

async function showWelcome(ctx) {
  await ctx.reply(WELCOME_HTML, {
    parse_mode: "HTML",
    reply_markup: homeInline(),
  });
  await ctx.reply("Выбери раздел кнопками ниже 👇", { reply_markup: replyMenu });
}

async function showHero(ctx, heroId) {
  const heroIndex = HEROES.findIndex((hero) => hero.id === heroId);
  const hero = HEROES[heroIndex];

  if (!hero) {
    await ctx.reply("Этого героя в сборках нет. Открой список ещё раз.");
    return;
  }

  const imagePath = join(heroImageDirectory, hero.image);
  if (!existsSync(imagePath)) {
    throw new Error(`Нет скрина: ${hero.image}`);
  }

  const caption = block([
    `⚔️ <b>${hero.name}</b>`,
    `Роль: ${hero.role}`,
    `Чары на скрине: <b>${hero.skill}</b>`,
    "",
    "Экипировка, питомец и звёзды — на фото. Это сборка HELLSTORM.",
  ]);

  await ctx.replyWithPhoto(new InputFile(imagePath), {
    caption,
    parse_mode: "HTML",
    reply_markup: heroInline(heroIndex),
  });
}

function findByText(text) {
  const query = text.toLowerCase();

  const hero = HEROES.find(
    (item) =>
      item.name.toLowerCase().includes(query) ||
      item.keywords.some((key) => query.includes(key) || key.includes(query)),
  );
  if (hero) return { type: "hero", id: hero.id };

  const guide = GUIDE_KEYWORDS.find((item) =>
    item.keys.some((key) => query.includes(key)),
  );
  if (guide) return { type: "page", id: guide.id };

  if (/гильд|орден|hellstorm|хелл/.test(query)) {
    return { type: "page", id: "menu:guild" };
  }
  if (/сборк|билд/.test(query)) {
    return { type: "page", id: "menu:builds" };
  }
  if (/помощ|команд|start/.test(query)) {
    return { type: "page", id: "menu:help" };
  }

  return null;
}

export function createBot(token) {
  const bot = new Bot(token);

  bot.command("start", showWelcome);
  bot.command("help", (ctx) => sendPage(ctx, "menu:help"));
  bot.command("guild", (ctx) => sendPage(ctx, "menu:guild"));
  bot.command("builds", (ctx) => sendPage(ctx, "menu:builds"));
  bot.command("guide", (ctx) => sendPage(ctx, "guide:home"));

  bot.hears("🦊 Орден", (ctx) => sendPage(ctx, "menu:guild"));
  bot.hears("⚔️ Сборки", (ctx) => sendPage(ctx, "menu:builds"));
  bot.hears("📖 Справочник", (ctx) => sendPage(ctx, "guide:home"));
  bot.hears("🎯 Приоритет", (ctx) => sendPage(ctx, "guide:priority"));
  bot.hears("🧭 Помощь", (ctx) => sendPage(ctx, "menu:help"));

  bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;
    await ctx.answerCallbackQuery();

    if (data.startsWith("hero:")) {
      await showHero(ctx, data.slice(5));
      return;
    }

    if (pageHtml(data)) {
      await sendPage(ctx, data, { edit: true });
      return;
    }

    await ctx.reply("Раздел обновился. Нажми /start.");
  });

  bot.on("message:text", async (ctx, next) => {
    if (ctx.message.text.startsWith("/")) {
      await next();
      return;
    }

    const match = findByText(ctx.message.text);
    if (!match) {
      await ctx.reply(
        block([
          "Не нашёл точный раздел.",
          "Напиши имя героя или тему: реликвия, питомец, чары, Нарсия.",
          "Либо открой меню кнопками внизу.",
        ]),
        { reply_markup: homeInline() },
      );
      return;
    }

    if (match.type === "hero") {
      await showHero(ctx, match.id);
      return;
    }

    await sendPage(ctx, match.id);
  });

  bot.catch((error) => {
    console.error(
      `[HELLSTORM] Ошибка Telegram: ${error.error?.name ?? "неизвестная"}`,
    );
  });

  return bot;
}
