import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const envFile = resolve(projectRoot, ".env");

function parseEnv(source) {
  const values = {};
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

async function telegramRequest(token, method, data) {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    },
  );

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(`${method} returned an unreadable response`);
  }

  if (!response.ok || result?.ok !== true) {
    throw new Error(`${method} failed (HTTP ${response.status})`);
  }
}

try {
  const values = parseEnv(await readFile(envFile, "utf8"));
  const token = values.TELEGRAM_BOT_TOKEN;
  const secret = values.TELEGRAM_WEBHOOK_SECRET;
  const workerUrl = values.WORKER_URL?.replace(/\/+$/, "");

  if (!token || token.includes("replace_with")) {
    throw new Error("Add your BotFather token to the local .env file.");
  }
  if (!secret || !/^[A-Za-z0-9_-]{1,256}$/.test(secret)) {
    throw new Error(
      "TELEGRAM_WEBHOOK_SECRET must contain 1–256 letters, numbers, underscores, or hyphens.",
    );
  }
  if (!workerUrl) {
    throw new Error("Add the deployed Cloudflare Worker URL to .env.");
  }

  const parsedUrl = new URL(workerUrl);
  if (parsedUrl.protocol !== "https:" || parsedUrl.pathname !== "/") {
    throw new Error("WORKER_URL must be the HTTPS origin of your Worker.");
  }

  await telegramRequest(token, "setMyCommands", {
    commands: [
      { command: "start", description: "Главное меню" },
      { command: "guild", description: "Об ордене HELLSTORM" },
      { command: "builds", description: "Сборки героев" },
      { command: "guide", description: "Справочник прокачки" },
      { command: "help", description: "Как пользоваться" },
    ],
  });

  await telegramRequest(token, "setWebhook", {
    url: `${workerUrl}/api/telegram`,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
  });

  console.info("Готово: команды зарегистрированы, webhook установлен.");
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Не удалось настроить Telegram-бота.",
  );
  process.exitCode = 1;
}
