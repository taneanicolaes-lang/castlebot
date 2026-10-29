import { handleUpdate, webhookSecretHeader } from "./bot.js";

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/health" && request.method === "GET") {
      const configured = Boolean(
        env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_WEBHOOK_SECRET,
      );
      return jsonResponse(
        { status: configured ? "ok" : "needs_secrets", service: "HELLSTORM bot" },
        configured ? 200 : 503,
      );
    }

    if (pathname !== "/api/telegram") {
      return new Response(
        "HELLSTORM Telegram bot. Health check: /api/health",
        { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } },
      );
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { allow: "POST" },
      });
    }

    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_WEBHOOK_SECRET) {
      return new Response("Bot secrets are not configured", { status: 503 });
    }

    const receivedSecret = request.headers.get(webhookSecretHeader) ?? "";
    if (!constantTimeEqual(receivedSecret, env.TELEGRAM_WEBHOOK_SECRET)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 1_000_000) {
      return new Response("Request too large", { status: 413 });
    }

    let update;
    try {
      update = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    if (
      !update ||
      typeof update !== "object" ||
      typeof update.update_id !== "number"
    ) {
      return new Response("Invalid Telegram update", { status: 400 });
    }

    try {
      await handleUpdate(env, update);
      return new Response("ok");
    } catch (error) {
      const errorName = error instanceof Error ? error.name : "UnknownError";
      console.error(`[HELLSTORM] Telegram update failed (${errorName}).`);
      return new Response("Temporary processing error", { status: 500 });
    }
  },
};
