export function block(lines) {
  return lines.filter((line) => line !== null && line !== undefined).join("\n");
}

export function title(emoji, text) {
  return `${emoji} <b>${text}</b>`;
}

export function kv(label, value) {
  return `• <b>${label}:</b> ${value}`;
}

export function note(text) {
  return `<i>${text}</i>`;
}

export function codeTable(headers, rows) {
  const all = [headers, ...rows];
  const widths = headers.map((_, col) =>
    Math.max(...all.map((row) => String(row[col] ?? "").length)),
  );

  const formatRow = (row) =>
    row
      .map((cell, col) => String(cell ?? "").padEnd(widths[col], " "))
      .join("  ");

  const line = widths.map((width) => "─".repeat(width)).join("──");

  return ["<pre>", formatRow(headers), line, ...rows.map(formatRow), "</pre>"].join(
    "\n",
  );
}

export function chips(items) {
  return items.map((item) => `▸ ${item}`).join("\n");
}
