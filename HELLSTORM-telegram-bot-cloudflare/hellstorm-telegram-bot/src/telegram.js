function apiUrl(token, method) {
  return `https://api.telegram.org/bot${token}/${method}`;
}

async function readApiResult(response, method) {
  let payload;

  try {
    payload = await response.json();
  } catch {
    throw new Error(`Telegram API ${method} returned an unreadable response`);
  }

  if (!response.ok || payload?.ok !== true) {
    throw new Error(`Telegram API ${method} failed (HTTP ${response.status})`);
  }

  return payload.result;
}

export async function telegramCall(env, method, body) {
  const response = await fetch(apiUrl(env.TELEGRAM_BOT_TOKEN, method), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  return readApiResult(response, method);
}

export async function telegramCallWithPhoto(env, method, formData) {
  const response = await fetch(apiUrl(env.TELEGRAM_BOT_TOKEN, method), {
    method: "POST",
    body: formData,
  });

  return readApiResult(response, method);
}
