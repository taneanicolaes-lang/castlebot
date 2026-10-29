import { InlineKeyboard, Keyboard } from "grammy";
import { STICKER_PACK_URL } from "./content/guild.js";
import { HEROES } from "./content/heroes.js";

export const replyMenu = new Keyboard()
  .text("🦊 Орден")
  .text("⚔️ Сборки")
  .row()
  .text("📖 Справочник")
  .text("🎯 Приоритет")
  .row()
  .text("🧭 Помощь")
  .resized()
  .persistent()
  .placeholder("Раздел или имя героя…");

export function homeInline() {
  return new InlineKeyboard()
    .text("🦊 Об ордене", "menu:guild")
    .text("⚔️ Сборки", "menu:builds")
    .row()
    .text("📖 Справочник", "menu:guides")
    .text("🎯 Приоритет", "guide:priority")
    .row()
    .url("🎟️ Стикеры", STICKER_PACK_URL);
}

export function guidesInline() {
  return new InlineKeyboard()
    .text("🔮 Реликвия", "guide:relics")
    .text("🤝 Помощники", "guide:helpers")
    .row()
    .text("⚒️ Кузница", "guide:base")
    .text("💠 Эмблемы", "guide:emblems")
    .row()
    .text("✨ Божественность", "guide:divinity")
    .text("🛡️ Экипировка", "guide:equip")
    .row()
    .text("📦 Комбин", "guide:combine")
    .text("🔥 Закалка", "guide:temper")
    .row()
    .text("⚔️ Статы слотов", "guide:gear-stats")
    .text("👻 Душа / эфир", "guide:soul")
    .row()
    .text("🧿 Чары", "guide:enchants")
    .text("🌌 Созвездие", "guide:constellation")
    .row()
    .text("🎁 Сувениры", "guide:souvenirs")
    .text("🐾 Питомцы", "guide:pets")
    .row()
    .text("📊 Шкала ордена", "guide:tier")
    .text("♟️ Расстановка", "guide:form")
    .row()
    .text("🌾 Нарсия", "guide:farm")
    .text("🐉 Дракон", "guide:dragon")
    .row()
    .text("🏠 В меню", "menu:home");
}

export function divinityInline() {
  return new InlineKeyboard()
    .text("I", "guide:divinity-i")
    .text("II", "guide:divinity-ii")
    .text("III", "guide:divinity-iii")
    .text("IV", "guide:divinity-iv")
    .text("V", "guide:divinity-v")
    .row()
    .text("⬅️ Смета", "guide:divinity")
    .text("📖 Справочник", "menu:guides")
    .row()
    .text("🏠 В меню", "menu:home");
}

export function guideBack(extra = []) {
  const keyboard = new InlineKeyboard();
  extra.forEach((row) => {
    row.forEach(([label, data]) => keyboard.text(label, data));
    keyboard.row();
  });
  return keyboard
    .text("📖 Справочник", "menu:guides")
    .text("🏠 Меню", "menu:home");
}

export function buildsInline() {
  const keyboard = new InlineKeyboard();
  HEROES.forEach((hero, index) => {
    keyboard.text(hero.name, `hero:${hero.id}`);
    if ((index + 1) % 2 === 0) keyboard.row();
  });
  if (HEROES.length % 2 !== 0) keyboard.row();
  return keyboard
    .url("🎟️ Стикеры", STICKER_PACK_URL)
    .row()
    .text("🏠 В меню", "menu:home");
}

export function heroInline(heroIndex) {
  const previous = HEROES[(heroIndex - 1 + HEROES.length) % HEROES.length];
  const next = HEROES[(heroIndex + 1) % HEROES.length];

  return new InlineKeyboard()
    .text("◀️", `hero:${previous.id}`)
    .text("Все сборки", "menu:builds")
    .text("▶️", `hero:${next.id}`)
    .row()
    .url("🎟️ Стикеры", STICKER_PACK_URL)
    .text("🏠 Меню", "menu:home");
}

export function keyboardFor(id) {
  if (id === "menu:home") return homeInline();
  if (id === "menu:builds") return buildsInline();
  if (id === "menu:guides" || id === "guide:home") return guidesInline();
  if (id.startsWith("guide:divinity")) return divinityInline();
  if (id === "guide:relics") {
    return guideBack([[["🤝 Помощники", "guide:helpers"]]]);
  }
  if (id === "guide:pets") {
    return guideBack([[["⭐ Стоимость", "guide:pets-cost"]]]);
  }
  if (id === "guide:equip") {
    return guideBack([
      [
        ["📦 Комбин", "guide:combine"],
        ["🔥 Закалка", "guide:temper"],
      ],
    ]);
  }
  if (id === "guide:soul") {
    return guideBack([
      [
        ["🧿 Чары", "guide:enchants"],
        ["🌌 Созвездие", "guide:constellation"],
      ],
    ]);
  }
  return guideBack();
}
