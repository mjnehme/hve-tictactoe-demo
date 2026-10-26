import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const manifest = JSON.parse(await readFile(new URL("../public/manifest.json", import.meta.url), "utf8"));
const styles = html.match(/<style>([\s\S]*?)<\/style>/)[1].split("@media")[0];

function color(selector, property) {
  const rule = [...styles.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .find(([, selectors]) => selectors.split(",").some(value => value.trim() === selector));
  assert.ok(rule, `Missing rule: ${selector}`);
  const declaration = rule[2].split(";")
    .map(value => value.trim().split(/:\s*/))
    .find(([name]) => name === property);
  assert.ok(declaration, `Missing ${selector} ${property}`);
  const hex = declaration[1].match(/(?:^|\s)#([a-f0-9]{6}|[a-f0-9]{3})(?=\s|$)/i)?.[1];
  assert.ok(hex, `Missing opaque hex color: ${selector} ${property}`);
  return `#${hex.length === 3 ? [...hex].map(value => value.repeat(2)).join("") : hex}`.toLowerCase();
}

function contrast(foreground, background) {
  const luminance = hex => {
    const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("uses native named controls and atomic status messages", () => {
  assert.match(html, /<main>/);
  assert.match(html, /role="group" aria-label="Tic-Tac-Toe board"/);
  assert.match(html, /role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(html, /cell\.type = "button"/);
  assert.match(html, /Row \$\{row\}, column \$\{column\}/);
  assert.doesNotMatch(html, /role="grid"/);
});

test("renders player content as text and preserves player identity", () => {
  assert.match(html, /turnElement\.textContent =/);
  assert.match(html, /custom \? `\$\{custom\} \(\$\{player\}\)` : player/);
  assert.doesNotMatch(html, /\.innerHTML\s*=/);
  assert.match(html, /maxlength="12"/);
});

test("implements deterministic focus without moving it during name edits", () => {
  assert.match(html, /function focusAfterMove\(index\)/);
  assert.match(html, /againButton\.focus\(\)/);
  assert.match(html, /next\?\.focus\(\)/);
  assert.match(html, /querySelector\("\.cell:not\(:disabled\)"\)\?\.focus\(\)/);
  assert.match(html, /addEventListener\("input", render\)/);
});

test("keeps responsive, touch, and forced-colors contracts in source", () => {
  assert.match(html, /touch-action: manipulation/);
  assert.match(html, /min-width: 64px/);
  assert.match(html, /min-height: 64px/);
  assert.match(html, /font-size: 18px/);
  assert.match(html, /overflow-wrap: anywhere/);
  assert.match(html, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(html, /:hover/);
});

test("keeps offline readiness and failure messages visible and non-blocking", () => {
  assert.match(html, /Offline play is preparing/);
  assert.match(html, /Offline play is ready on this device/);
  assert.match(html, /Offline play is unavailable right now/);
  assert.match(html, /An update is ready after you finish/);
  assert.match(html, /updateViaCache: "none"/);
  assert.match(html, /worker\.state === "redundant"/);
});

test("keeps the pale-blue page and launch hint with independent surfaces and dark chrome", () => {
  assert.equal(color("body", "background"), "#e6f4ff");
  assert.equal(manifest.background_color, color("body", "background"));
  assert.equal(manifest.theme_color, "#111111");
  assert.match(html, /<meta name="theme-color" content="#111111">/);
  for (const [selector, property, expected] of [
    ["body", "color", "#111111"],
    [".cell", "background", "#ffffff"],
    [".cell", "color", "#111111"],
    [".cell.win", "background", "#ffe066"],
    [".cell.o", "color", "#0645ad"],
    [".mark-o", "color", "#0645ad"],
    ["#again", "background", "#111111"],
    ["#again", "color", "#ffffff"],
    [".names input", "border", "#555555"],
    [".cell:focus-visible", "outline", "#0645ad"],
    ["input:focus-visible", "outline", "#0645ad"],
    ["#again:focus-visible", "outline", "#0645ad"]
  ]) {
    assert.equal(color(selector, property), expected, `${selector} ${property}`);
  }
});

test("declared text, marks, identifying borders, and focus retain unrounded contrast thresholds", () => {
  const page = color("body", "background");
  const cell = color(".cell", "background");
  const win = color(".cell.win", "background");
  const replay = color("#again", "background");
  const pairs = [
    ["body", "color", page, 4.5],
    [".mark-o", "color", page, 4.5],
    ["#again", "color", replay, 4.5],
    ...[cell, win].flatMap(surface => [
      [".cell", "color", surface, 4.5],
      [".cell.o", "color", surface, 4.5]
    ]),
    ...[page, cell, win].map(surface => [".cell", "border", surface, 3]),
    [".board.turn-x", "border-color", page, 3],
    [".board.turn-o", "border-color", page, 3],
    [".names input", "border", page, 3],
    ["#again", "border", page, 3],
    ...[page, cell, win].map(surface => [".cell:focus-visible", "outline", surface, 3]),
    ["input:focus-visible", "outline", page, 3],
    ["#again:focus-visible", "outline", page, 3]
  ];
  for (const [selector, property, surface, minimum] of pairs) {
    const ratio = contrast(color(selector, property), surface);
    assert.ok(ratio >= minimum, `${selector} ${property} on ${surface}: ${ratio} < ${minimum}`);
  }
});
