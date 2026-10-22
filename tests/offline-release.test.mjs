import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");

function createWorker(options = {}) {
  const handlers = {};
  const stores = new Map([
    ["unrelated-app-cache", new Map()],
    ["hve-tictactoe:/demo/:old", new Map()]
  ]);
  const fetched = [];
  const deleted = [];

  class TestRequest {
    constructor(input, init = {}) {
      this.url = String(input);
      this.cache = init.cache;
      this.credentials = init.credentials;
      this.method = init.method || "GET";
      this.mode = init.mode || "same-origin";
    }
  }

  const caches = {
    async open(name) {
      if (!stores.has(name)) {
        stores.set(name, new Map());
      }
      const store = stores.get(name);
      return {
        async put(url, response) {
          store.set(String(url), response);
        },
        async match(url) {
          return store.get(String(url));
        }
      };
    },
    async keys() {
      return [...stores.keys()];
    },
    async delete(name) {
      deleted.push(name);
      return stores.delete(name);
    }
  };

  const context = {
    Request: TestRequest,
    URL,
    caches,
    fetch: async request => {
      fetched.push(request);
      const failed = options.failUrl && request.url.endsWith(options.failUrl);
      return {
        ok: !failed,
        status: failed ? 503 : 200,
        body: `fresh:${request.url}`
      };
    },
    self: {
      registration: {scope: "https://example.test/demo/"},
      clients: {
        claimed: false,
        async claim() {
          this.claimed = true;
        }
      },
      addEventListener(name, handler) {
        handlers[name] = handler;
      }
    },
    console
  };
  vm.runInNewContext(source, context);
  return {context, handlers, stores, fetched, deleted};
}

async function dispatch(handler, event = {}) {
  let pending;
  handler({
    ...event,
    waitUntil(promise) {
      pending = promise;
    }
  });
  return pending;
}

test("install fetches every required asset with HTTP-cache revalidation", async () => {
  const worker = createWorker();
  await dispatch(worker.handlers.install);
  assert.equal(worker.fetched.length, 3);
  for (const request of worker.fetched) {
    assert.equal(request.cache, "reload");
    assert.equal(request.credentials, "same-origin");
  }
  const current = [...worker.stores.entries()]
    .find(([name]) => name.endsWith("2026-10-09.1"));
  assert.ok(current);
  assert.equal(current[1].size, 3);
});

test("install fails when any required asset fails", async () => {
  const worker = createWorker({failUrl: "manifest.json"});
  await assert.rejects(dispatch(worker.handlers.install), /Required asset failed/);
});

test("activation deletes only older app-owned caches and claims clients", async () => {
  const worker = createWorker();
  await dispatch(worker.handlers.install);
  await dispatch(worker.handlers.activate);
  assert.deepEqual(worker.deleted, ["hve-tictactoe:/demo/:old"]);
  assert.ok(worker.stores.has("unrelated-app-cache"));
  assert.equal(worker.context.self.clients.claimed, true);
});

test("fetch routing ignores non-GET, cross-origin, and out-of-scope requests", () => {
  const worker = createWorker();
  for (const request of [
    {method: "POST", url: "https://example.test/demo/", mode: "same-origin"},
    {method: "GET", url: "https://other.test/demo/", mode: "same-origin"},
    {method: "GET", url: "https://example.test/other/", mode: "same-origin"}
  ]) {
    let responded = false;
    worker.handlers.fetch({
      request,
      respondWith() {
        responded = true;
      }
    });
    assert.equal(responded, false);
  }
});

test("query-bearing app navigation routes to the canonical shell", async () => {
  const worker = createWorker();
  await dispatch(worker.handlers.install);
  let responsePromise;
  worker.handlers.fetch({
    request: {
      method: "GET",
      mode: "navigate",
      url: "https://example.test/demo/?shared=family"
    },
    respondWith(promise) {
      responsePromise = promise;
    }
  });
  const response = await responsePromise;
  assert.equal(response.body, "fresh:https://example.test/demo/index.html");
});
