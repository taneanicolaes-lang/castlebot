import {
  GUILD_HTML,
  HELP_HTML,
  STICKER_PACK_URL,
  WELCOME_HTML,
} from "./content/guild.js";
import { GUIDE_KEYWORDS, GUIDES } from "./content/guides.js";
import { HEROES } from "./content/heroes.js";
import { block, title } from "./format.js";
import {
  buildsKeyboard,
  heroKeyboard,
  homeKeyboard,
  keyboardFor,
} from "./keyboards.js";
import { telegramCall, telegramCallWithPhoto } from "./telegram.js";

const BUILDS_HTML = block([
  title("⚔️", "Сборки HELLSTORM"),
  "Выбери героя, чтобы открыть скриншот сборки и посмотреть ключевой навык.",
  "Материалы сборок предоставлены владельцем проекта.",
]);

const PAGES = {
  "menu:home": WELCOME_HTML,
  "menu:guild": GUILD_HTML,
  "menu:help": HELP_HTML,
  "menu:builds": BUILDS_HTML,
  "menu:guides": GUIDES["guide:home"]?.html,
  "guide:home": GUIDES["guide:home"]?.html,
};

function pageHtml(pageId) {
  return PAGES[pageId] ?? GUIDES[pageId]?.html;
}

async function sendMessage(env, chatId, text, replyMarkup) {
  const body = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (replyMarkup) body.reply_markup = replyMarkup;
  await telegramCall(env, "sendMessage", body);
}

async function sendPage(env, chatId, pageId) {
  const html = pageHtml(pageId);
  if (!html) {
    await sendMessage(
      env,
      chatId,
      "Этот раздел не найден. Открой /start и выбери нужную тему.",
      homeKeyboard(),
    );
    return;
  }
  if (pageId === "menu:home") {
    await sendAssetPhoto(
      env,
      chatId,
      "hellstorm-emblem.jpg",
      "hellstorm-emblem.jpg",
      `${html}\n\n<i>Эмблема предоставлена владельцем проекта.</i>`,
      keyboardFor(pageId),
    );
    return;
  }
  await sendMessage(env, chatId, html, keyboardFor(pageId));
}

async function sendAssetPhoto(env, chatId, assetPath, filename, caption, markup) {
  if (!env.ASSETS) {
    throw new Error("Static asset binding is not configured");
  }

  const assetResponse = await env.ASSETS.fetch(
    new Request(
      `https://assets.local/${assetPath
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`,
    ),
  );
  if (!assetResponse.ok) {
    throw new Error("Image is missing from the deployed assets");
  }

  const photo = new Blob([await assetResponse.arrayBuffer()], {
    type: "image/jpeg",
  });
  const form = new FormData();
  form.set("chat_id", String(chatId));
  form.set("photo", photo, filename);
  form.set("caption", caption);
  form.set("parse_mode", "HTML");
  form.set("reply_markup", JSON.stringify(markup));

  await telegramCallWithPhoto(env, "sendPhoto", form);
}

async function sendHero(env, chatId, heroId) {
  const heroIndex = HEROES.findIndex((item) => item.id === heroId);
  const hero = HEROES[heroIndex];

  if (!hero) {
    await sendMessage(
      env,
      chatId,
      "Этого героя нет в каталоге. Открой /builds и выбери из списка.",
      buildsKeyboard(),
    );
    return;
  }

  const caption = block([
    `⚔️ <b>${hero.name}</b>`,
    `Роль: ${hero.role}`,
    `Ключевой навык: <b>${hero.skill}</b>`,
    "",
    "Сборка HELLSTORM. Игровые изображения и герои принадлежат их правообладателям.",
  ]);
  await sendAssetPhoto(
    env,
    chatId,
    `heroes/${hero.image}`,
    hero.image,
    caption,
    heroKeyboard(heroIndex),
  );
}

export function resolveText(text) {
  const query = text.trim().toLowerCase();
  if (!query) return null;

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
  if (/помощ|команд|start|help/.test(query)) {
    return { type: "page", id: "menu:help" };
  }

  return null;
}

async function handleMessage(env, message) {
  const text = message.text;
  const chatId = message.chat?.id;
  if (typeof text !== "string" || chatId === undefined) return;

  if (text.startsWith("/")) {
    const command = text
      .trim()
      .split(/\s+/, 1)[0]
      .slice(1)
      .split("@", 1)[0]
      .toLowerCase();

    const commands = {
      start: "menu:home",
      guild: "menu:guild",
      builds: "menu:builds",
      guide: "guide:home",
      help: "menu:help",
    };
    const pageId = commands[command];
    if (pageId) {
      await sendPage(env, chatId, pageId);
    } else {
      await sendMessage(env, chatId, HELP_HTML, keyboardFor("menu:help"));
    }
    return;
  }

  const match = resolveText(text);
  if (!match) {
    await sendMessage(
      env,
      chatId,
      block([
        "Не нашёл точный раздел.",
        "Напиши имя героя или тему: реликвия, питомец, чары, Нарсия.",
        "Команда /start откроет меню.",
      ]),
      homeKeyboard(),
    );
    return;
  }

  if (match.type === "hero") {
    await sendHero(env, chatId, match.id);
    return;
  }
  await sendPage(env, chatId, match.id);
}

async function handleCallback(env, callback) {
  const queryId = callback.id;
  const data = callback.data ?? "";
  const chatId = callback.message?.chat?.id;
  await telegramCall(env, "answerCallbackQuery", {
    callback_query_id: queryId,
  });
  if (chatId === undefined) return;

  if (data.startsWith("hero:")) {
    await sendHero(env, chatId, data.slice("hero:".length));
    return;
  }

  await sendPage(env, chatId, data);
}

export async function handleUpdate(env, update) {
  if (update?.message) {
    await handleMessage(env, update.message);
    return;
  }
  if (update?.callback_query) {
    await handleCallback(env, update.callback_query);
  }
}

export const webhookSecretHeader = "x-telegram-bot-api-secret-token";
export const stickerPackUrl = STICKER_PACK_URL;
