import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");

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
