import { STICKER_PACK_URL } from "./content/guild.js";
import { HEROES } from "./content/heroes.js";

const button = (text, callback_data) => ({ text, callback_data });
const urlButton = (text, url) => ({ text, url });
const keyboard = (...rows) => ({ inline_keyboard: rows });

export function homeKeyboard() {
  return keyboard(
    [
      button("🦊 Об ордене", "menu:guild"),
      button("⚔️ Сборки героев", "menu:builds"),
    ],
    [
      button("📖 Справочник", "menu:guides"),
      button("🎯 Приоритет", "guide:priority"),
    ],
    [urlButton("🎟️ Стикеры", STICKER_PACK_URL)],
  );
}

export function buildsKeyboard() {
  const rows = [];
  for (let index = 0; index < HEROES.length; index += 2) {
    const row = [
      button(HEROES[index].name, `hero:${HEROES[index].id}`),
    ];
    if (HEROES[index + 1]) {
      row.push(button(HEROES[index + 1].name, `hero:${HEROES[index + 1].id}`));
    }
    rows.push(row);
  }
  rows.push([urlButton("🎟️ Стикеры", STICKER_PACK_URL)]);
  rows.push([button("🏠 В меню", "menu:home")]);
  return { inline_keyboard: rows };
}

const guideRows = [
  [
    ["🔮 Реликвия", "guide:relics"],
    ["🤝 Помощники", "guide:helpers"],
  ],
  [
    ["⚒️ Кузница", "guide:base"],
    ["💠 Эмблемы", "guide:emblems"],
  ],
  [
    ["✨ Божественность", "guide:divinity"],
    ["🛡️ Экипировка", "guide:equip"],
  ],
  [
    ["📦 Комбин", "guide:combine"],
    ["🔥 Закалка", "guide:temper"],
  ],
  [
    ["⚔️ Статы слотов", "guide:gear-stats"],
    ["👻 Душа / эфир", "guide:soul"],
  ],
  [
    ["🧿 Чары", "guide:enchants"],
    ["🌌 Созвездие", "guide:constellation"],
  ],
  [
    ["🎁 Сувениры", "guide:souvenirs"],
    ["🐾 Питомцы", "guide:pets"],
  ],
  [
    ["📊 Шкала ордена", "guide:tier"],
    ["♟️ Расстановка", "guide:form"],
  ],
  [
    ["🌾 Нарсия", "guide:farm"],
    ["🐉 Дракон", "guide:dragon"],
  ],
];

export function guidesKeyboard() {
  return {
    inline_keyboard: [
      ...guideRows.map((row) => row.map(([text, data]) => button(text, data))),
      [button("🏠 В меню", "menu:home")],
    ],
  };
}

function backKeyboard(extraRows = []) {
  return {
    inline_keyboard: [
      ...extraRows.map((row) => row.map(([text, data]) => button(text, data))),
      [
        button("📖 Справочник", "menu:guides"),
        button("🏠 Меню", "menu:home"),
      ],
    ],
  };
}

export function heroKeyboard(heroIndex) {
  const previous = HEROES[(heroIndex - 1 + HEROES.length) % HEROES.length];
  const next = HEROES[(heroIndex + 1) % HEROES.length];

  return {
    inline_keyboard: [
      [
        button("◀️", `hero:${previous.id}`),
        button("Все сборки", "menu:builds"),
        button("▶️", `hero:${next.id}`),
      ],
      [
        urlButton("🎟️ Стикеры", STICKER_PACK_URL),
        button("🏠 Меню", "menu:home"),
      ],
    ],
  };
}

export function keyboardFor(pageId) {
  if (pageId === "menu:home") return homeKeyboard();
  if (pageId === "menu:builds") return buildsKeyboard();
  if (pageId === "menu:guides" || pageId === "guide:home") {
    return guidesKeyboard();
  }
  if (pageId.startsWith("guide:divinity")) {
    return backKeyboard([
      [
        ["I", "guide:divinity-i"],
        ["II", "guide:divinity-ii"],
        ["III", "guide:divinity-iii"],
        ["IV", "guide:divinity-iv"],
        ["V", "guide:divinity-v"],
      ],
    ]);
  }
  if (pageId === "guide:relics") {
    return backKeyboard([[["🤝 Помощники", "guide:helpers"]]]);
  }
  if (pageId === "guide:pets") {
    return backKeyboard([[["⭐ Стоимость", "guide:pets-cost"]]]);
  }
  if (pageId === "guide:equip") {
    return backKeyboard([
      [
        ["📦 Комбин", "guide:combine"],
        ["🔥 Закалка", "guide:temper"],
      ],
    ]);
  }
  if (pageId === "guide:soul") {
    return backKeyboard([
      [
        ["🧿 Чары", "guide:enchants"],
        ["🌌 Созвездие", "guide:constellation"],
      ],
    ]);
  }
  if (pageId === "menu:guild" || pageId === "menu:help") {
    return backKeyboard();
  }
  return backKeyboard();
}
