const RELEASE = "2026-10-23.1";
const SCOPE_URL = new URL(self.registration.scope);
const CACHE_PREFIX = `hve-tictactoe:${SCOPE_URL.pathname}:`;
const CACHE_NAME = `${CACHE_PREFIX}${RELEASE}`;
const REQUIRED_PATHS = ["./", "./index.html", "./manifest.json"];
const REQUIRED_URLS = REQUIRED_PATHS.map(path => new URL(path, SCOPE_URL).href);
const SHELL_URL = new URL("./index.html", SCOPE_URL).href;
const RUNTIME_URLS = new Set(REQUIRED_URLS);

async function fetchFresh(url) {
  const request = new Request(url, {
    cache: "reload",
    credentials: "same-origin"
  });
  const response = await fetch(request);
  if (!response.ok) {
    throw new Error(`Required asset failed with ${response.status}: ${url}`);
  }
  return response;
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    for (const url of REQUIRED_URLS) {
      await cache.put(url, await fetchFresh(url));
    }
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== SCOPE_URL.origin || !url.pathname.startsWith(SCOPE_URL.pathname)) {
    return;
  }

  const isShellNavigation = request.mode === "navigate"
    && (url.pathname === SCOPE_URL.pathname || url.pathname === `${SCOPE_URL.pathname}index.html`);

  if (isShellNavigation) {
    event.respondWith(caches.open(CACHE_NAME).then(async cache =>
      cache.match(SHELL_URL) || fetch(request)
    ));
    return;
  }

  if (RUNTIME_URLS.has(url.href)) {
    event.respondWith(caches.open(CACHE_NAME).then(async cache =>
      cache.match(url.href) || fetch(request)
    ));
  }
});
