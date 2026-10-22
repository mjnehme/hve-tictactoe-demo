import assert from "node:assert/strict";
import {readdir, readFile, stat} from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const publicDirectory = new URL("../public/", import.meta.url);
const expectedAssets = ["index.html", "manifest.json", "sw.js"];

test("runtime artifact contains only approved files and is below 50,000 bytes", async () => {
  const assets = (await readdir(publicDirectory)).sort();
  assert.deepEqual(assets, expectedAssets);
  const sizes = await Promise.all(assets.map(async asset => ({
    asset,
    bytes: (await stat(new URL(asset, publicDirectory))).size
  })));
  const total = sizes.reduce((sum, item) => sum + item.bytes, 0);
  assert.ok(total < 50_000, `Runtime is ${total} bytes: ${JSON.stringify(sizes)}`);
});

test("runtime has no application tracking or external request target", async () => {
  const source = (await Promise.all(expectedAssets.map(asset =>
    readFile(new URL(asset, publicDirectory), "utf8")
  ))).join("\n");
  assert.doesNotMatch(source, /analytics|telemetry|doubleclick|google-analytics/i);
  assert.doesNotMatch(source, /https?:\/\//i);
});

test("shell and service worker release identifiers match", async () => {
  const html = await readFile(new URL("index.html", publicDirectory), "utf8");
  const worker = await readFile(new URL("sw.js", publicDirectory), "utf8");
  const shellRelease = html.match(/data-release="([^"]+)"/)?.[1];
  const workerRelease = worker.match(/const RELEASE = "([^"]+)"/)?.[1];
  assert.ok(shellRelease);
  assert.equal(workerRelease, shellRelease);
});

test("workflows pin actions and Pages deployment stays manual and gated", async () => {
  const validate = await readFile(new URL(".github/workflows/validate.yml", root), "utf8");
  const pages = await readFile(new URL(".github/workflows/pages.yml", root), "utf8");
  for (const workflow of [validate, pages]) {
    for (const match of workflow.matchAll(/uses:\s+[^@\s]+@([^\s]+)/g)) {
      assert.match(match[1], /^[a-f0-9]{40}$/);
    }
    assert.doesNotMatch(workflow, /npm (?:ci|install|update)/);
  }
  assert.match(pages, /workflow_dispatch:/);
  assert.match(pages, /ENABLE_PAGES_DEPLOYMENT == 'true'/);
  assert.doesNotMatch(pages, /^\s+push:/m);
  assert.match(pages, /path: public/);
});

test("documentation preserves external release gates", async () => {
  const checklist = await readFile(new URL("docs/release-checklist.md", root), "utf8");
  const manual = await readFile(new URL("docs/manual-validation.md", root), "utf8");
  assert.match(checklist, /physical-device performance/i);
  assert.match(checklist, /hosted lifecycle evidence/i);
  assert.match(manual, /three to five players/i);
  assert.match(manual, /at least two older relatives/i);
  assert.match(manual, /screen reader/i);
});
